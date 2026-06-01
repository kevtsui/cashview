// components/overview/KpiCard.tsx — Single KPI metric card.
// Web: renders a styled div with sparkline slot. Native: simple View.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";
import Money from "@/components/shared/Money";

interface KpiCardProps {
  label: string;
  value: number;
  delta?: string;
  deltaTone?: "positive" | "negative" | "invest" | "neutral";
  /** Slot for sparkline (platform-specific child) */
  sparkline?: React.ReactNode;
  valueTone?: string;
  cents?: boolean;
}

export default function KpiCard({
  label,
  value,
  delta,
  deltaTone = "positive",
  sparkline,
  valueTone,
  cents = false,
}: KpiCardProps) {
  const deltaColors = {
    positive: T.positive,
    negative: T.negative,
    invest:   T.invest,
    neutral:  T.fgMuted,
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{label.toUpperCase()}</Text>
      <View style={styles.row}>
        <Money value={value} size={23} weight="600" cents={cents} color={valueTone} />
        {sparkline && <View style={styles.sparkSlot}>{sparkline}</View>}
      </View>
      {delta && (
        <Text style={[styles.delta, { color: deltaColors[deltaTone] }]}>
          {delta}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.bgRaised,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 18,
    minWidth: 168,
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: T.fgMuted,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  sparkSlot: {
    marginBottom: 2,
  },
  delta: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
});
