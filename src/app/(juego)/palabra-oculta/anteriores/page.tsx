import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { ArchiveView } from "./archive-view";

export const metadata: Metadata = {
  title: "La palabra oculta · palabras anteriores",
  description: "Juega las palabras ocultas de días anteriores que te perdiste.",
  alternates: { canonical: "/palabra-oculta/anteriores" },
};

export default function AnterioresPage() {
  return <ArchiveView />;
}
