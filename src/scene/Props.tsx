/* eslint-disable react-hooks/immutability -- shared scene state and three.js objects are mutated by design */
"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PROJECTS, QUIPS, TIPS } from "@/content/content";
import { sound } from "@/lib/sound";
import { terminal } from "@/lib/terminal";
import { useAccent } from "./accent";
import { Hit, pointerOff, type V3 } from "./Hit";
import { crowd, findPath, HUBS, type P2 } from "./nav";
import { B } from "./Room";
import { Phone } from "./Extras";
import { techLogo } from "./textures";

/* ─────────── the monitor: terminal normally, the whole project browser when you open VAULT ─────────── */
const SW = 1600;
const SH = 930;
type Rect = { x: number; y: number; w: number; h: number };

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function makeScreen() {
  const cv = document.createElement("canvas");
  cv.width = SW;
  cv.height = SH;
  const ctx = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  let last = 0;

  const ui = {
    selected: 0,
    hover: null as null | { kind: "row" | "btn"; i: number },
    rows: [] as Rect[],
    btns: [] as (Rect & { url: string })[],
  };
  const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const locate = (u: number, v: number) => {
    const x = u * SW;
    const y = (1 - v) * SH;
    const bi = ui.btns.findIndex((b) => inRect(b, x, y));
    if (bi >= 0) return { kind: "btn" as const, i: bi };
    const ri = ui.rows.findIndex((r) => inRect(r, x, y));
    if (ri >= 0) return { kind: "row" as const, i: ri };
    return null;
  };

  const sans = 'system-ui, "Segoe UI", Roboto, sans-serif';
  const mono = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

  const drawTerminal = (t: number, hue: number) => {
    ctx.save();
    ctx.scale(SW / 512, SH / 300);
    const w = 512;
    const h = 300;
    ctx.fillStyle = "#080b16";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#0e1324";
    ctx.fillRect(0, 0, w, 30);
    ["#ff6b6b", "#ffd166", "#4ade80"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(18 + i * 16, 15, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#6b7694";
    ctx.font = `12px ${mono}`;
    ctx.fillText("~/portfolio/vault.tsx", 80, 19);
    ctx.fillStyle = "#0b0f1d";
    ctx.fillRect(0, 30, 80, 150);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i === Math.floor(t / 1.8) % 6 ? `hsl(${hue} 90% 62%)` : "#252c45";
      ctx.fillRect(12, 46 + i * 22, 38 + ((i * 17) % 20), 7);
    }
    const scroll = (t * 11) % 22;
    for (let i = 0; i < 7; i++) {
      const y = 48 + i * 22 - scroll;
      if (y < 36 || y > 168) continue;
      const indent = ((i * 7 + Math.floor(t / 22)) % 3) * 20;
      let x = 100 + indent;
      for (let k = 0; k < 4; k++) {
        const len = 26 + (((i + 1) * (k + 3) * 13) % 64);
        ctx.fillStyle = k % 3 === 0 ? `hsl(${hue} 85% 66%)` : k % 3 === 1 ? "#c4cbe0" : "#f2b27a";
        ctx.fillRect(x, y, len, 7);
        x += len + 9;
      }
    }
    ctx.fillStyle = "#04060d";
    ctx.fillRect(0, 180, w, h - 180);
    ctx.fillStyle = `hsl(${hue} 80% 55% / 0.6)`;
    ctx.fillRect(0, 180, w, 1.5);
    ctx.font = `13px ${mono}`;
    terminal.lines.slice(-5).forEach((line, i) => {
      ctx.fillStyle = line.startsWith("$") ? `hsl(${hue} 90% 70%)` : line.startsWith("  →") ? "#7ee2a8" : "#8b94b0";
      ctx.fillText(line, 14, 200 + i * 16);
    });
    const caret = Math.sin(t * 6) > 0 ? "▌" : " ";
    ctx.fillStyle = "#e6ebff";
    ctx.fillText(`visitor@portfolio:~$ ${terminal.buffer}${caret}`, 14, 200 + 5 * 16 + 6);
    ctx.restore();
  };

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };

  const drawVault = (hue: number) => {
    const acc = (l: number, a = 1) => `hsl(${hue} 90% ${l}% / ${a})`;
    ctx.fillStyle = "#070a14";
    ctx.fillRect(0, 0, SW, SH);

    // window chrome
    ctx.fillStyle = "#0d1222";
    ctx.fillRect(0, 0, SW, 60);
    ["#ff6b6b", "#ffd166", "#4ade80"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(36 + i * 30, 30, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.font = `500 22px ${mono}`;
    ctx.fillStyle = "#6b7694";
    ctx.textAlign = "left";
    ctx.fillText("vault — projects/", 150, 38);
    ctx.textAlign = "right";
    ctx.fillText(`${PROJECTS.length} files`, SW - 30, 38);
    ctx.textAlign = "left";

    // sidebar: the project list
    ctx.fillStyle = "#0a0e1b";
    ctx.fillRect(0, 60, 580, SH - 108);
    ui.rows.length = 0;
    PROJECTS.forEach((p, i) => {
      const y = 92 + i * 168;
      const r = { x: 24, y, w: 532, h: 148 };
      ui.rows.push(r);
      const sel = ui.selected === i;
      const hov = ui.hover?.kind === "row" && ui.hover.i === i;
      if (sel || hov) {
        ctx.fillStyle = sel ? acc(60, 0.14) : "rgba(255,255,255,0.05)";
        roundRect(r.x, r.y, r.w, r.h, 10);
        ctx.fill();
      }
      if (sel) {
        ctx.fillStyle = acc(64);
        ctx.fillRect(r.x, r.y + 10, 6, r.h - 20);
      }
      ctx.font = `500 22px ${mono}`;
      ctx.fillStyle = acc(66, 0.9);
      ctx.fillText(p.id, 56, y + 42);
      ctx.textAlign = "right";
      ctx.fillStyle = "#6b7694";
      ctx.fillText(p.year, 530, y + 42);
      ctx.textAlign = "left";
      ctx.font = `600 40px ${sans}`;
      ctx.fillStyle = sel || hov ? "#ffffff" : "#c3cadd";
      ctx.fillText(p.name, 56, y + 90);
      ctx.font = `20px ${mono}`;
      ctx.fillStyle = "#7c86a3";
      ctx.fillText(p.stack.join("  ·  "), 56, y + 128);
    });
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(580, 60, 2, SH - 108);

    // detail pane
    const p = PROJECTS[ui.selected];
    const x0 = 650;
    ctx.font = `500 24px ${mono}`;
    ctx.fillStyle = acc(70);
    ctx.fillText(`PROJECT_${p.id} · ${p.year} · ${p.role.toUpperCase()}`, x0, 130);
    ctx.font = `700 86px ${sans}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(p.name, x0, 236);
    ctx.font = `400 30px ${sans}`;
    ctx.fillStyle = "#b7c0d8";
    let y = 306;
    wrapText(ctx, p.description, 880).forEach((l) => {
      ctx.fillText(l, x0, y);
      y += 46;
    });
    y += 14;
    ctx.fillStyle = "#e6ebff";
    p.highlights.forEach((h) => {
      ctx.fillStyle = acc(66);
      ctx.fillText("→", x0, y);
      ctx.fillStyle = "#e6ebff";
      ctx.fillText(h, x0 + 48, y);
      y += 50;
    });
    // stack chips
    ctx.font = `500 22px ${mono}`;
    let cx = x0;
    const chipY = 700;
    p.stack.forEach((s) => {
      const w = ctx.measureText(s).width + 36;
      ctx.strokeStyle = acc(60, 0.55);
      ctx.lineWidth = 2;
      roundRect(cx, chipY, w, 46, 23);
      ctx.stroke();
      ctx.fillStyle = acc(76);
      ctx.fillText(s, cx + 18, chipY + 31);
      cx += w + 14;
    });
    // buttons
    ui.btns.length = 0;
    [
      ["LIVE ↗", p.live],
      ["SOURCE ↗", p.repo],
    ].forEach(([label, url], i) => {
      const r = { x: x0 + i * 250, y: 790, w: 226, h: 76, url };
      ui.btns.push(r);
      const hov = ui.hover?.kind === "btn" && ui.hover.i === i;
      ctx.fillStyle = hov ? acc(64) : acc(60, 0.12);
      roundRect(r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      ctx.strokeStyle = acc(62, 0.7);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = `700 26px ${mono}`;
      ctx.textAlign = "center";
      ctx.fillStyle = hov ? "#05070d" : acc(76);
      ctx.fillText(label, r.x + r.w / 2, r.y + 48);
      ctx.textAlign = "left";
    });

    // status bar
    ctx.fillStyle = "#0d1222";
    ctx.fillRect(0, SH - 48, SW, 48);
    ctx.font = `18px ${mono}`;
    ctx.fillStyle = "#6b7694";
    ctx.fillText("click a project to read it   ·   LIVE and SOURCE open in a new tab   ·   ESC to leave the monitor", 28, SH - 17);
  };

  const draw = (t: number, hue: number, vault: boolean) => {
    if (t - last < 1 / 20) return;
    last = t;
    if (vault) drawVault(hue);
    else drawTerminal(t, hue);
    // faint glass sheen
    const g = ctx.createLinearGradient(0, 0, SW, SH);
    g.addColorStop(0, "rgba(255,255,255,0.045)");
    g.addColorStop(0.4, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SW, SH);
    tex.needsUpdate = true;
  };

  return {
    tex,
    draw,
    move(u: number, v: number) {
      ui.hover = locate(u, v);
      return !!ui.hover;
    },
    leave() {
      ui.hover = null;
    },
    click(u: number, v: number) {
      const hit = locate(u, v);
      if (!hit) return false;
      if (hit.kind === "row") ui.selected = hit.i;
      else window.open(ui.btns[hit.i].url, "_blank", "noopener,noreferrer");
      return true;
    },
  };
}

function Screen({ active }: { active: boolean }) {
  const accent = useAccent();
  const [screen] = useState(makeScreen);
  const downAt = useRef<[number, number] | null>(null);
  useFrame(({ clock }) => screen.draw(clock.elapsedTime, accent.state.hue, active));
  return (
    <mesh
      position={[0, 0.62, -0.0035]}
      onPointerMove={(e) => {
        if (!active || !e.uv) return;
        e.stopPropagation();
        document.body.style.cursor = screen.move(e.uv.x, e.uv.y) ? "pointer" : "";
      }}
      onPointerOut={() => {
        screen.leave();
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
        if (screen.click(e.uv.x, e.uv.y)) sound.click();
      }}
    >
      <planeGeometry args={[1.17, 0.68]} />
      <meshBasicMaterial map={screen.tex} toneMapped={false} />
    </mesh>
  );
}

export function Monitor({ active, onFocus }: { active: boolean; onFocus: () => void }) {
  return (
    <group position={[-1.7, 0.815, -3.0]} rotation={[0, 0.4, 0]}>
      <B p={[0, 0.01, 0.05]} s={[0.4, 0.02, 0.22]} c="#20232f" r={0.008} />
      <B p={[0, 0.2, -0.05]} s={[0.06, 0.38, 0.05]} c="#171a24" r={0.01} />
      <B p={[0, 0.62, -0.03]} s={[1.25, 0.74, 0.05]} c="#07080c" r={0.025} />
      <Screen active={active} />
      <Hit p={[0, 0.5, 0]} s={[1.3, 0.95, 0.2]} off={active} onClick={onFocus} />
    </group>
  );
}

/* ─────────── mug + steam (click for a puff) ─────────── */
export function Mug() {
  const puffs = useRef<(THREE.Mesh | null)[]>([]);
  const burst = useRef(0);
  useFrame(({ clock }, dt) => {
    burst.current = Math.max(0, burst.current - dt * 0.8);
    puffs.current.forEach((m, i) => {
      if (!m) return;
      const k = (clock.elapsedTime * (0.35 + burst.current * 0.8) + i / 3) % 1;
      m.position.y = 0.11 + k * (0.28 + burst.current * 0.2);
      m.position.x = Math.sin(k * 6 + i) * (0.02 + burst.current * 0.03);
      m.scale.setScalar((0.5 + k * 1.4) * (1 + burst.current));
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - k) * (0.16 + burst.current * 0.25);
    });
  });
  return (
    <group position={[-0.62, 0.815, -2.8]}>
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.045, 0.09, 24]} />
        <meshStandardMaterial color="#e9ecf5" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.088, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 0.004, 24]} />
        <meshStandardMaterial color="#2a1c12" roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} ref={(el) => void (puffs.current[i] = el)} position={[0, 0.11, 0]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
        </mesh>
      ))}
      <Hit p={[0, 0.08, 0]} s={[0.2, 0.22, 0.2]} onClick={() => (burst.current = 1)} />
    </group>
  );
}

/* ─────────── desk lamp: click to switch it on and off ─────────── */
const BULB_ON = new THREE.Color("#ffd9a0");
const BULB_OFF = new THREE.Color("#4a4238");

export function Lamp() {
  const accent = useAccent();
  const light = useRef<THREE.PointLight>(null);
  const bulb = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const k = accent.state.lamp;
    if (light.current) light.current.intensity = 1.8 * k * (1 - accent.state.mood * 0.55);
    bulb.current?.color.copy(BULB_OFF).lerp(BULB_ON, k);
  });
  return (
    <group position={[-2.75, 0.815, -3.2]}>
      <mesh position={[0, 0.012, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.11, 0.024, 24]} />
        <meshStandardMaterial color="#14161f" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0.05, 0.19, 0]} rotation={[0, 0, -0.28]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
        <meshStandardMaterial color="#14161f" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.2, 0.46, 0]} rotation={[0, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
        <meshStandardMaterial color="#14161f" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[0.34, 0.58, 0]} rotation={[0, 0, 0.5]}>
        <mesh castShadow>
          <coneGeometry args={[0.13, 0.17, 28, 1, true]} />
          <meshStandardMaterial color="#e8a4c8" roughness={0.45} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <sphereGeometry args={[0.035, 12, 10]} />
          <meshBasicMaterial ref={bulb} color="#ffd9a0" toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0.34, 0.5, 0.05]} color="#ffb77a" intensity={1.8} distance={2.8} decay={2} />
      <Hit
        p={[0.3, 0.45, 0]}
        s={[0.5, 0.75, 0.4]}
        onClick={() => {
          accent.state.lampOn = !accent.state.lampOn;
          sound.click();
        }}
      />
    </group>
  );
}

/* ─────────── office chair: click to spin ─────────── */
export function Chair({ off }: { off?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const rot = useRef(0.5);
  const spin = useRef(0);
  useFrame((_, dt) => {
    spin.current *= Math.exp(-1.4 * dt);
    rot.current += spin.current * dt;
    if (g.current) g.current.rotation.y = rot.current;
  });
  return (
    <group ref={g} position={[-1.6, 0, -2.2]} rotation={[0, 0.5, 0]}>
      <B p={[0, 0.52, 0]} s={[0.56, 0.09, 0.56]} c="#303648" r={0.04} />
      <B p={[0, 0.8, 0.27]} s={[0.54, 0.42, 0.08]} c="#303648" r={0.04} />
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.46, 12]} />
        <meshStandardMaterial color="#0e1017" roughness={0.4} metalness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
          <B p={[0.17, 0.07, 0]} s={[0.34, 0.035, 0.05]} c="#0e1017" r={0.01} />
          <mesh position={[0.33, 0.03, 0]} castShadow>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#0b0d14" />
          </mesh>
        </group>
      ))}
      <Hit
        p={[0, 0.75, 0.05]}
        s={[0.7, 1.4, 0.7]}
        off={off}
        onClick={() => {
          spin.current = 12;
          sound.click();
        }}
      />
    </group>
  );
}

/* ─────────── speaker (click for music) + phone with signal rings ─────────── */
export function Uplink({ onToggleMusic, active }: { onToggleMusic: () => void; active: boolean }) {
  const accent = useAccent();
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const woofer = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const beat = sound.beat();
    rings.current.forEach((m, i) => {
      if (!m) return;
      const k = (t * 0.45 + i / 3) % 1;
      m.scale.setScalar(0.2 + k * 1.1);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - k) * 0.8;
      mat.color.copy(accent.color);
    });
    if (woofer.current) woofer.current.scale.setScalar(1 + Math.sin(t * 9) * 0.02 + beat * 0.16);
    if (label.current) {
      const name = sound.musicName();
      if (label.current.textContent !== name) label.current.textContent = name;
      label.current.style.opacity = name ? '1' : '0';
    }
  });
  return (
    <group>
      <group position={[2.1, 0.8, -3.15]}>
        <B p={[0, 0.27, 0]} s={[0.4, 0.54, 0.32]} c="#232839" r={0.03} />
        <mesh ref={woofer} position={[0, 0.2, 0.165]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 32]} />
          <meshStandardMaterial color="#07080c" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.2, 0.178]}>
          <torusGeometry args={[0.108, 0.006, 8, 40]} />
          <primitive object={accent.basic} attach="material" />
        </mesh>
        <mesh position={[0, 0.43, 0.165]}>
          <circleGeometry args={[0.04, 24]} />
          <meshStandardMaterial color="#07080c" roughness={0.4} />
        </mesh>
        <Html position={[0, 0.66, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
          <div
            ref={label}
            className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.25em] text-white transition-opacity duration-300"
            style={{ opacity: 0, background: "rgba(8,10,18,0.78)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
          />
        </Html>
        <Hit p={[0, 0.27, 0.05]} s={[0.46, 0.62, 0.45]} onClick={onToggleMusic} />
      </group>
      <Phone active={active} />
      <group position={[2.6, 0.8, -2.92]} rotation={[0, 0.5, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(el) => void (rings.current[i] = el)} position={[0, 0.62 + i * 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.004, 6, 64]} />
            <meshBasicMaterial transparent toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ─────────── floating skills core (click to spin it up) ─────────── */
export function Codex({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  const accent = useAccent();
  const core = useRef<THREE.Group>(null);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const orbs = useRef<(THREE.Object3D | null)[]>([]);
  const [logos] = useState(() => (['react', 'typescript', 'next', 'node', 'tailwind', 'figma'] as const).map((n) => techLogo(n)));
  const wire = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat1 = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat2 = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const excite = useRef(0);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    excite.current = Math.max(0, excite.current - dt * 0.7);
    const speed = 1 + excite.current * 6;
    if (core.current) {
      core.current.rotation.y += dt * 0.5 * speed;
      core.current.rotation.x = Math.sin(t * 0.4) * 0.25;
      core.current.position.y = 1.2 + Math.sin(t * 1.2) * 0.06 + sound.beat() * 0.05;
      core.current.scale.setScalar(1 + excite.current * 0.25);
    }
    if (r1.current) r1.current.rotation.set(t * 0.6 * speed, t * 0.3, 0);
    if (r2.current) r2.current.rotation.set(Math.PI / 2 + t * 0.35, 0, t * 0.5 * speed);
    orbs.current.forEach((m, i) => {
      if (!m) return;
      const a = t * (0.7 + i * 0.09) * speed + (i / 6) * Math.PI * 2;
      const rad = 0.62 + (i % 2) * 0.1;
      m.position.set(Math.cos(a) * rad, Math.sin(a * 1.3 + i) * 0.22, Math.sin(a) * rad);
    });
    wire.current?.color.copy(accent.color);
    ringMat1.current?.color.copy(accent.color);
    ringMat2.current?.color.copy(accent.color);
    light.current?.color.copy(accent.color);
  });

  return (
    <group position={[0.4, 0, 0.8]}>
      <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.22, 40]} />
        <meshStandardMaterial color="#171a24" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.225, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.008, 8, 64]} />
        <primitive object={accent.basic} attach="material" />
      </mesh>
      <group ref={core} position={[0, 1.2, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.36, 1]} />
          <meshBasicMaterial ref={wire} wireframe toneMapped={false} />
        </mesh>
        <mesh castShadow>
          <octahedronGeometry args={[0.17, 0]} />
          <meshStandardMaterial color="#f4f6ff" roughness={0.15} metalness={0.6} />
        </mesh>
        <mesh ref={r1}>
          <torusGeometry args={[0.55, 0.006, 8, 80]} />
          <meshBasicMaterial ref={ringMat1} toneMapped={false} />
        </mesh>
        <mesh ref={r2}>
          <torusGeometry args={[0.68, 0.005, 8, 80]} />
          <meshBasicMaterial ref={ringMat2} toneMapped={false} transparent opacity={0.7} />
        </mesh>
        {/* the tech stack, orbiting: React, TypeScript, Next.js, Node, Tailwind, Figma */}
        {logos.map((map, i) => (
          <sprite key={i} ref={(el) => void (orbs.current[i] = el)} scale={[0.26, 0.26, 0.26]}>
            <spriteMaterial map={map} toneMapped={false} transparent />
          </sprite>
        ))}
        <pointLight ref={light} intensity={1.6} distance={3.5} decay={2} />
      </group>
      <Hit
        p={[0, 1.2, 0]}
        s={[1.3, 1.4, 1.3]}
        onClick={() => {
          if (active) {
            excite.current = 1;
            sound.click();
          } else onSelect();
        }}
      />
    </group>
  );
}

/* ─────────── a little character who wanders the room and visits whatever you open ─────────── */
type Pose = "sit" | "read" | "look" | "dance";
const SPOTS: ({ p: P2; face: P2; pose: Pose } | null)[] = [
  null, // home: wander
  { p: [-1.6, 2.4], face: [-2.7, 0.95], pose: "read" }, // bio: near the book table
  { p: [2.6, -1.5], face: [0.6, -3.4], pose: "look" }, // ops: off to the side of the pegboard
  { p: [-1.6, -2.2], face: [-1.7, -3.0], pose: "sit" }, // vault: sitting at the desk, working
  { p: [1.5, 1.7], face: [0.4, 0.8], pose: "look" }, // codex: by the core
  { p: [1.2, -1.5], face: [2.2, -3.3], pose: "dance" }, // uplink: dancing to the speaker, away from the phone close-up
];

const SEAT = SPOTS[3]!;
const SKIN = "#f1c9a5";
const HOODIE_DARK = "#14151b";
const BLACK = "#0d0d11";

const PANTS = "#2c3550";

// A black streetwear hoodie: tech-wear lines, a wolf emblem and neon cuffs that follow the site's accent color.
function makeHoodie() {
  const mk = (w: number, h: number) => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { ctx, tex };
  };
  const torso = mk(1024, 512);
  const arm = mk(256, 256);
  let last = -999;
  const neon = (hue: number, l = 62) => "hsl(" + hue + " 100% " + l + "%)";

  const drawTorso = (hue: number) => {
    const c = torso.ctx;
    c.fillStyle = "#0e0f14";
    c.fillRect(0, 0, 1024, 512);
    c.strokeStyle = "#1a1c26";
    c.lineWidth = 4;
    for (let x = -512; x < 1536; x += 38) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 512, 512);
      c.stroke();
    }
    c.fillStyle = "#1f222e";
    c.fillRect(0, 38, 1024, 6);
    c.fillRect(0, 470, 1024, 6);
    // wolf head, front-facing, centered on the chest (the front of the torso is the middle of the texture)
    c.save();
    c.translate(512, 244);
    const pts: [number, number][] = [
      [0, -52], [-26, -60], [-58, -104], [-70, -44], [-86, -6],
      [-66, 26], [-46, 54], [-18, 66], [-9, 92], [0, 100],
    ];
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    for (let i = pts.length - 2; i >= 0; i--) c.lineTo(-pts[i][0], pts[i][1]);
    c.closePath();
    c.fillStyle = neon(hue);
    c.shadowColor = neon(hue);
    c.shadowBlur = 26;
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = "#0e0f14";
    for (const sd of [-1, 1]) {
      c.beginPath();
      c.moveTo(sd * 14, -14);
      c.lineTo(sd * 48, -28);
      c.lineTo(sd * 40, -4);
      c.closePath();
      c.fill();
    }
    c.beginPath();
    c.moveTo(-14, 80);
    c.lineTo(14, 80);
    c.lineTo(0, 99);
    c.closePath();
    c.fill();
    c.strokeStyle = "#0e0f14";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(0, -52);
    c.lineTo(0, 40);
    c.stroke();
    c.restore();
    c.fillStyle = "#e9ecf5";
    c.font = "700 30px ui-monospace, Consolas, monospace";
    c.textAlign = "center";
    c.fillText("W O L F P A C K", 512, 404);
    c.fillStyle = neon(hue, 68);
    c.fillRect(392, 422, 240, 5);
    torso.tex.needsUpdate = true;
  };

  const drawArm = (hue: number) => {
    const c = arm.ctx;
    c.fillStyle = "#0e0f14";
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "#1a1c26";
    c.lineWidth = 3;
    for (let x = -256; x < 512; x += 28) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 256, 256);
      c.stroke();
    }
    c.fillStyle = neon(hue);
    c.fillRect(0, 168, 256, 12);
    c.fillRect(0, 192, 256, 5);
    c.fillStyle = "#e9ecf5";
    c.fillRect(0, 206, 256, 3);
    arm.tex.needsUpdate = true;
  };

  const draw = (hue: number) => {
    if (Math.abs(hue - last) < 3) return;
    last = hue;
    drawTorso(hue);
    drawArm(hue);
  };
  draw(190);
  return { torso: torso.tex, arm: arm.tex, draw };
}

// Long, smooth, straight hair: a clean cap, a straight curtain down the back, two smooth face-framing panels
// and a soft center-parted fringe. All rounded shapes, nothing spiky.
function StraightHair() {
  const mat = <meshStandardMaterial color="#1f130e" roughness={0.38} metalness={0.15} />;
  return (
    <group>
      {/* covers the back and top of the head */}
      <mesh position={[0, 0.01, -0.045]} scale={[1, 1.06, 0.93]} castShadow>
        <sphereGeometry args={[0.172, 28, 20]} />
        {mat}
      </mesh>
      {/* the straight curtain falling down the back */}
      <mesh position={[0, -0.215, -0.135]} scale={[1, 1, 0.5]} castShadow>
        <capsuleGeometry args={[0.135, 0.2, 10, 20]} />
        {mat}
      </mesh>
      {/* face-framing panels, smooth to the ends */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.148, -0.1, -0.005]} scale={[0.62, 1, 1.15]} castShadow>
          <capsuleGeometry args={[0.045, 0.2, 8, 14]} />
          {mat}
        </mesh>
      ))}
      {/* hairline: a cap over the top of the head that stops high on the forehead, so the brows and eyes stay clear */}
      <mesh position={[0, 0, 0.003]} rotation={[0.06, 0, 0]} castShadow>
        <sphereGeometry args={[0.171, 32, 20, 0, Math.PI * 2, 0, 1.2]} />
        {mat}
      </mesh>
    </group>
  );
}

export function Walker({ onSelect, section }: { onSelect: () => void; section: number }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const book = useRef<THREE.Mesh>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const arms = useRef<(THREE.Group | null)[]>([]);
  const nav = useRef({
    x: 1.2,
    z: 0.6,
    yaw: 0,
    path: [] as P2[],
    idleUntil: 2,
    phase: 0,
    wave: 0,
    jump: 0,
    sit: 0,
    section: 0,
    seat: false,
    trips: 0,
  });
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const accent = useAccent();
  const [prints] = useState(makeHoodie);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((text: string, ms = 4200) => {
    setMsg(text);
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), ms);
  }, []);

  // head to whatever you opened, and say something helpful once there
  useEffect(() => {
    const n = nav.current;
    n.section = section;
    n.seat = false;
    const spot = SPOTS[section];
    n.path = spot ? findPath([n.x, n.z], spot.p) : [];
    const id = setTimeout(() => say(TIPS[section] ?? TIPS[0], 4800), 1600);
    return () => clearTimeout(id);
  }, [section, say]);

  useEffect(() => {
    const onPulse = () => (nav.current.jump = 1);
    window.addEventListener("field-pulse", onPulse);
    return () => {
      window.removeEventListener("field-pulse", onPulse);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useFrame(({ clock }, dt) => {
    const n = nav.current;
    const t = clock.elapsedTime;
    prints.draw(accent.state.hue);
    const spot = SPOTS[n.section];
    n.jump = Math.max(0, n.jump - dt * 2.2);
    n.wave = Math.max(0, n.wave - dt);

    // wander at home when there is nothing queued
    if (!spot && n.path.length === 0 && t > n.idleUntil) {
      n.seat = false;
      n.trips += 1;
      if (n.trips % 2 === 0) {
        // go and work at the desk for a while
        n.path = findPath([n.x, n.z], SEAT.p);
        n.seat = true;
      } else {
        const choices = HUBS.filter((h) => Math.hypot(h[0] - n.x, h[1] - n.z) > 1.2);
        const pick = choices[Math.floor(Math.random() * choices.length)];
        if (pick) n.path = findPath([n.x, n.z], pick);
      }
    }

    let moving = false;
    let targetYaw = n.yaw;
    if (n.path.length > 0) {
      const [tx, tz] = n.path[0];
      const dx = tx - n.x;
      const dz = tz - n.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.06) {
        n.path.shift();
        if (n.path.length === 0) n.idleUntil = t + 1.6 + Math.random() * 2.6 + (n.seat ? 16 + Math.random() * 12 : 0);
      } else {
        const sp = 1.15 * dt;
        n.x += (dx / d) * Math.min(sp, d);
        n.z += (dz / d) * Math.min(sp, d);
        targetYaw = Math.atan2(dx, dz);
        moving = true;
      }
    } else if (spot) {
      targetYaw = Math.atan2(spot.face[0] - n.x, spot.face[1] - n.z);
    } else if (n.seat) {
      targetYaw = Math.atan2(SEAT.face[0] - n.x, SEAT.face[1] - n.z);
    }
    let diff = targetYaw - n.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    n.yaw += diff * Math.min(1, dt * 7);

    const pose: Pose | "idle" | "walk" = moving
      ? "walk"
      : spot && n.path.length === 0
        ? spot.pose
        : n.seat && n.path.length === 0
          ? "sit"
          : "idle";
    n.sit += ((pose === "sit" ? 1 : 0) - n.sit) * Math.min(1, dt * 6);
    if (moving) n.phase += dt * 7.5;

    const music = sound.isMusicOn();
    const [lL, lR] = legs.current;
    const [aL, aR] = arms.current;
    const swing = moving ? Math.sin(n.phase) : 0;
    const lerpTo = (g: THREE.Group | null | undefined, x: number, z: number, k = 12) => {
      if (!g) return;
      g.rotation.x += (x - g.rotation.x) * Math.min(1, dt * k);
      g.rotation.z += (z - g.rotation.z) * Math.min(1, dt * k);
    };

    // legs
    const seated = n.sit > 0.5;
    lerpTo(lL, seated ? -1.5 : swing * 0.7, 0);
    lerpTo(lR, seated ? -1.5 : -swing * 0.7, 0);
    // arms by pose
    const type = Math.sin(t * 14) * 0.08;
    if (n.wave > 0) {
      lerpTo(aR, 0, 2.5 + Math.sin(t * 13) * 0.45, 20);
      lerpTo(aL, -swing * 0.5, 0.1);
    } else if (pose === "sit") {
      lerpTo(aL, -1.0 + type, -0.15);
      lerpTo(aR, -1.0 - type, 0.15);
    } else if (pose === "read") {
      lerpTo(aL, -1.15, -0.1);
      lerpTo(aR, -1.15, 0.1);
    } else if (pose === "look") {
      lerpTo(aL, 0, -0.1);
      lerpTo(aR, -1.5, 0.25);
    } else if (pose === "dance" && music) {
      const b = Math.sin(t * 6);
      lerpTo(aR, 0, 1.3 + b * 0.5, 14);
      lerpTo(aL, 0, -(1.3 - b * 0.5), 14);
    } else {
      lerpTo(aL, -swing * 0.6, -0.08);
      lerpTo(aR, swing * 0.6, 0.08);
    }
    if (book.current) book.current.visible = pose === "read" && !moving;

    const dancing = pose === "dance" && music;
    const bob = moving
      ? Math.abs(Math.sin(n.phase)) * 0.035
      : dancing
        ? Math.abs(Math.sin(t * 6)) * 0.07
        : Math.sin(t * 1.8) * 0.006;
    if (body.current) body.current.position.y = bob;
    if (head.current) {
      const look = pose === "look" ? Math.sin(t * 0.9) * 0.4 : pose === "read" ? 0 : Math.sin(t * 0.6) * 0.15;
      head.current.rotation.y += (look - head.current.rotation.y) * Math.min(1, dt * 5);
      const tilt = pose === "read" ? 0.35 : pose === "sit" ? 0.1 : 0;
      head.current.rotation.x += (tilt - head.current.rotation.x) * Math.min(1, dt * 5);
    }
    crowd.walker.x = n.x;
    crowd.walker.z = n.z;
    crowd.walker.still = moving ? 0 : crowd.walker.still + dt;
    if (root.current) {
      // seated, she scoots a little toward the desk so her hands reach the keyboard
      root.current.position.set(
        n.x + Math.sin(n.yaw) * 0.12 * n.sit,
        n.sit * 0.14 + Math.sin(n.jump * Math.PI) * 0.35,
        n.z + Math.cos(n.yaw) * 0.12 * n.sit,
      );
      root.current.rotation.y = n.yaw;
    }
  });

  return (
    <group ref={root} position={[1.2, 0, 0.6]}>
      <group ref={body}>
        {[-1, 1].map((side, i) => (
          <group key={side} ref={(el) => void (legs.current[i] = el)} position={[side * 0.08, 0.42, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.06, 0.2, 6, 10]} />
              <meshStandardMaterial color={PANTS} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.4, 0.035]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.19]} />
              <meshStandardMaterial color="#f4f6ff" roughness={0.5} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.62, 0]} rotation={[0, Math.PI, 0]} castShadow>
          <capsuleGeometry args={[0.14, 0.14, 8, 14]} />
          <meshStandardMaterial map={prints.torso} roughness={0.75} />
        </mesh>
        {/* hood, pocket and drawstrings */}
        <mesh position={[0, 0.79, -0.04]} scale={[1, 0.42, 0.62]} castShadow>
          <sphereGeometry args={[0.15, 20, 14]} />
          <meshStandardMaterial color={HOODIE_DARK} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.52, 0.135]}>
          <boxGeometry args={[0.17, 0.065, 0.02]} />
          <meshStandardMaterial color={HOODIE_DARK} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.5545, 0.1465]}>
          <boxGeometry args={[0.17, 0.004, 0.004]} />
          <primitive object={accent.basic} attach="material" />
        </mesh>
        {[-0.035, 0.035].map((x) => (
          <group key={x} position={[x, 0.76, 0.14]}>
            <mesh>
              <capsuleGeometry args={[0.006, 0.09, 4, 6]} />
              <meshStandardMaterial color="#d9dce8" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.06, 0]}>
              <sphereGeometry args={[0.01, 8, 6]} />
              <primitive object={accent.basic} attach="material" />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((side, i) => (
          <group key={side} ref={(el) => void (arms.current[i] = el)} position={[side * 0.2, 0.74, 0]}>
            <mesh position={[0, -0.14, 0]} castShadow>
              <capsuleGeometry args={[0.05, 0.16, 6, 10]} />
              <meshStandardMaterial map={prints.arm} roughness={0.75} />
            </mesh>
            {/* sleeve stripes */}
            {[-0.08, -0.15].map((y) => (
              <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.052, 0.007, 6, 20]} />
                <primitive object={accent.basic} attach="material" />
              </mesh>
            ))}
            <mesh position={[0, -0.3, 0]}>
              <sphereGeometry args={[0.05, 12, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.7} />
            </mesh>
          </group>
        ))}
        <mesh ref={book} position={[0, 0.58, 0.2]} rotation={[-0.5, 0, 0]} visible={false}>
          <boxGeometry args={[0.16, 0.02, 0.11]} />
          <meshStandardMaterial color="#c46b5a" roughness={0.6} />
        </mesh>
        <group ref={head} position={[0, 0.98, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.16, 28, 22]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          <StraightHair />
          {[-0.088, 0.088].map((x) => (
            <mesh key={x} position={[x, -0.04, 0.128]} scale={[1.5, 0.9, 0.3]}>
              <sphereGeometry args={[0.022, 10, 8]} />
              <meshStandardMaterial color="#f4a3a8" roughness={0.8} />
            </mesh>
          ))}
          {/* cute face: big shiny eyes, soft raised brows, a little smile */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.064, -0.012, 0.145]} scale={[1, 1.25, 0.55]}>
                <sphereGeometry args={[0.03, 16, 12]} />
                <meshStandardMaterial color="#1a1220" roughness={0.2} />
              </mesh>
              <mesh position={[side * 0.057, 0.004, 0.166]}>
                <sphereGeometry args={[0.01, 10, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[side * 0.073, -0.026, 0.163]}>
                <sphereGeometry args={[0.0042, 8, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[side * 0.066, 0.012, 0.143]} rotation={[0.08, 0, Math.PI / 2 - (Math.PI * 0.3) / 2 - side * 0.1]}>
                <torusGeometry args={[0.036, 0.0042, 6, 18, Math.PI * 0.3]} />
                <meshStandardMaterial color="#3a2418" roughness={0.6} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.062, 0.151]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.02, 0.0045, 6, 18, Math.PI]} />
            <meshStandardMaterial color="#c4575f" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.178, 0.012, 8, 32, Math.PI]} />
            <meshStandardMaterial color={BLACK} roughness={0.35} metalness={0.3} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.178, 0.005, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.045, 18]} />
              <meshStandardMaterial color={BLACK} roughness={0.35} metalness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
      <Html position={[0, 1.42, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="w-56 rounded-2xl px-3.5 py-2.5 text-center font-mono text-[11px] leading-5 text-white transition-all duration-300"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0) scale(1)" : "translateY(6px) scale(0.96)",
            background: "rgba(8,10,18,0.86)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)",
            backdropFilter: "blur(6px)",
          }}
        >
          {msg}
        </div>
      </Html>
      <Hit
        p={[0, 0.55, 0]}
        s={[0.6, 1.2, 0.6]}
        onClick={() => {
          nav.current.wave = 1.4;
          nav.current.jump = 1;
          say(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
          sound.click();
          onSelect();
        }}
      />
    </group>
  );
}

/* ─────────── the window: click to flip day and night ─────────── */
export function WindowSwitch({ onToggle }: { onToggle: () => void }) {
  return <Hit p={[-3.42, 2.0, 0]} s={[0.3, 1.9, 2.3]} onClick={onToggle} />;
}

/* ─────────── clickable hotspots ─────────── */
export type HotspotCfg = {
  i: number;
  label: string;
  pos: V3;
  hit: { pos: V3; size: V3 };
};

function Hotspot({
  cfg,
  active,
  showAll,
  onSelect,
}: {
  cfg: HotspotCfg;
  active: boolean;
  showAll: boolean;
  onSelect: (i: number) => void;
}) {
  const accent = useAccent();
  const g = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);

  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.position.y = cfg.pos[1] + Math.sin(t * 1.6 + cfg.i) * 0.05;
    g.current.rotation.y = t * 1.1;
    const target = active ? 0.001 : hover ? 1.5 : 1;
    const s = g.current.scale.x + (target - g.current.scale.x) * Math.min(1, dt * 10);
    g.current.scale.setScalar(s);
  });

  return (
    <>
      <group ref={g} position={cfg.pos}>
        <mesh scale={[0.9, 1.35, 0.9]}>
          <octahedronGeometry args={[0.1, 0]} />
          <primitive object={accent.basic} attach="material" />
        </mesh>
      </group>
      <Hit p={cfg.pos} s={[0.6, 0.8, 0.6]} off={active} onClick={() => onSelect(cfg.i)} onOver={() => setHover(true)} onOut={() => setHover(false)} />
      {/* always mounted; visibility is a CSS fade so drei never has to tear the portal down mid-frame */}
      <Html position={[cfg.pos[0], cfg.pos[1] + 0.3, cfg.pos[2]]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.25em] text-white transition-opacity duration-300"
          style={{
            opacity: !active && (showAll || hover) ? 1 : 0,
            background: "rgba(8,10,18,0.78)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
            backdropFilter: "blur(6px)",
          }}
        >
          {cfg.label}
        </div>
      </Html>
      <Hit
        p={cfg.hit.pos}
        s={cfg.hit.size}
        off={active}
        onClick={() => onSelect(cfg.i)}
        onOver={() => setHover(true)}
        onOut={() => setHover(false)}
      />
    </>
  );
}

export const HOTSPOTS: HotspotCfg[] = [
  { i: 3, label: "PROJECTS", pos: [-1.95, 2.2, -2.65], hit: { pos: [-1.7, 1.4, -2.95], size: [1.5, 1.0, 0.8] } },
  { i: 2, label: "EXPERIENCE", pos: [0.6, 3.1, -3.15], hit: { pos: [0.6, 2.15, -3.25], size: [2.6, 1.3, 0.4] } },
  { i: 1, label: "ABOUT", pos: [-2.7, 1.7, 0.95], hit: { pos: [-2.85, 0.9, 1.3], size: [1.2, 1.6, 1.7] } },
  { i: 4, label: "SKILLS", pos: [0.4, 2.15, 0.8], hit: { pos: [0.4, 1.2, 0.8], size: [1.2, 1.5, 1.2] } },
  { i: 5, label: "CONTACT", pos: [2.6, 1.45, -2.92], hit: { pos: [2.6, 1.0, -2.92], size: [0.5, 0.7, 0.5] } },
];

export function Hotspots({
  section,
  onSelect,
}: {
  section: number;
  onSelect: (i: number) => void;
}) {
  return (
    <>
      {HOTSPOTS.map((h) => (
        <Hotspot key={h.i} cfg={h} active={section === h.i} showAll={section === 0} onSelect={onSelect} />
      ))}
    </>
  );
}
