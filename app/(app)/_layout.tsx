// app/(app)/_layout.tsx — Protected layout.
// Wraps all authenticated views in the Command Center shell and AccountsContext.
// Auth guard is in app/_layout.tsx (root).

import { Slot } from "expo-router";
import { AccountsProvider } from "@/lib/AccountsContext";
import ShellLayout from "@/components/shell/ShellLayout";

export default function AppLayout() {
  return (
    <AccountsProvider>
      <ShellLayout>
        <Slot />
      </ShellLayout>
    </AccountsProvider>
  );
}
