"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { useRpc } from "@/lib/hooks/use-rpc";
import { BigNumber, PageTitle, Skeleton, YearSelect } from "@/components/ui";
import { UserLink } from "@/components/user-link";

import { currentGameYear, formatClaimDate, formatSinceReset } from "@/lib/time/year";

type Stats = {
  year: number;
  words_conquered: number;
  total_claims: number;
  players: number;
  dictionary_total: number;
  percent: number;
  fastest: { word: string; username: string | null; country: string | null; claimed_at: string; seconds: number } | null;
  most_wanted: { word: string; claim_count: number } | null;
};

function Ring({ percent }: { percent: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  // Escala visual: mínimo un trazo visible aunque el % sea pequeñísimo.
  const shown = percent === 0 ? 0 : Math.max(percent, 0.6);
  return (
    <svg viewBox="0 0 180 180" className="w-44 h-44 sm:w-56 sm:h-56 -rotate-90">
      <defs>
        <linearGradient id="ring" x1="0" x2="1">
          <stop offset="0" stopColor="var(--lime)" />
          <stop offset="0.5" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--pink)" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
      <motion.circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke="url(#ring)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - shown / 100) }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
    </svg>
  );
}

export function StatsView() {
  const [year, setYear] = useState(currentGameYear());
  const { data: s, loading } = useRpc<Stats>("year_stats", { p_year: year }, { refreshMs: 30_000 });

  return (
    <div>
      <PageTitle kicker={`Temporada ${year}`} title="Estadísticas">
        <div className="mt-3">
          <YearSelect value={year} onChange={setYear} />
        </div>
      </PageTitle>

      {loading && !s ? (
        <div className="mt-6"><Skeleton rows={4} /></div>
      ) : s ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="card p-6 flex flex-col items-center justify-center md:row-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Diccionario conquistado</p>
            <div className="relative mt-4 grid place-items-center">
              <Ring percent={Number(s.percent)} />
              <div className="absolute text-center">
                <p className="font-display font-black text-3xl sm:text-4xl">
                  <BigNumber value={Number(s.percent)} decimals={Number(s.percent) < 1 ? 3 : 1} suffix="%" />
                </p>
              </div>
            </div>
            <p className="mt-4 text-muted text-center">
              <b className="text-text">{Number(s.words_conquered).toLocaleString("es")}</b> de{" "}
              {Number(s.dictionary_total).toLocaleString("es")} palabras ya tienen dueño
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="font-display font-black text-3xl sm:text-4xl text-lime">
                <BigNumber value={Number(s.words_conquered)} />
              </p>
              <p className="text-sm text-muted">palabras reclamadas</p>
            </div>
            <div className="card p-5">
              <p className="font-display font-black text-3xl sm:text-4xl text-cyan">
                <BigNumber value={Number(s.players)} />
              </p>
              <p className="text-sm text-muted">jugadores</p>
            </div>
            <div className="card p-5 col-span-2">
              <p className="font-display font-black text-3xl sm:text-4xl">
                <BigNumber value={Number(s.total_claims)} />
              </p>
              <p className="text-sm text-muted">intentos registrados (incluye a todos los que llegaron después del primero)</p>
            </div>
          </div>

          <div className="card p-5 border-gold/30">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">⚡ La más rápida tras el reinicio</p>
            {s.fastest ? (
              <>
                <Link href={`/history?word=${encodeURIComponent(s.fastest.word)}`} className="mt-2 block font-display font-black text-4xl hover:text-lime">
                  {s.fastest.word}
                </Link>
                <p className="mt-1 text-muted">
                  por{" "}
                  <UserLink username={s.fastest.username} country={s.fastest.country} className="text-text font-bold" />{" "}
                  a los <b className="text-text font-mono">{formatSinceReset(s.fastest.seconds)}</b> del 1 de enero
                </p>
                <p className="text-xs text-muted mt-1">{formatClaimDate(s.fastest.claimed_at, { withYear: true })} (tu hora)</p>
              </>
            ) : (
              <p className="mt-2 text-muted">Aún nadie ha reclamado una palabra este año.</p>
            )}
          </div>

          {s.most_wanted && s.most_wanted.claim_count > 1 && (
            <div className="card p-5 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-pink">🔥 La más disputada</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-3">
                <Link href={`/history?word=${encodeURIComponent(s.most_wanted.word)}`} className="font-display font-black text-3xl hover:text-lime">
                  {s.most_wanted.word}
                </Link>
                <span className="text-muted">
                  la han escrito <b className="text-text">{s.most_wanted.claim_count.toLocaleString("es")}</b> personas
                </span>
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
