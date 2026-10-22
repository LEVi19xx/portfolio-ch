"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AWARDS } from "@/content/content";
import { sound } from "@/lib/sound";
import { Hit } from "./Hit";
import PhotoBooth from "./PhotoBooth";
import { Hotspots, type HotspotCfg } from "./Props";
import { B, Lit } from "./Room";
import { canvasTexture } from "./textures";

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (c.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

// a framed certificate; `big` is the readable face used when it is picked
function certTexture(a: (typeof AWARDS)[number], big: boolean, hue: number) {
  const W = big ? 512 : 256;
  const H = big ? 660 : 330;
  const k = W / 256;
  return canvasTexture(W, H, (c, w, h) => {
    c.fillStyle = "#f2ecda";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#a88a45";
    c.lineWidth = 3 * k;
    c.strokeRect(14 * k, 14 * k, w - 28 * k, h - 28 * k);
    c.lineWidth = 1 * k;
    c.strokeRect(22 * k, 22 * k, w - 44 * k, h - 44 * k);
    c.textAlign = "center";
    c.fillStyle = "#6b5a30";
    c.font = `600 ${11 * k}px ui-monospace, Consolas, monospace`;
    c.fillText("CERTIFICATE OF RECOGNITION", w / 2, 56 * k);
    c.fillStyle = "#1d1a14";
    c.font = `700 ${25 * k}px Georgia, "Times New Roman", serif`;
    let y = 100 * k;
    wrap(c, a.title, w - 70 * k).forEach((l) => {
      c.fillText(l, w / 2, y);
      y += 30 * k;
    });
    c.fillStyle = "#6b5a30";
    c.font = `italic ${15 * k}px Georgia, serif`;
    c.fillText(a.org, w / 2, y + 6 * k);
    if (big) {
      c.fillStyle = "#3c3524";
      c.font = "400 22px Georgia, serif";
      let ny = y + 60;
      wrap(c, a.note, w - 90).forEach((l) => {
        c.fillText(l, w / 2, ny);
        ny += 32;
      });
    }
    // gold seal
    const sy = h - 78 * k;
    c.fillStyle = "#c79a3a";
    c.beginPath();
    for (let i = 0; i < 24; i++) {
      const r = i % 2 ? 26 * k : 30 * k;
      const ang = (i * Math.PI) / 12;
      c.lineTo(w / 2 + Math.cos(ang) * r, sy + Math.sin(ang) * r);
    }
    c.closePath();
    c.fill();
    c.fillStyle = `hsl(${hue} 70% 30%)`;
    c.font = `800 ${13 * k}px ui-monospace, Consolas, monospace`;
    c.fillText(a.year, w / 2, sy + 5 * k);
  });
}

/* ───────────────────────── the framed awards: pick one and it comes forward ───────────────────────── */
function Awards({ active }: { active: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const [selected, setSelected] = useState(0);
  const sel = active ? selected : -1;
  const small = useMemo(() => AWARDS.map((a, i) => certTexture(a, false, 40 + i * 20)), []);
  const big = useMemo(() => AWARDS.map((a, i) => certTexture(a, true, 40 + i * 20)), []);
  const xs = [-2.55, -0.85, 0.85, 2.55];

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 6);
    refs.current.forEach((g, i) => {
      if (!g) return;
      const on = sel === i;
      g.position.x += ((on ? 0 : xs[i]) - g.position.x) * k;
      g.position.z += ((on ? 0.6 : 0) - g.position.z) * k;
      const s = g.scale.x + ((on ? 1.06 : 1) - g.scale.x) * k;
      g.scale.setScalar(s);
      const m = mats.current[i];
      if (m) {
        const c = sel >= 0 && !on ? 0.3 : 0.88;
        m.color.setScalar(m.color.r + (c - m.color.r) * k);
      }
    });
  });

  return (
    <group position={[0, 1.9, -3.44]}>
      {AWARDS.map((a, i) => (
        <group key={a.title} position={[xs[i], 0, 0]} ref={(el) => void (refs.current[i] = el)}>
          <B p={[0, 0, 0]} s={[1.0, 1.3, 0.05]} c="#0c0d12" r={0.012} />
          <mesh position={[0, 0, 0.028]}>
            <planeGeometry args={[0.9, 1.2]} />
            <meshBasicMaterial ref={(el) => void (mats.current[i] = el)} map={sel === i ? big[i] : small[i]} toneMapped={false} color="#e0e0e0" />
          </mesh>
          <Lit p={[0, 0.84, 0.0]} s={[0.9, 0.03, 0.03]} c="#ffe2b0" />
          <Hit
            p={[0, 0, 0.06]}
            s={[1.05, 1.35, 0.08]}
            always
            off={!active}
            onClick={() => {
              sound.click();
              setSelected(i);
            }}
          />
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── the trophy on its pedestal ───────────────────────── */
function Trophy() {
  const g = useRef<THREE.Group>(null);
  const cup = useMemo(() => {
    const pts = [
      [0.0, 0.0], [0.13, 0.0], [0.13, 0.025], [0.05, 0.05], [0.04, 0.17], [0.12, 0.22],
      [0.17, 0.34], [0.2, 0.46], [0.18, 0.47], [0.0, 0.4],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return pts;
  }, []);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.5;
  });
  return (
    <group position={[0.2, 0, 0.7]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.9, 40]} />
        <meshStandardMaterial color="#e9ecf5" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.915, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.03, 40]} />
        <meshStandardMaterial color="#c4c8d2" metalness={0.7} roughness={0.25} />
      </mesh>
      <group ref={g} position={[0, 0.93, 0]}>
        <mesh castShadow>
          <latheGeometry args={[cup, 28]} />
          <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.2, 0.33, 0]} rotation={[0, 0, s * 0.2]}>
            <torusGeometry args={[0.075, 0.014, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.22} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const GALLERY_HOTSPOTS: HotspotCfg[] = [
  { i: 9, label: "AWARDS", pos: [0, 3.05, -3.0], hit: { pos: [0, 1.9, -3.2], size: [6.4, 1.9, 0.5] } },
  { i: 20, label: "PHOTOBOOTH", pos: [2.6, 3.2, -1.9], hit: { pos: [2.6, 1.2, -1.9], size: [1.4, 2.4, 1.4] } },
];

export default function Gallery({
  section,
  onSelect,
}: {
  section: number;
  onSelect: (i: number) => void;
}) {
  const floor = useMemo(() => {
    const t = canvasTexture(512, 512, (c, w, h) => {
      c.fillStyle = "#222637";
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "#34394e";
      c.lineWidth = 3;
      for (let i = 0; i <= 4; i++) {
        c.beginPath();
        c.moveTo((i * w) / 4, 0);
        c.lineTo((i * w) / 4, h);
        c.moveTo(0, (i * h) / 4);
        c.lineTo(w, (i * h) / 4);
        c.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3.5, 3.5);
    return t;
  }, []);
  const art = useMemo(
    () =>
      [0, 1].map((n) =>
        canvasTexture(256, 340, (c, w, h) => {
          c.fillStyle = "#101219";
          c.fillRect(0, 0, w, h);
          const g = c.createRadialGradient(w * 0.4, h * 0.4, 8, w * 0.5, h * 0.5, w);
          g.addColorStop(0, n ? "#ff7a8a" : "#6ad7ff");
          g.addColorStop(0.5, n ? "#7a3b8c" : "#3a4fb0");
          g.addColorStop(1, "#0b0d14");
          c.fillStyle = g;
          c.fillRect(0, 0, w, h);
          c.strokeStyle = "rgba(255,255,255,0.55)";
          c.lineWidth = 3;
          c.beginPath();
          c.arc(w * 0.5, h * 0.45, 70, 0, Math.PI * 2);
          c.stroke();
        }),
      ),
    [],
  );
  const wall = "#2d3246";

  return (
    <group>
      {/* floor: glossy dark tiles */}
      <B p={[0, -0.15, 0]} s={[7.5, 0.3, 7.5]} c="#0e1016" r={0.04} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={floor} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* walls */}
      <B p={[-0.05, 1.8, -3.6]} s={[7.5, 3.6, 0.2]} c={wall} rough={0.9} r={0.01} />
      <B p={[-3.6, 1.8, -2.2]} s={[0.2, 3.6, 3]} c={wall} rough={0.9} r={0.01} />
      <B p={[-3.6, 1.8, 2.2]} s={[0.2, 3.6, 3]} c={wall} rough={0.9} r={0.01} />
      <B p={[-3.6, 2.95, 0]} s={[0.2, 1.3, 1.4]} c={wall} rough={0.9} r={0.01} />
      <B p={[-3.5, 1.15, -0.7]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[-3.5, 1.15, 0.7]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[0, 0.08, -3.465]} s={[7, 0.16, 0.05]} c="#0d0f14" />
      <B p={[-3.465, 0.08, 0]} s={[0.05, 0.16, 7]} c="#0d0f14" />
      {/* big canvases on the left wall */}
      {[-1.5, 1.5].map((z, i) => (
        <group key={z} position={[-3.46, 1.9, z]} rotation={[0, Math.PI / 2, 0]}>
          <B p={[0, 0, 0]} s={[1.1, 1.5, 0.05]} c="#0c0e15" />
          <mesh position={[0, 0, 0.028]}>
            <planeGeometry args={[1.0, 1.4]} />
            <meshStandardMaterial map={art[i]} roughness={0.8} />
          </mesh>
          <Lit p={[0, 0.88, 0.0]} s={[1.0, 0.03, 0.03]} c="#ffe2b0" />
        </group>
      ))}

      <Awards active={section === 9} />
      <pointLight position={[0, 2.9, -2.6]} color="#ffe5c0" intensity={16} distance={6.5} decay={2} />
      <pointLight position={[0.2, 2.6, 0.9]} color="#ffe9c9" intensity={4.5} distance={5} decay={2} />

      <Trophy />
      {/* a bench to sit and look */}
      <B p={[-1.7, 0.21, 1.9]} s={[1.8, 0.42, 0.52]} c="#2a2d38" r={0.05} rough={0.55} />
      <B p={[-1.7, 0.44, 1.9]} s={[1.74, 0.06, 0.46]} c="#3b3f4e" r={0.03} rough={0.7} />
      <B p={[-1.7, 0.02, 1.9]} s={[1.9, 0.04, 0.6]} c="#0e1016" r={0.01} />

      <PhotoBooth onOpen={() => onSelect(20)} />
      <Hotspots section={section} onSelect={onSelect} list={GALLERY_HOTSPOTS} roomId="gallery" overview={8} />
    </group>
  );
}
