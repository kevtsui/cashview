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
// ACH/bank transactions often have unique IDs appended each month.
// Strip them so "MORTGAGE PMT ID:12345" and "MORTGAGE PMT ID:67890" group together.
function normalizeName(tx: Transaction): string {
  const raw = (tx.merchant_name ?? tx.name);
  return raw
    .replace(/\s+(PPD|WEB|CCD|TEL|ACH)\s+.*$/i, "")   // strip ACH type + trailing ID
    .replace(/\s+ID[:\s]+[\w\d\-]+/gi, "")              // strip "ID: 123456"
    .replace(/\s+PMT\s+#?[\d\-]+/gi, "")                // strip payment numbers
    .replace(/\s+\*[\w\d]+$/i, "")                      // strip * reference codes
    .replace(/\s+REF[\s:#]+[\w\d]+/gi, "")              // strip REF codes
    .replace(/\s+\d{6,}$/g, "")                         // strip long trailing numbers
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Recurring bill detection (6-month window) ────────────────────────────────
// Detects any cadence (weekly, monthly, bimonthly, quarterly) by measuring the
// average gap between occurrences and projecting forward. Variable-amount bills
// (garbage, water) are shown with "est." and average amount.
function detectRecurringBills(txs: Transaction[]) {
  const debits = txs.filter((t) => t.amount >= 10);

  // Group by normalized name
  const byMerchant: Record<string, { label: string; txs: Transaction[] }> = {};
  for (const tx of debits) {
    const key = normalizeName(tx).toLowerCase();
    if (!key) continue;
    if (!byMerchant[key]) byMerchant[key] = { label: normalizeName(tx), txs: [] };
    byMerchant[key].txs.push(tx);
  }

  const now = Date.now();
  const bills: {
    id: string; label: string; amt: number; isVariable: boolean;
    cadence: string; dueDate: Date; daysUntil: number;
  }[] = [];

  for (const { label, txs: group } of Object.values(byMerchant)) {
    if (group.length < 2) continue; // need at least 2 occurrences

    // Sort chronologically
    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));

    // Measure average gap between consecutive occurrences
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1].date + "T12:00:00").getTime();
      const d2 = new Date(sorted[i].date + "T12:00:00").getTime();
      gaps.push((d2 - d1) / 86400_000);
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

    // Classify cadence — ignore if gap is too irregular or too infrequent
    let cadenceLabel: string;
    if (avgGap <= 10)        cadenceLabel = "weekly";
    else if (avgGap <= 45)   cadenceLabel = "monthly";
    else if (avgGap <= 75)   cadenceLabel = "bimonthly";
    else if (avgGap <= 105)  cadenceLabel = "quarterly";
    else continue; // too infrequent to be a bill

    // Check gap consistency — skip if wildly irregular (not a real cadence)
    if (gaps.length > 1) {
      const gapVariance = Math.max(...gaps) / Math.min(...gaps);
      if (gapVariance > 2.5) continue; // gaps vary too much
    }

    // Amount stats
    const amounts = sorted.map((t) => t.amount);
    const avgAmt = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const maxAmt = Math.max(...amounts);
    const minAmt = Math.min(...amounts);
    const isVariable = maxAmt / minAmt > 1.3; // >30% spread = variable

    // Project next due date = last occurrence + average gap
    const lastDate = new Date(sorted[sorted.length - 1].date + "T12:00:00");
    const nextDate = new Date(lastDate.getTime() + avgGap * 86400_000);
    const daysUntil = Math.round((nextDate.getTime() - now) / 86400_000);

    // Only show if due within next 60 days or up to 5 days overdue
    if (daysUntil < -5 || daysUntil > 60) continue;

    const latest = sorted[sorted.length - 1];
    bills.push({
      id: latest.id.toString(),
      label,
      amt: Math.round(avgAmt * 100) / 100,
      isVariable,
      cadence: cadenceLabel,
      dueDate: nextDate,
      daysUntil,
    });
  }

  return bills.sort((a, b) => a.daysUntil - b.daysUntil);
}

function UpcomingBillsFromTx({ transactions, loading, limit = 5 }: { transactions: Transaction[]; loading: boolean; limit?: number }) {
  if (loading) {
    return <div style={{ padding: "24px 18px", color: T.fgMuted, fontSize: 13, textAlign: "center" }}>Loading…</div>;
  }

  const bills = detectRecurringBills(transactions).slice(0, limit);

  if (bills.length === 0) {
    return (
      <div style={{ padding: "24px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Icon name="calendar" size={28} color={T.borderSubtle} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.fg, marginBottom: 4 }}>No recurring bills detected</div>
          <div style={{ fontSize: 12.5, color: T.fgMuted }}>Sync transactions in the Spending tab — recurring payments appear here automatically.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {bills.map((bill, i) => {
        const dateLabel = bill.dueDate.toLocaleString("en-US", { month: "short", day: "numeric" });
        const overdue = bill.daysUntil < 0;
        const sub = [
          dateLabel,
          overdue ? "overdue" : bill.daysUntil === 0 ? "today" : null,
          bill.cadence !== "monthly" ? bill.cadence : null,
        ].filter(Boolean).join(" · ");
        return (
          <div key={bill.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: T.bgChip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="calendar" size={15} color={T.fgMuted} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: T.fg }}>{bill.label}</div>
              <div style={{ fontSize: 12, color: overdue ? T.negative : T.fgMuted, marginTop: 1 }}>{sub}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Money value={-bill.amt} size={14} weight={600} cents={false} />
              {bill.isVariable && <div style={{ fontSize: 11, color: T.fgSubtle, marginTop: 1 }}>est.</div>}
            </div>
          </div>
        );
      })}
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
    // Fetch 180 days (6 months) for reliable recurring bill detection
    fetchTransactions(180)
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

        {/* Upcoming bills — detected from recurring transactions */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
          <CardHead
            title="Upcoming bills"
            action={
              <button onClick={() => setShowAllBills(true)} style={{ background: "none", border: "none", color: T.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
                View all <Icon name="arrow" size={13} color={T.accent} />
              </button>
            }
          />
          <UpcomingBillsFromTx transactions={transactions} loading={txLoading} limit={5} />
        </div>

        {/* All bills modal */}
        {showAllBills && (
          <div onClick={() => setShowAllBills(false)} style={{ position: "fixed", inset: 0, background: "rgba(22,17,14,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, width: 480, maxWidth: "calc(100vw - 32px)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(22,17,14,.14)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.borderSubtle}` }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.fg, fontFamily: FONT }}>All upcoming bills</div>
                <button onClick={() => setShowAllBills(false)} style={{ background: "none", border: "none", fontSize: 20, color: T.fgMuted, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                <UpcomingBillsFromTx transactions={transactions} loading={txLoading} limit={50} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
