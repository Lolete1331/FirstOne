import type { Metadata } from "next";
import Link from "next/link";
import { ACTIVITIES } from "@/lib/lectura/activities";

export const metadata: Metadata = {
  title: "Tipos de dislexia y actividades",
  description:
    "Qué es la dislexia, sus tipos (fonológica, superficial y mixta) y qué actividades de lectura y escritura ayudan en cada caso. Guía sencilla para familias y docentes.",
  alternates: { canonical: "/lectura/tipos" },
};

const TYPES = [
  {
    id: "fonologica",
    emoji: "👂",
    title: "Dislexia fonológica",
    what: "Cuesta convertir las letras en sonidos. Se nota sobre todo con palabras nuevas, largas o inventadas.",
    signs: [
      "Lee bien palabras conocidas, pero se atasca con palabras nuevas.",
      "Cambia, omite o añade sonidos («pelota» → «peleta»).",
      "Le cuesta separar una palabra en sílabas o saber cómo empieza.",
    ],
    activities: ["silabas", "sonidos", "dictado"],
  },
  {
    id: "superficial",
    emoji: "👀",
    title: "Dislexia superficial",
    what: "Cuesta reconocer las palabras «de un vistazo». Lee letra a letra, despacio, aunque conozca la palabra.",
    signs: [
      "Lee muy despacio, silabeando incluso palabras que conoce.",
      "Le cuesta recordar cómo se escriben las palabras (b/v, h, g/j, ll/y).",
      "Confunde letras con forma parecida, como b y d o p y q.",
    ],
    activities: ["ortografia", "letras", "listas"],
  },
  {
    id: "mixta",
    emoji: "🧩",
    title: "Dislexia mixta",
    what: "Se combinan las dos dificultades anteriores: con los sonidos y con el reconocimiento de las palabras.",
    signs: ["Aparecen señales de los dos tipos.", "Suele ser la que más esfuerzo pide al leer y escribir."],
    activities: ["silabas", "letras", "ortografia", "dictado", "listas"],
  },
];

export default function TiposPage() {
  const byId = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
  return (
    <article className="pt-4" style={{ fontSize: "0.85em" }}>
      <h1 className="text-[1.6em]">¿Qué es la dislexia?</h1>
      <p className="mt-3">
        La dislexia es una <b>dificultad específica para aprender a leer y escribir</b> con fluidez. No tiene nada que
        ver con la inteligencia ni con el esfuerzo: el cerebro procesa las letras y los sonidos de otra manera. Con
        práctica, apoyo y paciencia, se puede mejorar mucho.
      </p>
      <p className="lx-card mt-4 p-4">
        ⚠️ <b>Solo un profesional</b> (logopeda, psicopedagogo u orientador escolar) puede valorar si un niño o una niña
        tiene dislexia y de qué tipo. Esta guía es orientativa y las actividades sirven para practicar, no para
        diagnosticar.
      </p>

      <h2 className="mt-8 text-[1.3em]">Tipos de dislexia</h2>
      <div className="mt-3 space-y-4">
        {TYPES.map((t) => (
          <section key={t.id} className="lx-card p-5" id={t.id}>
            <h3 className="text-[1.2em]">
              {t.emoji} {t.title}
            </h3>
            <p className="mt-2">{t.what}</p>
            <p className="mt-3 font-bold">Algunas señales:</p>
            <ul className="mt-1 list-disc pl-6 space-y-1">
              {t.signs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-3 font-bold">Actividades que más ayudan:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.activities.map((id) => (
                <Link key={id} href={byId[id].href} className="lx-btn-ghost !min-h-[44px]">
                  {byId[id].emoji} {byId[id].title}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <h2 className="mt-8 text-[1.3em]">¿Y los colores y la letra?</h2>
      <p className="mt-2">
        No hay un color que sea el mejor para todo el mundo. A muchas personas les resulta más cómodo leer sobre{" "}
        <b>fondo crema o de color suave</b> y con el texto en <b>gris muy oscuro</b> en lugar de negro sobre blanco puro.
        Lo que más ayuda según los estudios es la <b>letra grande, sin adornos y con más espacio</b> entre letras,
        palabras y líneas. Por eso aquí empezamos con esa configuración y puedes cambiarla en <b>Ajustes</b>.
      </p>

      <h2 className="mt-8 text-[1.3em]">Consejos para casa</h2>
      <ul className="mt-2 list-disc pl-6 space-y-1.5">
        <li>Ratos cortos (10-15 minutos) y frecuentes funcionan mejor que sesiones largas.</li>
        <li>Celebrad cada avance: la confianza es tan importante como la técnica.</li>
        <li>Leed juntos en voz alta y dejad tiempo, sin prisas ni cronómetros.</li>
        <li>Hablad con el colegio: existen adaptaciones (más tiempo en exámenes, exámenes orales…).</li>
      </ul>

      <Link href="/lectura" className="lx-btn mt-8">
        ← Volver a las actividades
      </Link>
    </article>
  );
}
