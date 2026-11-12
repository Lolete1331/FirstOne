"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRpc } from "@/lib/hooks/use-rpc";
import { useAuth } from "@/components/auth-provider";
import { Medal } from "@/components/medal";
import { countryFlag } from "@/lib/countries";
import { formatClaimDate, formatPreciseTime } from "@/lib/time/year";
import type { DefinitionResult } from "@/lib/words/definitions";

type YearRow = { year: number; total: number; owner: string | null; owner_country: string | null; owner_claimed_at: string };

/** Código de registro corto y estable a partir de palabra + año + hora exacta. */
function registryCode(word: string, year: number, at: string) {
  let h = 2166136261;
  for (const ch of `${word}|${year}|${at}`) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0;
  return `FO-${year}-${h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;
}

export function DiplomaView({ word, year }: { word: string; year: number }) {
  const { profile } = useAuth();
  const history = useRpc<YearRow[]>("word_history", { p_word: word });
  const [definition, setDefinition] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/define?word=${encodeURIComponent(word)}`)
      .then((r) => (r.ok ? (r.json() as Promise<DefinitionResult>) : null))
      .then((d) => {
        const first = d?.groups[0]?.senses[0]?.text;
        if (alive && first) setDefinition(first.length > 150 ? first.slice(0, 147).replace(/\s+\S*$/, "") + "…" : first);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [word]);

  const row = history.data?.find((r) => r.year === year);
  const isOwner = !!(profile && row?.owner && profile.username.toLowerCase() === row.owner.toLowerCase());

  if (history.loading && !history.data) return <p className="p-10 text-center text-[#f3ead8]">Preparando el diploma…</p>;
  if (!row || !row.owner) {
    return (
      <div className="p-10 text-center text-[#f3ead8]">
        <p>La palabra «{word}» no tiene dueño en {year}.</p>
        <Link href="/jugar" className="underline mt-4 inline-block">
          Volver al juego
        </Link>
      </div>
    );
  }

  const others = row.total - 1;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:py-10">
      {/* Controles (no se imprimen) */}
      <div className="diploma-controls mb-6 flex flex-wrap items-center gap-3 text-[#f3ead8]">
        <Link href="/jugar" className="rounded-full border border-[#f3ead8]/30 px-4 py-2 text-sm hover:bg-white/10">
          ← Volver
        </Link>
        {isOwner && (
          <label className="flex flex-1 min-w-[220px] items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <span className="shrink-0">Nombre en el diploma:</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder={`opcional (si no, sale @${row.owner})`}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#f3ead8]/50"
            />
          </label>
        )}
        <button
          onClick={() => window.print()}
          className="rounded-full bg-[#c9a24a] px-5 py-2.5 font-bold text-[#2a2622] hover:bg-[#d9b45c]"
        >
          🖨️ Imprimir o guardar en PDF
        </button>
      </div>

      {/* El diploma (A4 apaisado) */}
      <article id="diploma" className="diploma" aria-label={`Diploma de la palabra ${word}`}>
        <div className="diploma-frame">
          <span className="diploma-corner tl">✦</span>
          <span className="diploma-corner tr">✦</span>
          <span className="diploma-corner bl">✦</span>
          <span className="diploma-corner br">✦</span>

          <header className="diploma-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" />
            <span>FirstOne</span>
          </header>

          <p className="diploma-title">Diploma</p>
          <p className="diploma-sub">a la primera persona del mundo en escribir una palabra</p>

          <p className="diploma-text">Se certifica que</p>
          <p className="diploma-name">{name.trim() || `@${row.owner}`}</p>
          {name.trim() && (
            <p className="diploma-handle">
              {countryFlag(row.owner_country)} @{row.owner}
            </p>
          )}
          <p className="diploma-text">fue la primera persona del mundo en escribir la palabra</p>
          <p className="diploma-word">«{word}»</p>
          {definition && <p className="diploma-def">{definition}</p>}
          <p className="diploma-text diploma-date">
            el {formatClaimDate(row.owner_claimed_at, { timeZone: "UTC", withYear: true }).replace(/ a las .*/, "")}, a las{" "}
            {formatPreciseTime(row.owner_claimed_at, "UTC")} (hora UTC)
            {others > 0 && (
              <>
                , por delante de {others === 1 ? "otra persona" : `otras ${others.toLocaleString("es")} personas`}
              </>
            )}
            .
          </p>

          <footer className="diploma-footer">
            <div className="diploma-medal">
              <Medal size={70} animate={false} />
            </div>
            <div className="diploma-meta">
              <p>Año {year}</p>
              <p>Nº de registro {registryCode(word, year, row.owner_claimed_at)}</p>
              <p>firstone.es</p>
            </div>
            <div className="diploma-sign">
              <p className="diploma-sign-name">FirstOne</p>
              <p className="diploma-sign-line">Una palabra, un solo dueño al año</p>
            </div>
          </footer>
        </div>
      </article>

      <p className="diploma-controls mt-4 text-center text-xs text-[#f3ead8]/60">
        Consejo: al imprimir, elige orientación horizontal y desactiva «encabezados y pies de página».
        {definition && " Definición: Wikcionario (CC BY-SA 4.0)."}
      </p>
    </div>
  );
}
