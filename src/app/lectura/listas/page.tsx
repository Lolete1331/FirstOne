import type { Metadata } from "next";
import { ListasView } from "./listas-view";

export const metadata: Metadata = {
  title: "Listas de palabras para leer",
  description: "Listas de palabras por niveles, separadas en sílabas y con audio, para practicar la lectura con dislexia.",
  alternates: { canonical: "/lectura/listas" },
};

export default function ListasPage() {
  return <ListasView />;
}
