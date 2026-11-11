"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useRpc } from "@/lib/hooks/use-rpc";
import { getSupabase } from "@/lib/supabase/client";
import { Empty, PageTitle, Skeleton, YearSelect } from "@/components/ui";
import { MedalBadge } from "@/components/medal";
import { UserLink } from "@/components/user-link";
import { DefinitionButton } from "@/components/definition-button";
import { countryFlag } from "@/lib/countries";
import { currentGameYear, formatClaimDate, formatPreciseTime, formatSinceReset } from "@/lib/time/year";
import { normalizeWord } from "@/lib/words/normalize";

type SearchRow = { word: string; year: number; total: number; owner: string | null; owner_country: string | null; owner_claimed_at: string };
type YearRow = { year: number; total: number; owner: string | null; owner_country: string | null; owner_claimed_at: string; seconds_after_reset: number };
type Claimant = { position: number; username: string | null; country: string | null; claimed_at: string };

export function HistoryView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = params.get("word");
  const [year, setYear] = useState(Number(params.get("year")) || currentGameYear());
  const [query, setQuery] = useState(selected ?? "");
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(normalizeWord(query)), 250);
    return () => clearTimeout(t);
  }, [query]);

  const search = useRpc<SearchRow[]>("search_words", selected ? null : { p_year: year, p_query: debounced, p_limit: 60 });

  const open = (word: string) => router.push(`${pathname}?word=${encodeURIComponent(word)}`);
  const close = () => router.push(pathname);

  return (
    <div>
      <PageTitle kicker="Todas las temporadas" title="Historial">
        Busca una palabra y descubre quién fue el primero en escribirla cada año… y todos los que llegaron después.
      </PageTitle>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const w = normalizeWord(query);
          if (w) open(w);
        }}
        className="mt-6 flex flex-wrap gap-3"
      >
        <div className="flex-1 min-w-0 basis-full sm:basis-auto flex gap-2">
        <div className="flex-1 min-w-0 flex items-center rounded-2xl bg-surface-2 border border-line focus-within:border-lime/70 transition-colors">
          <span className="pl-4 text-muted">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca una palabra…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-0 w-full bg-transparent px-3 py-3 outline-none font-display"
          />
          {query && (
            <button type="button" onClick={() => (setQuery(""), close())} className="pr-4 text-muted hover:text-text">
              ×
            </button>
          )}
        </div>
        <button className="shrink-0 rounded-2xl bg-lime text-bg font-bold px-4 sm:px-5">Ver</button>
        </div>
        {!selected && <YearSelect value={year} onChange={setYear} />}
      </form>

      <AnimatePresence mode="wait">
        {selected ? (
          <WordDetail key={selected} word={selected} onBack={close} />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card mt-5 p-2 sm:p-4">
            <p className="px-2 pb-2 text-xs uppercase tracking-[0.2em] text-muted">
              {debounced ? `Palabras de ${year} que empiezan por “${debounced}”` : `Últimas conquistas de ${year}`}
            </p>
            {search.loading && !search.data ? (
              <Skeleton />
            ) : !search.data?.length ? (
              <Empty>
                No hay palabras reclamadas{debounced ? ` que empiecen por “${debounced}”` : ""} en {year}.
              </Empty>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 [&>*]:min-w-0">
                {search.data.map((r) => (
                  <li key={r.word}>
                    <button onClick={() => open(r.word)} className="w-full flex items-center gap-3 px-2 py-2.5 border-b border-line/60 text-left group">
                      <MedalBadge />
                      <span className="font-display font-bold truncate group-hover:text-lime transition-colors">{r.word}</span>
                      <span className="ml-auto text-sm text-muted truncate">
                        {r.owner ? `${countryFlag(r.owner_country)} @${r.owner}` : "cuenta eliminada"}
                      </span>
                      <span className="text-xs font-mono text-muted w-10 text-right">×{r.total}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WordDetail({ word, onBack }: { word: string; onBack: () => void }) {
  const history = useRpc<YearRow[]>("word_history", { p_word: word });
  const exists = useRpc<boolean>("word_exists", { p_word: word });

  return (
    <motion.div key={word} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
      <button onClick={onBack} className="text-sm text-muted hover:text-text">
        ← Volver
      </button>
      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <h2 className="font-display font-black text-5xl sm:text-7xl tracking-tight break-words">{word}</h2>
        {exists.data !== false && <DefinitionButton word={word} className="mb-2" />}
      </div>
      {exists.data === false && <p className="mt-2 text-danger">Esta palabra no está en el diccionario.</p>}

      {history.loading && !history.data ? (
        <div className="mt-6">
          <Skeleton rows={3} />
        </div>
      ) : !history.data?.length ? (
        exists.data !== false && (
          <div className="card mt-6 p-6 text-center">
            <p className="text-lime font-display font-bold text-xl">✦ Nadie la ha reclamado nunca</p>
            <p className="mt-1 text-muted">
              <Link href="/jugar" className="underline hover:text-lime">
                Sé el primero
              </Link>{" "}
              en la historia de FirstOne.
            </p>
          </div>
        )
      ) : (
        <div className="mt-6 space-y-4">
          {history.data.map((y) => (
            <YearCard key={y.year} word={word} row={y} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function YearCard({ word, row }: { word: string; row: YearRow }) {
  const [open, setOpen] = useState(false);
  const [claimants, setClaimants] = useState<Claimant[]>([]);
  const [loading, setLoading] = useState(false);
  const done = claimants.length >= row.total;

  async function loadMore() {
    setLoading(true);
    const last = claimants.at(-1)?.position ?? 0;
    const { data } = await getSupabase().rpc("word_claimants", { p_word: word, p_year: row.year, p_offset: last, p_limit: 100 });
    setClaimants((c) => [...c, ...((data as Claimant[]) ?? [])]);
    setLoading(false);
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="font-display font-black text-3xl text-muted/60">{row.year}</span>
        <div className="text-right">
          <p className="font-mono font-bold text-xl">{row.total.toLocaleString("es")}</p>
          <p className="text-xs text-muted">{row.total === 1 ? "persona" : "personas"}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <MedalBadge className="size-8 text-sm" />
          <div>
            <UserLink username={row.owner} country={row.owner_country} className="font-display font-bold text-lg" />
            <p className="text-sm text-muted">
              el {formatClaimDate(row.owner_claimed_at, { withYear: true })} ·{" "}
              <span className="font-mono">{formatPreciseTime(row.owner_claimed_at)}</span>
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Conquistada {formatSinceReset(row.seconds_after_reset)} después del reinicio</p>

      {row.total > 1 && (
        <button
          onClick={() => {
            setOpen(!open);
            if (!open && claimants.length === 0) loadMore();
          }}
          className="mt-3 text-sm text-cyan hover:underline"
        >
          {open ? "Ocultar" : `Ver los ${row.total.toLocaleString("es")} que la escribieron`}
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ol className="mt-3 max-h-96 overflow-y-auto pr-1">
              {claimants.map((c) => (
                <li key={c.position} className="flex items-center gap-3 py-1.5 border-b border-line/50 text-sm">
                  <span className="w-14 text-right font-mono text-muted">
                    {c.position === 1 ? <MedalBadge /> : `#${c.position.toLocaleString("es")}`}
                  </span>
                  <UserLink username={c.username} country={c.country} className="truncate" />
                  <span className="ml-auto font-mono text-xs text-muted">{formatClaimDate(c.claimed_at)}</span>
                </li>
              ))}
            </ol>
            {!done && (
              <button onClick={loadMore} disabled={loading} className="mt-2 text-sm text-muted hover:text-text">
                {loading ? "Cargando…" : "Cargar más"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
