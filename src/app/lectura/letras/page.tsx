import type { Metadata } from "next";
import { LetrasActivity } from "./activity";

export const metadata: Metadata = {
  title: "b, d, p, q: letras que se confunden",
  description: "Actividad para distinguir las letras b, d, p y q, que se confunden a menudo con dislexia.",
  alternates: { canonical: "/lectura/letras" },
};

export default function Page() {
  return <LetrasActivity />;
}
