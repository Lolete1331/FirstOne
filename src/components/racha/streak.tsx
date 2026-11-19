"use client";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useMyStreak } from "@/lib/hooks/use-my-streak";

const dias = (n: number) => `${n} ${n === 1 ? "día" : "días"}`;

/** 🔥 N en la cabecera. Apagado si hoy aún no ha jugado (la racha está en peligro). */
export function StreakChip() {
  const s = useMyStreak();
  if (!s || s.current < 1) return null;
  const title = s.today
    ? `Racha: ${dias(s.current)} seguidos jugando. ¡Vuelve mañana!`
    : `Llevas ${dias(s.current)} seguidos: juega hoy para no perder la racha`;
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-1 text-sm font-bold tabular-nums ${
        s.today ? "border-gold/50 text-gold" : "border-line text-muted animate-pulse"
      }`}
    >
      <span aria-hidden className={s.today ? "" : "grayscale"}>🔥</span>
      {s.current}
    </span>
  );
}

/** Mensaje al terminar un juego: «Llevas N días seguidos · vuelve mañana». */
export function StreakNote({ className = "mt-2 text-sm text-[#6b6256]" }: { className?: string }) {
  const { profile, loading } = useAuth();
  const s = useMyStreak();
  if (loading) return null;
  if (!profile)
    return (
      <p className={className}>
        🔥 <Link href="/login" className="underline">Crea una cuenta</Link> y lleva tu racha de días seguidos jugando.
      </p>
    );
  if (!s) return null;
  const n = Math.max(s.current, 1);
  return (
    <p className={className}>
      🔥 <b>Llevas {dias(n)} seguidos.</b>{" "}
      {n >= s.best && n > 1 ? "¡Es tu mejor racha! " : ""}Vuelve mañana para que sean {n + 1}.
    </p>
  );
}
