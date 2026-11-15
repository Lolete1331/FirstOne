/**
 * Juegos de preguntas diarios que se generan en el navegador a partir de la fecha
 * (todo el mundo ve las mismas preguntas cada día y no hace falta servidor).
 */
import { dayNumber } from "@/lib/oculta/game";
import { seededRandom, seededShuffle } from "./random";
import { MEANING_WORDS } from "./significa-palabras";
import { FAKE_WORDS, REAL_RARE_WORDS } from "./existe-data";
import { FAKE_WORDS_V1 } from "./existe-v1";
import { SPELLING_V1 } from "./ortografia-v1";
import { REFRANES } from "./refranes-data";
import { SPELLING } from "./ortografia-data";
import { THEMES } from "./sopa-temas";

export type QuizItem = {
  /** Lo que se pregunta (palabra, refrán, palabra con hueco…). */
  prompt: string;
  /** Texto pequeño encima del enunciado. */
  question: string;
  options: string[];
  answer: number;
  /** Explicación tras responder. */
  explain: string;
  /** Si existe, palabra de la que se puede ver el significado. */
  word?: string;
  /** Estilo del enunciado: palabra grande o frase. */
  big?: boolean;
};

/** El 15-nov (primer día) se jugó con las listas de entonces: así no cambia a quien ya lo jugó. */
const V2_FROM = "2026-11-16";

/** Elementos del día n de una lista barajada una vez (no se repiten hasta agotar la lista). */
function slice<T>(list: readonly T[], seed: string, day: string, perDay: number): T[] {
  const start = (dayNumber(day) - 1) * perDay;
  return Array.from({ length: perDay }, (_, i) => {
    // Cada vez que se agota la lista se baraja de otra forma: si algo se repite, sale con otros compañeros.
    const pos = start + i;
    const cycle = Math.floor(pos / list.length);
    const order = seededShuffle(list, cycle ? `${seed}:${cycle}` : seed);
    return order[((pos % list.length) + list.length) % list.length];
  });
}

function shuffleWith<T>(list: T[], rnd: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── ¿Existe o no existe? ────────────────────────────────────────────────────
export function existeItems(day: string): QuizItem[] {
  const rnd = seededRandom(`existe:${day}`);
  const v1 = day < V2_FROM;
  const reals = v1 ? slice(MEANING_WORDS, "existe-reales", day, 5) : slice(REAL_RARE_WORDS, "existe-reales-2", day, 5);
  const fakes = v1 ? slice(FAKE_WORDS_V1, "existe-falsas", day, 5) : slice(FAKE_WORDS, "existe-falsas-2", day, 5);
  const items: QuizItem[] = [
    ...reals.map((w) => ({
      prompt: w,
      question: "¿Existe esta palabra?",
      options: ["Existe", "Me la he inventado"],
      answer: 0,
      explain: `«${w}» existe: está en el diccionario.`,
      word: w,
      big: true,
    })),
    ...fakes.map((w) => ({
      prompt: w,
      question: "¿Existe esta palabra?",
      options: ["Existe", "Me la he inventado"],
      answer: 1,
      explain: `«${w}» no existe: nos la hemos inventado mezclando dos palabras.`,
      big: true,
    })),
  ];
  return shuffleWith(items, rnd);
}

// ── Refranes ────────────────────────────────────────────────────────────────
/** El 15-nov había 115 refranes (los primeros de la lista); después se añadieron más. */
const REFRANES_V1 = REFRANES.slice(0, 115);

export function refranesItems(day: string): QuizItem[] {
  const rnd = seededRandom(`refranes:${day}`);
  const list = day < V2_FROM ? REFRANES_V1 : REFRANES;
  const today = slice(list, day < V2_FROM ? "refranes" : "refranes-2", day, 5);
  return today.map(([start, end]) => {
    const others = shuffleWith(list.filter(([s]) => s !== start), rnd).slice(0, 2).map(([, e]) => e);
    const options = shuffleWith([end, ...others], rnd);
    return {
      prompt: `«${start}…»`,
      question: "¿Cómo termina el refrán?",
      options,
      answer: options.indexOf(end),
      explain: `«${start}, ${end}».`,
    };
  });
}

// ── La intrusa ──────────────────────────────────────────────────────────────
/** Temas que se parecen demasiado no se mezclan (una «intrusa» tiene que estar clara). */
const FAMILY: Record<string, string> = {
  Frutas: "comida", Verduras: "comida", Postres: "comida", "Dulces de Navidad": "comida", "Pan y bollos": "comida", "Cocina española": "comida",
  "Animales de granja": "animales", "Animales salvajes": "animales", "Animales del mar": "animales", Aves: "animales", Insectos: "animales",
  Oficios: "personas", Familia: "personas",
  "Instrumentos musicales": "musica", Música: "musica", Fiesta: "musica",
  "En la cocina": "casa", "En casa": "casa", Herramientas: "casa",
  Ropa: "ropa", Invierno: "estaciones", Verano: "estaciones", "En la playa": "estaciones",
  "El cuerpo": "cuerpo", "El tiempo": "naturaleza", "La naturaleza": "naturaleza", Geografía: "naturaleza", Flores: "plantas", Árboles: "plantas",
  Colores: "colores", Deportes: "deportes", Juegos: "deportes", Transportes: "transportes", "La escuela": "escuela", Lectura: "escuela",
  Emociones: "emociones", "El universo": "universo", "La ciudad": "ciudad", Cuentos: "cuentos", Piratas: "cuentos",
};
const familyOf = (t: string) => FAMILY[t] ?? t;
/** Palabras que están en más de un tema (no sirven para la intrusa). */
const COUNT = new Map<string, number>();
for (const t of THEMES) for (const w of [...t.words, ...t.more]) COUNT.set(w, (COUNT.get(w) ?? 0) + 1);
const COUNT_V1 = new Map<string, number>();
for (const t of THEMES.slice(0, 40)) for (const w of t.words) COUNT_V1.set(w, (COUNT_V1.get(w) ?? 0) + 1);
/** Solo los 40 temas originales, que no se solapan entre sí (los nuevos mezclan cosas: «Bosque», «Mar»…). */
const INTRUSA_THEMES = THEMES.slice(0, 40);
const uniqueFor = (day: string) => (words: string[]) => words.filter((w) => (day < V2_FROM ? COUNT_V1 : COUNT).get(w) === 1);

export function intrusaItems(day: string): QuizItem[] {
  const rnd = seededRandom(`intrusa:${day}`);
  const unique = uniqueFor(day);
  const groups = slice(INTRUSA_THEMES, "intrusa", day, 5);
  return groups.map((theme) => {
    const others = INTRUSA_THEMES.filter((t) => familyOf(t.name) !== familyOf(theme.name));
    const odd = others[Math.floor(rnd() * others.length)];
    const three = shuffleWith(unique(theme.words), rnd).slice(0, 3);
    const intruder = shuffleWith(unique(odd.words), rnd)[0];
    const options = shuffleWith([...three, intruder], rnd);
    return {
      prompt: "¿Cuál no encaja?",
      question: "Tres palabras tienen algo en común",
      options,
      answer: options.indexOf(intruder),
      explain: `${three.map((w) => `«${w}»`).join(", ")}: ${theme.name.toLocaleLowerCase("es")}. «${intruder}» es de ${odd.name.toLocaleLowerCase("es")}.`,
    };
  });
}

// ── ¿B o V? (ortografía) ────────────────────────────────────────────────────
export function ortografiaItems(day: string): QuizItem[] {
  const today = day < V2_FROM ? slice(SPELLING_V1, "ortografia", day, 6) : slice(SPELLING, "ortografia-2", day, 6);
  return today.map(([word, pos, kind]) => {
    const letters = [...word];
    const right = kind === "h" ? "Con h" : letters[pos];
    const options = kind === "bv" ? ["b", "v"] : kind === "gj" ? ["g", "j"] : ["Con h", "Sin h"];
    const shown = letters.map((ch, i) => (i === pos ? "_" : ch)).join("");
    return {
      prompt: shown,
      question: kind === "h" ? "¿Se escribe con h o sin h?" : `¿Qué letra falta: ${options[0]} o ${options[1]}?`,
      options,
      answer: options.indexOf(right),
      explain: `Se escribe «${word}».`,
      word,
      big: true,
    };
  });
}
