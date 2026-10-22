"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { INTERESTS } from "@/content/content";
import { sound } from "@/lib/sound";
import { useAccent } from "./accent";
import { pointerOff, type V3 } from "./Hit";
import { Hotspots, type HotspotCfg } from "./Props";
import { B, Lit, Plant } from "./Room";
import { canvasTexture, plankTexture } from "./textures";

/* ───────────────────────── the TV: what I am into, as a little channel guide ───────────────────────── */
const TW = 1600;
const TH = 896;
type Rect = { x: number; y: number; w: number; h: number };

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function makeTV() {
  const cv = document.createElement("canvas");
  cv.width = TW;
  cv.height = TH;
  const ctx = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  let last = 0;
  const ui = { selected: 0, hover: -1, rows: [] as Rect[] };
  const sans = 'system-ui, "Segoe UI", Roboto, sans-serif';
  const mono = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
  const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const locate = (u: number, v: number) => {
    const x = u * TW;
    const y = (1 - v) * TH;
    return ui.rows.findIndex((r) => inRect(r, x, y));
  };

  const draw = (t: number, hue: number) => {
    if (t - last < 1 / 20) return;
    last = t;
    const acc = (l: number, a = 1) => `hsl(${hue} 90% ${l}% / ${a})`;
    const g = ctx.createLinearGradient(0, 0, TW, TH);
    g.addColorStop(0, "#0a0d1c");
    g.addColorStop(1, "#150f26");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TW, TH);

    // top bar
    ctx.textAlign = "left";
    ctx.fillStyle = acc(66);
    ctx.font = `700 26px ${mono}`;
    ctx.fillText("◉ LOUNGE.TV", 44, 62);
    ctx.textAlign = "right";
    ctx.fillStyle = "#7d86a6";
    ctx.font = `500 24px ${mono}`;
    ctx.fillText(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), TW - 44, 62);
    ctx.textAlign = "left";

    // channel list
    ui.rows.length = 0;
    INTERESTS.forEach((it, i) => {
      const r = { x: 44, y: 110 + i * 132, w: 520, h: 116 };
      ui.rows.push(r);
      const sel = ui.selected === i;
      const hov = ui.hover === i;
      ctx.fillStyle = sel ? acc(58, 0.18) : hov ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 16);
      ctx.fill();
      if (sel) {
        ctx.strokeStyle = acc(64, 0.8);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.font = `600 22px ${mono}`;
      ctx.fillStyle = acc(68, 0.9);
      ctx.fillText("CH " + String(i + 1).padStart(2, "0"), r.x + 28, r.y + 40);
      ctx.font = `700 42px ${sans}`;
      ctx.fillStyle = sel || hov ? "#fff" : "#c3cadd";
      ctx.fillText(it.name, r.x + 28, r.y + 92);
    });

    // now showing
    const it = INTERESTS[ui.selected];
    const x0 = 640;
    ctx.font = `600 24px ${mono}`;
    ctx.fillStyle = acc(70);
    ctx.fillText("NOW SHOWING", x0, 150);
    ctx.font = `800 118px ${sans}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(it.name, x0, 270);
    ctx.font = `400 34px ${sans}`;
    ctx.fillStyle = "#b7c0d8";
    let y = 350;
    wrapText(ctx, it.blurb, 880).forEach((l) => {
      ctx.fillText(l, x0, y);
      y += 50;
    });
    ctx.fillStyle = acc(60, 0.16);
    ctx.beginPath();
    ctx.roundRect(x0, y + 14, 700, 68, 34);
    ctx.fill();
    ctx.font = `600 28px ${mono}`;
    ctx.fillStyle = acc(78);
    ctx.fillText("▶ " + it.now, x0 + 30, y + 58);
    // tags
    ctx.font = `500 24px ${mono}`;
    let cx = x0;
    it.tags.forEach((tag) => {
      const w = ctx.measureText(tag).width + 40;
      ctx.strokeStyle = acc(60, 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx, y + 118, w, 52, 26);
      ctx.stroke();
      ctx.fillStyle = acc(76);
      ctx.fillText(tag, cx + 20, y + 153);
      cx += w + 14;
    });

    // equalizer: dances when the speaker is playing
    const playing = sound.isMusicOn();
    const beat = sound.beat();
    for (let i = 0; i < 28; i++) {
      const base = playing ? 0.35 + 0.5 * Math.abs(Math.sin(t * 3 + i * 0.7)) + beat * 0.3 : 0.08 + 0.04 * Math.sin(t + i);
      const h = 120 * Math.min(1, base);
      ctx.fillStyle = acc(62, 0.8);
      ctx.fillRect(TW - 520 + i * 17, TH - 70 - h, 10, h);
    }
    ctx.font = `500 20px ${mono}`;
    ctx.fillStyle = "#6b7694";
    ctx.fillText(playing ? "♪ " + sound.musicName() : "click the speaker in the studio for music", 640, TH - 36);
    ctx.fillText("click a channel   ·   ESC to leave the TV", 44, TH - 36);

    const sheen = ctx.createLinearGradient(0, 0, TW, TH);
    sheen.addColorStop(0, "rgba(255,255,255,0.04)");
    sheen.addColorStop(0.4, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, TW, TH);
    tex.needsUpdate = true;
  };

  return {
    tex,
    draw,
    move(u: number, v: number) {
      ui.hover = locate(u, v);
      return ui.hover >= 0;
    },
    leave() {
      ui.hover = -1;
    },
    click(u: number, v: number) {
      const i = locate(u, v);
      if (i < 0) return false;
      ui.selected = i;
      return true;
    },
  };
}

function TV({ active }: { active: boolean }) {
  const accent = useAccent();
  const [tv] = useState(makeTV);
  const downAt = useRef<[number, number] | null>(null);
  useFrame(({ clock }) => {
    if (accent.state.room !== "lounge") return;
    tv.draw(clock.elapsedTime, accent.state.hue);
  });
  return (
    <group position={[0.4, 1.2, -3.3]}>
      <B p={[0, 0, 0]} s={[2.12, 1.22, 0.07]} c="#08090d" r={0.03} rough={0.3} />
      <mesh
        position={[0, 0, 0.0365]}
        onPointerMove={(e) => {
          if (!active || !e.uv) return;
          e.stopPropagation();
          document.body.style.cursor = tv.move(e.uv.x, e.uv.y) ? "pointer" : "";
        }}
        onPointerOut={() => {
          tv.leave();
          pointerOff();
        }}
        onPointerDown={(e) => {
          downAt.current = [e.nativeEvent.clientX, e.nativeEvent.clientY];
        }}
        onPointerUp={(e) => {
          const d = downAt.current;
          downAt.current = null;
          if (!active || !e.uv || !d || accent.state.dragging) return;
          if (Math.hypot(e.nativeEvent.clientX - d[0], e.nativeEvent.clientY - d[1]) > 14) return;
          e.stopPropagation();
          if (tv.click(e.uv.x, e.uv.y)) sound.click();
        }}
      >
        <planeGeometry args={[2.02, 1.13]} />
        <meshBasicMaterial map={tv.tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── small furniture ───────────────────────── */
function Sofa() {
  return (
    <group position={[0.3, 0, 1.95]} rotation={[0, Math.PI, 0]}>
      <B p={[0, 0.2, 0]} s={[2.5, 0.4, 1.0]} c="#2f6f73" r={0.06} rough={0.9} />
      <B p={[0, 0.72, -0.4]} s={[2.5, 0.62, 0.24]} c="#2b6468" r={0.07} rough={0.9} />
      {[-1.13, 1.13].map((x) => (
        <B key={x} p={[x, 0.34, 0]} s={[0.26, 0.68, 1.0]} c="#2b6468" r={0.07} rough={0.9} />
      ))}
      {[-0.78, 0, 0.78].map((x) => (
        <B key={x} p={[x, 0.47, 0.06]} s={[0.74, 0.14, 0.82]} c="#3b8a8f" r={0.05} rough={0.95} />
      ))}
      {[-0.78, 0, 0.78].map((x) => (
        <B key={x} p={[x, 0.8, -0.24]} s={[0.72, 0.5, 0.16]} c="#34797d" r={0.06} rough={0.95} rot={[-0.2, 0, 0]} />
      ))}
      <B p={[-0.82, 0.68, 0.1]} s={[0.4, 0.4, 0.11]} c="#e0b25a" r={0.05} rough={1} rot={[-0.2, 0.5, 0.2]} />
      <B p={[0.86, 0.66, 0.12]} s={[0.4, 0.4, 0.11]} c="#c46b5a" r={0.05} rough={1} rot={[-0.2, -0.4, -0.15]} />
    </group>
  );
}

function CoffeeTable() {
  return (
    <group position={[0.2, 0, 0.35]}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.32, 0.34, 0.04, 28]} />
        <meshStandardMaterial color="#2a211f" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.21, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.38, 14]} />
        <meshStandardMaterial color="#2a211f" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.56, 0.56, 0.05, 40]} />
        <meshStandardMaterial color="#7a553a" roughness={0.38} />
      </mesh>
      <mesh position={[0.28, 0.5, -0.1]} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.09, 20]} />
        <meshStandardMaterial color="#e9ecf5" roughness={0.35} />
      </mesh>
      <B p={[-0.14, 0.47, 0.06]} s={[0.34, 0.05, 0.25]} c="#3a4a6a" rot={[0, 0.3, 0]} />
      <B p={[-0.14, 0.52, 0.06]} s={[0.3, 0.04, 0.22]} c="#c46b5a" rot={[0, 0.1, 0]} />
      <B p={[0.12, 0.455, 0.25]} s={[0.05, 0.015, 0.18]} c="#14161d" r={0.006} rot={[0, -0.5, 0]} />
    </group>
  );
}

function FloorLamp() {
  const accent = useAccent();
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (light.current) light.current.intensity = 2.4 * (1 - accent.state.mood * 0.55);
  });
  return (
    <group position={[-2.85, 0, -2.75]}>
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.03, 24]} />
        <meshStandardMaterial color="#14161f" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 1.7, 10]} />
        <meshStandardMaterial color="#14161f" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.34, 28, 1, true]} />
        <meshBasicMaterial color="#ffdca8" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 1.7, 0.1]} color="#ffbf80" intensity={2.4} distance={4.2} decay={2} />
    </group>
  );
}

function Guitar() {
  return (
    <group position={[-3.27, 0, 2.55]} rotation={[0, Math.PI / 2, 0.1]}>
      <mesh position={[0, 0.27, 0]} scale={[0.22, 0.25, 0.075]} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#c9803f" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.54, 0]} scale={[0.16, 0.19, 0.075]} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#c9803f" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.4, 0.078]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.004, 20]} />
        <meshStandardMaterial color="#120d0a" roughness={0.5} />
      </mesh>
      <B p={[0, 0.98, 0]} s={[0.05, 0.62, 0.03]} c="#3a2a20" r={0.006} />
      <B p={[0, 1.36, 0]} s={[0.075, 0.16, 0.026]} c="#2a1d16" r={0.008} />
    </group>
  );
}

function Art({ p, hue, s = [0.8, 1.1] }: { p: V3; hue: number; s?: [number, number] }) {
  const map = useMemo(
    () =>
      canvasTexture(256, 340, (c, w, h) => {
        c.fillStyle = "#e9e3d6";
        c.fillRect(0, 0, w, h);
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, `hsl(${hue} 70% 35%)`);
        g.addColorStop(1, `hsl(${hue + 50} 80% 62%)`);
        c.fillStyle = g;
        c.fillRect(22, 22, w - 44, h - 44);
        c.fillStyle = "rgba(255,255,255,0.85)";
        c.beginPath();
        c.arc(w * 0.62, h * 0.38, 46, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(0,0,0,0.35)";
        c.beginPath();
        c.moveTo(22, h - 22);
        c.lineTo(w * 0.4, h * 0.55);
        c.lineTo(w * 0.7, h - 22);
        c.fill();
      }),
    [hue],
  );
  return (
    <group position={p}>
      <B p={[0, 0, 0]} s={[s[0], s[1], 0.04]} c="#0c0e15" />
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[s[0] - 0.1, s[1] - 0.1]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
    </group>
  );
}

const LOUNGE_HOTSPOTS: HotspotCfg[] = [
  { i: 7, label: "TV", pos: [0.4, 2.35, -3.05], hit: { pos: [0.4, 1.2, -3.05], size: [2.3, 1.4, 0.5] } },
];

export default function Lounge({
  section,
  onSelect,
}: {
  section: number;
  onSelect: (i: number) => void;
}) {
  const planks = useMemo(() => plankTexture(14), []);
  const wall = "#4b3d58";
  const dark = "#171219";
  const tvGlow = useRef<THREE.PointLight>(null);
  const accent = useAccent();
  useFrame(() => tvGlow.current?.color.copy(accent.color));

  return (
    <group>
      {/* floor + round rug */}
      <B p={[0, -0.15, 0]} s={[7.5, 0.3, 7.5]} c="#1b1722" r={0.04} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={planks} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0.25, 0.014, 0.9]} receiveShadow>
        <cylinderGeometry args={[1.85, 1.85, 0.024, 56]} />
        <meshStandardMaterial color="#d8cdb9" roughness={1} />
      </mesh>
      <mesh position={[0.25, 0.028, 0.9]} receiveShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.024, 56]} />
        <meshStandardMaterial color="#b9a78b" roughness={1} />
      </mesh>

      {/* right wall (the TV wall) */}
      <B p={[-0.05, 1.8, -3.6]} s={[7.5, 3.6, 0.2]} c={wall} rough={0.92} r={0.01} />
      <B p={[0, 0.08, -3.465]} s={[7, 0.16, 0.05]} c={dark} />
      <Art p={[-2.35, 2.15, -3.455]} hue={330} />
      <Art p={[3.05, 2.15, -3.455]} hue={200} />

      {/* left wall with the doorway into the studio */}
      <B p={[-3.6, 1.8, -2.1]} s={[0.2, 3.6, 3.2]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 1.8, 2.3]} s={[0.2, 3.6, 2.8000000000000003]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.6, 2.95, 0.2]} s={[0.2, 1.3, 1.4]} c={wall} rough={0.92} r={0.01} />
      <B p={[-3.5, 1.15, -0.49999999999999994]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[-3.5, 1.15, 0.8999999999999999]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[-3.465, 0.08, 0]} s={[0.05, 0.16, 7]} c={dark} />

      {/* TV console, soundbar, game console */}
      <B p={[0.4, 0.25, -3.15]} s={[2.9, 0.5, 0.62]} c="#2b211e" r={0.02} rough={0.5} />
      <B p={[0.4, 0.545, -3.0]} s={[1.7, 0.07, 0.14]} c="#14161d" r={0.02} />
      <B p={[0.4, 0.54, -3.25]} s={[0.5, 0.08, 0.3]} c="#14161d" r={0.01} />
      <B p={[1.55, 0.53, -3.1]} s={[0.4, 0.06, 0.28]} c="#e9ecf5" r={0.015} rough={0.4} />
      <Lit p={[1.55, 0.565, -2.96]} s={[0.3, 0.008, 0.008]} c="#46e0ff" />
      <Plant p={[-0.95, 0.5, -3.1]} scale={0.5} />
      <TV active={section === 7} />
      <pointLight ref={tvGlow} position={[0.4, 1.3, -2.4]} intensity={2} distance={4} decay={2} />

      {/* seating */}
      <Sofa />
      <CoffeeTable />
      <FloorLamp />
      <Guitar />
      <Plant p={[2.85, 0, -2.85]} scale={1.2} />
      <Plant p={[-2.8, 0, -1.45]} scale={1.0} />

      <Hotspots section={section} onSelect={onSelect} list={LOUNGE_HOTSPOTS} roomId="lounge" overview={6} />
    </group>
  );
}
