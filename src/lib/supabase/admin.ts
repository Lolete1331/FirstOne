import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Cliente con la clave secreta (rol service_role). SOLO en el servidor.
 * Es el único que puede ejecutar claim_word().
 */
export function getAdminSupabase() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
