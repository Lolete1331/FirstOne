import "server-only";
import { cacheLife } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isWellFormedWord, normalizeWord } from "@/lib/words/normalize";
import type { DefinitionGroup } from "@/lib/words/definitions";

export type WordYear = { year: number; total: number; owner: string | null; owner_country: string | null; owner_claimed_at: string };
export type WordInfo = { word: string; exists: boolean; history: WordYear[]; senses: string[]; lemma: string | null };

/**
 * Datos públicos de una palabra para su página y su imagen para compartir.
 * Se guardan en caché un minuto (la página puede recibir muchas visitas desde redes).
 */
export async function getWordInfo(raw: string): Promise<WordInfo> {
  "use cache";
  cacheLife("minutes");
  const word = normalizeWord(raw);
  if (!isWellFormedWord(word)) return { word, exists: false, history: [], senses: [], lemma: null };
  const db = getAdminSupabase();
  const [{ data: entry }, { data: hidden }, { data: history }, { data: def }] = await Promise.all([
    db.from("dictionary_words").select("word").eq("word", word).maybeSingle(),
    db.from("hidden_words").select("word").eq("word", word).maybeSingle(),
    db.rpc("word_history", { p_word: word }),
    db.from("word_definitions").select("lemma, groups").eq("word", word).maybeSingle(),
  ]);
  const groups = (def?.groups ?? []) as DefinitionGroup[];
  return {
    word,
    // Las palabras ocultas por el admin (ofensivas) no tienen página pública.
    exists: Boolean(entry) && !hidden,
    history: (history ?? []) as WordYear[],
    senses: groups.flatMap((g) => g.senses.map((s) => s.text)).slice(0, 3),
    lemma: def?.lemma ?? null,
  };
}
