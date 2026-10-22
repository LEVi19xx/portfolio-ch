"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useAccent } from "./accent";

export type V3 = [number, number, number];

export const pointerOn = () => (document.body.style.cursor = "pointer");
export const pointerOff = () => (document.body.style.cursor = "");

// An invisible, clickable volume.
// - In a close-up view (monitor, book, badge, phone) every Hit is switched off unless it is `always`,
//   so nothing floating in front of the screen can steal your click.
// - Click is decided on pointer-up with a forgiving 14px wobble: three.js's own click drops at ~2px.
export function Hit({
  p,
  s,
  onClick,
  onOver,
  onOut,
  off,
  always,
}: {
  p: V3;
  s: V3;
  onClick?: () => void;
  onOver?: () => void;
  onOut?: () => void;
  off?: boolean;
  always?: boolean;
}) {
  const accent = useAccent();
  const downAt = useRef<[number, number] | null>(null);
  return (
    <mesh
      position={p}
      raycast={function (this: THREE.Mesh, rc, hits) {
        if (off || (accent.state.close && !always)) return;
        THREE.Mesh.prototype.raycast.call(this, rc, hits);
      }}
      onPointerDown={(e) => {
        downAt.current = [e.nativeEvent.clientX, e.nativeEvent.clientY];
      }}
      onPointerUp={(e) => {
        const d = downAt.current;
        downAt.current = null;
        if (!d || accent.state.dragging) return;
        if (Math.hypot(e.nativeEvent.clientX - d[0], e.nativeEvent.clientY - d[1]) > 14) return;
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        pointerOn();
        onOver?.();
      }}
      onPointerOut={() => {
        pointerOff();
        onOut?.();
      }}
    >
      <boxGeometry args={s} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
