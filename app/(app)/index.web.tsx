// app/(app)/index.web.tsx — Overview screen, pure HTML/CSS.
// No React Native View/StyleSheet mixing — avoids RN Web layout edge cases.

import React from "react";
import { useRouter } from "expo-router";
import { useAccounts } from "@/lib/AccountsContext";
import { CATEGORIES, NET_WORTH_SERIES, CASH_SERIES } from "@/lib/data";
import { T } from "@/lib/tokens";
import Money, { formatCompact } from "@/components/shared/Money";
import Icon from "@/components/shared/Icon";
import Sparkline from "@/components/overview/Sparkline";
import NetWorthChart from "@/components/overview/NetWorthChart";
import SpendingDonut from "@/components/overview/SpendingDonut";
import InstMark from "@/components/shared/InstMark";
import type { Account } from "@/types/database";

const FONT = '"Noto Sans JP", system-ui, -apple-system, sans-serif';

// Sparkline series
const CASH_SPARK   = CASH_SERIES.map((p) => p.value);
const NW_SPARK     = NET_WORTH_SERIES.map((p) => p.value);
const INVEST_SPARK = NW_SPARK.map((v) => v * 0.75);
const DEBT_SPARK   = [3100,2900,3400,2800,3200,2600,3100,2900,2700,3300,3000,3284];
const SPEND_TOTAL  = CATEGORIES.reduce((s, c) => s + c.spent, 0);

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

// ── KPI card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: number;
  delta: string;
  deltaBg: string;
  deltaColor: string;
  sparkValues: number[];
  sparkColor: string;
  valueTone?: string;
}
function KpiCard({ label, value, delta, deltaBg, deltaColor, sparkValues, sparkColor, valueTone }: KpiProps) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }}>
        <Money value={value} size={23} cents={false} weight={600} color={valueTone} />
        <div style={{ marginBottom: 2, flexShrink: 0 }}>
          <Sparkline values={sparkValues} color={sparkColor} />
        </div>
      </div>
      {delta && (
        <div style={{ marginTop: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 999, background: deltaBg, color: deltaColor, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Card header ───────────────────────────────────────────────────────────────
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT }}>

      {/* ── KPI strip — deltas hidden until historical data is available ───── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <KpiCard label="Total cash"  value={cash}    sparkValues={CASH_SPARK}   sparkColor={T.accent}   />
        <KpiCard label="Net worth"   value={netWorth} sparkValues={NW_SPARK}     sparkColor={T.invest}   />
        <KpiCard label="Investments" value={invest}   sparkValues={INVEST_SPARK} sparkColor={T.invest}   valueTone={invest > 0 ? T.invest : undefined} />
        <KpiCard label="Card debt"   value={debt}     sparkValues={DEBT_SPARK}   sparkColor={T.negative} />
      </div>

      {/* ── Chart row — only shown when accounts are connected ─────────────── */}
      {accounts.length === 0 && (
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.fg, marginBottom: 8, fontFamily: FONT }}>Connect your first account</div>
          <div style={{ fontSize: 13.5, color: T.fgMuted, fontFamily: FONT }}>Click <strong>+ Add account</strong> above to link Chase, Morgan Stanley, or any other bank.</div>
        </div>
      )}
      <div style={{ display: accounts.length === 0 ? "none" : "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, alignItems: "stretch" }}>

        {/* Net worth area chart */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexShrink: 0 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: T.fg }}>Net worth</div>
              <div style={{ fontSize: 12.5, color: T.fgMuted, marginTop: 2 }}>Last 12 months</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 999, background: T.positiveSoft, color: T.positive, fontSize: 12, fontWeight: 600 }}>
              +$36,990
            </span>
          </div>
          {/* Chart fills remaining card height */}
          <div style={{ flex: 1, minHeight: 180 }}>
            <NetWorthChart series={NET_WORTH_SERIES} />
          </div>
        </div>

        {/* Spending donut */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.fg, marginBottom: 16 }}>Spending by category</div>
          <SpendingDonut categories={CATEGORIES} total={SPEND_TOTAL} />
        </div>
      </div>

      {/* ── Lower row — hide placeholder bills when no accounts ─────────────── */}
      <div style={{ display: accounts.length === 0 ? "none" : "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>

        {/* Accounts */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
          <CardHead
            title="Accounts"
            action={
              <button
                onClick={() => router.push("/accounts" as any)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: 0 }}
              >
                View all <Icon name="arrow" size={13} color={T.accent} />
              </button>
            }
          />
          {displayAccounts.length === 0 ? (
            <div style={{ padding: "32px 18px", color: T.fgMuted, fontSize: 13, textAlign: "center" }}>
              No accounts yet. Add one above.
            </div>
          ) : (
            displayAccounts.map((acct, i) => (
              <div key={acct.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
                <InstMark inst={institutionName(acct)} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: T.fg }}>{acct.name}</div>
                  <div style={{ fontSize: 12, color: T.fgMuted, marginTop: 1 }}>{institutionName(acct)} ····{acct.plaid_account_id.slice(-4)}</div>
                </div>
                <Money value={acct.current_balance ?? 0} size={15} weight={600} cents={false} />
              </div>
            ))
          )}
        </div>

        {/* Upcoming bills */}
        <div style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: "hidden" }}>
          <CardHead title="Upcoming bills" />
          {BILLS.map((bill, i) => (
            <div key={bill.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i ? `1px solid ${T.borderSubtle}` : "none" }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: T.bgChip, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name="calendar" size={15} color={T.fgMuted} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: T.fg }}>{bill.label}</div>
                <div style={{ fontSize: 12, color: T.fgMuted, marginTop: 1 }}>{bill.due}{bill.auto ? " · auto" : ""}</div>
              </div>
              <Money value={-bill.amt} size={14} weight={600} cents={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
