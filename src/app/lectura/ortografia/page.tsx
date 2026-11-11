import type { Metadata } from "next";
import { OrtografiaActivity } from "./activity";

export const metadata: Metadata = {
  title: "¿Cómo se escribe?",
  description: "Actividad de ortografía: h, b/v, g/j, ll/y… con explicaciones sencillas.",
  alternates: { canonical: "/lectura/ortografia" },
};

export default function Page() {
  return <OrtografiaActivity />;
}
