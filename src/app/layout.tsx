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

export const metadata: Metadata = {
  title: { default: "FirstOne — sé el primero en escribirla", template: "%s · FirstOne" },
  description:
    "Cada año, cada palabra del español tiene un único dueño: el primero en escribirla. El 1 de enero todo vuelve a empezar.",
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
