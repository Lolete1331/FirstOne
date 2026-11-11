/**
 * Lectura de definiciones de Wikcionario en español (contenido libre, CC BY-SA 4.0).
 * Recibe el wikitexto de una página y devuelve las acepciones de la sección española.
 */

export type Sense = { n: number; text: string; fields: string[] };
export type DefinitionGroup = { pos: string; senses: Sense[] };
export type DefinitionResult = {
  word: string;
  /** Palabra cuyas definiciones se muestran (p. ej. «abogado» para «abogada»). */
  lemma: string;
  groups: DefinitionGroup[];
  source: "wiktionary" | "none";
  sourceUrl: string | null;
  raeUrl: string;
  /** Si es un femenino generado: «Femenino de …». */
  note?: string;
};

const MAX_SENSES = 8;

/** Quita marcado wiki y plantillas dejando texto legible. */
export function cleanWikiText(s: string): string {
  let t = s;
  t = t.replace(/<ref[^>]*\/>/g, "").replace(/<ref[\s\S]*?<\/ref>/g, "").replace(/<[^>]+>/g, "");
  // Plantillas que conservan un argumento visible
  t = t.replace(/\{\{plm\|([^{}|]+)[^{}]*\}\}/g, (_, x: string) => x.charAt(0).toUpperCase() + x.slice(1));
  t = t.replace(/\{\{l\+?\|[a-z-]+\|([^{}|]+)[^{}]*\}\}/g, "$1");
  t = t.replace(/\{\{(?:impropia|nombre científico|nc)\|([^{}|]+)[^{}]*\}\}/g, "$1");
  // Resto de plantillas: fuera (de dentro hacia fuera por si hay anidadas)
  for (let i = 0; i < 5 && /\{\{[^{}]*\}\}/.test(t); i++) t = t.replace(/\{\{[^{}]*\}\}/g, "");
  // Enlaces internos
  t = t.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1");
  // Enlaces externos [url texto]
  t = t.replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1").replace(/\[https?:\/\/\S+\]/g, "");
  t = t.replace(/'''?/g, "");
  t = t.replace(/\s+/g, " ").replace(/\s+([.,;:])/g, "$1").replace(/^[\s,;:.]+/, "").trim();
  return t;
}

/** Nombre legible del tipo de palabra a partir del título de sección ("=== {{sustantivo masculino|es}} ==="). */
function posFromHeading(heading: string): string | null {
  const m = heading.match(/\{\{([^|}]+)/);
  const name = (m ? m[1] : heading).trim();
  if (/^(etimolog|traduc|véase|vease|información|referencias|locuciones|conjugación|forma)/i.test(name)) return null;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Extrae las acepciones españolas del wikitexto de una página de Wikcionario. */
export function parseWiktionary(wikitext: string): DefinitionGroup[] {
  const lines = wikitext.split("\n");
  const start = lines.findIndex((l) => /^==\s*\{\{lengua\|es\}\}\s*==\s*$/.test(l.trim()));
  if (start === -1) return [];
  const groups: DefinitionGroup[] = [];
  let current: DefinitionGroup | null = null;
  let total = 0;

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^==\s*\{\{lengua\|/.test(line)) break; // siguiente idioma
    const heading = line.match(/^={3,4}\s*(.+?)\s*={3,4}$/);
    if (heading) {
      const pos = posFromHeading(heading[1]);
      current = pos ? { pos, senses: [] } : null;
      if (current) groups.push(current);
      continue;
    }
    const def = line.match(/^;\s*(\d+)\s*((?:\{\{[^{}]*\}\}\s*)*)\s*:\s*(.+)$/);
    if (def && current && total < MAX_SENSES) {
      const fields = [...def[2].matchAll(/\{\{csem\|([^{}]+)\}\}/g)].flatMap((m) => m[1].split("|").map((x) => x.trim())).filter(Boolean);
      const text = cleanWikiText(def[3]);
      if (text.length > 1) {
        current.senses.push({ n: Number(def[1]), text, fields });
        total++;
      }
    }
  }
  return groups.filter((g) => g.senses.length > 0);
}

export const raeUrl = (word: string) => `https://dle.rae.es/${encodeURIComponent(word)}`;
export const wiktionaryUrl = (word: string) => `https://es.wiktionary.org/wiki/${encodeURIComponent(word)}`;
