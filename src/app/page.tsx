import { ClaimBox } from "@/components/claim-box";
import { CountdownBig } from "@/components/countdown";
import { HomeFeed } from "@/components/home-feed";
import { SetupNotice } from "@/components/setup-notice";

export default function Home() {
  return (
    <div className="pt-8 sm:pt-14">
      <SetupNotice />
      <section className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
          <span className="size-1.5 rounded-full bg-lime animate-pulse" /> Carrera mundial en curso
        </p>
        <h1 className="mt-5 font-display font-black text-3xl sm:text-5xl leading-[1.05] tracking-tight">
          Cada palabra tiene <span className="text-gradient">un solo dueño</span>.
          <br className="hidden sm:block" /> Sé el primero en escribirla.
        </h1>
        <p className="mt-4 text-muted max-w-xl mx-auto">
          95.000 palabras del español. Si eres la primera persona del mundo en escribir una este año, es tuya y te
          llevas la medalla 🥇. El 1 de enero todo vuelve a empezar.
        </p>
      </section>

      <section className="mt-10 sm:mt-14">
        <ClaimBox />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <CountdownBig />
        <HomeFeed />
      </section>
    </div>
  );
}
