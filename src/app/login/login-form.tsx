"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { getSupabase } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(params.get("error") ? "error" : "idle");
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function withEmail(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await getSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setState(error ? "error" : "sent");
  }

  async function withCode(e: FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setCodeError(false);
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data.user) {
      setVerifying(false);
      setCodeError(true);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    // Navegación completa para que el servidor vea la cookie de sesión nueva.
    window.location.assign(profile ? next : `/onboarding?next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  async function withGoogle() {
    await getSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  }

  if (state === "sent") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mt-8 text-center">
        <p className="text-4xl">📬</p>
        <p className="mt-2 font-display font-bold text-xl">Mira tu correo</p>
        <p className="mt-1 text-muted">
          Te hemos enviado un código a <b className="text-text">{email}</b>. Escríbelo aquí o pulsa el enlace del correo.
        </p>
        <form onSubmit={withCode} className="mt-5 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="código"
            aria-label="Código del correo"
            className="w-full text-center font-mono text-3xl tracking-[0.4em] rounded-2xl bg-surface-2 border border-line px-4 py-3 outline-none focus:border-lime/70"
          />
          <button
            disabled={code.length < 6 || verifying}
            className="w-full rounded-2xl bg-lime text-bg font-bold py-3.5 disabled:opacity-40 glow-lime"
          >
            {verifying ? "Comprobando…" : "Entrar"}
          </button>
          {codeError && <p className="text-danger text-sm">Código incorrecto o caducado.</p>}
        </form>
      </motion.div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <button
        onClick={withGoogle}
        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-text text-bg font-bold py-3.5 hover:bg-lime transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continuar con Google
      </button>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> o con tu email <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={withEmail} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          className="w-full rounded-2xl bg-surface-2 border border-line px-4 py-3.5 outline-none focus:border-lime/70 transition-colors"
        />
        <button
          disabled={state === "sending"}
          className="w-full rounded-2xl bg-lime text-bg font-bold py-3.5 disabled:opacity-50 glow-lime"
        >
          {state === "sending" ? "Enviando…" : "Enviarme un código"}
        </button>
      </form>
      {state === "error" && <p className="text-danger text-sm">No hemos podido iniciar sesión. Inténtalo de nuevo.</p>}
    </div>
  );
}
