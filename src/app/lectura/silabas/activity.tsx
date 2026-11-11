"use client";
import { useState } from "react";
import { ActivityHeader, ENCOURAGE, Feedback, FinishCard, LevelPicker, PRAISE, ROUNDS, pickOne } from "@/components/lectura/activity";
import { SyllableWord } from "@/components/lectura/syllable-word";
import { SpeakButton } from "@/components/lectura/speak-button";
import { getList, type Word } from "@/lib/lectura/words";
import { shuffle } from "@/lib/lectura/shuffle";
import { addStar } from "@/lib/lectura/progress";
import { speakSyllables } from "@/lib/lectura/speech";
import { VOICE_RATES, useLecturaSettings } from "@/lib/lectura/settings";

export function SilabasActivity() {
  const { voice } = useLecturaSettings();
  const [items, setItems] = useState<Word[] | null>(null);
  const [i, setI] = useState(0);
  const [stars, setStars] = useState(0);
  const [tries, setTries] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "no"; text: string } | null>(null);

  const start = (listId: string) => {
    setItems(shuffle(getList(listId)!.words).slice(0, ROUNDS));
    setI(0);
    setStars(0);
    setTries(0);
    setPicked(null);
    setDone(false);
    setMsg(null);
  };

  if (!items) {
    return (
      <>
        <ActivityHeader emoji="👏" title="Cuenta las sílabas" help="Escucha la palabra y cuenta cuántos trozos (sílabas) tiene. ¡Da una palmada en cada uno!" />
        <LevelPicker onPick={start} />
      </>
    );
  }
  if (done) {
    return (
      <>
        <ActivityHeader emoji="👏" title="Cuenta las sílabas" help="" />
        <FinishCard stars={stars} total={items.length} onAgain={() => setItems(null)} />
      </>
    );
  }

  const w = items[i];
  const n = w.syllables.length;
  const solved = picked === n || tries >= 2;

  const answer = (k: number) => {
    if (solved) return;
    setPicked(k);
    if (k === n) {
      if (tries === 0) {
        setStars((s) => s + 1);
        addStar("silabas");
      }
      setMsg({ kind: "ok", text: `${pickOne(PRAISE)} Tiene ${n} sílabas.` });
      speakSyllables(w.word, w.syllables, VOICE_RATES[voice]);
    } else {
      const t = tries + 1;
      setTries(t);
      setMsg(t >= 2 ? { kind: "no", text: `Tiene ${n} sílabas: ${w.syllables.join(" · ")}. ¡La próxima seguro! 💪` } : { kind: "no", text: pickOne(ENCOURAGE) });
      if (t >= 2) speakSyllables(w.word, w.syllables, VOICE_RATES[voice]);
    }
  };

  const next = () => {
    if (i + 1 >= items.length) return setDone(true);
    setI(i + 1);
    setTries(0);
    setPicked(null);
    setMsg(null);
  };

  return (
    <>
      <ActivityHeader emoji="👏" title="Cuenta las sílabas" help="¿Cuántas sílabas tiene esta palabra?" round={i + 1} total={items.length} />
      <div className="lx-card mt-5 p-6 text-center">
        <div className="text-[3em]" aria-hidden>
          {w.emoji}
        </div>
        <div className="text-[2.2em] font-bold mt-1 break-words">
          {solved ? <SyllableWord syllables={w.syllables} force /> : w.word}
        </div>
        {solved && (
          <p className="mt-1 text-[1.4em]" aria-hidden>
            {"👏".repeat(n)}
          </p>
        )}
        <SpeakButton text={w.word} className="mt-4" />
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((k) => (
          <button
            key={k}
            onClick={() => answer(k)}
            className="lx-choice text-[1.4em]"
            data-state={picked === k ? (k === n ? "ok" : "no") : solved && k === n ? "ok" : undefined}
            aria-label={`${k} ${k === 1 ? "sílaba" : "sílabas"}`}
          >
            {k}
          </button>
        ))}
      </div>
      <Feedback kind={msg?.kind ?? null}>{msg?.text}</Feedback>
      {solved && (
        <div className="text-center">
          <button onClick={next} className="lx-btn">
            Siguiente →
          </button>
        </div>
      )}
    </>
  );
}
