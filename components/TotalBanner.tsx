// components/TotalBanner.tsx
// Large total-cash figure at the top of the dashboard.

import { View, Text, StyleSheet } from "react-native";

interface TotalBannerProps {
  totalCash: number;
  lastUpdated: string | null;
  isLoading: boolean;
}

function formatCurrency(amount: number): string {
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

export default function TotalBanner({ totalCash, lastUpdated, isLoading }: TotalBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Household Cash</Text>
      <Text style={[styles.amount, isLoading && styles.amountFaded]}>
        {isLoading ? "—" : formatCurrency(totalCash)}
      </Text>
      {lastUpdated && !isLoading && (
        <Text style={styles.updated}>
          Updated {formatTimestamp(lastUpdated)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: -1,
  },
  amountFaded: {
    color: "#334155",
  },
  updated: {
    marginTop: 8,
    fontSize: 13,
    color: "#475569",
  },
});
