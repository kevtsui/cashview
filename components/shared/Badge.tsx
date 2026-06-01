// components/shared/Badge.tsx — Pill status badge.

import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";

type Tone = "neutral" | "positive" | "negative" | "invest" | "warning";

const TONE_STYLES: Record<Tone, { bg: string; color: string }> = {
  neutral:  { bg: T.bgChip,       color: T.fgMuted  },
  positive: { bg: T.positiveSoft, color: T.positive  },
  negative: { bg: T.negativeSoft, color: T.negative  },
  invest:   { bg: T.investSoft,   color: T.invest    },
  warning:  { bg: "#FAEFD8",      color: "#C28722"   },
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
}

export default function Badge({ tone = "neutral", children }: BadgeProps) {
  const { bg, color } = TONE_STYLES[tone];
  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
