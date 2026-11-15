import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HIDDEN_WORDS } from "@/lib/oculta/words";
import { dayKey, dayNumber, foldWord, msToNextDay, scoreGuess, shareText } from "@/lib/oculta/game";

const DICT = new Set(
  readFileSync(join(process.cwd(), "supabase/data/dictionary.tsv"), "utf8")
    .split("\n")
    .map((l) => l.split("\t")[0])
    .filter(Boolean),
);

describe("La palabra oculta · lista de palabras", () => {
  it("todas están en el diccionario, tienen 4-8 letras y no se repiten", () => {
    for (const w of HIDDEN_WORDS) {
      expect(DICT.has(w), w).toBe(true);
      expect(foldWord(w).length, w).toBeGreaterThanOrEqual(4);
      expect(foldWord(w).length, w).toBeLessThanOrEqual(8);
    }
    expect(new Set(HIDDEN_WORDS.map(foldWord)).size).toBe(HIDDEN_WORDS.length);
    expect(HIDDEN_WORDS.length).toBeGreaterThan(365);
  });
});

describe("La palabra oculta · reglas", () => {
  it("las tildes y la diéresis no cuentan, la ñ sí", () => {
    expect(foldWord("Árbol")).toBe("arbol");
    expect(foldWord("pingüino")).toBe("pinguino");
    expect(foldWord("año")).toBe("año");
  });

  it("marca aciertos, letras descolocadas y fallos", () => {
    expect(scoreGuess("perro", "perro")).toEqual(["ok", "ok", "ok", "ok", "ok"]);
    expect(scoreGuess("rato", "toro")).toEqual(["near", "no", "near", "ok"]);
  });

  it("las letras repetidas no se cuentan de más", () => {
    // secreta "cabra" tiene dos «a»: en «aaaaa» solo cuentan las dos de su sitio
    expect(scoreGuess("aaaaa", "cabra")).toEqual(["no", "ok", "no", "no", "ok"]);
    // «llama» frente a «palma»: una sola «l» en la secreta
    expect(scoreGuess("llama", "palma")).toEqual(["near", "no", "near", "ok", "ok"]);
  });

  it("días y numeración", () => {
    expect(dayKey(new Date("2026-11-15T23:59:59Z"))).toBe("2026-11-15");
    expect(dayKey(new Date("2026-11-16T00:00:00Z"))).toBe("2026-11-16");
    expect(dayNumber("2026-11-15")).toBe(1);
    expect(dayNumber("2026-12-15")).toBe(31);
    expect(msToNextDay(new Date("2026-11-15T23:00:00Z"))).toBe(3_600_000);
  });

  it("el texto para compartir no desvela la palabra", () => {
    const t = shareText("2026-11-16", 4, 0);
    expect(t).toContain("n.º 2");
    expect(t).toContain("4/6");
  });
});

describe("La palabra oculta · días anteriores", () => {
  it("solo se pueden jugar días desde el lanzamiento hasta hoy", async () => {
    const { isPlayableDay, pastDays } = await import("@/lib/oculta/game");
    expect(isPlayableDay("2026-11-15", "2026-11-17")).toBe(true);
    expect(isPlayableDay("2026-11-17", "2026-11-17")).toBe(true);
    expect(isPlayableDay("2026-11-18", "2026-11-17")).toBe(false); // futuro
    expect(isPlayableDay("2026-11-14", "2026-11-17")).toBe(false); // antes del lanzamiento
    expect(isPlayableDay("2026-13-01", "2027-11-17")).toBe(false);
    expect(isPlayableDay("hola", "2026-11-17")).toBe(false);
    expect(pastDays("2026-11-17")).toEqual(["2026-11-16", "2026-11-15"]);
    expect(pastDays("2026-11-15")).toEqual([]);
  });
});
