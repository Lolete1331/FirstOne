import type { Metadata } from "next";
import { LecturaHome } from "./lectura-home";

export const metadata: Metadata = {
  title: { absolute: "Leer y escribir mejor — actividades para niños con dislexia · FirstOne" },
  alternates: { canonical: "/lectura" },
};

export default function LecturaPage() {
  return <LecturaHome />;
}
