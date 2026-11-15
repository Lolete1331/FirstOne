"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { significaStatus } from "../significa-view";

export function SignificaArchive() {
  return <DayArchive game="¿Qué significa?" path="/juegos/que-significa" status={significaStatus} />;
}
