// components/shared/Money.tsx — Formatted currency amount.
// Works on both web and native.

import { Text, TextStyle } from "react-native";
import { T } from "@/lib/tokens";

interface MoneyProps {
  value: number;
  size?: number;
  weight?: TextStyle["fontWeight"];
  color?: string;
  cents?: boolean;
  style?: TextStyle;
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function Money({ value, size = 15, weight = "600", color, cents = true, style }: MoneyProps) {
  const isNegative = value < 0;
  const resolvedColor = color ?? (isNegative ? T.negative : T.fg);

  return (
    <Text
      style={[
        {
          fontSize: size,
          fontWeight: weight,
          color: resolvedColor,
          fontVariant: ["tabular-nums"],
        },
        style,
      ]}
    >
      {formatMoney(value, cents)}
    </Text>
  );
}
