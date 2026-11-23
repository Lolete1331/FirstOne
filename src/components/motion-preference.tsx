"use client";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";

/** Si el jugador eligió «Menos movimiento», las animaciones de la web se desactivan. */
export function MotionPreference({ children }: { children: React.ReactNode }) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const check = () => setReduce(document.documentElement.hasAttribute("data-motion"));
    const t = setTimeout(check, 0);
    window.addEventListener("fo-a11y", check);
    return () => {
      clearTimeout(t);
      window.removeEventListener("fo-a11y", check);
    };
  }, []);
  return <MotionConfig reducedMotion={reduce ? "always" : "user"}>{children}</MotionConfig>;
}
