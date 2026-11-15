"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { quizStatus } from "@/components/juegos/daily-quiz";
import { QUIZZES } from "@/lib/juegos/quiz-configs";

const status = quizStatus(QUIZZES.existe.game, 10);

export function Archive() {
  return <DayArchive game={QUIZZES.existe.title} path={QUIZZES.existe.path} status={status} />;
}
