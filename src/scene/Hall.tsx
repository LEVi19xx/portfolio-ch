"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { RoomId } from "../components/stations";
import { useAccent } from "./accent";
import { control, SPACING } from "./nav";
import { B, Lit, Plant } from "./Room";

// The hallways: strips between the rooms, with the doors of the rooms opening onto them.
//
//   vertical halls at x = -S/2 and -3S/2, one horizontal hall at z = -S/2   (S = SPACING)
const S = SPACING;
const WALL = "#3b3347";
const V_HALLS = [-S / 2, -S * 1.5];
const H_HALL = -S / 2;
const X_MIN = -S * 2 - 3.6;
const X_MAX = SPACING + 3.7; // the atelier's east edge
const X_HALL_END = SPACING - 3.7; // east end of the horizontal hall
const Z_MIN = -S - 3.6;
const Z_NORTH = S + 3.0;
const Z_MAX = 3.6;

// the doors in each room's east and south walls (the cutaway hides these walls; they appear when you walk inside)
const EAST_DOOR: Partial<Record<RoomId, number>> = { studio: 0.2, lounge: 0.0, music: 0.1, flowers: -1.0, gallery: 0.0 };
const SOUTH_DOOR: Partial<Record<RoomId, number>> = { gallery: 2.8 };

// a 7.4-long wall at `fixed`, with an optional doorway 1.4 wide at `door`
function Wall({ axis, fixed, door }: { axis: "x" | "z"; fixed: number; door?: number }) {
  const pieces: [number, number][] = door === undefined ? [[-3.7, 3.7]] : [[-3.7, door - 0.7], [door + 0.7, 3.7]];
  const at = (a: number, y: number): V3 => (axis === "x" ? [fixed, y, a] : [a, y, fixed]);
  const size = (len: number, h: number): V3 => (axis === "x" ? [0.2, h, len] : [len, h, 0.2]);
  return (
    <>
      {pieces.map(([a, b], i) => (
        <B key={i} p={at((a + b) / 2, 1.8)} s={size(b - a, 3.6)} c={WALL} rough={0.92} r={0.01} />
      ))}
      {door !== undefined && <B p={at(door, 2.95)} s={size(1.4, 1.3)} c={WALL} rough={0.92} r={0.01} />}
    </>
  );
}
type V3 = [number, number, number];

// east and south walls of one room, only there while you walk around inside the house
export function FpWalls({ id }: { id: RoomId }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = control.active && control.seat < 0 && !control.map && (control.fp || control.zoom < 3.2);
  });
  return (
    <group ref={g} visible={false}>
      <Wall axis="x" fixed={3.6} door={EAST_DOOR[id]} />
      <Wall axis="z" fixed={3.6} door={SOUTH_DOOR[id]} />
    </group>
  );
}

// a neon line on the floor
function Strip({ p, s }: { p: V3; s: V3 }) {
  const accent = useAccent();
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <primitive object={accent.basic} attach="material" />
    </mesh>
  );
}

// floor dressing: runners, neon edges, plants, and a few lights (always there, also in the cutaway view)
export function Hallways() {
  const lamps: V3[] = [
    [V_HALLS[0], 2.7, H_HALL],
    [V_HALLS[1], 2.7, H_HALL],
  ];
  return (
    <group>
      {V_HALLS.map((x) => (
        <group key={x}>
          <B p={[x, 0.012, (Z_MIN + Z_MAX) / 2]} s={[1.2, 0.024, Z_MAX - Z_MIN - 0.6]} c="#3a2535" r={0.005} rough={0.95} cast={false} />
          <Strip p={[x - 0.62, 0.03, (Z_MIN + Z_MAX) / 2]} s={[0.025, 0.012, Z_MAX - Z_MIN - 0.6]} />
          <Strip p={[x + 0.62, 0.03, (Z_MIN + Z_MAX) / 2]} s={[0.025, 0.012, Z_MAX - Z_MIN - 0.6]} />
          <Plant p={[x + 0.85, 0, Z_MIN + 0.5]} scale={0.8} />
          <Plant p={[x - 0.85, 0, Z_MAX - 0.5]} scale={0.8} />
        </group>
      ))}
      <B p={[(X_MIN + X_HALL_END) / 2, 0.012, H_HALL]} s={[X_HALL_END - X_MIN - 0.6, 0.024, 1.2]} c="#3a2535" r={0.005} rough={0.95} cast={false} />
      <Strip p={[(X_MIN + X_HALL_END) / 2, 0.03, H_HALL - 0.62]} s={[X_HALL_END - X_MIN - 0.6, 0.012, 0.025]} />
      <Strip p={[(X_MIN + X_HALL_END) / 2, 0.03, H_HALL + 0.62]} s={[X_HALL_END - X_MIN - 0.6, 0.012, 0.025]} />
      <Plant p={[X_MIN + 0.5, 0, H_HALL + 0.9]} scale={0.8} />
      {/* the short hall up to the atelier */}
      <B p={[S / 2, 0.012, -8.7]} s={[1.2, 0.024, 9.2]} c="#3a2535" r={0.005} rough={0.95} cast={false} />
      <Strip p={[S / 2 - 0.62, 0.03, -8.7]} s={[0.025, 0.012, 9.2]} />
      <Strip p={[S / 2 + 0.62, 0.03, -8.7]} s={[0.025, 0.012, 9.2]} />
      <Plant p={[S / 2 + 0.85, 0, -Z_NORTH + 0.6]} scale={0.8} />
      <pointLight position={[S / 2, 2.7, -S / 2 - 3]} color="#ffe2b8" intensity={1.6} distance={9} decay={2} />
      {lamps.map((p, i) => (
        <pointLight key={i} position={p} color="#ffe2b8" intensity={1.6} distance={9} decay={2} />
      ))}
    </group>
  );
}

// the ceiling over the whole house, with light panels along the halls, and caps that close the hall ends
export function HouseShell() {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = control.active && control.seat < 0 && !control.map && (control.fp || control.zoom < 3.2);
  });
  const panels: V3[] = [];
  for (const x of V_HALLS) for (let z = Z_MIN + 1.5; z < Z_MAX; z += 4.2) panels.push([x, 3.55, z]);
  for (let x = X_MIN + 1.5; x < X_HALL_END; x += 4.2) panels.push([x, 3.55, H_HALL]);
  for (let z = -S - 2; z < -S / 2; z += 4.2) panels.push([S / 2, 3.55, z]);
  const mx = (X_MIN + X_MAX) / 2;
  const mz = (Z_MIN + Z_MAX) / 2;
  return (
    <group ref={g} visible={false}>
      <mesh position={[mx, 3.6, mz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[X_MAX - X_MIN, Z_MAX - Z_MIN]} />
        <meshStandardMaterial color="#26212e" roughness={0.95} />
      </mesh>
      {panels.map((p, i) => (
        <Lit key={i} p={p} s={[0.7, 0.04, 0.7]} c="#fff0d2" />
      ))}
      {/* end caps of the halls */}
      {V_HALLS.map((x) => (
        <group key={x}>
          <B p={[x, 1.8, Z_MIN]} s={[S - 7.2, 3.6, 0.2]} c={WALL} rough={0.92} r={0.01} />
          <B p={[x, 1.8, Z_MAX]} s={[S - 7.2, 3.6, 0.2]} c={WALL} rough={0.92} r={0.01} />
        </group>
      ))}
      <B p={[X_MIN, 1.8, H_HALL]} s={[0.2, 3.6, S - 7.2]} c={WALL} rough={0.92} r={0.01} />
      {/* the atelier hall: north cap, east and south closing walls where the horizontal hall meets it */}
      <B p={[S / 2, 1.8, Z_MIN]} s={[S - 7.2, 3.6, 0.2]} c={WALL} rough={0.92} r={0.01} />
      <B p={[S - 3.6, 1.8, -S / 2]} s={[0.2, 3.6, 3.2]} c={WALL} rough={0.92} r={0.01} />
      <B p={[S / 2, 1.8, -3.6]} s={[S - 7.2, 3.6, 0.2]} c={WALL} rough={0.92} r={0.01} />
    </group>
  );
}
