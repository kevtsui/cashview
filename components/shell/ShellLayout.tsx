// components/shell/ShellLayout.tsx — Native fallback for the shell.
// The web Command Center layout doesn't translate directly to native.
// This simple wrapper is a placeholder until a native shell PR is built.

import { View } from "react-native";
import { T } from "@/lib/tokens";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {children}
    </View>
  );
}
