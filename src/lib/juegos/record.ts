"use client";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { notifyActivity } from "@/lib/hooks/use-my-streak";

export type GameKey = "sopa" | "significa" | "existe" | "refranes" | "intrusa" | "b-o-v" | "ahorcado" | "anagramas";

/**
 * Guarda el resultado de un juego en la cuenta (para rachas, insignias, perfil y grupos).
 * Sin sesión no hace nada; si falla, el juego sigue igual (el progreso también está en el navegador).
 */
export async function recordGameResult(game: GameKey, day: string, score: number, total: number, seconds?: number) {
  if (!isSupabaseConfigured) return;
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.rpc("record_game_result", { p_game: game, p_day: day, p_score: score, p_total: total, p_seconds: seconds ?? null });
    notifyActivity();
  } catch {
    /* sin conexión: no pasa nada */
  }
}
