"use client";
import { useState } from "react";
import { ActivityHeader, ENCOURAGE, Feedback, FinishCard, LevelPicker, PRAISE, ROUNDS, pickOne } from "@/components/lectura/activity";
import { SpeakButton } from "@/components/lectura/speak-button";
import { getList, type Word } from "@/lib/lectura/words";
import { shuffle } from "@/lib/lectura/shuffle";
import { addStar } from "@/lib/lectura/progress";
import { speak } from "@/lib/lectura/speech";
import { VOICE_RATES, useLecturaSettings } from "@/lib/lectura/settings";

type Round = { word: Word; options: string[] };

/** Crea las rondas: la primera sílaba correcta + 2 primeras sílabas de otras palabras. */
function buildRounds(words: Word[]): Round[] {
  return shuffle(words)
    .slice(0, ROUNDS)
    .map((word) => {
      const first = word.syllables[0];
      const others = shuffle(Array.from(new Set(words.map((x) => x.syllables[0]).filter((s) => s !== first)))).slice(0, 2);
      return { word, options: shuffle([first, ...others]) };
    });
}

export function SonidosActivity() {
  const { voice } = useLecturaSettings();
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [i, setI] = useState(0);
  const [stars, setStars] = useState(0);
  const [tries, setTries] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "no"; text: string } | null>(null);

  const start = (id: string) => {
    setRounds(buildRounds(getList(id)!.words));
    setI(0);
    setStars(0);
    setTries(0);
    setPicked(null);
    setDone(false);
    setMsg(null);
  };

  if (!rounds) {
    return (
      <>
        <ActivityHeader emoji="👂" title="¿Cómo empieza?" help="Escucha la palabra y elige con qué sílaba empieza." />
        <LevelPicker onPick={start} />
      </>
    );
  }
  if (done) {
    return (
      <>
        <ActivityHeader emoji="👂" title="¿Cómo empieza?" help="" />
        <FinishCard stars={stars} total={rounds.length} onAgain={() => setRounds(null)} />
      </>
    );
  }

  const { word: w, options } = rounds[i];
  const first = w.syllables[0];
  const solved = picked === first || tries >= 2;

  const answer = (o: string) => {
    if (solved) return;
    setPicked(o);
    if (o === first) {
      if (tries === 0) {
        setStars((s) => s + 1);
        addStar("sonidos");
      }
      setMsg({ kind: "ok", text: `${pickOne(PRAISE)} «${w.word}» empieza por «${first}».` });
      speak(`${first}… ${w.word}`, VOICE_RATES[voice]);
    } else {
      const t = tries + 1;
      setTries(t);
      setMsg(t >= 2 ? { kind: "no", text: `Empieza por «${first}»: ${first}…${w.syllables.slice(1).join("")}.` } : { kind: "no", text: pickOne(ENCOURAGE) });
    }
  };

  const next = () => {
    if (i + 1 >= rounds.length) return setDone(true);
    setI(i + 1);
    setTries(0);
    setPicked(null);
    setMsg(null);
  };

  return (
    <>
      <ActivityHeader emoji="👂" title="¿Cómo empieza?" help="Pulsa 🔊, escucha bien el principio de la palabra y elige." round={i + 1} total={rounds.length} />
      <div className="lx-card mt-5 p-6 text-center">
        <div className="text-[3.4em]" aria-hidden>
          {w.emoji}
        </div>
        <div className="text-[2em] font-bold mt-1 min-h-[1.4em] break-words">
          {solved ? (
            <>
              <span className="lx-s1">{first}</span>
              <span>{w.syllables.slice(1).join("")}</span>
            </>
          ) : (
            <span className="lx-muted">¿ ? ?</span>
          )}
        </div>
        <SpeakButton text={w.word} className="mt-4" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="lx-choice text-[1.6em]"
            data-state={picked === o ? (o === first ? "ok" : "no") : solved && o === first ? "ok" : undefined}
          >
            {o}
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
