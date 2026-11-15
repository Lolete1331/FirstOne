import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { SopaView } from "./sopa-view";

export const metadata: Metadata = {
  title: "Sopa de letras del día",
  description: "Cada día, una sopa de letras nueva con un tema distinto. Encuentra todas las palabras y descubre su significado.",
  alternates: { canonical: "/juegos/sopa-de-letras" },
};

export default function SopaPage() {
  return (
    <Suspense fallback={<p className="pt-24 text-center text-muted">Cargando…</p>}>
      <SopaView />
    </Suspense>
  );
}
