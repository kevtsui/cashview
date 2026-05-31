// lib/supabase.ts
// Single Supabase client shared across the app.
// Uses AsyncStorage on native, localStorage on web (Supabase's default).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example → .env and fill in your values."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // On native: persist session in AsyncStorage (survives app restarts).
    // On web: use default localStorage-based storage.
    storage: Platform.OS !== "web" ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl handles the magic-link callback on web.
    // On native, deep-link handling in the root layout does this instead.
    detectSessionInUrl: Platform.OS === "web",
  },
});
