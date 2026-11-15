"""
Genera las listas de palabras de los juegos diarios para que duren más de un año.

Uso (desde la raíz del repositorio):
    python3 -m venv /tmp/venv && /tmp/venv/bin/pip install wordfreq
    /tmp/venv/bin/python tools/juegos/generar-datos.py

Usa el diccionario del juego (supabase/data/dictionary.tsv) y la frecuencia de uso de cada palabra
(paquete «wordfreq») solo para ELEGIR palabras: comunes para el ahorcado o la ortografía, raras pero
reales para «¿Existe?» y «¿Qué significa?». No se guarda ninguna frecuencia en el repositorio.
"""
import json, random, re
from collections import Counter
from wordfreq import zipf_frequency

OUT = "src/lib/juegos/"
rows = [l.rstrip("\n").split("\t") for l in open("supabase/data/dictionary.tsv", encoding="utf8") if l.strip()]
DICT = {w for w, _ in rows}
LEMAS = sorted(w for w, src in rows if not src.startswith("femenino"))

def fold(w):
    return w.translate(str.maketrans("áéíóúü", "aeiouu"))

FOLDED = {fold(w) for w in DICT}
Z = {w: zipf_frequency(w, "es") for w in LEMAS}

# Palabras malsonantes, insultos fuertes o que pueden ofender: fuera de todos los juegos.
VETO = re.compile(
    r"(put[aoie]|mierd|coñ|poll[ao]n?$|jod|cabr[oó]n|maric|culo|foll|verg[ao]|mamad|pene|vagin|tet[ao]|coj[oó]n|paj[ae]r|"
    r"zorr|gilipoll|sudaca|negrat|gitan|moro$|judiad|nazi|violac|viol[ae]|droga|cocain|heroin|suicid|asesin|matanz|"
    r"cadaver|cadáver|prostit|ramer|burdel|sexo|sexual|erotic|erótic|orgasm|orgía|orgia|meretri|fornic|sodom|"
    r"masturb|eyacul|semen|esperm|anal$|ano$|recto$|excrement|caca|pedo|meado|orina|vomit|vómit|tortur|esclav)"
)

def ok(w):
    return not VETO.search(fold(w))

def ts_array(name, items, doc, typ="readonly string[]"):
    lines, cur = [], ""
    for w in items:
        item = json.dumps(w, ensure_ascii=False) + ", "
        if len(cur) + len(item) > 110:
            lines.append(cur.rstrip()); cur = ""
        cur += item
    lines.append(cur.rstrip())
    body = "\n".join("  " + l for l in lines)
    return f"/**\n * {doc}\n * Generado con tools/juegos/generar-datos.py — no editar a mano.\n */\nexport const {name}: {typ} = [\n{body}\n];\n"

rnd = random.Random(2026)

# ── ¿Qué significa? (5 al día): palabras poco usadas pero reales ──
curated = set(re.findall(r'"([^"]+)"', open(OUT + "significa-palabras.ts", encoding="utf8").read()))
extra = [w for w in LEMAS if 1.3 <= Z[w] <= 2.6 and 6 <= len(w) <= 12 and not w.endswith("mente") and ok(w) and w not in curated]
rnd.shuffle(extra)
extra = sorted(extra[:2400])
open(OUT + "significa-extra.ts", "w", encoding="utf8").write(
    ts_array("MEANING_EXTRA", extra, "«¿Qué significa?»: más palabras poco usadas (después de las curiosas elegidas a mano).")
)

# ── ¿Existe o no existe? (5 reales + 5 inventadas al día) ──
reals = [w for w in LEMAS if 1.0 <= Z[w] <= 2.4 and 6 <= len(w) <= 10 and ok(w) and w not in curated and w not in set(extra)]
rnd.shuffle(reals)
reals = sorted(reals[:1900])
V = "aeiou"
src_words = [fold(w) for w in LEMAS if 1.0 <= Z[w] <= 3.5 and 6 <= len(w) <= 11 and ok(w)]
def prefixes(w): return [w[: i + 1] for i in range(2, len(w) - 2) if w[i] in V and w[i + 1] not in V]
def suffixes(w): return [w[i:] for i in range(2, len(w) - 2) if w[i] not in V and w[i - 1] in V]
fakes, tries = set(), 0
while len(fakes) < 2000 and tries < 2_000_000:
    tries += 1
    a, b = rnd.sample(src_words, 2)
    P, S = prefixes(a), suffixes(b)
    if not P or not S: continue
    f = rnd.choice(P) + rnd.choice(S)
    if not (6 <= len(f) <= 10) or f.endswith("s"): continue
    if f in FOLDED or f[:-1] in FOLDED or zipf_frequency(f, "es") > 0: continue
    if re.search(r"[^aeiou]{3}", f.replace("ch", "C").replace("ll", "L").replace("rr", "R")): continue
    if re.search(r"(aba|ían|aron|ando|iendo|mente|ción)$", f) or not ok(f): continue
    if a[:-1] in f or b[1:] in f: continue
    fakes.add(f)
fakes = sorted(fakes)
open(OUT + "existe-data.ts", "w", encoding="utf8").write(
    ts_array("FAKE_WORDS", fakes, "«¿Existe o no existe?»: palabras INVENTADAS (mezclas de dos palabras reales). Un test comprueba que no existen.")
    + "\n" + ts_array("REAL_RARE_WORDS", reals, "«¿Existe o no existe?»: palabras REALES poco usadas (están en el diccionario).")
)

# ── ¿B o V? (6 al día): palabras de uso común con una letra dudosa ──
items = []
for w in sorted(LEMAS, key=lambda x: -Z[x]):
    if Z[w] < 2.6 or len(w) < 4 or not ok(w): continue
    for i, ch in enumerate(w):
        alt, kind = None, None
        if ch in "bv": alt, kind = w[:i] + ("v" if ch == "b" else "b") + w[i + 1 :], "bv"
        elif ch == "h" and i == 0: alt, kind = w[1:], "h"
        elif ch in "gj" and i + 1 < len(w) and w[i + 1] in "eiéí": alt, kind = w[:i] + ("j" if ch == "g" else "g") + w[i + 1 :], "gj"
        if alt and alt not in DICT and fold(alt) not in FOLDED and zipf_frequency(alt, "es") == 0:
            items.append([w, i, kind]); break
    if len(items) >= 2400: break
items.sort()
open(OUT + "ortografia-data.ts", "w", encoding="utf8").write(
    "/**\n * «¿B o V?»: palabras de uso común con una letra dudosa (b/v, g/j ante e-i, h inicial).\n"
    " * [palabra, posición de la letra, tipo]. Un test comprueba que la otra grafía NO existe en el diccionario.\n"
    " * Generado con tools/juegos/generar-datos.py — no editar a mano.\n */\n"
    'export type SpellingKind = "bv" | "gj" | "h";\n'
    "export const SPELLING: readonly (readonly [string, number, SpellingKind])[] = [\n"
    + ",\n".join("  " + json.dumps(x, ensure_ascii=False) for x in items) + ",\n];\n"
)

# ── Anagramas (1 al día): palabras comunes de 7 letras que dan 15 palabras o más ──
cand4 = [fold(w) for w in DICT if 4 <= len(w) <= 7]
bases = []
for w in sorted({fold(w) for w in LEMAS if len(w) == 7 and Z[w] >= 3.0 and ok(w)}):
    L = Counter(w)
    n = sum(1 for c in set(cand4) if not (Counter(c) - L))
    if n >= 15: bases.append(w)
open(OUT + "anagramas-data.ts", "w", encoding="utf8").write(
    ts_array("ANAGRAM_BASES", bases, "«Anagramas»: palabras comunes de 7 letras (sin tildes) con las que se forman 15 palabras o más.")
)

# ── El ahorcado (3 al día): palabras de uso común ──
hang = [w for w in LEMAS if Z[w] >= 3.3 and 5 <= len(w) <= 9 and ok(w)]
rnd.shuffle(hang)
hang = sorted(hang[:1300])
open(OUT + "ahorcado-data.ts", "w", encoding="utf8").write(
    ts_array("HANGMAN_WORDS", hang, "«El ahorcado»: palabras de uso común (5 a 9 letras).")
)

print("significa extra", len(extra), "| existe reales", len(reals), "inventadas", len(fakes),
      "| ortografía", len(items), "| anagramas", len(bases), "| ahorcado", len(hang))
