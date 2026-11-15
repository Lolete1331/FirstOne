"use client";
import { DailyQuiz } from "@/components/juegos/daily-quiz";
import { QUIZZES } from "@/lib/juegos/quiz-configs";
import { useDayParam } from "@/lib/hooks/use-day-param";

export function View() {
  return <DailyQuiz config={QUIZZES.ortografia} day={useDayParam()} />;
}
