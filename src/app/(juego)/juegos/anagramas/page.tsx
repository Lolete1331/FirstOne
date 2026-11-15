import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { View } from "./view";

export const metadata: Metadata = {
  title: "Anagramas del día",
  description: "Cada día, siete letras. ¿Cuántas palabras del español eres capaz de formar con ellas?",
  alternates: { canonical: "/juegos/anagramas" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="pt-24 text-center text-muted">Cargando…</p>}>
      <View />
    </Suspense>
  );
}
