/* eslint-disable react-hooks/immutability -- textures are updated in place when the painting or the letter changes */
"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { letter } from "@/lib/letter";
import { paint } from "@/lib/painting";
import { type V3 } from "./Hit";
import { Hotspots, type HotspotCfg } from "./Props";
import { B, Lit, Plant } from "./Room";
import { canvasTexture, plankTexture } from "./textures";

const ATELIER_HOTSPOTS: HotspotCfg[] = [
  { i: 17, label: "PAINT", pos: [-1.5, 2.3, -1.9], hit: { pos: [-1.5, 1.3, -1.9], size: [1.5, 1.5, 0.6] } },
  { i: 18, label: "WRITE", pos: [1.9, 1.7, -3.0], hit: { pos: [1.9, 0.9, -3.0], size: [2.0, 0.8, 0.9] } },
];

// the canvas on the easel IS the paint panel's canvas
function EaselCanvas() {
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(paint.canvas());
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(
    () =>
      paint.subscribe(() => {
        tex.needsUpdate = true;
      }),
    [tex],
  );
  return (
    <mesh position={[0, 0, 0.026]}>
      <planeGeometry args={[1.2, 0.9]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

function Easel() {
  return (
    <group position={[-1.5, 0, -1.9]}>
      {/* legs */}
      <B p={[-0.5, 0.75, 0.25]} s={[0.05, 1.55, 0.05]} c="#9b7449" rot={[-0.18, 0, -0.1]} rough={0.7} r={0.01} />
      <B p={[0.5, 0.75, 0.25]} s={[0.05, 1.55, 0.05]} c="#9b7449" rot={[-0.18, 0, 0.1]} rough={0.7} r={0.01} />
      <B p={[0, 0.8, -0.35]} s={[0.05, 1.6, 0.05]} c="#8a653d" rot={[0.28, 0, 0]} rough={0.7} r={0.01} />
      {/* the board, leaning back a little, and its tray */}
      <group position={[0, 1.4, 0]} rotation={[-0.12, 0, 0]}>
        <B p={[0, 0, 0]} s={[1.32, 1.02, 0.04]} c="#ece5d3" rough={0.8} r={0.01} />
        <EaselCanvas />
        <B p={[0, -0.56, 0.1]} s={[1.3, 0.05, 0.2]} c="#9b7449" rough={0.7} r={0.01} />
        <B p={[0, 0.54, 0.04]} s={[0.4, 0.05, 0.1]} c="#9b7449" rough={0.7} r={0.01} />
      </group>
    </group>
  );
}

function Stool() {
  return (
    <group position={[-0.5, 0, -0.9]}>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
        <meshStandardMaterial color="#2c3a52" roughness={0.8} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <B key={i} p={[Math.cos((i / 3) * Math.PI * 2) * 0.12, 0.25, Math.sin((i / 3) * Math.PI * 2) * 0.12]} s={[0.035, 0.5, 0.035]} c="#8a653d" r={0.01} />
      ))}
    </group>
  );
}

// paint cart: palette, jars, brushes
function PaintCart() {
  const dots = ["#e0314b", "#ffd84a", "#3fbf7f", "#5aa9ff", "#9b6bff", "#ff8a3d"];
  return (
    <group position={[-3.0, 0, -2.6]}>
      <B p={[0, 0.4, 0]} s={[0.7, 0.8, 0.5]} c="#2b2530" r={0.02} rough={0.7} />
      <B p={[0, 0.82, 0]} s={[0.76, 0.05, 0.56]} c="#5b4b3a" r={0.01} />
      {/* palette */}
      <mesh position={[-0.12, 0.86, 0.04]} rotation={[0, 0.3, 0]} scale={[1, 1, 0.7]}>
        <cylinderGeometry args={[0.2, 0.2, 0.015, 28]} />
        <meshStandardMaterial color="#d8c19a" roughness={0.8} />
      </mesh>
      {dots.map((c, i) => (
        <mesh key={c} position={[-0.12 + Math.cos(i * 1.0 + 0.4) * 0.13, 0.872, 0.04 + Math.sin(i * 1.0 + 0.4) * 0.07]}>
          <sphereGeometry args={[0.028, 10, 8]} />
          <meshStandardMaterial color={c} roughness={0.4} />
        </mesh>
      ))}
      {/* jars + brushes */}
      <mesh position={[0.22, 0.92, -0.08]}>
        <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
        <meshStandardMaterial color="#9fd3e6" roughness={0.2} transparent opacity={0.75} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <B key={i} p={[0.22 + (i - 1) * 0.02, 1.04, -0.08 + (i - 1) * 0.01]} s={[0.012, 0.22, 0.012]} c={["#c46b5a", "#3a7ca5", "#d4af37"][i]} rot={[0.1 * (i - 1), 0, 0.15 * (i - 1)]} r={0.004} />
      ))}
      <mesh position={[0.22, 0.9, 0.15]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 14]} />
        <meshStandardMaterial color="#e0314b" roughness={0.4} />
      </mesh>
    </group>
  );
}

// the letter on the desk: whatever has been typed so far, in handwriting
function Paper() {
  const tex = useMemo(
    () =>
      canvasTexture(512, 724, (c, w, h) => {
        c.fillStyle = "#fbf6e9";
        c.fillRect(0, 0, w, h);
      }),
    [],
  );
  useEffect(() => {
    const draw = () => {
      const cv = tex.image as HTMLCanvasElement;
      const c = cv.getContext("2d");
      if (!c) return;
      const { name, text } = letter.get();
      c.fillStyle = "#fbf6e9";
      c.fillRect(0, 0, 512, 724);
      c.strokeStyle = "rgba(90,120,180,0.18)";
      c.lineWidth = 1;
      for (let y = 90; y < 700; y += 34) {
        c.beginPath();
        c.moveTo(34, y);
        c.lineTo(478, y);
        c.stroke();
      }
      c.fillStyle = "#1d2a55";
      c.font = "italic 26px 'Segoe Script', 'Brush Script MT', cursive";
      c.textBaseline = "alphabetic";
      const lines: string[] = [];
      for (const para of (text || "Dear friend,").split("\n")) {
        let line = "";
        for (const word of para.split(" ")) {
          const t = line ? line + " " + word : word;
          if (c.measureText(t).width > 430 && line) {
            lines.push(line);
            line = word;
          } else line = t;
        }
        lines.push(line);
      }
      lines.slice(0, 17).forEach((l, i) => c.fillText(l, 38, 84 + i * 34));
      if (name) c.fillText("- " + name, 290, 690);
      tex.needsUpdate = true;
    };
    draw();
    return letter.subscribe(draw);
  }, [tex]);
  return (
    <mesh position={[1.6, 0.815, -2.95]} rotation={[-Math.PI / 2, 0, 0.12]} receiveShadow>
      <planeGeometry args={[0.46, 0.65]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

function WritingDesk() {
  return (
    <group>
      <B p={[1.9, 0.78, -3.05]} s={[2.1, 0.06, 0.9]} c="#6b4a32" r={0.015} rough={0.55} />
      <B p={[0.95, 0.39, -3.05]} s={[0.06, 0.78, 0.84]} c="#4a3322" r={0.01} />
      <B p={[2.85, 0.39, -3.05]} s={[0.06, 0.78, 0.84]} c="#4a3322" r={0.01} />
      <B p={[2.45, 0.4, -3.05]} s={[0.8, 0.74, 0.82]} c="#4a3322" r={0.015} />
      {[0.52, 0.28].map((y) => (
        <B key={y} p={[2.45, y, -2.63]} s={[0.66, 0.2, 0.02]} c="#5b4230" r={0.008} />
      ))}
      <Paper />
      {/* pen, ink, envelopes, mug */}
      <B p={[1.28, 0.83, -2.85]} s={[0.012, 0.012, 0.2]} c="#17171d" rot={[0, 0.5, 0]} r={0.005} />
      <mesh position={[1.2, 0.84, -3.25]}>
        <cylinderGeometry args={[0.04, 0.05, 0.08, 16]} />
        <meshStandardMaterial color="#1a1f3a" roughness={0.3} metalness={0.4} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <B key={i} p={[2.15, 0.835 + i * 0.012, -3.05]} s={[0.3, 0.012, 0.2]} c="#f1e8d4" rot={[0, 0.2 * i - 0.2, 0]} r={0.004} />
      ))}
      <mesh position={[2.55, 0.86, -3.3]}>
        <cylinderGeometry args={[0.04, 0.035, 0.09, 14]} />
        <meshStandardMaterial color="#e9ecf5" roughness={0.4} />
      </mesh>
      {/* lamp */}
      <B p={[1.2, 0.82, -3.35]} s={[0.12, 0.03, 0.12]} c="#17171d" r={0.01} />
      <B p={[1.2, 1.12, -3.35]} s={[0.025, 0.6, 0.025]} c="#17171d" r={0.01} rot={[0.1, 0, 0]} />
      <mesh position={[1.2, 1.45, -3.28]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.13, 0.14, 20, 1, true]} />
        <meshBasicMaterial color="#ffe1a8" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[1.25, 1.35, -3.0]} color="#ffd9a0" intensity={1.4} distance={3.2} decay={2} />
      {/* shelf above the desk */}
      <B p={[1.9, 1.95, -3.45]} s={[2.0, 0.05, 0.25]} c="#6b4a32" r={0.01} />
      {[0, 1, 2, 3, 4].map((i) => (
        <B key={i} p={[1.1 + i * 0.1, 2.12, -3.45]} s={[0.07, 0.28 - (i % 2) * 0.04, 0.18]} c={["#c46b5a", "#3a7ca5", "#d4af37", "#5a8f6b", "#8a5fa8"][i]} r={0.008} />
      ))}
      <Lit p={[2.5, 1.9, -3.45]} s={[0.4, 0.015, 0.02]} c="#46e0ff" />
      <Chair />
    </group>
  );
}

function Chair() {
  return (
    <group position={[1.9, 0, -2.2]}>
      <B p={[0, 0.5, 0]} s={[0.55, 0.07, 0.55]} c="#36405c" r={0.02} />
      <B p={[0, 0.85, 0.26]} s={[0.55, 0.62, 0.07]} c="#36405c" r={0.02} />
      {[
        [-0.23, -0.23],
        [0.23, -0.23],
        [-0.23, 0.23],
        [0.23, 0.23],
      ].map(([x, z], i) => (
        <B key={i} p={[x, 0.24, z]} s={[0.045, 0.48, 0.045]} c="#17171d" r={0.01} />
      ))}
    </group>
  );
}

function Frame({ p, hue }: { p: V3; hue: number }) {
  const map = useMemo(
    () =>
      canvasTexture(256, 340, (c, w, h) => {
        c.fillStyle = "#f1ecde";
        c.fillRect(0, 0, w, h);
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, `hsl(${hue} 75% 40%)`);
        g.addColorStop(1, `hsl(${hue + 70} 85% 64%)`);
        c.fillStyle = g;
        c.fillRect(20, 20, w - 40, h - 40);
        for (let i = 0; i < 7; i++) {
          c.fillStyle = `hsla(${hue + i * 40} 90% ${55 + i * 3}% / 0.55)`;
          c.beginPath();
          c.arc(40 + ((i * 53) % 180), 60 + ((i * 71) % 200), 22 + ((i * 13) % 26), 0, Math.PI * 2);
          c.fill();
        }
      }),
    [hue],
  );
  return (
    <group position={p}>
      <B p={[0, 0, 0]} s={[0.84, 1.14, 0.05]} c="#17171d" r={0.01} />
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.72, 1.02]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function Atelier({ section, onSelect }: { section: number; onSelect: (i: number) => void }) {
  const planks = useMemo(() => plankTexture(18), []);
  const splat = useMemo(
    () =>
      canvasTexture(512, 512, (c, w, h) => {
        c.fillStyle = "#e9e1cf";
        c.fillRect(0, 0, w, h);
        const cols = ["#e0314b", "#ffd84a", "#3fbf7f", "#5aa9ff", "#9b6bff", "#ff8a3d"];
        for (let i = 0; i < 70; i++) {
          c.fillStyle = cols[i % cols.length];
          c.globalAlpha = 0.65;
          c.beginPath();
          c.arc((i * 97) % w, (i * 61 + (i % 7) * 37) % h, 3 + ((i * 13) % 14), 0, Math.PI * 2);
          c.fill();
        }
      }),
    [],
  );
  const wall = "#5a4a45";
  const dark = "#171219";

  return (
    <group>
      {/* floor + paint-splattered drop cloth */}
      <B p={[0, -0.15, 0]} s={[7.5, 0.3, 7.5]} c="#1b1722" r={0.04} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={planks} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.012, -0.5]} receiveShadow>
        <planeGeometry args={[3.4, 3.4]} />
        <meshStandardMaterial map={splat} roughness={1} />
      </mesh>

      {/* the back wall, with finished paintings */}
      <B p={[-0.05, 1.8, -3.6]} s={[7.5, 3.6, 0.2]} c={wall} rough={0.92} r={0.01} />
      <B p={[0, 0.08, -3.465]} s={[7, 0.16, 0.05]} c={dark} />
      <Frame p={[-2.75, 2.2, -3.45]} hue={20} />
      <Frame p={[-1.5, 2.55, -3.45]} hue={200} />
      <Frame p={[-0.25, 2.2, -3.45]} hue={310} />

      {/* the left wall, with the doorway to the gallery */}
      <B p={[-3.6, 1.8, -2.2]} s={[0.2, 3.6, 3.0]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 1.8, 2.2]} s={[0.2, 3.6, 3.0]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 2.95, 0]} s={[0.2, 1.3, 1.4]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.5, 1.15, -0.7]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[-3.5, 1.15, 0.7]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[-3.465, 0.08, 0]} s={[0.05, 0.16, 7]} c={dark} />

      <Easel />
      <Stool />
      <PaintCart />
      <WritingDesk />
      <Plant p={[3.0, 0, 1.2]} scale={1.1} />
      <Plant p={[-3.0, 0, 2.9]} scale={1.0} />
      <pointLight position={[-0.4, 2.7, 0.2]} color="#ffe6c8" intensity={1.5} distance={6} decay={2} />

      <Hotspots section={section} onSelect={onSelect} list={ATELIER_HOTSPOTS} roomId="atelier" overview={16} />
    </group>
  );
}
