"use client";

import { useSyncExternalStore } from "react";

// The letter on the writing desk: what you type in the panel is what the paper on the desk shows.
export const LETTER_MAX = 700;
type Letter = { name: string; text: string };
let state: Letter = { name: "", text: "" };
const listeners = new Set<() => void>();
const set = (patch: Partial<Letter>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const letter = {
  get: () => state,
  setName: (name: string) => set({ name: name.slice(0, 40) }),
  setText: (text: string) => set({ text: text.slice(0, LETTER_MAX) }),
  clear: () => set({ text: "" }),
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};

export const useLetter = () => useSyncExternalStore(letter.subscribe, letter.get, letter.get);
