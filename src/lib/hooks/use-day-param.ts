"use client";
import { useSearchParams } from "next/navigation";
import { isPlayableDay } from "@/lib/oculta/game";

/** ?dia=AAAA-MM-DD válido (un día anterior que se puede jugar) o undefined = hoy. */
export function useDayParam(): string | undefined {
  const d = useSearchParams().get("dia");
  return d && isPlayableDay(d) ? d : undefined;
}
