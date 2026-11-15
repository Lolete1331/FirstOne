"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DefinitionButton } from "@/components/definition-button";
import { PaperCard } from "@/components/juegos/paper";
import { NextDay } from "@/components/juegos/next-day";
import { ArchiveLinks, type DayBadge } from "@/components/juegos/day-archive";
import { useDayParam } from "@/lib/hooks/use-day-param";
import { dayKey, dayNumber, foldWord } from "@/lib/oculta/game";
import { levelFor, MIN_LEN, points } from "@/lib/juegos/anagramas";

type Data = { day: string; letters: string[]; words: string[]; display: Record<string, string> };
type Saved = { found: string[]; gaveUp: boolean };
const key = (day: string) => `anagramas:${day}`;
function load(day: string): Saved {
  try {
    const raw = localStorage.getItem(key(day));
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* sin almacenamiento */
  }
  return { found: [], gaveUp: false };
}
function save(day: string, s: Saved) {
  try {
    localStorage.setItem(key(day), JSON.stringify(s));
  } catch {
    /* sin almacenamiento */
  }
}

export function anagramasStatus(day: string): DayBadge | null {
  const s = load(day);
  if (!s.found.length) return null;
  return { text: `${s.found.length} palabras`, kind: s.gaveUp ? "done" : "partial" };
}

export function View() {
  const asked = useDayParam();
  return <Game key={asked ?? "hoy"} day={asked} />;
}

function Game({ day: askedDay }: { day?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<Saved>({ found: [], gaveUp: false });
  const [input, setInput] = useState<number[]>([]); // índices de las letras usadas
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const isToday = !askedDay || askedDay === dayKey();

  useEffect(() => {
    let active = true;
    fetch(askedDay ? `/api/anagramas?day=${askedDay}` : "/api/anagramas")
      .then((r) => (r.ok ? (r.json() as Promise<Data>) : Promise.reject()))
      .then((d) => {
        if (!active) return;
        setData(d);
        setState(load(d.day));
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [askedDay]);

  const valid = useMemo(() => new Set(data?.words ?? []), [data]);
  const max = useMemo(() => (data ? data.words.reduce((s, w) => s + points(w), 0) : 0), [data]);
  const score = state.found.reduce((s, w) => s + points(w), 0);
  const word = data ? input.map((i) => data.letters[i]).join("").toLocaleLowerCase("es") : "";

  const update = (s: Saved) => {
    setState(s);
    if (data) save(data.day, s);
  };
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 1600);
  };

  const submit = useCallback(() => {
    if (!data || state.gaveUp) return;
    const w = foldWord(word);
    setInput([]);
    if ([...w].length < MIN_LEN) return flash(`Tiene que tener ${MIN_LEN} letras o más`);
    if (state.found.includes(w)) return flash("Esa ya la tienes");
    if (!valid.has(w)) return flash("No está en el diccionario (valen palabras en singular)");
    update({ ...state, found: [...state.found, w] });
    flash([...w].length === 7 ? `¡Con las 7 letras! +${points(w)}` : `¡Bien! +${points(w)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, state, word, valid]);

  // Teclado físico
  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") return submit();
      if (e.key === "Backspace") return setInput((s) => s.slice(0, -1));
      const ch = foldWord(e.key).toLocaleUpperCase("es");
      if (ch.length !== 1) return;
      setInput((s) => {
        const free = data.letters.findIndex((l, i) => l === ch && !s.includes(i));
        return free >= 0 ? [...s, free] : s;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, submit]);

  if (error) return <p className="pt-24 text-center text-muted">Ahora mismo no podemos cargar el juego. Inténtalo dentro de un rato.</p>;
  if (!data) return <p className="pt-24 text-center text-muted">Preparando las letras…</p>;

  const shuffle = () => setOrder((o) => [...o].sort(() => Math.random() - 0.5));
  const level = levelFor(score, max);
  const shareText = `🔀 Anagramas n.º ${dayNumber(data.day)}\n${state.found.length} palabras · ${score} puntos · ${level}\n¿Y tú? firstone.es/juegos/anagramas`;
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: shareText });
      else await navigator.clipboard.writeText(shareText);
    } catch {
      /* cancelado */
    }
  };
  const foundSorted = [...state.found].sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div className="pt-6 pb-4 max-w-xl mx-auto">
      <PaperCard
        kicker={`N.º ${dayNumber(data.day)} · Anagramas${isToday ? "" : " · día anterior"}`}
        title="Anagramas"
        subtitle={`Forma palabras de ${MIN_LEN} letras o más con estas 7. Cada letra, una vez.`}
      >
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="font-bold">{level}</span>
            <span className="text-[#6b6256]">
              {state.found.length} de {data.words.length} palabras · {score} puntos
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#e2d6bb] overflow-hidden">
            <div className="h-full bg-[#b08a2e] transition-all" style={{ width: `${max ? Math.min(100, (100 * score) / max) : 0}%` }} />
          </div>
        </div>

        <p className="mt-5 min-h-12 text-center font-[family-name:'Cormorant_Garamond'] font-bold text-4xl tracking-[0.15em] uppercase">{word || " "}</p>
        <p className={`min-h-6 text-center text-sm font-bold ${msg?.startsWith("¡") ? "text-[#8a6d22]" : "text-[#8c2f39]"}`}>{msg}</p>

        <div className="mt-2 flex justify-center gap-1.5 flex-wrap">
          {order.map((i) => {
            const used = input.includes(i);
            return (
              <button
                key={i}
                disabled={used || state.gaveUp}
                onClick={() => setInput((s) => [...s, i])}
                className={`size-12 sm:size-14 rounded-xl border-2 font-[family-name:'Cormorant_Garamond'] font-bold text-3xl transition-all ${
                  used ? "border-[#e2d6bb] bg-white/30 text-[#d6ccb6]" : "border-[#b08a2e] bg-white text-[#2b2622] hover:-translate-y-0.5"
                }`}
              >
                {data.letters[i]}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setInput((s) => s.slice(0, -1))} className="rounded-full border border-[#2b2622]/30 px-4 py-2 text-sm font-bold">
            Borrar
          </button>
          <button onClick={shuffle} className="rounded-full border border-[#2b2622]/30 px-4 py-2 text-sm font-bold">
            Mezclar
          </button>
          <button onClick={submit} disabled={state.gaveUp} className="rounded-full bg-[#2b2622] text-[#f7f0e1] px-6 py-2 text-sm font-bold">
            Enviar
          </button>
        </div>

        {foundSorted.length > 0 && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a7a5c]">Tus palabras</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {foundSorted.map((w) => (
                <li key={w} className={`rounded-full px-3 py-1 font-[family-name:'EB_Garamond'] text-[17px] ${[...w].length === 7 ? "bg-[#b08a2e] text-white" : "bg-white/70 border border-[#d9c9a3]"}`}>
                  {data.display[w] ?? w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button onClick={share} className="rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-5 py-2.5 text-sm">
            Compartir resultado
          </button>
          {!state.gaveUp && (
            <button
              onClick={() => window.confirm("¿Ver todas las soluciones? Ya no podrás añadir más palabras hoy.") && update({ ...state, gaveUp: true })}
              className="rounded-full border border-[#2b2622]/30 px-5 py-2.5 text-sm font-bold"
            >
              Ver soluciones
            </button>
          )}
        </div>

        {state.gaveUp && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a7a5c]">Todas las palabras ({data.words.length})</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {data.words.map((w) => (
                <li key={w} className={`flex items-center gap-1 rounded-full px-3 py-1 font-[family-name:'EB_Garamond'] text-[17px] border ${state.found.includes(w) ? "bg-[#b08a2e] border-[#b08a2e] text-white" : "bg-white/60 border-[#d9c9a3]"}`}>
                  {data.display[w] ?? w}
                  <DefinitionButton word={data.display[w] ?? w} variant="icon" className="!size-6 !bg-white/90 !border-transparent" />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[#8a7a5c]">Las tildes no cuentan al escribir. Pulsa 📖 para ver qué significa cada una.</p>
          </div>
        )}

        <div className="text-center">
          {isToday ? (
            <NextDay label="Letras nuevas" />
          ) : (
            <p className="mt-4 text-sm text-[#6b6256]">
              Día anterior · <Link href="/juegos/anagramas" className="underline">Ir al de hoy</Link>
            </p>
          )}
        </div>
      </PaperCard>
      <ArchiveLinks path="/juegos/anagramas" label="Días anteriores" />
    </div>
  );
}
