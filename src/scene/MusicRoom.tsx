"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BLACK, noteFreq, WHITE } from "@/lib/piano";
import { sound } from "@/lib/sound";
import { useAccent } from "./accent";
import { Hit, pointerOff, pointerOn, type V3 } from "./Hit";
import { Hotspots, type HotspotCfg } from "./Props";
import Busking from "./Busking";
import { B } from "./Room";
import { canvasTexture } from "./textures";

/* ───────────────────────── a playable keyboard: click the keys, or use Z–M and Q–U ───────────────────────── */
const KW = 0.094;
const C_WHITE = new THREE.Color("#f2f2f4");
const C_BLACK = new THREE.Color("#15151b");
const HOLD = 240; // how long a pressed key stays down, in ms

// which keys are down, and until when (module level: there is exactly one keyboard)
const until = new Map<number, number>();
const press = (s: number) => {
  until.set(s, performance.now() + HOLD);
  void sound.note(noteFreq(s));
};

function Keyboard({ active }: { active: boolean }) {
  const accent = useAccent();
  const groups = useRef(new Map<number, THREE.Group>());
  const mats = useRef(new Map<number, THREE.MeshStandardMaterial>());

  // keys pressed on the computer keyboard animate the same keys
  useEffect(() => {
    const on = (e: Event) => until.set((e as CustomEvent<number>).detail, performance.now() + HOLD);
    window.addEventListener("piano-press", on);
    return () => window.removeEventListener("piano-press", on);
  }, []);

  useFrame((_, dt) => {
    const now = performance.now();
    groups.current.forEach((g, s) => {
      const down = (until.get(s) ?? 0) > now;
      g.rotation.x += ((down ? 0.07 : 0) - g.rotation.x) * Math.min(1, dt * 22);
      const m = mats.current.get(s);
      if (m) {
        const white = WHITE.includes(s);
        m.color.lerp(down ? accent.color : white ? C_WHITE : C_BLACK, Math.min(1, dt * 14));
      }
    });
  });

  const key = (s: number, black: boolean, x: number) => (
    <group
      key={s}
      position={[x, black ? 0.978 : 0.948, -0.17]}
      ref={(g) => {
        if (g) groups.current.set(s, g);
      }}
    >
      <mesh
        position={[0, 0, black ? 0.115 : 0.19]}
        castShadow
        onPointerDown={(e) => {
          if (!active) return;
          e.stopPropagation();
          press(s);
        }}
        onPointerOver={() => active && pointerOn()}
        onPointerOut={pointerOff}
      >
        <boxGeometry args={black ? [0.052, 0.05, 0.23] : [KW - 0.004, 0.04, 0.38]} />
        <meshStandardMaterial
          ref={(m) => {
            if (m) mats.current.set(s, m);
          }}
          color={black ? "#15151b" : "#f2f2f4"}
          roughness={0.35}
        />
      </mesh>
    </group>
  );

  return (
    <group position={[0.4, 0, -2.85]}>
      {/* stand */}
      <B p={[0, 0.86, 0]} s={[1.7, 0.06, 0.62]} c="#14161d" r={0.02} metal={0.5} rough={0.4} />
      {[-0.78, 0.78].map((x) => (
        <B key={x} p={[x, 0.43, 0]} s={[0.05, 0.86, 0.5]} c="#14161d" r={0.01} metal={0.5} rough={0.4} />
      ))}
      {/* the synth body */}
      <B p={[0, 0.915, -0.02]} s={[1.5, 0.07, 0.54]} c="#1b1c26" r={0.02} rough={0.45} />
      <B p={[0, 0.96, -0.2]} s={[1.5, 0.05, 0.14]} c="#252733" r={0.015} />
      {[-0.5, -0.4, -0.3, 0.3, 0.4, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.99, -0.2]}>
          <cylinderGeometry args={[0.017, 0.017, 0.02, 14]} />
          <meshStandardMaterial color="#c4c8d2" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {WHITE.map((s, i) => key(s, false, (i - 6.5) * KW))}
      {BLACK.map((s) => {
        const left = WHITE.filter((w) => w < s).length - 1;
        return key(s, true, (left - 6) * KW);
      })}
    </group>
  );
}

/* ───────────────────────── the rest of the room ───────────────────────── */
function Speaker({ position }: { position: V3 }) {
  const accent = useAccent();
  const woofer = useRef<THREE.Mesh>(null);
  const tweeter = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const b = sound.beat();
    if (woofer.current) woofer.current.scale.setScalar(1 + b * 0.14);
    if (tweeter.current) tweeter.current.scale.setScalar(1 + b * 0.08);
    void accent;
  });
  return (
    <group position={position}>
      <B p={[0, 0.575, 0]} s={[0.46, 1.15, 0.42]} c="#14151c" r={0.03} rough={0.6} />
      <mesh ref={woofer} position={[0, 0.38, 0.215]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.03, 28]} />
        <meshStandardMaterial color="#05060a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.38, 0.23]}>
        <torusGeometry args={[0.158, 0.008, 8, 32]} />
        <primitive object={accent.basic} attach="material" />
      </mesh>
      <mesh ref={tweeter} position={[0, 0.85, 0.215]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 20]} />
        <meshStandardMaterial color="#05060a" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Drums() {
  const shell = "#c0392b";
  const drum = (p: V3, r: number, h: number, rot: V3 = [0, 0, 0]) => (
    <group position={p} rotation={rot}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, h, 28]} />
        <meshStandardMaterial color={shell} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, h / 2 + 0.003, 0]}>
        <cylinderGeometry args={[r * 0.96, r * 0.96, 0.008, 28]} />
        <meshStandardMaterial color="#efeee9" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, (s * h) / 2, 0]}>
          <torusGeometry args={[r, 0.008, 6, 28]} />
          <meshStandardMaterial color="#c4c8d2" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
  const cymbal = (p: V3, r: number, tilt: number) => (
    <group position={p}>
      <mesh position={[0, -p[1] / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, p[1], 8]} />
        <meshStandardMaterial color="#b8bcc6" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh rotation={[tilt, 0, 0]} castShadow>
        <cylinderGeometry args={[r, r * 0.9, 0.012, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.22} />
      </mesh>
    </group>
  );
  return (
    <group position={[-2.2, 0, -2.4]} rotation={[0, 0.5, 0]}>
      {drum([0, 0.31, 0], 0.3, 0.34, [Math.PI / 2, 0, 0])}
      {drum([-0.42, 0.62, 0.3], 0.17, 0.13)}
      {drum([-0.14, 0.82, -0.2], 0.13, 0.12, [0.25, 0, 0])}
      {drum([0.2, 0.82, -0.2], 0.14, 0.12, [0.25, 0, 0])}
      {drum([0.58, 0.46, 0.1], 0.2, 0.38)}
      {cymbal([-0.72, 0.95, 0.1], 0.15, 0.04)}
      {cymbal([-0.4, 1.38, -0.3], 0.21, -0.2)}
      {cymbal([0.52, 1.24, -0.4], 0.24, 0.12)}
      <mesh position={[0.05, 0.42, 0.95]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.07, 20]} />
        <meshStandardMaterial color="#14161d" roughness={0.7} />
      </mesh>
      <mesh position={[0.05, 0.2, 0.95]}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 10]} />
        <meshStandardMaterial color="#b8bcc6" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ElectricGuitar() {
  return (
    <group position={[-3.2, 0, 1.2]} rotation={[0, Math.PI / 2, 0.06]}>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.18, -0.06]} rotation={[0.35, 0, x * 1.2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
          <meshStandardMaterial color="#14161d" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <B p={[0, 0.55, 0.0]} s={[0.36, 0.46, 0.06]} c="#d4382a" r={0.1} rough={0.25} metal={0.2} />
      <B p={[0, 0.6, 0.034]} s={[0.24, 0.26, 0.004]} c="#f4f1e8" r={0.05} />
      <B p={[0, 1.1, 0.0]} s={[0.055, 0.78, 0.035]} c="#3a2a20" r={0.008} />
      <B p={[0, 1.55, 0.0]} s={[0.085, 0.2, 0.03]} c="#2a1d16" r={0.01} />
    </group>
  );
}

function Amp() {
  return (
    <group position={[-3.1, 0, 2.5]} rotation={[0, Math.PI / 2, 0]}>
      <B p={[0, 0.34, 0]} s={[0.62, 0.68, 0.36]} c="#16171e" r={0.03} rough={0.7} />
      <mesh position={[0, 0.3, 0.185]}>
        <planeGeometry args={[0.5, 0.4]} />
        <meshStandardMaterial color="#2a2c38" roughness={1} />
      </mesh>
      {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.185]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 10]} />
          <meshStandardMaterial color="#c4c8d2" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// two decks with spinning records. Click the table to change the track.
function DJTable({ onToggleMusic }: { onToggleMusic: () => void }) {
  const accent = useAccent();
  const platters = useRef<(THREE.Mesh | null)[]>([]);
  const label = useRef<HTMLDivElement>(null);
  useFrame((_, dt) => {
    const on = sound.isMusicOn();
    platters.current.forEach((p) => {
      if (p) p.rotation.y += dt * (on ? 4 : 0.25);
    });
    if (label.current) {
      const n = sound.musicName();
      const text = n ? "♪ " + n : "CLICK TO PLAY";
      if (label.current.textContent !== text) label.current.textContent = text;
    }
  });
  return (
    <group position={[-1.7, 0, 2.2]} rotation={[0, 0.5, 0]}>
      <B p={[0, 0.8, 0]} s={[1.3, 0.06, 0.62]} c="#1d1f28" r={0.02} rough={0.4} />
      {[-0.6, 0.6].map((x) => (
        <B key={x} p={[x, 0.4, 0]} s={[0.06, 0.8, 0.56]} c="#14151c" r={0.01} />
      ))}
      {[-0.4, 0.4].map((x, i) => (
        <group key={x} position={[x, 0.84, 0]}>
          <B p={[0, 0, 0]} s={[0.42, 0.04, 0.46]} c="#2a2c38" r={0.015} />
          <mesh ref={(m) => void (platters.current[i] = m)} position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.014, 40]} />
            <meshStandardMaterial color="#07080c" roughness={0.25} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.004, 24]} />
            <primitive object={accent.basic} attach="material" />
          </mesh>
        </group>
      ))}
      <B p={[0, 0.85, 0]} s={[0.26, 0.05, 0.4]} c="#16171e" r={0.015} />
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.885, 0.05]}>
          <cylinderGeometry args={[0.014, 0.014, 0.02, 10]} />
          <primitive object={accent.basic} attach="material" />
        </mesh>
      ))}
      <Html position={[0, 1.15, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
        <div
          ref={label}
          className="room-music whitespace-nowrap rounded-full px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.25em] text-white"
          style={{ background: "rgba(8,10,18,0.78)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
        >
          CLICK TO PLAY
        </div>
      </Html>
      <Hit p={[0, 0.7, 0]} s={[1.5, 0.9, 0.8]} onClick={onToggleMusic} />
    </group>
  );
}

function RecordWall() {
  const arts = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) =>
        canvasTexture(128, 128, (c, w, h) => {
          const g = c.createLinearGradient(0, 0, w, h);
          g.addColorStop(0, `hsl(${i * 55 + 10} 70% 30%)`);
          g.addColorStop(1, `hsl(${i * 55 + 70} 85% 58%)`);
          c.fillStyle = g;
          c.fillRect(0, 0, w, h);
          c.fillStyle = "rgba(0,0,0,0.85)";
          c.beginPath();
          c.arc(w * 0.5, h * 0.5, 34, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(255,255,255,0.8)";
          c.beginPath();
          c.arc(w * 0.5, h * 0.5, 9, 0, Math.PI * 2);
          c.fill();
        }),
      ),
    [],
  );
  return (
    <group>
      {arts.map((t, i) => (
        <group key={i} position={[-3.46, 2.05 + (i % 2) * 0.62, 0.5 + Math.floor(i / 2) * 0.62]} rotation={[0, Math.PI / 2, 0]}>
          <B p={[0, 0, 0]} s={[0.54, 0.54, 0.03]} c="#0c0d12" />
          <mesh position={[0, 0, 0.018]}>
            <planeGeometry args={[0.48, 0.48]} />
            <meshBasicMaterial map={t} toneMapped={false} color="#d8d8d8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const MUSIC_HOTSPOTS: HotspotCfg[] = [
  { i: 13, label: "JAM", pos: [0.4, 2.0, -2.6], hit: { pos: [0.4, 1.0, -2.85], size: [1.9, 0.9, 0.75] } },
  { i: 19, label: "BUSK", pos: [0.6, 1.9, 0.7], hit: { pos: [0.6, 0.9, 0.7], size: [1.2, 1.8, 1.2] } },
];

export default function MusicRoom({
  section,
  onSelect,
  onToggleMusic,
}: {
  section: number;
  onSelect: (i: number) => void;
  onToggleMusic: () => void;
}) {
  const wall = "#252046";
  const neon = useMemo(
    () =>
      canvasTexture(512, 160, (c, w, h) => {
        c.fillStyle = "#0b0816";
        c.fillRect(0, 0, w, h);
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = "italic 800 110px system-ui, sans-serif";
        c.shadowColor = "#ff3da8";
        c.shadowBlur = 28;
        c.fillStyle = "#ff8ad1";
        c.fillText("MUSIC", w / 2, h / 2 + 6);
        c.shadowBlur = 0;
        c.strokeStyle = "#5ee6ff";
        c.lineWidth = 5;
        c.strokeRect(12, 12, w - 24, h - 24);
      }),
    [],
  );
  const accent = useAccent();
  const mag = useRef<THREE.PointLight>(null);
  useFrame(() => mag.current?.color.copy(accent.color));

  return (
    <group>
      {/* floor + a bold round rug */}
      <B p={[0, -0.15, 0]} s={[7.5, 0.3, 7.5]} c="#120f22" r={0.04} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#2b2340" roughness={0.45} />
      </mesh>
      {[
        [1.7, "#2fb8c6"],
        [1.35, "#c4396a"],
        [1.0, "#3b2a6b"],
      ].map(([r, c], i) => (
        <mesh key={i} position={[0.6, 0.012 + i * 0.004, 0.7]} receiveShadow>
          <cylinderGeometry args={[r as number, r as number, 0.02, 48]} />
          <meshStandardMaterial color={c as string} roughness={1} />
        </mesh>
      ))}

      {/* walls with acoustic panels */}
      <B p={[-0.05, 1.8, -3.6]} s={[7.5, 3.6, 0.2]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 1.8, -2.7]} s={[0.2, 3.6, 2]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 1.8, 1.7000000000000002]} s={[0.2, 3.6, 4]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 2.95, -1]} s={[0.2, 1.3, 1.4]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.5, 1.15, -1.7]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[-3.5, 1.15, -0.30000000000000004]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[0, 0.08, -3.465]} s={[7, 0.16, 0.05]} c="#0d0a18" />
      <B p={[-3.465, 0.08, 0]} s={[0.05, 0.16, 7]} c="#0d0a18" />
      {[-3.0, -2.45, -1.9].map((x) =>
        [1.3, 1.85, 2.4].map((y) => (
          <B key={x + "-" + y} p={[x, y, -3.445]} s={[0.5, 0.5, 0.07]} c="#34295c" r={0.01} rough={1} />
        )),
      )}
      {[2.3, 2.85].map((x) =>
        [1.3, 1.85, 2.4].map((y) => (
          <B key={x + "-" + y} p={[x, y, -3.445]} s={[0.5, 0.5, 0.07]} c="#34295c" r={0.01} rough={1} />
        )),
      )}
      <group position={[0.4, 2.75, -3.44]}>
        <B p={[0, 0, 0]} s={[1.9, 0.6, 0.05]} c="#0b0816" r={0.02} />
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[1.84, 0.56]} />
          <meshBasicMaterial map={neon} toneMapped={false} />
        </mesh>
      </group>
      <RecordWall />

      <Keyboard active={section === 13} />
      <Speaker position={[-0.85, 0, -3.1]} />
      <Speaker position={[1.65, 0, -3.1]} />
      <Drums />
      <ElectricGuitar />
      <Amp />
      <DJTable onToggleMusic={onToggleMusic} />

      <pointLight ref={mag} position={[-2, 2.4, 0.5]} intensity={3.2} distance={6} decay={2} />
      <pointLight position={[0.4, 1.9, -2.0]} color="#ffe9d0" intensity={4} distance={3.5} decay={2} />

      <Busking section={section} />
      <Hotspots section={section} onSelect={onSelect} list={MUSIC_HOTSPOTS} roomId="music" overview={12} />
    </group>
  );
}
