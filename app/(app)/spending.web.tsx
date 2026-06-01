// app/(app)/spending.web.tsx — Spending view with real Plaid data.
// Features: month picker, category filter, inline categorization, unconfirmed indicators.

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  fetchTransactions, syncTransactions, fetchTransactionRules,
  categorizeTransaction, confirmTransaction,
  categoryMeta, CATEGORY_META, Transaction, TransactionRule,
} from "@/lib/api";
import Money, { formatMoney, formatCompact } from "@/components/shared/Money";
import Icon from "@/components/shared/Icon";
import { T } from "@/lib/tokens";

const FONT = '"Noto Sans JP", system-ui, -apple-system, sans-serif';

// Effective category for a transaction (user override > Plaid category)
function effectiveCategory(tx: Transaction, rules: Map<string, TransactionRule>) {
  if (tx.user_category && tx.user_category_label) {
    return { key: tx.user_category, label: tx.user_category_label, color: rules.get(tx.user_category)?.color ?? T.fgMuted };
  }
  const meta = categoryMeta(tx.personal_finance_category);
  return { key: tx.personal_finance_category ?? "OTHER", label: meta.label, color: meta.color };
}

// ── Category picker — fixed position to avoid overflow clipping ───────────────
interface PickerState { txId: string; top: number; left: number; tx: Transaction }

function CategoryPickerPortal({ state, onCategorize, onClose }: {
  state: PickerState;
  onCategorize: (key: string, label: string, color: string) => void;
  onClose: () => void;
}) {
  const cats = Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, ...meta }));

  // Adjust left so picker doesn't overflow right edge of viewport
  const left = Math.min(state.left, window.innerWidth - 230);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ position: "fixed", top: state.top, left, zIndex: 9999, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, boxShadow: "0 8px 24px rgba(22,17,14,.14)", width: 220, maxHeight: 300, overflowY: "auto" }}
    >
      <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, color: T.fgMuted, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${T.borderSubtle}`, fontFamily: FONT }}>
        Set category
      </div>
      {cats.map(({ key, label, color }) => (
        <div key={key} onClick={() => onCategorize(key, label, color)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", transition: "background 100ms", fontFamily: FONT }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = T.bgChip}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.fg }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main spending screen ──────────────────────────────────────────────────────
export default function SpendingScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<TransactionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);

  const rulesMap = useMemo(() => new Map(rules.map((r) => [r.category_key, r])), [rules]);

  const load = useCallback(async () => {
    try {
      const [txData, ruleData] = await Promise.all([fetchTransactions(90), fetchTransactionRules()]);
      setTransactions(txData);
      setRules(ruleData);
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
      const [txData, ruleData] = await Promise.all([
        Promise.resolve(result.transactions),
        fetchTransactionRules(),
      ]);
      setTransactions(txData);
      setRules(ruleData);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleCategorize = useCallback(async (tx: Transaction, key: string, label: string, color: string) => {
    setPicker(null);
    // Optimistically update UI
    setTransactions((prev) => prev.map((t) =>
      t.id === tx.id ? { ...t, user_category: key, user_category_label: label, confirmed: true } : t
    ));
    try {
      await categorizeTransaction(tx, key, label, color);
      // Re-fetch to pick up rule applied to other transactions
      const [txData, ruleData] = await Promise.all([fetchTransactions(90), fetchTransactionRules()]);
      setTransactions(txData);
      setRules(ruleData);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleConfirm = useCallback(async (txId: string) => {
    setTransactions((prev) => prev.map((t) => t.id === txId ? { ...t, confirmed: true } : t));
    await confirmTransaction(txId).catch(console.error);
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const months = useMemo(() =>
    Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort().reverse(),
  [transactions]);
  const activeMonth = selectedMonth ?? months[0] ?? null;

  const monthTx = useMemo(() =>
    transactions.filter((t) => !activeMonth || t.date.startsWith(activeMonth)),
  [transactions, activeMonth]);

  const debits = monthTx.filter((t) => t.amount > 0);
  const totalSpent = debits.reduce((s, t) => s + t.amount, 0);

  // Category totals for donut
  const catMap = useMemo(() => {
    const m: Record<string, { id: string; label: string; color: string; total: number }> = {};
    for (const tx of debits) {
      const eff = effectiveCategory(tx, rulesMap);
      if (!m[eff.key]) m[eff.key] = { id: eff.key, label: eff.label, color: eff.color, total: 0 };
      m[eff.key].total += tx.amount;
    }
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [debits, rulesMap]);

  // Monthly trend
  const trendData = useMemo(() =>
    months.slice(0, 6).reverse().map((m) => ({
      month: new Date(m + "-01").toLocaleString("en-US", { month: "short" }),
      value: transactions.filter((t) => t.date.startsWith(m) && t.amount > 0).reduce((s, t) => s + t.amount, 0),
    })),
  [months, transactions]);

  // Filtered transaction list
  const filteredTx = useMemo(() => {
    let list = monthTx.filter((t) => t.amount > 0);
    if (selectedCategory) {
      list = list.filter((t) => effectiveCategory(t, rulesMap).key === selectedCategory);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTx, selectedCategory, rulesMap]);

  const unconfirmedCount = monthTx.filter((t) => t.amount > 0 && !t.confirmed).length;

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: T.fgMuted, fontFamily: FONT }}>Loading…</div>;
  }

  if (transactions.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.bgChip, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="pie-chart" size={26} color={T.fgMuted} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: T.fg, marginBottom: 6, fontFamily: FONT }}>No transactions yet</div>
          <div style={{ fontSize: 13.5, color: T.fgMuted, fontFamily: FONT }}>Sync to pull the last 12 months from your connected accounts.</div>
        </div>
        <button onClick={handleSync} disabled={syncing} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 600, fontSize: 14, cursor: syncing ? "default" : "pointer", opacity: syncing ? 0.6 : 1, fontFamily: FONT }}>
          <Icon name="refresh" size={16} color="#fff" style={{ animation: syncing ? "spin 0.85s linear infinite" : "none" }} />
          {syncing ? "Syncing…" : "Sync transactions"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT }} onClick={() => setPicker(null)}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {months.slice(0, 6).map((m) => {
            const label = new Date(m + "-01").toLocaleString("en-US", { month: "short", year: "2-digit" });
            const isActive = m === activeMonth;
            return (
              <button key={m} onClick={(e) => { e.stopPropagation(); setSelectedMonth(m); }} style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${isActive ? "transparent" : T.border}`, background: isActive ? T.fg : "transparent", color: isActive ? "#fff" : T.fgMuted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {unconfirmedCount > 0 && (
            <span style={{ padding: "5px 10px", borderRadius: 999, background: T.accentSoft, color: T.accent, fontSize: 12, fontWeight: 600 }}>
              {unconfirmedCount} to review
            </span>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleSync(); }} disabled={syncing} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgRaised, color: T.fg, fontWeight: 600, fontSize: 13, cursor: syncing ? "default" : "pointer", opacity: syncing ? 0.6 : 1, fontFamily: FONT }}>
            <Icon name="refresh" size={15} color={T.fg} style={{ animation: syncing ? "spin 0.85s linear infinite" : "none" }} />
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.fg, marginBottom: 16 }}>By category</div>
          {catMap.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {catMap.slice(0, 7).map((c) => (
                <div key={c.id} onClick={(e) => { e.stopPropagation(); setSelectedCategory(selectedCategory === c.id ? null : c.id); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "3px 6px", margin: "-3px -6px", borderRadius: 7, background: selectedCategory === c.id ? T.bgChip : "transparent", transition: "background 120ms" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: T.fg }}>{c.label}</span>
                  <span style={{ color: T.fgMuted, fontVariantNumeric: "tabular-nums" }}>{formatMoney(c.total, false)}</span>
                  <span style={{ fontSize: 11, color: T.fgSubtle }}>{Math.round((c.total / totalSpent) * 100)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: T.fgMuted, fontSize: 13 }}>No spending data.</div>
          )}
        </div>
      </div>

      {/* ── Transaction list ──────────────────────────────────────────────── */}
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>

        {/* Filter bar */}
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: T.fgMuted, marginRight: 4, fontFamily: FONT }}>Filter:</span>
          <button onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); }}
            style={{ padding: "4px 10px", borderRadius: 999, border: `1px solid ${!selectedCategory ? "transparent" : T.border}`, background: !selectedCategory ? T.fg : "transparent", color: !selectedCategory ? "#fff" : T.fgMuted, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
            All ({debits.length})
          </button>
          {catMap.map((c) => (
            <button key={c.id} onClick={(e) => { e.stopPropagation(); setSelectedCategory(selectedCategory === c.id ? null : c.id); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, border: `1px solid ${selectedCategory === c.id ? "transparent" : T.border}`, background: selectedCategory === c.id ? c.color : "transparent", color: selectedCategory === c.id ? "#fff" : T.fgMuted, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: selectedCategory === c.id ? "rgba(255,255,255,0.7)" : c.color, flexShrink: 0 }} />
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "8px 18px 6px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: T.fgMuted, fontFamily: FONT }}>{filteredTx.length} transactions</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: T.fg, fontVariantNumeric: "tabular-nums", fontFamily: FONT }}>
            {formatMoney(filteredTx.reduce((s, t) => s + t.amount, 0), false)} total
          </span>
        </div>

        {filteredTx.length === 0 ? (
          <div style={{ padding: "32px 18px", color: T.fgMuted, fontSize: 13, textAlign: "center", fontFamily: FONT }}>No transactions match the current filter.</div>
        ) : (
          filteredTx.map((tx, i) => {
            const eff = effectiveCategory(tx, rulesMap);
            const displayName = tx.merchant_name ?? tx.name;
            const dateLabel = new Date(tx.date + "T12:00:00").toLocaleString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none", background: !tx.confirmed ? T.bgSunken + "80" : "transparent" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: eff.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: eff.color }}>{displayName.slice(0, 2).toUpperCase()}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: T.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    {/* Category chip — opens fixed-position picker */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (picker?.txId === tx.id) { setPicker(null); return; }
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setPicker({ txId: tx.id, top: rect.bottom + 4, left: rect.left, tx });
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 999, background: eff.color + "22", border: "none", cursor: "pointer", fontFamily: FONT }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: eff.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: eff.color }}>{eff.label}</span>
                      <span style={{ fontSize: 10, color: eff.color, opacity: 0.7 }}>▾</span>
                    </button>
                    {!tx.confirmed && (
                      <button onClick={(e) => { e.stopPropagation(); handleConfirm(tx.id); }}
                        style={{ fontSize: 11, color: T.accent, fontWeight: 600, background: T.accentSoft, border: "none", borderRadius: 999, padding: "2px 7px", cursor: "pointer", fontFamily: FONT }}>
                        ✓ confirm
                      </button>
                    )}
                    <span style={{ fontSize: 11.5, color: T.fgSubtle }}>{dateLabel}</span>
                  </div>
                </div>

                <Money value={-tx.amount} size={14} weight={600} cents />
              </div>
            );
          })
        )}
      </div>

      {/* Fixed-position category picker portal — never clipped by overflow */}
      {picker && (
        <CategoryPickerPortal
          state={picker}
          onCategorize={(key, label, color) => handleCategorize(picker.tx, key, label, color)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
