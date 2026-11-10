import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk, Unbounded } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Header, HeaderShell } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "latin-ext"], weight: ["400", "700", "900"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin", "latin-ext"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

const DESCRIPTION =
  "FirstOne es un juego online gratuito: cada palabra del español solo puede tener un dueño al año, la primera persona del mundo que la escribe. El 1 de enero a las 00:00 UTC todo se reinicia.";

export const metadata: Metadata = {
  metadataBase: new URL("https://firstone.es"),
  title: { default: "FirstOne — sé el primero en escribir cada palabra del español", template: "%s · FirstOne" },
  description: DESCRIPTION,
  applicationName: "FirstOne",
  keywords: [
    "FirstOne", "juego de palabras", "palabras del español", "juego online gratis", "diccionario",
    "reto", "ser el primero", "carrera de palabras", "juego en español", "vocabulario",
  ],
  authors: [{ name: "Diego y Álex" }],
  creator: "FirstOne",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://firstone.es",
    siteName: "FirstOne",
    title: "FirstOne — cada palabra del español tiene un solo dueño al año",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "FirstOne — cada palabra del español tiene un solo dueño al año",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07060b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${unbounded.variable} ${grotesk.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="fo-backdrop" aria-hidden />
        <AuthProvider>
          <Suspense fallback={<HeaderShell />}>
            <Header />
          </Suspense>
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-28 md:pb-12">{children}</main>
          <Suspense>
            <BottomNav />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
