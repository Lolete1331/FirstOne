import Link from "next/link";
import { ClaimBox } from "@/components/claim-box";
import { CountdownBig } from "@/components/countdown";
import { HomeFeed } from "@/components/home-feed";
import { SetupNotice } from "@/components/setup-notice";

export default function Home() {
  return (
    <div className="pt-5 sm:pt-14">
      <SetupNotice />
      <section className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
          <span className="size-1.5 rounded-full bg-lime animate-pulse" /> Carrera mundial en curso
        </p>
        <h1 className="mt-4 font-display font-black text-[1.6rem] sm:text-5xl leading-[1.08] tracking-tight">
          Cada palabra tiene <span className="text-gradient">un solo dueño</span>.
          <br className="hidden sm:block" /> Sé el primero en escribirla.
        </h1>
        <p className="hidden sm:block mt-4 text-muted max-w-xl mx-auto">
          95.000 palabras del español. Si eres la primera persona del mundo en escribir una este año, es tuya y te
          llevas la medalla 🥇. El 1 de enero todo vuelve a empezar.
        </p>
      </section>

      <section className="mt-6 sm:mt-14">
        <ClaimBox />
      </section>

      <p className="sm:hidden mt-6 text-center text-sm text-muted">
        Si eres la primera persona del mundo en escribirla este año, es tuya 🥇. El 1 de enero todo vuelve a empezar.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <CountdownBig />
        <HomeFeed />
      </section>

      <footer className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
        <Link href="/que-es" className="hover:text-lime">¿Qué es FirstOne?</Link>
        <a href="https://www.tiktok.com/@firstone.es" target="_blank" rel="noopener noreferrer" className="hover:text-lime">TikTok @firstone.es</a>
        <span>Hecho en Navarra por Diego y Álex</span>
      </footer>
    </div>
  );
}
