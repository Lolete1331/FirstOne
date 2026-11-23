/**
 * «Pantalla a tu medida»: ajustes de lectura y accesibilidad para toda la web (menos la sección de lectura,
 * que tiene los suyos). Se guardan solo en este navegador (localStorage `fo-a11y`) y se aplican como
 * atributos en <html> (los estilos están en globals.css).
 */
export const A11Y_KEY = "fo-a11y";

export type FontChoice = "normal" | "legible" | "facil" | "dislexia";
export type ProfileId = "estandar" | "dislexia" | "baja-vision" | "daltonismo" | "concentracion" | "movimiento";

export type A11ySettings = {
  size: 100 | 112 | 125 | 140; // tamaño de letra (%)
  font: FontChoice;
  spacing: boolean; // más espacio entre letras, palabras y líneas
  contrast: boolean; // alto contraste
  motion: boolean; // menos movimiento (sin animaciones ni confeti)
  plain: boolean; // fondo liso, sin adornos
  links: boolean; // enlaces subrayados
  symbols: boolean; // colores con símbolos (daltonismo)
};

export const STANDARD: A11ySettings = {
  size: 100,
  font: "normal",
  spacing: false,
  contrast: false,
  motion: false,
  plain: false,
  links: false,
  symbols: false,
};

export const PROFILES: { id: ProfileId; emoji: string; name: string; hint: string; settings: A11ySettings }[] = [
  { id: "estandar", emoji: "✨", name: "Estándar", hint: "La web tal cual", settings: STANDARD },
  {
    id: "dislexia",
    emoji: "📖",
    name: "Dislexia",
    hint: "Letra más clara y más espacio",
    settings: { ...STANDARD, size: 112, font: "facil", spacing: true, plain: true },
  },
  {
    id: "baja-vision",
    emoji: "🔍",
    name: "Baja visión",
    hint: "Letra grande y alto contraste",
    settings: { ...STANDARD, size: 125, font: "legible", contrast: true, links: true },
  },
  {
    id: "daltonismo",
    emoji: "🎯",
    name: "Daltonismo",
    hint: "No depender solo del color",
    settings: { ...STANDARD, symbols: true, links: true },
  },
  {
    id: "concentracion",
    emoji: "🧘",
    name: "Concentración",
    hint: "TDAH: menos distracciones",
    settings: { ...STANDARD, motion: true, plain: true, spacing: true },
  },
  {
    id: "movimiento",
    emoji: "🌊",
    name: "Mareo con el movimiento",
    hint: "Sin animaciones",
    settings: { ...STANDARD, motion: true, plain: true },
  },
];

const SIZES = [100, 112, 125, 140] as const;
const FONTS: FontChoice[] = ["normal", "legible", "facil", "dislexia"];

/** Lee los ajustes guardados (o los estándar si no hay o están mal). */
export function readA11y(): A11ySettings {
  try {
    const raw = JSON.parse(localStorage.getItem(A11Y_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return STANDARD;
    return {
      size: SIZES.includes(raw.size) ? raw.size : 100,
      font: FONTS.includes(raw.font) ? raw.font : "normal",
      spacing: raw.spacing === true,
      contrast: raw.contrast === true,
      motion: raw.motion === true,
      plain: raw.plain === true,
      links: raw.links === true,
      symbols: raw.symbols === true,
    };
  } catch {
    return STANDARD;
  }
}

export function profileOf(s: A11ySettings): ProfileId | "personalizado" {
  const same = (a: A11ySettings, b: A11ySettings) => (Object.keys(a) as (keyof A11ySettings)[]).every((k) => a[k] === b[k]);
  return PROFILES.find((p) => same(p.settings, s))?.id ?? "personalizado";
}

/** Aplica los ajustes a la página y los guarda. */
export function applyA11y(s: A11ySettings, save = true) {
  const el = document.documentElement;
  const set = (name: string, on: boolean, value = "on") => (on ? el.setAttribute(name, value) : el.removeAttribute(name));
  el.style.fontSize = s.size === 100 ? "" : `${s.size}%`;
  set("data-font", s.font !== "normal", s.font);
  set("data-spacing", s.spacing);
  set("data-contrast", s.contrast);
  set("data-motion", s.motion, "reduce");
  set("data-plain", s.plain);
  set("data-links", s.links);
  set("data-symbols", s.symbols);
  if (save) {
    try {
      if (profileOf(s) === "estandar") localStorage.removeItem(A11Y_KEY);
      else localStorage.setItem(A11Y_KEY, JSON.stringify(s));
    } catch {
      /* sin almacenamiento: dura lo que la pestaña */
    }
  }
  window.dispatchEvent(new Event("fo-a11y"));
}

/** ¿Hay que evitar animaciones? (ajuste de la web o del sistema). */
export function prefersLessMotion() {
  if (typeof window === "undefined") return false;
  return document.documentElement.hasAttribute("data-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Script que se ejecuta antes de pintar la página (para que no parpadee). Debe ser autosuficiente. */
export const A11Y_INIT_SCRIPT = `try{var a=JSON.parse(localStorage.getItem("${A11Y_KEY}")||"null");if(a){var e=document.documentElement;if([112,125,140].indexOf(a.size)>=0)e.style.fontSize=a.size+"%";if(["legible","facil","dislexia"].indexOf(a.font)>=0)e.setAttribute("data-font",a.font);if(a.spacing===true)e.setAttribute("data-spacing","on");if(a.contrast===true)e.setAttribute("data-contrast","on");if(a.motion===true)e.setAttribute("data-motion","reduce");if(a.plain===true)e.setAttribute("data-plain","on");if(a.links===true)e.setAttribute("data-links","on");if(a.symbols===true)e.setAttribute("data-symbols","on");}}catch(e){}`;
