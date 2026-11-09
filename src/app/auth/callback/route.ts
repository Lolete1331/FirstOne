import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Retorno del enlace mágico / Google: canjea el código por una sesión. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
      const dest = profile ? safeNext : `/onboarding?next=${encodeURIComponent(safeNext)}`;
      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
