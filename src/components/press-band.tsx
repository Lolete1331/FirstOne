import Link from "next/link";
import { MADRINA, PRESS } from "@/lib/press";

/** Franja destacada: la columna de El País y la madrina. `compact` para páginas interiores. */
export function PressBand({ compact = false }: { compact?: boolean }) {
  const a = PRESS[0];
  if (compact)
    return (
      <a
        href={a.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border border-[#d9c9a3] bg-[#f7f0e1] text-[#2b2622] px-4 py-3 text-center hover:-translate-y-0.5 transition-transform"
      >
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#8a7a5c]">Como se contó en {a.outlet}</span>
        <span className="block font-[family-name:'Cormorant_Garamond'] font-bold text-lg leading-tight">
          «{a.title}», por {MADRINA.short}, madrina de FirstOne →
        </span>
      </a>
    );
  return (
    <section className="rounded-3xl border-2 border-[#b08a2e]/70 bg-[#f7f0e1] text-[#2b2622] px-5 py-6 sm:px-10 sm:py-8 text-center shadow-2xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a7a5c]">Así nos contó {a.outlet}</p>
      <blockquote className="mt-3 font-[family-name:'EB_Garamond'] italic text-xl sm:text-2xl leading-snug">«{a.quote}»</blockquote>
      <p className="mt-3 font-[family-name:'Cormorant_Garamond'] font-bold text-lg">
        {MADRINA.name} · <span className="font-normal italic">«{a.title}»</span>, {a.outlet}, {a.date}
      </p>
      <p className="mt-1 text-sm text-[#6b6256]">
        {MADRINA.role}. <b className="text-[#8a6d22]">Madrina de FirstOne.</b>
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-5 py-2.5 text-sm">
          Leer la columna en {a.outlet}
        </a>
        <Link href="/que-es#madrina" className="rounded-full border border-[#2b2622]/30 px-5 py-2.5 text-sm font-bold">
          Nuestra madrina
        </Link>
      </div>
    </section>
  );
}
