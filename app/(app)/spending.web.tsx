// app/(app)/spending.web.tsx — Spending view with real Plaid transaction data.

import React, { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchTransactions, syncTransactions, categoryMeta, Transaction } from "@/lib/api";
import Money, { formatMoney, formatCompact } from "@/components/shared/Money";
import Icon from "@/components/shared/Icon";
import { T } from "@/lib/tokens";

const FONT = '"Noto Sans JP", system-ui, -apple-system, sans-serif';

function CardHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderBottom: `1px solid ${T.borderSubtle}` }}>
      <div style={{ fontWeight: 600, fontSize: 14.5, color: T.fg, fontFamily: FONT }}>{title}</div>
      {action}
    </div>
  );
}

function EmptyState({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: T.bgChip, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="pie-chart" size={26} color={T.fgMuted} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: T.fg, marginBottom: 6, fontFamily: FONT }}>No transactions yet</div>
        <div style={{ fontSize: 13.5, color: T.fgMuted, fontFamily: FONT }}>Sync to pull the last 90 days from your connected accounts.</div>
      </div>
      <button onClick={onSync} disabled={syncing} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 600, fontSize: 14, cursor: syncing ? "default" : "pointer", opacity: syncing ? 0.6 : 1, fontFamily: FONT }}>
        <Icon name="refresh" size={16} color="#fff" style={{ animation: syncing ? "spin 0.85s linear infinite" : "none" }} />
        {syncing ? "Syncing…" : "Sync transactions"}
      </button>
    </div>
  );
}

export default function SpendingScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchTransactions(90);
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncTransactions();
      setTransactions(result.transactions);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  // Group by month
  const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort().reverse();
  const activeMonth = selectedMonth ?? months[0] ?? null;

  const monthTx = transactions.filter(
    (t) => !activeMonth || t.date.startsWith(activeMonth)
  );

  const debits = monthTx.filter((t) => t.amount > 0); // money out
  const totalSpent = debits.reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const catMap: Record<string, { label: string; color: string; total: number }> = {};
  for (const tx of debits) {
    const key = tx.personal_finance_category ?? "OTHER";
    const meta = categoryMeta(key);
    if (!catMap[key]) catMap[key] = { label: meta.label, color: meta.color, total: 0 };
    catMap[key].total += tx.amount;
  }
  const catData = Object.values(catMap).sort((a, b) => b.total - a.total);

  // Monthly trend (last 6 months)
  const trendData = months.slice(0, 6).reverse().map((m) => ({
    month: new Date(m + "-01").toLocaleString("en-US", { month: "short" }),
    value: transactions.filter((t) => t.date.startsWith(m) && t.amount > 0).reduce((s, t) => s + t.amount, 0),
  }));

  const isLoading = loading;

  if (isLoading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: T.fgMuted, fontFamily: FONT }}>Loading…</div>;
  }

  if (transactions.length === 0) {
    return <EmptyState onSync={handleSync} syncing={syncing} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT }}>

      {/* ── Top bar: month picker + sync ──────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {months.slice(0, 6).map((m) => {
            const label = new Date(m + "-01").toLocaleString("en-US", { month: "short", year: "2-digit" });
            const isActive = m === activeMonth;
            return (
              <button key={m} onClick={() => setSelectedMonth(m)} style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${isActive ? "transparent" : T.border}`, background: isActive ? T.fg : "transparent", color: isActive ? "#fff" : T.fgMuted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
                {label}
              </button>
            );
          })}
        </div>
        <button onClick={handleSync} disabled={syncing} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgRaised, color: T.fg, fontWeight: 600, fontSize: 13, cursor: syncing ? "default" : "pointer", opacity: syncing ? 0.6 : 1, fontFamily: FONT }}>
          <Icon name="refresh" size={15} color={T.fg} style={{ animation: syncing ? "spin 0.85s linear infinite" : "none" }} />
          {syncing ? "Syncing…" : "Sync"}
        </button>
      </div>

      {/* ── Chart row ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Monthly trend bar chart */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.fg, marginBottom: 4 }}>Monthly spending</div>
          <div style={{ fontSize: 12.5, color: T.fgMuted, marginBottom: 18 }}>Last {trendData.length} months</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.fgSubtle, fontFamily: FONT }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: T.fgSubtle, fontFamily: FONT }} axisLine={false} tickLine={false} width={46} />
              <Tooltip formatter={(v: number) => [formatMoney(v, false), "Spent"]} contentStyle={{ fontFamily: FONT, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {trendData.map((entry, i) => (
                  <Cell key={i} fill={entry.month === trendData[trendData.length - 1].month ? T.accent : T.bgChip} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spending donut — clickable */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.fg, marginBottom: 16 }}>By category</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {catData.length > 0 ? (
              <>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <PieChart width={140} height={140}>
                    <Pie data={catData} cx={65} cy={65} innerRadius={42} outerRadius={65} dataKey="total" strokeWidth={0} paddingAngle={2}
                      onClick={(d) => setSelectedCategory(d.id)}
                      style={{ cursor: "pointer" }}>
                      {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: 10, color: T.fgMuted, fontWeight: 500 }}>spent</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: T.fg, letterSpacing: "-0.02em" }}>{formatCompact(totalSpent)}</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                  {catData.slice(0, 5).map((c) => (
                    <div key={c.label} onClick={() => setSelectedCategory(c.id)} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, cursor: "pointer", padding: "2px 4px", margin: "-2px -4px", borderRadius: 6, transition: "background 120ms" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = T.bgChip}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: T.fg }}>{c.label}</span>
                      <span style={{ color: T.fgMuted, fontVariantNumeric: "tabular-nums" }}>{formatMoney(c.total, false)}</span>
                      <span style={{ fontSize: 11, color: T.fgSubtle }}>→</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: T.fgMuted, fontSize: 13 }}>No spending data for this month.</div>
            )}
          </div>
        </div>
      </div>

      {/* Category drill-down modal */}
      {selectedCategory && (() => {
        const cat = catData.find((c) => c.id === selectedCategory);
        const catTxs = monthTx.filter((t) => (t.personal_finance_category ?? "OTHER") === selectedCategory).sort((a, b) => b.date.localeCompare(a.date));
        const meta = categoryMeta(selectedCategory);
        return (
          <div onClick={() => setSelectedCategory(null)} style={{ position: "fixed", inset: 0, background: "rgba(22,17,14,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, width: 520, maxWidth: "calc(100vw - 32px)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(22,17,14,.14)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.borderSubtle}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: meta.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: T.fg, fontFamily: FONT }}>{cat?.label ?? selectedCategory}</div>
                    <div style={{ fontSize: 12.5, color: T.fgMuted, marginTop: 1, fontFamily: FONT }}>{catTxs.length} transactions</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: T.fg, fontVariantNumeric: "tabular-nums" }}>{formatMoney(cat?.total ?? 0, false)}</span>
                  <button onClick={() => setSelectedCategory(null)} style={{ background: "none", border: "none", fontSize: 22, color: T.fgMuted, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {catTxs.map((tx, i) => {
                  const displayName = tx.merchant_name ?? tx.name;
                  const dateLabel = new Date(tx.date + "T12:00:00").toLocaleString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{displayName.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: T.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                        <div style={{ fontSize: 12, color: T.fgMuted, marginTop: 1 }}>{dateLabel}</div>
                      </div>
                      <Money value={-tx.amount} size={14} weight={600} cents />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Transaction list ────────────────────────────────────────────────── */}
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
        <CardHead
          title="Transactions"
          action={<span style={{ fontSize: 13, color: T.fgMuted, fontFamily: FONT }}>{monthTx.length} this period</span>}
        />
        {monthTx.length === 0 ? (
          <div style={{ padding: "32px 18px", color: T.fgMuted, fontSize: 13, textAlign: "center", fontFamily: FONT }}>No transactions for this period.</div>
        ) : (
          monthTx.map((tx, i) => {
            const meta = categoryMeta(tx.personal_finance_category);
            const displayName = tx.merchant_name ?? tx.name;
            const isIncome = tx.amount < 0;
            const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: T.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: T.fgMuted, marginTop: 1 }}>{tx.category_primary ?? "Other"} · {new Date(tx.date + "T12:00:00").toLocaleString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <Money value={isIncome ? -tx.amount : -tx.amount} size={14} weight={600} color={isIncome ? T.positive : undefined} cents />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
