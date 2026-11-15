import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { lookupDefinition } from "@/lib/words/lookup";
import { isWellFormedWord, normalizeWord } from "@/lib/words/normalize";
import {
  raeUrl,
  wiktionaryUrl,
  type DefinitionGroup,
  type DefinitionResult,
} from "@/lib/words/definitions";

const CACHE = "public, s-maxage=604800, stale-while-revalidate=86400"; // 1 semana en la CDN

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

  const result = await lookupDefinition(word, base);
  if (!result.ok) {
    return NextResponse.json(
      { error: "temporalmente no disponible", raeUrl: raeUrl(word) },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return respond(result.lemma, result.groups);
}
