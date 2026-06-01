// components/shared/Money.web.tsx — Faithful port of the design's Money component.
// Splits: [−] [$small] [whole] [.cents_small] — matching the reference exactly.

import React from "react";

interface MoneyProps {
  value: number;
  size?: number;
  cents?: boolean;
  weight?: number;
  color?: string;
  muted?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function formatMoney(value: number, cents = true): string {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(abs);
  return value < 0 ? `−${formatted}` : formatted;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export default function Money({
  value,
  size = 32,
  cents = true,
  weight = 600,
  color,
  muted = false,
  className = "",
  style,
}: MoneyProps) {
  const neg = value < 0;
  const abs = Math.abs(value);
  const whole = Math.floor(abs).toLocaleString("en-US");
  const frac = Math.round((abs - Math.floor(abs)) * 100)
    .toString()
    .padStart(2, "0");

  return (
    <span
      className={`tnum ${className}`}
      style={{
        fontWeight: weight,
        color: color ?? "inherit",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {neg && <span style={{ marginRight: 1 }}>−</span>}
      <span
        style={{
          fontSize: size * 0.62,
          verticalAlign: "top",
          marginRight: 1,
          opacity: 0.8,
        }}
      >
        $
      </span>
      <span style={{ fontSize: size }}>{whole}</span>
      {cents && (
        <span
          style={{
            fontSize: size * 0.5,
            opacity: muted ? 0.55 : 0.7,
            marginLeft: 1,
          }}
        >
          .{frac}
        </span>
      )}
    </span>
  );
}
