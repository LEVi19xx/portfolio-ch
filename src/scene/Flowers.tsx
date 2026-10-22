"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { FlowerType } from "@/lib/bouquet";
import type { V3 } from "./Hit";

// Each flower is built once per (type, color) as ONE merged mesh with vertex colors,
// so a shop full of blooms costs a couple of draw calls per flower instead of dozens.

const SPH = new THREE.SphereGeometry(1, 10, 8);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 10);
const CONE = new THREE.ConeGeometry(1, 1, 6);

function part(
  geo: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  pos: V3,
  rot: V3 = [0, 0, 0],
  scale: V3 = [1, 1, 1],
) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...scale),
  );
  const g = geo.clone().applyMatrix4(m);
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}

const shade = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k);

function buildHead(type: FlowerType, color: string) {
  const parts: THREE.BufferGeometry[] = [];
  const ring = (n: number, r: number, y: number, rot: (a: number) => V3, scale: V3, c: THREE.ColorRepresentation, off = 0) => {
    for (let k = 0; k < n; k++) {
      const a = off + (k * Math.PI * 2) / n;
      parts.push(part(SPH, c, [Math.cos(a) * r, y, Math.sin(a) * r], rot(a), scale));
    }
  };

  if (type === "rose") {
    parts.push(part(SPH, shade(color, 0.72), [0, 0.016, 0], [0, 0, 0], [0.03, 0.042, 0.03]));
    ring(5, 0.03, 0.012, (a) => [0, -a, 0.12], [0.016, 0.036, 0.036], shade(color, 0.9));
    ring(5, 0.046, 0.006, (a) => [0, -a, 0.3], [0.016, 0.04, 0.04], color, Math.PI / 5);
    parts.push(part(CONE, "#3f8a4a", [0, -0.026, 0], [Math.PI, 0, 0], [0.03, 0.04, 0.03]));
  } else if (type === "tulip") {
    ring(6, 0.018, 0.04, (a) => [0, -a, 0.16], [0.013, 0.062, 0.027], color);
    parts.push(part(SPH, shade(color, 0.7), [0, 0.03, 0], [0, 0, 0], [0.016, 0.04, 0.016]));
    parts.push(part(CONE, "#3f8a4a", [0, -0.01, 0], [Math.PI, 0, 0], [0.012, 0.03, 0.012]));
  } else if (type === "daisy") {
    ring(11, 0.04, 0.002, (a) => [0, -a, 0], [0.032, 0.004, 0.011], color);
    parts.push(part(CYL, "#f2c230", [0, 0.004, 0], [0, 0, 0], [0.02, 0.014, 0.02]));
  } else if (type === "sunflower") {
    ring(15, 0.058, 0.002, (a) => [0, -a, 0], [0.046, 0.004, 0.014], color);
    ring(15, 0.05, 0.004, (a) => [0, -a, 0], [0.04, 0.004, 0.013], shade(color, 0.82), Math.PI / 15);
    parts.push(part(CYL, "#4a2f1a", [0, 0.008, 0], [0, 0, 0], [0.044, 0.02, 0.044]));
    parts.push(part(CYL, "#6b4423", [0, 0.012, 0], [0, 0, 0], [0.028, 0.02, 0.028]));
  } else if (type === "peony") {
    // a full, layered bloom
    ring(9, 0.04, 0.004, (a) => [0, -a, 0.55], [0.034, 0.016, 0.034], shade(color, 0.82));
    ring(8, 0.03, 0.016, (a) => [0, -a, 0.35], [0.03, 0.02, 0.03], shade(color, 0.92), Math.PI / 8);
    ring(6, 0.02, 0.028, (a) => [0, -a, 0.2], [0.025, 0.024, 0.025], color);
    parts.push(part(SPH, shade(color, 1.12), [0, 0.038, 0], [0, 0, 0], [0.022, 0.018, 0.022]));
    parts.push(part(CONE, "#3f8a4a", [0, -0.02, 0], [Math.PI, 0, 0], [0.026, 0.034, 0.026]));
  } else if (type === "lavender") {
    // a tall spike of tiny buds
    for (let k = 0; k < 11; k++) {
      const side = k % 2 ? 1 : -1;
      const sc = 0.016 - k * 0.0006;
      parts.push(part(SPH, shade(color, 0.85 + (k % 3) * 0.08), [side * 0.008, k * 0.014, side * 0.004], [0, 0, 0], [sc, sc * 1.3, sc]));
    }
    parts.push(part(SPH, color, [0, 0.16, 0], [0, 0, 0], [0.008, 0.014, 0.008]));
  } else if (type === "hydrangea") {
    // a round cluster of little florets
    for (let k = 0; k < 22; k++) {
      const a = k * 2.399;
      const y = 0.02 + ((k * 37) % 10) / 10 * 0.05;
      const rr = 0.052 * Math.sqrt(((k * 53) % 10) / 10 + 0.1);
      parts.push(part(SPH, shade(color, 0.85 + ((k * 7) % 5) * 0.06), [Math.cos(a) * rr, y, Math.sin(a) * rr], [0, 0, 0], [0.02, 0.014, 0.02]));
    }
  } else if (type === "carnation") {
    ring(14, 0.022, 0.012, (a) => [0, -a, 0.6], [0.02, 0.026, 0.02], shade(color, 0.9));
    ring(10, 0.014, 0.024, (a) => [0, -a, 0.3], [0.018, 0.026, 0.018], color, Math.PI / 10);
    parts.push(part(SPH, shade(color, 1.1), [0, 0.034, 0], [0, 0, 0], [0.014, 0.012, 0.014]));
    parts.push(part(CONE, "#3f8a4a", [0, -0.012, 0], [Math.PI, 0, 0], [0.018, 0.03, 0.018]));
  } else if (type === "orchid") {
    // three petals behind, two broad side petals and a lip
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3 + Math.PI / 2;
      parts.push(part(SPH, color, [Math.cos(a) * 0.03, 0.03 + Math.sin(a) * 0.03, -0.006], [0, 0, a - Math.PI / 2], [0.016, 0.036, 0.006]));
    }
    for (const sd of [-1, 1]) {
      parts.push(part(SPH, shade(color, 1.05), [sd * 0.04, 0.032, 0.002], [0, 0, sd * 0.3], [0.04, 0.03, 0.006]));
    }
    parts.push(part(SPH, shade(color, 0.6), [0, 0.012, 0.012], [0.4, 0, 0], [0.02, 0.016, 0.008]));
    parts.push(part(SPH, "#f2c230", [0, 0.034, 0.012], [0, 0, 0], [0.008, 0.008, 0.008]));
  } else {
    ring(6, 0.022, 0.036, (a) => [0, -a, -0.62], [0.011, 0.07, 0.028], color);
    ring(6, 0.012, 0.03, (a) => [0, -a, -0.3], [0.008, 0.055, 0.02], shade(color, 0.85), Math.PI / 6);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI * 2) / 4;
      parts.push(part(CYL, "#e8d78a", [Math.cos(a) * 0.01, 0.045, Math.sin(a) * 0.01], [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], [0.0025, 0.07, 0.0025]));
      parts.push(part(SPH, "#8a4a1a", [Math.cos(a) * 0.022, 0.082, Math.sin(a) * 0.022], [0, 0, 0], [0.005, 0.008, 0.005]));
    }
  }
  const merged = mergeGeometries(parts, false) ?? new THREE.BufferGeometry();
  parts.forEach((p) => p.dispose());
  return merged;
}

function buildStem(length: number) {
  const parts = [
    part(CYL, "#3f8a4a", [0, length / 2, 0], [0, 0, 0], [0.0065, length, 0.0065]),
    part(SPH, "#4aa05a", [0.024, length * 0.38, 0], [0, 0, -0.6], [0.028, 0.004, 0.012]),
    part(SPH, "#4aa05a", [-0.022, length * 0.55, 0], [0, 0, 0.6], [0.026, 0.004, 0.012]),
  ];
  const merged = mergeGeometries(parts, false) ?? new THREE.BufferGeometry();
  parts.forEach((p) => p.dispose());
  return merged;
}

// shared by every flower: the watering can sets it, it fades out, and the blooms perk up while it lasts
export const flowerFx = { water: 0 };

const headCache = new Map<string, THREE.BufferGeometry>();
const stemCache = new Map<number, THREE.BufferGeometry>();
const getHead = (type: FlowerType, color: string) => {
  const k = type + color;
  let g = headCache.get(k);
  if (!g) headCache.set(k, (g = buildHead(type, color)));
  return g;
};
const getStem = (length: number) => {
  const k = Math.round(length * 100);
  let g = stemCache.get(k);
  if (!g) stemCache.set(k, (g = buildStem(k / 100)));
  return g;
};

export function Flower({
  type,
  color,
  stem = 0.5,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  sway = true,
  phase = 0,
}: {
  type: FlowerType;
  color: string;
  stem?: number;
  position?: V3;
  rotation?: V3;
  scale?: number;
  sway?: boolean;
  phase?: number;
}) {
  const head = useMemo(() => getHead(type, color), [type, color]);
  const stemGeo = useMemo(() => getStem(stem), [stem]);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (sway && g.current) {
      const w = flowerFx.water;
      g.current.rotation.z = Math.sin(clock.elapsedTime * (0.9 + w * 5) + phase) * (0.025 + w * 0.07);
      g.current.scale.setScalar(1 + w * 0.05 * Math.sin(clock.elapsedTime * 9 + phase));
    }
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={g}>
        <mesh geometry={stemGeo}>
          <meshStandardMaterial vertexColors roughness={0.75} />
        </mesh>
        <mesh geometry={head} position={[0, stem, 0]}>
          <meshStandardMaterial vertexColors roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
