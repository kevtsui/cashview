// components/shared/InstMark.tsx — Institution monogram tile.
// Chase = blue "C", Morgan Stanley = navy "MS". Fallback = first 2 chars.

import { View, Text, StyleSheet } from "react-native";
import { T } from "@/lib/tokens";

const INST_CONFIG: Record<string, { bg: string; label: string }> = {
  Chase:          { bg: "#117ACA", label: "C"  },
  "Morgan Stanley": { bg: "#00264C", label: "MS" },
};

interface InstMarkProps {
  inst: string;
  size?: number;
}

export default function InstMark({ inst, size = 34 }: InstMarkProps) {
  const config = INST_CONFIG[inst] ?? {
    bg: T.bgChip,
    label: inst.slice(0, 2).toUpperCase(),
  };

  const fontSize = size <= 26 ? 10 : size <= 34 ? 12 : 14;
  const radius = size * 0.26;

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius, backgroundColor: config.bg },
      ]}
    >
      <Text style={[styles.label, { fontSize, color: config.bg === T.bgChip ? T.fgMuted : "#fff" }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
