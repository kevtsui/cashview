// components/overview/KpiCard.web.tsx — KPI card matching the design reference.
// Uses the split-$ Money component and Badge for delta — exactly as in the prototype.

import React from "react";
import Money from "@/components/shared/Money";
import { T } from "@/lib/tokens";

interface KpiCardProps {
  label: string;
  value: number;
  delta?: string;
  deltaTone?: "positive" | "negative" | "invest" | "neutral";
  sparkline?: React.ReactNode;
  valueTone?: string;
  cents?: boolean;
}

const BADGE_TONES: Record<string, { bg: string; color: string }> = {
  positive: { bg: T.positiveSoft, color: T.positive  },
  negative: { bg: T.negativeSoft, color: T.negative  },
  invest:   { bg: T.investSoft,   color: T.invest    },
  neutral:  { bg: T.bgChip,       color: T.fgMuted   },
};

export default function KpiCard({
  label,
  value,
  delta,
  deltaTone = "positive",
  sparkline,
  valueTone,
  cents = false,
}: KpiCardProps) {
  const { bg: deltaBg, color: deltaColor } = BADGE_TONES[deltaTone] ?? BADGE_TONES.neutral;

  return (
    <div style={s.card}>
      <p style={s.eyebrow}>{label}</p>

      <div style={s.valueRow}>
        <Money
          value={value}
          size={23}
          cents={cents}
          weight={600}
          color={valueTone}
        />
        {sparkline && <div style={s.spark}>{sparkline}</div>}
      </div>

      {delta && (
        <div style={{ marginTop: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 999,
              background: deltaBg,
              color: deltaColor,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}

const FONT = '"Noto Sans JP", system-ui, -apple-system, sans-serif';

const s: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: T.bgRaised,
    borderRadius: T.radiusLg,
    border: `1px solid ${T.border}`,
    padding: 18,
    minWidth: 168,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    fontFamily: FONT,
    transition: "border-color 120ms",
    cursor: "default",
  },
  eyebrow: {
    margin: "0 0 12px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: T.fgMuted,
    fontFamily: FONT,
  },
  valueRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  spark: {
    marginBottom: 2,
    flexShrink: 0,
  },
};
