"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useAuth } from "./auth-provider";
import { useTurnstile } from "./turnstile";
import { Medal } from "./medal";
import { celebrate } from "@/lib/confetti";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { MAX_WORD_LENGTH, normalizeWord } from "@/lib/words/normalize";
import { formatClaimDate, formatPreciseTime } from "@/lib/time/year";
import { UserLink } from "./user-link";
import type { ClaimResponse } from "@/lib/claim-types";

type Hint = { word: string; exists: boolean; total: number; owner: string | null };


/** Solo letras del español; el resto se descarta al teclear. */
const sanitize = (v: string) => normalizeWord(v).replace(/[^a-záéíóúüñ]/g, "").slice(0, MAX_WORD_LENGTH);

/** Tamaño de letra según la longitud: grande siempre, pero que quepa en móvil. */
function fontSizeFor(len: number) {
  if (len <= 6) return "clamp(3rem, 15vw, 7.5rem)";
  if (len <= 10) return "clamp(2.4rem, 10vw, 6rem)";
  if (len <= 15) return "clamp(1.8rem, 7vw, 4.5rem)";
  return "clamp(1.3rem, 5vw, 3.2rem)";
}

const fmt = (n: number) => n.toLocaleString("es");

export function ClaimBox() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { ensureHuman, element: turnstile } = useTurnstile();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ClaimResponse | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  // Pista en vivo mientras escribes (con retardo para no saturar).
  useEffect(() => {
    if (!isSupabaseConfigured || value.length < 1) return; // la pista antigua se oculta sola (hint.word !== value)
    const t = setTimeout(async () => {
      const { data } = await getSupabase().rpc("word_status", { p_word: value });
      if (data && (data as Hint).word === value) setHint(data as Hint);
    }, 280);
    return () => clearTimeout(t);
  }, [value]);

  const submit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const word = sanitize(value);
      if (!word || sending) return;
      if (!user) return router.push("/login?next=/");
      if (!profile) return router.push("/onboarding?next=/");

      setSending(true);
      try {
        const send = () =>
          fetch("/api/claim", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ word }),
          }).then((r) => r.json() as Promise<ClaimResponse>);

        let res = await send();
        if (res.status === "human_required") {
          res = (await ensureHuman()) ? await send() : { status: "human_required" };
        }
        setResult({ ...res, word: res.word ?? word });
        if (res.status === "won") celebrate();
        if (res.status === "invalid") {
          navigator.vibrate?.(80);
          shake.start({ x: [0, -14, 12, -8, 6, 0], transition: { duration: 0.4 } });
        } else {
          setValue("");
        }
      } catch {
        setResult({ status: "error", word, message: "Sin conexión. Inténtalo de nuevo." });
      } finally {
        setSending(false);
      }
    },
    [value, sending, user, profile, router, ensureHuman, shake],
  );

  const chars = [...value];
  const fontSize = fontSizeFor(chars.length);

  return (
    <div className="w-full">
      <form onSubmit={submit} className="relative">
        <motion.div animate={shake} className="relative">
          <label htmlFor="word" className="sr-only">
            Escribe una palabra para reclamarla
          </label>
          {/* Capa visible: letras animadas */}
          <div
            aria-hidden
            className="pointer-events-none select-none text-center font-display font-black leading-[1.15] tracking-tight whitespace-pre min-h-[1.2em] py-2"
            style={{ fontSize }}
          >
            {chars.length === 0 ? (
              <span className="text-muted/30">
                escribe<span className="fo-caret text-lime">|</span>
              </span>
            ) : (
              chars.map((c, i) => (
                <motion.span
                  key={`${i}-${c}`}
                  className={`inline-block ${hint?.word === value && hint.exists && hint.total === 0 ? "text-gradient fo-shine" : ""}`}
                  initial={{ y: "0.5em", opacity: 0, scale: 0.4, rotate: -12 }}
                  animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 22 }}
                >
                  {c}
                </motion.span>
              ))
            )}
          </div>
          {/* Campo real (texto transparente encima, conserva el cursor) */}
          <input
            ref={inputRef}
            id="word"
            name="word"
            value={value}
            onChange={(e) => setValue(sanitize(e.target.value))}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="send"
            inputMode="text"
            maxLength={MAX_WORD_LENGTH}
            className="absolute inset-0 w-full bg-transparent text-center font-display font-black leading-[1.15] tracking-tight text-transparent caret-lime outline-none py-2"
            style={{ fontSize }}
          />
        </motion.div>

        {/* Pista: libre / con dueño / no existe */}
        <div className="h-8 flex items-center justify-center text-sm">
          <AnimatePresence mode="wait">
            {hint && hint.word === value && (
              <motion.p
                key={`${hint.exists}-${hint.owner}-${hint.total}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2"
              >
                {!hint.exists ? (
                  <span className="text-danger/90">✗ no está en el diccionario</span>
                ) : hint.total > 0 ? (
                  <span className="text-muted">
                    👑 de <b className="text-text">{hint.owner ? `@${hint.owner}` : "cuenta eliminada"}</b> · {fmt(hint.total)}{" "}
                    {hint.total === 1 ? "persona" : "personas"}
                  </span>
                ) : (
                  <span className="text-lime font-bold tracking-wide">✦ ¡LIBRE! nadie la tiene este año</span>
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center mt-2">
          <motion.button
            type="submit"
            disabled={!value || sending || loading}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            className="relative rounded-full bg-lime text-bg font-display font-black text-lg sm:text-xl px-10 py-4 glow-lime disabled:opacity-30 disabled:shadow-none transition-opacity"
          >
            {sending ? "Reclamando…" : "¡Es mía!"}
          </motion.button>
        </div>
        {turnstile}
      </form>

      {/* El resultado ocupa la pantalla: es el momento emocionante del juego */}
      <AnimatePresence>
        {result && (
          <ResultOverlay
            key={`${result.word}-${result.status}-${result.position}`}
            r={result}
            onClose={() => {
              setResult(null);
              inputRef.current?.focus();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultOverlay({ r, onClose }: { r: ClaimResponse; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "Enter") && onClose();
    // Pequeño retardo: el Enter que envió la palabra no debe cerrar el resultado.
    const t = setTimeout(() => window.addEventListener("keydown", onKey), 400);
    (document.activeElement as HTMLElement | null)?.blur(); // baja el teclado en móvil
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-bg/75 backdrop-blur-md p-4"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
        <ResultCard r={r} onClose={onClose} />
        <button onClick={onClose} className="mt-4 w-full text-center text-sm text-muted hover:text-text">
          Toca para seguir jugando
        </button>
      </div>
    </motion.div>
  );
}

function ResultCard({ r, onClose }: { r: ClaimResponse; onClose: () => void }) {
  const enter = { initial: { opacity: 0, y: 30, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -20, scale: 0.97 } };

  const shell = (accent: string, children: React.ReactNode) => (
    <motion.div {...enter} transition={{ type: "spring", stiffness: 300, damping: 24 }} className={`card relative p-6 sm:p-8 text-center overflow-hidden ${accent}`}>
      <button onClick={onClose} aria-label="Cerrar" className="absolute top-3 right-4 text-muted hover:text-text text-xl">
        ×
      </button>
      {children}
    </motion.div>
  );

  const ownerLine = r.owner && (
    <>
      Ya es de <UserLink username={r.owner.username} country={r.owner.country} className="font-bold text-text" /> desde el{" "}
      {formatClaimDate(r.owner.claimed_at)}
    </>
  );

  switch (r.status) {
    case "won":
      return shell(
        "border-gold/50 shadow-[0_0_80px_rgb(255_200_61/0.25)]",
        <>
          <div className="flex justify-center -mt-2 mb-2">
            <Medal size={110} />
          </div>
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 12 }}
            className="font-display font-black text-3xl sm:text-5xl text-gold"
          >
            ¡Eres el primero!
          </motion.p>
          <p className="mt-3 text-lg">
            <b className="font-display text-2xl">{r.word}</b> es tuya durante todo {r.year}.
          </p>
          <p className="mt-2 text-sm text-muted font-mono">Reclamada a las {r.claimed_at && formatPreciseTime(r.claimed_at)}</p>
        </>,
      );
    case "joined":
      return shell(
        "border-cyan/30",
        <>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan">Llegaste tarde… pero quedas en el historial</p>
          <p className="mt-3 font-display font-black text-5xl sm:text-6xl">
            #{fmt(r.position ?? 0)}
          </p>
          <p className="mt-1 text-muted">
            de {fmt(r.total ?? r.position ?? 0)} en escribir <b className="text-text">{r.word}</b> este año
          </p>
          <p className="mt-4 text-base">{ownerLine}</p>
        </>,
      );
    case "already_yours":
      return shell(
        r.position === 1 ? "border-gold/40" : "border-line",
        <>
          {r.position === 1 ? (
            <>
              <div className="flex justify-center mb-2">
                <Medal size={56} animate={false} />
              </div>
              <p className="font-display font-black text-2xl">Ya es tuya 🥇</p>
              <p className="mt-2 text-muted">
                Reclamaste <b className="text-text">{r.word}</b> el {r.claimed_at && formatClaimDate(r.claimed_at)}
              </p>
            </>
          ) : (
            <>
              <p className="font-display font-black text-2xl">Ya la habías mandado</p>
              <p className="mt-2 text-muted">
                Eres el <b className="text-text">#{fmt(r.position ?? 0)}</b> en <b className="text-text">{r.word}</b>. {ownerLine}
              </p>
            </>
          )}
        </>,
      );
    case "invalid":
      return shell(
        "border-danger/40",
        <>
          <p className="text-4xl mb-2">📕</p>
          <p className="font-display font-black text-xl sm:text-2xl">Esa palabra no está en el diccionario de la RAE</p>
          <p className="mt-2 text-sm text-muted">
            Valen los lemas del diccionario en singular, en masculino o femenino: <i>abogado</i>, <i>abogada</i>… pero no{" "}
            <i>abogados</i>.
          </p>
        </>,
      );
    case "rate_limited":
      return shell(
        "border-pink/40",
        <>
          <p className="text-4xl mb-2">🔥</p>
          <p className="font-display font-black text-2xl">¡Frena, máquina!</p>
          <p className="mt-2 text-muted">Máximo 10 palabras por minuto. Respira y vuelve en unos segundos.</p>
        </>,
      );
    case "human_required":
      return shell("border-pink/40", <p className="text-muted">No hemos podido comprobar que eres humano. Recarga la página e inténtalo de nuevo.</p>);
    default:
      return shell("border-danger/40", <p className="text-muted">{r.message ?? "Algo ha fallado. Inténtalo de nuevo."}</p>);
  }
}
