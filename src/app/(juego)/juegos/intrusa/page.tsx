import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { View } from "./view";

export const metadata: Metadata = {
  title: "La intrusa",
  description: "Cada día, cuatro palabras y una que no encaja. ¿La encuentras?",
  alternates: { canonical: "/juegos/intrusa" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="pt-24 text-center text-muted">Cargando…</p>}>
      <View />
    </Suspense>
  );
}
