"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WORD_LISTS } from "@/lib/lectura/words";
import { SyllableWord } from "@/components/lectura/syllable-word";
import { SpeakButton } from "@/components/lectura/speak-button";
import { addStar } from "@/lib/lectura/progress";

export function ListasView() {
  const [listId, setListId] = useState(WORD_LISTS[0].id);
  const [mode, setMode] = useState<"lista" | "una">("lista");
  const [i, setI] = useState(0);
  const [read, setRead] = useState<Set<string>>(new Set());
  const list = WORD_LISTS.find((l) => l.id === listId)!;
  const word = list.words[i];

  const pick = (id: string) => {
    setListId(id);
    setI(0);
  };

  return (
    <div className="pt-4">
      <h1 className="text-[1.5em]">📖 Leer y escuchar</h1>
      <p className="lx-muted mt-1" style={{ fontSize: "0.8em" }}>
        Lee cada palabra despacio, sílaba a sílaba. Si dudas, pulsa 🔊 para escucharla.
      </p>

      {/* Niveles */}
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Listas de palabras" style={{ fontSize: "0.75em" }}>
        {WORD_LISTS.map((l) => (
          <button
            key={l.id}
            role="tab"
            aria-selected={l.id === listId}
            onClick={() => pick(l.id)}
            className={l.id === listId ? "lx-btn" : "lx-btn-ghost"}
          >
            Nivel {l.level}: {l.title}
          </button>
        ))}
      </div>
      <p className="lx-muted mt-3" style={{ fontSize: "0.75em" }}>
        {list.description}
      </p>

      <div className="mt-4 flex gap-2" style={{ fontSize: "0.75em" }}>
        <button onClick={() => setMode("lista")} aria-pressed={mode === "lista"} className={mode === "lista" ? "lx-btn" : "lx-btn-ghost"}>
          Ver toda la lista
        </button>
        <button onClick={() => setMode("una")} aria-pressed={mode === "una"} className={mode === "una" ? "lx-btn" : "lx-btn-ghost"}>
          Una a una
        </button>
      </div>

      {mode === "lista" ? (
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.words.map((w) => (
            <li key={w.word} className="lx-card p-4 flex items-center gap-3">
              <span className="text-[1.6em]" aria-hidden>
                {w.emoji}
              </span>
              <span className="text-[1.25em] font-bold flex-1 break-words">
                <SyllableWord syllables={w.syllables} />
              </span>
              <SpeakButton text={w.word} syllables={w.syllables} label="Oír" className="!px-3 shrink-0" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6">
          <p className="lx-muted text-center" style={{ fontSize: "0.75em" }}>
            Palabra {i + 1} de {list.words.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={word.word}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="lx-card mt-2 p-8 text-center"
            >
              <div className="text-[3em]" aria-hidden>
                {word.emoji}
              </div>
              <div className="text-[2.4em] font-bold mt-2 break-words">
                <SyllableWord syllables={word.syllables} />
              </div>
              <p className="lx-muted mt-2" style={{ fontSize: "0.8em" }}>
                {word.syllables.join(" · ")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <SpeakButton text={word.word} syllables={word.syllables} />
                <button
                  className="lx-btn"
                  disabled={read.has(word.word)}
                  onClick={() => {
                    setRead(new Set(read).add(word.word));
                    addStar("listas");
                  }}
                >
                  {read.has(word.word) ? "⭐ ¡Leída!" : "¡La he leído! ⭐"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex justify-between gap-3" style={{ fontSize: "0.85em" }}>
            <button className="lx-btn-ghost whitespace-nowrap" disabled={i === 0} onClick={() => setI(i - 1)}>
              ← Anterior
            </button>
            <button className="lx-btn-ghost whitespace-nowrap" onClick={() => setI((i + 1) % list.words.length)}>
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
