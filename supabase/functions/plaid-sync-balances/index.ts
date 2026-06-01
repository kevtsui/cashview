// supabase/functions/plaid-sync-balances/index.ts
//
// Re-fetches current balances for every Plaid item linked to the caller's
// household, updates the accounts table, and returns the fresh data.
// Called by the dashboard's manual refresh button.
//
// Deploy: supabase functions deploy plaid-sync-balances

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

async function plaidPost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${PLAID_BASE_URLS[PLAID_ENV]}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("PLAID_CLIENT_ID"),
      secret: Deno.env.get("PLAID_SECRET"),
      ...body,
    }),
  });
  const data = await res.json();
  // Return error info without throwing so we can report per-item failures
  return { data, ok: res.ok && !data.error_code };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Auth ─────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Get household ────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (!profile?.household_id) {
      return new Response(JSON.stringify({ error: "No household found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Fetch all plaid items (with access_token) via service role ────────
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: items, error: itemsError } = await adminClient
      .from("plaid_items")
      .select("id, access_token, institution_name")
      .eq("household_id", profile.household_id);

    if (itemsError || !items) {
      throw new Error("Failed to fetch Plaid items");
    }

    if (items.length === 0) {
      return new Response(JSON.stringify({ accounts: [], synced_count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. Fetch balances for each item (in parallel) ───────────────────────
    const syncResults = await Promise.allSettled(
      items.map(async (item) => {
        const { data: balanceData, ok } = await plaidPost("/accounts/balance/get", {
          access_token: item.access_token,
        });

        if (!ok) {
          console.error(`Balance fetch failed for item ${item.id}:`, balanceData.error_message);
          return { itemId: item.id, accounts: [], error: balanceData.error_message };
        }

        const accountUpserts = (balanceData.accounts ?? []).map(
          (acct: Record<string, unknown>) => {
            const balances = acct.balances as Record<string, unknown>;
            return {
              household_id: profile.household_id,
              plaid_item_id: item.id,
              plaid_account_id: acct.account_id as string,
              mask: (acct.mask as string | null) ?? null,
              name: acct.name as string,
              official_name: (acct.official_name as string | null) ?? null,
              type: acct.type as string,
              subtype: (acct.subtype as string | null) ?? null,
              current_balance: (balances?.current as number | null) ?? null,
              available_balance: (balances?.available as number | null) ?? null,
              currency_code: (balances?.iso_currency_code as string | null) ?? "USD",
              last_updated: new Date().toISOString(),
            };
          }
        );

        if (accountUpserts.length > 0) {
          const { error: upsertError } = await adminClient
            .from("accounts")
            .upsert(accountUpserts, { onConflict: "plaid_account_id" });

          if (upsertError) {
            console.error(`DB upsert failed for item ${item.id}:`, upsertError);
          }
        }

        return { itemId: item.id, accounts: accountUpserts, error: null };
      })
    );

    // ── 5. Return fresh accounts from DB ────────────────────────────────────
    const { data: freshAccounts } = await adminClient
      .from("accounts")
      .select("*")
      .eq("household_id", profile.household_id)
      .order("type")
      .order("name");

    // ── 6. Write a net-worth snapshot (one per day, upsert) ──────────────────
    if (freshAccounts && freshAccounts.length > 0) {
      const sum = (types: string[]) =>
        freshAccounts.filter((a: Record<string, unknown>) => types.includes(a.type as string))
          .reduce((s: number, a: Record<string, unknown>) => s + ((a.current_balance as number) ?? 0), 0);

      const cash   = sum(["depository", "checking", "savings"]);
      const invest = sum(["investment", "brokerage"]);
      const debt   = Math.abs(sum(["credit"]));

      await adminClient.from("net_worth_snapshots").upsert({
        household_id: profile.household_id,
        cash,
        invest,
        debt,
        net_worth: cash + invest - debt,
        captured_at: new Date().toISOString().slice(0, 10),
      }, { onConflict: "household_id,captured_at" });
    }

    const errors = syncResults
      .filter((r) => r.status === "fulfilled" && r.value.error)
      .map((r) => (r as PromiseFulfilledResult<{ error: string }>).value.error);

    return new Response(
      JSON.stringify({
        accounts: freshAccounts ?? [],
        synced_count: items.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
