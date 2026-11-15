import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MEANING_WORDS } from "@/lib/juegos/significa-palabras";
import { maskWord, pickDefinition, shorten } from "@/lib/juegos/significa-text";

const DICT = new Set(
  readFileSync(join(process.cwd(), "supabase/data/dictionary.tsv"), "utf8").split("\n").map((l) => l.split("\t")[0]).filter(Boolean),
);

describe("¿Qué significa?", () => {
  it("todas las palabras existen en el diccionario y no se repiten", () => {
    for (const w of MEANING_WORDS) expect(DICT.has(w), w).toBe(true);
    expect(new Set(MEANING_WORDS).size).toBe(MEANING_WORDS.length);
    expect(MEANING_WORDS.length).toBeGreaterThan(400);
  });

  it("la definición no regala la palabra y se recorta bien", () => {
    expect(maskWord("Persona zascandil y zascandilear mucho", "zascandil")).toBe("Persona … y … mucho");
    expect(shorten("uno dos tres cuatro cinco", 12)).toBe("uno dos…");
    expect(shorten("corto")).toBe("corto");
    expect(pickDefinition(["Forma de algo", "Persona que habla mucho y sin sustancia."], "parlanchín")).toBe("Persona que habla mucho y sin sustancia.");
  });

  it("no elige una definición que solo repite la palabra; junta sinónimos cortos", () => {
    // Caso real de Wikcionario: «trapisonda»
    expect(pickDefinition(["Riña.", "Alboroto.", "Embuste.", "Marullo.", "Trapisondista."], "trapisonda")).toBe(
      "Riña, alboroto, embuste, marullo.",
    );
    expect(pickDefinition(["Persona trapisondista.", "Lío, enredo o embrollo que causa alboroto entre la gente."], "trapisonda")).toBe(
      "Lío, enredo o embrollo que causa alboroto entre la gente.",
    );
    expect(pickDefinition([], "nada")).toBeNull();
  });
});
