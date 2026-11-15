import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type Player = { id: string } | null;

/** Jugador con cuenta y perfil (y no bloqueado); si no, se juega como invitado. */
export async function currentPlayer(): Promise<Player> {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: profile } = await getAdminSupabase().from("profiles").select("id, banned_at").eq("id", id).maybeSingle();
  return profile && !profile.banned_at ? { id } : null;
}

