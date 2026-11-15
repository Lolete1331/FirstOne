import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { Archive } from "./archive";

export const metadata: Metadata = {
  title: "El ahorcado · días anteriores",
  alternates: { canonical: "/juegos/ahorcado/anteriores" },
};

export default function Page() {
  return <Archive />;
}
