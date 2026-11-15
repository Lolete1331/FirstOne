/**
 * Sopa de letras del día: la misma para todo el mundo, generada a partir de la fecha.
 * No hace falta servidor: con la misma fecha siempre sale la misma sopa.
 */
import { dayNumber } from "@/lib/oculta/game";
import { seededRandom, seededShuffle } from "./random";
import { THEMES } from "./sopa-temas";

export const SOPA_SIZE = 10;
export type Cell = [row: number, col: number];
export type PlacedWord = { word: string; letters: string; cells: Cell[] };
export type Sopa = { day: string; number: number; theme: string; size: number; grid: string[][]; words: PlacedWord[] };

/** Direcciones rectas: derecha, abajo, izquierda y arriba. */
const STRAIGHT: Cell[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
/** Diagonales en los cuatro sentidos (también hacia atrás, para que cueste más). */
const DIAGONAL: Cell[] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
/** Desde este día, cada sopa lleva varias palabras en diagonal (la de antes no cambia a mitad de partida). */
const DIAGONAL_FROM = "2026-11-16";
export const MIN_DIAGONAL = 3;

export const isDiagonal = (cells: Cell[]) => cells.length > 1 && cells[0][0] !== cells[1][0] && cells[0][1] !== cells[1][1];
const FILL = "AAAAAEEEEEIIIOOOOUUSSSRRRNNNLLLDDTTCCMMPPBGVYQHFZJÑX";

/** Letras de la sopa: mayúsculas, sin tildes ni diéresis (la ñ se mantiene). */
export function sopaLetters(word: string): string {
  return word
    .toLocaleUpperCase("es")
    .replace(/[ÁÀÂÄ]/g, "A")
    .replace(/[ÉÈÊË]/g, "E")
    .replace(/[ÍÌÎÏ]/g, "I")
    .replace(/[ÓÒÔÖ]/g, "O")
    .replace(/[ÚÙÛÜ]/g, "U");
}

/** Tema del día. El 15-nov se usaban solo los 40 temas originales; desde el 16-nov, todos. */
export function themeFor(day: string) {
  const order = day < DIAGONAL_FROM ? seededShuffle(THEMES.slice(0, 40), "sopa-temas") : seededShuffle(THEMES, "sopa-temas-2");
  const n = dayNumber(day);
  return order[(((n - 1) % order.length) + order.length) % order.length];
}

export const WORDS_PER_SOPA = 8;

/** Palabras de la sopa del día: desde el 16-nov, 8 elegidas entre todas las del tema. */
export function wordsFor(day: string, retry = 0): string[] {
  const t = themeFor(day);
  if (day < DIAGONAL_FROM) return t.words;
  // Si con unas palabras no cabe (muchas largas), se prueba con otra selección del mismo tema.
  return seededShuffle([...t.words, ...t.more], retry ? `sopa-palabras:${day}:${retry}` : `sopa-palabras:${day}`).slice(0, WORDS_PER_SOPA);
}

export function generateSopa(day: string): Sopa {
  const theme = themeFor(day);
  const size = SOPA_SIZE;
  for (let attempt = 0; attempt < 120; attempt++) {
    const rnd = seededRandom(`sopa:${day}:${attempt}`);
    const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(""));
    const words: PlacedWord[] = [];
    const sorted = [...wordsFor(day, Math.floor(attempt / 30))].sort((a, b) => sopaLetters(b).length - sopaLetters(a).length);
    let ok = true;
    const hard = day >= DIAGONAL_FROM;
    // Antes: direcciones al azar entre las seis de siempre. Ahora: al menos 3 palabras en diagonal
    // y el resto, mitad y mitad.
    const oldDirs: Cell[] = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0]];
    // Las diagonales obligatorias, mejor en palabras no muy largas (las de 9-10 letras casi no caben).
    const shortIdx = sorted.map((w, i) => [w, i] as const).filter(([w]) => sopaLetters(w).length <= 8).map(([, i]) => i);
    const diagonalSlots = new Set(seededShuffle(shortIdx.length >= MIN_DIAGONAL ? shortIdx : sorted.map((_, i) => i), `sopa-diag:${day}:${attempt}`).slice(0, MIN_DIAGONAL));
    for (const [wi, word] of sorted.entries()) {
      const letters = [...sopaLetters(word)];
      const dirs = !hard ? oldDirs : diagonalSlots.has(wi) ? DIAGONAL : [...STRAIGHT, ...DIAGONAL];
      let placed: Cell[] | null = null;
      for (let t = 0; t < 600 && !placed; t++) {
        const [dr, dc] = dirs[Math.floor(rnd() * dirs.length)];
        const r0 = Math.floor(rnd() * size);
        const c0 = Math.floor(rnd() * size);
        const cells: Cell[] = letters.map((_, i) => [r0 + dr * i, c0 + dc * i]);
        const fits = cells.every(([r, c], i) => r >= 0 && r < size && c >= 0 && c < size && (grid[r][c] === "" || grid[r][c] === letters[i]));
        if (fits) placed = cells;
      }
      if (!placed) {
        ok = false;
        break;
      }
      placed.forEach(([r, c], i) => (grid[r][c] = letters[i]));
      words.push({ word, letters: letters.join(""), cells: placed });
    }
    if (!ok) continue;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!grid[r][c]) grid[r][c] = FILL[Math.floor(rnd() * FILL.length)];
    // En la lista, por orden alfabético.
    words.sort((a, b) => a.word.localeCompare(b.word, "es"));
    return { day, number: dayNumber(day), theme: theme.name, size, grid, words };
  }
  throw new Error(`No se pudo generar la sopa de ${day}`);
}

/** Casillas en línea recta entre dos puntos (o null si no están en línea). */
export function lineCells(a: Cell, b: Cell): Cell[] | null {
  const dr = b[0] - a[0];
  const dc = b[1] - a[1];
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + sr * i, a[1] + sc * i] as Cell);
}

/** ¿Qué palabra (índice) ocupa exactamente esas casillas, en un sentido u otro? */
export function matchWord(sopa: Sopa, cells: Cell[]): number {
  const key = (cs: Cell[]) => cs.map(([r, c]) => `${r},${c}`).join("|");
  const k = key(cells);
  const kr = key([...cells].reverse());
  return sopa.words.findIndex((w) => key(w.cells) === k || key(w.cells) === kr);
}
