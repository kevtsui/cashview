// lib/AccountsContext.tsx — Shares live Plaid account data across all views.
// The shell fetches once on mount + on refresh; child views consume via hook.

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchAccounts, syncBalances, createLinkToken, exchangeToken } from "./api";
import type { Account } from "@/types/database";

interface AccountsContextValue {
  accounts: Account[];
  loading: boolean;
  syncing: boolean;
  linkToken: string | null;
  stamp: string;
  refresh: () => Promise<void>;
  onPlaidSuccess: (publicToken: string, institution?: { id?: string; name?: string }) => Promise<void>;
  refreshLinkToken: () => Promise<string | null>;
}

const AccountsContext = createContext<AccountsContextValue>({
  accounts: [],
  loading: true,
  syncing: false,
  linkToken: null,
  stamp: "—",
  refresh: async () => {},
  onPlaidSuccess: async () => {},
  refreshLinkToken: async () => null,
});

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [stamp, setStamp] = useState("—");

  const refreshLinkToken = useCallback(async (): Promise<string | null> => {
    try {
      const { link_token } = await createLinkToken();
      setLinkToken(link_token);
      return link_token;
    } catch (e) {
      console.error("Link token fetch failed:", e);
      return null;
    }
  }, []);

  // Load cached balances on mount
  useEffect(() => {
    fetchAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) {
          const latest = data.reduce(
            (max, a) => (a.last_updated > max ? a.last_updated : max),
            data[0].last_updated
          );
          setStamp(formatStamp(latest));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    refreshLinkToken();
  }, [refreshLinkToken]);

  const refresh = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncBalances();
      setAccounts(result.accounts);
      setStamp("just now");
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
      refreshLinkToken();
    }
  }, [syncing, refreshLinkToken]);

  const onPlaidSuccess = useCallback(
    async (publicToken: string, institution?: { id?: string; name?: string }) => {
      setSyncing(true);
      try {
        await exchangeToken({ public_token: publicToken, institution_id: institution?.id, institution_name: institution?.name });
        const data = await fetchAccounts();
        setAccounts(data);
        setStamp("just now");
      } catch (e) {
        console.error("Exchange failed:", e);
      } finally {
        setSyncing(false);
        setLinkToken(null);
        refreshLinkToken();
      }
    },
    [refreshLinkToken]
  );

  return (
    <AccountsContext.Provider value={{ accounts, loading, syncing, linkToken, stamp, refresh, onPlaidSuccess, refreshLinkToken }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  return useContext(AccountsContext);
}

function formatStamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}
