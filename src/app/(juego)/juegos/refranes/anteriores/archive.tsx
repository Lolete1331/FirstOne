"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { quizStatus } from "@/components/juegos/daily-quiz";
import { QUIZZES } from "@/lib/juegos/quiz-configs";

const status = quizStatus(QUIZZES.refranes.game, 5);

export function Archive() {
  return <DayArchive game={QUIZZES.refranes.title} path={QUIZZES.refranes.path} status={status} />;
}
