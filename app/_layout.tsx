// app/_layout.tsx
// Root layout: bootstraps auth state and routes between (auth) and (app).

import { useEffect } from "react";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useAuth, AuthProvider } from "@/lib/useAuth";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Note: on web, magic-link sessions are picked up automatically via
  // detectSessionInUrl: true in lib/supabase.ts — no manual handling needed.
  // Native deep-link handling (cashview://) will be added when building for iOS/Android.

  // Route guard: redirect based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [session, loading, segments]);

  // Hide splash screen once auth state is known
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
