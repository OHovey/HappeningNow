import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a new Supabase client for server-side usage.
 * A fresh client is created per request to avoid sharing state
 * across concurrent server requests (no singleton on server).
 */
export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
