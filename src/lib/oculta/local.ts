import type { Reveal, Row } from "./types";

/** Partida guardada en el navegador (para quien juega sin cuenta). */
export type Local = { rows: Row[]; hint: string | null; solved: boolean; finished: boolean; reveal: Reveal | null };
export const emptyLocal: Local = { rows: [], hint: null, solved: false, finished: false, reveal: null };
export const storageKey = (day: string) => `palabra-oculta:${day}`;
export function readLocal(day: string): Local {
  try {
    const raw = localStorage.getItem(storageKey(day));
    return raw ? { ...emptyLocal, ...(JSON.parse(raw) as Local) } : emptyLocal;
  } catch {
    return emptyLocal;
  }
}
export function writeLocal(day: string, s: Local) {
  try {
    localStorage.setItem(storageKey(day), JSON.stringify(s));
  } catch {
    /* sin almacenamiento: la partida dura lo que la pestaña */
  }
}
