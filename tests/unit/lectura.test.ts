import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_WORDS, SPELLING_PAIRS, WORD_LISTS } from "@/lib/lectura/words";
import { checkDictation, letterDiff, shuffle } from "@/lib/lectura/shuffle";
import { normalizeWord } from "@/lib/words/normalize";

const DICT = new Set(
  readFileSync(join(process.cwd(), "supabase/data/dictionary.tsv"), "utf8")
    .split("\n")
    .map((l) => l.split("\t")[0])
    .filter(Boolean),
);

describe("listas de palabras de la sección de lectura", () => {
  it("las sílabas juntas forman la palabra", () => {
    for (const w of ALL_WORDS) expect(w.syllables.join(""), w.word).toBe(w.word);
  });

  it("no hay palabras repetidas dentro de una lista y cada lista tiene al menos 8", () => {
    for (const l of WORD_LISTS) {
      expect(new Set(l.words.map((w) => w.word)).size, l.id).toBe(l.words.length);
      expect(l.words.length, l.id).toBeGreaterThanOrEqual(8);
    }
  });

  it("los niveles de sílabas son coherentes", () => {
    const n = (id: string) => WORD_LISTS.find((l) => l.id === id)!.words.map((w) => w.syllables.length);
    expect(n("cortas").every((k) => k === 2)).toBe(true);
    expect(n("medianas").every((k) => k === 3)).toBe(true);
    expect(n("largas").every((k) => k === 4)).toBe(true);
  });

  it("todas las palabras están en el diccionario del juego", () => {
    const missing = ALL_WORDS.map((w) => normalizeWord(w.word)).filter((w) => !DICT.has(w));
    expect(missing).toEqual([]);
  });
});

describe("pares de ortografía", () => {
  it("la forma correcta existe y la incorrecta no es otra palabra real", () => {
    for (const p of SPELLING_PAIRS) {
      expect(DICT.has(p.right), `${p.right} debería existir`).toBe(true);
      expect(DICT.has(p.wrong), `${p.wrong} no debería ser una palabra real`).toBe(false);
      expect(p.right).not.toBe(p.wrong);
    }
  });
});

describe("corrección del dictado", () => {
  it("acepta mayúsculas y espacios y detecta tildes olvidadas", () => {
    expect(checkDictation("  Casa ", "casa")).toBe("ok");
    expect(checkDictation("dragon", "dragón")).toBe("accent");
    expect(checkDictation("pinguino", "pingüino")).toBe("accent");
    expect(checkDictation("kasa", "casa")).toBe("wrong");
  });

  it("marca letra a letra lo que está bien", () => {
    expect(letterDiff("kasa", "casa")).toEqual([
      { ch: "k", ok: false },
      { ch: "a", ok: true },
      { ch: "s", ok: true },
      { ch: "a", ok: true },
    ]);
  });

  it("barajar no pierde ni inventa elementos", () => {
    const a = [1, 2, 3, 4, 5];
    expect(shuffle(a).sort()).toEqual(a);
  });
});
