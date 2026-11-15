"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { anagramasStatus } from "../view";

export function Archive() {
  return <DayArchive game="Anagramas" path="/juegos/anagramas" status={anagramasStatus} />;
}
