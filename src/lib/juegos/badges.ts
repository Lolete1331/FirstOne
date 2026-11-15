/** Insignias: se calculan a partir de los datos de `user_badges` (base de datos). */
export type BadgeData = {
  words: number;
  medals: number;
  longest: number;
  new_year: boolean;
  oculta_solved: number;
  oculta_first: boolean;
  oculta_one: boolean;
  games: number;
  perfect: Record<string, number>;
  sopa_best: number | null;
  anagramas_best: number;
  max_games_day: number;
  best_streak: number;
};

export type Badge = { id: string; icon: string; name: string; how: string; earned: boolean };

export const GAME_NAMES: Record<string, string> = {
  sopa: "Sopa de letras",
  significa: "¿Qué significa?",
  existe: "¿Existe o no existe?",
  refranes: "Refranes",
  intrusa: "La intrusa",
  "b-o-v": "¿B o V?",
  ahorcado: "El ahorcado",
  anagramas: "Anagramas",
};

export function badgesFor(d: BadgeData): Badge[] {
  const p = (g: string) => (d.perfect?.[g] ?? 0) > 0;
  return [
    { id: "primera", icon: "✍️", name: "Primera palabra", how: "Conquista tu primera palabra", earned: d.words >= 1 },
    { id: "medallas10", icon: "🥇", name: "Coleccionista", how: "Sé dueño de 10 palabras", earned: d.medals >= 10 },
    { id: "medallas100", icon: "🏆", name: "Gran coleccionista", how: "Sé dueño de 100 palabras", earned: d.medals >= 100 },
    { id: "medallas1000", icon: "📚", name: "Diccionario andante", how: "Sé dueño de 1.000 palabras", earned: d.medals >= 1000 },
    { id: "larga", icon: "📏", name: "Palabra kilométrica", how: "Sé dueño de una palabra de 15 letras o más", earned: d.longest >= 15 },
    { id: "campanadas", icon: "🎆", name: "Campanadas", how: "Conquista una palabra en la primera hora del año", earned: d.new_year },
    { id: "racha7", icon: "🔥", name: "Una semana seguida", how: "Juega 7 días seguidos", earned: d.best_streak >= 7 },
    { id: "racha30", icon: "🌟", name: "Un mes seguido", how: "Juega 30 días seguidos", earned: d.best_streak >= 30 },
    { id: "completo", icon: "🎲", name: "Jugador completo", how: "Juega los 9 juegos en un mismo día", earned: d.max_games_day >= 9 },
    { id: "detective", icon: "🔎", name: "Detective", how: "Encuentra la palabra oculta", earned: d.oculta_solved >= 1 },
    { id: "rapido", icon: "⚡", name: "El más rápido", how: "Sé el primero del mundo en encontrar la palabra oculta", earned: d.oculta_first },
    { id: "alaprimera", icon: "🎯", name: "A la primera", how: "Encuentra la palabra oculta en un intento", earned: d.oculta_one },
    { id: "sabio", icon: "📖", name: "Sabio", how: "Acierta las 5 de ¿Qué significa?", earned: p("significa") },
    { id: "refranero", icon: "🗣️", name: "Refranero", how: "Acierta los 5 refranes", earned: p("refranes") },
    { id: "ortografia", icon: "✒️", name: "Ortografía perfecta", how: "Acierta las 6 de ¿B o V?", earned: p("b-o-v") },
    { id: "existe", icon: "🤔", name: "Olfato fino", how: "Acierta las 10 de ¿Existe o no existe?", earned: p("existe") },
    { id: "intrusa", icon: "🧩", name: "Ojo crítico", how: "Encuentra las 5 intrusas", earned: p("intrusa") },
    { id: "ahorcado", icon: "🦸", name: "Salvavidas", how: "Adivina las 3 palabras del ahorcado", earned: p("ahorcado") },
    { id: "lince", icon: "🔤", name: "Ojo de lince", how: "Completa la sopa de letras en menos de 2 minutos", earned: d.sopa_best !== null && d.sopa_best <= 120 },
    { id: "anagramista", icon: "🔀", name: "Anagramista", how: "Encuentra 20 palabras en Anagramas", earned: d.anagramas_best >= 20 },
  ];
}
