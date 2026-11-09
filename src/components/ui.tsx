"use client";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useRpc } from "@/lib/hooks/use-rpc";

export function PageTitle({ kicker, title, accent, children }: { kicker?: string; title: string; accent?: string; children?: ReactNode }) {
  return (
    <div className="pt-8">
      {kicker && <p className="text-xs uppercase tracking-[0.2em] text-muted">{kicker}</p>}
      <h1 className="mt-2 font-display font-black text-4xl sm:text-5xl tracking-tight">
        {title} {accent && <span className="text-gradient">{accent}</span>}
      </h1>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex rounded-full bg-surface-2 border border-line p-1 text-sm">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className="relative px-4 py-1.5 rounded-full">
          {value === v && <motion.span layoutId={`tabs-${options.map((o) => o[0]).join()}`} className="absolute inset-0 rounded-full bg-lime" />}
          <span className={`relative ${value === v ? "text-bg font-bold" : "text-muted"}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Selector de año con los años que tienen datos (más el actual). */
export function YearSelect({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  const { data } = useRpc<{ year: number }[]>("available_years", {});
  const years = data?.map((d) => d.year) ?? [value];
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Año"
      className="rounded-full bg-surface-2 border border-line px-4 py-2 text-sm font-mono outline-none focus:border-lime/70"
    >
      {(years.includes(value) ? years : [value, ...years]).map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 rounded-xl bg-surface-2/60 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-12 text-center text-muted">{children}</p>;
}

/** Número que "cuenta" hasta su valor. */
export function BigNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  return (
    <motion.span key={value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums">
      {value.toLocaleString("es", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </motion.span>
  );
}
