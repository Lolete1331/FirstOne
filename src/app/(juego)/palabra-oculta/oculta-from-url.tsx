"use client";
import { useSearchParams } from "next/navigation";
import { OcultaView } from "./oculta-view";

/** ?dia=AAAA-MM-DD para jugar una palabra anterior. `key` reinicia la partida al cambiar de día. */
export function OcultaFromUrl() {
  const day = useSearchParams().get("dia") ?? undefined;
  return <OcultaView key={day ?? "hoy"} day={day} />;
}
