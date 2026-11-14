"use client";
import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { BACKGROUNDS, FONTS, SIZES, SPACINGS, useLecturaSettings } from "@/lib/lectura/settings";
import { SettingsPanel } from "./settings-panel";
import { LegalLinks } from "@/components/legal/legal-links";

/** Aplica los ajustes de lectura (fondo, letra, tamaño, espaciado) a toda la sección. */
export function LecturaShell({ children }: { children: ReactNode }) {
  const s = useLecturaSettings();
  const [open, setOpen] = useState(false);
  const bg = BACKGROUNDS[s.background];
  const sp = SPACINGS[s.spacing];
  const vars = {
    "--lx-bg": bg.bg,
    "--lx-card": bg.card,
    "--lx-fg": bg.fg,
    "--lx-muted": bg.muted,
    "--lx-line": bg.line,
    "--lx-accent": bg.dark ? "#7FC8BF" : "#2F6F6A",
    "--lx-on-accent": bg.dark ? "#10201E" : "#FFFFFF",
    "--lx-ok": bg.dark ? "#7CD992" : "#2E8B57",
    "--lx-no": bg.dark ? "#F2A27A" : "#C2571A",
    "--lx-s1": bg.dark ? "#8CC8F0" : "#1F5F8B",
    "--lx-s2": bg.dark ? "#F2A27A" : "#B0471F",
    "--lx-font": FONTS[s.font].family,
    "--lx-size": `${SIZES[s.size].px}px`,
    "--lx-letter": sp.letter,
    "--lx-word": sp.word,
    "--lx-lh": String(sp.line),
  } as CSSProperties;

  return (
    <div className="lx-root flex-1 min-h-dvh flex flex-col" style={vars}>
      {/* Fondo a pantalla completa, también al hacer scroll elástico */}
      <div aria-hidden className="fixed inset-0 -z-10" style={{ background: bg.bg }} />
      <header className="w-full max-w-3xl mx-auto px-4 pt-4 pb-2 flex items-center gap-3" style={{ fontSize: "16px", letterSpacing: "normal", wordSpacing: "normal" }}>
        <Link href="/" className="lx-btn-ghost !min-h-0 !py-1.5 !px-3 text-sm whitespace-nowrap shrink-0" aria-label="Volver a la portada de FirstOne">
          ← Inicio
        </Link>
        <Link href="/lectura" className="font-bold text-lg truncate min-w-0">
          📚 <span className="sm:hidden">Lectura</span><span className="hidden sm:inline">Leer y escribir</span>
        </Link>
        <button onClick={() => setOpen(true)} className="ml-auto lx-btn !min-h-0 !py-2 !px-4 text-sm whitespace-nowrap shrink-0" aria-haspopup="dialog">
          <span aria-hidden>Aa</span> Ajustes
        </button>
      </header>
      <main className="w-full max-w-3xl mx-auto px-4 pb-16 flex-1">{children}</main>
      <footer className="w-full max-w-3xl mx-auto px-4 pb-8 lx-muted" style={{ fontSize: "14px", letterSpacing: "normal", wordSpacing: "normal", lineHeight: 1.6 }}>
        Estas actividades son para practicar y apoyar la lectura. No sustituyen a un logopeda ni a un psicopedagogo: solo
        un profesional puede valorar si hay dislexia y qué ayuda necesita cada niño o niña. No guardamos datos personales:
        las estrellas y los ajustes se quedan en este dispositivo.
        <LegalLinks className="mt-3 !justify-start" />
      </footer>
      <AnimatePresence>{open && <SettingsPanel onClose={() => setOpen(false)} />}</AnimatePresence>
    </div>
  );
}
