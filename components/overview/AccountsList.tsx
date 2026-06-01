// components/overview/AccountsList.tsx — Top 5 non-debt accounts from Plaid.
// Universal (web + native). Linked to live data via useAccounts().

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { T } from "@/lib/tokens";
import { useAccounts } from "@/lib/AccountsContext";
import InstMark from "@/components/shared/InstMark";
import Money from "@/components/shared/Money";
import type { Account } from "@/types/database";

function institutionFromAccount(acct: Account): string {
  // institution_name comes from Plaid metadata stored in plaid_items
  // For now derive from account name heuristics; update when we join the tables
  if (acct.name.toLowerCase().includes("morgan") || acct.subtype === "brokerage") return "Morgan Stanley";
  if (acct.type === "investment") return "Morgan Stanley";
  return "Chase";
}

export default function AccountsList() {
  const { accounts, loading } = useAccounts();
  const router = useRouter();

  const displayAccounts = accounts
    .filter((a) => a.type !== "credit")
    .slice(0, 5);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
        <TouchableOpacity onPress={() => router.push("/accounts" as any)}>
          <Text style={styles.viewAll}>View all →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading…</Text>
        </View>
      ) : displayAccounts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No accounts connected yet.</Text>
        </View>
      ) : (
        displayAccounts.map((acct, i) => (
          <View key={acct.id} style={[styles.row, i > 0 && styles.rowBorder]}>
            <InstMark inst={institutionFromAccount(acct)} size={30} />
            <View style={styles.rowMeta}>
              <Text style={styles.acctName} numberOfLines={1}>{acct.name}</Text>
              <Text style={styles.acctSub}>
                {institutionFromAccount(acct)}{acct.mask ? ` ····${acct.mask}` : ""}
              </Text>
            </View>
            <Money value={acct.current_balance ?? 0} size={15} weight="600" cents={false} />
          </View>
        ))
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
  viewAll: { fontSize: 13, fontWeight: "600", color: T.accent },
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
  rowMeta: { flex: 1, minWidth: 0 },
  acctName: { fontSize: 13.5, fontWeight: "600", color: T.fg },
  acctSub:  { fontSize: 12, color: T.fgMuted, marginTop: 1 },
  empty: { paddingVertical: 32, alignItems: "center" },
  emptyText: { fontSize: 13, color: T.fgMuted },
});
