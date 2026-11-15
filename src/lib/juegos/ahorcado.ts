/** «El ahorcado»: tres palabras al día, con su tema como pista. 6 fallos por palabra. */
import { dayNumber, foldWord } from "@/lib/oculta/game";
import { seededShuffle } from "./random";
import { THEMES } from "./sopa-temas";
import { HANGMAN_WORDS } from "./ahorcado-data";

export const ROUNDS = 3;
export const MAX_MISSES = 6;
/** `theme` solo en las palabras del primer día (15-nov); desde el 16-nov la pista es la definición. */
export type HangmanWord = { word: string; theme?: string };

/** Versión 1 (solo el 15-nov): palabras de los temas, con su tema como pista. */
const POOL_V1: HangmanWord[] = (() => {
  const seen = new Set<string>();
  const out: HangmanWord[] = [];
  for (const t of THEMES.slice(0, 40))
    for (const w of t.words)
      if ([...foldWord(w)].length >= 5 && !seen.has(w)) {
        seen.add(w);
        out.push({ word: w, theme: t.name });
      }
  return out;
})();

/** Desde el 16-nov: 1.300 palabras de uso común (más de un año sin repetir). */
const POOL: HangmanWord[] = HANGMAN_WORDS.map((word) => ({ word }));

export function hangmanWords(day: string): HangmanWord[] {
  const order = day < "2026-11-16" ? seededShuffle(POOL_V1, "ahorcado") : seededShuffle(POOL, "ahorcado-2");
  const start = (dayNumber(day) - 1) * ROUNDS;
  return Array.from({ length: ROUNDS }, (_, i) => order[(((start + i) % order.length) + order.length) % order.length]);
}

export const poolSize = () => POOL.length;

/** Letras (sin tildes, en mayúsculas) para comparar con el teclado. */
export const hangmanLetters = (w: string) => [...foldWord(w).toLocaleUpperCase("es")];
