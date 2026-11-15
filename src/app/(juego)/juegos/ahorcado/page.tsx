import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { View } from "./view";

export const metadata: Metadata = {
  title: "El ahorcado",
  description: "Cada día, tres palabras para adivinar letra a letra, con su tema como pista.",
  alternates: { canonical: "/juegos/ahorcado" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="pt-24 text-center text-muted">Cargando…</p>}>
      <View />
    </Suspense>
  );
}
