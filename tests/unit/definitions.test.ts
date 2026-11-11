import { describe, expect, it } from "vitest";
import { cleanWikiText, parseWiktionary } from "@/lib/words/definitions";

const GIRASOL = `== {{lengua|es}} ==
{{pron-graf}}
[[Archivo:Drei Sonnenblumen im Feld.JPG|thumb|[1]]]

=== Etimología ===
{{etimología|compuesto|girar|sol}}.

=== {{sustantivo masculino|es}} ===
{{es.sust}}

;1 {{csem|plantas}}: {{taxón|Helianthus annuus}} {{plm|planta}} de la familia de las [[asterácea]]s, [[herbáceo|herbácea]], [[anual]], originaria de América.
{{sinónimo|helianto|maravilla}}
;2 {{csem|flores}}: {{plm|flor}} de esta planta.
;3: {{plm|persona}} [[volátil]] que se [[plegar|pliega]] a la [[opinión]] de los [[poderoso]]s.<ref>Diccionario X.</ref>
{{uso|coloquial|despectivo}}

=== Traducciones ===
{{trad-arriba}}
{{t|en|a1=1|t1=sunflower}}

== {{lengua|it}} ==
=== {{sustantivo masculino|it}} ===
;1: No debe aparecer.
`;

describe("definiciones de Wikcionario", () => {
  it("extrae las acepciones españolas con su tipo y categoría", () => {
    const groups = parseWiktionary(GIRASOL);
    expect(groups).toHaveLength(1);
    expect(groups[0].pos).toBe("Sustantivo masculino");
    expect(groups[0].senses).toEqual([
      { n: 1, text: "Planta de la familia de las asteráceas, herbácea, anual, originaria de América.", fields: ["plantas"] },
      { n: 2, text: "Flor de esta planta.", fields: ["flores"] },
      { n: 3, text: "Persona volátil que se pliega a la opinión de los poderosos.", fields: [] },
    ]);
  });

  it("ignora otros idiomas y devuelve vacío si no hay sección española", () => {
    expect(parseWiktionary("== {{lengua|it}} ==\n=== {{sustantivo|it}} ===\n;1: ciao")).toEqual([]);
  });

  it("limpia enlaces, plantillas y negritas", () => {
    expect(cleanWikiText("'''Muy''' [[bonito|bonita]] {{ejemplo|x}} y [[sol]]")).toBe("Muy bonita y sol");
  });
});
