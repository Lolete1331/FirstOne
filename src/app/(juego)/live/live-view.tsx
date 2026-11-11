"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useLiveFeed } from "@/lib/hooks/use-live-feed";
import { FeedList, LiveDot } from "@/components/feed-list";

export function LiveView() {
  const [onlyFirsts, setOnlyFirsts] = useState(false);
  const { items, status, perMinute } = useLiveFeed(60, onlyFirsts);

  return (
    <div className="pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
            <LiveDot status={status} />
            {status === "live" ? "Conectado" : status === "connecting" ? "Conectando…" : "Sin conexión"}
          </p>
          <h1 className="mt-2 font-display font-black text-4xl sm:text-5xl">
            En <span className="text-gradient">vivo</span>
          </h1>
          <p className="mt-1 text-muted">Cada palabra que se escribe en el mundo, al instante.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div key={perMinute} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="card px-4 py-2 text-center">
            <p className="font-mono font-bold text-xl text-lime">{perMinute}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">por minuto</p>
          </motion.div>
          <div className="flex rounded-full bg-surface-2 border border-line p-1 text-sm">
            {[
              [false, "Todas"],
              [true, "Solo 🥇"],
            ].map(([v, label]) => (
              <button
                key={String(v)}
                onClick={() => setOnlyFirsts(v as boolean)}
                className={`px-3 py-1.5 rounded-full transition-colors ${onlyFirsts === v ? "bg-lime text-bg font-bold" : "text-muted"}`}
              >
                {label as string}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="card mt-6 p-2 sm:p-4">
        <FeedList items={items} big />
      </div>
    </div>
  );
}
