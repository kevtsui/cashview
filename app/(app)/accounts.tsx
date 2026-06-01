// app/(app)/accounts.tsx — Accounts view stub (follow-up PR).

import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";
import { useAccounts } from "@/lib/AccountsContext";
import InstMark from "@/components/shared/InstMark";
import Money from "@/components/shared/Money";
import Badge from "@/components/shared/Badge";

const GROUPS: { key: string; label: string }[] = [
  { key: "depository", label: "Cash" },
  { key: "investment",  label: "Investments" },
  { key: "credit",      label: "Credit & debt" },
];

export default function AccountsScreen() {
  const { accounts } = useAccounts();

  return (
    <View style={s.root}>
      {GROUPS.map(({ key, label }) => {
        const group = accounts.filter((a) => {
          if (key === "depository") return ["depository","checking","savings"].includes(a.type ?? "");
          if (key === "investment")  return ["investment","brokerage"].includes(a.type ?? "");
          return a.type === "credit";
        });
        if (group.length === 0) return null;
        const total = group.reduce((s, a) => s + (a.current_balance ?? 0), 0);

        return (
          <View key={key} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.groupLabel}>{label}</Text>
              <Money value={total} size={15} weight="600" cents={false}
                color={key === "credit" ? T.negative : undefined} />
            </View>
            {group.map((acct, i) => (
              <View key={acct.id} style={[s.row, i > 0 && s.rowBorder]}>
                <InstMark inst={acct.name.includes("Morgan") ? "Morgan Stanley" : "Chase"} size={34} />
                <View style={s.meta}>
                  <Text style={s.name}>{acct.name}</Text>
                  <Text style={s.sub}>{acct.type} ····{acct.plaid_account_id.slice(-4)}</Text>
                </View>
                {acct.type === "credit" && (
                  <Badge tone="negative">{acct.available_balance ?? 0}% apr</Badge>
                )}
                <Money value={acct.current_balance ?? 0} size={17} weight="600" />
              </View>
            ))}
          </View>
        );
      })}

      {accounts.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>No accounts connected. Tap Add account in the top bar.</Text>
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
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 18px" as any,
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
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 14, color: T.fgMuted, textAlign: "center" },
});
