/** Utilidades para las actividades. */
export function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Compara lo que escribe el niño con la palabra: ignora mayúsculas y espacios; detecta tildes olvidadas. */
export function checkDictation(input: string, target: string): "ok" | "accent" | "wrong" {
  const clean = (s: string) => s.normalize("NFC").trim().toLocaleLowerCase("es");
  const strip = (s: string) => clean(s).normalize("NFD").replace(/[̀-́̈]/g, "").normalize("NFC");
  if (clean(input) === clean(target)) return "ok";
  if (strip(input) === strip(target)) return "accent";
  return "wrong";
}

/** Letra a letra: qué letras coinciden con la palabra correcta (para colorearlas). */
export function letterDiff(input: string, target: string): { ch: string; ok: boolean }[] {
  const a = [...input.toLocaleLowerCase("es")];
  const b = [...target.toLocaleLowerCase("es")];
  return a.map((ch, i) => ({ ch, ok: b[i] === ch }));
}
