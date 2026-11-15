import { foldWord } from "@/lib/oculta/game";

/** Quita la palabra (y sus derivados evidentes) de una definición, para no regalar la respuesta. */
export function maskWord(text: string, word: string): string {
  const root = foldWord(word).slice(0, Math.max(4, [...word].length - 2));
  return text.replace(/[\p{L}]+/gu, (w) => (foldWord(w).startsWith(root) ? "…" : w));
}

/** Recorta una definición larga por un límite de palabra. */
export function shorten(text: string, max = 150): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

/** ¿La definición contiene la palabra o una de su familia? */
export function mentionsWord(text: string, word: string): boolean {
  return maskWord(text, word) !== text;
}

/**
 * Elige una definición que se entienda sin la palabra:
 *  - descarta las que la contienen («Trapisondista.» para «trapisonda») si hay otras;
 *  - prefiere una acepción completa (25+ letras);
 *  - si solo hay sinónimos cortos, los junta: «Riña, alboroto, embuste, marullo.»
 */
export function pickDefinition(senses: string[], word: string): string | null {
  const clean = senses.map((s) => s.trim().replace(/\s+/g, " ")).filter((s) => s.length >= 3 && !/^(Forma|Plural|Femenino|Variante|Grafía) /i.test(s));
  const withoutWord = clean.filter((s) => !mentionsWord(s, word));
  const pool = withoutWord.length ? withoutWord : clean;
  if (!pool.length) return null;
  const full = pool.find((s) => s.length >= 25);
  if (full) return full;
  const parts = pool.slice(0, 4).map((s, i) => {
    const p = s.replace(/[.;:]+$/, "");
    return i === 0 ? p : p.charAt(0).toLocaleLowerCase("es") + p.slice(1);
  });
  return `${parts.join(", ")}.`;
}
