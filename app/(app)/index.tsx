// app/(app)/index.tsx — Overview view (default route after login).
// KPI strip · net-worth area chart · spending donut · accounts list · bills.

import { View, Text, StyleSheet } from "react-native";
import { useAccounts } from "@/lib/AccountsContext";
import { CATEGORIES, NET_WORTH_SERIES, CASH_SERIES } from "@/lib/data";
import { T } from "@/lib/tokens";

import KpiCard from "@/components/overview/KpiCard";
import Sparkline from "@/components/overview/Sparkline";
import NetWorthChart from "@/components/overview/NetWorthChart";
import SpendingDonut from "@/components/overview/SpendingDonut";
import AccountsList from "@/components/overview/AccountsList";
import UpcomingBills from "@/components/overview/UpcomingBills";

// Pre-compute sparkline value arrays from placeholder series
const CASH_SPARK    = CASH_SERIES.map((p) => p.value);
const NW_SPARK      = NET_WORTH_SERIES.map((p) => p.value);
const INVEST_SPARK  = NW_SPARK.map((v) => v * 0.75);
const DEBT_SPARK    = [3100,2900,3400,2800,3200,2600,3100,2900,2700,3300,3000,3284];
const SPEND_TOTAL   = CATEGORIES.reduce((s, c) => s + c.spent, 0);

export default function OverviewScreen() {
  const { accounts } = useAccounts();

  // Live totals from Plaid; fall back to design-handoff placeholders when empty
  const haslive = accounts.length > 0;

  const cashLive = accounts
    .filter((a) => ["depository", "checking", "savings"].includes(a.type ?? ""))
    .reduce((s, a) => s + (a.current_balance ?? 0), 0);

  const investLive = accounts
    .filter((a) => ["investment", "brokerage"].includes(a.type ?? ""))
    .reduce((s, a) => s + (a.current_balance ?? 0), 0);

  const debtLive = accounts
    .filter((a) => a.type === "credit")
    .reduce((s, a) => s + (a.current_balance ?? 0), 0);

  const cash    = haslive ? cashLive    : 84870;
  const invest  = haslive ? investLive  : 280631;
  const debt    = haslive ? debtLive    : -3284;
  const netWorth = cash + invest - Math.abs(debt);

  return (
    <View style={s.root}>
      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <View style={s.strip}>
        <KpiCard
          label="Total Cash"
          value={cash}
          delta="+$1,420 (30d)"
          deltaTone="positive"
          sparkline={<Sparkline values={CASH_SPARK} color={T.accent} />}
        />
        <KpiCard
          label="Net Worth"
          value={netWorth}
          delta="+5.2% (12mo)"
          deltaTone="positive"
          sparkline={<Sparkline values={NW_SPARK} color={T.invest} />}
        />
        <KpiCard
          label="Investments"
          value={invest}
          delta="+0.74% today"
          deltaTone="invest"
          sparkline={<Sparkline values={INVEST_SPARK} color={T.invest} />}
          valueTone={T.invest}
        />
        <KpiCard
          label="Card Debt"
          value={debt}
          delta="due Jun 14"
          deltaTone="negative"
          sparkline={<Sparkline values={DEBT_SPARK} color={T.negative} />}
        />
      </View>

      {/* ── Chart row ───────────────────────────────────────────────────── */}
      <View style={s.chartRow}>
        {/* Net-worth area chart */}
        <View style={[s.card, s.chartMain]}>
          <CardHead title="Net worth" subtitle="Last 12 months" />
          <View style={s.chartBody}>
            <NetWorthChart series={NET_WORTH_SERIES} />
          </View>
        </View>

        {/* Spending donut */}
        <View style={[s.card, s.chartSide]}>
          <CardHead title="Spending by category" subtitle="This month" />
          <View style={s.chartBody}>
            <SpendingDonut categories={CATEGORIES} total={SPEND_TOTAL} />
          </View>
        </View>
      </View>

      {/* ── Lower row ───────────────────────────────────────────────────── */}
      <View style={s.lowerRow}>
        <View style={s.lowerMain}>
          <AccountsList />
        </View>
        <View style={s.lowerSide}>
          <UpcomingBills />
        </View>
      </View>
    </View>
  );
}

function CardHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={s.cardHead}>
      <Text style={s.cardTitle}>{title}</Text>
      <Text style={s.cardSub}>{subtitle}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { gap: 16 },
  strip:     { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chartRow:  { flexDirection: "row", gap: 16 },
  lowerRow:  { flexDirection: "row", gap: 16 },
  card: {
    backgroundColor: T.bgRaised,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  chartMain:  { flex: 1.6 },
  chartSide:  { flex: 1 },
  chartBody:  { padding: 20, paddingTop: 0 },
  lowerMain:  { flex: 1.4 },
  lowerSide:  { flex: 1 },
  cardHead: {
    padding: 20,
    paddingBottom: 12,
  },
  cardTitle:  { fontSize: 15, fontWeight: "600", color: T.fg },
  cardSub:    { fontSize: 12.5, color: T.fgMuted, marginTop: 2 },
});
