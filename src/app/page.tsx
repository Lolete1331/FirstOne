import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "FirstOne — juega con las palabras del español" },
  alternates: { canonical: "/" },
};

/** Portada: elegir entre el juego y la sección de lectura (dislexia). */
export default function Portada() {
  return (
    <>
      <div className="fo-backdrop" aria-hidden />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10 sm:py-16 flex flex-col">
        <div className="flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={52} height={52} className="size-[52px]" />
          <span className="font-display font-black text-3xl tracking-tight">
            First<span className="text-gradient">One</span>
          </span>
        </div>
        <h1 className="mt-8 text-center font-display font-black text-3xl sm:text-5xl leading-tight tracking-tight">
          ¿Qué te apetece hoy?
        </h1>
        <p className="mt-3 text-center text-muted">Elige una opción para empezar.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            href="/jugar"
            className="group card p-7 sm:p-8 flex flex-col hover:border-lime/60 hover:-translate-y-1 transition-all"
          >
            <span className="text-5xl">🥇</span>
            <h2 className="mt-4 font-display font-black text-2xl sm:text-3xl">Adueñarte de palabras</h2>
            <p className="mt-2 text-muted flex-1">
              Sé la primera persona del mundo en escribir cada palabra del español. Un solo dueño por palabra al año.
            </p>
            <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-lime text-bg font-display font-black px-6 py-3 glow-lime group-hover:gap-3 transition-all">
              Jugar →
            </span>
          </Link>

          <Link
            href="/lectura"
            className="group rounded-3xl p-7 sm:p-8 flex flex-col border-2 border-[#d9c9a3] bg-[#fbf5e6] text-[#2b2b2b] hover:-translate-y-1 transition-all"
          >
            <span className="text-5xl">📚</span>
            <h2 className="mt-4 font-sans font-bold text-2xl sm:text-3xl">Leer y escribir mejor</h2>
            <p className="mt-2 text-[#4a4a4a] flex-1 leading-relaxed">
              Actividades para niños y niñas con dislexia: sílabas, sonidos, letras y dictados. Con colores y letra que se
              adaptan a cada uno.
            </p>
            <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#2f6f6a] text-white font-bold px-6 py-3 group-hover:gap-3 transition-all">
              Empezar →
            </span>
          </Link>
        </div>

        <footer className="mt-auto pt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/que-es" className="hover:text-lime">¿Qué es FirstOne?</Link>
          <a href="https://www.tiktok.com/@firstone.es" target="_blank" rel="noopener noreferrer" className="hover:text-lime">
            TikTok @firstone.es
          </a>
        </footer>
      </main>
    </>
  );
}
