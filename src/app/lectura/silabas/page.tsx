import type { Metadata } from "next";
import { SilabasActivity } from "./activity";

export const metadata: Metadata = {
  title: "Cuenta las sílabas",
  description: "Actividad para contar las sílabas de las palabras: conciencia fonológica para niños con dislexia.",
  alternates: { canonical: "/lectura/silabas" },
};

export default function Page() {
  return <SilabasActivity />;
}
