/** «El ahorcado»: tres palabras al día, con su tema como pista. 6 fallos por palabra. */
import { dayNumber, foldWord } from "@/lib/oculta/game";
import { seededShuffle } from "./random";
import { THEMES } from "./sopa-temas";

export const ROUNDS = 3;
export const MAX_MISSES = 6;
export type HangmanWord = { word: string; theme: string };

/** Todas las palabras de los temas (de 5 letras o más), con su tema; sin repetir palabra. */
const POOL: HangmanWord[] = (() => {
  const seen = new Set<string>();
  const out: HangmanWord[] = [];
  for (const t of THEMES)
    for (const w of t.words)
      if ([...foldWord(w)].length >= 5 && !seen.has(w)) {
        seen.add(w);
        out.push({ word: w, theme: t.name });
      }
  return out;
})();

export function hangmanWords(day: string): HangmanWord[] {
  const order = seededShuffle(POOL, "ahorcado");
  const start = (dayNumber(day) - 1) * ROUNDS;
  return Array.from({ length: ROUNDS }, (_, i) => order[(((start + i) % order.length) + order.length) % order.length]);
}

export const poolSize = () => POOL.length;

/** Letras (sin tildes, en mayúsculas) para comparar con el teclado. */
export const hangmanLetters = (w: string) => [...foldWord(w).toLocaleUpperCase("es")];
