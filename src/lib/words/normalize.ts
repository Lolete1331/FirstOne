/**
 * Normalización de palabras. DEBE comportarse igual que la función SQL
 * public.normalize_word() (ver supabase/migrations). Hay un test que lo verifica.
 *
 *  - quita espacios al principio/final y colapsa los interiores
 *  - Unicode NFC: "n" + "◌̃" (dos code points) pasa a ser "ñ" (uno)
 *  - minúsculas con reglas del español
 *  - respeta tildes, diéresis y ñ: "año" ≠ "ano"
 */
export const MAX_WORD_LENGTH = 40;

export function normalizeWord(input: string): string {
  return input.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

const WORD_RE = /^[a-záéíóúüñ]+$/u;

/** ¿Tiene forma de palabra española (solo letras, sin espacios, longitud razonable)? */
export function isWellFormedWord(normalized: string): boolean {
  return normalized.length > 0 && normalized.length <= MAX_WORD_LENGTH && WORD_RE.test(normalized);
}
