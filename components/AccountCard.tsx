// components/AccountCard.tsx
// One card per connected bank/brokerage account.

import { View, Text, StyleSheet } from "react-native";
import type { Account } from "@/types/database";

interface AccountCardProps {
  account: Account;
}

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  depository: "🏦",
  investment: "📈",
  brokerage: "📈",
  credit: "💳",
  loan: "📋",
  other: "🏛",
};

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function AccountCard({ account }: AccountCardProps) {
  const icon = ACCOUNT_TYPE_ICONS[account.type] ?? "🏛";
  const displayName = account.official_name ?? account.name;
  const typeLabel = [account.type, account.subtype]
    .filter(Boolean)
    .map(capitalize)
    .join(" · ");

  // For investment accounts, "current" balance is the total portfolio value,
  // which may include securities. We show it with a note.
  const balance = account.current_balance;
  const isInvestment = account.type === "investment";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.type}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.balanceRow}>
        <View>
          <Text style={styles.balanceLabel}>
            {isInvestment ? "Portfolio Value" : "Balance"}
          </Text>
          <Text style={styles.balance}>{formatCurrency(balance)}</Text>
        </View>
        {account.available_balance !== null && !isInvestment && (
          <View style={styles.availableBlock}>
            <Text style={styles.availableLabel}>Available</Text>
            <Text style={styles.availableAmount}>
              {formatCurrency(account.available_balance)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.updated}>
        Updated {formatTimestamp(account.last_updated)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 2,
  },
  type: {
    fontSize: 13,
    color: "#64748b",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balance: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: -0.5,
  },
  availableBlock: {
    alignItems: "flex-end",
  },
  availableLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  availableAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  updated: {
    fontSize: 12,
    color: "#475569",
  },
});
