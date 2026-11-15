"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DefinitionButton } from "@/components/definition-button";
import { mmss, PaperCard } from "@/components/juegos/paper";
import { NextDay } from "@/components/juegos/next-day";
import { ArchiveLinks, type DayBadge } from "@/components/juegos/day-archive";
import { useDayParam } from "@/lib/hooks/use-day-param";
import { recordGameResult } from "@/lib/juegos/record";
import Link from "next/link";
import { dayKey } from "@/lib/oculta/game";
import { generateSopa, lineCells, matchWord, type Cell } from "@/lib/juegos/sopa";

/** Colores (translúcidos) para marcar cada palabra encontrada. */
const COLORS = ["#b08a2e", "#3e5c76", "#8c2f39", "#4f6b3a", "#7a4f8a", "#c0703a", "#2f6f6a", "#6b6256", "#a8506e", "#5a6fb0"];

type Saved = { found: number[]; startedAt: number | null; elapsed: number | null };
const key = (day: string) => `sopa:${day}`;
function load(day: string): Saved {
  try {
    const raw = localStorage.getItem(key(day));
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* sin almacenamiento */
  }
  return { found: [], startedAt: null, elapsed: null };
}
function save(day: string, s: Saved) {
  try {
    localStorage.setItem(key(day), JSON.stringify(s));
  } catch {
    /* sin almacenamiento */
  }
}

export function SopaView() {
  const asked = useDayParam();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setToday(dayKey()), 0);
    return () => clearTimeout(t);
  }, []);
  if (!today) return <p className="pt-24 text-center text-muted">Cargando…</p>;
  const day = asked ?? today;
  return <Board key={day} day={day} isToday={day === today} />;
}

/** Estado guardado de una sopa, para la lista de anteriores. */
export function sopaStatus(day: string): DayBadge | null {
  const s = load(day);
  if (!s.found.length) return null;
  const total = generateSopa(day).words.length;
  return s.found.length >= total ? { text: `✓ ${mmss(s.elapsed ?? 0)}`, kind: "done" } : { text: `${s.found.length} de ${total}`, kind: "partial" };
}

function Board({ day, isToday }: { day: string; isToday: boolean }) {
  const sopa = useMemo(() => generateSopa(day), [day]);
  const [state, setState] = useState<Saved>(() => load(day));
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const dragging = useRef(false);
  const downCell = useRef<Cell | null>(null);
  const done = state.found.length === sopa.words.length;

  useEffect(() => {
    if (done) recordGameResult("sopa", day, sopa.words.length, sopa.words.length, state.elapsed ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done || !state.startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [done, state.startedAt]);

  const update = (s: Saved) => {
    setState(s);
    save(day, s);
  };

  // Casilla de cada letra encontrada → color de su palabra.
  const foundColor = useMemo(() => {
    const m = new Map<string, string>();
    state.found.forEach((wi) => sopa.words[wi].cells.forEach(([r, c]) => m.set(`${r},${c}`, COLORS[wi % COLORS.length])));
    return m;
  }, [state.found, sopa]);

  const selection = useMemo(() => (anchor && hover ? lineCells(anchor, hover) ?? [anchor] : anchor ? [anchor] : []), [anchor, hover]);
  const selected = useMemo(() => new Set(selection.map(([r, c]) => `${r},${c}`)), [selection]);

  const tryCells = useCallback(
    (cells: Cell[]) => {
      if (cells.length < 2) return false;
      const wi = matchWord(sopa, cells);
      if (wi >= 0 && !state.found.includes(wi)) {
        const found = [...state.found, wi];
        const startedAt = state.startedAt ?? Date.now();
        const elapsed = found.length === sopa.words.length ? Math.round((Date.now() - startedAt) / 1000) : null;
        update({ found, startedAt, elapsed });
        if (elapsed !== null) recordGameResult("sopa", day, sopa.words.length, sopa.words.length, elapsed);
        setFlash(`¡${sopa.words[wi].word}!`);
        setTimeout(() => setFlash(null), 1200);
        return true;
      }
      return false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sopa, state],
  );

  const cellFromPoint = (x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-r]");
    return el ? [Number(el.dataset.r), Number(el.dataset.c)] : null;
  };

  const onDown = (e: React.PointerEvent) => {
    if (done) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    if (!state.startedAt) update({ ...state, startedAt: Date.now() });
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragging.current = true;
    downCell.current = cell;
    // Modo «dos toques»: si ya había una letra marcada, este toque cierra la selección.
    if (anchor && (anchor[0] !== cell[0] || anchor[1] !== cell[1])) {
      const cells = lineCells(anchor, cell);
      if (cells && tryCells(cells)) {
        setAnchor(null);
        setHover(null);
        dragging.current = false;
        return;
      }
    }
    setAnchor(cell);
    setHover(cell);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || !anchor) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell && lineCells(anchor, cell)) setHover(cell);
  };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (anchor && hover && (anchor[0] !== hover[0] || anchor[1] !== hover[1])) {
      tryCells(selection);
      setAnchor(null);
      setHover(null);
    }
    // Si se soltó en la misma casilla, queda marcada para el modo «dos toques».
  };

  const elapsed = state.elapsed ?? (state.startedAt ? Math.max(0, Math.round((now - state.startedAt) / 1000)) : 0);
  const shareText = `🔤 Sopa de letras n.º ${sopa.number} · ${sopa.theme}\nLa he completado en ${mmss(state.elapsed ?? 0)}\n¿Y tú? firstone.es/juegos/sopa-de-letras`;
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: shareText });
      else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
      }
    } catch {
      /* cancelado */
    }
  };

  return (
    <div className="pt-6 pb-4 max-w-xl mx-auto">
      <PaperCard
        kicker={`N.º ${sopa.number} · Sopa de letras${isToday ? "" : " · día anterior"}`}
        title={sopa.theme}
        subtitle={<>Encuentra las {sopa.words.length} palabras · arrastra el dedo o toca la primera y la última letra</>}
      >
        <div className="mt-3 flex justify-between text-xs text-[#8a7a5c] px-1">
          <span>
            {state.found.length} de {sopa.words.length}
          </span>
          <span className="font-mono">{mmss(elapsed)}</span>
        </div>
        <div
          className="mt-1 grid select-none touch-none rounded-xl border border-[#d9c9a3] bg-white/50 p-1.5"
          style={{ gridTemplateColumns: `repeat(${sopa.size}, minmax(0, 1fr))` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          {sopa.grid.map((row, r) =>
            row.map((ch, c) => {
              const k = `${r},${c}`;
              const color = foundColor.get(k);
              const sel = selected.has(k);
              return (
                <span
                  key={k}
                  data-r={r}
                  data-c={c}
                  className={`aspect-square grid place-items-center rounded-md font-[family-name:'Cormorant_Garamond'] font-bold text-[clamp(1rem,5.2vw,1.6rem)] leading-none transition-colors ${
                    sel ? "bg-[#2b2622] text-[#f7f0e1]" : color ? "text-white" : "text-[#2b2622]"
                  }`}
                  style={!sel && color ? { backgroundColor: color } : undefined}
                >
                  {ch}
                </span>
              );
            }),
          )}
        </div>
        <p className="mt-2 min-h-6 text-center font-[family-name:'EB_Garamond'] text-lg text-[#8a6d22]">{flash}</p>

        <ul className="mt-1 flex flex-wrap justify-center gap-2">
          {sopa.words.map((w, i) => {
            const found = state.found.includes(i);
            return (
              <li
                key={w.word}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-[family-name:'EB_Garamond'] text-[17px] ${
                  found ? "border-transparent text-white" : "border-[#d9c9a3] bg-white/60"
                }`}
                style={found ? { backgroundColor: COLORS[i % COLORS.length] } : undefined}
              >
                <span className={found ? "line-through decoration-1" : ""}>{w.word}</span>
                {found && <DefinitionButton word={w.word} variant="icon" className="!size-6 !bg-white/90 !border-transparent" />}
              </li>
            );
          })}
        </ul>
        {state.found.length > 0 && !done && (
          <p className="mt-2 text-center text-xs text-[#8a7a5c]">Pulsa 📖 junto a una palabra encontrada para ver su significado.</p>
        )}

        {done && (
          <div className="mt-5 text-center">
            <p className="font-[family-name:'Cormorant_Garamond'] font-bold text-3xl">¡Sopa completada!</p>
            <p className="font-[family-name:'EB_Garamond'] text-lg">Has encontrado las {sopa.words.length} palabras en {mmss(state.elapsed ?? 0)}.</p>
            <button onClick={share} className="mt-3 rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5">
              {copied ? "¡Copiado!" : "Compartir resultado"}
            </button>
          </div>
        )}
        <div className="text-center">
          {isToday ? (
            <NextDay label="Nueva sopa" />
          ) : (
            <p className="mt-4 text-sm text-[#6b6256]">
              Sopa de un día anterior · <Link href="/juegos/sopa-de-letras" className="underline">Ir a la de hoy</Link>
            </p>
          )}
        </div>
      </PaperCard>
      <ArchiveLinks path="/juegos/sopa-de-letras" label="Sopas anteriores" />
    </div>
  );
}
