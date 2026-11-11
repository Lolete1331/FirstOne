import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isWellFormedWord, normalizeWord } from "@/lib/words/normalize";
import {
  parseWiktionary,
  raeUrl,
  wiktionaryUrl,
  type DefinitionGroup,
  type DefinitionResult,
} from "@/lib/words/definitions";

const UA = "FirstOne/1.0 (https://firstone.es; juego de palabras)";
const CACHE = "public, s-maxage=604800, stale-while-revalidate=86400"; // 1 semana en la CDN

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

/** GET /api/define?word=girasol → significado de la palabra (Wikcionario) + enlace a la RAE. */
export async function GET(request: Request) {
  const word = normalizeWord(new URL(request.url).searchParams.get("word") ?? "");
  if (!isWellFormedWord(word)) return NextResponse.json({ error: "palabra no válida" }, { status: 400 });

  // Solo palabras de nuestro diccionario (evita usar esto como proxy de cualquier cosa).
  const supabase = await getServerSupabase();
  const { data: entry, error: dbError } = await supabase.from("dictionary_words").select("source").eq("word", word).maybeSingle();
  if (dbError) console.error("define: diccionario", dbError);
  if (!entry) return NextResponse.json({ error: "no está en el diccionario" }, { status: 404 });

  const base = entry.source?.startsWith("femenino:") ? entry.source.slice("femenino:".length) : null;
  const respond = (lemma: string, groups: DefinitionGroup[]) =>
    NextResponse.json(
      {
        word,
        lemma,
        groups,
        source: groups.length ? "wiktionary" : "none",
        sourceUrl: groups.length ? wiktionaryUrl(lemma) : null,
        raeUrl: raeUrl(word),
        ...(base ? { note: `Femenino de «${base}»` } : {}),
      } satisfies DefinitionResult,
      { headers: { "Cache-Control": CACHE } },
    );

  // 1) Caché propia en la base de datos
  const { data: cached } = await supabase.from("word_definitions").select("lemma, groups").eq("word", word).maybeSingle();
  if (cached) return respond(cached.lemma, cached.groups as DefinitionGroup[]);

  // 2) Wikcionario (la palabra; si es un femenino generado y no hay nada, su masculino)
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
  if (!result.ok) {
    return NextResponse.json(
      { error: "temporalmente no disponible", raeUrl: raeUrl(word) },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  // 3) Guardar para siempre (solo respuestas buenas)
  try {
    await getAdminSupabase()
      .from("word_definitions")
      .upsert({ word, lemma, groups: result.groups, source: result.groups.length ? "wiktionary" : "none" });
  } catch (e) {
    console.error("define: no se pudo guardar en caché", e);
  }
  return respond(lemma, result.groups);
}
