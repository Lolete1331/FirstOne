import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { getWordInfo } from "@/lib/words/word-page";
import { currentGameYear, formatClaimDate } from "@/lib/time/year";
import { raeUrl, wiktionaryUrl } from "@/lib/words/definitions";
import { countryFlag } from "@/lib/countries";
import { Logo } from "@/components/header";
import { ShareWordButton } from "@/components/share-word-button";
import { WORD_NOTES } from "@/lib/press";

type Props = { params: Promise<{ palabra: string }> };
const fmt = (n: number) => n.toLocaleString("es");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { palabra } = await params;
  const info = await getWordInfo(decodeURIComponent(palabra));
  if (!info.exists) return { title: "Palabra no encontrada", robots: { index: false } };
  const year = currentGameYear();
  const now = info.history.find((h) => h.year === year);
  const title = now?.owner ? `«${info.word}» es de @${now.owner}` : `«${info.word}»: ¿de quién es en ${year}?`;
  const description = now
    ? `«${info.word}» es de @${now.owner ?? "una cuenta eliminada"} en ${year}. ${fmt(now.total)} ${now.total === 1 ? "persona la ha" : "personas la han"} escrito. En FirstOne cada palabra del español solo puede tener un dueño al año.`
    : `«${info.word}» todavía no tiene dueño en ${year}. En FirstOne cada palabra del español solo puede tener un dueño al año: la primera persona que la escribe.`;
  return {
    title,
    description,
    alternates: { canonical: `/palabra/${encodeURIComponent(info.word)}` },
    openGraph: { title, description, url: `/palabra/${encodeURIComponent(info.word)}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function WordPage({ params }: Props) {
  return (
    <div className="min-h-dvh bg-[#2a2622] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center [&_a]:text-[#f7f0e1]">
          <Logo />
        </div>
        <Suspense fallback={<p className="mt-16 text-center text-[#f3ead8]">Buscando la palabra…</p>}>
          <WordContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function WordContent({ params }: Props) {
  const { palabra } = await params;
  const info = await getWordInfo(decodeURIComponent(palabra));
  if (!info.exists) notFound();
  const year = currentGameYear();
  const now = info.history.find((h) => h.year === year);
  const past = info.history.filter((h) => h.year !== year);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: info.word,
    inDefinedTermSet: "https://firstone.es",
    ...(info.senses[0] ? { description: info.senses[0] } : {}),
  };

  return (
    <article className="mt-6 rounded-3xl border border-[#d9c9a3] bg-[#f7f0e1] text-[#2b2622] shadow-2xl px-5 sm:px-10 py-8 text-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a7a5c]">FirstOne · {year}</p>
      <h1 className="mt-2 font-[family-name:'Cormorant_Garamond'] font-bold text-6xl sm:text-7xl break-words">«{info.word}»</h1>
      {WORD_NOTES[info.word] && (
        <div className="mt-4 rounded-2xl border border-[#b08a2e]/60 bg-white/70 px-4 py-3 font-[family-name:'EB_Garamond'] text-[17px]">
          ✨ {WORD_NOTES[info.word].text}{" "}
          <a href={WORD_NOTES[info.word].url} target="_blank" rel="noopener noreferrer" className="underline text-[#8a6d22]">
            {WORD_NOTES[info.word].linkText}
          </a>
        </div>
      )}

      {now ? (
        <>
          <p className="mt-4 font-[family-name:'EB_Garamond'] text-2xl">
            es de{" "}
            {now.owner ? (
              <Link href={`/u/${now.owner}`} className="font-bold underline decoration-[#b08a2e] underline-offset-4">
                {countryFlag(now.owner_country)} @{now.owner}
              </Link>
            ) : (
              <b>una cuenta eliminada</b>
            )}{" "}
            🥇
          </p>
          <p className="mt-1 text-sm text-[#6b6256]">
            desde el {formatClaimDate(now.owner_claimed_at, { withYear: true })} ·{" "}
            {now.total === 1 ? "nadie más la ha escrito" : `${fmt(now.total - 1)} ${now.total === 2 ? "persona llegó" : "personas llegaron"} después`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ShareWordButton word={info.word} owner={now.owner} />
            <Link href={`/history?word=${encodeURIComponent(info.word)}`} className="rounded-full border border-[#2b2622]/30 px-5 py-2.5 text-sm font-bold">
              Ver quién llegó después
            </Link>
          </div>
          <div className="mt-8 rounded-2xl border border-[#d9c9a3] bg-white/60 px-5 py-4">
            <p className="font-[family-name:'EB_Garamond'] text-lg">Esta ya tiene dueño… pero hay más de 95.000 palabras.</p>
            <Link href="/jugar" className="mt-3 inline-block rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-3">
              Conquistar mi palabra →
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 font-[family-name:'EB_Garamond'] text-2xl">todavía no tiene dueño en {year}.</p>
          <p className="mt-1 text-[#6b6256]">La primera persona del mundo que la escriba se la queda hasta el 31 de diciembre.</p>
          <Link href="/jugar" className="mt-5 inline-block rounded-full bg-[#b08a2e] text-white font-bold px-7 py-3 text-lg">
            ¡Quiero que sea mía! →
          </Link>
          <div className="mt-4">
            <ShareWordButton word={info.word} owner={null} />
          </div>
        </>
      )}

      {info.senses.length > 0 && (
        <section className="mt-8 text-left">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-[#8a7a5c]">Qué significa</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1 font-[family-name:'EB_Garamond'] text-[18px] leading-snug">
            {info.senses.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-[#8a7a5c]">
            <a href={wiktionaryUrl(info.lemma ?? info.word)} target="_blank" rel="noopener noreferrer" className="underline">
              Wikcionario
            </a>{" "}
            (CC BY-SA 4.0) ·{" "}
            <a href={raeUrl(info.word)} target="_blank" rel="noopener noreferrer" className="underline">
              Consultar en el diccionario de la RAE
            </a>
          </p>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-8 text-left">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-[#8a7a5c]">Años anteriores</h2>
          <ul className="mt-2 space-y-1 font-[family-name:'EB_Garamond'] text-[18px]">
            {past.map((h) => (
              <li key={h.year}>
                <b>{h.year}</b>: de {h.owner ? `@${h.owner}` : "una cuenta eliminada"} · {fmt(h.total)} {h.total === 1 ? "persona" : "personas"}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-sm text-[#6b6256]">
        En <Link href="/que-es" className="underline">FirstOne</Link> cada palabra del español solo puede tener un dueño al año: la primera persona del mundo que la
        escribe. El 1 de enero todo vuelve a empezar.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/juegos" className="underline">Juegos de palabras del día</Link> · <Link href="/jugar" className="underline">Jugar</Link>
      </p>
    </article>
  );
}
