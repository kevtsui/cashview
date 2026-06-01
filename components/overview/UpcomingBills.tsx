// components/overview/UpcomingBills.tsx — Upcoming bills list (placeholder data).

import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";
import { BILLS } from "@/lib/data";
import Money from "@/components/shared/Money";
import Icon from "@/components/shared/Icon";

export default function UpcomingBills() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming bills</Text>
      </View>
      {BILLS.map((bill, i) => (
        <View key={bill.id} style={[styles.row, i > 0 && styles.rowBorder]}>
          <View style={styles.iconWrap}>
            <Icon name="calendar" size={15} color={T.fgMuted} />
          </View>
          <View style={styles.rowMeta}>
            <Text style={styles.billLabel}>{bill.label}</Text>
            <Text style={styles.billSub}>
              {bill.due}{bill.auto ? " · auto" : ""}
            </Text>
          </View>
          <Money value={-bill.amt} size={14} weight="600" cents={false} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.bgRaised,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSubtle,
  },
  title: { fontSize: 14.5, fontWeight: "600", color: T.fg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: T.borderSubtle,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.bgChip,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMeta: { flex: 1 },
  billLabel: { fontSize: 13.5, fontWeight: "600", color: T.fg },
  billSub:   { fontSize: 12, color: T.fgMuted, marginTop: 1 },
});
