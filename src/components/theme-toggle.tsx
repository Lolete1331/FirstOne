"use client";
import { useEffect, useState } from "react";

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

/** Botón para cambiar entre el estilo clásico (de diccionario) y el moderno. */
export function ThemeToggle({ variant = "chip" }: { variant?: "chip" | "link" }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setTheme(document.documentElement.dataset.theme === "moderno" ? "moderno" : "clasico"), 0);
    return () => clearTimeout(t);
  }, []);
  const next: Theme = theme === "moderno" ? "clasico" : "moderno";
  const toggle = () => {
    applyTheme(next);
    setTheme(next);
  };
  const label = next === "moderno" ? "Estilo moderno" : "Estilo clásico";

  if (variant === "link")
    return (
      <button type="button" onClick={toggle} className="hover:underline">
        {theme ? `🎨 Cambiar a ${label.toLowerCase()}` : "🎨 Estilo"}
      </button>
    );
  return (
    <button
      type="button"
      onClick={toggle}
      title={`Cambiar a ${label.toLowerCase()}`}
      aria-label={`Cambiar a ${label.toLowerCase()}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 sm:px-3 py-1.5 text-xs font-bold hover:border-lime/60 transition-colors"
    >
      <span aria-hidden>🎨</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
