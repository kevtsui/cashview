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
  amount: number;  // positive = debit (money out), negative = credit (money in)
  date: string;
  pending: boolean;
  currency_code: string;
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
