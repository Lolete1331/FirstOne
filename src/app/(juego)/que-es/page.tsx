import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { MADRINA, PRESS } from "@/lib/press";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";

export const metadata: Metadata = {
  title: "Qué es FirstOne y cómo se juega",
  description:
    "FirstOne es un juego online gratuito en el que cada palabra del español solo puede tener un dueño al año: la primera persona del mundo que la escribe. Reglas, preguntas frecuentes y cómo jugar.",
  alternates: { canonical: "/que-es" },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Qué es FirstOne?",
    a: "FirstOne es un juego online gratuito y una competición mundial: cada palabra del español solo puede tener un dueño al año, la primera persona del mundo que la escribe en firstone.es. Quien llega primero gana una medalla de oro y la palabra es suya durante todo el año.",
  },
  {
    q: "¿Cómo se juega?",
    a: "Entras en firstone.es, inicias sesión con Google o con tu email, eliges un nombre de usuario y escribes una palabra. Si nadie la ha escrito antes ese año, es tuya. Si ya tiene dueño, quedas registrado en el historial con tu posición de llegada (por ejemplo, la persona número 4.729).",
  },
  {
    q: "¿Qué palabras valen?",
    a: "Valen los lemas del diccionario de la lengua española en singular, tanto en masculino como en femenino (por ejemplo «abogado» y «abogada», pero no «abogados»). Se respetan las tildes y la eñe: «año» y «ano» son palabras distintas. La lista contiene más de 95.000 palabras.",
  },
  {
    q: "¿Cuándo se reinicia el juego?",
    a: "Cada 1 de enero a las 00:00 (hora UTC) empieza una carrera nueva y todas las palabras vuelven a estar libres. Los resultados de cada año se guardan en un historial público, así que siempre se puede consultar quién fue el primero en escribir cada palabra cada año.",
  },
  {
    q: "¿Es gratis?",
    a: "Sí. FirstOne es completamente gratuito y se juega desde el navegador del móvil o del ordenador, sin descargar nada. También se puede añadir a la pantalla de inicio del móvil como una app.",
  },
  {
    q: "¿Qué pasa si dos personas escriben la misma palabra a la vez?",
    a: "Gana quien llega antes al servidor. Cada reclamación se guarda con la hora exacta, con precisión de milisegundos, y la base de datos garantiza que solo puede haber un dueño por palabra y año.",
  },
  {
    q: "¿Se puede hacer trampa?",
    a: "FirstOne limita el número de palabras por minuto de cada usuario y de cada conexión, y tiene protección contra bots. Pagar no da ninguna ventaja: todos compiten en igualdad de condiciones.",
  },
  {
    q: "¿FirstOne tiene relación con la Real Academia Española?",
    a: "No. FirstOne es un proyecto independiente creado por dos estudiantes de Navarra. Usa una lista abierta de palabras del español, pero no está afiliado ni avalado por la RAE.",
  },
  {
    q: "¿Quién ha creado FirstOne?",
    a: "FirstOne lo han creado Diego y Álex, dos estudiantes de 18 años de Navarra (España). Su madrina es Lola Pons, catedrática de Lengua Española de la Universidad de Sevilla, que escribió sobre el juego en El País. Puedes seguir el proyecto en TikTok como @firstone.es.",
  },
  ...(LEGAL.contactEmail
    ? [
        {
          q: "¿Puedo enviar sugerencias o avisar de un error?",
          a: `¡Claro! Escríbenos a ${LEGAL.contactEmail}. Leemos todos los mensajes: ideas, palabras que faltan, errores o cualquier duda.`,
        },
      ]
    : []),
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["WebApplication", "VideoGame"],
      name: "FirstOne",
      url: "https://firstone.es",
      description:
        "Juego online gratuito en el que cada palabra del español solo puede tener un dueño al año: la primera persona del mundo que la escribe.",
      applicationCategory: "GameApplication",
      genre: ["Juego de palabras", "Competición"],
      operatingSystem: "Web",
      inLanguage: "es",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      image: "https://firstone.es/opengraph-image.png",
      sameAs: ["https://www.tiktok.com/@firstone.es"],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
};

export default function QueEsPage() {
  return (
    <article className="max-w-2xl mx-auto pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Cómo funciona</p>
      <h1 className="mt-2 font-display font-black text-4xl sm:text-5xl tracking-tight">
        Qué es <span className="text-gradient">FirstOne</span>
      </h1>
      <p className="mt-4 text-lg text-muted">
        <b className="text-text">FirstOne</b> es la carrera mundial por las palabras del español: cada palabra solo puede tener{" "}
        <b className="text-text">un dueño al año</b>, la primera persona del mundo que la escribe. El{" "}
        <b className="text-text">1 de enero a las 00:00</b> todo se reinicia y empieza una carrera nueva.
      </p>
      <Link href="/jugar" className="mt-6 inline-block rounded-full bg-lime text-bg font-display font-black px-7 py-3 glow-lime">
        Reclamar mi primera palabra
      </Link>

      <section id="madrina" className="mt-12 scroll-mt-24 rounded-3xl border-2 border-[#b08a2e]/70 bg-[#f7f0e1] text-[#2b2622] px-5 py-6 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a7a5c]">Nuestra madrina</p>
        <h2 className="mt-1 font-[family-name:'Cormorant_Garamond'] font-bold text-3xl sm:text-4xl">{MADRINA.name}</h2>
        <p className="mt-1 font-[family-name:'EB_Garamond'] italic text-lg text-[#6b6256]">{MADRINA.role}</p>
        <p className="mt-3 font-[family-name:'EB_Garamond'] text-[18px] leading-relaxed">
          Lola Pons conoció FirstOne en sus primeros días, escribió sobre él en su columna de El País y aceptó ser su madrina. Sus libros
          de divulgación cuentan la historia del español de una forma que engancha:
        </p>
        <ul className="mt-3 space-y-1.5 font-[family-name:'EB_Garamond'] text-[18px]">
          {MADRINA.books.map((b) => (
            <li key={b.isbn}>
              📖 <i>{b.title}</i> <span className="text-[#6b6256]">({b.publisher})</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[#6b6256]">¿Te gustan? Pide que los compren en tu biblioteca: es una forma preciosa de apoyar a quien divulga.</p>
      </section>

      <section id="prensa" className="mt-8 scroll-mt-24">
        <h2 className="font-display font-bold text-2xl">Han hablado de nosotros</h2>
        <ul className="mt-4 space-y-3">
          {PRESS.map((a) => (
            <li key={a.url}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="card block p-5 hover:border-lime/60">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {a.outlet} · {a.date}
                </p>
                <p className="mt-1 font-display font-bold text-lg">«{a.title}», por {a.author}</p>
                <p className="mt-2 text-muted italic">«{a.quote}»</p>
                <p className="mt-2 text-sm text-lime">Leer el artículo →</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="mt-12 font-display font-bold text-2xl">Preguntas frecuentes</h2>
      <div className="mt-4 space-y-3">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="card p-5 group" open={q === FAQ[0].q}>
            <summary className="cursor-pointer list-none font-display font-bold text-lg flex justify-between gap-4">
              {q}
              <span className="text-lime group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-muted leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </article>
  );
}
