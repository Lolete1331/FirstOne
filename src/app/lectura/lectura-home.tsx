"use client";
import Link from "next/link";
import { ACTIVITIES, TYPE_LABELS } from "@/lib/lectura/activities";
import { totalStars, useStars } from "@/lib/lectura/progress";

export function LecturaHome() {
  const stars = useStars();
  const total = totalStars(stars);
  return (
    <div className="pt-4">
      <h1 className="text-[1.6em]">¡Hola! 👋 Vamos a practicar</h1>
      <p className="lx-muted mt-2">Elige una actividad. Puedes escuchar todas las palabras con el botón 🔊.</p>

      {total > 0 && (
        <p className="lx-card mt-4 px-4 py-3 font-bold inline-block">
          ⭐ Llevas {total} {total === 1 ? "estrella" : "estrellas"}
        </p>
      )}

      <div className="lx-card mt-5 p-4 flex items-start gap-3" style={{ fontSize: "0.8em" }}>
        <span className="text-2xl" aria-hidden>
          Aa
        </span>
        <p>
          <b>¿Te cuesta leer con estos colores?</b> Pulsa <b>Ajustes</b> arriba y cambia el color del fondo, el tipo de
          letra, el tamaño o el espacio entre letras hasta que estés cómodo.
        </p>
      </div>

      <h2 className="mt-8 text-[1.15em]">Actividades</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {ACTIVITIES.map((a) => (
          <Link key={a.id} href={a.href} className="lx-card p-5 flex flex-col gap-2 hover:-translate-y-0.5 transition-transform">
            <span className="text-[2em]" aria-hidden>
              {a.emoji}
            </span>
            <span className="font-bold text-[1.05em]">{a.title}</span>
            <span className="lx-muted" style={{ fontSize: "0.78em" }}>
              {a.description}
            </span>
            <span className="mt-1 flex flex-wrap gap-1.5" style={{ fontSize: "0.62em", letterSpacing: "normal" }}>
              <span className="rounded-full px-2.5 py-1 font-bold" style={{ background: "var(--lx-accent)", color: "var(--lx-on-accent)" }}>
                {a.skill}
              </span>
              {a.helps.map((t) => (
                <span key={t} className="rounded-full px-2.5 py-1 border-2" style={{ borderColor: "var(--lx-line)" }}>
                  {TYPE_LABELS[t]}
                </span>
              ))}
              {stars[a.id] ? <span className="px-1 font-bold">⭐ {stars[a.id]}</span> : null}
            </span>
          </Link>
        ))}
      </div>

      <Link href="/lectura/tipos" className="lx-card mt-6 p-5 flex items-center gap-4">
        <span className="text-[1.8em]" aria-hidden>
          👨‍👩‍👧
        </span>
        <span>
          <span className="font-bold block">Para familias y docentes</span>
          <span className="lx-muted" style={{ fontSize: "0.78em" }}>
            ¿Qué es la dislexia? Tipos y qué actividades ayudan en cada caso.
          </span>
        </span>
      </Link>
    </div>
  );
}
