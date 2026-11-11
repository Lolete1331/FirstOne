"use client";
import { useRef, useState, type FormEvent } from "react";
import { ActivityHeader, Feedback, FinishCard, LevelPicker, PRAISE, ROUNDS, pickOne } from "@/components/lectura/activity";
import { SyllableWord } from "@/components/lectura/syllable-word";
import { getList, type Word } from "@/lib/lectura/words";
import { checkDictation, letterDiff, shuffle } from "@/lib/lectura/shuffle";
import { addStar } from "@/lib/lectura/progress";
import { speak, speakSyllables } from "@/lib/lectura/speech";
import { VOICE_RATES, useLecturaSettings } from "@/lib/lectura/settings";

export function DictadoActivity() {
  const { voice } = useLecturaSettings();
  const rate = VOICE_RATES[voice];
  const [items, setItems] = useState<Word[] | null>(null);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"ok" | "accent" | "wrong" | null>(null);
  const [tries, setTries] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const start = (id: string) => {
    const list = shuffle(getList(id)!.words).slice(0, ROUNDS);
    setItems(list);
    setI(0);
    setValue("");
    setResult(null);
    setTries(0);
    setReveal(false);
    setStars(0);
    setDone(false);
    speak(list[0].word, rate);
  };

  if (!items) {
    return (
      <>
        <ActivityHeader emoji="🎧" title="Escribe lo que oyes" help="Escucha la palabra y escríbela. Puedes escucharla las veces que quieras." />
        <LevelPicker onPick={start} />
      </>
    );
  }
  if (done) {
    return (
      <>
        <ActivityHeader emoji="🎧" title="Escribe lo que oyes" help="" />
        <FinishCard stars={stars} total={items.length} onAgain={() => setItems(null)} />
      </>
    );
  }

  const w = items[i];
  const finished = result === "ok" || result === "accent" || reveal;

  const check = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || finished) return;
    const r = checkDictation(value, w.word);
    setResult(r);
    if (r === "ok" || r === "accent") {
      if (tries === 0 && r === "ok") {
        setStars((s) => s + 1);
        addStar("dictado");
      }
    } else {
      setTries((t) => t + 1);
    }
  };

  const next = () => {
    if (i + 1 >= items.length) return setDone(true);
    setI(i + 1);
    setValue("");
    setResult(null);
    setTries(0);
    setReveal(false);
    speak(items[i + 1].word, rate);
    setTimeout(() => input.current?.focus(), 50);
  };

  return (
    <>
      <ActivityHeader emoji="🎧" title="Escribe lo que oyes" help="Pulsa 🔊, escucha y escribe la palabra." round={i + 1} total={items.length} />
      <div className="lx-card mt-5 p-6 text-center">
        <div className="text-[3.2em]" aria-hidden>
          {w.emoji}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" className="lx-btn" onClick={() => speak(w.word, rate)}>
            🔊 Escuchar
          </button>
          <button type="button" className="lx-btn-ghost" onClick={() => speakSyllables(w.word, w.syllables, rate * 0.9)}>
            🐢 Por sílabas
          </button>
        </div>
      </div>

      <form onSubmit={check} className="mt-5 flex flex-col sm:flex-row gap-3">
        <label htmlFor="dictado" className="sr-only">
          Escribe la palabra
        </label>
        <input
          ref={input}
          id="dictado"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (result === "wrong") setResult(null);
          }}
          disabled={finished}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Escribe aquí…"
          className="lx-card flex-1 min-w-0 px-4 py-3 text-[1.4em] outline-none"
          style={{ fontFamily: "var(--lx-font)", letterSpacing: "var(--lx-letter)" }}
        />
        {!finished && (
          <button type="submit" className="lx-btn" disabled={!value.trim()}>
            Comprobar
          </button>
        )}
      </form>

      {result === "wrong" && !reveal && (
        <div className="mt-4 text-center">
          <p aria-label="Letras comparadas" className="text-[1.5em] font-bold" style={{ fontFamily: "var(--lx-font)" }}>
            {letterDiff(value, w.word).map((d, k) => (
              <span key={k} style={{ color: d.ok ? "var(--lx-ok)" : "var(--lx-no)", textDecoration: d.ok ? "none" : "underline" }}>
                {d.ch}
              </span>
            ))}
          </p>
          <p className="lx-muted mt-1" style={{ fontSize: "0.75em" }}>
            Las letras en verde están bien. Corrige las demás y vuelve a comprobar.
          </p>
          {tries >= 2 && (
            <button className="lx-btn-ghost mt-3" onClick={() => setReveal(true)}>
              👀 Ver la palabra
            </button>
          )}
        </div>
      )}

      <Feedback kind={finished ? (result === "ok" ? "ok" : "no") : null}>
        {result === "ok" && pickOne(PRAISE)}
        {result === "accent" && `¡Casi perfecto! Solo falta la tilde: «${w.word}».`}
        {reveal && result !== "ok" && result !== "accent" && <>Se escribe así: «{w.word}». ¡La próxima seguro! 💪</>}
      </Feedback>
      {finished && (
        <div className="text-center">
          <p className="text-[1.8em] font-bold">
            <SyllableWord syllables={w.syllables} force />
          </p>
          <button onClick={next} className="lx-btn mt-3">
            Siguiente →
          </button>
        </div>
      )}
    </>
  );
}
