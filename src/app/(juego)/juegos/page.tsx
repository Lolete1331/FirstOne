import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";

export const metadata: Metadata = {
  title: "Juegos de palabras del día",
  description: "Juegos diarios con las palabras del español: la palabra oculta, ¿qué significa? y la sopa de letras. Gratis y sin descargar nada.",
  alternates: { canonical: "/juegos" },
};

const GAMES = [
  {
    href: "/palabra-oculta",
    icon: "🔎",
    title: "La palabra oculta",
    text: "Una palabra escondida y seis intentos para encontrarla. ¿Serás de los primeros del día?",
  },
  {
    href: "/juegos/que-significa",
    icon: "📖",
    title: "¿Qué significa?",
    text: "Cinco palabras curiosas del español y tres definiciones. ¿Sabes cuál es la buena?",
  },
  {
    href: "/juegos/sopa-de-letras",
    icon: "🔤",
    title: "Sopa de letras",
    text: "Una sopa nueva cada día con un tema distinto. Encuentra todas las palabras y descubre qué significan.",
  },
];

export default function JuegosPage() {
  return (
    <div className="pt-8 max-w-3xl mx-auto">
      <p className="text-center text-[11px] uppercase tracking-[0.3em] text-muted">Cada día, nuevos</p>
      <h1 className="mt-1 text-center font-[family-name:'Cormorant_Garamond'] font-bold text-5xl sm:text-6xl">Juegos de palabras</h1>
      <p className="mt-2 text-center font-[family-name:'EB_Garamond'] italic text-lg text-muted">
        Para jugar con el español un ratito al día. Cambian todos a la vez, a medianoche (hora universal).
      </p>
      <ul className="mt-8 grid gap-4">
        {GAMES.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className="group flex items-center gap-4 sm:gap-6 rounded-3xl border-2 border-[#d9c9a3] bg-[#f7f0e1] text-[#2b2622] p-5 sm:p-7 hover:-translate-y-1 transition-transform"
            >
              <span className="text-4xl sm:text-5xl">{g.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-[family-name:'Cormorant_Garamond'] font-bold text-3xl leading-tight">{g.title}</h2>
                <p className="mt-1 text-[#4a4a4a] leading-relaxed">{g.text}</p>
              </div>
              <span className="hidden sm:inline-flex rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-5 py-2.5 group-hover:gap-3">Jugar →</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-sm text-muted">
        ¿Prefieres competir? En <Link href="/jugar" className="underline hover:text-lime">Jugar</Link> cada palabra solo puede tener un dueño al año.
      </p>
    </div>
  );
}
