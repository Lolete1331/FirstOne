"use client";
import { motion } from "motion/react";

/** Medalla de oro 🥇: se gana siendo la primera persona en escribir una palabra. */
export function Medal({ size = 120, animate = true, label = "1" }: { size?: number; animate?: boolean; label?: string }) {
  return (
    <motion.svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 100 125"
      role="img"
      aria-label="Medalla de oro"
      initial={animate ? { scale: 0, rotate: -40, y: -60 } : false}
      animate={{ scale: 1, rotate: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
    >
      <defs>
        <linearGradient id="medal-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF3C4" />
          <stop offset="0.45" stopColor="#FFC83D" />
          <stop offset="1" stopColor="#C77800" />
        </linearGradient>
        <linearGradient id="medal-ribbon-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF2E88" />
          <stop offset="1" stopColor="#B3125B" />
        </linearGradient>
        <linearGradient id="medal-ribbon-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22E4FF" />
          <stop offset="1" stopColor="#0E8FA8" />
        </linearGradient>
      </defs>
      {/* Cinta */}
      <path d="M28 0 L48 0 L60 48 L42 52 Z" fill="url(#medal-ribbon-a)" />
      <path d="M72 0 L52 0 L40 48 L58 52 Z" fill="url(#medal-ribbon-b)" />
      {/* Disco */}
      <circle cx="50" cy="82" r="38" fill="url(#medal-gold)" />
      <circle cx="50" cy="82" r="30" fill="none" stroke="#FFF3C4" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="3 4" />
      <text
        x="50"
        y="96"
        textAnchor="middle"
        fontFamily="var(--font-unbounded), sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="#7A4A00"
      >
        {label}
      </text>
      {/* Brillo */}
      {animate && (
        <motion.ellipse
          cx="38"
          cy="66"
          rx="9"
          ry="5"
          fill="white"
          fillOpacity="0.6"
          transform="rotate(-35 38 66)"
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

/** Versión mini para listas. */
export function MedalBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Primera persona en escribirla: medalla de oro"
      className={`inline-grid place-items-center size-6 rounded-full bg-gradient-to-br from-[#FFF3C4] via-gold to-[#C77800] text-[11px] font-black text-[#7A4A00] shadow-[0_0_12px_rgb(255_200_61/0.45)] ${className}`}
    >
      1
    </span>
  );
}
