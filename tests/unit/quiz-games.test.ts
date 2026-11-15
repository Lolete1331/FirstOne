import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FAKE_WORDS } from "@/lib/juegos/existe-data";
import { SPELLING } from "@/lib/juegos/ortografia-data";
import { REFRANES } from "@/lib/juegos/refranes-data";
import { existeItems, intrusaItems, ortografiaItems, refranesItems } from "@/lib/juegos/quiz-games";

const WORDS = readFileSync(join(process.cwd(), "supabase/data/dictionary.tsv"), "utf8").split("\n").map((l) => l.split("\t")[0]).filter(Boolean);
const DICT = new Set(WORDS);
const fold = (w: string) => w.normalize("NFD").replace(/[́̈]/g, "").normalize("NFC");
const FOLDED = new Set(WORDS.map(fold));
const days = Array.from({ length: 120 }, (_, i) => new Date(Date.UTC(2026, 10, 15 + i)).toISOString().slice(0, 10));

describe("Juegos de preguntas", () => {
  it("las palabras inventadas no existen (ni sin tildes) y no se repiten", () => {
    for (const w of FAKE_WORDS) expect(FOLDED.has(w), w).toBe(false);
    expect(new Set(FAKE_WORDS).size).toBe(FAKE_WORDS.length);
  });

  it("ortografía: la palabra existe y la otra grafía no", () => {
    for (const [w, pos, kind] of SPELLING) {
      expect(DICT.has(w), w).toBe(true);
      const alt = kind === "h" ? w.slice(1) : w.slice(0, pos) + ({ b: "v", v: "b", g: "j", j: "g" } as Record<string, string>)[w[pos]] + w.slice(pos + 1);
      expect(DICT.has(alt) || FOLDED.has(fold(alt)), `${w} → ${alt}`).toBe(false);
    }
  });

  it("refranes sin principios ni finales repetidos", () => {
    expect(new Set(REFRANES.map(([s]) => s)).size).toBe(REFRANES.length);
    expect(new Set(REFRANES.map(([, e]) => e)).size).toBe(REFRANES.length);
  });

  it("cada día las preguntas son válidas y siempre las mismas", () => {
    for (const day of days) {
      for (const items of [existeItems(day), refranesItems(day), intrusaItems(day), ortografiaItems(day)]) {
        for (const it of items) {
          expect(it.answer, `${day} ${it.prompt}`).toBeGreaterThanOrEqual(0);
          expect(new Set(it.options).size, `${day} ${it.prompt} ${it.options}`).toBe(it.options.length);
        }
      }
      expect(existeItems(day)).toHaveLength(10);
      expect(intrusaItems(day).every((it) => it.options.length === 4)).toBe(true);
    }
    expect(refranesItems("2026-12-01")).toEqual(refranesItems("2026-12-01"));
  });
});

describe("Anagramas", () => {
  it("cada base de 7 letras da al menos 10 palabras", async () => {
    const { BASE_WORDS, fitsLetters, points, levelFor } = await import("@/lib/juegos/anagramas");
    const folded = [...FOLDED].filter((w) => w.length >= 4 && w.length <= 7);
    expect(BASE_WORDS.length).toBeGreaterThan(120);
    for (const b of BASE_WORDS) {
      const letters = [...b];
      const n = folded.filter((w) => fitsLetters(w, letters)).length;
      expect(n, b).toBeGreaterThanOrEqual(10);
    }
    expect(fitsLetters("gloria", [..."girasol"])).toBe(true);
    expect(fitsLetters("rosas", [..."girasol"])).toBe(false); // dos «s»
    expect(points("solar")).toBe(5);
    expect(points("sola")).toBe(1);
    expect(points("girasol")).toBe(14);
    expect(levelFor(0, 100)).toBe("Aprendiz");
    expect(levelFor(100, 100)).toBe("¡Todas!");
  });
});
