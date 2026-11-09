"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_COOKIE_NAME, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

let client: SupabaseClient | undefined;

/** Cliente de Supabase para el navegador (un único ejemplar). */
export function getSupabase(): SupabaseClient {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: { name: AUTH_COOKIE_NAME },
  });
  return client;
}
