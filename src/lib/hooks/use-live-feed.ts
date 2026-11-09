"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export type FeedItem = {
  id: number;
  word: string;
  year: number;
  position: number;
  claimed_at: string;
  username: string | null;
  country: string | null;
  /** true si llegó por tiempo real (para animarlo) */
  fresh?: boolean;
};

/**
 * Últimas reclamaciones del mundo: carga inicial por RPC + Supabase Realtime Broadcast
 * (canal público "live-feed", lo emite un trigger en Postgres).
 */
export function useLiveFeed(limit = 30, onlyFirsts = false) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">(
    isSupabaseConfigured ? "connecting" : "offline",
  );
  const [perMinute, setPerMinute] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let cancelled = false;
    const arrivals: number[] = [];

    supabase.rpc("recent_claims", { p_limit: limit, p_only_firsts: onlyFirsts }).then(({ data }) => {
      if (cancelled || !data) return;
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...(data as FeedItem[]).filter((i) => !seen.has(i.id))].slice(0, limit);
      });
    });

    const channel = supabase
      .channel("live-feed")
      .on("broadcast", { event: "claim" }, ({ payload }) => {
        const item = payload as FeedItem;
        if (onlyFirsts && item.position !== 1) return;
        const now = Date.now();
        arrivals.push(now);
        while (arrivals.length && arrivals[0] < now - 60_000) arrivals.shift();
        setPerMinute(arrivals.length);
        setItems((prev) =>
          prev.some((i) => i.id === item.id) ? prev : [{ ...item, fresh: true }, ...prev].slice(0, limit),
        );
      })
      .subscribe((s) => setStatus(s === "SUBSCRIBED" ? "live" : s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "offline" : "connecting"));

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [limit, onlyFirsts]);

  return { items, status, perMinute };
}
