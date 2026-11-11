export type DyslexiaType = "fonologica" | "superficial" | "mixta";

export const TYPE_LABELS: Record<DyslexiaType, string> = {
  fonologica: "Fonológica",
  superficial: "Superficial",
  mixta: "Mixta",
};

export type Activity = {
  id: string;
  href: string;
  emoji: string;
  title: string;
  description: string;
  skill: string;
  helps: DyslexiaType[];
};

/** Actividades de la sección de lectura y a qué tipo de dislexia ayudan más. */
export const ACTIVITIES: Activity[] = [
  {
    id: "silabas",
    href: "/lectura/silabas",
    emoji: "👏",
    title: "Cuenta las sílabas",
    description: "Escucha la palabra y di cuántas sílabas tiene, como si dieras palmadas.",
    skill: "Sonidos",
    helps: ["fonologica", "mixta"],
  },
  {
    id: "sonidos",
    href: "/lectura/sonidos",
    emoji: "👂",
    title: "¿Cómo empieza?",
    description: "Escucha la palabra y elige con qué sílaba empieza.",
    skill: "Sonidos",
    helps: ["fonologica", "mixta"],
  },
  {
    id: "letras",
    href: "/lectura/letras",
    emoji: "🔍",
    title: "b · d · p · q",
    description: "Encuentra la letra que te pedimos entre letras que se parecen mucho.",
    skill: "Letras",
    helps: ["superficial", "mixta"],
  },
  {
    id: "ortografia",
    href: "/lectura/ortografia",
    emoji: "✍️",
    title: "¿Cómo se escribe?",
    description: "Elige la forma correcta: ¿con h o sin h?, ¿con b o con v?…",
    skill: "Ortografía",
    helps: ["superficial", "mixta"],
  },
  {
    id: "dictado",
    href: "/lectura/dictado",
    emoji: "🎧",
    title: "Escribe lo que oyes",
    description: "Escucha una palabra y escríbela. Te ayudamos letra a letra.",
    skill: "Escritura",
    helps: ["fonologica", "superficial", "mixta"],
  },
  {
    id: "listas",
    href: "/lectura/listas",
    emoji: "📖",
    title: "Leer y escuchar",
    description: "Listas de palabras por niveles para leer a tu ritmo y escuchar cómo suenan.",
    skill: "Lectura",
    helps: ["fonologica", "superficial", "mixta"],
  },
];
