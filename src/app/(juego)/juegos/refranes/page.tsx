import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { View } from "./view";

export const metadata: Metadata = {
  title: "Refranes",
  description: "Cada día, cinco refranes españoles a medias. ¿Sabes cómo terminan?",
  alternates: { canonical: "/juegos/refranes" },
};

export default function Page() {
  return (
    <Suspense fallback={<p className="pt-24 text-center text-muted">Cargando…</p>}>
      <View />
    </Suspense>
  );
}
