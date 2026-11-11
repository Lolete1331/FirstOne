"use client";
import { useState } from "react";
import { ActivityHeader, Feedback, FinishCard, PRAISE, ROUNDS, pickOne } from "@/components/lectura/activity";
import { SpeakButton } from "@/components/lectura/speak-button";
import { SPELLING_PAIRS } from "@/lib/lectura/words";
import { shuffle } from "@/lib/lectura/shuffle";
import { addStar } from "@/lib/lectura/progress";

type Round = (typeof SPELLING_PAIRS)[number] & { options: string[] };

export function OrtografiaActivity() {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);

  const start = () => {
    setRounds(shuffle(SPELLING_PAIRS).slice(0, ROUNDS).map((p) => ({ ...p, options: shuffle([p.right, p.wrong]) })));
    setI(0);
    setPicked(null);
    setStars(0);
    setDone(false);
  };

  if (!rounds) {
    return (
      <>
        <ActivityHeader emoji="✍️" title="¿Cómo se escribe?" help="Verás una palabra escrita de dos formas. Elige la correcta. ¡Fíjate bien en cada letra!" />
        <div className="lx-card mt-6 p-5">
          <p>Practicaremos letras que suenan igual o no suenan: <b>h</b>, <b>b/v</b>, <b>g/j</b>, <b>ll/y</b>, <b>c/z/s</b>…</p>
          <button onClick={start} className="lx-btn mt-4">
            Empezar
          </button>
        </div>
      </>
    );
  }
  if (done) {
    return (
      <>
        <ActivityHeader emoji="✍️" title="¿Cómo se escribe?" help="" />
        <FinishCard stars={stars} total={rounds.length} onAgain={() => setRounds(null)} />
      </>
    );
  }

  const r = rounds[i];
  const answered = picked !== null;
  const ok = picked === r.right;

  const answer = (o: string) => {
    if (answered) return;
    setPicked(o);
    if (o === r.right) {
      setStars((s) => s + 1);
      addStar("ortografia");
    }
  };
  const next = () => {
    if (i + 1 >= rounds.length) return setDone(true);
    setI(i + 1);
    setPicked(null);
  };

  return (
    <>
      <ActivityHeader emoji="✍️" title="¿Cómo se escribe?" help="Elige la palabra bien escrita." round={i + 1} total={rounds.length} />
      <div className="lx-card mt-5 p-6 text-center">
        <div className="text-[3.6em]" aria-hidden>
          {r.emoji}
        </div>
        <SpeakButton text={r.right} className="mt-3" />
      </div>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {r.options.map((o) => (
          <button
            key={o}
            onClick={() => answer(o)}
            className="lx-choice text-[1.7em] py-3 break-words"
            data-state={answered ? (o === r.right ? "ok" : o === picked ? "no" : undefined) : undefined}
          >
            {o}
          </button>
        ))}
      </div>
      <Feedback kind={answered ? (ok ? "ok" : "no") : null}>
        {answered && (ok ? `${pickOne(PRAISE)} ${r.tip}` : `Se escribe «${r.right}». ${r.tip}`)}
      </Feedback>
      {answered && (
        <div className="text-center">
          <button onClick={next} className="lx-btn">
            Siguiente →
          </button>
        </div>
      )}
    </>
  );
}
