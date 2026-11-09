"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** false durante el render del servidor y la hidratación; true después. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
