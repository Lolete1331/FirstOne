"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { MAX_ATTEMPTS } from "@/lib/oculta/game";
import { readLocal } from "@/lib/oculta/local";
import type { ArchiveState, DayStatus } from "@/lib/oculta/types";

export function ArchiveView() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ArchiveState | null>(null);
  const [mine, setMine] = useState<Record<string, DayStatus>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    fetch("/api/oculta/anteriores", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<ArchiveState>) : Promise.reject()))
      .then((d) => {
        if (!active) return;
        setData(d);
        if (d.mine) setMine(d.mine);
        else {
          // Sin cuenta: lo que haya guardado este navegador.
          const local: Record<string, DayStatus> = {};
          for (const { day } of d.days) {
            const g = readLocal(day);
            if (g.rows.length) local[day] = { solved: g.solved, attempts: g.rows.length, finished: g.finished };
          }
          setMine(local);
        }
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [authLoading, user?.id]);

  return (
    <div className="pt-6 max-w-xl mx-auto">
      <div className="rounded-3xl border border-[#d9c9a3] bg-[#f7f0e1] text-[#2b2622] shadow-2xl px-4 sm:px-8 py-6">
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-[#8a7a5c]">La palabra oculta</p>
        <h1 className="mt-1 text-center font-[family-name:'Cormorant_Garamond'] font-bold text-4xl">Palabras anteriores</h1>
        <p className="mt-1 text-center font-[family-name:'EB_Garamond'] italic text-[#6b6256]">
          ¿Te perdiste alguna? Juégala ahora. La clasificación de cada día solo cuenta a quien la encontró ese día.
        </p>

        {error ? (
          <p className="mt-6 text-center text-sm text-[#8c2f39]">No hemos podido cargar la lista. Recarga la página.</p>
        ) : !data ? (
          <p className="mt-6 text-center text-sm text-[#6b6256]">Cargando…</p>
        ) : data.days.length === 0 ? (
          <p className="mt-6 text-center font-[family-name:'EB_Garamond'] text-lg">
            Todavía no hay palabras anteriores. La de hoy aparecerá aquí mañana.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-[#e2d6bb]">
            {data.days.map((d) => {
              const st = mine[d.day];
              return (
                <li key={d.day}>
                  <Link href={`/palabra-oculta?dia=${d.day}`} className="flex items-center gap-3 py-3 hover:bg-white/50 rounded-lg px-2 -mx-2">
                    <span className="w-14 font-[family-name:'Cormorant_Garamond'] font-bold text-xl">N.º {d.number}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-[family-name:'EB_Garamond'] text-lg leading-tight">{formatLong(d.day)}</span>
                      <span className="block text-xs text-[#8a7a5c]">
                        {d.solvers === 1 ? "1 persona la encontró ese día" : `${d.solvers.toLocaleString("es")} personas la encontraron ese día`}
                      </span>
                    </span>
                    <Status st={st} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mt-4 text-center">
        <Link href="/palabra-oculta" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-lime/60">
          🔎 Ir a la palabra de hoy
        </Link>
      </div>
    </div>
  );
}

function Status({ st }: { st?: DayStatus }) {
  if (!st) return <span className="rounded-full bg-[#2b2622] text-[#f7f0e1] text-xs font-bold px-3 py-1">Jugar</span>;
  if (st.solved) return <span className="rounded-full bg-[#b08a2e] text-white text-xs font-bold px-3 py-1">✓ {st.attempts}/{MAX_ATTEMPTS}</span>;
  if (st.finished) return <span className="rounded-full bg-[#d6ccb6] text-[#6b6256] text-xs font-bold px-3 py-1">✗ No encontrada</span>;
  return <span className="rounded-full border border-[#3e5c76] text-[#3e5c76] text-xs font-bold px-3 py-1">A medias</span>;
}

function formatLong(day: string): string {
  const s = new Date(`${day}T12:00:00Z`).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
