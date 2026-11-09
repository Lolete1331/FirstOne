"use client";
import { useCallback, useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/env";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const s = existing ?? Object.assign(document.createElement("script"), { src: SCRIPT, async: true });
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("turnstile")));
    if (!existing) document.head.appendChild(s);
  });
}

/**
 * Comprobación anti-bots invisible (Cloudflare Turnstile). Solo muestra un reto si
 * Cloudflare sospecha. Devuelve `ensureHuman()`: obtiene un token y lo canjea en
 * /api/verify-human por una cookie de 30 min. Sin clave configurada, no hace nada.
 */
export function useTurnstile() {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const resolver = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    if (TURNSTILE_SITE_KEY) loadScript().catch(() => {});
  }, []);

  const ensureHuman = useCallback(async (): Promise<boolean> => {
    if (!TURNSTILE_SITE_KEY) return true;
    try {
      await loadScript();
    } catch {
      return false;
    }
    const api = window.turnstile!;
    const token = await new Promise<string | null>((resolve) => {
      resolver.current = resolve;
      if (!widget.current && container.current) {
        widget.current = api.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          execution: "execute",
          theme: "dark",
          language: "es",
          callback: (t: string) => resolver.current?.(t),
          "error-callback": () => resolver.current?.(null),
          "timeout-callback": () => resolver.current?.(null),
        });
      } else if (widget.current) {
        api.reset(widget.current);
      }
      if (widget.current) api.execute(widget.current);
      else resolve(null);
    });
    resolver.current = null;
    if (!token) return false;
    const res = await fetch("/api/verify-human", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return res.ok;
  }, []);

  const element = <div ref={container} className="flex justify-center empty:hidden" />;
  return { ensureHuman, element };
}
