"use client";
import { useState } from "react";

/** Comparte el enlace de la palabra (al pegarlo en WhatsApp, X… se ve la tarjeta con el dueño). */
export function ShareWordButton({ word, owner, className = "" }: { word: string; owner: string | null; className?: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://firstone.es/palabra/${encodeURIComponent(word)}`;
  const text = owner ? `«${word}» es de @${owner} 🥇 ¿Y tú, qué palabra tienes?` : `«${word}» todavía no tiene dueño… ¿te la quedas?`;
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "FirstOne", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelado */
    }
  };
  return (
    <button onClick={share} className={className || "rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-5 py-2.5 text-sm"}>
      {copied ? "¡Enlace copiado!" : "📤 Compartir"}
    </button>
  );
}
