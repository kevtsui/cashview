// supabase/functions/plaid-exchange-token/index.ts
//
// Receives the public_token from Plaid Link, exchanges it for a permanent
// access_token, then stores it (and institution metadata) in plaid_items.
// Immediately triggers a balance sync for the new item.
//
// Deploy: supabase functions deploy plaid-exchange-token

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

const plaidBase = () => PLAID_BASE_URLS[PLAID_ENV];

async function plaidPost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${plaidBase()}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("PLAID_CLIENT_ID"),
      secret: Deno.env.get("PLAID_SECRET"),
      ...body,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error_code) throw new Error(data.error_message ?? `Plaid error: ${endpoint}`);
  return data;
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

    // ── 2. Parse request body ───────────────────────────────────────────────
    const { public_token, institution_id, institution_name } = await req.json();
    if (!public_token) {
      return new Response(JSON.stringify({ error: "public_token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Get caller's household_id ────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("household_id")
      .eq("id", user.id)
      .single();

    if (!profile?.household_id) {
      return new Response(
        JSON.stringify({ error: "User has no household. Set one up first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Exchange public_token → access_token (server-side only) ──────────
    const exchangeData = await plaidPost("/item/public_token/exchange", { public_token });
    const { access_token, item_id } = exchangeData;

    // ── 5. Store item in DB using service role (bypasses RLS) ───────────────
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: item, error: itemError } = await adminClient
      .from("plaid_items")
      .upsert(
        {
          household_id: profile.household_id,
          access_token,
          item_id,
          institution_id: institution_id ?? null,
          institution_name: institution_name ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "item_id" }
      )
      .select("id")
      .single();

    if (itemError) {
      console.error("DB error storing plaid item:", itemError);
      throw new Error("Failed to store Plaid item");
    }

    // ── 6. Fetch initial balances for the new item ──────────────────────────
    const balanceData = await plaidPost("/accounts/balance/get", { access_token });

    const accountUpserts = (balanceData.accounts ?? []).map((acct: Record<string, unknown>) => {
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
    });

    if (accountUpserts.length > 0) {
      const { error: acctError } = await adminClient
        .from("accounts")
        .upsert(accountUpserts, { onConflict: "plaid_account_id" });

      if (acctError) {
        console.error("DB error storing accounts:", acctError);
        // Non-fatal: item is saved, balances will sync on next refresh
      }
    }

    return new Response(
      JSON.stringify({ success: true, item_id, account_count: accountUpserts.length }),
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
