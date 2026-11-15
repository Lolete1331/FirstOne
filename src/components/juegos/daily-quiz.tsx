"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DefinitionButton } from "@/components/definition-button";
import { PaperCard } from "./paper";
import { NextDay } from "./next-day";
import { ArchiveLinks, type DayBadge } from "./day-archive";
import { dayKey, dayNumber } from "@/lib/oculta/game";
import type { QuizItem } from "@/lib/juegos/quiz-games";

const storageKey = (game: string, day: string) => `${game}:${day}`;
function load(game: string, day: string): number[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(game, day)) ?? "[]") as number[];
  } catch {
    return [];
  }
}
function save(game: string, day: string, a: number[]) {
  try {
    localStorage.setItem(storageKey(game, day), JSON.stringify(a));
  } catch {
    /* sin almacenamiento */
  }
}

/** Estado guardado de un día (para la lista de anteriores). */
export function quizStatus(game: string, total: number) {
  return (day: string): DayBadge | null => {
    const a = load(game, day);
    if (!a.length) return null;
    return a.length >= total ? { text: "✓ Hecho", kind: "done" } : { text: `${a.length} de ${total}`, kind: "partial" };
  };
}

export type QuizConfig = {
  /** Clave del juego (localStorage y semillas). */
  game: string;
  path: string;
  title: string;
  subtitle: string;
  emoji: string;
  items: (day: string) => QuizItem[];
  /** Columnas de opciones: 1 (frases) o 2 (palabras cortas). */
  columns?: 1 | 2;
};

/** Juego diario de preguntas con respuesta única: misma estructura para varios juegos. */
export function DailyQuiz({ config, day: askedDay }: { config: QuizConfig; day?: string }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setToday(dayKey()), 0);
    return () => clearTimeout(t);
  }, []);
  if (!today) return <p className="pt-24 text-center text-muted">Cargando…</p>;
  const day = askedDay ?? today;
  return <Quiz key={day} config={config} day={day} isToday={day === today} />;
}

function Quiz({ config, day, isToday }: { config: QuizConfig; day: string; isToday: boolean }) {
  const items = useMemo(() => config.items(day), [config, day]);
  const total = items.length;
  const [answers, setAnswers] = useState<number[]>(() => load(config.game, day).slice(0, total));
  const [current, setCurrent] = useState(() => Math.min(answers.length, total - 1));
  const [showSummary, setShowSummary] = useState(() => answers.length >= total);
  const [copied, setCopied] = useState(false);

  const done = answers.length >= total;
  const item = items[current];
  const chosen = answers[current];
  const answered = chosen !== undefined;
  const score = answers.filter((a, i) => a === items[i].answer).length;

  const choose = (i: number) => {
    if (answered) return;
    const next = [...answers];
    next[current] = i;
    setAnswers(next);
    save(config.game, day, next);
  };

  const marks = items.map((it, i) => (answers[i] === undefined ? "▫️" : answers[i] === it.answer ? "✅" : "❌")).join("");
  const share = async () => {
    const text = `${config.emoji} ${config.title} n.º ${dayNumber(day)}\n${score}/${total} ${marks}\n¿Y tú? firstone.es${config.path}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* cancelado */
    }
  };

  return (
    <div className="pt-6 pb-4 max-w-xl mx-auto">
      <PaperCard kicker={`N.º ${dayNumber(day)}${isToday ? "" : " · día anterior"}`} title={config.title} subtitle={config.subtitle}>
        <div className="mt-4 flex justify-center gap-2">
          {items.map((it, i) => {
            const a = answers[i];
            const cls = a === undefined ? "border-[#d9c9a3] bg-white/50" : a === it.answer ? "border-[#b08a2e] bg-[#b08a2e]" : "border-[#8c2f39] bg-[#8c2f39]";
            return (
              <button
                key={i}
                aria-label={`Pregunta ${i + 1}`}
                onClick={() => {
                  if (a !== undefined || i === answers.length) {
                    setCurrent(i);
                    setShowSummary(false);
                  }
                }}
                className={`size-3.5 rounded-full border-2 ${cls} ${i === current && !showSummary ? "ring-2 ring-offset-2 ring-offset-[#f7f0e1] ring-[#2b2622]/40" : ""}`}
              />
            );
          })}
        </div>

        {done && showSummary ? (
          <div className="mt-6 text-center">
            <p className="font-[family-name:'Cormorant_Garamond'] font-bold text-5xl">
              {score} de {total}
            </p>
            <p className="font-[family-name:'EB_Garamond'] text-lg">
              {score === total ? "¡Perfecto!" : score >= total - 1 ? "¡Muy bien!" : score >= total / 2 ? "¡Nada mal!" : "Mañana, más."}
            </p>
            <button onClick={share} className="mt-3 rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5">
              {copied ? "¡Copiado!" : "Compartir resultado"}
            </button>
            <ul className="mt-5 space-y-2 text-left">
              {items.map((it, i) => (
                <li key={i} className="rounded-xl border border-[#d9c9a3] bg-white/60 px-4 py-2.5 font-[family-name:'EB_Garamond'] text-[17px] leading-snug">
                  {answers[i] === it.answer ? "✅" : "❌"} {it.explain}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-[#8a7a5c]">
              {current + 1} de {total} · {item.question}
            </p>
            <p
              className={`mt-2 text-center font-[family-name:'Cormorant_Garamond'] font-bold break-words ${
                item.big ? "text-5xl sm:text-6xl tracking-wide" : "text-3xl sm:text-4xl leading-tight"
              }`}
            >
              {item.prompt}
            </p>
            <ul className={`mt-5 grid gap-2.5 ${config.columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {item.options.map((opt, i) => {
                const cls = !answered
                  ? "border-[#d9c9a3] bg-white/70 hover:bg-white hover:border-[#8a7a5c]"
                  : i === item.answer
                    ? "border-[#b08a2e] bg-[#b08a2e] text-white"
                    : i === chosen
                      ? "border-[#8c2f39] bg-[#8c2f39]/10 text-[#8c2f39] line-through decoration-1"
                      : "border-[#e2d6bb] bg-white/40 text-[#8a7a5c]";
                return (
                  <li key={i}>
                    <button
                      onClick={() => choose(i)}
                      disabled={answered}
                      className={`w-full rounded-xl border-2 px-4 py-3 font-[family-name:'EB_Garamond'] text-lg leading-snug transition-colors ${config.columns === 2 ? "text-center" : "text-left"} ${cls}`}
                    >
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
            {answered && (
              <div className="mt-4 text-center">
                <p className="font-[family-name:'EB_Garamond'] text-lg">{chosen === item.answer ? "¡Correcto!" : "¡Vaya!"} {item.explain}</p>
                {item.word && (
                  <div className="mt-2">
                    <DefinitionButton word={item.word} />
                  </div>
                )}
                <button
                  onClick={() => (current < total - 1 ? setCurrent(current + 1) : setShowSummary(true))}
                  className="mt-3 rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5"
                >
                  {current < total - 1 ? "Siguiente →" : "Ver mi resultado"}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="text-center">
          {isToday ? (
            <NextDay label="Nuevas preguntas" />
          ) : (
            <p className="mt-4 text-sm text-[#6b6256]">
              Día anterior · <Link href={config.path} className="underline">Ir al de hoy</Link>
            </p>
          )}
        </div>
      </PaperCard>
      <ArchiveLinks path={config.path} label="Días anteriores" />
    </div>
  );
}
