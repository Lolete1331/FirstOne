"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { countdownParts, currentGameYear, nextResetAt, yearProgress } from "@/lib/time/year";

/** Reloj que se actualiza cada segundo. null en el servidor (evita desajustes de hidratación). */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [intervalMs]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Chip compacto para la cabecera. */
export function CountdownChip() {
  const now = useNow();
  if (!now) return <span className="hidden sm:block w-28" />;
  const p = countdownParts(nextResetAt(now), now);
  return (
    <span
      title={`Reinicio: 1 de enero de ${currentGameYear(now) + 1}, 00:00 UTC`}
      className="hidden sm:flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted"
    >
      <span className="size-1.5 rounded-full bg-pink animate-pulse" />
      {p.days}d {pad(p.hours)}:{pad(p.minutes)}:{pad(p.seconds)}
    </span>
  );
}

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[1.15em] overflow-hidden font-mono font-bold tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-sans">{label}</span>
    </div>
  );
}

/** Cuenta atrás grande hasta el reinicio anual. */
export function CountdownBig() {
  const now = useNow();
  const year = now ? currentGameYear(now) : null;
  const p = now ? countdownParts(nextResetAt(now), now) : null;
  const progress = now ? yearProgress(now) : 0;

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          La carrera {year ?? ""} termina en
        </p>
        <p className="text-xs font-mono text-muted">1 ene · 00:00 UTC</p>
      </div>
      <div className="flex items-end justify-between text-3xl sm:text-4xl">
        <Digit value={p ? String(p.days) : "—"} label="días" />
        <span className="text-muted pb-5">:</span>
        <Digit value={p ? pad(p.hours) : "—"} label="horas" />
        <span className="text-muted pb-5">:</span>
        <Digit value={p ? pad(p.minutes) : "—"} label="min" />
        <span className="text-muted pb-5">:</span>
        <Digit value={p ? pad(p.seconds) : "—"} label="seg" />
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lime via-cyan to-pink"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{progress.toFixed(1)}% del año {year ?? ""} completado</p>
    </div>
  );
}
