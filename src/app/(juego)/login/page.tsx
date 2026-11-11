import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto pt-12 sm:pt-20">
      <h1 className="font-display font-black text-3xl sm:text-4xl">
        Entra a la <span className="text-gradient">carrera</span>
      </h1>
      <p className="mt-2 text-muted">Necesitas una cuenta para reclamar palabras y ganar medallas.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
