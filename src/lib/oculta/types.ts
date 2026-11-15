import type { Mark } from "./game";

/** Una fila del tablero: un intento (con sus marcas) o la pista (guess = null). */
export type Row = { guess: string | null; marks: Mark[] | null };

export type Reveal = {
  word: string;
  /** Primeras acepciones (Wikcionario, CC BY-SA 4.0). */
  senses: string[];
  sourceUrl: string | null;
  raeUrl: string;
};

export type RankingRow = { pos: number; username: string; country: string | null; attempts: number; hints: number; solved_at: string };

export type OcultaState = {
  day: string;
  number: number;
  length: number;
  maxAttempts: number;
  /** null = sin cuenta: el progreso se guarda solo en el navegador. */
  me: null | { rows: Row[]; solved: boolean; finished: boolean; hint: string | null; reveal: Reveal | null; position: number | null };
  ranking: RankingRow[];
  solvers: number;
};

export type GuessResponse =
  | { status: "ok"; marks: Mark[]; solved: boolean; finished: boolean; reveal: Reveal | null; position: number | null }
  | { status: "hint"; hint: string; finished: false }
  | { status: "not_in_dictionary" | "wrong_length" | "repeated" | "finished" | "new_day" | "no_hint" | "retry" | "invalid" };
