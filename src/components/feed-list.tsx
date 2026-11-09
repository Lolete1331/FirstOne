"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { FeedItem } from "@/lib/hooks/use-live-feed";
import { MedalBadge } from "./medal";
import { countryFlag } from "@/lib/countries";
import { timeAgo } from "@/lib/time/year";

/** Re-render periódico para refrescar los "hace X s". */
function useTick(ms = 5000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

export function LiveDot({ status }: { status: "connecting" | "live" | "offline" }) {
  const color = status === "live" ? "bg-lime" : status === "connecting" ? "bg-gold" : "bg-danger";
  return (
    <span className="relative flex size-2.5">
      {status === "live" && <span className={`absolute inset-0 rounded-full ${color} animate-ping opacity-60`} />}
      <span className={`relative size-2.5 rounded-full ${color}`} />
    </span>
  );
}

export function FeedList({ items, big = false }: { items: FeedItem[]; big?: boolean }) {
  useTick();
  if (items.length === 0) {
    return <p className="py-10 text-center text-muted text-sm">Aún no hay palabras… ¡estrena el feed!</p>;
  }
  return (
    <ul className="relative">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={item.fresh ? { opacity: 0, x: -30, scale: 0.9 } : false}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative"
          >
            {item.fresh && (
              <motion.span
                className={`absolute inset-0 rounded-xl ${item.position === 1 ? "bg-gold/25" : "bg-cyan/15"}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.6 }}
              />
            )}
            <div className={`relative flex items-center gap-3 px-2 ${big ? "py-3" : "py-2"} border-b border-line/60`}>
              <span className="w-8 flex justify-center shrink-0">
                {item.position === 1 ? (
                  <MedalBadge />
                ) : (
                  <span className="text-[11px] font-mono text-muted">#{item.position.toLocaleString("es")}</span>
                )}
              </span>
              <Link
                href={`/history?word=${encodeURIComponent(item.word)}`}
                className={`font-display font-bold truncate hover:text-lime transition-colors ${big ? "text-xl sm:text-2xl" : "text-base"} ${item.position === 1 ? "" : "text-text/80"}`}
              >
                {item.word}
              </Link>
              <span className="ml-auto flex items-center gap-2 text-sm text-muted shrink-0">
                <Link href={`/u/${item.username}`} className="hover:text-text truncate max-w-28 sm:max-w-40">
                  {countryFlag(item.country)} @{item.username}
                </Link>
                <span className="font-mono text-[11px] w-16 text-right">{timeAgo(item.claimed_at)}</span>
              </span>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
