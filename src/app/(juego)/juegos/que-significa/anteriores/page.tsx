import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { SignificaArchive } from "./archive";

export const metadata: Metadata = {
  title: "¿Qué significa? · días anteriores",
  alternates: { canonical: "/juegos/que-significa/anteriores" },
};

export default function Page() {
  return <SignificaArchive />;
}
