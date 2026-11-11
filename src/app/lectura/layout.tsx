import type { Metadata } from "next";
import "@fontsource/lexend/latin-400.css";
import "@fontsource/lexend/latin-700.css";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource/opendyslexic/latin-400.css";
import "@fontsource/opendyslexic/latin-700.css";
import { LecturaShell } from "@/components/lectura/shell";

export const metadata: Metadata = {
  title: { default: "Leer y escribir mejor — actividades para la dislexia", template: "%s · Leer y escribir · FirstOne" },
  description:
    "Actividades gratuitas para niños y niñas con dislexia: sílabas, sonidos, letras que se confunden, ortografía y dictados, con fondo, letra y espaciado adaptables.",
};

export default function LecturaLayout({ children }: { children: React.ReactNode }) {
  return <LecturaShell>{children}</LecturaShell>;
}
