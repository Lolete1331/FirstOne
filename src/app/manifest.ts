import type { MetadataRoute } from "next";

/** Permite instalar FirstOne en la pantalla de inicio y abrirla a pantalla completa. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FirstOne",
    short_name: "FirstOne",
    description: "Sé el primero en escribir cada palabra del español. Un solo dueño por palabra y año.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07060b",
    theme_color: "#07060b",
    categories: ["games", "education", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
