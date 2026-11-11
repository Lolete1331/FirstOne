import { Suspense } from "react";
import { Header, HeaderShell } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

/** Diseño del juego: cabecera, fondo neón y menú inferior. */
export default function JuegoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fo-backdrop" aria-hidden />
      <Suspense fallback={<HeaderShell />}>
        <Header />
      </Suspense>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-28 md:pb-12">{children}</main>
      <Suspense>
        <BottomNav />
      </Suspense>
    </>
  );
}
