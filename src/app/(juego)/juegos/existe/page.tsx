import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { View } from "./view";

export const metadata: Metadata = {
  title: "¿Existe o no existe?",
  description: "Cada día, diez palabras: unas existen y otras nos las hemos inventado. ¿Sabes distinguirlas?",
  alternates: { canonical: "/juegos/existe" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="pt-24 text-center text-muted">Cargando…</p>}>
      <View />
    </Suspense>
  );
}
