import { NextResponse } from "next/server";
import { dayKey, isPlayableDay } from "@/lib/oculta/game";
import { quizFor } from "@/lib/juegos/significa";

/** GET /api/significa?day=AAAA-MM-DD → el cuestionario «¿Qué significa?» de ese día (por defecto, hoy). */
export async function GET(request: Request) {
  const day = new URL(request.url).searchParams.get("day") ?? dayKey();
  if (!isPlayableDay(day)) return NextResponse.json({ error: "día no válido" }, { status: 400 });
  const quiz = await quizFor(day);
  if (quiz.questions.length < 3) {
    return NextResponse.json({ error: "temporalmente no disponible" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  // La CDN lo guarda un rato: el cuestionario de un día no cambia.
  return NextResponse.json(quiz, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
}
