// supabase/functions/plaid-sync-transactions/index.ts
//
// Fetches the last 90 days of transactions for every Plaid item in the
// household and upserts them into the transactions table.
//
// Deploy: supabase functions deploy plaid-sync-transactions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE: Record<string, string> = {
  sandbox:     "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production:  "https://production.plaid.com",
};

async function plaidPost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${PLAID_BASE[PLAID_ENV]}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("PLAID_CLIENT_ID"),
      secret:    Deno.env.get("PLAID_SECRET"),
      ...body,
    }),
  });
  const data = await res.json();
  return { data, ok: res.ok && !data.error_code };
}

// Maps Plaid's personal_finance_category to a display label + color
const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  FOOD_AND_DRINK:              { label: "Food & Drink",     color: "#E5634A" },
  GENERAL_MERCHANDISE:         { label: "Shopping",         color: "#C84F36" },
  TRANSPORTATION:              { label: "Transport",        color: "#D99A22" },
  ENTERTAINMENT:               { label: "Entertainment",    color: "#ED7551" },
  PERSONAL_CARE:               { label: "Personal Care",   color: "#8A5A7A" },
  MEDICAL:                     { label: "Health",           color: "#1F8A5B" },
  HOME_IMPROVEMENT:            { label: "Home",             color: "#5C534D" },
  UTILITIES:                   { label: "Utilities",        color: "#7A716A" },
  TRAVEL:                      { label: "Travel",           color: "#3C8C7E" },
  LOAN_PAYMENTS:               { label: "Loan",             color: "#9B9289" },
  INCOME:                      { label: "Income",           color: "#1F8A5B" },
  TRANSFER_IN:                 { label: "Transfer In",      color: "#3C8C7E" },
  TRANSFER_OUT:                { label: "Transfer Out",     color: "#7A716A" },
  GOVERNMENT_AND_NON_PROFIT:   { label: "Government",      color: "#9B9289" },
  RENT_AND_UTILITIES:          { label: "Housing",          color: "#5C534D" },
  OTHER:                       { label: "Other",            color: "#BDB5AC" },
};

function categorize(tx: Record<string, unknown>): { primary: string; label: string; color: string } {
  const pfc = (tx.personal_finance_category as Record<string, string> | null)?.primary ?? "OTHER";
  const mapped = CATEGORY_MAP[pfc] ?? CATEGORY_MAP.OTHER;
  return { primary: pfc, ...mapped };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get household ────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles").select("household_id").eq("id", user.id).single();
    if (!profile?.household_id) {
      return new Response(JSON.stringify({ error: "No household" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch all Plaid items ────────────────────────────────────────────────
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: items } = await adminClient
      .from("plaid_items").select("id, access_token").eq("household_id", profile.household_id);
    if (!items?.length) {
      return new Response(JSON.stringify({ synced: 0, transactions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Date range: last 365 days (12 months for recurring analysis) ─────────
    const end   = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);

    let totalSynced = 0;

    await Promise.all(items.map(async (item) => {
      // ── Paginate through ALL transactions (Plaid caps at 500 per request) ──
      let offset = 0;
      let totalAvailable = Infinity;
      const allTxRows: Record<string, unknown>[] = [];

      while (offset < totalAvailable) {
        const { data: txData, ok } = await plaidPost("/transactions/get", {
          access_token: item.access_token,
          start_date:   start,
          end_date:     end,
          options: { count: 500, offset, include_personal_finance_category: true },
        });

        if (!ok) {
          console.error(`Transactions fetch failed for item ${item.id}:`, txData.error_message);
          break;
        }

        totalAvailable = txData.total_transactions ?? 0;
        const batch = txData.transactions ?? [];
        if (batch.length === 0) break;

        for (const tx of batch) {
          const { primary, label } = categorize(tx as Record<string, unknown>);
          allTxRows.push({
            household_id:              profile.household_id,
            plaid_account_id:          (tx as Record<string, unknown>).account_id as string,
            plaid_transaction_id:      (tx as Record<string, unknown>).transaction_id as string,
            merchant_name:             ((tx as Record<string, unknown>).merchant_name as string | null) ?? null,
            name:                      (tx as Record<string, unknown>).name as string,
            personal_finance_category: primary,
            category_primary:          label,
            amount:                    (tx as Record<string, unknown>).amount as number,
            date:                      (tx as Record<string, unknown>).date as string,
            pending:                   (tx as Record<string, unknown>).pending as boolean,
            currency_code:             ((tx as Record<string, unknown>).iso_currency_code as string | null) ?? "USD",
          });
        }

        offset += batch.length;
        console.log(`Item ${item.id}: fetched ${offset}/${totalAvailable} transactions`);
      }

      if (allTxRows.length > 0) {
        // Upsert in chunks of 500 to avoid payload limits
        for (let i = 0; i < allTxRows.length; i += 500) {
          const chunk = allTxRows.slice(i, i + 500);
          const { error } = await adminClient
            .from("transactions")
            .upsert(chunk, { onConflict: "plaid_transaction_id" });
          if (error) console.error("Upsert error:", error);
          else totalSynced += chunk.length;
        }
      }
    }));

    // ── Return fresh transactions ────────────────────────────────────────────
    const { data: freshTx } = await adminClient
      .from("transactions")
      .select("*")
      .eq("household_id", profile.household_id)
      .eq("pending", false)
      .gte("date", start)
      .order("date", { ascending: false })
      .limit(500);

    return new Response(
      JSON.stringify({ synced: totalSynced, transactions: freshTx ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
