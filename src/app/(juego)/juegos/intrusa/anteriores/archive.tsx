"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { quizStatus } from "@/components/juegos/daily-quiz";
import { QUIZZES } from "@/lib/juegos/quiz-configs";

const status = quizStatus(QUIZZES.intrusa.game, 5);

export function Archive() {
  return <DayArchive game={QUIZZES.intrusa.title} path={QUIZZES.intrusa.path} status={status} />;
}
