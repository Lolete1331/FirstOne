"use client";
import { DayArchive } from "@/components/juegos/day-archive";
import { sopaStatus } from "../sopa-view";

export function SopaArchive() {
  return <DayArchive game="Sopa de letras" path="/juegos/sopa-de-letras" status={sopaStatus} />;
}
