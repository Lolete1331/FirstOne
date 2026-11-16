/** Prensa y madrina de FirstOne (permiso de Lola Pons para mencionarla como madrina y enlazar su columna: 16-nov-2026). */
export const MADRINA = {
  name: "Lola Pons Rodríguez",
  short: "Lola Pons",
  role: "Catedrática de Lengua Española en la Universidad de Sevilla y divulgadora",
  books: [
    { title: "El dedo en los labios. El silencio en la historia de la lengua española", publisher: "Taurus", isbn: "978-84-306-2927-5" },
    { title: "Una lengua muy muy larga", publisher: "Arpa", isbn: "978-84-16601-53-0" },
    { title: "El árbol de la lengua", publisher: "Arpa", isbn: "978-84-17623-43-2" },
    { title: "El español es un mundo", publisher: "Arpa", isbn: "978-84-18741-62-3" },
  ],
};

export const PRESS = [
  {
    outlet: "El País",
    title: "¿Quiénes son ustedes?",
    author: "Lola Pons",
    date: "14 de noviembre de 2026",
    url: "https://elpais.com/opinion/2026-11-14/quienes-son-ustedes.html",
    // Cita breve de la columna (derecho de cita, con autora y enlace).
    quote: "Entré en su web, tecleé una y tuve respuesta inmediata; estaba disponible, podía quedármela como propia hasta el final de 2026.",
  },
] as const;

/** Palabras con una historia especial que se cuenta en su página. */
export const WORD_NOTES: Record<string, { text: string; url: string; linkText: string }> = {
  suscriptor: {
    text: "Lola Pons, madrina de FirstOne, fue la primera en conquistar esta palabra y se la regaló a los lectores de El País en su columna.",
    url: "https://elpais.com/opinion/2026-11-14/quienes-son-ustedes.html",
    linkText: "Leer «¿Quiénes son ustedes?» en El País",
  },
};
