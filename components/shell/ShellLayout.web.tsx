// components/shell/ShellLayout.web.tsx — Command Center shell for web.
// Imports lucide-react directly (no Icon wrapper) to avoid Metro resolution issues.

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "expo-router";
import { usePlaidLink } from "react-plaid-link";
import { useAccounts } from "@/lib/AccountsContext";
import { MEMBERS } from "@/lib/data";
import { T } from "@/lib/tokens";
import Avatar from "@/components/shared/Avatar";
import Icon from "@/components/shared/Icon";

// ── Types ────────────────────────────────────────────────────────────────────
type CSSObj = React.CSSProperties;

// ── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview",    label: "Overview",    icon: "grid",         href: "/"            },
  { id: "accounts",    label: "Accounts",    icon: "building",     href: "/accounts"    },
  { id: "spending",    label: "Spending",    icon: "pie-chart",    href: "/spending"    },
  { id: "investments", label: "Investments", icon: "trending-up",  href: "/investments" },
  { id: "goals",       label: "Goals",       icon: "target",       href: "/goals"       },
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

function activeIdFromPath(pathname: string) {
  if (pathname === "/" || pathname === "") return "overview";
  return (
    NAV_ITEMS.find((n) => n.href !== "/" && pathname.startsWith(n.href))?.id ??
    "overview"
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ active }: { active: string }) {
  const router = useRouter();

  return (
    <aside style={css.sidebar}>
      {/* Brand */}
      <div style={css.brand}>
        <div style={css.brandMark}>
          <Icon name="wallet" size={17} color="#fff" />
        </div>
        <span style={css.brandName}>CashView</span>
      </div>

      {/* Nav items — flex:1 + overflow so footer stays pinned */}
      <nav style={css.nav}>
        {NAV_ITEMS.map(({ id, label, icon, href }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => router.push(href as any)}
              style={{
                ...css.navItem,
                background: isActive ? T.bgChip : "transparent",
                color: isActive ? T.fg : T.fgMuted,
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon
                name={icon}
                size={17}
                color={isActive ? T.accent : T.fgSubtle}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Household footer */}
      <div style={css.footer}>
        <div style={css.avatarStack}>
          {MEMBERS.map((m, i) => (
            <div key={m.id} style={{ marginLeft: i ? -7 : 0 }}>
              <Avatar member={m} size={28} ring />
            </div>
          ))}
        </div>
        <div>
          <div style={css.footerName}>KFJN</div>
          <div style={css.footerSub}>Household</div>
        </div>
      </div>
    </aside>
  );
}

// ── Mobile tab bar ────────────────────────────────────────────────────────────
function MobileTabBar({ active }: { active: string }) {
  const router = useRouter();
  return (
    <div style={css.mobileBar}>
      {NAV_ITEMS.map(({ id, label, icon, href }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => router.push(href as any)}
            style={{
              ...css.mobileTab,
              background: isActive ? T.fg : "transparent",
              borderColor: isActive ? "transparent" : T.border,
              color: isActive ? "#fff" : T.fgMuted,
            }}
          >
            <Icon name={icon} size={15} color={isActive ? "#fff" : T.fgMuted} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Add account button — uses usePlaidLink directly (avoids RN StyleSheet issues) ─
function AddAccountButton() {
  const { linkToken, onPlaidSuccess, refreshLinkToken } = useAccounts();

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: (publicToken, meta) => {
      onPlaidSuccess(publicToken, meta.institution ?? undefined);
    },
    onExit: () => refreshLinkToken(),
  });

  return (
    <button
      style={{
        ...css.primaryBtn,
        opacity: !linkToken ? 0.6 : 1,
        cursor: !linkToken ? "default" : "pointer",
      }}
      onClick={() => linkToken && open()}
      disabled={!ready || !linkToken}
    >
      <Icon name="plus" size={15} color="#fff" />
      Add account
    </button>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ activeNav, narrow }: { activeNav: string; narrow: boolean }) {
  const { syncing, stamp, refresh } = useAccounts();
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const handleRefresh = () => {
    setSpinning(true);
    timer.current = setTimeout(() => setSpinning(false), 900);
    refresh();
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const title = NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? "Overview";

  return (
    <div style={{ ...css.topBar, padding: narrow ? "20px 16px 12px" : "26px 32px 12px" }}>
      <div>
        <h1 style={css.pageTitle}>{title}</h1>
        <div style={css.pageSub}>May 2026 · synced {stamp}</div>
      </div>

      <div style={css.topActions}>
        <button
          onClick={handleRefresh}
          disabled={syncing}
          style={{ ...css.ghostBtn, opacity: syncing ? 0.6 : 1 }}
        >
          <Icon
            name="refresh"
            size={15}
            color={T.fg}
            style={{ animation: spinning ? "spin 0.85s cubic-bezier(0.65,0,0.35,1)" : "none" }}
          />
          {syncing ? "Syncing…" : "Refresh"}
        </button>
        <AddAccountButton />
      </div>
    </div>
  );
}

// ── Shell root ────────────────────────────────────────────────────────────────
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const narrow = useNarrow();
  const active = activeIdFromPath(pathname);

  return (
    <div style={css.root}>
      {!narrow && <Sidebar active={active} />}
      <main style={css.main}>
        {narrow && <MobileTabBar active={active} />}
        <TopBar activeNav={active} narrow={narrow} />
        <div
          style={{
            ...css.content,
            padding: narrow ? 16 : "24px 32px 64px",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

// ── CSS objects (applied to HTML elements — CSS vars resolve fine here) ────────
const FONT = '"Noto Sans JP", system-ui, -apple-system, sans-serif';

const css: Record<string, CSSObj> = {
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: T.bg,
    fontFamily: FONT,
    color: T.fg,
  },
  sidebar: {
    width: 230,
    flexShrink: 0,
    borderRight: `1px solid ${T.border}`,
    backgroundColor: T.bgRaised,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    // No top-level padding — each section handles its own
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 14px 22px",
    flexShrink: 0,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: T.accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: {
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: "-0.02em",
    color: T.fg,
    fontFamily: FONT,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "0 14px 4px",
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
    fontFamily: FONT,
    textAlign: "left",
    width: "100%",
    transition: "background 120ms",
  },
  footer: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
    // Explicit padding — bottom guaranteed inside sidebar viewport
    padding: "12px 22px 20px",
    borderTop: `1px solid ${T.borderSubtle}`,
  },
  avatarStack: { display: "flex" },
  footerName: { fontSize: 13, fontWeight: 600, color: T.fg, fontFamily: FONT },
  footerSub: { fontSize: 11.5, color: T.fgMuted, fontFamily: FONT },
  mobileBar: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    padding: "12px 16px",
    borderBottom: `1px solid ${T.border}`,
    backgroundColor: T.bgRaised,
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
    border: `1px solid ${T.border}`,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: FONT,
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
    backgroundColor: T.bg,
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
    color: T.fg,
    fontFamily: FONT,
  },
  pageSub: {
    fontSize: 13,
    color: T.fgMuted,
    marginTop: 2,
    fontFamily: FONT,
  },
  topActions: {
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
    border: `1px solid ${T.border}`,
    backgroundColor: T.bgRaised,
    color: T.fg,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: FONT,
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
    backgroundColor: T.accent,
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: FONT,
    whiteSpace: "nowrap",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
};
