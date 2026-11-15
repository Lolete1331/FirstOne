import "server-only";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { parseWiktionary, type DefinitionGroup } from "@/lib/words/definitions";

const UA = "FirstOne/1.0 (https://firstone.es; juego de palabras)";

type Fetched = { ok: true; groups: DefinitionGroup[] } | { ok: false };

/** ok:false = Wikcionario no ha respondido bien (límite, caída…): no se guarda nada. */
async function fetchWiktionary(word: string): Promise<Fetched> {
  const url = new URL("https://es.wiktionary.org/w/api.php");
  url.search = new URLSearchParams({
    action: "parse",
    page: word,
    prop: "wikitext",
    format: "json",
    formatversion: "2",
    redirects: "1",
  }).toString();
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { parse?: { wikitext?: string }; error?: { code?: string } };
    if (data.error?.code === "missingtitle") return { ok: true, groups: [] }; // la página no existe
    if (!data.parse?.wikitext) return { ok: false };
    return { ok: true, groups: parseWiktionary(data.parse.wikitext) };
  } catch {
    return { ok: false };
  }
}

export type Lookup = { ok: true; lemma: string; groups: DefinitionGroup[] } | { ok: false };

/**
 * Significado de una palabra del diccionario: primero la caché (word_definitions), después Wikcionario
 * (la palabra; si es un femenino generado sin entrada propia, su masculino). Las respuestas buenas se guardan.
 * `base` = masculino si la palabra es un femenino generado.
 */
export async function lookupDefinition(word: string, base: string | null): Promise<Lookup> {
  const db = getAdminSupabase();
  const { data: cached } = await db.from("word_definitions").select("lemma, groups").eq("word", word).maybeSingle();
  if (cached) return { ok: true, lemma: cached.lemma, groups: cached.groups as DefinitionGroup[] };

  let lemma = word;
  let result = await fetchWiktionary(word);
  if (result.ok && result.groups.length === 0 && base) {
    const fromBase = await fetchWiktionary(base);
    if (!fromBase.ok) result = fromBase;
    else if (fromBase.groups.length) {
      result = fromBase;
      lemma = base;
    }
  }
  if (!result.ok) return { ok: false };

  try {
    await db.from("word_definitions").upsert({ word, lemma, groups: result.groups, source: result.groups.length ? "wiktionary" : "none" });
  } catch (e) {
    console.error("definiciones: no se pudo guardar en caché", e);
  }
  return { ok: true, lemma, groups: result.groups };
}
