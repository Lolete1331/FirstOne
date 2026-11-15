import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { THEMES } from "@/lib/juegos/sopa-temas";
import { generateSopa, isDiagonal, lineCells, matchWord, MIN_DIAGONAL, SOPA_SIZE, sopaLetters } from "@/lib/juegos/sopa";

const DICT = new Set(
  readFileSync(join(process.cwd(), "supabase/data/dictionary.tsv"), "utf8").split("\n").map((l) => l.split("\t")[0]).filter(Boolean),
);

describe("Sopa de letras", () => {
  it("todas las palabras de los temas existen y caben", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(30);
    for (const t of THEMES) {
      expect(new Set(t.words).size, t.name).toBe(t.words.length);
      for (const w of t.words) {
        expect(DICT.has(w), `${t.name}: ${w}`).toBe(true);
        expect(sopaLetters(w).length, w).toBeLessThanOrEqual(SOPA_SIZE);
      }
    }
  });

  it("cada día sale una sopa válida (y siempre la misma)", () => {
    for (let i = 0; i < 400; i++) {
      const day = new Date(Date.UTC(2026, 10, 15 + i)).toISOString().slice(0, 10);
      const s = generateSopa(day);
      for (const w of s.words) {
        expect(w.cells.map(([r, c]) => s.grid[r][c]).join("")).toBe(w.letters);
        expect(matchWord(s, w.cells)).toBeGreaterThanOrEqual(0);
        expect(matchWord(s, [...w.cells].reverse())).toBeGreaterThanOrEqual(0);
      }
      expect(s.grid.flat().every((ch) => /^[A-ZÑ]$/.test(ch))).toBe(true);
      if (day >= "2026-11-16") expect(s.words.filter((w) => isDiagonal(w.cells)).length, day).toBeGreaterThanOrEqual(MIN_DIAGONAL);
    }
    expect(generateSopa("2026-11-20")).toEqual(generateSopa("2026-11-20"));
  });

  it("solo se seleccionan líneas rectas", () => {
    expect(lineCells([0, 0], [0, 3])).toHaveLength(4);
    expect(lineCells([0, 0], [3, 3])).toHaveLength(4);
    expect(lineCells([3, 0], [0, 3])).toHaveLength(4);
    expect(lineCells([0, 0], [1, 2])).toBeNull();
    expect(sopaLetters("Cigüeña")).toBe("CIGUEÑA");
  });
});
