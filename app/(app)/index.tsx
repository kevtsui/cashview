// app/(app)/index.tsx
// Main dashboard screen. Shows total cash + per-account cards.

import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { createLinkToken, exchangeToken, syncBalances, fetchAccounts } from "@/lib/api";
import TotalBanner from "@/components/TotalBanner";
import AccountCard from "@/components/AccountCard";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import type { Account } from "@/types/database";

export default function DashboardScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load accounts from DB on mount ───────────────────────────────────────
  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load accounts. Pull to refresh.");
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // ── Fetch a link token when the component mounts (ready for "Add account") ─
  const prepareLinkToken = useCallback(async () => {
    try {
      const { link_token } = await createLinkToken();
      setLinkToken(link_token);
    } catch (err) {
      // Non-fatal: user can still see existing accounts; retry on next tap
      console.warn("Could not pre-fetch link token:", err);
    }
  }, []);

  useEffect(() => {
    prepareLinkToken();
  }, [prepareLinkToken]);

  // ── Manual refresh (re-fetches from Plaid) ───────────────────────────────
  const handleRefresh = useCallback(async (isPullToRefresh = false) => {
    if (syncing) return;
    isPullToRefresh ? setRefreshing(true) : setSyncing(true);
    setError(null);

    try {
      const result = await syncBalances();
      setAccounts(result.accounts);

      if (result.errors?.length) {
        setError(`Partial sync: ${result.errors.join("; ")}`);
      }
    } catch (err) {
      setError("Sync failed. Check your connection and try again.");
    } finally {
      setSyncing(false);
      setRefreshing(false);
      // Pre-fetch a fresh link token in the background for next "Add account"
      prepareLinkToken();
    }
  }, [syncing, prepareLinkToken]);

  // ── Plaid Link callbacks ─────────────────────────────────────────────────
  const handlePlaidSuccess = useCallback(async (publicToken: string, institution?: { id?: string; name?: string }) => {
    setSyncing(true);
    try {
      await exchangeToken({
        public_token: publicToken,
        institution_id: institution?.id,
        institution_name: institution?.name,
      });
      // Reload accounts after exchange (initial balances are fetched server-side)
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      Alert.alert(
        "Connection failed",
        "Your account was linked but balances couldn't be fetched. Try refreshing."
      );
    } finally {
      setSyncing(false);
      setLinkToken(null); // Consume the token; fetch a new one
      prepareLinkToken();
    }
  }, [prepareLinkToken]);

  const handlePlaidExit = useCallback(() => {
    setLinkToken(null);
    prepareLinkToken();
  }, [prepareLinkToken]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const totalCash = accounts.reduce(
    (sum, acct) => sum + (acct.current_balance ?? 0),
    0
  );
  const mostRecentUpdate = accounts.length
    ? accounts.reduce((latest, acct) =>
        acct.last_updated > latest ? acct.last_updated : latest,
        accounts[0].last_updated
      )
    : null;

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>CashView</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => handleRefresh(true)}
            tintColor="#38bdf8"
            colors={["#38bdf8"]}
          />
        }
      >
        {/* Total cash banner */}
        <TotalBanner
          totalCash={totalCash}
          lastUpdated={mostRecentUpdate}
          isLoading={loadingAccounts}
        />

        {/* Error notice */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Accounts section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <TouchableOpacity
              onPress={() => handleRefresh(false)}
              disabled={syncing || loadingAccounts}
              style={styles.refreshBtn}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Text style={styles.refreshText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>

          {loadingAccounts ? (
            <View style={styles.loadingPlaceholder}>
              <ActivityIndicator color="#38bdf8" />
            </View>
          ) : accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={styles.emptyTitle}>No accounts yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Add account" below to connect your first bank or brokerage.
              </Text>
            </View>
          ) : (
            accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))
          )}
        </View>

        {/* Add account button via Plaid Link */}
        <View style={styles.addSection}>
          {linkToken ? (
            <PlaidLinkButton
              linkToken={linkToken}
              onSuccess={handlePlaidSuccess}
              onExit={handlePlaidExit}
            />
          ) : (
            <TouchableOpacity
              style={[styles.addButton, styles.addButtonLoading]}
              onPress={prepareLinkToken}
            >
              <Text style={styles.addButtonText}>+ Add account</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.poweredBy}>Powered by Plaid</Text>
        </View>

        {/* Future work note */}
        <View style={styles.futureNote}>
          <Text style={styles.futureNoteText}>
            v1 · Transaction history, spending trends, and budgeting coming soon.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8fafc",
  },
  signOutBtn: {
    padding: 4,
  },
  signOutText: {
    fontSize: 14,
    color: "#64748b",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: "#450a0a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  refreshBtn: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  refreshText: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingPlaceholder: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  addSection: {
    marginTop: 24,
    marginHorizontal: 16,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonLoading: {
    backgroundColor: "#0369a1",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  poweredBy: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
  },
  futureNote: {
    marginTop: 32,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#1e293b",
    borderRadius: 10,
  },
  futureNoteText: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
});
