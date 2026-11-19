"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRpc } from "@/lib/hooks/use-rpc";
import { getSupabase } from "@/lib/supabase/client";

type Alert = { total: number; people: number; words: { word: string; n: number; last_user: string }[]; more_words: number };

/** «Desde tu última visita, 5 personas han intentado quitarte tus palabras». */
export function WordChallengersBanner() {
  const { profile } = useAuth();
  const alert = useRpc<Alert | null>("my_word_challengers", profile ? {} : null);
  const [closed, setClosed] = useState(false);
  const a = alert.data;
  if (!profile || !a || Number(a.total) === 0 || closed) return null;

  function close() {
    setClosed(true);
    getSupabase().rpc("mark_word_challengers_seen").then(() => undefined);
  }
  const people = Number(a.people);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-3">
      <div role="status" className="card relative p-4 border-gold/60">
        <button onClick={close} aria-label="Cerrar aviso" className="absolute top-2 right-3 text-muted hover:text-text text-xl">
          ×
        </button>
        <p className="pr-6 font-display font-bold text-lg leading-snug">
          🥇 Desde tu última visita, {people === 1 ? "1 persona ha" : `${people} personas han`} intentado quitarte{" "}
          {a.words.length === 1 && !Number(a.more_words) ? "tu palabra" : "tus palabras"}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {a.words.map((w) => (
            <li key={w.word}>
              <Link
                href={`/palabra/${encodeURIComponent(w.word)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 hover:bg-gold/20"
                title={`La última vez, @${w.last_user}`}
              >
                <b>{w.word}</b>
                <span className="text-muted">
                  {Number(w.n) === 1 ? `@${w.last_user}` : `${w.n} veces`}
                </span>
              </Link>
            </li>
          ))}
          {Number(a.more_words) > 0 && <li className="self-center text-muted">y {a.more_words} más</li>}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={close} className="rounded-full bg-gold text-bg font-bold px-4 py-2 text-sm">
            ¡Siguen siendo mías! 💪
          </button>
          <span className="text-xs text-muted">Llegaron tarde: este año nadie te las puede quitar.</span>
        </div>
      </div>
    </div>
  );
}
