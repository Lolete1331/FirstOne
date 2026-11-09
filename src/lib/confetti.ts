"use client";
import confetti from "canvas-confetti";

/** Explosión de confeti en los colores de FirstOne (medalla incluida). */
export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#FFC83D", "#C6FF3D", "#FF2E88", "#22E4FF", "#FFFFFF"];
  const base = { colors, disableForReducedMotion: true, zIndex: 60 };
  confetti({ ...base, particleCount: 120, spread: 80, startVelocity: 55, origin: { y: 0.55 } });
  setTimeout(() => {
    confetti({ ...base, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    confetti({ ...base, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
  }, 180);
  setTimeout(() => confetti({ ...base, particleCount: 40, spread: 120, scalar: 1.4, shapes: ["star"], origin: { y: 0.4 } }), 420);
  navigator.vibrate?.([30, 40, 60]);
}
