"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

type State<T> = { key: string | null; data: T | null; error: string | null };

/**
 * Llama a una función SQL pública (RPC) y vuelve a llamarla cuando cambian los argumentos.
 * `args = null` desactiva la llamada. Mantiene los datos anteriores mientras carga los nuevos.
 */
export function useRpc<T>(fn: string, args: Record<string, unknown> | null, opts: { refreshMs?: number } = {}) {
  const argsJson = args === null ? null : JSON.stringify(args);
  const key = argsJson === null ? null : `${fn}:${argsJson}`;
  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null });

  const fetchOnce = useCallback(
    async (isActive: () => boolean = () => true) => {
      if (key === null || argsJson === null || !isSupabaseConfigured) return;
      const { data, error } = await getSupabase().rpc(fn, JSON.parse(argsJson));
      if (!isActive()) return; // respuesta de argumentos antiguos
      setState((prev) => ({ key, data: error ? prev.data : (data as T), error: error?.message ?? null }));
    },
    [fn, key, argsJson],
  );

  useEffect(() => {
    let active = true;
    const isActive = () => active;
    const first = setTimeout(() => fetchOnce(isActive), 0);
    const t = opts.refreshMs ? setInterval(() => fetchOnce(isActive), opts.refreshMs) : undefined;
    return () => {
      active = false;
      clearTimeout(first);
      clearInterval(t);
    };
  }, [fetchOnce, opts.refreshMs]);

  const loading = key !== null && isSupabaseConfigured && state.key !== key;
  return { data: state.data, error: state.error, loading, reload: () => fetchOnce() };
}
