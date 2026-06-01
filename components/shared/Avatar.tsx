// components/shared/Avatar.tsx — Colored initial circle for a household member.

import { View, Text, StyleSheet } from "react-native";
import type { Member } from "@/lib/data";

interface AvatarProps {
  member: Member;
  size?: number;
  ring?: boolean;
}

export default function Avatar({ member, size = 28, ring = false }: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: member.color,
          borderWidth: ring ? 2 : 0,
          borderColor: "#fff",
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
        {member.initials}
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
  initial: {
    color: "#fff",
    fontWeight: "700",
  },
});
