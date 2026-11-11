"use client";
import { speak, speakSyllables } from "@/lib/lectura/speech";
import { VOICE_RATES, useLecturaSettings } from "@/lib/lectura/settings";

/** Botón 🔊 que lee la palabra (y, si se indica, sus sílabas). */
export function SpeakButton({
  text,
  syllables,
  label = "Escuchar",
  className = "",
}: {
  text: string;
  syllables?: string[];
  label?: string;
  className?: string;
}) {
  const { voice } = useLecturaSettings();
  const rate = VOICE_RATES[voice];
  return (
    <button
      type="button"
      onClick={() => (syllables ? speakSyllables(text, syllables, rate) : speak(text, rate))}
      className={`lx-btn-ghost ${className}`}
      aria-label={`${label}: ${text}`}
    >
      🔊 <span>{label}</span>
    </button>
  );
}
