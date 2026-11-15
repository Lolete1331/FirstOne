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

/** Primera acepción útil de una lista de definiciones. */
export function firstUsefulSense(senses: string[]): string | null {
  return senses.find((s) => s.trim().length >= 12 && !/^(Forma|Plural|Femenino|Variante|Grafía) /i.test(s.trim())) ?? null;
}
