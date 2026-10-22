"use client";

import { createContext, useContext, useEffect, useState } from "react";

// index of the station the camera is parked at, or -1 while flying
export const ActiveContext = createContext(-1);
export const useIsActive = (index: number) => useContext(ActiveContext) === index;

export const accent = (l = 60, a = 1) => `hsl(var(--hue, 212) 100% ${l}% / ${a})`;

// While a modal or palette is open the tunnel ignores wheel, keys and holds.
export function useLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    document.documentElement.dataset.lock = "1";
    return () => {
      delete document.documentElement.dataset.lock;
    };
  }, [locked]);
}

// Counts from 0 to target each time `run` flips to true.
export function useCountUp(target: number, run: boolean, ms = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, target, ms]);
  return run ? value : 0;
}

// Ask the particle field for a shockwave (used on hovers and tab changes).
export const pulseField = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("field-pulse"));
};
