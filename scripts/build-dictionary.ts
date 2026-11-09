/**
 * Genera supabase/data/dictionary.tsv: la lista de palabras válidas de FirstOne.
 *
 *  1. Lemario general del español (olea/lemarios, dominio público), extraído del DRAE.
 *     Solo lemas en minúscula formados por letras: quedan fuera locuciones latinas
 *     ("ab initio"), afijos ("-able"), siglas ("ABS") y nombres propios.
 *  2. Femeninos: el lemario solo trae la forma masculina ("abogado" por "abogado, da").
 *     Generamos el femenino singular SOLO cuando el diccionario Hunspell es_ES (RLA-ES)
 *     marca esa palabra con la regla de género "G", o cuando el femenino candidato existe
 *     como entrada propia en Hunspell (p. ej. "jefa", "presidenta"). Así evitamos falsos
 *     femeninos como "canto" → "canta" (que solo es una forma verbal).
 *
 * Uso:  npm run dict:build   (necesita red para descargar el lemario)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { normalizeWord, isWellFormedWord } from "../src/lib/words/normalize";

const LEMARIO_URL =
  "https://raw.githubusercontent.com/olea/lemarios/master/lemario-general-del-espanol.txt";
const OUT = join(process.cwd(), "supabase/data/dictionary.tsv");

type Rule = { strip: string; add: string; cond: RegExp };

function parseGenderRules(aff: string): Rule[] {
  return aff
    .split("\n")
    .filter((l) => /^SFX G\s+\S+\s+\S+\s+\S+/.test(l))
    .map((l) => {
      const [, , strip, add, cond] = l.trim().split(/\s+/);
      return { strip: strip === "0" ? "" : strip, add: add === "0" ? "" : add, cond: new RegExp(cond + "$", "u") };
    })
    // Solo femenino singular (las reglas de plural terminan en "s").
    .filter((r) => r.add.endsWith("a"));
}

function applyRules(word: string, rules: Rule[]): string | null {
  for (const r of rules) {
    if (r.cond.test(word) && word.endsWith(r.strip)) {
      return word.slice(0, word.length - r.strip.length) + r.add;
    }
  }
  return null;
}

async function main() {
  const dicDir = join(process.cwd(), "node_modules/dictionary-es");
  const aff = readFileSync(join(dicDir, "index.aff"), "utf8");
  const dic = readFileSync(join(dicDir, "index.dic"), "utf8");

  const rules = parseGenderRules(aff);
  const hunspellFlags = new Map<string, string>();
  for (const line of dic.split("\n").slice(1)) {
    const [w, flags = ""] = line.trim().split("/");
    if (!w) continue;
    const key = w.normalize("NFC");
    hunspellFlags.set(key, (hunspellFlags.get(key) ?? "") + flags);
  }

  const res = await fetch(LEMARIO_URL);
  if (!res.ok) throw new Error(`No se pudo descargar el lemario: ${res.status}`);
  const raw = await res.text();

  const words = new Map<string, string>(); // palabra → origen
  for (const line of raw.split("\n")) {
    const t = line.trim().normalize("NFC");
    if (!t || t !== t.toLocaleLowerCase("es")) continue; // siglas y nombres propios fuera
    const w = normalizeWord(t);
    if (isWellFormedWord(w)) words.set(w, "lemario");
  }

  let feminines = 0;
  for (const [w, src] of [...words]) {
    if (src !== "lemario") continue;
    const flags = hunspellFlags.get(w);
    const fem = applyRules(w, rules);
    if (!fem || fem === w || words.has(fem)) continue;
    if (w.length < 3) continue; // "de" → "da" no tiene sentido
    // En las palabras en -e la marca "G" de Hunspell no es fiable ("postre" → "postra"):
    // solo aceptamos el femenino si existe como entrada propia ("jefa", "presidenta").
    const endsInE = w.endsWith("e");
    const viaFlag = !endsInE && flags?.includes("G");
    const viaEntry = hunspellFlags.has(fem);
    if (viaFlag || viaEntry) {
      words.set(fem, `femenino:${w}`);
      feminines++;
    }
  }

  const sorted = [...words.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, sorted.map(([w, s]) => `${w}\t${s}`).join("\n") + "\n");
  console.log(`✔ ${sorted.length} palabras (${feminines} femeninos generados) → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
