import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { dayKey, isPlayableDay } from "@/lib/oculta/game";
import { fitsLetters, lettersFor, MIN_LEN } from "@/lib/juegos/anagramas";

const cache = new Map<string, { letters: string[]; words: string[]; display: Record<string, string> }>();

/** GET /api/anagramas?day=AAAA-MM-DD → letras del día, palabras válidas (sin tildes) y cómo se escribe cada una. */
export async function GET(request: Request) {
  const day = new URL(request.url).searchParams.get("day") ?? dayKey();
  if (!isPlayableDay(day)) return NextResponse.json({ error: "día no válido" }, { status: 400 });
  let hit = cache.get(day);
  if (!hit) {
    const letters = lettersFor(day);
    const { data, error } = await getAdminSupabase().rpc("anagram_candidates", { p_letters: letters.join("") });
    if (error) return NextResponse.json({ error: "temporalmente no disponible" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const rows = (data as { word: string; folded: string }[]).filter((r) => [...r.folded].length >= MIN_LEN && fitsLetters(r.folded, letters));
    // Cómo se escribe de verdad cada palabra (con tildes), para mostrarla y buscar su significado.
    const display: Record<string, string> = {};
    for (const r of rows) if (!display[r.folded] || r.word === r.folded) display[r.folded] = r.word;
    const words = Object.keys(display).sort((a, b) => [...a].length - [...b].length || a.localeCompare(b, "es"));
    hit = { letters, words, display };
    cache.set(day, hit);
  }
  return NextResponse.json({ day, ...hit }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
