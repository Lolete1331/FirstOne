import { Pool } from "pg";
import { randomUUID } from "node:crypto";

export const hasDb = !!process.env.DATABASE_URL;
export const pool = hasDb ? new Pool({ connectionString: process.env.DATABASE_URL, max: 40 }) : (null as unknown as Pool);

let seq = 0;
/** Crea un usuario con perfil (como superusuario, sin RLS). */
export async function createUser(country: string | null = "ES") {
  const id = randomUUID();
  const username = `t${Date.now().toString(36)}_${(seq++).toString(36)}`.slice(0, 20);
  await pool.query("insert into auth.users (id, email) values ($1, $2)", [id, `${username}@test.dev`]);
  await pool.query("insert into public.profiles (id, username, country) values ($1, $2, $3)", [id, username, country]);
  return { id, username };
}

export type ClaimResult = {
  status: "won" | "joined" | "already_yours" | "invalid" | "rate_limited" | "no_profile" | "unauthenticated";
  word?: string;
  year?: number;
  position?: number;
  total?: number;
  claimed_at?: string;
  owner?: { username: string; country: string | null; claimed_at: string } | null;
};

/** Reclama en un instante concreto (para simular el cambio de año). */
export async function claimAt(userId: string, word: string, at: string, ip: string | null = null) {
  const { rows } = await pool.query("select public._claim_word_at($1, $2, $3::inet, $4::timestamptz) as r", [
    userId,
    word,
    ip,
    at,
  ]);
  return rows[0].r as ClaimResult;
}

/** Reclama "ahora" por el punto de entrada real. */
export async function claimNow(userId: string, word: string, ip: string | null = null) {
  const { rows } = await pool.query("select public.claim_word($1, $2, $3::inet) as r", [userId, word, ip]);
  return rows[0].r as ClaimResult;
}

/** Ejecuta una consulta con el rol de un cliente de Supabase (anon / authenticated). */
export async function asRole<T>(role: "anon" | "authenticated", userId: string | null, sql: string, params: unknown[] = []) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query(`set local role ${role}`);
    if (userId) await c.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    const r = await c.query(sql, params);
    await c.query("commit");
    return r.rows as T[];
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}

/** Palabra del diccionario que nadie ha usado todavía en los tests. */
const used = new Set<string>();
export async function freshWord(): Promise<string> {
  const { rows } = await pool.query(
    "select word from public.dictionary_words where length(word) between 5 and 12 order by random() limit 50",
  );
  for (const { word } of rows) if (!used.has(word)) return used.add(word), word;
  throw new Error("sin palabras libres");
}
