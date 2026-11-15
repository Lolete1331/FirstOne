import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import { Archive } from "./archive";

export const metadata: Metadata = {
  title: "¿B o V? · días anteriores",
  alternates: { canonical: "/juegos/b-o-v/anteriores" },
};

export default function Page() {
  return <Archive />;
}
