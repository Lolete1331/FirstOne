import Link from "next/link";
import type { ReactNode } from "react";

/** Tarjeta de papel común a los juegos de palabras (estilo «de diccionario»). */
export function PaperCard({ kicker, title, subtitle, children }: { kicker?: string; title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#d9c9a3] bg-[#f7f0e1] text-[#2b2622] shadow-2xl px-4 sm:px-8 py-6">
      <header className="text-center">
        {kicker && <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a7a5c]">{kicker}</p>}
        <h1 className="mt-1 font-[family-name:'Cormorant_Garamond'] font-bold text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <div className="mt-1 font-[family-name:'EB_Garamond'] italic text-[#6b6256]">{subtitle}</div>}
      </header>
      {children}
    </div>
  );
}

export function BackToGames() {
  return (
    <div className="mt-4 text-center">
      <Link href="/juegos" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-lime/60">
        🎲 Más juegos de palabras
      </Link>
    </div>
  );
}

/** Formatea segundos como m:ss. */
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
