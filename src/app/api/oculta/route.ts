import { NextResponse } from "next/server";
import { z } from "zod";
import { currentPlayer } from "@/lib/oculta/player";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { dayKey, dayNumber, foldWord, isFoldedWord, isPlayableDay, MAX_ATTEMPTS, scoreGuess } from "@/lib/oculta/game";
import { secretWordFor } from "@/lib/oculta/secret";
import { lookupDefinition } from "@/lib/words/lookup";
import { maskWord, pickDefinition } from "@/lib/juegos/significa-text";
import { raeUrl, wiktionaryUrl } from "@/lib/words/definitions";
import type { GuessResponse, OcultaState, RankingRow, Reveal, Row } from "@/lib/oculta/types";

/**
 * «La palabra oculta».
 * GET  /api/oculta → estado del día (y el progreso de quien tiene cuenta).
 * POST /api/oculta { day, action: "guess", guess } | { day, action: "hint" }
 *      Sin cuenta, el navegador manda también `used` (intentos ya gastados) para saber cuándo se acaba.
 * La palabra nunca se envía al navegador hasta que la partida termina.
 */
const noStore = { "Cache-Control": "no-store" };
const reply = (body: GuessResponse | OcultaState, status = 200) => NextResponse.json(body, { status, headers: noStore });

const Body = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  action: z.enum(["guess", "hint"]),
  guess: z.string().max(40).optional(),
  used: z.number().int().min(0).max(MAX_ATTEMPTS).optional(),
});

async function hintFor(secret: string): Promise<string | null> {
  const r = await lookupDefinition(secret, null);
  if (!r.ok) return null;
  const def = pickDefinition(r.groups.flatMap((g) => g.senses.map((s) => s.text)), secret);
  return def ? maskWord(def, secret) : null;
}

async function revealFor(secret: string): Promise<Reveal> {
  const r = await lookupDefinition(secret, null);
  const senses = r.ok ? r.groups.flatMap((g) => g.senses.map((s) => s.text)).slice(0, 3) : [];
  return { word: secret, senses, sourceUrl: senses.length ? wiktionaryUrl(secret) : null, raeUrl: raeUrl(secret) };
}

async function loadRanking(day: string): Promise<{ ranking: RankingRow[]; solvers: number }> {
  const { data } = await getAdminSupabase().rpc("hidden_word_ranking", { p_day: day, p_limit: 10 });
  const rows = (data ?? []) as (RankingRow & { total: number })[];
  const ranking = rows.map((r) => ({
    pos: Number(r.pos), username: r.username, country: r.country, attempts: r.attempts, hints: r.hints, solved_at: r.solved_at,
  }));
  return { ranking, solvers: Number(rows[0]?.total ?? 0) };
}

async function positionOf(day: string, userId: string): Promise<number | null> {
  const db = getAdminSupabase();
  const { data: mine } = await db.from("hidden_word_solves").select("solved_at").eq("day", day).eq("user_id", userId).maybeSingle();
  if (!mine) return null;
  // Fuera de plazo (palabra de un día anterior): no entra en la clasificación.
  if (Date.parse(mine.solved_at) >= Date.parse(`${day}T00:00:00Z`) + 86_400_000) return null;
  const { count } = await db
    .from("hidden_word_solves")
    .select("user_id", { count: "exact", head: true })
    .eq("day", day)
    .lte("solved_at", mine.solved_at);
  return count ?? null;
}

async function loadPlays(day: string, userId: string) {
  const { data } = await getAdminSupabase()
    .from("hidden_word_plays")
    .select("n, guess")
    .eq("day", day)
    .eq("user_id", userId)
    .order("n");
  return (data ?? []) as { n: number; guess: string | null }[];
}

export async function GET(request: Request) {
  const asked = new URL(request.url).searchParams.get("day");
  const day = asked ?? dayKey();
  if (!isPlayableDay(day)) return reply({ status: "invalid" }, 400);
  const secret = foldWord(secretWordFor(day));
  const [player, rank] = await Promise.all([currentPlayer(), loadRanking(day)]);

  let me: OcultaState["me"] = null;
  if (player) {
    const plays = await loadPlays(day, player.id);
    const rows: Row[] = plays.map((p) => ({ guess: p.guess, marks: p.guess ? scoreGuess(p.guess, secret) : null }));
    const solved = plays.some((p) => p.guess === secret);
    const finished = solved || plays.length >= MAX_ATTEMPTS;
    const usedHint = plays.some((p) => p.guess === null);
    me = {
      rows,
      solved,
      finished,
      hint: usedHint ? await hintFor(secretWordFor(day)) : null,
      reveal: finished ? await revealFor(secretWordFor(day)) : null,
      position: solved ? await positionOf(day, player.id) : null,
    };
  }

  return reply({ day, number: dayNumber(day), today: day === dayKey(), length: [...secret].length, maxAttempts: MAX_ATTEMPTS, me, ...rank });
}

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ status: "invalid" }, 400);
  const { action, used: guestUsed = 0 } = parsed.data;

  // Hoy o un día anterior (las palabras pasadas también se pueden jugar).
  const day = parsed.data.day;
  if (!isPlayableDay(day)) return reply({ status: "invalid" }, 400);
  const word = secretWordFor(day);
  const secret = foldWord(word);
  const player = await currentPlayer();
  const db = getAdminSupabase();

  // Intentos ya gastados (con cuenta los cuenta el servidor; sin cuenta, el navegador).
  const plays = player ? await loadPlays(day, player.id) : null;
  const used = plays ? plays.length : guestUsed;
  if ((plays && plays.some((p) => p.guess === secret)) || used >= MAX_ATTEMPTS) return reply({ status: "finished" });

  // ── Pista: la definición, gasta un intento (solo una, y nunca el último) ──
  if (action === "hint") {
    if (plays?.some((p) => p.guess === null)) {
      const hint = await hintFor(word);
      return hint ? reply({ status: "hint", hint, finished: false }) : reply({ status: "no_hint" });
    }
    if (used >= MAX_ATTEMPTS - 1) return reply({ status: "no_hint" });
    const hint = await hintFor(word);
    if (!hint) return reply({ status: "no_hint" });
    if (player) {
      const { error } = await db.from("hidden_word_plays").insert({ day, user_id: player.id, n: used + 1, guess: null });
      if (error) return reply({ status: "retry" });
    }
    return reply({ status: "hint", hint, finished: false });
  }

  // ── Intento ──
  const guess = foldWord((parsed.data.guess ?? "").trim());
  if (!isFoldedWord(guess)) return reply({ status: "invalid" });
  if ([...guess].length !== [...secret].length) return reply({ status: "wrong_length" });
  if (plays?.some((p) => p.guess === guess)) return reply({ status: "repeated" });
  if (guess !== secret) {
    const { data: found, error } = await db.rpc("dictionary_lookup_folded", { p_folded: guess });
    if (error) return reply({ status: "retry" }); // fallo momentáneo: no culpar a la palabra
    if (!found) return reply({ status: "not_in_dictionary" });
  }

  const n = used + 1;
  if (player) {
    const { error } = await db.from("hidden_word_plays").insert({ day, user_id: player.id, n, guess });
    if (error) return reply({ status: "retry" });
  }

  const marks = scoreGuess(guess, secret);
  const solved = guess === secret;
  const finished = solved || n >= MAX_ATTEMPTS;
  let position: number | null = null;
  if (solved && player) {
    const hints = plays!.filter((p) => p.guess === null).length;
    await db.from("hidden_word_solves").insert({ day, user_id: player.id, attempts: n, hints });
    position = await positionOf(day, player.id);
  }
  return reply({ status: "ok", marks, solved, finished, reveal: finished ? await revealFor(word) : null, position });
}
