import type { QuizConfig } from "@/components/juegos/daily-quiz";
import { existeItems, intrusaItems, ortografiaItems, refranesItems } from "./quiz-games";

export const QUIZZES = {
  existe: {
    game: "existe",
    path: "/juegos/existe",
    title: "¿Existe o no existe?",
    subtitle: "Diez palabras: unas están en el diccionario y otras nos las hemos inventado",
    emoji: "🤔",
    items: existeItems,
    columns: 2,
  },
  refranes: {
    game: "refranes",
    path: "/juegos/refranes",
    title: "Refranes",
    subtitle: "Cinco refranes a medias. ¿Sabes cómo terminan?",
    emoji: "🗣️",
    items: refranesItems,
    columns: 1,
  },
  intrusa: {
    game: "intrusa",
    path: "/juegos/intrusa",
    title: "La intrusa",
    subtitle: "Cuatro palabras y una no encaja con las demás",
    emoji: "🧩",
    items: intrusaItems,
    columns: 2,
  },
  ortografia: {
    game: "b-o-v",
    path: "/juegos/b-o-v",
    title: "¿B o V?",
    subtitle: "Seis palabras con una letra que falta: b o v, g o j, con h o sin h",
    emoji: "✍️",
    items: ortografiaItems,
    columns: 2,
  },
} satisfies Record<string, QuizConfig>;
