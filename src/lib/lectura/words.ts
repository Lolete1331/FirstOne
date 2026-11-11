/**
 * Listas de palabras para la sección de lectura, ordenadas por dificultad.
 * Cada palabra va separada en sílabas a mano (más fiable que un algoritmo para niños).
 */
export type Word = { word: string; syllables: string[]; emoji: string };
export type WordList = { id: string; title: string; description: string; level: number; words: Word[] };

const w = (split: string, emoji: string): Word => {
  const syllables = split.split("-");
  return { word: syllables.join(""), syllables, emoji };
};

export const WORD_LISTS: WordList[] = [
  {
    id: "cortas",
    level: 1,
    title: "Palabras cortas",
    description: "Dos sílabas sencillas: consonante + vocal.",
    words: [
      w("ca-sa", "🏠"), w("me-sa", "🪑"), w("lu-na", "🌙"), w("pa-to", "🦆"), w("ga-to", "🐱"),
      w("ma-no", "✋"), w("bo-ca", "👄"), w("so-pa", "🍲"), w("ro-sa", "🌹"), w("ta-za", "☕"),
      w("pi-ña", "🍍"), w("lo-ro", "🦜"), w("ra-na", "🐸"), w("mo-no", "🐒"), w("va-ca", "🐄"),
      w("fo-ca", "🦭"), w("mo-to", "🏍️"), w("ca-ma", "🛏️"), w("se-ta", "🍄"), w("pe-rro", "🐶"),
      w("ni-ño", "🧒"), w("du-cha", "🚿"), w("ba-ño", "🛁"), w("ve-la", "🕯️"), w("de-do", "☝️"),
    ],
  },
  {
    id: "medianas",
    level: 2,
    title: "Palabras de tres sílabas",
    description: "Un poco más largas. ¡Despacito y por sílabas!",
    words: [
      w("pe-lo-ta", "⚽"), w("za-pa-to", "👞"), w("ca-mi-sa", "👕"), w("pa-lo-ma", "🕊️"), w("to-ma-te", "🍅"),
      w("mu-ñe-ca", "🪆"), w("co-ne-jo", "🐰"), w("ga-lle-ta", "🍪"), w("ca-ra-col", "🐌"), w("pe-pi-no", "🥒"),
      w("ven-ta-na", "🪟"), w("mon-ta-ña", "⛰️"), w("pa-ta-ta", "🥔"), w("ba-lle-na", "🐋"), w("pe-lu-che", "🧸"),
      w("ma-le-ta", "🧳"), w("ca-ba-llo", "🐴"), w("ca-mi-no", "🛤️"), w("bo-te-lla", "🍾"), w("pa-ra-guas", "☂️"),
    ],
  },
  {
    id: "largas",
    level: 3,
    title: "Palabras largas",
    description: "Cuatro sílabas. ¡Todo un reto!",
    words: [
      w("ma-ri-po-sa", "🦋"), w("te-lé-fo-no", "☎️"), w("cho-co-la-te", "🍫"), w("e-le-fan-te", "🐘"),
      w("bi-ci-cle-ta", "🚲"), w("di-no-sau-rio", "🦕"), w("co-ci-ne-ro", "🧑‍🍳"), w("a-gua-ca-te", "🥑"),
      w("ca-la-ba-za", "🎃"), w("pe-lí-cu-la", "🎬"), w("se-má-fo-ro", "🚦"), w("me-di-ci-na", "💊"),
      w("ca-ra-me-lo", "🍬"), w("ma-ri-qui-ta", "🐞"), w("ca-ma-le-ón", "🦎"), w("pa-ja-ri-to", "🐦"),
    ],
  },
  {
    id: "trabadas",
    level: 4,
    title: "Sílabas trabadas",
    description: "Con dos consonantes juntas: bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr.",
    words: [
      w("bra-zo", "💪"), w("pla-to", "🍽️"), w("glo-bo", "🎈"), w("fre-sa", "🍓"), w("dra-gón", "🐉"),
      w("plá-ta-no", "🍌"), w("tri-go", "🌾"), w("li-bro", "📖"), w("ca-bra", "🐐"), w("ti-gre", "🐯"),
      w("bru-ja", "🧙"), w("cro-co-di-lo", "🐊"), w("fle-cha", "🏹"),
      w("tren-ci-to", "🚂"), w("bró-co-li", "🥦"), w("pre-mio", "🏆"), w("gri-fo", "🚰"), w("blu-sa", "👚"), w("cris-tal", "🪟"),
    ],
  },
];

export const ALL_WORDS: Word[] = WORD_LISTS.flatMap((l) => l.words);
export const getList = (id: string) => WORD_LISTS.find((l) => l.id === id);

/** Pares de ortografía: la buena y un error típico (que no sea otra palabra real). */
export const SPELLING_PAIRS: { right: string; wrong: string; emoji: string; tip: string }[] = [
  { right: "huevo", wrong: "uevo", emoji: "🥚", tip: "«Huevo» lleva hache al principio." },
  { right: "hormiga", wrong: "ormiga", emoji: "🐜", tip: "«Hormiga» empieza con hache, aunque no suena." },
  { right: "helado", wrong: "elado", emoji: "🍦", tip: "«Helado» lleva hache muda." },
  { right: "hoja", wrong: "oja", emoji: "🍃", tip: "«Hoja» empieza con hache." },
  { right: "jirafa", wrong: "girafa", emoji: "🦒", tip: "«Jirafa» se escribe con jota." },
  { right: "girasol", wrong: "jirasol", emoji: "🌻", tip: "«Girasol» viene de «girar»: con ge." },
  { right: "llave", wrong: "yave", emoji: "🔑", tip: "«Llave» se escribe con elle." },
  { right: "lluvia", wrong: "yuvia", emoji: "🌧️", tip: "«Lluvia» empieza con elle." },
  { right: "yogur", wrong: "llogur", emoji: "🥛", tip: "«Yogur» empieza con i griega." },
  { right: "vela", wrong: "bela", emoji: "🕯️", tip: "«Vela» se escribe con uve." },
  { right: "nube", wrong: "nuve", emoji: "☁️", tip: "«Nube» se escribe con be." },
  { right: "uva", wrong: "uba", emoji: "🍇", tip: "«Uva» se escribe con uve." },
  { right: "ballena", wrong: "vallena", emoji: "🐋", tip: "«Ballena» empieza con be." },
  { right: "caballo", wrong: "cavallo", emoji: "🐴", tip: "«Caballo» se escribe con be." },
  { right: "volcán", wrong: "bolcán", emoji: "🌋", tip: "«Volcán» empieza con uve." },
  { right: "bicicleta", wrong: "vicicleta", emoji: "🚲", tip: "«Bicicleta» empieza con be." },
  { right: "zapato", wrong: "sapato", emoji: "👞", tip: "«Zapato» empieza con zeta." },
  { right: "cebolla", wrong: "sebolla", emoji: "🧅", tip: "«Cebolla» empieza con ce." },
  { right: "queso", wrong: "keso", emoji: "🧀", tip: "El sonido /ke/ se escribe «que»." },
  { right: "guitarra", wrong: "gitarra", emoji: "🎸", tip: "Para que suene /gi/ se escribe «gui»." },
  { right: "pingüino", wrong: "pinguino", emoji: "🐧", tip: "La «ü» con diéresis hace que la u suene." },
  { right: "cereza", wrong: "sereza", emoji: "🍒", tip: "«Cereza» empieza con ce." },
  { right: "zanahoria", wrong: "zanaoria", emoji: "🥕", tip: "«Zanahoria» lleva una hache en medio." },
  { right: "almohada", wrong: "almoada", emoji: "🛌", tip: "«Almohada» lleva hache en medio." },
];
