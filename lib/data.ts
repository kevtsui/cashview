// lib/data.ts — Household data model types + placeholder data.
// Real balances come from Plaid via Supabase. Everything else (net-worth
// series, spending categories, bills, goals) uses these placeholders until
// future PRs add transaction sync.

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface MockAccount {
  id: string;
  inst: string;
  name: string;
  mask: string;
  type: string;
  group: "cash" | "invest" | "debt";
  balance: number;
  available?: number;
  owner: string;
  apy?: number;
  apr?: number;
  due?: string;
  dayChange?: number;
  limit?: number;
}

export interface SeriesPoint {
  month: string;
  value: number;
}

export interface Category {
  id: string;
  label: string;
  spent: number;
  budget: number;
  color: string;
}

export interface SpendPoint {
  month: string;
  value: number;
}

export interface Transaction {
  id: number;
  merchant: string;
  cat: string;
  amt: number;
  acct: string;
  who: string;
  date: string;
  logo: string;
  income?: boolean;
}

export interface Goal {
  id: string;
  label: string;
  saved: number;
  target: number;
  color: string;
  icon: string;
}

export interface Bill {
  id: string;
  label: string;
  amt: number;
  due: string;
  acct: string;
  auto: boolean;
  inDays: number;
}

export const MEMBERS: Member[] = [
  { id: "k", name: "Kevin", initials: "K", color: "#E5634A" },
  { id: "f", name: "Flora", initials: "F", color: "#3C8C7E" },
];

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

export const NET_WORTH_SERIES: SeriesPoint[] = [
  231, 234, 233, 239, 244, 241, 248, 252, 255, 259, 263, 268,
].map((v, i) => ({ month: MONTHS[i], value: v * 1000 }));

export const CASH_SERIES: SeriesPoint[] = [
  71, 73, 70, 74, 78, 76, 81, 79, 80, 83, 84, 84.87,
].map((v, i) => ({ month: MONTHS[i], value: v * 1000 }));

export const CATEGORIES: Category[] = [
  { id: "housing",   label: "Housing",       spent: 3200, budget: 3200, color: "#5C534D" },
  { id: "grocery",   label: "Groceries",     spent: 842,  budget: 1000, color: "#3C8C7E" },
  { id: "dining",    label: "Dining out",    spent: 611,  budget: 500,  color: "#E5634A" },
  { id: "transport", label: "Transport",     spent: 388,  budget: 450,  color: "#D99A22" },
  { id: "kids",      label: "Kids",          spent: 520,  budget: 600,  color: "#8A5A7A" },
  { id: "utilities", label: "Utilities",     spent: 284,  budget: 320,  color: "#7A716A" },
  { id: "shopping",  label: "Shopping",      spent: 476,  budget: 400,  color: "#C84F36" },
  { id: "health",    label: "Health",        spent: 198,  budget: 300,  color: "#1F8A5B" },
  { id: "fun",       label: "Entertainment", spent: 240,  budget: 250,  color: "#ED7551" },
];

export const SPEND_TREND: SpendPoint[] = [
  5980, 6240, 5710, 6510, 7020, 6180, 6890, 6420, 5990, 6730, 7110, 6759,
].map((v, i) => ({ month: MONTHS[i], value: v }));

export const GOALS: Goal[] = [
  { id: "emerg", label: "Emergency fund",    saved: 40000,  target: 50000,  color: "#1F8A5B", icon: "shield" },
  { id: "vac",   label: "Japan trip",        saved: 6200,   target: 12000,  color: "#E5634A", icon: "plane" },
  { id: "house", label: "Home down payment", saved: 118000, target: 200000, color: "#3C8C7E", icon: "home" },
];

export const BILLS: Bill[] = [
  { id: "b1", label: "Mortgage",         amt: 3200,    due: "Jun 1",  acct: "chk2", auto: true,  inDays: 1  },
  { id: "b2", label: "Sapphire Reserve", amt: 3284.52, due: "Jun 14", acct: "chk1", auto: true,  inDays: 14 },
  { id: "b3", label: "PG&E electric",    amt: 186.44,  due: "Jun 18", acct: "chk2", auto: true,  inDays: 18 },
  { id: "b4", label: "Bright Horizons",  amt: 420,     due: "Jun 20", acct: "chk2", auto: false, inDays: 20 },
];

export const ALLOC = [
  { label: "US equities",  value: 168000, color: "#3C8C7E" },
  { label: "Intl equities", value: 62000, color: "#E5634A" },
  { label: "Bonds",         value: 34000, color: "#D99A22" },
  { label: "Cash & other",  value: 16631, color: "#7A716A" },
];
