"use client";
import { notifyActivity } from "@/lib/hooks/use-my-streak";
import { StreakNote } from "@/components/racha/streak";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { countryFlag } from "@/lib/countries";
import { foldWord, MAX_ATTEMPTS, msToNextDay, shareText, type Mark } from "@/lib/oculta/game";
import type { GuessResponse, OcultaState, Row } from "@/lib/oculta/types";
import { emptyLocal, readLocal, writeLocal, type Local } from "@/lib/oculta/local";

/* Paleta «de diccionario»: papel, tinta, dorado y azul tinta. */
const MARK_STYLE: Record<Mark, string> = {
  ok: "mark-ok bg-[#4a8a3c] border-[#4a8a3c] text-white",
  near: "mark-near bg-[#e0b62c] border-[#e0b62c] text-[#2b2622]",
  no: "bg-[#d6ccb6] border-[#d6ccb6] text-[#6b6256]",
};
const KEY_ROWS = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"];

export function OcultaView({ day: askedDay }: { day?: string }) {
  const { user, loading: authLoading } = useAuth();
  const [info, setInfo] = useState<OcultaState | null>(null);
  const [game, setGame] = useState<Local>(emptyLocal);
  const [position, setPosition] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(askedDay ? `/api/oculta?day=${encodeURIComponent(askedDay)}` : "/api/oculta", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as OcultaState;
      setInfo(data);
      if (data.me) {
        setGame({ rows: data.me.rows, hint: data.me.hint, solved: data.me.solved, finished: data.me.finished, reveal: data.me.reveal });
        setPosition(data.me.position);
      } else {
        setGame(readLocal(data.day));
        setPosition(null);
      }
    } catch {
      setError(true);
    }
  }, [askedDay]);

  useEffect(() => {
    if (authLoading) return;
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [authLoading, user?.id, load]);

  const guest = info !== null && info.me === null;
  const length = info?.length ?? 5;

  const update = useCallback(
    (next: Local) => {
      setGame(next);
      if (guest && info) writeLocal(info.day, next);
    },
    [guest, info],
  );

  const flash = (text: string) => {
    setMessage(text);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const send = useCallback(
    async (body: Record<string, unknown>): Promise<GuessResponse | null> => {
      if (!info) return null;
      setBusy(true);
      try {
        const res = await fetch("/api/oculta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day: info.day, used: game.rows.length, ...body }),
        });
        return (await res.json()) as GuessResponse;
      } catch {
        flash("No hay conexión. Inténtalo otra vez.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [info, game.rows.length],
  );

  const submit = useCallback(async () => {
    if (busy || game.finished || !info) return;
    if ([...input].length !== length) return flash(`Tiene que tener ${length} letras`);
    if (game.rows.some((row) => row.guess === input)) return flash("Ya has probado esa palabra");
    const r = await send({ action: "guess", guess: input });
    if (!r) return;
    switch (r.status) {
      case "ok":
        update({ ...game, rows: [...game.rows, { guess: input, marks: r.marks }], solved: r.solved, finished: r.finished, reveal: r.reveal });
        notifyActivity();
        setPosition(r.position);
        setInput("");
        setMessage(null);
        if (!guest) load();
        return;
      case "not_in_dictionary":
        return flash("No está en el diccionario (valen palabras en singular)");
      case "wrong_length":
        return flash(`Tiene que tener ${length} letras`);
      case "repeated":
        return flash("Ya has probado esa palabra");
      case "new_day":
        setInput("");
        setMessage("¡Ya hay palabra nueva!");
        return load();
      case "finished":
        return load();
      default:
        return flash("Algo ha fallado. Inténtalo otra vez.");
    }
  }, [busy, game, info, input, length, send, update, guest, load]);

  const askHint = async () => {
    if (busy || game.hint) return;
    if (!window.confirm("La pista es la definición de la palabra y gasta un intento. ¿La quieres?")) return;
    const r = await send({ action: "hint" });
    if (r?.status === "hint") update({ ...game, hint: r.hint, rows: [...game.rows, { guess: null, marks: null }] });
    else if (r?.status === "no_hint") flash("Hoy no hay pista disponible");
    else if (r) flash("Algo ha fallado. Inténtalo otra vez.");
  };

  const type = useCallback(
    (key: string) => {
      if (game.finished || busy) return;
      setMessage(null);
      if (key === "enter") return void submit();
      if (key === "back") return setInput((s) => [...s].slice(0, -1).join(""));
      const ch = foldWord(key);
      if (/^[a-zñ]$/.test(ch)) setInput((s) => ([...s].length < length ? s + ch : s));
    },
    [game.finished, busy, submit, length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      if (e.key === "Enter") type("enter");
      else if (e.key === "Backspace") type("back");
      else if (e.key.length === 1) type(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type]);

  // Mejor marca de cada letra para colorear el teclado.
  const keyMarks = useMemo(() => {
    const rank: Record<Mark, number> = { ok: 3, near: 2, no: 1 };
    const m = new Map<string, Mark>();
    for (const r of game.rows) {
      if (!r.guess || !r.marks) continue;
      [...r.guess].forEach((ch, i) => {
        const cur = m.get(ch);
        if (!cur || rank[r.marks![i]] > rank[cur]) m.set(ch, r.marks![i]);
      });
    }
    return m;
  }, [game.rows]);

  if (error) {
    return <p className="pt-24 text-center text-muted">No hemos podido cargar el juego. Recarga la página.</p>;
  }

  const rowsToShow: (Row | "input" | "empty")[] = [];
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i < game.rows.length) rowsToShow.push(game.rows[i]);
    else if (i === game.rows.length && !game.finished) rowsToShow.push("input");
    else rowsToShow.push("empty");
  }
  const remaining = MAX_ATTEMPTS - game.rows.length;
  const tries = game.rows.length;

  return (
    <div className="oculta pt-6 pb-4 max-w-xl mx-auto">
      <div className="rounded-3xl border border-[#d9c9a3] bg-[#f7f0e1] text-[#2b2622] shadow-2xl px-4 sm:px-8 py-6">
        <header className="text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a7a5c]">
            {info ? `N.º ${info.number} · ${formatDay(info.day)}${info.today ? "" : " · palabra anterior"}` : " "}
          </p>
          <h1 className="mt-1 font-[family-name:'Cormorant_Garamond'] font-bold text-4xl sm:text-5xl">La palabra oculta</h1>
          <p className="mt-1 font-[family-name:'EB_Garamond'] italic text-[#6b6256]">
            {info ? `Una palabra de ${length} letras · ${MAX_ATTEMPTS} intentos` : "Cargando…"}
          </p>
          {info && !info.today ? (
            <p className="mt-1 text-xs text-[#8a7a5c]">
              Puedes jugarla, pero la clasificación solo cuenta a quien la encontró ese día.{" "}
              <Link href="/palabra-oculta" className="underline">Ir a la de hoy</Link>
            </p>
          ) : (
            !game.finished && <NextWord className="mt-1 text-xs text-[#8a7a5c]" />
          )}
        </header>

        {/* Tablero */}
        <div className={`mt-5 grid gap-1.5 justify-center ${shake ? "oculta-shake" : ""}`} aria-live="polite">
          {rowsToShow.map((row, r) => (
            <div key={r} className="flex gap-1.5 justify-center">
              {row !== "input" && row !== "empty" && row.guess === null ? (
                <div
                  className="flex items-center justify-center rounded-lg border border-dashed border-[#b08a2e] text-[#8a6d22] text-sm font-[family-name:'EB_Garamond'] italic"
                  style={{ width: `calc(${length} * var(--cell) + ${length - 1} * 0.375rem)`, height: "var(--cell)" }}
                >
                  Pista consultada
                </div>
              ) : (
                Array.from({ length }, (_, i) => {
                  const ch = row === "input" ? ([...input][i] ?? "") : row === "empty" ? "" : [...row.guess!][i];
                  const mark = row !== "input" && row !== "empty" ? row.marks?.[i] : undefined;
                  return (
                    <span
                      key={i}
                      className={`grid place-items-center rounded-lg border-2 uppercase font-[family-name:'Cormorant_Garamond'] font-bold text-2xl sm:text-3xl transition-colors ${
                        mark ? MARK_STYLE[mark] : ch ? "border-[#8a7a5c] bg-white/70" : "border-[#e2d6bb] bg-white/40"
                      }`}
                      style={{ width: "var(--cell)", height: "var(--cell)" }}
                    >
                      {ch}
                    </span>
                  );
                })
              )}
            </div>
          ))}
        </div>

        <p className="mt-3 min-h-6 text-center text-sm text-[#8c2f39]">{message}</p>
        {guest && !game.finished && game.rows.length === 0 && (
          <p className="-mt-1 mb-2 text-center text-xs text-[#8a7a5c]">
            Juegas sin cuenta.{" "}
            <Link href={loginHref(info?.today ? undefined : info?.day)} className="underline">Crea una gratis</Link> para salir en la
            clasificación de los primeros.
          </p>
        )}

        {game.hint && (
          <div className="mt-2 rounded-xl border border-[#d9c9a3] bg-white/60 px-4 py-3 font-[family-name:'EB_Garamond']">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#8a7a5c]">Pista · definición</span>
            <p className="mt-1 text-lg leading-snug">{game.hint}</p>
            <p className="mt-1 text-[11px] text-[#8a7a5c]">
              Fuente: Wikcionario (
              <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.es" target="_blank" rel="noopener noreferrer" className="underline">
                CC BY-SA 4.0
              </a>
              )
            </p>
          </div>
        )}

        {game.finished ? (
          <Result
            info={info!}
            game={game}
            tries={tries}
            position={position}
            guest={guest}
          />
        ) : (
          <>
            {/* Teclado */}
            <div className="mt-4 space-y-1.5 select-none">
              {KEY_ROWS.map((keys, i) => (
                <div key={keys} className="flex justify-center gap-1">
                  {i === 2 && <Key label="Enviar" wide onClick={() => type("enter")} disabled={busy} />}
                  {[...keys].map((k) => (
                    <Key key={k} label={k} mark={keyMarks.get(k)} onClick={() => type(k)} />
                  ))}
                  {i === 2 && <Key label="⌫" wide aria="Borrar" onClick={() => type("back")} />}
                </div>
              ))}
            </div>
            {!game.hint && remaining >= 2 && info && (
              <div className="mt-4 text-center">
                <button onClick={askHint} disabled={busy} className="text-sm underline underline-offset-4 text-[#6b6256] hover:text-[#2b2622]">
                  ¿Atascado? Ver la definición (gasta un intento)
                </button>
              </div>
            )}
          </>
        )}

        <details className="mt-6 border-t border-[#e2d6bb] pt-4 font-[family-name:'EB_Garamond'] text-[#4a4239]">
          <summary className="cursor-pointer text-sm uppercase tracking-[0.2em] text-[#8a7a5c]">Cómo se juega</summary>
          <ul className="mt-2 space-y-1.5 text-[17px] leading-snug list-disc pl-5">
            <li>Cada día hay una palabra escondida, la misma para todo el mundo. Cambia cada día a las 00:00 UTC (en España, a la 1:00 en invierno y a las 2:00 en verano).</li>
            <li>
              Escribe palabras del diccionario con el mismo número de letras. Después de cada intento:
              <span className="mark-ok mx-1 inline-block rounded px-1.5 pr-3 bg-[#4a8a3c] text-white">verde</span> letra en su sitio,
              <span className="mark-near mx-1 inline-block rounded px-1.5 pr-3 bg-[#e0b62c] text-[#2b2622]">amarillo</span> está en la palabra pero en otro sitio,
              <span className="mx-1 inline-block rounded px-1.5 bg-[#d6ccb6] text-[#6b6256]">gris</span> no está.
            </li>
            <li>Las tildes no cuentan; la ñ sí es una letra distinta.</li>
            <li>Si te atascas, puedes ver la definición, pero gasta un intento.</li>
            <li>Con tu cuenta, si la encuentras apareces en la clasificación de los primeros del día.</li>
          </ul>
        </details>
      </div>

      {info && <Ranking info={info} />}

      <div className="mt-4 text-center">
        <Link href="/palabra-oculta/anteriores" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-lime/60">
          📚 Palabras anteriores
        </Link>
        <Link href="/juegos" className="ml-2 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-lime/60">
          🎲 Más juegos
        </Link>
      </div>
    </div>
  );
}

function Key({ label, mark, wide, aria, onClick, disabled }: { label: string; mark?: Mark; wide?: boolean; aria?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={aria ?? label}
      onClick={onClick}
      disabled={disabled}
      className={`h-12 rounded-md border text-sm font-bold uppercase transition-colors active:scale-95 ${
        wide ? "px-2.5 text-[11px] sm:px-4" : "w-[8.4%] max-w-10"
      } ${mark ? MARK_STYLE[mark] : "bg-white/80 border-[#d9c9a3] text-[#2b2622] hover:bg-white"}`}
    >
      {label}
    </button>
  );
}

function Result({ info, game, tries, position, guest }: { info: OcultaState; game: Local; tries: number; position: number | null; guest: boolean }) {
  const [copied, setCopied] = useState(false);
  const hints = game.rows.filter((r) => r.guess === null).length;
  const text = shareText(info.day, game.solved ? tries : null, hints);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* compartir cancelado */
    }
  }

  return (
    <div className="mt-4 text-center">
      <p className="font-[family-name:'EB_Garamond'] text-lg">
        {game.solved ? (tries === 1 ? "¡A la primera! Increíble." : `¡La has encontrado en ${tries} intentos!`) : "Esta vez no ha podido ser. La palabra era:"}
      </p>
      {game.reveal && (
        <div className="mt-3 rounded-2xl border border-[#d9c9a3] bg-white/60 px-5 py-4 text-left">
          <p className="text-center font-[family-name:'Cormorant_Garamond'] font-bold text-4xl">{game.reveal.word}</p>
          {game.reveal.senses.length > 0 && (
            <ol className="mt-2 list-decimal pl-5 font-[family-name:'EB_Garamond'] text-[17px] leading-snug space-y-1">
              {game.reveal.senses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-[11px] text-[#8a7a5c]">
            {game.reveal.sourceUrl && (
              <>
                <a href={game.reveal.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Wikcionario
                </a>{" "}
                (CC BY-SA 4.0) ·{" "}
              </>
            )}
            <a href={game.reveal.raeUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Consultar en el diccionario de la RAE
            </a>
          </p>
        </div>
      )}
      {position !== null && (
        <p className="mt-3 font-[family-name:'EB_Garamond'] text-lg">
          {position === 1 ? "🥇 ¡Has sido la primera persona del mundo en encontrarla hoy!" : `Eres la persona n.º ${position} en encontrarla hoy.`}
        </p>
      )}
      {guest && <CreateAccount solved={game.solved} today={info.today} day={info.day} />}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button onClick={share} className="rounded-full bg-[#2b2622] text-[#f7f0e1] font-bold px-6 py-2.5">
          {copied ? "¡Copiado!" : "Compartir resultado"}
        </button>
        <Link href="/jugar" className="rounded-full border border-[#2b2622]/40 px-6 py-2.5 font-bold">
          Ir a conquistar palabras
        </Link>
      </div>
      {!guest && info.today && <StreakNote className="mt-4 text-sm text-[#6b6256]" />}
      {info.today ? <NextWord className={guest ? undefined : "mt-1 text-sm text-[#6b6256]"} /> : (
        <p className="mt-4 text-sm text-[#6b6256]">
          <Link href="/palabra-oculta/anteriores" className="underline">Jugar otra palabra anterior</Link> ·{" "}
          <Link href="/palabra-oculta" className="underline">Ir a la de hoy</Link>
        </p>
      )}
    </div>
  );
}

/** Hora (en el reloj de quien mira) a la que cambia la palabra: las 00:00 UTC. */
function changeTimeLocal(): string {
  const d = new Date();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return next.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

const loginHref = (day?: string) =>
  `/login?next=${encodeURIComponent(day ? `/palabra-oculta?dia=${day}` : "/palabra-oculta")}`;

/** Invitación a crear cuenta al terminar una partida sin cuenta. */
function CreateAccount({ solved, today, day }: { solved: boolean; today: boolean; day: string }) {
  const title = !today
    ? "Guarda todas tus partidas"
    : solved
      ? "¿Quieres salir en la clasificación?"
      : "Vuelve mañana con ventaja";
  const text = !today
    ? "Con una cuenta, tus resultados se guardan en cualquier móvil u ordenador."
    : solved
      ? "Crea tu cuenta y, desde mañana, si la encuentras antes que nadie aparecerás entre los primeros del día."
      : "Crea tu cuenta para competir cada día en la clasificación y guardar tus partidas en cualquier dispositivo.";
  return (
    <div className="mt-5 rounded-2xl border-2 border-[#b08a2e]/60 bg-white/70 px-5 py-4 text-center">
      <p className="font-[family-name:'Cormorant_Garamond'] font-bold text-2xl leading-tight">{title}</p>
      <p className="mt-1 text-sm text-[#4a4239]">{text}</p>
      <Link href={loginHref(today ? undefined : day)} className="mt-3 inline-block rounded-full bg-[#b08a2e] text-white font-bold px-6 py-2.5">
        Crear cuenta gratis
      </Link>
      <p className="mt-2 text-xs text-[#8a7a5c]">Es gratis y se tarda menos de un minuto. Con tu cuenta también puedes conquistar palabras.</p>
    </div>
  );
}

function NextWord({ className = "mt-4 text-sm text-[#6b6256]" }: { className?: string }) {
  const [ms, setMs] = useState<number | null>(null);
  const [at, setAt] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      setMs(msToNextDay());
      setAt(changeTimeLocal());
    };
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  if (ms === null) return null;
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <p className={className}>
      Nueva palabra cada día a las {at} (tu hora) · próxima en{" "}
      <span className="font-mono">{pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}</span>
    </p>
  );
}

function Ranking({ info }: { info: OcultaState }) {
  return (
    <section className="card mt-6 p-5">
      <h2 className="font-display font-bold text-lg">Los primeros en encontrarla {info.today ? "hoy" : `el ${formatDay(info.day)}`}</h2>
      {info.ranking.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          {info.today ? "Nadie la ha encontrado todavía. ¿Serás la primera persona?" : "Nadie la encontró ese día."}
        </p>
      ) : (
        <>
          <ol className="mt-3 space-y-1.5">
            {info.ranking.map((r) => (
              <li key={r.pos} className="flex items-center gap-3 text-sm">
                <span className="w-8 font-mono text-muted">{r.pos === 1 ? "🥇" : `#${r.pos}`}</span>
                <Link href={`/u/${r.username}`} className="font-bold truncate hover:text-lime">
                  {countryFlag(r.country)} @{r.username}
                </Link>
                <span className="ml-auto text-muted whitespace-nowrap">
                  {r.attempts}/{MAX_ATTEMPTS}
                  {r.hints > 0 && " · con pista"} · {new Date(r.solved_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted">
            {info.solvers === 1 ? "1 persona la ha encontrado" : `${info.solvers.toLocaleString("es")} personas la han encontrado`} {info.today ? "hoy" : "ese día"}.
          </p>
        </>
      )}
    </section>
  );
}

function formatDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
