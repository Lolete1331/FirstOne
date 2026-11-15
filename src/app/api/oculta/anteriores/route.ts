import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { currentPlayer } from "@/lib/oculta/player";
import { dayKey, dayNumber, LAUNCH_DAY, MAX_ATTEMPTS, pastDays } from "@/lib/oculta/game";
import type { ArchiveState } from "@/lib/oculta/types";

/** GET /api/oculta/anteriores → días anteriores, cuánta gente encontró cada palabra y (con cuenta) cómo te fue. */
export async function GET() {
  const today = dayKey();
  const days = pastDays(today);
  const db = getAdminSupabase();
  const [player, counts] = await Promise.all([
    currentPlayer(),
    days.length ? db.rpc("hidden_word_day_counts", { p_from: LAUNCH_DAY, p_to: days[0] }) : Promise.resolve({ data: [] }),
  ]);
  const solvers = new Map(((counts.data ?? []) as { day: string; solvers: number }[]).map((c) => [c.day, Number(c.solvers)]));

  let mine: ArchiveState["mine"] = null;
  if (player) {
    mine = {};
    const { data: plays } = await db.from("hidden_word_plays").select("day, n").eq("user_id", player.id).lt("day", today);
    const { data: solves } = await db.from("hidden_word_solves").select("day, attempts").eq("user_id", player.id).lt("day", today);
    const used = new Map<string, number>();
    for (const p of plays ?? []) used.set(p.day, Math.max(used.get(p.day) ?? 0, p.n));
    for (const [day, n] of used) mine[day] = { solved: false, attempts: n, finished: n >= MAX_ATTEMPTS };
    for (const s of solves ?? []) mine[s.day] = { solved: true, attempts: s.attempts, finished: true };
  }

  const body: ArchiveState = {
    days: days.map((day) => ({ day, number: dayNumber(day), solvers: solvers.get(day) ?? 0 })),
    mine,
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
