import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { SopaArchive } from "./archive";

export const metadata: Metadata = {
  title: "Sopa de letras · días anteriores",
  alternates: { canonical: "/juegos/sopa-de-letras/anteriores" },
};

export default function Page() {
  return <SopaArchive />;
}
