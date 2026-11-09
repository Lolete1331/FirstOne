import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/request-ip";
import { HUMAN_COOKIE, HUMAN_TTL_SECONDS, isTurnstileEnabled, issueHumanToken, verifyTurnstile } from "@/lib/human";

const Body = z.object({ token: z.string().min(1).max(4096) });

/** POST /api/verify-human { token } → cookie firmada "soy humano" durante 30 min. */
export async function POST(request: Request) {
  if (!isTurnstileEnabled()) return NextResponse.json({ ok: true, disabled: true });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  if (!(await verifyTurnstile(parsed.data.token, getClientIp(request.headers)))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HUMAN_COOKIE, issueHumanToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: HUMAN_TTL_SECONDS,
  });
  return res;
}
