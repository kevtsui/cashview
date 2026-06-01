// app/(app)/investments.tsx — Investments view (follow-up PR: needs Plaid investments product).

import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";
import { useAccounts } from "@/lib/AccountsContext";
import InstMark from "@/components/shared/InstMark";
import Money from "@/components/shared/Money";
import Badge from "@/components/shared/Badge";

export default function InvestmentsScreen() {
  const { accounts } = useAccounts();
  const investAccounts = accounts.filter((a) =>
    ["investment", "brokerage"].includes(a.type ?? "")
  );
  const total = investAccounts.reduce((s, a) => s + (a.current_balance ?? 0), 0);

  return (
    <View style={s.root}>
      {investAccounts.length > 0 ? (
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.groupLabel}>Investment accounts</Text>
            <Money value={total} size={15} weight="600" cents={false} color={T.invest} />
          </View>
          {investAccounts.map((acct, i) => (
            <View key={acct.id} style={[s.row, i > 0 && s.rowBorder]}>
              <InstMark inst="Morgan Stanley" size={34} />
              <View style={s.meta}>
                <Text style={s.name}>{acct.name}</Text>
                <Text style={s.sub}>Morgan Stanley ····{acct.plaid_account_id.slice(-4)}</Text>
              </View>
              <Badge tone="invest">live</Badge>
              <Money value={acct.current_balance ?? 0} size={17} weight="600" />
            </View>
          ))}
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.title}>Investments</Text>
          <Text style={s.body}>
            Holdings breakdown, allocation donut, and YTD performance will appear here
            once the Plaid Investments product is enabled in a follow-up PR.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 16 },
  card: {
    backgroundColor: T.bgRaised,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    padding: 32,
    alignItems: "center",
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSubtle,
  },
  groupLabel: { fontSize: 14.5, fontWeight: "600", color: T.fg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: T.borderSubtle },
  meta: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: "600", color: T.fg },
  sub:  { fontSize: 12.5, color: T.fgMuted, marginTop: 1 },
  title: { fontSize: 18, fontWeight: "600", color: T.fg, marginBottom: 12 },
  body:  { fontSize: 14, color: T.fgMuted, textAlign: "center", lineHeight: 22, maxWidth: 380 },
});
