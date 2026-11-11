"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import {
  BACKGROUNDS,
  FONTS,
  SIZES,
  SPACINGS,
  resetSettings,
  updateSettings,
  useLecturaSettings,
  type Background,
  type FontChoice,
  type Size,
  type Spacing,
  type VoiceSpeed,
} from "@/lib/lectura/settings";
import { SyllableWord } from "./syllable-word";

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="font-bold text-lg">{title}</legend>
      {hint && <p className="lx-muted text-sm mt-1">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Opt({ active, onClick, children, style }: { active: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={style}
      className={`rounded-2xl border-[3px] px-4 py-2.5 min-h-[48px] font-bold ${active ? "border-[var(--lx-accent)]" : "border-[var(--lx-line)]"}`}
    >
      {children}
    </button>
  );
}

/** Panel de ajustes: fondo, letra, tamaño, espaciado, sílabas de colores y voz. Con vista previa en vivo. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useLecturaSettings();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Ajustes de lectura"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-7"
        style={{ background: "var(--lx-bg)", fontSize: "17px", letterSpacing: "normal", wordSpacing: "normal", lineHeight: 1.5 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Ajustes de lectura</h2>
          <button onClick={onClose} className="lx-btn !min-h-0 !py-2">
            Listo
          </button>
        </div>
        <p className="lx-muted mt-2">
          Cada persona lee mejor de una forma. Prueba y quédate con lo que te resulte más cómodo.
        </p>

        {/* Vista previa con los ajustes actuales */}
        <div
          className="lx-card mt-5 p-5 text-center"
          style={{
            fontFamily: "var(--lx-font)",
            fontSize: "var(--lx-size)",
            letterSpacing: "var(--lx-letter)",
            wordSpacing: "var(--lx-word)",
            lineHeight: "var(--lx-lh)",
          }}
        >
          <p className="text-[1.6em]">
            <SyllableWord syllables={["ma", "ri", "po", "sa"]} />
          </p>
          <p>La mariposa vuela sobre la flor.</p>
        </div>

        <Group title="Color del fondo" hint="El crema suele ser más cómodo que el blanco puro.">
          {(Object.keys(BACKGROUNDS) as Background[]).map((k) => (
            <Opt
              key={k}
              active={s.background === k}
              onClick={() => updateSettings({ background: k })}
              style={{ background: BACKGROUNDS[k].bg, color: BACKGROUNDS[k].fg }}
            >
              {BACKGROUNDS[k].label}
            </Opt>
          ))}
        </Group>

        <Group title="Tipo de letra" hint={FONTS[s.font].note}>
          {(Object.keys(FONTS) as FontChoice[]).map((k) => (
            <Opt key={k} active={s.font === k} onClick={() => updateSettings({ font: k })} style={{ fontFamily: FONTS[k].family }}>
              {FONTS[k].label}
            </Opt>
          ))}
        </Group>

        <Group title="Tamaño de letra">
          {(Object.keys(SIZES) as Size[]).map((k) => (
            <Opt key={k} active={s.size === k} onClick={() => updateSettings({ size: k })}>
              {SIZES[k].label}
            </Opt>
          ))}
        </Group>

        <Group title="Espacio entre letras y líneas" hint="Más espacio ayuda a no saltarse letras.">
          {(Object.keys(SPACINGS) as Spacing[]).map((k) => (
            <Opt key={k} active={s.spacing === k} onClick={() => updateSettings({ spacing: k })}>
              {SPACINGS[k].label}
            </Opt>
          ))}
        </Group>

        <Group title="Sílabas de colores" hint="Pinta cada sílaba de un color para verlas mejor.">
          <Opt active={s.colorSyllables} onClick={() => updateSettings({ colorSyllables: true })}>
            Sí
          </Opt>
          <Opt active={!s.colorSyllables} onClick={() => updateSettings({ colorSyllables: false })}>
            No
          </Opt>
        </Group>

        <Group title="Velocidad de la voz">
          {(["lenta", "normal"] as VoiceSpeed[]).map((k) => (
            <Opt key={k} active={s.voice === k} onClick={() => updateSettings({ voice: k })}>
              {k === "lenta" ? "🐢 Lenta" : "🐇 Normal"}
            </Opt>
          ))}
        </Group>

        <button onClick={resetSettings} className="mt-7 underline lx-muted">
          Volver a los ajustes recomendados
        </button>
      </motion.div>
    </motion.div>
  );
}
