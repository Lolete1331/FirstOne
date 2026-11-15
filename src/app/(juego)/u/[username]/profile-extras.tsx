"use client";
import Link from "next/link";
import { useState } from "react";
import { useRpc } from "@/lib/hooks/use-rpc";
import { badgesFor, GAME_NAMES, type BadgeData } from "@/lib/juegos/badges";

type Streak = { current: number; best: number; today: boolean; days: number };
type GameStat = { game: string; played: number; perfect: number; avg_pct: number; last_7: number };

/** Racha, insignias y resumen de juegos del perfil. */
export function ProfileExtras({ username, isMe }: { username: string; isMe: boolean }) {
  const streak = useRpc<Streak>("user_streak", { p_username: username });
  const badges = useRpc<BadgeData>("user_badges", { p_username: username });
  const stats = useRpc<GameStat[]>("user_game_stats", { p_username: username });
  const s = streak.data;
  const list = badges.data ? badgesFor(badges.data) : [];
  const earned = list.filter((b) => b.earned).length;
  const [picked, setPicked] = useState<string | null>(null);
  const pickedBadge = list.find((b) => b.id === picked);

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.4fr]">
      {/* Racha */}
      <section className="card p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Racha</h2>
        <p className="mt-2 font-display font-black text-4xl">
          🔥 {s?.current ?? 0} <span className="text-lg font-bold">{s?.current === 1 ? "día seguido" : "días seguidos"}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          Mejor racha: <b className="text-text">{s?.best ?? 0}</b> · {s?.days ?? 0} {s?.days === 1 ? "día" : "días"} jugando
        </p>
        {isMe && s && !s.today && (
          <p className="mt-3 text-sm">
            Hoy aún no has jugado.{" "}
            <Link href="/juegos" className="underline text-lime">
              {s.current > 0 ? "¡No pierdas tu racha!" : "Empieza una racha"}
            </Link>
          </p>
        )}
        {isMe && (
          <Link href="/grupos" className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold hover:border-lime/60">
            👥 Mis grupos
          </Link>
        )}
      </section>

      {/* Insignias */}
      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Insignias</h2>
          <span className="text-sm text-muted">
            {earned} de {list.length}
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
          {list.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                title={`${b.name}: ${b.how}`}
                onClick={() => setPicked(picked === b.id ? null : b.id)}
                className={`w-full h-full flex flex-col items-center gap-1 rounded-xl p-2 text-center ${b.earned ? "bg-gold/10 border border-gold/40" : "bg-surface-2/50 opacity-40 grayscale"} ${picked === b.id ? "ring-2 ring-lime/60 opacity-100" : ""}`}
              >
                <span className="text-2xl">{b.icon}</span>
                <span className="text-[10px] leading-tight">{b.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted min-h-5">
          {pickedBadge ? (
            <>
              <b className="text-text">{pickedBadge.icon} {pickedBadge.name}:</b> {pickedBadge.how}. {pickedBadge.earned ? "¡Conseguida!" : "Aún no."}
            </>
          ) : (
            "Toca una insignia para ver cómo se consigue."
          )}
        </p>
      </section>

      {/* Juegos */}
      {stats.data && stats.data.length > 0 && (
        <section className="card p-5 md:col-span-2">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Juegos de palabras</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-xs">
                <tr>
                  <th className="text-left font-normal py-1">Juego</th>
                  <th className="text-right font-normal">Partidas</th>
                  <th className="text-right font-normal">Perfectas</th>
                  <th className="text-right font-normal">Acierto</th>
                  <th className="text-right font-normal">Esta semana</th>
                </tr>
              </thead>
              <tbody>
                {stats.data.map((g) => (
                  <tr key={g.game} className="border-t border-line/60">
                    <td className="py-1.5">{GAME_NAMES[g.game] ?? g.game}</td>
                    <td className="text-right tabular-nums">{g.played}</td>
                    <td className="text-right tabular-nums">{g.perfect}</td>
                    <td className="text-right tabular-nums">{g.avg_pct} %</td>
                    <td className="text-right tabular-nums">{g.last_7}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
