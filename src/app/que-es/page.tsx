import type { Metadata } from "next";
import Link from "next/link";

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
    a: "FirstOne lo han creado Diego y Álex, dos estudiantes de 18 años de Navarra (España). Puedes seguir el proyecto en TikTok como @firstone.es.",
  },
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
      <Link href="/" className="mt-6 inline-block rounded-full bg-lime text-bg font-display font-black px-7 py-3 glow-lime">
        Reclamar mi primera palabra
      </Link>

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
