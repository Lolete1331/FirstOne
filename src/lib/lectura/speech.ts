"use client";
/** Voz que lee en alto (síntesis de voz del navegador, gratis y sin conexión con terceros). */

let voice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voice !== undefined && voice !== null) return voice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  voice =
    voices.find((v) => v.lang === "es-ES") ??
    voices.find((v) => v.lang.startsWith("es-")) ??
    voices.find((v) => v.lang.startsWith("es")) ??
    null;
  return voice;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Lee un texto. `rate` < 1 es más despacio. */
export function speak(text: string, rate = 0.8) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  u.rate = rate;
  const v = pickVoice();
  if (v) u.voice = v;
  synth.speak(u);
}

/** Lee una palabra y después sus sílabas separadas: «mariposa… ma, ri, po, sa». */
export function speakSyllables(word: string, syllables: string[], rate = 0.8) {
  speak(`${word}. ${syllables.join(", ")}.`, rate);
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    voice = undefined;
  };
}
