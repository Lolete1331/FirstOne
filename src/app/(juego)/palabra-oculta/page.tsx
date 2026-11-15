import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { OcultaFromUrl } from "./oculta-from-url";

export const metadata: Metadata = {
  title: "La palabra oculta",
  description: "Cada día, una palabra del español escondida. Tienes seis intentos para encontrarla. ¿Serás de los primeros?",
  alternates: { canonical: "/palabra-oculta" },
};

export default function PalabraOcultaPage() {
  return (
    <Suspense fallback={<p className="pt-24 text-center text-muted">Cargando…</p>}>
      <OcultaFromUrl />
    </Suspense>
  );
}
