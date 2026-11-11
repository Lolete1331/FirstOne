import type { Metadata } from "next";
import { DictadoActivity } from "./activity";

export const metadata: Metadata = {
  title: "Escribe lo que oyes",
  description: "Dictado con voz: escucha una palabra y escríbela, con ayuda letra a letra.",
  alternates: { canonical: "/lectura/dictado" },
};

export default function Page() {
  return <DictadoActivity />;
}
