"use client";

import { RoundedBox } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAccent } from "./accent";
import { canvasTexture, plankTexture, skyDayTexture, skyTexture } from "./textures";

import type { V3 } from "./Hit";
export type { V3 };

// small deterministic random so the books and skyline are the same every load
function makeRng(seed: number) {
  let v = seed;
  return () => ((v = (v * 9301 + 49297) % 233280) / 233280);
}

// Rounded, shadow-casting block: the room's basic building material
export function B({
  p,
  s,
  c = "#222",
  r = 0.015,
  rough = 0.75,
  metal = 0,
  rot,
  cast = true,
}: {
  p: V3;
  s: V3;
  c?: string;
  r?: number;
  rough?: number;
  metal?: number;
  rot?: V3;
  cast?: boolean;
}) {
  return (
    <RoundedBox args={s} radius={Math.min(r, s[0] / 2, s[1] / 2, s[2] / 2)} smoothness={3} position={p} rotation={rot} castShadow={cast} receiveShadow>
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </RoundedBox>
  );
}

// Self-lit block that blooms (LED strips, screens)
export function Lit({ p, s, c, rot }: { p: V3; s: V3; c: string; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot}>
      <boxGeometry args={s} />
      <meshBasicMaterial color={c} toneMapped={false} />
    </mesh>
  );
}

export function Plant({ p, scale = 1 }: { p: V3; scale?: number }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2 + (i % 2) * 0.3;
        const tilt = 0.5 + ((i * 37) % 10) / 22;
        return { a, tilt, h: 0.5 + ((i * 53) % 10) / 20 };
      }),
    [],
  );
  return (
    <group position={p} scale={scale}>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.34, 24]} />
        <meshStandardMaterial color="#d9d4cc" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.185, 0.185, 0.02, 24]} />
        <meshStandardMaterial color="#2a2018" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh
          key={i}
          position={[Math.cos(l.a) * 0.13 * l.tilt, 0.33 + l.h * 0.5, Math.sin(l.a) * 0.13 * l.tilt]}
          rotation={[Math.sin(l.a) * l.tilt, 0, -Math.cos(l.a) * l.tilt]}
          scale={[0.09, l.h, 0.04]}
          castShadow
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={i % 3 ? "#2f6b57" : "#3b8068"} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Books() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const palette = ["#d9d4cc", "#8fa5c9", "#c46b5a", "#e0b25a", "#4d6a8f", "#3d4660", "#b9c4d8", "#6f9b8a"];
    const out: { z: number; y: number; w: number; h: number; c: string; lean: number }[] = [];
    const levels = [0.07, 0.77, 1.47];
    const rnd = makeRng(7);
    for (const y of levels) {
      let z = 1.64;
      while (z < 3.1) {
        const w = 0.04 + rnd() * 0.05;
        const h = 0.3 + rnd() * 0.28;
        const lean = rnd() > 0.93 ? 0.25 : 0;
        out.push({ z: z + w / 2, y: y + h / 2, w, h, c: palette[Math.floor(rnd() * palette.length)], lean });
        z += w + 0.004 + (rnd() > 0.9 ? 0.18 : 0);
      }
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((b, i) => {
      o.position.set(-3.3, b.y, b.z);
      o.rotation.set(b.lean, 0, 0);
      o.scale.set(0.24, b.h, b.w);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(b.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

function City() {
  const wins = useRef<THREE.InstancedMesh>(null);
  const { buildings, windows } = useMemo(() => {
    const rnd = makeRng(11);
    const b: { x: number; z: number; w: number; d: number; h: number }[] = [];
    const w: { x: number; y: number; z: number; lit: number }[] = [];
    for (let z = -13; z < 13; z += 1.9) {
      const d = 1.3 + rnd() * 1.1;
      const wd = 1.2 + rnd() * 1.4;
      const h = 2.4 + rnd() * 4.6;
      const x = -7 - rnd() * 3.5;
      b.push({ x, z: z + d / 2, w: wd, d, h });
      const face = x + wd / 2 + 0.01;
      for (let cz = 0.25; cz < d - 0.15; cz += 0.34)
        for (let cy = 0.5; cy < h - 0.3; cy += 0.52)
          if (Math.abs(z + cz) < 8) w.push({ x: face, y: cy, z: z + cz, lit: rnd() });
    }
    return { buildings: b, windows: w };
  }, []);
  useLayoutEffect(() => {
    const m = wins.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    windows.forEach((w, i) => {
      o.position.set(w.x, w.y, w.z);
      o.rotation.set(0, Math.PI / 2, 0);
      const on = w.lit > 0.45;
      o.scale.setScalar(on ? 1 : 0.0001);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(w.lit > 0.8 ? "#ffe9b0" : w.lit > 0.6 ? "#ffc577" : "#ff9f5a"));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [windows]);
  const sky = useMemo(() => skyTexture(), []);
  const skyDay = useMemo(() => skyDayTexture(), []);
  const accent = useAccent();
  const dayDome = useRef<THREE.MeshBasicMaterial>(null);
  const winMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const m = accent.state.mood;
    if (dayDome.current) dayDome.current.opacity = m;
    if (winMat.current) winMat.current.opacity = 1 - m * 0.92;
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[95, 32, 24]} />
        <meshBasicMaterial map={sky} side={THREE.BackSide} toneMapped={false} fog={false} depthWrite={false} />
      </mesh>
      <mesh renderOrder={1}>
        <sphereGeometry args={[94, 32, 24]} />
        <meshBasicMaterial ref={dayDome} map={skyDay} side={THREE.BackSide} toneMapped={false} fog={false} depthWrite={false} transparent opacity={0} />
      </mesh>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 1.5, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={i % 3 ? "#4a4068" : "#5a4a74"} roughness={1} emissive="#2a1f40" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <instancedMesh ref={wins} args={[undefined, undefined, windows.length]} position={[0, -1.5, 0]}>
        <planeGeometry args={[0.2, 0.28]} />
        <meshBasicMaterial ref={winMat} toneMapped={false} transparent />
      </instancedMesh>
    </group>
  );
}

function Poster({ p }: { p: V3 }) {
  const map = useMemo(
    () =>
      canvasTexture(256, 340, (c, w, h) => {
        c.fillStyle = "#e9e4da";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#1b2038";
        c.fillRect(24, 24, w - 48, h - 48);
        c.fillStyle = "#f2b27a";
        c.beginPath();
        c.arc(128, 130, 54, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#46e0ff";
        c.fillRect(24, 200, w - 48, 6);
        c.fillStyle = "#e9e4da";
        c.fillRect(24, 220, 110, 6);
        c.fillRect(24, 236, 70, 6);
      }),
    [],
  );
  return (
    <group position={p}>
      <B p={[0, 0, 0]} s={[0.66, 0.86, 0.03]} c="#0c0e15" />
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.56, 0.76]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function Room() {
  const planks = useMemo(() => plankTexture(), []);
  const keys = useMemo(
    () =>
      canvasTexture(512, 160, (c, w, h) => {
        c.fillStyle = "#171a24";
        c.fillRect(0, 0, w, h);
        for (let r = 0; r < 5; r++)
          for (let k = 0; k < 15; k++) {
            c.fillStyle = (r + k) % 7 === 0 ? "#46e0ff" : "#2c3142";
            c.fillRect(10 + k * 33.2, 12 + r * 28, 29, 24);
          }
      }),
    [],
  );
  const dots = useMemo(
    () =>
      canvasTexture(512, 224, (c, w, h) => {
        c.fillStyle = "#0e1220";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#222a42";
        for (let y = 8; y < h; y += 14) for (let x = 8; x < w; x += 14) c.fillRect(x, y, 2.4, 2.4);
      }),
    [],
  );
  const wall = "#343a4e";
  const dark = "#10121a";

  return (
    <group>
      {/* floor */}
      <B p={[0, -0.15, 0]} s={[7.5, 0.3, 7.5]} c="#14161d" r={0.04} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={planks} roughness={0.55} metalness={0.05} />
      </mesh>
      <B p={[0.3, 0.02, 0.6]} s={[3.8, 0.03, 2.8]} c="#222738" r={0.012} rough={1} />
      <B p={[0.3, 0.04, 0.6]} s={[3.5, 0.006, 2.5]} c="#2f3652" r={0.003} rough={1} />

      {/* right wall (back) */}
      <B p={[-0.05, 1.8, -3.6]} s={[7.5, 3.6, 0.2]} c={wall} rough={0.92} r={0.01} />
      {[-3.0, -1.6, -0.2, 1.2, 2.6].map((x) => (
        <B key={x} p={[x, 1.55, -3.485]} s={[1.28, 2.7, 0.02]} c="#3b4157" rough={0.9} r={0.008} cast={false} />
      ))}
      <B p={[0, 0.08, -3.465]} s={[7, 0.16, 0.05]} c={dark} />

      {/* left wall with the window opening */}
      <B p={[-3.6, 0.55, 0]} s={[0.2, 1.1, 7.5]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 3.25, 0]} s={[0.2, 0.7, 7.5]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 2.0, -2.4]} s={[0.2, 1.8, 2.6]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 2.0, 2.4]} s={[0.2, 1.8, 2.6]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.465, 0.08, 0]} s={[0.05, 0.16, 7]} c={dark} />
      {/* window frame */}
      <B p={[-3.46, 2.92, 0]} s={[0.1, 0.07, 2.3]} c="#0b0d14" />
      <B p={[-3.43, 1.09, 0]} s={[0.17, 0.07, 2.4]} c="#0b0d14" />
      <B p={[-3.46, 2.0, -1.1]} s={[0.1, 1.84, 0.07]} c="#0b0d14" />
      <B p={[-3.46, 2.0, 1.1]} s={[0.1, 1.84, 0.07]} c="#0b0d14" />
      <B p={[-3.47, 2.0, 0]} s={[0.05, 1.84, 0.045]} c="#0b0d14" />
      <B p={[-3.47, 2.0, 0]} s={[0.05, 0.045, 2.2]} c="#0b0d14" />
      <City />

      {/* desk corner */}
      <B p={[-1.7, 0.78, -3.0]} s={[2.7, 0.07, 1.0]} c="#0e1017" r={0.028} rough={0.35} />
      <B p={[-2.98, 0.37, -3.0]} s={[0.06, 0.74, 0.95]} c="#1a1d28" />
      <B p={[-0.42, 0.37, -3.0]} s={[0.06, 0.74, 0.95]} c="#1a1d28" />
      <B p={[-1.7, 0.4, -3.43]} s={[2.6, 0.7, 0.05]} c="#1a1d28" />
      <B p={[-0.85, 0.33, -3.0]} s={[0.7, 0.6, 0.86]} c="#1f2331" />
      <Lit p={[-0.85, 0.5, -2.565]} s={[0.3, 0.012, 0.012]} c="#ffb25a" />
      <Lit p={[-1.7, 0.742, -2.496]} s={[2.7, 0.016, 0.012]} c="#ffb25a" />
      {/* keyboard, mouse, notebook */}
      <group position={[-1.6, 0.8, -2.7]} rotation={[0, 0.4, 0]}>
        <B p={[0, 0.013, 0]} s={[0.6, 0.026, 0.2]} c="#20232f" r={0.01} />
        <mesh position={[0, 0.0275, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.56, 0.175]} />
          <meshStandardMaterial map={keys} roughness={0.6} />
        </mesh>
      </group>
      <B p={[-1.06, 0.82, -2.72]} s={[0.07, 0.026, 0.12]} c="#cfd3df" r={0.012} rough={0.4} rot={[0, 0.4, 0]} />
      <B p={[-2.38, 0.82, -2.74]} s={[0.3, 0.015, 0.22]} c="#2d3750" rot={[0, 0.25, 0]} />
      <B p={[-2.56, 0.83, -2.58]} s={[0.08, 0.004, 0.08]} c="#f0d36a" rot={[0, -0.2, 0]} />
      <Poster p={[-2.45, 2.25, -3.455]} />

      {/* bookshelf on the left wall */}
      <B p={[-3.32, 1.1, 1.57]} s={[0.35, 2.2, 0.05]} c="#262b3a" />
      <B p={[-3.32, 1.1, 3.23]} s={[0.35, 2.2, 0.05]} c="#262b3a" />
      {[0.03, 0.73, 1.43, 2.18].map((y) => (
        <B key={y} p={[-3.32, y, 2.4]} s={[0.35, 0.04, 1.7]} c="#262b3a" />
      ))}
      <B p={[-3.47, 1.1, 2.4]} s={[0.03, 2.2, 1.7]} c="#161924" />
      <Books />
      <Plant p={[-3.3, 2.2, 2.9]} scale={0.55} />
      <Plant p={[-3.0, 0, -1.7]} scale={1.15} />

      {/* cabinet + turntable on the right wall */}
      <B p={[2.5, 0.4, -3.1]} s={[1.7, 0.8, 0.7]} c="#1c2030" r={0.02} />
      <B p={[2.5, 0.4, -2.745]} s={[0.01, 0.72, 0.01]} c="#0a0c12" cast={false} />
      <Lit p={[2.4, 0.5, -2.74]} s={[0.012, 0.16, 0.012]} c="#ffb25a" />
      <Lit p={[2.6, 0.5, -2.74]} s={[0.012, 0.16, 0.012]} c="#ffb25a" />
      <B p={[3.0, 0.83, -3.15]} s={[0.5, 0.05, 0.42]} c="#10131b" r={0.01} />
      <mesh position={[3.0, 0.865, -3.15]}>
        <cylinderGeometry args={[0.15, 0.15, 0.012, 32]} />
        <meshStandardMaterial color="#05060a" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* pegboard */}
      <Lit p={[0.6, 2.15, -3.462]} s={[2.5, 1.15, 0.01]} c="#bcd6ff" />
      <B p={[0.6, 2.15, -3.445]} s={[2.4, 1.05, 0.03]} c="#0e1220" r={0.01} />
      <mesh position={[0.6, 2.15, -3.428]}>
        <planeGeometry args={[2.36, 1.01]} />
        <meshStandardMaterial map={dots} roughness={0.9} />
      </mesh>
    </group>
  );
}
