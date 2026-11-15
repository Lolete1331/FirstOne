"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DefinitionButton } from "@/components/definition-button";
import { PaperCard } from "@/components/juegos/paper";
import { NextDay } from "@/components/juegos/next-day";
import { ArchiveLinks, type DayBadge } from "@/components/juegos/day-archive";
import { useDayParam } from "@/lib/hooks/use-day-param";
import { dayKey, dayNumber } from "@/lib/oculta/game";
import { hangmanLetters, hangmanWords, MAX_MISSES, ROUNDS } from "@/lib/juegos/ahorcado";
import { maskWord, pickDefinition, shorten } from "@/lib/juegos/significa-text";

const KEYS = ["QWERTYUIOP", "ASDFGHJKLÑ", "ZXCVBNM"];
type Saved = { guesses: string[][] }; // letras probadas en cada ronda
const key = (day: string) => `ahorcado:${day}`;
function load(day: string): Saved {
  try {
    const raw = localStorage.getItem(key(day));
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* sin almacenamiento */
  }
  return { guesses: [[]] };
}
function save(day: string, s: Saved) {
  try {
    localStorage.setItem(key(day), JSON.stringify(s));
  } catch {
    /* sin almacenamiento */
  }
}

function roundState(word: string, guessed: string[]) {
  const letters = hangmanLetters(word);
  const misses = guessed.filter((g) => !letters.includes(g)).length;
  const won = letters.every((l) => guessed.includes(l));
  return { letters, misses, won, lost: misses >= MAX_MISSES, over: won || misses >= MAX_MISSES };
}

export function ahorcadoStatus(day: string): DayBadge | null {
  const s = load(day);
  if (!s.guesses.some((g) => g.length)) return null;
  const words = hangmanWords(day);
  const results = s.guesses.map((g, i) => (words[i] ? roundState(words[i].word, g) : null)).filter(Boolean);
  const finished = results.filter((r) => r!.over).length;
  const won = results.filter((r) => r!.won).length;
  return finished >= ROUNDS ? { text: `✓ ${won}/${ROUNDS}`, kind: "done" } : { text: `${finished} de ${ROUNDS}`, kind: "partial" };
}

export function View() {
  const asked = useDayParam();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setToday(dayKey()), 0);
    return () => clearTimeout(t);
  }, []);
  if (!today) return <p className="pt-24 text-center text-muted">Cargando…</p>;
  const day = asked ?? today;
  return <Game key={day} day={day} isToday={day === today} />;
}

function Game({ day, isToday }: { day: string; isToday: boolean }) {
  const words = useMemo(() => hangmanWords(day), [day]);
  const [state, setState] = useState<Saved>(() => load(day));
  const round = Math.min(state.guesses.length - 1, ROUNDS - 1);
  const current = words[round];
  const guessed = state.guesses[round] ?? [];
  const rs = roundState(current.word, guessed);
  const results = state.guesses.map((g, i) => roundState(words[i].word, g));
  const allDone = state.guesses.length >= ROUNDS && rs.over;
  const won = results.filter((r) => r.won).length;

  const update = (s: Saved) => {
    setState(s);
    save(day, s);
  };
  const guess = (l: string) => {
    if (rs.over || guessed.includes(l)) return;
    const g = state.guesses.map((x, i) => (i === round ? [...x, l] : x));
    update({ guesses: g });
  };
  const next = () => update({ guesses: [...state.guesses, []] });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLocaleUpperCase("es");
      if (/^[A-ZÑ]$/.test(k)) guess(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const shareText = `🎯 El ahorcado n.º ${dayNumber(day)}\n${results.map((r) => (r.won ? "✅" : "❌")).join("")} ${won}/${ROUNDS}\n¿Y tú? firstone.es/juegos/ahorcado`;
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: shareText });
      else await navigator.clipboard.writeText(shareText);
    } catch {
      /* cancelado */
    }
  };

  return (
    <div className="pt-6 pb-4 max-w-xl mx-auto">
      <PaperCard
        kicker={`N.º ${dayNumber(day)} · El ahorcado${isToday ? "" : " · día anterior"}`}
        title="El ahorcado"
        subtitle={`Tres palabras. Para cada una, ${MAX_MISSES} fallos como mucho.`}
      >
        <p className="mt-3 text-center text-xs uppercase tracking-[0.25em] text-[#8a7a5c]">
          Palabra {round + 1} de {ROUNDS}
          {current.theme ? (
            <>
              {" "}
              · Tema: <b className="text-[#2b2622]">{current.theme}</b>
            </>
          ) : (
            ` · ${rs.letters.length} letras`
          )}
        </p>
        {!current.theme && !rs.over && <Hint key={current.word} word={current.word} />}
        <Gallows misses={rs.misses} />
        <p className="mt-3 text-center font-[family-name:'Cormorant_Garamond'] font-bold text-4xl tracking-[0.3em]">
          {rs.letters.map((l, i) => (guessed.includes(l) || rs.over ? <span key={i} className={!guessed.includes(l) ? "text-[#8c2f39]" : ""}>{[...current.word.toLocaleUpperCase("es")][i]}</span> : <span key={i}>_</span>))}
        </p>
        <p className="mt-1 text-center text-sm text-[#6b6256]">
          Fallos: {rs.misses} de {MAX_MISSES}
        </p>

        {rs.over ? (
          <div className="mt-4 text-center">
            <p className="font-[family-name:'EB_Garamond'] text-lg">
              {rs.won ? "¡La has adivinado!" : "¡Ahorcado!"} Era «{current.word}».
            </p>
            <div className="mt-2">
              <DefinitionButton word={current.word} />
            </div>
            {allDone ? (
              <div className="mt-4">
                <p className="font-[family-name:'Cormorant_Garamond'] font-bold text-4xl">
                  {won} de {ROUNDS}
                </p>
                <button onClick={share} className="mt-2 rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5">
                  Compartir resultado
                </button>
              </div>
            ) : (
              <button onClick={next} className="mt-3 rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5">
                Siguiente palabra →
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-1.5 select-none">
            {KEYS.map((row) => (
              <div key={row} className="flex justify-center gap-1">
                {[...row].map((l) => {
                  const used = guessed.includes(l);
                  const hit = used && rs.letters.includes(l);
                  return (
                    <button
                      key={l}
                      onClick={() => guess(l)}
                      disabled={used}
                      className={`h-11 w-[8.4%] max-w-10 rounded-md border text-sm font-bold ${
                        !used ? "bg-white/80 border-[#d9c9a3]" : hit ? "bg-[#b08a2e] border-[#b08a2e] text-white" : "bg-[#d6ccb6] border-[#d6ccb6] text-[#8a7a5c]"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div className="text-center">
          {isToday ? (
            <NextDay label="Palabras nuevas" />
          ) : (
            <p className="mt-4 text-sm text-[#6b6256]">
              Día anterior · <Link href="/juegos/ahorcado" className="underline">Ir al de hoy</Link>
            </p>
          )}
        </div>
      </PaperCard>
      <ArchiveLinks path="/juegos/ahorcado" label="Días anteriores" />
    </div>
  );
}

/** Pista opcional: la definición de la palabra (Wikcionario), sin la propia palabra. */
function Hint({ word }: { word: string }) {
  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "none">("idle");
  const ask = async () => {
    setState("loading");
    try {
      const r = await fetch(`/api/define?word=${encodeURIComponent(word)}`);
      const d = (await r.json()) as { groups?: { senses: { text: string }[] }[] };
      const def = pickDefinition((d.groups ?? []).flatMap((g) => g.senses.map((s) => s.text)), word);
      if (def) setText(shorten(maskWord(def, word), 160));
      else setState("none");
    } catch {
      setState("none");
    }
  };
  if (text)
    return (
      <p className="mt-2 rounded-xl border border-[#d9c9a3] bg-white/60 px-4 py-2 text-center font-[family-name:'EB_Garamond'] text-[17px] leading-snug">
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#8a7a5c]">Pista · </span>
        {text}
      </p>
    );
  return (
    <p className="mt-2 text-center">
      {state === "none" ? (
        <span className="text-sm text-[#8a7a5c]">Esta palabra no tiene pista. ¡Suerte!</span>
      ) : (
        <button onClick={ask} disabled={state === "loading"} className="text-sm underline underline-offset-4 text-[#6b6256]">
          {state === "loading" ? "Buscando…" : "💡 ¿Una pista? Ver su definición"}
        </button>
      )}
    </p>
  );
}

/** Dibujo sencillo de la horca, a tinta. */
function Gallows({ misses }: { misses: number }) {
  const s = { stroke: "#2b2622", strokeWidth: 3, strokeLinecap: "round" as const, fill: "none" };
  return (
    <svg viewBox="0 0 120 120" className="mx-auto mt-2 h-32 w-32" aria-label={`${misses} fallos`}>
      <path d="M15 110 H75 M35 110 V12 H80 V24" {...s} stroke="#8a7a5c" />
      {misses > 0 && <circle cx="80" cy="33" r="9" {...s} />}
      {misses > 1 && <path d="M80 42 V72" {...s} />}
      {misses > 2 && <path d="M80 50 L66 62" {...s} />}
      {misses > 3 && <path d="M80 50 L94 62" {...s} />}
      {misses > 4 && <path d="M80 72 L68 92" {...s} />}
      {misses > 5 && <path d="M80 72 L92 92" {...s} />}
    </svg>
  );
}
