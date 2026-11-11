"use client";
import { useSyncExternalStore } from "react";

/**
 * Ajustes de lectura de la sección de dislexia. Se guardan solo en el dispositivo
 * (localStorage), sin cuentas ni datos personales.
 *
 * Valores por defecto según las guías de estilo para dislexia (British Dyslexia Association):
 * fondo crema en vez de blanco puro, texto gris muy oscuro en vez de negro, letra sin adornos,
 * tamaño grande y espaciado amplio entre letras, palabras y líneas.
 */
export type Background = "crema" | "amarillo" | "azul" | "verde" | "rosa" | "melocoton" | "gris" | "oscuro";
export type FontChoice = "lexend" | "atkinson" | "opendyslexic" | "verdana";
export type Size = "normal" | "grande" | "muy-grande";
export type Spacing = "normal" | "amplio" | "muy-amplio";
export type VoiceSpeed = "lenta" | "normal";

export type LecturaSettings = {
  background: Background;
  font: FontChoice;
  size: Size;
  spacing: Spacing;
  voice: VoiceSpeed;
  colorSyllables: boolean;
};

export const DEFAULTS: LecturaSettings = {
  background: "crema",
  font: "lexend",
  size: "grande",
  spacing: "amplio",
  voice: "lenta",
  colorSyllables: true,
};

export const BACKGROUNDS: Record<Background, { label: string; bg: string; card: string; fg: string; muted: string; line: string; dark?: boolean }> = {
  crema: { label: "Crema", bg: "#FBF5E6", card: "#FFFCF3", fg: "#2B2B2B", muted: "#5C5648", line: "#E3D7B9" },
  amarillo: { label: "Amarillo suave", bg: "#FFF6CC", card: "#FFFBE6", fg: "#2B2B2B", muted: "#5E5630", line: "#EBDD99" },
  azul: { label: "Azul suave", bg: "#E3F0FA", card: "#F3F8FD", fg: "#1F2A33", muted: "#465664", line: "#BDD6EA" },
  verde: { label: "Verde suave", bg: "#E6F4EA", card: "#F4FBF6", fg: "#1F2B23", muted: "#475A4C", line: "#BFDDC7" },
  rosa: { label: "Rosa suave", bg: "#FBE7EC", card: "#FDF4F6", fg: "#2E2326", muted: "#664D54", line: "#EBC4CE" },
  melocoton: { label: "Melocotón", bg: "#FDEBD8", card: "#FEF6EC", fg: "#2E261F", muted: "#66543F", line: "#EDCDA8" },
  gris: { label: "Gris claro", bg: "#EFEFEF", card: "#F8F8F8", fg: "#262626", muted: "#555555", line: "#D3D3D3" },
  oscuro: { label: "Oscuro suave", bg: "#1F2430", card: "#272D3B", fg: "#ECE9E2", muted: "#B5B0A6", line: "#3A4253", dark: true },
};

export const FONTS: Record<FontChoice, { label: string; family: string; note: string }> = {
  lexend: { label: "Lexend", family: "'Lexend', system-ui, sans-serif", note: "Diseñada para leer con menos esfuerzo." },
  atkinson: { label: "Atkinson", family: "'Atkinson Hyperlegible', system-ui, sans-serif", note: "Letras muy diferentes entre sí." },
  opendyslexic: { label: "OpenDyslexic", family: "'OpenDyslexic', system-ui, sans-serif", note: "Letras con la base más gruesa." },
  verdana: { label: "Verdana", family: "Verdana, Tahoma, system-ui, sans-serif", note: "Clásica, ancha y clara." },
};

export const SIZES: Record<Size, { label: string; px: number }> = {
  normal: { label: "Normal", px: 19 },
  grande: { label: "Grande", px: 23 },
  "muy-grande": { label: "Muy grande", px: 28 },
};

export const SPACINGS: Record<Spacing, { label: string; letter: string; word: string; line: number }> = {
  normal: { label: "Normal", letter: "0.01em", word: "0.05em", line: 1.6 },
  amplio: { label: "Amplio", letter: "0.06em", word: "0.18em", line: 1.8 },
  "muy-amplio": { label: "Muy amplio", letter: "0.12em", word: "0.32em", line: 2.05 },
};

export const VOICE_RATES: Record<VoiceSpeed, number> = { lenta: 0.72, normal: 0.92 };

// ── Pequeño almacén sincronizado con localStorage ──
const KEY = "fo-lectura-ajustes-v1";
const listeners = new Set<() => void>();
let cached: LecturaSettings | null = null;

function read(): LecturaSettings {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LecturaSettings>) } : DEFAULTS;
  } catch {
    cached = DEFAULTS;
  }
  return cached;
}

export function updateSettings(patch: Partial<LecturaSettings>) {
  cached = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* modo privado: se aplica solo en esta visita */
  }
  listeners.forEach((l) => l());
}

export function resetSettings() {
  updateSettings(DEFAULTS);
}

export function useLecturaSettings(): LecturaSettings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULTS,
  );
}
