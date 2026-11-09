import { describe, expect, it } from "vitest";
import { isWellFormedWord, normalizeWord } from "@/lib/words/normalize";
import { SetValidator, validateWord } from "@/lib/words/validator";

describe("normalizeWord", () => {
  it("pasa a minúsculas y quita espacios sobrantes", () => {
    expect(normalizeWord("  Hola ")).toBe("hola");
    expect(normalizeWord("CASA")).toBe("casa");
    expect(normalizeWord("dos    palabras")).toBe("dos palabras");
  });

  it("respeta tildes, diéresis y ñ", () => {
    expect(normalizeWord("AÑO")).toBe("año");
    expect(normalizeWord("Pingüino")).toBe("pingüino");
    expect(normalizeWord("ÁRBOL")).toBe("árbol");
    expect(normalizeWord("año")).not.toBe(normalizeWord("ano"));
  });

  it("unifica la ñ y las tildes escritas como caracteres combinados (NFC)", () => {
    const decomposed = "an\u0303o"; // n + virgulilla combinante
    expect(decomposed).not.toBe("año");
    expect(normalizeWord(decomposed)).toBe("año");
    expect(normalizeWord("camio\u0301n")).toBe("camión");
  });
});

describe("isWellFormedWord", () => {
  it("acepta solo letras del español", () => {
    expect(isWellFormedWord("ñandú")).toBe(true);
    expect(isWellFormedWord("pingüino")).toBe(true);
    expect(isWellFormedWord("")).toBe(false);
    expect(isWellFormedWord("dos palabras")).toBe(false);
    expect(isWellFormedWord("hola!")).toBe(false);
    expect(isWellFormedWord("abc123")).toBe(false);
    expect(isWellFormedWord("café")).toBe(true);
    expect(isWellFormedWord("façade")).toBe(false);
    expect(isWellFormedWord("a".repeat(41))).toBe(false);
  });
});

describe("validateWord", () => {
  const v = new SetValidator(["año", "ano", "abogado", "abogada"]);

  it("valida contra el diccionario después de normalizar", async () => {
    expect(await validateWord("  AÑO ", v)).toEqual({ ok: true, word: "año" });
    expect(await validateWord("Abogada", v)).toEqual({ ok: true, word: "abogada" });
  });

  it("distingue año de ano", async () => {
    const solo = new SetValidator(["año"]);
    expect((await validateWord("ano", solo)).ok).toBe(false);
  });

  it("explica por qué no es válida", async () => {
    expect(await validateWord("perros", v)).toEqual({ ok: false, word: "perros", reason: "not_in_dictionary" });
    expect(await validateWord("x1", v)).toEqual({ ok: false, word: "x1", reason: "malformed" });
  });
});
