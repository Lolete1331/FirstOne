"use client";
import { useLecturaSettings } from "@/lib/lectura/settings";

/** Palabra con las sílabas en colores alternos (si el ajuste está activado). */
export function SyllableWord({ syllables, force, className = "" }: { syllables: string[]; force?: boolean; className?: string }) {
  const { colorSyllables } = useLecturaSettings();
  if (!colorSyllables && !force) return <span className={className}>{syllables.join("")}</span>;
  return (
    <span className={className} aria-label={syllables.join("")}>
      {syllables.map((s, i) => (
        <span key={i} aria-hidden className={i % 2 === 0 ? "lx-s1" : "lx-s2"}>
          {s}
        </span>
      ))}
    </span>
  );
}
