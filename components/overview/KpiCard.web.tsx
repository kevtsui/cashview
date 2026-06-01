// components/overview/KpiCard.web.tsx — Web KPI card matching the design reference.
// Renders the $ as a small superscript beside the large tabular number.

import React from "react";

interface KpiCardProps {
  label: string;
  value: number;
  delta?: string;
  deltaTone?: "positive" | "negative" | "invest" | "neutral";
  sparkline?: React.ReactNode;
  valueTone?: string;
  cents?: boolean;
}

const DELTA_COLORS = {
  positive: "var(--positive)",
  negative: "var(--negative)",
  invest:   "var(--invest)",
  neutral:  "var(--fg-muted)",
};

function formatNumber(value: number, cents: boolean): { sign: string; abs: string } {
  const sign = value < 0 ? "−" : "";
  const abs = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(Math.abs(value));
  return { sign, abs };
}

export default function KpiCard({
  label,
  value,
  delta,
  deltaTone = "positive",
  sparkline,
  valueTone,
  cents = false,
}: KpiCardProps) {
  const { sign, abs } = formatNumber(value, cents);
  const color = valueTone ?? (value < 0 ? "var(--negative)" : "var(--fg)");

  return (
    <div style={s.card}>
      <p style={s.eyebrow}>{label}</p>

      <div style={s.valueRow}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 1, color, fontFamily: "var(--font-sans)" }}>
          {sign && <span style={s.sign}>{sign}</span>}
          <span style={s.dollar}>$</span>
          <span style={{ ...s.number, color }}>{abs}</span>
        </div>
        {sparkline && <div style={s.spark}>{sparkline}</div>}
      </div>

      {delta && (
        <p style={{ ...s.delta, color: DELTA_COLORS[deltaTone] }}>{delta}</p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "var(--bg-raised)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    padding: 18,
    minWidth: 168,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    transition: "border-color 120ms",
  },
  eyebrow: {
    margin: "0 0 12px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--fg-muted)",
    fontFamily: "var(--font-sans)",
  },
  valueRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  sign: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1,
    marginRight: 1,
  },
  dollar: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    alignSelf: "flex-start",
    marginTop: 3,
  },
  number: {
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  spark: {
    marginBottom: 2,
    flexShrink: 0,
  },
  delta: {
    margin: "8px 0 0",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
  },
};
