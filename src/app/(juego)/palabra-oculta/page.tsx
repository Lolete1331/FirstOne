import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { OcultaView } from "./oculta-view";

export const metadata: Metadata = {
  title: "La palabra oculta",
  description: "Cada día, una palabra del español escondida. Tienes seis intentos para encontrarla. ¿Serás de los primeros?",
  alternates: { canonical: "/palabra-oculta" },
  // En pruebas: no aparece en buscadores hasta que se anuncie.
  robots: { index: false, follow: false },
};

export default function PalabraOcultaPage() {
  return <OcultaView />;
}
