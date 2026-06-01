// app/(app)/goals.tsx — Goals view (follow-up PR).

import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";
import { GOALS } from "@/lib/data";
import { formatMoney } from "@/components/shared/Money";

export default function GoalsScreen() {
  return (
    <View style={s.root}>
      {GOALS.map((goal) => {
        const pct = (goal.saved / goal.target) * 100;
        return (
          <View key={goal.id} style={s.card}>
            <View style={[s.iconWrap, { backgroundColor: goal.color + "22" }]}>
              <Text style={[s.iconText, { color: goal.color }]}>
                {goal.icon === "shield" ? "🛡" : goal.icon === "plane" ? "✈️" : "🏡"}
              </Text>
            </View>
            <Text style={s.goalName}>{goal.label}</Text>
            <Text style={s.goalAmt}>
              {formatMoney(goal.saved, false)} of {formatMoney(goal.target, false)}
            </Text>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: goal.color }]} />
            </View>
            <View style={s.goalFooter}>
              <Text style={[s.goalPct, { color: goal.color }]}>{pct.toFixed(0)}% funded</Text>
              <Text style={s.goalRem}>{formatMoney(goal.target - goal.saved, false)} to go</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    backgroundColor: T.bgRaised,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 22,
    minWidth: 240,
    flex: 1,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  iconText: { fontSize: 20 },
  goalName: { fontSize: 16, fontWeight: "600", color: T.fg, marginBottom: 4 },
  goalAmt:  { fontSize: 13, color: T.fgMuted, marginBottom: 16, fontVariant: ["tabular-nums"] },
  barBg:    { height: 9, backgroundColor: T.bgChip, borderRadius: T.radiusPill, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: T.radiusPill },
  goalFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  goalPct:  { fontSize: 12.5, fontWeight: "600", fontVariant: ["tabular-nums"] },
  goalRem:  { fontSize: 12.5, color: T.fgMuted, fontVariant: ["tabular-nums"] },
});
