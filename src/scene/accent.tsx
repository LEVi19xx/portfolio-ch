"use client";

import { createContext, useContext, useState } from "react";
import * as THREE from "three";

// One shared accent: every glowing part of the room reads from it, and holding the mouse cycles its hue.
export type Accent = {
  basic: THREE.MeshBasicMaterial;
  color: THREE.Color;
  // shared, mutable scene state (read every frame, so it lives outside React state)
  state: {
    hue: number;
    day: boolean; // target
    mood: number; // 0 = night, 1 = day, eased toward the target
    lampOn: boolean;
    lamp: number; // eased 0..1
    yaw: number; // drag-to-look offsets
    pitch: number;
    held: boolean; // pointer held still: recolor
    dragging: boolean;
    close: boolean; // a close-up view is active: only surfaces you can touch are clickable
  };
};

const Ctx = createContext<Accent | null>(null);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [value] = useState<Accent>(() => ({
    basic: new THREE.MeshBasicMaterial({ color: "#46e0ff", toneMapped: false }),
    color: new THREE.Color("#46e0ff"),
    state: { hue: 190, day: false, mood: 0, lampOn: true, lamp: 1, yaw: 0, pitch: 0, held: false, dragging: false, close: false },
  }));
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAccent = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("AccentProvider missing");
  return v;
};
