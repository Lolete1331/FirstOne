/**
 * Validación aislada de palabras. Para cambiar la fuente (otra lista, una API oficial
 * de la RAE si algún día existe…) basta con implementar `WordValidator`.
 *
 * Importante: la validación DEFINITIVA ocurre dentro de la función SQL claim_word(),
 * en la misma transacción que la reclamación. Este módulo sirve para dar respuesta
 * rápida en la UI y para tests; nunca es la única barrera.
 */
import { isWellFormedWord, normalizeWord } from "./normalize";

export type ValidationResult =
  | { ok: true; word: string }
  | { ok: false; word: string; reason: "malformed" | "not_in_dictionary" };

export interface WordValidator {
  /** Recibe la palabra YA normalizada. */
  exists(word: string): Promise<boolean>;
}

export async function validateWord(input: string, validator: WordValidator): Promise<ValidationResult> {
  const word = normalizeWord(input);
  if (!isWellFormedWord(word)) return { ok: false, word, reason: "malformed" };
  if (!(await validator.exists(word))) return { ok: false, word, reason: "not_in_dictionary" };
  return { ok: true, word };
}

/** Validador en memoria (tests, scripts). */
export class SetValidator implements WordValidator {
  private words: Set<string>;
  constructor(words: Iterable<string>) {
    this.words = new Set([...words].map(normalizeWord));
  }
  async exists(word: string) {
    return this.words.has(word);
  }
}

/** Validador contra la tabla dictionary_words de Supabase/Postgres. */
export class SupabaseDictionaryValidator implements WordValidator {
  // Tipado mínimo para no acoplar el módulo a una versión concreta del cliente.
  constructor(
    private client: {
      rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
    },
  ) {}
  async exists(word: string) {
    const { data, error } = await this.client.rpc("word_exists", { p_word: word });
    if (error) throw error;
    return data === true;
  }
}
