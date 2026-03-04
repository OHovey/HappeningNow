import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Creates a new Supabase client for server-side usage.
 * A fresh client is created per request to avoid sharing state
 * across concurrent server requests (no singleton on server).
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
