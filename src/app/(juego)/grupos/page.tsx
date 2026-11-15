import type { Metadata } from "next";
import { GroupsView } from "./groups-view";

export const metadata: Metadata = {
  title: "Grupos: compite con tu clase, tus amigos o tu familia",
  description: "Crea un grupo en FirstOne y comparte el código: tendréis vuestra propia clasificación de palabras, rachas y juegos.",
  alternates: { canonical: "/grupos" },
};

export default function GruposPage() {
  return <GroupsView />;
}
