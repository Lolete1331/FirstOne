import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { SignificaView } from "./significa-view";

export const metadata: Metadata = {
  title: "¿Qué significa? · palabras curiosas del español",
  description: "Cada día, cinco palabras curiosas del español y tres definiciones. ¿Sabes cuál es la buena?",
  alternates: { canonical: "/juegos/que-significa" },
};

export default function QueSignificaPage() {
  return <SignificaView />;
}
