// app/(app)/investments.web.tsx — Investments view using live Plaid balance data.

import React, { useEffect, useState } from "react";

function useNarrow(bp = 640) {
  const [narrow, setNarrow] = useState(typeof window !== "undefined" ? window.innerWidth < bp : false);
  useEffect(() => {
    const fn = () => setNarrow(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return narrow;
}
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAccounts } from "@/lib/AccountsContext";
import { fetchSnapshots, NetWorthSnapshot } from "@/lib/api";
import Money, { formatCompact, formatMoney } from "@/components/shared/Money";
import InstMark from "@/components/shared/InstMark";
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

// Allocation buckets derived from account subtypes
const ALLOC_COLORS = ["#3C8C7E", "#E5634A", "#D99A22", "#7A716A"];

export default function InvestmentsScreen() {
  const isMobile = useNarrow(640);
  const { accounts, loading } = useAccounts();
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);

  useEffect(() => {
    fetchSnapshots(365).then(setSnapshots).catch(console.error);
  }, []);

  const investAccounts = accounts.filter((a) =>
    ["investment", "brokerage", "retirement", "401k", "ira"].includes(a.type ?? "")
  );

  const totalInvested = investAccounts.reduce((s, a) => s + (a.current_balance ?? 0), 0);

  // Build allocation from account subtypes
  const byType = investAccounts.reduce<Record<string, number>>((acc, a) => {
    const key = a.subtype ?? a.type ?? "other";
    acc[key] = (acc[key] ?? 0) + (a.current_balance ?? 0);
    return acc;
  }, {});
  const allocData = Object.entries(byType).map(([key, value], i) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
    value,
    color: ALLOC_COLORS[i % ALLOC_COLORS.length],
  }));

  // Real invest trend from snapshots
  const investSeries = snapshots.length > 1
    ? snapshots.map((s) => ({
        month: new Date(s.captured_at + "T12:00:00").toLocaleString("en-US", { month: "short", day: "numeric" }),
        value: s.invest,
      }))
    : null; // null = not enough data yet

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: T.fgMuted, fontFamily: FONT }}>Loading…</div>;
  }

  if (investAccounts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", gap: 16, fontFamily: FONT }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.bgChip, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="trending-up" size={26} color={T.fgMuted} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: T.fg, marginBottom: 6 }}>No investment accounts</div>
          <div style={{ fontSize: 13.5, color: T.fgMuted }}>Connect a brokerage or retirement account via Add account.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT }}>

      {/* ── Top row: total + allocation ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

        {/* Total invested card */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20, display: "flex", flexDirection: "column" }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.fgMuted }}>Total Invested</p>
          <Money value={totalInvested} size={34} weight={700} color={T.invest} />
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: T.investSoft, color: T.invest, fontSize: 12, fontWeight: 600 }}>
              <Icon name="trending-up" size={13} color={T.invest} />
              Live balances
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 130, marginTop: 20 }}>
            {investSeries ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={investSeries} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.invest} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={T.invest} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.fgSubtle, fontFamily: FONT }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: T.fgSubtle, fontFamily: FONT }} axisLine={false} tickLine={false} width={44} domain={["auto", "auto"]} />
                <Tooltip formatter={(v: number) => [formatMoney(v, false), "Value"]} contentStyle={{ fontFamily: FONT, background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke={T.invest} strokeWidth={2} fill="url(#invGrad)" dot={false} activeDot={{ r: 4, fill: T.invest, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: T.fgSubtle, textAlign: "center" }}>
                  Trend builds as you Refresh daily.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Allocation donut */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.fg, marginBottom: 16 }}>Allocation</div>
          {allocData.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <PieChart width={150} height={150}>
                  <Pie data={allocData} cx={70} cy={70} innerRadius={46} outerRadius={68} dataKey="value" strokeWidth={0} paddingAngle={3}>
                    {allocData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <span style={{ fontSize: 10, color: T.fgMuted }}>{investAccounts.length} accts</span>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {allocData.map((d) => {
                  const pct = totalInvested > 0 ? ((d.value / totalInvested) * 100).toFixed(0) : "0";
                  return (
                    <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: T.fg }}>{d.label}</span>
                      <span style={{ color: T.fgMuted, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ color: T.fgMuted, fontSize: 13 }}>Connect accounts to see allocation.</div>
          )}
        </div>
      </div>

      {/* ── Investment accounts list ────────────────────────────────────────── */}
      <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
        <CardHead title="Investment accounts" action={
          <Money value={totalInvested} size={14} weight={600} cents={false} color={T.invest} />
        } />
        {investAccounts.map((acct, i) => (
          <div key={acct.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
            <InstMark inst={acct.name.toLowerCase().includes("morgan") ? "Morgan Stanley" : "Chase"} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.fg }}>{acct.name}</div>
              <div style={{ fontSize: 12.5, color: T.fgMuted, marginTop: 1 }}>
                {acct.subtype ?? acct.type} · ····{acct.plaid_account_id.slice(-4)}
              </div>
            </div>
            <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 999, background: T.investSoft, color: T.invest, fontSize: 12, fontWeight: 600 }}>
              live
            </span>
            <Money value={acct.current_balance ?? 0} size={17} weight={600} />
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: T.fgSubtle, textAlign: "center", margin: 0, fontFamily: FONT }}>
        Balances are live from Plaid. Holdings breakdown and day-change % require the Investments product — coming in a future update.
      </p>
    </div>
  );
}
