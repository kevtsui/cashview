// lib/api.ts
// Typed wrappers around the Supabase Edge Functions and DB queries.
// All Plaid API calls are proxied through edge functions — the frontend
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

// ── Link token ──────────────────────────────────────────────────────────────
export async function createLinkToken(): Promise<{ link_token: string }> {
  return callFunction("plaid-create-link-token");
}

// ── Exchange public token ───────────────────────────────────────────────────
export async function exchangeToken(params: {
  public_token: string;
  institution_id?: string;
  institution_name?: string;
}): Promise<{ success: boolean; item_id: string; account_count: number }> {
  return callFunction("plaid-exchange-token", params);
}

// ── Sync balances ───────────────────────────────────────────────────────────
export async function syncBalances(): Promise<{
  accounts: Account[];
  synced_count: number;
  errors?: string[];
}> {
  return callFunction("plaid-sync-balances");
}

// ── Sync transactions (last 90 days) ───────────────────────────────────────
export async function syncTransactions(): Promise<{
  synced: number;
  transactions: Transaction[];
}> {
  return callFunction("plaid-sync-transactions");
}

// ── Fetch accounts from DB ──────────────────────────────────────────────────
export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("type")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// ── Fetch transactions from DB ──────────────────────────────────────────────
export async function fetchTransactions(days = 30): Promise<Transaction[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", since)
    .eq("pending", false)
    .order("date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

// ── Goals CRUD ──────────────────────────────────────────────────────────────
export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(goal: Omit<Goal, "id" | "created_at" | "updated_at" | "household_id">): Promise<Goal> {
  // household_id is set server-side via RLS — the insert uses the auth context
  const { data, error } = await supabase
    .from("goals")
    .insert(goal)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, updates: Partial<Omit<Goal, "id" | "household_id">>): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  household_id: string;
  plaid_account_id: string;
  plaid_transaction_id: string;
  merchant_name: string | null;
  name: string;
  personal_finance_category: string | null;
  category_primary: string | null;
  user_category: string | null;
  user_category_label: string | null;
  confirmed: boolean;
  amount: number;  // positive = debit (money out), negative = credit (money in)
  date: string;
  pending: boolean;
  currency_code: string;
  created_at: string;
}

export interface TransactionRule {
  id: string;
  household_id: string;
  merchant_pattern: string;
  category_key: string;
  category_label: string;
  color: string;
  exclude_recurring?: boolean;
  force_recurring?: boolean;
  forced_cadence?: string | null;
  forced_amount?: number | null;
  created_at: string;
}

export interface Goal {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Net worth snapshots ─────────────────────────────────────────────────────
export interface NetWorthSnapshot {
  id: string;
  household_id: string;
  cash: number;
  invest: number;
  debt: number;
  net_worth: number;
  captured_at: string;
}

export async function fetchSnapshots(days = 365): Promise<NetWorthSnapshot[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("net_worth_snapshots")
    .select("*")
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── Transaction rules (user-defined category mappings) ──────────────────────
export async function fetchTransactionRules(): Promise<TransactionRule[]> {
  const { data, error } = await supabase.from("transaction_rules").select("*");
  if (error) throw error;
  return data ?? [];
}

// Normalize a merchant name to a pattern key (same logic as the frontend normalizeName)
export function merchantPattern(tx: Transaction): string {
  const raw = tx.merchant_name ?? tx.name;
  return raw
    .replace(/\s+(PPD|WEB|CCD|TEL|ACH)\s+.*$/i, "")
    .replace(/\s+ID[:\s#]+[\w\d\-]+/gi, "")
    .replace(/\s+REF[:\s#]+[\w\d]+/gi, "")
    .replace(/\s+#[\d\-]+/g, "")
    .replace(/\s+PMT\s+#?[\d\-]+/gi, "")
    .replace(/\s+(TO|FROM)\s+(CHK|SAV|CHECKING|SAVINGS|ACCT|ACCOUNT|DDA)\s*[\d\*x]+/gi, "")
    .replace(/\s+(TO|FROM)\s+[\*x\d]{4,}/gi, "")
    .replace(/\s+\d{4,}/g, "")
    .replace(/\s+\*[\w\d]+$/i, "")
    .replace(/(zelle\s+payment\s+to)\s+.+$/i, "Zelle payment")
    .replace(/(venmo\s+payment\s+to)\s+.+$/i, "Venmo payment")
    .replace(/\s{2,}/g, " ")
    .trim()
    .toLowerCase();
}

// Categorize a single transaction and apply rule to all matching merchants
export async function categorizeTransaction(tx: Transaction, categoryKey: string, categoryLabel: string, color: string): Promise<void> {
  const pattern = merchantPattern(tx);

  // 1. Update this transaction
  await supabase.from("transactions").update({
    user_category: categoryKey,
    user_category_label: categoryLabel,
    confirmed: true,
  }).eq("id", tx.id);

  // 2. Upsert the rule (must include household_id — it's NOT NULL)
  const household_id = await getHouseholdId();
  if (household_id) {
    await supabase.from("transaction_rules").upsert({
      household_id,
      merchant_pattern: pattern,
      category_key: categoryKey,
      category_label: categoryLabel,
      color,
    }, { onConflict: "household_id,merchant_pattern" });
  }

  // 3. Apply rule to all unconfirmed transactions with the same merchant pattern
  // We do this by fetching matching transactions and updating them
  const { data: matching } = await supabase
    .from("transactions")
    .select("id, merchant_name, name")
    .eq("confirmed", false);

  if (matching && matching.length > 0) {
    const matchingIds = matching
      .filter((t: any) => {
        const p = merchantPattern(t as Transaction);
        return p === pattern;
      })
      .map((t: any) => t.id);

    if (matchingIds.length > 0) {
      await supabase.from("transactions").update({
        user_category: categoryKey,
        user_category_label: categoryLabel,
        confirmed: true,
      }).in("id", matchingIds);
    }
  }
}

// Confirm a transaction without changing category
export async function confirmTransaction(txId: string): Promise<void> {
  await supabase.from("transactions").update({ confirmed: true }).eq("id", txId);
}

const T_BG_MUTED = "#BDB5AC";

async function getHouseholdId(): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("household_id").single();
  return (data as any)?.household_id ?? null;
}

// Exclude a merchant from recurring spend analysis
export async function excludeRecurring(merchantPattern: string): Promise<void> {
  const household_id = await getHouseholdId();
  if (!household_id) throw new Error("No household found");
  const { error } = await supabase.from("transaction_rules").upsert({
    household_id,
    merchant_pattern: merchantPattern,
    category_key: "OTHER",
    category_label: "Other",
    color: T_BG_MUTED,
    exclude_recurring: true,
    force_recurring: false,
  }, { onConflict: "household_id,merchant_pattern" });
  if (error) throw error;
}

// Force-include a merchant in recurring spend analysis with explicit cadence + amount
export async function includeRecurring(params: {
  merchantPattern: string;
  label: string;
  cadence: string;
  amount: number;
}): Promise<void> {
  const household_id = await getHouseholdId();
  if (!household_id) throw new Error("No household found");
  const { error } = await supabase.from("transaction_rules").upsert({
    household_id,
    merchant_pattern: params.merchantPattern,
    category_key: "OTHER",
    category_label: "Other",
    color: "#7A716A",
    exclude_recurring: false,
    force_recurring: true,
    forced_cadence: params.cadence,
    forced_amount: params.amount,
  }, { onConflict: "household_id,merchant_pattern" });
  if (error) throw error;
}

// ── Category helpers ────────────────────────────────────────────────────────
export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  FOOD_AND_DRINK:            { label: "Food & Drink",   color: "#E5634A" },
  GENERAL_MERCHANDISE:       { label: "Shopping",       color: "#C84F36" },
  TRANSPORTATION:            { label: "Transport",      color: "#D99A22" },
  ENTERTAINMENT:             { label: "Entertainment",  color: "#ED7551" },
  PERSONAL_CARE:             { label: "Personal Care",  color: "#8A5A7A" },
  MEDICAL:                   { label: "Health",         color: "#1F8A5B" },
  HOME_IMPROVEMENT:          { label: "Home Improv.",   color: "#5C534D" },
  UTILITIES:                 { label: "Utilities",      color: "#7A716A" },
  TRAVEL:                    { label: "Travel",         color: "#3C8C7E" },
  RENT_AND_UTILITIES:        { label: "Housing",        color: "#5C534D" },
  LOAN_PAYMENTS:             { label: "Loan",           color: "#9B9289" },
  INCOME:                    { label: "Income",         color: "#1F8A5B" },
  TRANSFER_IN:               { label: "Transfer In",   color: "#3C8C7E" },
  TRANSFER_OUT:              { label: "Transfer Out",  color: "#7A716A" },
  OTHER:                     { label: "Other",          color: "#BDB5AC" },
};

export function categoryMeta(key: string | null): { label: string; color: string } {
  return CATEGORY_META[key ?? "OTHER"] ?? CATEGORY_META.OTHER;
}
