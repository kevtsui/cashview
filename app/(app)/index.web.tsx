// app/(app)/index.web.tsx — Overview screen, pure HTML/CSS.
// Uses real data from Plaid wherever available.
// Net worth chart and sparklines require historical snapshots — shown as
// coming-soon until we have multiple data points.

import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAccounts } from "@/lib/AccountsContext";
import { fetchTransactions, fetchSnapshots, categoryMeta, Transaction, NetWorthSnapshot } from "@/lib/api";
import { T } from "@/lib/tokens";
import Money from "@/components/shared/Money";
import Icon from "@/components/shared/Icon";
import SpendingDonut from "@/components/overview/SpendingDonut";
import NetWorthChart from "@/components/overview/NetWorthChart";
import InstMark from "@/components/shared/InstMark";
import type { Account } from "@/types/database";

const FONT = '"Noto Sans JP", system-ui, -apple-system, sans-serif';

const BILLS = [
  { id: "b1", label: "Mortgage",         amt: 3200,    due: "Jun 1",  auto: true  },
  { id: "b2", label: "Sapphire Reserve", amt: 3284.52, due: "Jun 14", auto: true  },
  { id: "b3", label: "PG&E electric",    amt: 186.44,  due: "Jun 18", auto: true  },
  { id: "b4", label: "Bright Horizons",  amt: 420,     due: "Jun 20", auto: false },
];

function institutionName(acct: Account): string {
  if (["investment", "brokerage"].includes(acct.type ?? "")) return "Morgan Stanley";
  return "Chase";
}

// ── Name normalization ────────────────────────────────────────────────────────
function normalizeName(tx: Transaction): string {
  const raw = tx.merchant_name ?? tx.name;
  return raw
    .replace(/\s+(PPD|WEB|CCD|TEL|ACH)\s+.*$/i, "")
    .replace(/\s+ID[:\s]+[\w\d\-]+/gi, "")
    .replace(/\s+PMT\s+#?[\d\-]+/gi, "")
    .replace(/\s+\*[\w\d]+$/i, "")
    .replace(/\s+REF[\s:#]+[\w\d]+/gi, "")
    .replace(/\s+\d{6,}$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Recurring spend analysis (12-month window) ────────────────────────────────
// A merchant is "recurring" if it appears with a consistent cadence across months.
// Returns merchants sorted by monthly-equivalent cost (highest first), plus
// the total estimated monthly recurring spend.
interface RecurringItem {
  id: string;
  label: string;
  avgAmt: number;           // average charge per occurrence
  monthlyEquiv: number;     // cost normalised to per-month
  cadence: string;          // weekly / monthly / bimonthly / quarterly
  isVariable: boolean;      // true if amount varies >25%
  occurrences: number;      // how many times seen in 12 months
}

function analyzeRecurringSpend(txs: Transaction[]): { items: RecurringItem[]; totalMonthly: number } {
  const debits = txs.filter((t) => t.amount >= 10);

  const byMerchant: Record<string, { label: string; txs: Transaction[] }> = {};
  for (const tx of debits) {
    const key = normalizeName(tx).toLowerCase();
    if (!key) continue;
    if (!byMerchant[key]) byMerchant[key] = { label: normalizeName(tx), txs: [] };
    byMerchant[key].txs.push(tx);
  }

  const items: RecurringItem[] = [];

  for (const { label, txs: group } of Object.values(byMerchant)) {
    // Need at least 2 occurrences AND the merchant must span at least 2 distinct months
    const distinctMonths = new Set(group.map((t) => t.date.slice(0, 7))).size;
    if (group.length < 2 || distinctMonths < 2) continue;

    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));

    // Average gap between consecutive charges
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1].date + "T12:00:00").getTime();
      const d2 = new Date(sorted[i].date + "T12:00:00").getTime();
      gaps.push((d2 - d1) / 86400_000);
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

    // Cadence classification
    let cadence: string;
    let monthlyMultiplier: number; // how many times per month
    if (avgGap <= 10)       { cadence = "weekly";     monthlyMultiplier = 4.3;  }
    else if (avgGap <= 45)  { cadence = "monthly";    monthlyMultiplier = 1;    }
    else if (avgGap <= 75)  { cadence = "bimonthly";  monthlyMultiplier = 0.5;  }
    else if (avgGap <= 105) { cadence = "quarterly";  monthlyMultiplier = 0.33; }
    else continue; // too infrequent / one-off

    // Gap regularity check — if gaps are wildly inconsistent it's not a cadence
    if (gaps.length > 1) {
      const gapStdDev = Math.sqrt(gaps.reduce((s, g) => s + (g - avgGap) ** 2, 0) / gaps.length);
      if (gapStdDev / avgGap > 0.6) continue; // >60% coefficient of variation = not regular
    }

    // Amount stats
    const amounts = sorted.map((t) => t.amount);
    const avgAmt = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const isVariable = Math.max(...amounts) / Math.min(...amounts) > 1.25;

    items.push({
      id: sorted[sorted.length - 1].id.toString(),
      label,
      avgAmt: Math.round(avgAmt * 100) / 100,
      monthlyEquiv: Math.round(avgAmt * monthlyMultiplier * 100) / 100,
      cadence,
      isVariable,
      occurrences: sorted.length,
    });
  }

  const sorted = items.sort((a, b) => b.monthlyEquiv - a.monthlyEquiv);
  const totalMonthly = Math.round(sorted.reduce((s, i) => s + i.monthlyEquiv, 0) * 100) / 100;
  return { items: sorted, totalMonthly };
}

// ── Recurring spend component ─────────────────────────────────────────────────
function RecurringSpend({ transactions, loading, limit = 6, onViewAll }: {
  transactions: Transaction[];
  loading: boolean;
  limit?: number;
  onViewAll?: () => void;
}) {
  if (loading) {
    return <div style={{ padding: "24px 18px", color: T.fgMuted, fontSize: 13, textAlign: "center" }}>Loading…</div>;
  }

  const { items, totalMonthly } = analyzeRecurringSpend(transactions);

  if (items.length === 0) {
    return (
      <div style={{ padding: "24px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Icon name="refresh" size={28} color={T.borderSubtle} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.fg, marginBottom: 4 }}>No patterns yet</div>
          <div style={{ fontSize: 12.5, color: T.fgMuted }}>Sync 12 months of transactions in the Spending tab.</div>
        </div>
      </div>
    );
  }

  const cadenceColors: Record<string, string> = {
    weekly: T.accent, monthly: T.fgMuted, bimonthly: T.invest, quarterly: T.gold,
  };

  return (
    <>
      {/* Total estimate header */}
      <div style={{ padding: "12px 18px", background: T.bgSunken, borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12.5, color: T.fgMuted, fontFamily: FONT }}>Est. monthly recurring</span>
        <Money value={-totalMonthly} size={15} weight={700} cents={false} />
      </div>

      {items.slice(0, limit).map((item, i) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
            <div style={{ fontSize: 11.5, marginTop: 1, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: cadenceColors[item.cadence] ?? T.fgMuted, fontWeight: 600 }}>{item.cadence}</span>
              <span style={{ color: T.fgSubtle }}>·</span>
              <span style={{ color: T.fgSubtle }}>{item.occurrences}× in 12mo</span>
              {item.isVariable && <><span style={{ color: T.fgSubtle }}>·</span><span style={{ color: T.fgSubtle }}>est.</span></>}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <Money value={-item.avgAmt} size={13} weight={600} cents={false} />
            {item.cadence !== "monthly" && (
              <div style={{ fontSize: 11, color: T.fgSubtle, marginTop: 1 }}>
                ~<Money value={-item.monthlyEquiv} size={11} weight={500} cents={false} />/mo
              </div>
            )}
          </div>
        </div>
      ))}

      {items.length > limit && onViewAll && (
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${T.borderSubtle}`, textAlign: "center" }}>
          <button onClick={onViewAll} style={{ background: "none", border: "none", color: T.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
            View all {items.length} recurring charges
          </button>
        </div>
      )}
    </>
  );
}

// ── KPI card (no sparkline — historical data not available yet) ───────────────
interface KpiProps {
  label: string;
  value: number;
  valueTone?: string;
}
function KpiCard({ label, value, valueTone }: KpiProps) {
  return (
    <div style={{
      background: T.bgRaised,
      border: `1px solid ${T.border}`,
      borderRadius: T.radiusLg,
      padding: 18,
      minWidth: 168,
      flex: 1,
      display: "flex",
      flexDirection: "column",
      fontFamily: FONT,
    }}>
      <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.fgMuted }}>{label}</p>
      <Money value={value} size={26} cents={false} weight={600} color={valueTone} />
    </div>
  );
}

function CardHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderBottom: `1px solid ${T.borderSubtle}` }}>
      <div style={{ fontWeight: 600, fontSize: 14.5, color: T.fg, fontFamily: FONT }}>{title}</div>
      {action}
    </div>
  );
}

// ── Overview screen ───────────────────────────────────────────────────────────
export default function OverviewScreen() {
  const { accounts } = useAccounts();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [showAllBills, setShowAllBills] = useState(false);

  useEffect(() => {
    // Fetch 365 days (12 months) for reliable recurring spend analysis
    fetchTransactions(365)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setTxLoading(false));
    fetchSnapshots(365).then(setSnapshots).catch(console.error);
  }, []);

  // ── Live KPI totals from Plaid ──────────────────────────────────────────────
  const cash = accounts
    .filter((a) => ["depository", "checking", "savings"].includes(a.type ?? ""))
    .reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const invest = accounts
    .filter((a) => ["investment", "brokerage"].includes(a.type ?? ""))
    .reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const debt = accounts
    .filter((a) => a.type === "credit")
    .reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const netWorth = cash + invest - Math.abs(debt);

  const displayAccounts = accounts
    .filter((a) => a.type !== "credit")
    .slice(0, 5);

  // ── Real spending — last 30 days (avoids empty-on-1st-of-month problem) ─────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const debitTx = transactions.filter((t) => t.amount > 0 && t.date >= thirtyDaysAgo);
  const totalSpent = debitTx.reduce((s, t) => s + t.amount, 0);
  const catMap: Record<string, { id: string; label: string; color: string; spent: number; budget: number }> = {};
  for (const tx of debitTx) {
    const key = tx.personal_finance_category ?? "OTHER";
    const meta = categoryMeta(key);
    if (!catMap[key]) catMap[key] = { id: key, label: meta.label, color: meta.color, spent: 0, budget: 0 };
    catMap[key].spent += tx.amount;
  }
  const realCategories = Object.values(catMap).sort((a, b) => b.spent - a.spent);
  const hasTransactions = realCategories.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT }}>

      {/* ── KPI strip — real balances from Plaid ─────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <KpiCard label="Total cash"  value={cash}    />
        <KpiCard label="Net worth"   value={netWorth} />
        <KpiCard label="Investments" value={invest}   valueTone={invest > 0 ? T.invest : undefined} />
        <KpiCard label="Card debt"   value={debt}     />
      </div>

      {accounts.length === 0 && (
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.fg, marginBottom: 8, fontFamily: FONT }}>Connect your first account</div>
          <div style={{ fontSize: 13.5, color: T.fgMuted, fontFamily: FONT }}>Click <strong>+ Add account</strong> above to link Chase, Morgan Stanley, or any other bank.</div>
        </div>
      )}

      {/* ── Chart row ──────────────────────────────────────────────────────── */}
      <div style={{ display: accounts.length === 0 ? "none" : "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, alignItems: "stretch" }}>

        {/* Net worth — real chart when snapshots exist, breakdown otherwise */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: snapshots.length > 1 ? 6 : 20, flexShrink: 0 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: T.fg }}>Net worth</div>
              <div style={{ fontSize: 12.5, color: T.fgMuted, marginTop: 2 }}>
                {snapshots.length > 1 ? `Last ${snapshots.length} days` : "Current snapshot"}
              </div>
            </div>
          </div>

          {snapshots.length > 1 ? (
            // Real chart from accumulated snapshots
            <div style={{ flex: 1, minHeight: 180 }}>
              <NetWorthChart
                series={snapshots.map((s) => ({
                  month: new Date(s.captured_at + "T12:00:00").toLocaleString("en-US", { month: "short", day: "numeric" }),
                  value: s.net_worth,
                }))}
              />
            </div>
          ) : (
            // Not enough data yet — show current breakdown
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 180, padding: "0 24px 16px" }}>
              <Money value={netWorth} size={42} weight={700} cents={false} />
              <div style={{ display: "flex", gap: 20, fontSize: 13, flexWrap: "wrap", justifyContent: "center" }}>
                <span style={{ color: T.fgMuted }}>Cash <strong style={{ color: T.fg }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cash)}
                </strong></span>
                <span style={{ color: T.fgMuted }}>Invest <strong style={{ color: T.invest }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(invest)}
                </strong></span>
                <span style={{ color: T.fgMuted }}>Debt <strong style={{ color: T.negative }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(debt))}
                </strong></span>
              </div>
              <div style={{ fontSize: 11.5, color: T.fgSubtle, textAlign: "center" }}>
                Trend chart builds automatically — each Refresh captures today's snapshot.
              </div>
            </div>
          )}
        </div>

        {/* Spending donut — real transactions or prompt to sync */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.fg, marginBottom: 4 }}>Spending — last 30 days</div>
          <div style={{ fontSize: 12.5, color: T.fgMuted, marginBottom: 16 }}>
            {hasTransactions ? `${debitTx.length} transactions` : "From linked accounts"}
          </div>
          {txLoading ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T.fgMuted, fontSize: 13 }}>Loading…</div>
          ) : hasTransactions ? (
            <SpendingDonut categories={realCategories} total={totalSpent} />
          ) : (
            <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Icon name="pie-chart" size={32} color={T.borderSubtle} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.fg, marginBottom: 4 }}>No transactions yet</div>
                <div style={{ fontSize: 13, color: T.fgMuted }}>Go to <strong>Spending</strong> and tap Sync to pull your transactions.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Lower row ──────────────────────────────────────────────────────── */}
      <div style={{ display: accounts.length === 0 ? "none" : "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>

        {/* Accounts */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
          <CardHead
            title="Accounts"
            action={
              <button onClick={() => router.push("/accounts" as any)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: 0 }}>
                View all <Icon name="arrow" size={13} color={T.accent} />
              </button>
            }
          />
          {displayAccounts.length === 0 ? (
            <div style={{ padding: "32px 18px", color: T.fgMuted, fontSize: 13, textAlign: "center" }}>No accounts yet. Add one above.</div>
          ) : (
            displayAccounts.map((acct, i) => (
              <div key={acct.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
                <InstMark inst={institutionName(acct)} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: T.fg }}>{acct.name}</div>
                  <div style={{ fontSize: 12, color: T.fgMuted, marginTop: 1 }}>
                    {institutionName(acct)}{(acct as any).mask ? ` ····${(acct as any).mask}` : ""}
                  </div>
                </div>
                <Money value={acct.current_balance ?? 0} size={15} weight={600} cents={false} />
              </div>
            ))
          )}
        </div>

        {/* Recurring spend — 12-month pattern analysis */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
          <CardHead
            title="Recurring spend"
            action={
              <button onClick={() => setShowAllBills(true)} style={{ background: "none", border: "none", color: T.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
                View all <Icon name="arrow" size={13} color={T.accent} />
              </button>
            }
          />
          <RecurringSpend transactions={transactions} loading={txLoading} limit={6} onViewAll={() => setShowAllBills(true)} />
        </div>

        {/* All recurring spend modal */}
        {showAllBills && (
          <div onClick={() => setShowAllBills(false)} style={{ position: "fixed", inset: 0, background: "rgba(22,17,14,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, width: 520, maxWidth: "calc(100vw - 32px)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(22,17,14,.14)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.borderSubtle}` }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.fg, fontFamily: FONT }}>All recurring charges</div>
                  <div style={{ fontSize: 12.5, color: T.fgMuted, marginTop: 2, fontFamily: FONT }}>Based on 12 months of transactions</div>
                </div>
                <button onClick={() => setShowAllBills(false)} style={{ background: "none", border: "none", fontSize: 22, color: T.fgMuted, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                <RecurringSpend transactions={transactions} loading={txLoading} limit={100} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
