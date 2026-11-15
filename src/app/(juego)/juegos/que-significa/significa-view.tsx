"use client";
import { useEffect, useState } from "react";
import { BackToGames, PaperCard } from "@/components/juegos/paper";
import { NextDay } from "@/components/juegos/next-day";
import type { Quiz } from "@/lib/juegos/significa";

const key = (day: string) => `que-significa:${day}`;
function load(day: string): number[] {
  try {
    return JSON.parse(localStorage.getItem(key(day)) ?? "[]") as number[];
  } catch {
    return [];
  }
}
function save(day: string, a: number[]) {
  try {
    localStorage.setItem(key(day), JSON.stringify(a));
  } catch {
    /* sin almacenamiento */
  }
}

export function SignificaView() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/significa")
      .then((r) => (r.ok ? (r.json() as Promise<Quiz>) : Promise.reject()))
      .then((q) => {
        if (!active) return;
        const a = load(q.day).slice(0, q.questions.length);
        setQuiz(q);
        setAnswers(a);
        setCurrent(Math.min(a.length, q.questions.length - 1));
        setShowSummary(a.length >= q.questions.length); // ya lo había terminado
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="pt-24 text-center text-muted">Ahora mismo no podemos cargar las palabras. Inténtalo dentro de un rato.</p>;
  if (!quiz) return <p className="pt-24 text-center text-muted">Buscando palabras en el diccionario…</p>;

  const total = quiz.questions.length;
  const done = answers.length >= total;
  const q = quiz.questions[current];
  const chosen = answers[current];
  const answered = chosen !== undefined;
  const score = answers.filter((a, i) => a === quiz.questions[i].answer).length;

  const choose = (i: number) => {
    if (answered) return;
    const next = [...answers];
    next[current] = i;
    setAnswers(next);
    save(quiz.day, next);
  };

  const marks = quiz.questions.map((qq, i) => (answers[i] === undefined ? "▫️" : answers[i] === qq.answer ? "✅" : "❌")).join("");
  const shareText = `📖 ¿Qué significa? n.º ${quiz.number}\n${score}/${total} ${marks}\n¿Cuántas sabes tú? firstone.es/juegos/que-significa`;
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
      <PaperCard kicker={`N.º ${quiz.number} · Palabras curiosas`} title="¿Qué significa?" subtitle={`${total} palabras · elige la definición correcta`}>
        {/* Progreso */}
        <div className="mt-4 flex justify-center gap-2">
          {quiz.questions.map((qq, i) => {
            const a = answers[i];
            const cls = a === undefined ? "border-[#d9c9a3] bg-white/50" : a === qq.answer ? "border-[#b08a2e] bg-[#b08a2e]" : "border-[#8c2f39] bg-[#8c2f39]";
            return (
              <button
                key={qq.word}
                onClick={() => {
                  if (a !== undefined || i === answers.length) {
                    setCurrent(i);
                    setShowSummary(false);
                  }
                }}
                aria-label={`Palabra ${i + 1}`}
                className={`size-3.5 rounded-full border-2 ${cls} ${i === current ? "ring-2 ring-offset-2 ring-offset-[#f7f0e1] ring-[#2b2622]/40" : ""}`}
              />
            );
          })}
        </div>

        {done && showSummary && <Summary quiz={quiz} answers={answers} score={score} onShare={share} copied={copied} />}

        {!(done && showSummary) && (
          <div className="mt-6">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-[#8a7a5c]">Palabra {current + 1} de {total}</p>
            <p className="mt-1 text-center font-[family-name:'Cormorant_Garamond'] font-bold text-5xl sm:text-6xl break-words">{q.word}</p>
            <ul className="mt-5 space-y-2.5">
              {q.options.map((opt, i) => {
                const isRight = i === q.answer;
                const isChosen = i === chosen;
                const cls = !answered
                  ? "border-[#d9c9a3] bg-white/70 hover:bg-white hover:border-[#8a7a5c]"
                  : isRight
                    ? "border-[#b08a2e] bg-[#b08a2e] text-white"
                    : isChosen
                      ? "border-[#8c2f39] bg-[#8c2f39]/10 text-[#8c2f39] line-through decoration-1"
                      : "border-[#e2d6bb] bg-white/40 text-[#8a7a5c]";
                return (
                  <li key={i}>
                    <button
                      onClick={() => choose(i)}
                      disabled={answered}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 font-[family-name:'EB_Garamond'] text-[17px] leading-snug transition-colors ${cls}`}
                    >
                      <span className="mr-2 font-bold">{"ABC"[i]}.</span>
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
            {answered && (
              <div className="mt-4 text-center">
                <p className="font-[family-name:'EB_Garamond'] text-lg">
                  {chosen === q.answer ? "¡Correcto!" : "¡Casi! La buena era la marcada en dorado."}
                </p>
                <p className="mt-1 text-[11px] text-[#8a7a5c]">
                  Definición:{" "}
                  <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Wikcionario
                  </a>{" "}
                  (CC BY-SA 4.0)
                </p>
                <button
                  onClick={() => (current < total - 1 ? setCurrent(current + 1) : setShowSummary(true))}
                  className="mt-3 rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5"
                >
                  {current < total - 1 ? "Siguiente palabra →" : done ? "Ver mi resultado" : "Siguiente palabra →"}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="text-center">
          <NextDay label="Palabras nuevas" />
        </div>
      </PaperCard>
      <BackToGames />
    </div>
  );
}

function Summary({ quiz, answers, score, onShare, copied }: { quiz: Quiz; answers: number[]; score: number; onShare: () => void; copied: boolean }) {
  const total = quiz.questions.length;
  const verdict = score === total ? "¡Perfecto! Eres un diccionario andante." : score >= total - 1 ? "¡Muy bien!" : score >= total / 2 ? "¡Nada mal!" : "Hoy has aprendido palabras nuevas.";
  return (
    <div className="mt-6 text-center">
      <p className="font-[family-name:'Cormorant_Garamond'] font-bold text-5xl">
        {score} de {total}
      </p>
      <p className="font-[family-name:'EB_Garamond'] text-lg">{verdict}</p>
      <button onClick={onShare} className="mt-3 rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5">
        {copied ? "¡Copiado!" : "Compartir resultado"}
      </button>
      <ul className="mt-5 space-y-3 text-left">
        {quiz.questions.map((q, i) => (
          <li key={q.word} className="rounded-xl border border-[#d9c9a3] bg-white/60 px-4 py-3">
            <p className="font-[family-name:'Cormorant_Garamond'] font-bold text-2xl">
              {answers[i] === q.answer ? "✅" : "❌"} {q.word}
            </p>
            <p className="font-[family-name:'EB_Garamond'] text-[17px] leading-snug">{q.full}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-[#8a7a5c]">Definiciones de Wikcionario (CC BY-SA 4.0).</p>
    </div>
  );
}
