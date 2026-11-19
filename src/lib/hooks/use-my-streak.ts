"use client";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRpc } from "./use-rpc";

export type Streak = { current: number; best: number; today: boolean; days: number };

/** Avisa a la web de que el jugador acaba de hacer algo que cuenta para la racha. */
export function notifyActivity() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("fo-activity"));
}

/** Racha del jugador conectado (null sin cuenta). Se actualiza sola tras jugar. */
export function useMyStreak() {
  const { profile } = useAuth();
  const rpc = useRpc<Streak | null>("user_streak", profile ? { p_username: profile.username } : null);
  const { reload } = rpc;
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const on = () => {
      clearTimeout(t);
      t = setTimeout(() => reload(), 800); // da tiempo a que se guarde el resultado
    };
    window.addEventListener("fo-activity", on);
    return () => {
      window.removeEventListener("fo-activity", on);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.username]);
  return profile ? rpc.data : null;
}
