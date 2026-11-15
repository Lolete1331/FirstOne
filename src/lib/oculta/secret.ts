import "server-only";
import { createHmac } from "node:crypto";
import { HIDDEN_WORDS } from "./words";
import { dayNumber } from "./game";

function key(): string {
  const s = process.env.HUMAN_COOKIE_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!s) throw new Error("Falta HUMAN_COOKIE_SECRET");
  return createHmac("sha256", s).update("palabra-oculta").digest("hex");
}

let order: string[] | null = null;

/**
 * Orden secreto de las palabras: la lista se «baraja» con una clave que solo conoce el servidor.
 * Cada día toca la siguiente, así que no se repite ninguna hasta agotar la lista.
 */
function secretOrder(): string[] {
  if (!order) {
    const k = key();
    const tag = (w: string) => createHmac("sha256", k).update(w).digest("hex");
    order = [...HIDDEN_WORDS].map((w) => [tag(w), w] as const).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, w]) => w);
  }
  return order;
}

/** La palabra oculta de un día (con tildes, tal y como está en el diccionario). */
export function secretWordFor(day: string): string {
  const list = secretOrder();
  const i = (((dayNumber(day) - 1) % list.length) + list.length) % list.length;
  return list[i];
}
