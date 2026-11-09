import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/request-ip";
import { HUMAN_COOKIE, isTurnstileEnabled, verifyHumanToken } from "@/lib/human";
import { isWellFormedWord, normalizeWord } from "@/lib/words/normalize";
import type { ClaimResponse } from "@/lib/claim-types";

const Body = z.object({ word: z.string().min(1).max(80) });

const json = (body: ClaimResponse, status = 200) => NextResponse.json(body, { status });

/**
 * POST /api/claim { word }
 * 1. Comprueba la sesión (JWT de Supabase).
 * 2. Comprueba la cookie anti-bots (Turnstile).
 * 3. Llama a claim_word() con la clave secreta: normalización, límite por usuario/IP,
 *    diccionario y asignación de posición ocurren en UNA transacción en Postgres.
 */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ status: "invalid", message: "Escribe una palabra" }, 400);

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return json({ status: "unauthenticated" }, 401);

  if (isTurnstileEnabled()) {
    const store = await cookies();
    if (!verifyHumanToken(store.get(HUMAN_COOKIE)?.value, userId)) {
      return json({ status: "human_required" }, 403);
    }
  }

  // Atajo barato: si ni siquiera tiene forma de palabra no tocamos la BD.
  const word = normalizeWord(parsed.data.word);
  if (!isWellFormedWord(word)) return json({ status: "invalid", word });

  const ip = getClientIp(request.headers);
  const { data, error } = await getAdminSupabase().rpc("claim_word", {
    p_user_id: userId,
    p_word: word,
    p_ip: ip,
  });
  if (error) {
    console.error("claim_word", error);
    return json({ status: "error", message: "No hemos podido registrar la palabra. Inténtalo otra vez." }, 500);
  }
  const result = data as ClaimResponse;
  return json(result, result.status === "rate_limited" ? 429 : 200);
}
