"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { pastDays, dayNumber } from "@/lib/oculta/game";
import { PaperCard } from "./paper";

export type DayBadge = { text: string; kind: "done" | "partial" };

/** Lista de días anteriores de un juego diario, con lo que guardó este navegador. */
export function DayArchive({ game, path, status }: { game: string; path: string; status: (day: string) => DayBadge | null }) {
  const [rows, setRows] = useState<{ day: string; badge: DayBadge | null }[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setRows(pastDays().map((day) => ({ day, badge: status(day) }))), 0);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <div className="pt-6 pb-4 max-w-xl mx-auto">
      <PaperCard kicker={game} title="Días anteriores" subtitle="¿Te perdiste alguno? Juégalo ahora.">
        {!rows ? (
          <p className="mt-6 text-center text-sm text-[#6b6256]">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="mt-6 text-center font-[family-name:'EB_Garamond'] text-lg">Todavía no hay días anteriores. El de hoy aparecerá aquí mañana.</p>
        ) : (
          <ul className="mt-5 divide-y divide-[#e2d6bb]">
            {rows.map(({ day, badge }) => (
              <li key={day}>
                <Link href={`${path}?dia=${day}`} className="flex items-center gap-3 py-3 hover:bg-white/50 rounded-lg px-2 -mx-2">
                  <span className="w-14 font-[family-name:'Cormorant_Garamond'] font-bold text-xl">N.º {dayNumber(day)}</span>
                  <span className="flex-1 font-[family-name:'EB_Garamond'] text-lg">{formatLong(day)}</span>
                  {!badge ? (
                    <span className="rounded-full bg-[#2b2622] text-[#f7f0e1] text-xs font-bold px-3 py-1">Jugar</span>
                  ) : badge.kind === "done" ? (
                    <span className="rounded-full bg-[#b08a2e] text-white text-xs font-bold px-3 py-1">{badge.text}</span>
                  ) : (
                    <span className="rounded-full border border-[#3e5c76] text-[#3e5c76] text-xs font-bold px-3 py-1">{badge.text}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PaperCard>
      <div className="mt-4 text-center">
        <Link href={path} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-lime/60">
          Ir al de hoy
        </Link>
      </div>
    </div>
  );
}

/** Aviso y enlaces al jugar un día anterior, o botón a la lista de anteriores. */
export function ArchiveLinks({ path, label }: { path: string; label: string }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Link href={`${path}/anteriores`} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-lime/60">
        📚 {label}
      </Link>
      <Link href="/juegos" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-lime/60">
        🎲 Más juegos
      </Link>
    </div>
  );
}

export function formatLong(day: string): string {
  const s = new Date(`${day}T12:00:00Z`).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
