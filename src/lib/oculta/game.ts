/**
 * «La palabra oculta» — reglas del juego (sin dependencias del servidor; también se usa en el navegador).
 *
 *  - Una palabra al día, la misma para todo el mundo. El día cambia a las 00:00 UTC (como el juego principal).
 *  - Longitud variable (4 a 8 letras) y 6 intentos. Pedir una pista (la definición) gasta un intento.
 *  - Las tildes y la diéresis no cuentan (á = a, ü = u); la ñ sí es una letra distinta.
 */
export const MAX_ATTEMPTS = 6;
/** Primer día del juego: el n.º 1. */
export const LAUNCH_DAY = "2026-11-15";

export type Mark = "ok" | "near" | "no";

/** Quita tildes y diéresis pero conserva la ñ. */
export function foldWord(word: string): string {
  return word
    .normalize("NFC")
    .toLocaleLowerCase("es")
    .replace(/[áàâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u");
}

const FOLDED_RE = /^[a-zñ]+$/;
export const isFoldedWord = (w: string) => FOLDED_RE.test(w);

/**
 * Compara un intento con la palabra secreta (ambos ya «doblados» con foldWord y de la misma longitud).
 * ok = letra en su sitio · near = está en la palabra pero en otro sitio · no = no está (o ya se contó).
 * Las letras repetidas se cuentan como en los juegos clásicos: primero los aciertos exactos.
 */
export function scoreGuess(guess: string, secret: string): Mark[] {
  const g = [...guess];
  const s = [...secret];
  const marks: Mark[] = g.map(() => "no");
  const left = new Map<string, number>();
  g.forEach((ch, i) => {
    if (ch === s[i]) marks[i] = "ok";
    else left.set(s[i], (left.get(s[i]) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    if (marks[i] === "ok") return;
    const n = left.get(ch) ?? 0;
    if (n > 0) {
      marks[i] = "near";
      left.set(ch, n - 1);
    }
  });
  return marks;
}

/** Día de juego (AAAA-MM-DD en UTC) de un instante. */
export function dayKey(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/** Número de la palabra (1 = día de lanzamiento). */
export function dayNumber(day: string): number {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${LAUNCH_DAY}T00:00:00Z`)) / 86_400_000) + 1;
}

/** ¿Se puede jugar ese día? (desde el lanzamiento hasta hoy, nunca días futuros) */
export function isPlayableDay(day: string, today: string = dayKey()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(`${day}T00:00:00Z`)) && day >= LAUNCH_DAY && day <= today;
}

/** Días anteriores a hoy, del más reciente al más antiguo. */
export function pastDays(today: string = dayKey()): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${today}T00:00:00Z`) - 86_400_000; t >= Date.parse(`${LAUNCH_DAY}T00:00:00Z`); t -= 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Milisegundos hasta la siguiente palabra. */
export function msToNextDay(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

/** Texto para compartir (sin la palabra, para no destripársela a nadie). */
export function shareText(day: string, attempts: number | null, hints: number): string {
  const n = dayNumber(day);
  const result = attempts === null ? "No la he encontrado" : `La he encontrado en ${attempts}/${MAX_ATTEMPTS}`;
  const pista = hints > 0 ? " (con pista)" : "";
  return `🔎 La palabra oculta n.º ${n}\n${result}${pista}\n¿Y tú? firstone.es/palabra-oculta`;
}
