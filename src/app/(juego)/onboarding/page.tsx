import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Elige tu @usuario", robots: { index: false } };

export default function OnboardingPage() {
  return (
    <div className="max-w-md mx-auto pt-12 sm:pt-20">
      <h1 className="font-display font-black text-3xl sm:text-4xl">
        ¿Cómo te <span className="text-gradient">llamarán</span>?
      </h1>
      <p className="mt-2 text-muted">
        Tu @usuario aparecerá junto a cada palabra que conquistes. Solo podrás cambiarlo una vez.
      </p>
      <Suspense>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}
