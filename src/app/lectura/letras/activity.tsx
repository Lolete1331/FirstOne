"use client";
import { useState } from "react";
import { ActivityHeader, Feedback, FinishCard, PRAISE, ROUNDS, pickOne } from "@/components/lectura/activity";
import { shuffle } from "@/lib/lectura/shuffle";
import { addStar } from "@/lib/lectura/progress";
import { speak } from "@/lib/lectura/speech";
import { VOICE_RATES, useLecturaSettings } from "@/lib/lectura/settings";

const LETTERS: Record<string, { name: string; example: string; emoji: string }> = {
  b: { name: "be", example: "barco", emoji: "⛵" },
  d: { name: "de", example: "dado", emoji: "🎲" },
  p: { name: "pe", example: "pato", emoji: "🦆" },
  q: { name: "cu", example: "queso", emoji: "🧀" },
};
const LEVELS = [
  { id: "bd", title: "b y d", letters: ["b", "d"] },
  { id: "pq", title: "p y q", letters: ["p", "q"] },
  { id: "bdpq", title: "b, d, p y q", letters: ["b", "d", "p", "q"] },
];
const GRID = 12;

type Round = { target: string; grid: string[] };

function buildRounds(letters: string[]): Round[] {
  return Array.from({ length: ROUNDS }, (_, r) => {
    const target = letters[r % letters.length];
    const others = letters.filter((l) => l !== target);
    const nTarget = 3 + (r % 2); // 3 o 4 por ronda
    const grid = [...Array(nTarget).fill(target), ...Array.from({ length: GRID - nTarget }, (_, k) => others[k % others.length])];
    return { target, grid: shuffle(grid) };
  });
}

export function LetrasActivity() {
  const { voice } = useLecturaSettings();
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [i, setI] = useState(0);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);

  const say = (t: string) => speak(t, VOICE_RATES[voice]);
  const start = (letters: string[]) => {
    const r = buildRounds(shuffle(letters));
    setRounds(r);
    setI(0);
    setFound(new Set());
    setMistakes(0);
    setStars(0);
    setDone(false);
    const L = LETTERS[r[0].target];
    say(`Busca la letra ${L.name}, de ${L.example}`);
  };

  if (!rounds) {
    return (
      <>
        <ActivityHeader emoji="🔍" title="b · d · p · q" help="Estas letras se parecen mucho. ¡Vamos a entrenar el ojo para distinguirlas!" />
        <div className="mt-6 grid gap-3">
          <p className="font-bold">Elige qué letras practicar:</p>
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => start(l.letters)} className="lx-card p-4 text-left text-[1.2em] font-bold">
              {l.title}
            </button>
          ))}
        </div>
      </>
    );
  }
  if (done) {
    return (
      <>
        <ActivityHeader emoji="🔍" title="b · d · p · q" help="" />
        <FinishCard stars={stars} total={rounds.length} onAgain={() => setRounds(null)} />
      </>
    );
  }

  const { target, grid } = rounds[i];
  const L = LETTERS[target];
  const totalTargets = grid.filter((g) => g === target).length;
  const complete = found.size === totalTargets;

  const tap = (k: number) => {
    if (complete || found.has(k)) return;
    if (grid[k] === target) {
      const f = new Set(found).add(k);
      setFound(f);
      if (f.size === totalTargets && mistakes === 0) {
        setStars((s) => s + 1);
        addStar("letras");
      }
    } else {
      setWrong(k);
      setMistakes((m) => m + 1);
      say(`Esa es la ${LETTERS[grid[k]].name}`);
      setTimeout(() => setWrong(null), 700);
    }
  };

  const next = () => {
    if (i + 1 >= rounds.length) return setDone(true);
    setI(i + 1);
    setFound(new Set());
    setMistakes(0);
    const N = LETTERS[rounds[i + 1].target];
    say(`Busca la letra ${N.name}, de ${N.example}`);
  };

  return (
    <>
      <ActivityHeader emoji="🔍" title="b · d · p · q" help="Toca todas las letras iguales a la de arriba." round={i + 1} total={rounds.length} />
      <div className="lx-card mt-5 p-5 flex items-center justify-center gap-5">
        <span className="text-[3.6em] font-bold leading-none" style={{ fontFamily: "var(--lx-font)" }}>
          {target}
        </span>
        <span>
          <span className="block">
            de <b>{L.example}</b> <span aria-hidden>{L.emoji}</span>
          </span>
          <button className="lx-btn-ghost mt-2 !min-h-[44px]" onClick={() => say(`Busca la letra ${L.name}, de ${L.example}`)}>
            🔊 Escuchar
          </button>
        </span>
      </div>
      <p className="mt-3 text-center font-bold" aria-live="polite">
        Encontradas: {found.size} de {totalTargets}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2.5">
        {grid.map((g, k) => (
          <button
            key={k}
            onClick={() => tap(k)}
            className="lx-choice text-[2.2em] aspect-square"
            style={{ fontFamily: "var(--lx-font)" }}
            data-state={found.has(k) ? "ok" : wrong === k ? "no" : undefined}
            aria-label={`Letra ${LETTERS[g].name}`}
          >
            {g}
          </button>
        ))}
      </div>
      <Feedback kind={complete ? "ok" : null}>{complete ? (mistakes === 0 ? pickOne(PRAISE) : "¡Conseguido! Fíjate bien en hacia dónde mira la barriga de la letra 👀") : null}</Feedback>
      {complete && (
        <div className="text-center">
          <button onClick={next} className="lx-btn">
            Siguiente →
          </button>
        </div>
      )}
    </>
  );
}
