import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Protección anti-bots con Cloudflare Turnstile.
 *
 * Pedir un captcha en CADA palabra ralentizaría la carrera, así que se verifica una vez
 * y se emite una cookie firmada (HMAC) ligada al usuario, válida 30 minutos.
 * Si TURNSTILE_SECRET_KEY no está configurada (desarrollo local), se desactiva.
 */
export const HUMAN_COOKIE = "fo_human";
export const HUMAN_TTL_SECONDS = 30 * 60;

export const isTurnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

function secret() {
  const s = process.env.HUMAN_COOKIE_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!s) throw new Error("Falta HUMAN_COOKIE_SECRET");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueHumanToken(userId: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + HUMAN_TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyHumanToken(token: string | undefined, userId: string, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [uid, exp, sig] = parts;
  if (uid !== userId || Number(exp) < Math.floor(now / 1000)) return false;
  const expected = Buffer.from(sign(`${uid}.${exp}`));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Verifica un token de Turnstile con Cloudflare. */
export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? "", response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
