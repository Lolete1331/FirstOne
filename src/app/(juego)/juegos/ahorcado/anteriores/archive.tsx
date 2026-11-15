"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { ahorcadoStatus } from "../view";

export function Archive() {
  return <DayArchive game="El ahorcado" path="/juegos/ahorcado" status={ahorcadoStatus} />;
}
