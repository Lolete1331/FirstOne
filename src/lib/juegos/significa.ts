import "server-only";
import { dayNumber } from "@/lib/oculta/game";
import { lookupDefinition } from "@/lib/words/lookup";
import { wiktionaryUrl } from "@/lib/words/definitions";
import { seededRandom, seededShuffle } from "./random";
import { MEANING_WORDS } from "./significa-palabras";
import { maskWord, pickDefinition, shorten } from "./significa-text";

export const QUESTIONS_PER_DAY = 5;
export type Question = { word: string; options: string[]; answer: number; full: string; sourceUrl: string };
export type Quiz = { day: string; number: number; questions: Question[] };

const ORDER = seededShuffle(MEANING_WORDS, "que-significa");
const cache = new Map<string, Quiz>();

async function definitionOf(word: string): Promise<string | null> {
  const r = await lookupDefinition(word, null);
  if (!r.ok) return null;
  return pickDefinition(r.groups.flatMap((g) => g.senses.map((s) => s.text)), word);
}

/** Toma `count` palabras con definición a partir de una posición de la lista (dando la vuelta si hace falta). */
async function pick(start: number, count: number, maxTries: number) {
  const out: { word: string; def: string }[] = [];
  for (let i = 0; i < maxTries && out.length < count; i++) {
    const word = ORDER[(((start + i) % ORDER.length) + ORDER.length) % ORDER.length];
    const def = await definitionOf(word);
    if (def) out.push({ word, def });
  }
  return out;
}

/** El cuestionario del día: 5 palabras, cada una con su definición y dos definiciones de otras palabras. */
export async function quizFor(day: string): Promise<Quiz> {
  const hit = cache.get(day);
  if (hit) return hit;
  const n = dayNumber(day);
  const start = (n - 1) * QUESTIONS_PER_DAY;
  const main = await pick(start, QUESTIONS_PER_DAY, QUESTIONS_PER_DAY * 3);
  // Las definiciones «trampa» salen de otra zona de la lista.
  const decoys = await pick(start + Math.floor(ORDER.length / 2), QUESTIONS_PER_DAY * 2, QUESTIONS_PER_DAY * 5);
  const rnd = seededRandom(`que-significa:${day}`);

  const questions: Question[] = main.map(({ word, def }, i) => {
    const wrong = [decoys[i * 2], decoys[i * 2 + 1]].filter(Boolean).map((d) => shorten(maskWord(d.def, d.word)));
    // Si faltan trampas (Wikcionario no respondió), se usan definiciones de otras preguntas.
    for (let j = 1; wrong.length < 2 && j < main.length; j++) {
      const other = main[(i + j) % main.length];
      wrong.push(shorten(maskWord(other.def, other.word)));
    }
    const right = shorten(maskWord(def, word));
    const options = [right, ...wrong.slice(0, 2)];
    for (let k = options.length - 1; k > 0; k--) {
      const j = Math.floor(rnd() * (k + 1));
      [options[k], options[j]] = [options[j], options[k]];
    }
    return { word, options, answer: options.indexOf(right), full: def, sourceUrl: wiktionaryUrl(word) };
  });

  const quiz = { day, number: n, questions };
  if (questions.length === QUESTIONS_PER_DAY) cache.set(day, quiz); // solo se guarda si está completo
  return quiz;
}
