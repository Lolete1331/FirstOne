import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { Archive } from "./archive";

export const metadata: Metadata = {
  title: "La intrusa · días anteriores",
  alternates: { canonical: "/juegos/intrusa/anteriores" },
};

export default function Page() {
  return <Archive />;
}
