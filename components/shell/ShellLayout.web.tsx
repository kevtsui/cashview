// components/shell/ShellLayout.web.tsx — Command Center shell for web.
// 230px sidebar (desktop) ↔ pill tab bar (< 880px).
// Consumes AccountsContext for refresh / Plaid Link state.

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "expo-router";
import { useAccounts } from "@/lib/AccountsContext";
import { MEMBERS } from "@/lib/data";
import Avatar from "@/components/shared/Avatar";
import Icon from "@/components/shared/Icon";
import PlaidLinkButton from "@/components/PlaidLinkButton";

const NAV_ITEMS = [
  { id: "overview",     label: "Overview",     icon: "grid",         href: "/"            },
  { id: "accounts",     label: "Accounts",     icon: "building",     href: "/accounts"    },
  { id: "spending",     label: "Spending",     icon: "pie-chart",    href: "/spending"    },
  { id: "investments",  label: "Investments",  icon: "trending-up",  href: "/investments" },
  { id: "goals",        label: "Goals",        icon: "target",       href: "/goals"       },
];

function useNarrow() {
  const [narrow, setNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth < 880 : false
  );
  useEffect(() => {
    const fn = () => setNarrow(window.innerWidth < 880);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return narrow;
}

function activeId(pathname: string) {
  if (pathname === "/" || pathname === "") return "overview";
  return NAV_ITEMS.find((n) => n.href !== "/" && pathname.startsWith(n.href))?.id ?? "overview";
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ active }: { active: string }) {
  const router = useRouter();
  return (
    <aside style={s.sidebar as React.CSSProperties}>
      {/* Brand */}
      <div style={s.brand as React.CSSProperties}>
        <div style={s.brandMark as React.CSSProperties}>
          <Icon name="wallet" size={17} color="#fff" />
        </div>
        <span style={s.brandName as React.CSSProperties}>CashView</span>
      </div>

      {/* Nav */}
      <nav style={s.nav as React.CSSProperties}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href as any)}
              style={{
                ...s.navItem,
                background: isActive ? "var(--bg-chip)" : "transparent",
                color: isActive ? "var(--fg)" : "var(--fg-muted)",
                fontWeight: isActive ? 600 : 500,
              } as React.CSSProperties}
            >
              <Icon
                name={item.icon}
                size={17}
                color={isActive ? "var(--accent)" : "var(--fg-subtle)"}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Household footer */}
      <div style={s.footer as React.CSSProperties}>
        <div style={s.avatarStack as React.CSSProperties}>
          {MEMBERS.map((m, i) => (
            <div key={m.id} style={{ marginLeft: i ? -7 : 0 }}>
              <Avatar member={m} size={28} ring />
            </div>
          ))}
        </div>
        <div>
          <div style={s.footerName as React.CSSProperties}>KFJN</div>
          <div style={s.footerSub as React.CSSProperties}>Household</div>
        </div>
      </div>
    </aside>
  );
}

// ── Mobile tab bar ───────────────────────────────────────────────────────────
function MobileTabBar({ active }: { active: string }) {
  const router = useRouter();
  return (
    <div style={s.mobileBar as React.CSSProperties}>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href as any)}
            style={{
              ...s.mobileTab,
              background: isActive ? "var(--fg)" : "transparent",
              border: `1px solid ${isActive ? "transparent" : "var(--border)"}`,
              color: isActive ? "var(--bg-raised)" : "var(--fg-muted)",
            } as React.CSSProperties}
          >
            <Icon name={item.icon} size={15} color={isActive ? "var(--bg-raised)" : "var(--fg-muted)"} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ activeNav, narrow }: { activeNav: string; narrow: boolean }) {
  const { syncing, linkToken, stamp, refresh, onPlaidSuccess, refreshLinkToken } = useAccounts();
  const [spinClass, setSpinClass] = useState("");
  const spinTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleRefresh = () => {
    setSpinClass("spin");
    spinTimerRef.current = setTimeout(() => setSpinClass(""), 900);
    refresh();
  };

  useEffect(() => () => clearTimeout(spinTimerRef.current), []);

  const title = NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? "Overview";

  return (
    <div style={{
      ...s.topBar,
      padding: narrow ? "20px 16px 0" : "26px 32px 0",
    } as React.CSSProperties}>
      <div>
        <h1 style={s.pageTitle as React.CSSProperties}>{title}</h1>
        <div style={s.pageSubtitle as React.CSSProperties}>
          May 2026 · synced {stamp}
        </div>
      </div>
      <div style={s.topBarActions as React.CSSProperties}>
        <button
          onClick={handleRefresh}
          disabled={syncing}
          style={s.ghostBtn as React.CSSProperties}
        >
          <Icon name="refresh" size={15} className={spinClass} />
          {syncing ? "Syncing…" : "Refresh"}
        </button>

        {linkToken ? (
          <PlaidLinkButton
            linkToken={linkToken}
            onSuccess={onPlaidSuccess}
            onExit={() => { refreshLinkToken(); }}
          />
        ) : (
          <button style={s.primaryBtn as React.CSSProperties} onClick={refreshLinkToken}>
            <Icon name="plus" size={15} color="#fff" />
            Add account
          </button>
        )}
      </div>
    </div>
  );
}

// ── Shell root ───────────────────────────────────────────────────────────────
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const narrow = useNarrow();
  const active = activeId(pathname);

  return (
    <div style={s.root as React.CSSProperties}>
      {!narrow && <Sidebar active={active} />}
      <main style={s.main as React.CSSProperties}>
        {narrow && <MobileTabBar active={active} />}
        <TopBar activeNav={active} narrow={narrow} />
        <div style={{
          ...s.content,
          padding: narrow ? 16 : "24px 32px 64px",
        } as React.CSSProperties}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "var(--bg)",
    fontFamily: "var(--font-sans)",
  },
  sidebar: {
    width: 230,
    flexShrink: 0,
    borderRight: "1px solid var(--border)",
    backgroundColor: "var(--bg-raised)",
    display: "flex",
    flexDirection: "column",
    padding: "20px 14px",
    height: "100%",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 8px 22px",
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "var(--accent)",
    display: "grid",
    placeItems: "center",
  },
  brandName: {
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: "-0.02em",
    color: "var(--fg)",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "9px 11px",
    borderRadius: 9,
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    textAlign: "left",
    width: "100%",
    transition: "background 120ms",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 8px",
    borderTop: "1px solid var(--border-subtle)",
  },
  avatarStack: { display: "flex" },
  footerName: { fontSize: 13, fontWeight: 600, color: "var(--fg)" },
  footerSub:  { fontSize: 11.5, color: "var(--fg-muted)" },
  mobileBar: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--bg-raised)",
    position: "sticky",
    top: 0,
    zIndex: 5,
  },
  mobileTab: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 13px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    flexShrink: 0,
  },
  pageTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--fg)",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "var(--fg-muted)",
    marginTop: 2,
  },
  topBarActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 13px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg-raised)",
    color: "var(--fg)",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
    transition: "border-color 120ms",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 14px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "var(--accent)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
} as const;
