"use client";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useRpc } from "@/lib/hooks/use-rpc";

type Streak = { current: number; best: number; today: boolean };

/** En «Juegos»: tu racha (con cuenta) o una invitación a crear cuenta para guardarla. */
export function StreakBanner() {
  const { profile, loading } = useAuth();
  const streak = useRpc<Streak>("user_streak", profile ? { p_username: profile.username } : null);
  if (loading) return <div className="mt-6 h-14" />;
  if (!profile)
    return (
      <p className="mt-6 rounded-2xl border border-line bg-surface/60 px-5 py-3 text-center text-sm text-muted">
        🔥 <Link href="/login?next=/juegos" className="underline text-text">Crea tu cuenta gratis</Link> para guardar tu racha de días seguidos,
        ganar insignias y competir con tus amigos en grupos.
      </p>
    );
  const s = streak.data;
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm">
      <span className="font-display font-black text-lg">🔥 {s?.current ?? 0} {s?.current === 1 ? "día seguido" : "días seguidos"}</span>
      <span className="text-muted">{s?.today ? "Hoy ya has jugado ✓" : s && s.current > 0 ? "¡Juega hoy para no perder la racha!" : "Juega hoy para empezar una racha"}</span>
      <Link href={`/u/${profile.username}`} className="underline">Mis insignias</Link>
      <Link href="/grupos" className="underline">Mis grupos</Link>
    </div>
  );
}
