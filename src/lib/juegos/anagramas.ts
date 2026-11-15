/** «Anagramas»: con 7 letras, formar todas las palabras posibles (4 letras o más). */
import { dayNumber, foldWord } from "@/lib/oculta/game";
import { seededRandom, seededShuffle } from "./random";
import { MEANING_WORDS } from "./significa-palabras";
import { THEMES } from "./sopa-temas";
import { ANAGRAM_BASES } from "./anagramas-data";

export const MIN_LEN = 4;

/** Con estas letras salen menos de 10 palabras: no son divertidas. */
const FEW_SOLUTIONS = new Set(["cachaza", "desidia", "endeble", "ensueño", "ganapan", "gurruño", "hechizo", "idilico", "manzana", "perenne", "pomposo", "sinuoso", "susurro"]);

/** Versión 1 (solo el 15-nov): palabras de 7 letras de los temas y de «¿Qué significa?». */
const BASE_WORDS_V1: string[] = [...new Set([...THEMES.slice(0, 40).flatMap((t) => t.words), ...MEANING_WORDS].map(foldWord))]
  .filter((w) => [...w].length === 7 && !FEW_SOLUTIONS.has(w))
  .sort();

/** Desde el 16-nov: palabras comunes de 7 letras que dan 15 palabras o más (más de 4 años sin repetir). */
export const BASE_WORDS: readonly string[] = ANAGRAM_BASES;

export function baseWordFor(day: string): string {
  const order = day < "2026-11-16" ? seededShuffle(BASE_WORDS_V1, "anagramas") : seededShuffle(BASE_WORDS, "anagramas-2");
  return order[(((dayNumber(day) - 1) % order.length) + order.length) % order.length];
}

/** Letras del día, desordenadas (en mayúsculas). */
export function lettersFor(day: string): string[] {
  const rnd = seededRandom(`anagramas-orden:${day}`);
  const ls = [...baseWordFor(day).toLocaleUpperCase("es")];
  for (let i = ls.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [ls[i], ls[j]] = [ls[j], ls[i]];
  }
  return ls;
}

/** ¿Se puede escribir `word` con esas letras (sin usar ninguna más veces de las que hay)? */
export function fitsLetters(word: string, letters: string[]): boolean {
  const left = new Map<string, number>();
  for (const l of letters) left.set(l.toLocaleLowerCase("es"), (left.get(l.toLocaleLowerCase("es")) ?? 0) + 1);
  for (const ch of word) {
    const n = left.get(ch) ?? 0;
    if (!n) return false;
    left.set(ch, n - 1);
  }
  return true;
}

/** Puntos: 1 por palabra de 4 letras; si es más larga, una por letra; +7 si usa las 7 letras. */
export function points(word: string): number {
  const n = [...word].length;
  return (n === MIN_LEN ? 1 : n) + (n === 7 ? 7 : 0);
}

export const LEVELS: [number, string][] = [
  [0, "Aprendiz"],
  [0.08, "Curioso"],
  [0.2, "Buen lector"],
  [0.35, "Letrado"],
  [0.55, "Erudito"],
  [0.75, "Sabio"],
  [1, "¡Todas!"],
];
export function levelFor(score: number, max: number): string {
  const r = max ? score / max : 0;
  return [...LEVELS].reverse().find(([t]) => r >= t)![1];
}
