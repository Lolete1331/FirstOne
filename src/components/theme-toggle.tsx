"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { applyA11y, PROFILES, profileOf, readA11y, STANDARD, type A11ySettings, type FontChoice } from "@/lib/a11y";

export type Theme = "clasico" | "moderno";
export const THEME_KEY = "fo-theme";
const THEME_COLOR: Record<Theme, string> = { clasico: "#f3ead8", moderno: "#07060b" };

/** Aplica el estilo elegido (se guarda en este navegador). */
export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[t]);
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* sin almacenamiento: dura lo que la pestaña */
  }
}

/**
 * Botón 🎨 que abre «Pantalla a tu medida»: estilo clásico/moderno, modos según la necesidad
 * (dislexia, baja visión…) y ajustes personalizados.
 */
export function ThemeToggle({ variant = "chip" }: { variant?: "chip" | "link" }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    const check = () => setCustom(profileOf(readA11y()) !== "estandar");
    const t = setTimeout(check, 0);
    window.addEventListener("fo-a11y", check);
    return () => {
      clearTimeout(t);
      window.removeEventListener("fo-a11y", check);
    };
  }, []);

  const button =
    variant === "link" ? (
      <button type="button" onClick={() => setOpen(true)} className="hover:underline">
        🎨 Estilo y accesibilidad
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Pantalla a tu medida: estilo, tamaño de letra y accesibilidad"
        aria-label="Pantalla a tu medida: estilo, tamaño de letra y accesibilidad"
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 rounded-full border bg-surface-2 px-2.5 sm:px-3 py-1.5 text-xs font-bold hover:border-lime/60 transition-colors ${
          custom ? "border-gold/70" : "border-line"
        }`}
      >
        <span aria-hidden>🎨</span>
        <span className="hidden sm:inline">Pantalla</span>
      </button>
    );

  return (
    <>
      {button}
      {open && createPortal(<SettingsPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

const FONT_OPTIONS: [FontChoice, string, string][] = [
  ["normal", "Normal", "inherit"],
  ["legible", "Muy legible", "'Atkinson Hyperlegible'"],
  ["facil", "Fácil de leer", "'Lexend'"],
  ["dislexia", "OpenDyslexic", "'OpenDyslexic'"],
];
const SIZE_OPTIONS: A11ySettings["size"][] = [100, 112, 125, 140];
const TOGGLES: [keyof A11ySettings, string, string][] = [
  ["spacing", "Más espacio", "Entre letras, palabras y líneas"],
  ["contrast", "Alto contraste", "Texto más oscuro y fondo liso"],
  ["motion", "Menos movimiento", "Sin animaciones ni confeti"],
  ["plain", "Fondo liso", "Sin adornos ni brillos"],
  ["links", "Enlaces subrayados", "Para distinguirlos sin color"],
  ["symbols", "Colores con símbolos", "Para daltonismo: ✓ y ↔ en la palabra oculta"],
];

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === "moderno" ? "moderno" : "clasico"));
  const [s, setS] = useState<A11ySettings>(() => readA11y());
  const panel = useRef<HTMLDivElement>(null);
  const profile = profileOf(s);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const update = (next: A11ySettings) => {
    setS(next);
    applyA11y(next);
  };
  const pickTheme = (t: Theme) => {
    applyTheme(t);
    setTheme(t);
  };

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm transition-colors ${active ? "border-gold bg-gold/15 font-bold" : "border-line hover:border-gold/60"}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fo-a11y-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-line bg-bg text-text shadow-2xl p-5 sm:p-6 outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="fo-a11y-title" className="font-display font-bold text-2xl">
              Pantalla a tu medida
            </h2>
            <p className="text-sm text-muted">Elige lo que te resulte más cómodo. Se guarda en este dispositivo.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-2xl leading-none text-muted hover:text-text">
            ×
          </button>
        </div>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-muted">Estilo</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className={chip(theme === "clasico")} aria-pressed={theme === "clasico"} onClick={() => pickTheme("clasico")}>
            📜 Clásico <span className="block text-xs font-normal text-muted">Papel y tinta</span>
          </button>
          <button className={chip(theme === "moderno")} aria-pressed={theme === "moderno"} onClick={() => pickTheme("moderno")}>
            🌙 Moderno <span className="block text-xs font-normal text-muted">Oscuro y de colores</span>
          </button>
        </div>

        <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-muted">Adaptar la pantalla</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PROFILES.map((p) => (
            <button key={p.id} className={`${chip(profile === p.id)} text-left`} aria-pressed={profile === p.id} onClick={() => update(p.settings)}>
              <span aria-hidden>{p.emoji}</span> {p.name}
              <span className="block text-xs font-normal text-muted">{p.hint}</span>
            </button>
          ))}
        </div>
        {profile === "personalizado" && <p className="mt-2 text-xs text-gold">Estás usando ajustes personalizados.</p>}

        <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-muted">Personalizar</h3>
        <p className="mt-2 text-sm font-bold">Tamaño de letra</p>
        <div className="mt-1 grid grid-cols-4 gap-2" role="group" aria-label="Tamaño de letra">
          {SIZE_OPTIONS.map((n, i) => (
            <button key={n} className={chip(s.size === n)} aria-pressed={s.size === n} onClick={() => update({ ...s, size: n })}>
              <span style={{ fontSize: `${0.85 + i * 0.2}rem` }}>A</span>
              <span className="sr-only"> {n} %</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-bold">Tipo de letra</p>
        <div className="mt-1 grid grid-cols-2 gap-2" role="group" aria-label="Tipo de letra">
          {FONT_OPTIONS.map(([f, label, family]) => (
            <button key={f} className={chip(s.font === f)} aria-pressed={s.font === f} onClick={() => update({ ...s, font: f })} style={{ fontFamily: family }}>
              {label}
            </button>
          ))}
        </div>
        <ul className="mt-3 divide-y divide-line">
          {TOGGLES.map(([key, label, hint]) => {
            const on = s[key] === true;
            return (
              <li key={key}>
                <button
                  role="switch"
                  aria-checked={on}
                  onClick={() => update({ ...s, [key]: !on })}
                  className="w-full flex items-center gap-3 py-2.5 text-left"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-bold">{label}</span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </span>
                  <span aria-hidden className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-gold" : "bg-surface-2 border border-line"}`}>
                    <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-lime text-bg font-bold px-5 py-2.5">
            Listo
          </button>
          {profile !== "estandar" && (
            <button onClick={() => update(STANDARD)} className="rounded-full border border-line px-4 py-2.5 text-sm">
              Volver a lo estándar
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Estos modos son una ayuda para leer con más comodidad, no sustituyen el consejo de un profesional.
        </p>
      </div>
    </div>
  );
}
