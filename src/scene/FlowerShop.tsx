/* eslint-disable react-hooks/immutability -- textures and instanced meshes are updated in place every frame */
"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  bouquet,
  CARD_STYLES,
  FLOWER_INFO,
  FLOWER_TYPES,
  useBouquet,
  type FlowerType,
} from "@/lib/bouquet";
import { sound } from "@/lib/sound";
import { Flower, flowerFx } from "./Flowers";
import { Hit, type V3 } from "./Hit";
import { Hotspots, type HotspotCfg } from "./Props";
import { B, Plant } from "./Room";
import { canvasTexture } from "./textures";

/* ───────────────────────── the bouquet you are building (rebuilds as you click) ───────────────────────── */
function BouquetModel() {
  const b = useBouquet();
  const turn = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (turn.current) turn.current.rotation.y += dt * 0.3;
  });
  const n = b.flowers.length;
  const wrap = b.container === "wrap";
  const basket = b.container === "basket";
  const base = wrap ? 0 : basket ? 0.08 : 0.04;
  return (
    <group ref={turn}>
      {b.flowers.map((f, i) => {
        const r = n > 1 ? Math.sqrt(i / (n - 1)) : 0;
        const az = i * 2.399;
        const tilt = (i === 0 ? 0.02 : 0.14 + r * 0.36) * (wrap ? 1 : 0.8);
        return (
          <Flower
            key={i + f.type + f.color}
            type={f.type}
            color={f.color}
            stem={0.5 + (i % 3) * 0.035 - r * 0.05}
            position={[0, base, 0]}
            rotation={[tilt * Math.sin(az), 0, -tilt * Math.cos(az)]}
            scale={1.2}
            phase={i}
          />
        );
      })}
      {wrap && (
        <>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.24, 0.036, 0.44, 28, 1, true]} />
            <meshStandardMaterial color={b.wrap} side={THREE.DoubleSide} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.2, 0.034, 0.38, 20, 1, true]} />
            <meshStandardMaterial color={new THREE.Color(b.wrap).lerp(new THREE.Color("#ffffff"), 0.45)} side={THREE.DoubleSide} roughness={0.9} />
          </mesh>
        </>
      )}
      {basket && (
        <>
          <mesh position={[0, 0.11, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.18, 0.22, 28, 1, true]} />
            <meshStandardMaterial color="#b98a58" side={THREE.DoubleSide} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 24]} />
            <meshStandardMaterial color="#9c6f42" roughness={0.95} />
          </mesh>
          {[0.05, 0.11, 0.17].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18 + y * 0.28, 0.008, 6, 32]} />
              <meshStandardMaterial color="#8a6238" roughness={1} />
            </mesh>
          ))}
          <mesh position={[0, 0.22, 0]}>
            <torusGeometry args={[0.235, 0.012, 8, 28, Math.PI]} />
            <meshStandardMaterial color="#9c6f42" roughness={0.95} />
          </mesh>
        </>
      )}
      {b.container === "vase" && (
        <>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.15, 0.1, 0.3, 28, 1, true]} />
            <meshStandardMaterial color="#cdeaf4" transparent opacity={0.45} roughness={0.08} metalness={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.136, 0.1, 0.18, 24]} />
            <meshStandardMaterial color="#a9d8ee" transparent opacity={0.35} roughness={0.1} />
          </mesh>
        </>
      )}
      <mesh position={[0, wrap ? 0.085 : basket ? 0.22 : 0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[wrap ? 0.046 : basket ? 0.236 : 0.14, 0.011, 8, 28]} />
        <meshStandardMaterial color={b.ribbon} roughness={0.35} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={wrap ? [s * 0.035, 0.085, 0.052] : basket ? [s * 0.04, 0.22, 0.24] : [s * 0.04, 0.27, 0.145]}
          rotation={[0, 0, s * 0.5]}
          scale={[1.6, 0.8, 0.5]}
        >
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color={b.ribbon} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────────────── the gift card: whatever you write is on it ───────────────────────── */
function GiftCard() {
  const b = useBouquet();
  const tex = useMemo(() => canvasTexture(320, 440, () => undefined), []);
  useEffect(() => {
    const c = (tex.image as HTMLCanvasElement).getContext("2d");
    if (!c) return;
    const st = CARD_STYLES.find((s) => s.id === b.card.style) ?? CARD_STYLES[0];
    c.fillStyle = st.bg;
    c.fillRect(0, 0, 320, 440);
    c.strokeStyle = st.edge;
    c.lineWidth = 6;
    c.strokeRect(14, 14, 292, 412);
    // a little flower
    c.fillStyle = st.edge;
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      c.beginPath();
      c.ellipse(160 + Math.cos(a) * 16, 56 + Math.sin(a) * 16, 12, 8, a, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = st.ink;
    c.beginPath();
    c.arc(160, 56, 7, 0, Math.PI * 2);
    c.fill();
    c.textAlign = "left";
    c.font = "italic 700 26px Georgia, serif";
    c.fillText(b.card.to ? "Dear " + b.card.to + "," : "Dear friend,", 34, 120);
    c.font = "italic 22px Georgia, serif";
    const lines: string[] = [];
    for (const para of (b.card.message || "Write your message in the card tab.").split("\n")) {
      let line = "";
      for (const w of para.split(" ")) {
        const t = line ? line + " " + w : w;
        if (c.measureText(t).width > 250 && line) {
          lines.push(line);
          line = w;
        } else line = t;
      }
      lines.push(line);
    }
    lines.slice(0, 9).forEach((l, i) => c.fillText(l, 34, 160 + i * 30));
    c.textAlign = "right";
    c.font = "italic 700 24px Georgia, serif";
    c.fillText(b.card.from ? "- " + b.card.from : "", 286, 400);
    tex.needsUpdate = true;
  }, [tex, b.card]);
  return (
    <group position={[0.44, 0.05, 0.1]} rotation={[0, 0.78, 0]}>
      <group rotation={[-0.18, 0, 0]}>
        <B p={[0, 0.15, 0]} s={[0.25, 0.34, 0.012]} c="#222" r={0.004} cast={false} />
        <mesh position={[0, 0.15, 0.008]}>
          <planeGeometry args={[0.23, 0.32]} />
          <meshStandardMaterial map={tex} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────────────────── the delivery box: closes when you place an order ───────────────────────── */
function DeliveryBox({ onOpenPanel }: { onOpenPanel: () => void }) {
  const lid = useRef<THREE.Group>(null);
  const bow = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const since = Date.now() - bouquet.get().orderedAt;
    const closed = bouquet.get().orderedAt > 0 && since < 5000;
    if (lid.current) lid.current.rotation.x += ((closed ? 0 : -1.9) - lid.current.rotation.x) * Math.min(1, dt * 5);
    if (bow.current) bow.current.visible = closed;
  });
  return (
    <group position={[2.9, 0, 0.9]} rotation={[0, -0.5, 0]}>
      <B p={[0, 0.2, 0]} s={[0.72, 0.4, 0.52]} c="#b98a58" r={0.012} rough={0.9} />
      <B p={[0, 0.2, 0.265]} s={[0.12, 0.4, 0.01]} c="#d62839" r={0.004} />
      <group ref={lid} position={[0, 0.4, -0.26]}>
        <B p={[0, 0.02, 0.26]} s={[0.76, 0.04, 0.56]} c="#c9a066" r={0.012} rough={0.9} />
        <group ref={bow} position={[0, 0.05, 0.26]}>
          <B p={[0, 0, 0]} s={[0.12, 0.012, 0.56]} c="#d62839" r={0.004} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.05, 0.03, 0]} rotation={[0, 0, s * 0.6]} scale={[1.6, 0.8, 0.8]}>
              <sphereGeometry args={[0.04, 12, 8]} />
              <meshStandardMaterial color="#d62839" roughness={0.35} />
            </mesh>
          ))}
        </group>
      </group>
      <Hit p={[0, 0.3, 0]} s={[0.9, 0.7, 0.7]} onClick={onOpenPanel} />
    </group>
  );
}

/* ───────────────────────── a floor bucket full of one kind of flower: click to start a bouquet with it ───────────────────────── */
function Bucket({ position, type, color, onPick }: { position: V3; type: FlowerType; color: string; onPick: () => void }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.34, 24]} />
        <meshStandardMaterial color="#aab3bd" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.012, 8, 24]} />
        <meshStandardMaterial color="#cfd6de" metalness={0.8} roughness={0.3} />
      </mesh>
      {Array.from({ length: 6 }).map((_, k) => {
        const a = (k * Math.PI * 2) / 6;
        const tilt = k === 0 ? 0.03 : 0.16;
        return (
          <Flower
            key={k}
            type={type}
            color={color}
            stem={0.6 + (k % 2) * 0.04}
            position={[Math.cos(a) * 0.05, 0.12, Math.sin(a) * 0.05]}
            rotation={[tilt * Math.sin(a), 0, -tilt * Math.cos(a)]}
            phase={k + position[2]}
          />
        );
      })}
      <Hit p={[0, 0.5, 0]} s={[0.55, 1.0, 0.55]} onClick={onPick} />
    </group>
  );
}

function Vase({
  position,
  flowers,
  scale = 1,
  onPick,
}: {
  position: V3;
  flowers: { type: FlowerType; color: string }[];
  scale?: number;
  onPick?: () => void;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.2, 18]} />
        <meshStandardMaterial color="#cdeaf4" transparent opacity={0.55} roughness={0.1} metalness={0.1} />
      </mesh>
      {flowers.map((f, k) => (
        <Flower
          key={k}
          type={f.type}
          color={f.color}
          stem={0.3 + k * 0.04}
          position={[(k - (flowers.length - 1) / 2) * 0.03, 0.06, 0]}
          rotation={[0, 0, (k - (flowers.length - 1) / 2) * 0.35]}
          scale={0.9}
          phase={k * 2 + position[0]}
        />
      ))}
      {onPick && <Hit p={[0, 0.25, 0]} s={[0.22, 0.6, 0.22]} onClick={onPick} />}
    </group>
  );
}

/* ───────────────────────── things to do: water the flowers, plant a seed, ring the bell ───────────────────────── */
function WateringCan({ onWater }: { onWater: () => void }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.z = -flowerFx.water * 0.7;
  });
  return (
    <group position={[-1.9, 0, 3.05]} rotation={[0, 2.2, 0]}>
      <group ref={g} position={[0, 0.17, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.26, 20]} />
          <meshStandardMaterial color="#3fbf7f" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0.2, 0.06, 0]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.018, 0.03, 0.3, 10]} />
          <meshStandardMaterial color="#3fbf7f" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0.34, 0.16, 0]} rotation={[0, 0, -0.9]}>
          <coneGeometry args={[0.04, 0.05, 12]} />
          <meshStandardMaterial color="#2c9965" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[-0.12, 0.02, 0]}>
          <torusGeometry args={[0.1, 0.012, 8, 20, Math.PI * 1.3]} />
          <meshStandardMaterial color="#2c9965" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
      <Hit p={[0.05, 0.3, 0]} s={[0.7, 0.6, 0.5]} onClick={onWater} />
    </group>
  );
}

// raindrops over the buckets and the workbench while the can is tipped
function Rain() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const drops = useMemo(() => {
    // deterministic scatter, so the rain is the same every load
    const h = (i: number, k: number) => {
      const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    return Array.from({ length: 70 }, (_, i) => ({
      x: i < 40 ? -2.75 + (h(i, 1) - 0.5) * 0.7 : 0.3 + (h(i, 1) - 0.5) * 1.2,
      z: i < 40 ? (h(i, 2) - 0.5) * 6.4 : 0.5 + (h(i, 2) - 0.5) * 1.2,
      y: h(i, 3) * 1.6,
      v: 1.8 + h(i, 4) * 1.2,
    }));
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame((_, dt) => {
    const mm = mesh.current;
    if (!mm) return;
    const on = flowerFx.water > 0.15;
    drops.forEach((d, i) => {
      d.y -= d.v * dt;
      if (d.y < 0.3) d.y = on ? 1.6 : -10;
      m.makeTranslation(d.x, d.y, d.z);
      mm.setMatrixAt(i, m);
    });
    mm.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 70]} frustumCulled={false}>
      <sphereGeometry args={[0.012, 6, 5]} />
      <meshBasicMaterial color="#9fd8ff" toneMapped={false} />
    </instancedMesh>
  );
}

function GrowPot() {
  const [stage, setStage] = useState(0);
  const [pick, setPick] = useState<{ type: FlowerType; color: string }>({ type: "tulip", color: "#ff8fb1" });
  const grow = useRef<THREE.Group>(null);
  const target = [0.001, 0.3, 0.65, 1][stage];
  useFrame((_, dt) => {
    if (grow.current) grow.current.scale.setScalar(grow.current.scale.x + (target - grow.current.scale.x) * Math.min(1, dt * 4));
  });
  const colors = ["#ff8fb1", "#e0314b", "#ffd84a", "#c9a7ff", "#ff8a3d", "#f6f2ea"];
  return (
    <group position={[0.85, 0.985, -3.0]}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.075, 0.12, 20]} />
        <meshStandardMaterial color="#c4623f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.092, 0.092, 0.012, 20]} />
        <meshStandardMaterial color="#3a2a20" roughness={1} />
      </mesh>
      <group ref={grow} position={[0, 0.12, 0]} scale={0.001}>
        <Flower type={pick.type} color={pick.color} stem={0.3} scale={1.1} />
      </group>
      <Hit
        p={[0, 0.25, 0]}
        s={[0.3, 0.5, 0.3]}
        onClick={() => {
          sound.click();
          if (stage === 0)
            setPick({
              type: FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)],
              color: colors[Math.floor(Math.random() * colors.length)],
            });
          setStage((s) => (s + 1) % 4);
        }}
      />
    </group>
  );
}

function Bell() {
  const dome = useRef<THREE.Mesh>(null);
  const ring = useRef(0);
  useFrame((_, dt) => {
    ring.current = Math.max(0, ring.current - dt * 3);
    if (dome.current) dome.current.position.y = 0.03 + Math.sin(ring.current * Math.PI) * 0.025;
  });
  return (
    <group position={[1.55, 0.985, -2.78]}>
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.016, 20]} />
        <meshStandardMaterial color="#b7893f" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={dome} position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e0b45a" metalness={0.9} roughness={0.2} />
      </mesh>
      <Hit
        p={[0, 0.05, 0]}
        s={[0.22, 0.14, 0.22]}
        onClick={() => {
          ring.current = 1;
          void sound.note(1568);
          setTimeout(() => void sound.note(2093), 120);
        }}
      />
    </group>
  );
}

/* ───────────────────────── chalkboards: what the flower you picked means, and how orders work ───────────────────────── */
function MeaningBoard() {
  const b = useBouquet();
  const tex = useMemo(() => canvasTexture(512, 384, () => undefined), []);
  useEffect(() => {
    const c = (tex.image as HTMLCanvasElement).getContext("2d");
    if (!c) return;
    c.fillStyle = "#1f2a26";
    c.fillRect(0, 0, 512, 384);
    c.strokeStyle = "#e9e4d4";
    c.globalAlpha = 0.5;
    c.lineWidth = 4;
    c.strokeRect(14, 14, 484, 356);
    c.globalAlpha = 1;
    const info = FLOWER_INFO[b.pickType];
    c.textAlign = "center";
    c.fillStyle = "#9fd8c4";
    c.font = "700 26px 'Segoe Print', 'Comic Sans MS', cursive";
    c.fillText("FLOWER OF THE MOMENT", 256, 70);
    c.fillStyle = b.pickColor;
    c.beginPath();
    c.arc(256, 150, 34, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#f3efe0";
    c.font = "700 48px 'Segoe Print', 'Comic Sans MS', cursive";
    c.fillText(info.name, 256, 252);
    c.font = "28px 'Segoe Print', 'Comic Sans MS', cursive";
    c.fillStyle = "#e9e4d4";
    c.fillText(info.meaning, 256, 310);
    tex.needsUpdate = true;
  }, [tex, b.pickType, b.pickColor]);
  return (
    <group position={[-3.47, 2.15, -2.4]} rotation={[0, Math.PI / 2, 0]}>
      <B p={[0, 0, 0]} s={[1.6, 1.2, 0.05]} c="#6a4a30" r={0.015} />
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.48, 1.1]} />
        <meshBasicMaterial map={tex} toneMapped={false} color="#d8d8d8" />
      </mesh>
    </group>
  );
}

function MenuBoard() {
  const tex = useMemo(
    () =>
      canvasTexture(512, 384, (c) => {
        c.fillStyle = "#1f2a26";
        c.fillRect(0, 0, 512, 384);
        c.strokeStyle = "#e9e4d4";
        c.globalAlpha = 0.5;
        c.lineWidth = 4;
        c.strokeRect(14, 14, 484, 356);
        c.globalAlpha = 1;
        c.textAlign = "center";
        c.fillStyle = "#f6c2d2";
        c.font = "700 34px 'Segoe Print', 'Comic Sans MS', cursive";
        c.fillText("HOW IT WORKS", 256, 70);
        c.fillStyle = "#e9e4d4";
        c.font = "26px 'Segoe Print', 'Comic Sans MS', cursive";
        ["1  pick your flowers", "2  choose wrap or basket", "3  write a gift card", "4  pick delivery, send!"].forEach((l, i) =>
          c.fillText(l, 256, 140 + i * 48),
        );
        c.font = "20px 'Segoe Print', 'Comic Sans MS', cursive";
        c.fillStyle = "#9fd8c4";
        c.fillText("(sends the order to my inbox)", 256, 345);
      }),
    [],
  );
  return (
    <group position={[-3.47, 2.15, 2.4]} rotation={[0, Math.PI / 2, 0]}>
      <B p={[0, 0, 0]} s={[1.6, 1.2, 0.05]} c="#6a4a30" r={0.015} />
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.48, 1.1]} />
        <meshBasicMaterial map={tex} toneMapped={false} color="#d8d8d8" />
      </mesh>
    </group>
  );
}

const BUCKETS: { type: FlowerType; color: string }[] = [
  { type: "rose", color: "#e0314b" },
  { type: "tulip", color: "#ff8fb1" },
  { type: "daisy", color: "#f6f2ea" },
  { type: "sunflower", color: "#ffd84a" },
  { type: "lily", color: "#9b6bff" },
  { type: "peony", color: "#ffb88a" },
  { type: "lavender", color: "#c9a7ff" },
  { type: "hydrangea", color: "#5aa9ff" },
  { type: "carnation", color: "#ff6f61" },
  { type: "orchid", color: "#e86ab0" },
];
const BUCKET_Z = (i: number) => -3.06 + i * 0.68;

const SHOP_HOTSPOTS: HotspotCfg[] = [
  { i: 15, label: "BOUQUET", pos: [0.3, 2.0, 0.5], hit: { pos: [0.3, 1.1, 0.5], size: [1.3, 1.6, 1.3] } },
];

const SHELF_COLORS = ["#ff8fb1", "#e0314b", "#f6f2ea", "#ffd84a", "#9b6bff", "#ff8a3d", "#5aa9ff", "#ffb88a"];

export default function FlowerShop({ section, onSelect }: { section: number; onSelect: (i: number) => void }) {
  const floor = useMemo(() => {
    const t = canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = "#efe3d2";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#e5c9c4";
      c.fillRect(0, 0, w / 2, h / 2);
      c.fillRect(w / 2, h / 2, w / 2, h / 2);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 5);
    return t;
  }, []);
  const sign = useMemo(
    () =>
      canvasTexture(512, 160, (c, w, h) => {
        c.fillStyle = "#2a1f24";
        c.fillRect(0, 0, w, h);
        c.strokeStyle = "#f5c2d2";
        c.lineWidth = 6;
        c.strokeRect(10, 10, w - 20, h - 20);
        c.fillStyle = "#ffe3ec";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = "italic 700 76px Georgia, 'Times New Roman', serif";
        c.fillText("Flower Shop", w / 2, h / 2 + 4);
      }),
    [],
  );
  const wall = "#d7c1b0";
  const dark = "#6a5648";
  const rainTimer = useRef(0);
  const pick = (type: FlowerType, color: string) => {
    sound.click();
    bouquet.pick(type, color);
    onSelect(15);
  };
  const water = () => {
    sound.click();
    void sound.note(660);
    flowerFx.water = 1;
    rainTimer.current = 2.6;
  };
  useFrame((_, dt) => {
    // the water effect lingers while it "rains", then fades
    if (rainTimer.current > 0) {
      rainTimer.current -= dt;
      flowerFx.water = Math.max(flowerFx.water, 0.7);
    } else flowerFx.water = Math.max(0, flowerFx.water - dt * 0.8);
  });

  return (
    <group>
      {/* floor */}
      <B p={[0, -0.15, 0]} s={[7.5, 0.3, 7.5]} c="#3a2f2b" r={0.04} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={floor} roughness={0.5} />
      </mesh>

      {/* right wall (counter and shelves) */}
      <B p={[-0.05, 1.8, -3.6]} s={[7.5, 3.6, 0.2]} c={wall} rough={0.92} r={0.01} />
      <B p={[0, 0.08, -3.465]} s={[7, 0.16, 0.05]} c={dark} />
      {/* left wall with the shop window */}
      <B p={[-3.6, 0.55, 0]} s={[0.2, 1.1, 7.5]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 3.25, 0]} s={[0.2, 0.7, 7.5]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 2.0, -2.4]} s={[0.2, 1.8, 2.6]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 2.0, 2.4]} s={[0.2, 1.8, 2.6]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.465, 0.08, 0]} s={[0.05, 0.16, 7]} c={dark} />
      <B p={[-3.46, 2.92, 0]} s={[0.1, 0.07, 2.3]} c="#4a3a30" />
      <B p={[-3.43, 1.09, 0]} s={[0.17, 0.07, 2.4]} c="#4a3a30" />
      <B p={[-3.46, 2.0, -1.1]} s={[0.1, 1.84, 0.07]} c="#4a3a30" />
      <B p={[-3.46, 2.0, 1.1]} s={[0.1, 1.84, 0.07]} c="#4a3a30" />
      <B p={[-3.47, 2.0, 0]} s={[0.05, 1.84, 0.045]} c="#4a3a30" />
      <MeaningBoard />
      <MenuBoard />

      {/* the shop sign */}
      <group position={[1.9, 2.55, -3.44]}>
        <B p={[0, 0, 0]} s={[1.5, 0.5, 0.05]} c="#2a1f24" r={0.02} />
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[1.44, 0.45]} />
          <meshBasicMaterial map={sign} toneMapped={false} color="#e6e6e6" />
        </mesh>
      </group>

      {/* shelves: every vase is clickable and starts a bouquet with its flower */}
      {[0.85, 1.45, 2.05].map((y, row) => (
        <group key={y}>
          <B p={[-1.6, y, -3.3]} s={[2.7, 0.05, 0.36]} c="#8a6a4b" r={0.01} rough={0.6} />
          {[-2.75, -2.2, -1.65, -1.1, -0.55].map((x, k) => {
            const t1 = FLOWER_TYPES[(row * 3 + k * 2) % FLOWER_TYPES.length];
            const t2 = FLOWER_TYPES[(row * 3 + k * 2 + 3) % FLOWER_TYPES.length];
            const c1 = SHELF_COLORS[(row * 2 + k) % SHELF_COLORS.length];
            const c2 = SHELF_COLORS[(row + k * 3 + 2) % SHELF_COLORS.length];
            return (
              <Vase
                key={x}
                position={[x, y + 0.025, -3.3]}
                scale={0.92}
                flowers={[
                  { type: t1, color: c1 },
                  { type: t2, color: c2 },
                ]}
                onPick={() => pick(t1, c1)}
              />
            );
          })}
        </group>
      ))}

      {/* counter */}
      <B p={[1.9, 0.475, -3.05]} s={[2.5, 0.95, 0.72]} c="#7a5a3d" r={0.02} rough={0.6} />
      <B p={[1.9, 0.96, -3.05]} s={[2.62, 0.05, 0.8]} c="#a37b52" r={0.015} rough={0.5} />
      <B p={[1.2, 1.1, -3.05]} s={[0.36, 0.22, 0.3]} c="#2b3040" r={0.02} />
      <B p={[1.2, 1.18, -2.9]} s={[0.3, 0.1, 0.02]} c="#46e0ff" r={0.004} />
      <mesh position={[2.35, 1.1, -3.0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 20]} />
        <meshStandardMaterial color="#f4c6d0" roughness={0.8} />
      </mesh>
      <Vase position={[2.85, 0.985, -3.0]} flowers={[{ type: "tulip", color: "#ff8a3d" }, { type: "rose", color: "#ff8fb1" }]} />
      <GrowPot />
      <Bell />

      {/* floor buckets along the window wall: click one to start a bouquet with it */}
      {BUCKETS.map((b, i) => (
        <Bucket key={b.type} position={[-2.75, 0, BUCKET_Z(i)]} type={b.type} color={b.color} onPick={() => pick(b.type, b.color)} />
      ))}

      {/* a display table with big arrangements */}
      <group position={[1.25, 0, 2.6]}>
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.62, 0.62, 0.05, 36]} />
          <meshStandardMaterial color="#a37b52" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.7, 14]} />
          <meshStandardMaterial color="#4a3a30" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.34, 0.36, 0.04, 28]} />
          <meshStandardMaterial color="#4a3a30" roughness={0.6} />
        </mesh>
        <Vase position={[-0.22, 0.725, 0.05]} scale={1.6} flowers={[{ type: "peony", color: "#ffb88a" }, { type: "hydrangea", color: "#5aa9ff" }, { type: "peony", color: "#ff8fb1" }]} onPick={() => pick("peony", "#ffb88a")} />
        <Vase position={[0.2, 0.725, -0.08]} scale={1.6} flowers={[{ type: "lavender", color: "#c9a7ff" }, { type: "orchid", color: "#e86ab0" }, { type: "lavender", color: "#9b6bff" }]} onPick={() => pick("orchid", "#e86ab0")} />
        <Vase position={[0.05, 0.725, 0.25]} scale={1.6} flowers={[{ type: "sunflower", color: "#ffd84a" }, { type: "carnation", color: "#ff6f61" }, { type: "daisy", color: "#f6f2ea" }]} onPick={() => pick("sunflower", "#ffd84a")} />
      </group>

      {/* the bouquet workbench */}
      <group position={[0.3, 0, 0.5]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[0.38, 0.4, 0.04, 32]} />
          <meshStandardMaterial color="#4a3a30" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.78, 16]} />
          <meshStandardMaterial color="#4a3a30" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.79, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.62, 0.62, 0.05, 40]} />
          <meshStandardMaterial color="#a37b52" roughness={0.45} />
        </mesh>
        <group position={[0, 0.815, 0]}>
          <BouquetModel />
          <GiftCard />
        </group>
      </group>

      <DeliveryBox onOpenPanel={() => onSelect(15)} />
      <WateringCan onWater={water} />
      <Rain />

      <Plant p={[2.9, 0, 2.2]} scale={1.1} />
      <Plant p={[-1.1, 0, 3.1]} scale={0.9} />
      <pointLight position={[0.3, 2.6, 0.5]} color="#ffe3d0" intensity={3} distance={6} decay={2} />

      <Hotspots section={section} onSelect={onSelect} list={SHOP_HOTSPOTS} roomId="flowers" overview={14} />
    </group>
  );
}
