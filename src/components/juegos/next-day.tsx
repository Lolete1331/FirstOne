"use client";
import { useEffect, useState } from "react";
import { msToNextDay } from "@/lib/oculta/game";

/** «Nuevo juego a las 01:00 (tu hora) · en 05:12:33». */
export function NextDay({ label = "Nuevo juego", className = "mt-4 text-sm text-[#6b6256]" }: { label?: string; className?: string }) {
  const [ms, setMs] = useState<number | null>(null);
  const [at, setAt] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      setMs(msToNextDay());
      const d = new Date();
      setAt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }));
    };
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  if (ms === null) return null;
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <p className={className}>
      {label} cada día a las {at} (tu hora) · próximo en{" "}
      <span className="font-mono">{pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}</span>
    </p>
  );
}
