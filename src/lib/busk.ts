"use client";

import { useSyncExternalStore } from "react";

// Busking on the music room rug: pick a song, play, and a crowd gathers and drops tips in the guitar case.
export const SONGS = [
  // semitones from middle C, one entry per eighth note (null = rest)
  { name: "CHILL", bpm: 84, steps: [0, 4, 7, 12, 7, 4, 0, null, -3, 4, 9, 12, 9, 4, -3, null, -5, 2, 7, 11, 7, 2, -5, null, -7, 0, 5, 9, 5, 0, 7, null] as (number | null)[] },
  { name: "UPBEAT", bpm: 126, steps: [0, 7, 12, 7, 4, 7, 12, 7, 5, 9, 12, 9, 7, 11, 14, 11, 9, 12, 16, 12, 7, 11, 14, 11, 5, 9, 12, 9, 7, 4, 2, 0] as (number | null)[] },
  { name: "BLUES", bpm: 96, steps: [0, null, 3, 5, 6, 7, null, 3, 0, null, 3, 5, 6, 7, 10, null, 5, null, 8, 10, 11, 12, null, 8, 7, 6, 5, 3, 0, null, 0, null] as (number | null)[] },
];

type Busk = { playing: boolean; song: number; crowd: number; tips: number };
let state: Busk = { playing: false, song: 0, crowd: 0, tips: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<Busk>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const busk = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  setSong: (song: number) => set({ song }),
  toggle: () => set({ playing: !state.playing }),
  stop: () => state.playing && set({ playing: false }),
  setCrowd: (crowd: number) => crowd !== state.crowd && set({ crowd }),
  tip: (n: number) => set({ tips: state.tips + n }),
  reset: () => set({ tips: 0 }),
};

export const useBusk = () => useSyncExternalStore(busk.subscribe, busk.get, busk.get);
