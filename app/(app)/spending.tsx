// app/(app)/spending.tsx — Spending view (follow-up PR: needs transaction sync).

import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";

export default function SpendingScreen() {
  return (
    <View style={s.root}>
      <View style={s.card}>
        <Text style={s.title}>Spending</Text>
        <Text style={s.body}>
          Transaction history and budget tracking will appear here once Plaid transaction
          sync is added in a follow-up PR.
        </Text>
      </View>
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
    padding: 32,
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "600", color: T.fg, marginBottom: 12 },
  body:  { fontSize: 14, color: T.fgMuted, textAlign: "center", lineHeight: 22, maxWidth: 380 },
});
