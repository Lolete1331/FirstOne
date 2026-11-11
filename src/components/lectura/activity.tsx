"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { WORD_LISTS } from "@/lib/lectura/words";

export const PRAISE = ["¡Muy bien! 🌟", "¡Genial! 🎉", "¡Lo has clavado! 💪", "¡Fenomenal! ⭐", "¡Bravo! 👏", "¡Eso es! 🙌"];
export const ENCOURAGE = ["¡Casi! Prueba otra vez 💪", "Uy, esa no. ¡Tú puedes! 🙂", "Vuelve a escucharla y prueba otra vez 🔊"];
export const pickOne = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
export const ROUNDS = 8;

export function ActivityHeader({ emoji, title, help, round, total }: { emoji: string; title: string; help: string; round?: number; total?: number }) {
  return (
    <div className="pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.4em]">
          <span aria-hidden>{emoji}</span> {title}
        </h1>
        {round !== undefined && total !== undefined && (
          <span className="lx-card px-3 py-1 font-bold shrink-0" style={{ fontSize: "0.7em" }} aria-label={`Ronda ${round} de ${total}`}>
            {round}/{total}
          </span>
        )}
      </div>
      <p className="lx-muted mt-1" style={{ fontSize: "0.8em" }}>
        {help}
      </p>
      {round !== undefined && total !== undefined && (
        <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--lx-line)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((round - 1) / total) * 100}%`, background: "var(--lx-accent)" }} />
        </div>
      )}
    </div>
  );
}

/** Selector de lista/nivel antes de empezar. */
export function LevelPicker({ onPick, lists = WORD_LISTS.map((l) => l.id) }: { onPick: (id: string) => void; lists?: string[] }) {
  return (
    <div className="mt-6 grid gap-3">
      <p className="font-bold">Elige un nivel:</p>
      {WORD_LISTS.filter((l) => lists.includes(l.id)).map((l) => (
        <button key={l.id} onClick={() => onPick(l.id)} className="lx-card p-4 text-left hover:-translate-y-0.5 transition-transform">
          <span className="font-bold">
            Nivel {l.level} · {l.title}
          </span>
          <span className="block lx-muted" style={{ fontSize: "0.75em" }}>
            {l.description}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Feedback({ kind, children }: { kind: "ok" | "no" | null; children?: ReactNode }) {
  if (!kind) return <div className="min-h-[3em]" />;
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="min-h-[3em] mt-4 text-center font-bold"
      style={{ color: kind === "ok" ? "var(--lx-ok)" : "var(--lx-no)" }}
    >
      {children}
    </motion.p>
  );
}

export function FinishCard({ stars, total, onAgain }: { stars: number; total: number; onAgain: () => void }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="lx-card mt-8 p-8 text-center">
      <div className="text-[3em]" aria-hidden>
        🏆
      </div>
      <h2 className="text-[1.4em] mt-2">¡Has terminado!</h2>
      <p className="mt-2">
        Has conseguido <b>{stars}</b> {stars === 1 ? "estrella" : "estrellas"} de {total}.
      </p>
      <p className="text-[1.6em] mt-2" aria-hidden>
        {"⭐".repeat(Math.max(1, Math.round((stars / total) * 5)))}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={onAgain} className="lx-btn">
          🔁 Otra vez
        </button>
        <Link href="/lectura" className="lx-btn-ghost">
          Elegir otra actividad
        </Link>
      </div>
    </motion.div>
  );
}
