"use client";
import { useSyncExternalStore } from "react";

/** Estrellas conseguidas en cada actividad. Solo en este dispositivo. */
const KEY = "fo-lectura-estrellas-v1";
type Stars = Record<string, number>;
const listeners = new Set<() => void>();
let cached: Stars | null = null;
const EMPTY: Stars = {};

function read(): Stars {
  if (cached) return cached;
  try {
    cached = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Stars;
  } catch {
    cached = {};
  }
  return cached;
}

export function addStar(activity: string, n = 1) {
  const s = read();
  cached = { ...s, [activity]: (s[activity] ?? 0) + n };
  try {
    localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* sin almacenamiento: cuenta solo en esta visita */
  }
  listeners.forEach((l) => l());
}

export function useStars(): Stars {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}

export const totalStars = (s: Stars) => Object.values(s).reduce((a, b) => a + b, 0);
