// supabase/functions/plaid-create-link-token/index.ts
//
// Returns a short-lived Plaid link_token that the frontend uses to
// initialize Plaid Link. Called once per "Connect account" flow.
//
// Deploy: supabase functions deploy plaid-create-link-token
// Secrets: supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=development PLAID_REDIRECT_URI=https://cashview-one.vercel.app

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE_URLS: Record<string, string> = {
  sandbox:     "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production:  "https://production.plaid.com",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Authenticate the caller ─────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Build link token request ────────────────────────────────────────
    // redirect_uri is required for OAuth institutions (Chase, etc.).
    // Set via: supabase secrets set PLAID_REDIRECT_URI=https://cashview-one.vercel.app
    // Must also be registered in Plaid Dashboard → API → Allowed redirect URIs.
    const redirectUri = Deno.env.get("PLAID_REDIRECT_URI");

    const body: Record<string, unknown> = {
      client_id:    Deno.env.get("PLAID_CLIENT_ID"),
      secret:       Deno.env.get("PLAID_SECRET"),
      client_name:  "CashView",
      user:         { client_user_id: user.id },
      products:     ["transactions"],
      country_codes: ["US"],
      language:     "en",
    };

    // OAuth banks (Chase, BofA, etc.) require redirect_uri in non-sandbox envs
    if (redirectUri && PLAID_ENV !== "sandbox") {
      body.redirect_uri = redirectUri;
    }

    // ── 3. Create link token ───────────────────────────────────────────────
    const plaidResponse = await fetch(`${PLAID_BASE_URLS[PLAID_ENV]}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const plaidData = await plaidResponse.json();

    if (!plaidResponse.ok || plaidData.error_code) {
      console.error("Plaid error:", plaidData);
      return new Response(
        JSON.stringify({ error: plaidData.error_message ?? "Plaid error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ link_token: plaidData.link_token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
