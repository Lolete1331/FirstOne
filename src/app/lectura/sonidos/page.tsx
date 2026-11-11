import type { Metadata } from "next";
import { SonidosActivity } from "./activity";

export const metadata: Metadata = {
  title: "¿Cómo empieza?",
  description: "Actividad de sonidos iniciales para practicar la conciencia fonológica.",
  alternates: { canonical: "/lectura/sonidos" },
};

export default function Page() {
  return <SonidosActivity />;
}
