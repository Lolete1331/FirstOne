"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { quizStatus } from "@/components/juegos/daily-quiz";
import { QUIZZES } from "@/lib/juegos/quiz-configs";

const status = quizStatus(QUIZZES.ortografia.game, 6);

export function Archive() {
  return <DayArchive game={QUIZZES.ortografia.title} path={QUIZZES.ortografia.path} status={status} />;
}
