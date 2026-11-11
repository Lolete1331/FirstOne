"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import type { DefinitionResult } from "@/lib/words/definitions";
import { useHydrated } from "@/lib/hooks/use-hydrated";

const cache = new Map<string, DefinitionResult>();

/** Botón «📖 Significado» que abre una hoja con la definición de la palabra. */
export function DefinitionButton({ word, variant = "pill", className = "" }: { word: string; variant?: "pill" | "icon"; className?: string }) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Ver el significado de ${word}`}
        className={
          variant === "icon"
            ? `inline-grid place-items-center size-7 rounded-full bg-surface-2 border border-line hover:border-cyan/60 text-sm ${className}`
            : `inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 text-cyan px-3.5 py-1.5 text-sm font-bold hover:bg-cyan/20 transition-colors ${className}`
        }
      >
        📖{variant === "pill" && <span>Significado</span>}
      </button>
      {hydrated &&
        createPortal(<AnimatePresence>{open && <DefinitionSheet word={word} onClose={() => setOpen(false)} />}</AnimatePresence>, document.body)}
    </>
  );
}

function DefinitionSheet({ word, onClose }: { word: string; onClose: () => void }) {
  const [data, setData] = useState<DefinitionResult | "error" | null>(cache.get(word) ?? null);

  useEffect(() => {
    if (cache.has(word)) return;
    let alive = true;
    fetch(`/api/define?word=${encodeURIComponent(word)}`)
      .then((r) => (r.ok ? (r.json() as Promise<DefinitionResult>) : Promise.reject()))
      .then((d) => {
        cache.set(word, d);
        if (alive) setData(d);
      })
      .catch(() => alive && setData("error")); // los errores no se guardan: se reintenta al reabrir
    return () => {
      alive = false;
    };
  }, [word]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rae = `https://dle.rae.es/${encodeURIComponent(word)}`;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Significado de ${word}`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-bg/70 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="w-full sm:max-w-lg max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-line bg-surface p-6 pb-8 text-left"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">📖 Significado</p>
            <h2 className="mt-1 font-display font-black text-3xl sm:text-4xl break-words">{word}</h2>
            {data && data !== "error" && data.note && <p className="mt-1 text-sm text-muted">{data.note}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-2xl text-muted hover:text-text leading-none">
            ×
          </button>
        </div>

        <div className="mt-5">
          {data === null ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 rounded bg-surface-2 animate-pulse" style={{ width: `${90 - i * 15}%` }} />
              ))}
            </div>
          ) : data === "error" ? (
            <p className="text-muted">
              No hemos podido cargar la definición ahora mismo. Inténtalo en un momento o consúltala en el diccionario de la RAE.
            </p>
          ) : data.groups.length === 0 ? (
            <p className="text-muted">
              Todavía no tenemos la definición de esta palabra. Puedes consultarla en el diccionario de la RAE.
            </p>
          ) : (
            <div className="space-y-5">
              {data.groups.map((g, gi) => (
                <section key={gi}>
                  <p className="text-xs font-bold uppercase tracking-wider text-lime/90">{g.pos}</p>
                  <ol className="mt-2 space-y-2.5">
                    {g.senses.map((s) => (
                      <li key={s.n} className="flex gap-3">
                        <span className="font-mono text-sm text-muted w-5 shrink-0 pt-0.5">{s.n}.</span>
                        <span className="leading-relaxed">
                          {s.fields.length > 0 && (
                            <span className="mr-1.5 inline-block rounded-full bg-surface-2 border border-line px-2 py-0.5 text-[11px] text-muted align-middle">
                              {s.fields.join(" · ")}
                            </span>
                          )}
                          {s.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={rae}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-text text-bg font-bold px-4 py-2 text-sm hover:bg-lime transition-colors"
          >
            Ver en el diccionario de la RAE ↗
          </a>
          {data && data !== "error" && data.sourceUrl && (
            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-text underline">
              Definición: Wikcionario (CC BY-SA 4.0)
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
