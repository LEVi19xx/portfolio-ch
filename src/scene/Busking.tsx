"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { busk, SONGS } from "@/lib/busk";
import { noteFreq } from "@/lib/piano";
import { sound } from "@/lib/sound";
import { B } from "./Room";
import { canvasTexture } from "./textures";

// Busking on the music room's rug. The busker (the character) stands in the middle, the crowd gathers in a half circle
// toward the camera, and tips fly into the guitar case.
const STAGE: [number, number] = [0.6, 0.7];
const CASE: [number, number] = [1.2, 1.3];
const FACING = Math.PI / 4;
const SLOTS = 8;
const slot = (k: number): [number, number] => {
  const ang = FACING + (k - (SLOTS - 1) / 2) * 0.34;
  return [STAGE[0] + Math.sin(ang) * 2.0, STAGE[1] + Math.cos(ang) * 2.0];
};
const SHIRTS = ["#e0314b", "#ffd84a", "#3fbf7f", "#5aa9ff", "#9b6bff", "#ff8a3d", "#ff8fb1", "#2ec4b6"];

function Listener({ k }: { k: number }) {
  const g = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const [x, z] = slot(k);
  const face = Math.atan2(STAGE[0] - x, STAGE[1] - z);
  useFrame(({ clock }, dt) => {
    const here = k < busk.get().crowd;
    const gp = g.current;
    if (!gp) return;
    const s = gp.scale.x + ((here ? 1 : 0.001) - gp.scale.x) * Math.min(1, dt * 4);
    gp.scale.setScalar(s);
    gp.visible = s > 0.02;
    const t = clock.elapsedTime;
    const beat = busk.get().playing ? (SONGS[busk.get().song].bpm / 60) * Math.PI : 1;
    gp.position.y = busk.get().playing ? Math.abs(Math.sin(t * beat + k)) * 0.05 : 0;
    // some of them clap along
    const clap = busk.get().playing && k % 3 === 0;
    const a = clap ? Math.sin(t * beat * 2 + k) * 0.3 : 0;
    if (armL.current) armL.current.rotation.x += ((clap ? -1.3 + a : 0) - armL.current.rotation.x) * Math.min(1, dt * 10);
    if (armR.current) armR.current.rotation.x += ((clap ? -1.3 - a : 0) - armR.current.rotation.x) * Math.min(1, dt * 10);
  });
  return (
    <group position={[x, 0, z]} rotation={[0, face, 0]}>
      <group ref={g} scale={0.001} visible={false}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.34, 6, 12]} />
          <meshStandardMaterial color={SHIRTS[k % SHIRTS.length]} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.14, 12]} />
          <meshStandardMaterial color="#2c3550" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.66, 0]} castShadow>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshStandardMaterial color={["#f1c9a5", "#d9a47c", "#a8714f", "#f6d6b8"][k % 4]} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.7, -0.015]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.104, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
          <meshStandardMaterial color={["#1f130e", "#4a3220", "#c9a074", "#17171d"][(k * 3) % 4]} roughness={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? armL : armR} position={[s * 0.13, 0.46, 0]}>
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[0.033, 0.16, 4, 8]} />
              <meshStandardMaterial color={SHIRTS[k % SHIRTS.length]} roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

type Coin = { x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number };
const COINS = 24;
const FLIGHT = 0.7;

export default function Busking({ section }: { section: number }) {
  const st = useRef({ acc: 0, step: 0, crowdT: 0, tipAcc: 0 });
  const coins = useRef<Coin[]>([]);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const pile = useRef<THREE.Mesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const sign = useMemo(
    () =>
      canvasTexture(256, 160, (c, w, h) => {
        c.fillStyle = "#f1e8d4";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#3a2f45";
        c.textAlign = "center";
        c.font = "700 34px 'Segoe Print', 'Comic Sans MS', cursive";
        c.fillText("BUSKING", w / 2, 62);
        c.font = "26px 'Segoe Print', 'Comic Sans MS', cursive";
        c.fillText("tips welcome", w / 2, 106);
        c.fillStyle = "#e0314b";
        c.font = "30px serif";
        c.fillText("♥", w / 2, 144);
      }),
    [],
  );

  // leaving the music room's busking spot stops the music
  useEffect(() => {
    if (section !== 19) busk.stop();
  }, [section]);

  useFrame((_, dt) => {
    const s = busk.get();
    const r = st.current;
    if (s.playing) {
      const song = SONGS[s.song];
      const stepDur = 60 / song.bpm / 2;
      r.acc += dt;
      while (r.acc >= stepDur) {
        r.acc -= stepDur;
        const n = song.steps[r.step % song.steps.length];
        r.step++;
        if (n !== null) void sound.note(noteFreq(n));
      }
      // the crowd grows the longer you play
      r.crowdT += dt;
      if (r.crowdT > 4 && s.crowd < SLOTS) {
        r.crowdT = 0;
        busk.setCrowd(s.crowd + 1);
      }
      if (s.crowd === 0 && r.crowdT > 1.5) {
        r.crowdT = 0;
        busk.setCrowd(1);
      }
      // each listener tips now and then
      r.tipAcc += dt * s.crowd * 0.14;
      if (r.tipAcc >= 1 && s.crowd > 0) {
        r.tipAcc = 0;
        const from = slot(Math.floor(Math.random() * s.crowd));
        const amount = 1 + Math.floor(Math.random() * 3);
        busk.tip(amount);
        for (let i = 0; i < Math.min(amount, 3); i++) {
          coins.current.push({
            x: from[0],
            y: 0.55,
            z: from[1],
            vx: (CASE[0] + (Math.random() - 0.5) * 0.2 - from[0]) / FLIGHT,
            vz: (CASE[1] + (Math.random() - 0.5) * 0.2 - from[1]) / FLIGHT,
            vy: (0.04 - 0.55 + 0.5 * 9.8 * FLIGHT * FLIGHT) / FLIGHT,
            t: -i * 0.12,
          });
        }
        void sound.note(1760);
      }
    } else {
      r.acc = 0;
      r.step = 0;
      // they drift away once the music stops
      r.crowdT += dt;
      if (r.crowdT > 1.4 && s.crowd > 0) {
        r.crowdT = 0;
        busk.setCrowd(s.crowd - 1);
      }
    }

    // coins in flight
    const list = coins.current;
    for (const c of list) {
      c.t += dt;
      if (c.t > 0) {
        c.x += c.vx * dt;
        c.z += c.vz * dt;
        c.vy -= 9.8 * dt;
        c.y += c.vy * dt;
      }
    }
    coins.current = list.filter((c) => c.t < FLIGHT);
    const mm = mesh.current;
    if (mm) {
      for (let i = 0; i < COINS; i++) {
        const c = coins.current[i];
        if (c && c.t > 0) m.makeTranslation(c.x, c.y, c.z);
        else m.makeTranslation(0, -10, 0);
        mm.setMatrixAt(i, m);
      }
      mm.instanceMatrix.needsUpdate = true;
    }
    if (light.current) light.current.intensity += ((s.playing ? 5 : 0) - light.current.intensity) * Math.min(1, dt * 4);
    if (pile.current) {
      const h = Math.min(s.tips, 80) / 80;
      pile.current.scale.set(1, 0.001 + h, 1);
      pile.current.position.y = 0.075 + h * 0.03;
    }
  });

  return (
    <group>
      {Array.from({ length: SLOTS }, (_, k) => (
        <Listener key={k} k={k} />
      ))}

      {/* the open guitar case with the tips */}
      <group position={[CASE[0], 0, CASE[1]]} rotation={[0, FACING + Math.PI, 0]}>
        <B p={[0, 0.04, 0]} s={[0.78, 0.08, 0.34]} c="#17171d" r={0.02} rough={0.8} />
        <B p={[0, 0.082, 0]} s={[0.7, 0.01, 0.27]} c="#8c1d40" r={0.004} rough={1} />
        <group position={[0, 0.08, -0.17]} rotation={[-1.05, 0, 0]}>
          <B p={[0, 0, 0]} s={[0.78, 0.04, 0.34]} c="#17171d" r={0.02} rough={0.8} />
        </group>
        <mesh ref={pile} position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.06, 20]} />
          <meshStandardMaterial color="#e0b45a" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <instancedMesh ref={mesh} args={[undefined, undefined, COINS]} frustumCulled={false}>
        <cylinderGeometry args={[0.03, 0.03, 0.008, 10]} />
        <meshStandardMaterial color="#ffd24a" metalness={0.9} roughness={0.25} />
      </instancedMesh>

      {/* a little sign leaning on the case, and a warm spotlight on the busker */}
      <group position={[CASE[0] + 0.5, 0.2, CASE[1] - 0.35]} rotation={[-0.2, FACING + Math.PI, 0]}>
        <B p={[0, 0, 0]} s={[0.46, 0.3, 0.02]} c="#3a2f45" r={0.01} />
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.42, 0.26]} />
          <meshStandardMaterial map={sign} roughness={0.9} />
        </mesh>
      </group>
      <pointLight ref={light} position={[STAGE[0], 2.5, STAGE[1]]} color="#ffd9a0" intensity={0} distance={5} decay={2} />
    </group>
  );
}
