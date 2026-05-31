// lib/api.ts
// Typed wrappers around the Supabase Edge Functions.
// All Plaid API calls are proxied through these functions — the frontend
// never talks to Plaid directly or holds any Plaid credentials.

import { supabase } from "./supabase";
import type { Account } from "@/types/database";

async function callFunction<T>(
  name: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) throw error;
  if (!data) throw new Error(`No data returned from ${name}`);
  return data;
}

// ── Link token (step 1 of Plaid Link flow) ─────────────────────────────────
export async function createLinkToken(): Promise<{ link_token: string }> {
  return callFunction("plaid-create-link-token");
}

// ── Exchange public token (step 2: after user completes Plaid Link) ─────────
export async function exchangeToken(params: {
  public_token: string;
  institution_id?: string;
  institution_name?: string;
}): Promise<{ success: boolean; item_id: string; account_count: number }> {
  return callFunction("plaid-exchange-token", params);
}

// ── Sync balances (manual refresh) ─────────────────────────────────────────
export async function syncBalances(): Promise<{
  accounts: Account[];
  synced_count: number;
  errors?: string[];
}> {
  return callFunction("plaid-sync-balances");
}

// ── Fetch accounts from DB (no Plaid call — returns cached balances) ─────────
export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("type")
    .order("name");

  if (error) throw error;
  return data ?? [];
}
