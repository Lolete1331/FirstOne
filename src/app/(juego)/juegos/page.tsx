import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";

export const metadata: Metadata = {
  title: "Juegos de palabras del día",
  description:
    "Juegos diarios con las palabras del español: la palabra oculta, ¿qué significa?, sopa de letras, ¿existe o no existe?, anagramas, refranes, la intrusa, ortografía y el ahorcado. Gratis.",
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
  {
    href: "/juegos/existe",
    icon: "🤔",
    title: "¿Existe o no existe?",
    text: "Diez palabras: unas están en el diccionario y otras nos las hemos inventado. ¿Sabes distinguirlas?",
  },
  {
    href: "/juegos/anagramas",
    icon: "🔀",
    title: "Anagramas",
    text: "Siete letras. ¿Cuántas palabras eres capaz de formar con ellas?",
  },
  {
    href: "/juegos/refranes",
    icon: "🗣️",
    title: "Refranes",
    text: "Cinco refranes a medias. ¿Sabes cómo terminan?",
  },
  {
    href: "/juegos/intrusa",
    icon: "🧩",
    title: "La intrusa",
    text: "Cuatro palabras y una que no encaja con las demás.",
  },
  {
    href: "/juegos/b-o-v",
    icon: "✍️",
    title: "¿B o V?",
    text: "Ortografía rápida: b o v, g o j, con h o sin h.",
  },
  {
    href: "/juegos/ahorcado",
    icon: "🎯",
    title: "El ahorcado",
    text: "Tres palabras para adivinar letra a letra, con su tema como pista.",
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
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {GAMES.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className="group h-full flex items-center gap-4 rounded-3xl border-2 border-[#d9c9a3] bg-[#f7f0e1] text-[#2b2622] p-5 hover:-translate-y-1 transition-transform"
            >
              <span className="text-4xl sm:text-5xl">{g.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-[family-name:'Cormorant_Garamond'] font-bold text-2xl sm:text-3xl leading-tight">{g.title}</h2>
                <p className="mt-1 text-[#4a4a4a] leading-relaxed">{g.text}</p>
              </div>

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
