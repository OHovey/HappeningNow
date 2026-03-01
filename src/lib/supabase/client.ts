"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Returns a singleton Supabase client for browser-side usage.
 * Re-uses the same instance across all components to avoid
 * redundant WebSocket connections and auth state duplication.
 */
export function createBrowserClient() {
  if (browserClient) return browserClient;

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
