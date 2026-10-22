"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { MOVIES } from "@/content/content";
import { sound } from "@/lib/sound";
import { useAccent } from "./accent";
import { pointerOff, type V3 } from "./Hit";
import { Hotspots, type HotspotCfg } from "./Props";
import { B, Lit } from "./Room";
import { canvasTexture } from "./textures";

/* ───────────────────────── the cinema screen: pick a film, press play ───────────────────────── */
const CW = 1600;
const CH = 900;
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

function makeCinema() {
  const cv = document.createElement("canvas");
  cv.width = CW;
  cv.height = CH;
  const ctx = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  let last = 0;
  const sans = 'system-ui, "Segoe UI", Roboto, sans-serif';
  const mono = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
  const ui = {
    selected: 0,
    hover: null as null | { kind: "poster" | "play"; i: number },
    posters: [] as Rect[],
    play: { x: 0, y: 0, w: 0, h: 0 } as Rect,
    playingSince: -1,
  };
  const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const DURATION = 11;

  const poster = (i: number, r: Rect, big: boolean) => {
    const m = MOVIES[i];
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    g.addColorStop(0, `hsl(${m.hue} 70% 24%)`);
    g.addColorStop(1, `hsl(${m.hue + 40} 85% 56%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 14);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(r.x + r.w * 0.62, r.y + r.h * 0.34, r.w * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + r.h);
    ctx.lineTo(r.x + r.w * 0.4, r.y + r.h * 0.55);
    ctx.lineTo(r.x + r.w * 0.75, r.y + r.h);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = `800 ${big ? 30 : 18}px ${sans}`;
    wrapText(ctx, m.title, r.w - 28).forEach((l, n) => ctx.fillText(l, r.x + 16, r.y + r.h - (big ? 66 : 42) + n * (big ? 34 : 21)));
  };

  const draw = (t: number, hue: number) => {
    if (t - last < 1 / 20) return;
    last = t;
    const acc = (l: number, a = 1) => `hsl(${hue} 90% ${l}% / ${a})`;
    const playing = ui.playingSince >= 0;
    const elapsed = playing ? t - ui.playingSince : 0;
    if (playing && elapsed > DURATION) ui.playingSince = -1;
    const m = MOVIES[ui.selected];

    if (playing && ui.playingSince >= 0) {
      // a made-up "trailer": drifting light, grain, the title coming in, and a progress bar
      const g = ctx.createLinearGradient(0, 0, CW, CH);
      g.addColorStop(0, `hsl(${m.hue} 70% ${10 + 6 * Math.sin(elapsed)}%)`);
      g.addColorStop(1, `hsl(${m.hue + 60} 80% ${20 + 8 * Math.sin(elapsed * 0.7)}%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CW, CH);
      for (let i = 0; i < 9; i++) {
        const x = ((elapsed * (60 + i * 18) + i * 220) % (CW + 400)) - 200;
        const lg = ctx.createLinearGradient(x, 0, x + 120, 0);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.5, `hsla(${m.hue + i * 12} 100% 70% / 0.18)`);
        lg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(x, 0, 120, CH);
      }
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`;
        ctx.fillRect(Math.random() * CW, Math.random() * CH, 3, 3);
      }
      const a = Math.min(1, elapsed / 2.2) * Math.min(1, (DURATION - elapsed) / 1.5);
      ctx.globalAlpha = a;
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${130 + elapsed * 6}px ${sans}`;
      ctx.fillText(m.title, CW / 2, CH / 2 + 30);
      ctx.font = `600 34px ${mono}`;
      ctx.fillStyle = acc(75);
      ctx.fillText(`${m.genre}  ·  ${m.year}`, CW / 2, CH / 2 + 100);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(60, CH - 60, CW - 120, 6);
      ctx.fillStyle = acc(65);
      ctx.fillRect(60, CH - 60, ((CW - 120) * elapsed) / DURATION, 6);
      ctx.textAlign = "left";
      ctx.font = `500 22px ${mono}`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("▶ TRAILER   ·   click anywhere to stop", 60, CH - 82);
      ui.posters.length = 0;
    } else {
      const g = ctx.createLinearGradient(0, 0, CW, CH);
      g.addColorStop(0, "#0b0710");
      g.addColorStop(1, "#1a0c18");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CW, CH);
      ctx.textAlign = "left";
      ctx.fillStyle = acc(66);
      ctx.font = `700 26px ${mono}`;
      ctx.fillText("★ NOW SHOWING", 60, 70);
      ctx.textAlign = "right";
      ctx.fillStyle = "#8a7d99";
      ctx.font = `500 24px ${mono}`;
      ctx.fillText(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), CW - 60, 70);

      // hero: big poster + info
      poster(ui.selected, { x: 60, y: 110, w: 300, h: 430 }, true);
      const x0 = 420;
      ctx.textAlign = "left";
      ctx.fillStyle = acc(70);
      ctx.font = `600 26px ${mono}`;
      ctx.fillText(`${m.genre}  ·  ${m.year}`, x0, 160);
      ctx.fillStyle = "#fff";
      ctx.font = `800 96px ${sans}`;
      wrapText(ctx, m.title, CW - x0 - 60).forEach((l, n) => ctx.fillText(l, x0, 260 + n * 100));
      ctx.font = `400 34px ${sans}`;
      ctx.fillStyle = "#c2b6d1";
      wrapText(ctx, m.blurb, 940).forEach((l, n) => ctx.fillText(l, x0, 410 + n * 48));
      ui.play = { x: x0, y: 470, w: 330, h: 80 };
      const hov = ui.hover?.kind === "play";
      ctx.fillStyle = hov ? acc(66) : acc(60, 0.16);
      ctx.beginPath();
      ctx.roundRect(ui.play.x, ui.play.y, ui.play.w, ui.play.h, 12);
      ctx.fill();
      ctx.strokeStyle = acc(64, 0.8);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = hov ? "#0b0710" : acc(80);
      ctx.font = `700 30px ${mono}`;
      ctx.fillText("▶  PLAY TRAILER", ui.play.x + ui.play.w / 2, ui.play.y + 52);

      // poster strip
      ui.posters.length = 0;
      MOVIES.forEach((_, i) => {
        const r = { x: 60 + i * 300, y: 590, w: 270, h: 250 };
        ui.posters.push(r);
        poster(i, r, false);
        if (i === ui.selected || (ui.hover?.kind === "poster" && ui.hover.i === i)) {
          ctx.strokeStyle = i === ui.selected ? acc(66) : "rgba(255,255,255,0.5)";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 17);
          ctx.stroke();
        }
      });
    }
    tex.needsUpdate = true;
  };

  const locate = (u: number, v: number): typeof ui.hover => {
    const x = u * CW;
    const y = (1 - v) * CH;
    if (ui.playingSince >= 0) return null;
    if (inRect(ui.play, x, y)) return { kind: "play", i: 0 };
    const pi = ui.posters.findIndex((r) => inRect(r, x, y));
    return pi >= 0 ? { kind: "poster", i: pi } : null;
  };

  return {
    tex,
    draw,
    move(u: number, v: number) {
      ui.hover = locate(u, v);
      return !!ui.hover || ui.playingSince >= 0;
    },
    leave() {
      ui.hover = null;
    },
    click(u: number, v: number, now: number) {
      if (ui.playingSince >= 0) {
        ui.playingSince = -1;
        return true;
      }
      const hit = locate(u, v);
      if (!hit) return false;
      if (hit.kind === "poster") ui.selected = hit.i;
      else ui.playingSince = now;
      return true;
    },
  };
}

function Screen({ active }: { active: boolean }) {
  const accent = useAccent();
  const [cinema] = useState(makeCinema);
  const downAt = useRef<[number, number] | null>(null);
  const clock = useRef(0);
  useFrame(({ clock: c }) => {
    clock.current = c.elapsedTime;
    if (accent.state.room !== "theater") return;
    cinema.draw(c.elapsedTime, accent.state.hue);
  });
  return (
    <group position={[-0.2, 2.0, -3.38]}>
      <B p={[0, 0, 0]} s={[3.4, 1.92, 0.08]} c="#08060b" r={0.03} rough={0.35} />
      <mesh
        position={[0, 0, 0.042]}
        onPointerMove={(e) => {
          if (!active || !e.uv) return;
          e.stopPropagation();
          document.body.style.cursor = cinema.move(e.uv.x, e.uv.y) ? "pointer" : "";
        }}
        onPointerOut={() => {
          cinema.leave();
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
          if (cinema.click(e.uv.x, e.uv.y, clock.current)) sound.click();
        }}
      >
        <planeGeometry args={[3.2, 1.8]} />
        <meshBasicMaterial map={cinema.tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── seats, curtains, posters, popcorn ───────────────────────── */
function Seat({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <B p={[0, 0.22, 0]} s={[0.5, 0.16, 0.5]} c="#7a1830" r={0.05} rough={0.95} />
      <B p={[0, 0.62, 0.2]} s={[0.5, 0.62, 0.12]} c="#8a1c36" r={0.06} rough={0.95} />
      <B p={[-0.28, 0.34, 0.02]} s={[0.07, 0.3, 0.46]} c="#2a1019" r={0.02} />
      <B p={[0.28, 0.34, 0.02]} s={[0.07, 0.3, 0.46]} c="#2a1019" r={0.02} />
      <B p={[0, 0.09, 0]} s={[0.42, 0.18, 0.42]} c="#1d0b12" r={0.02} />
    </group>
  );
}

function PosterFrame({ position, movie }: { position: V3; movie: number }) {
  const m = MOVIES[movie];
  const map = useMemo(
    () =>
      canvasTexture(256, 360, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, `hsl(${m.hue} 70% 22%)`);
        g.addColorStop(1, `hsl(${m.hue + 40} 85% 55%)`);
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        c.fillStyle = "rgba(255,255,255,0.85)";
        c.beginPath();
        c.arc(w * 0.62, h * 0.34, 44, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#fff";
        c.font = "800 26px system-ui, sans-serif";
        c.textAlign = "left";
        c.fillText(m.title.split(" ").slice(0, 2).join(" "), 18, h - 54);
        c.fillText(m.title.split(" ").slice(2).join(" "), 18, h - 24);
      }),
    [m],
  );
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      <B p={[0, 0, 0]} s={[0.78, 1.1, 0.05]} c="#0c0a10" />
      <mesh position={[0, 0, 0.028]}>
        <planeGeometry args={[0.68, 1.0]} />
        <meshBasicMaterial map={map} toneMapped={false} color="#d8d8d8" />
      </mesh>
    </group>
  );
}

const THEATER_HOTSPOTS: HotspotCfg[] = [
  { i: 11, label: "REEL", pos: [-0.2, 3.35, -3.0], hit: { pos: [-0.2, 2.0, -3.1], size: [3.6, 2.1, 0.5] } },
];

export default function Theater({
  section,
  onSelect,
}: {
  section: number;
  onSelect: (i: number) => void;
}) {
  const wall = "#2b1621";
  const marquee = useMemo(
    () =>
      canvasTexture(512, 128, (c, w, h) => {
        c.fillStyle = "#16090f";
        c.fillRect(0, 0, w, h);
        c.strokeStyle = "#ffb347";
        c.lineWidth = 6;
        c.strokeRect(8, 8, w - 16, h - 16);
        c.fillStyle = "#ffd27a";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = "800 52px system-ui, sans-serif";
        c.fillText("★ NOW SHOWING ★", w / 2, h / 2 + 3);
      }),
    [],
  );
  const accent = useAccent();
  const glow = useRef<THREE.PointLight>(null);
  useFrame(() => glow.current?.color.copy(accent.color));

  const cols = [-2.35, -1.8, -1.25, 0.85, 1.4, 1.95];
  const rows = [
    { z: -0.1, y: 0 },
    { z: 1.1, y: 0.16 },
    { z: 2.3, y: 0.32 },
  ];

  return (
    <group>
      {/* floor, aisle, risers */}
      <B p={[0, -0.15, 0]} s={[7.5, 0.3, 7.5]} c="#14080d" r={0.04} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#3a1420" roughness={1} />
      </mesh>
      <B p={[-0.2, 0.012, 0.6]} s={[0.7, 0.02, 6.4]} c="#5a1c2c" r={0.005} rough={1} />
      {rows.map((r, i) =>
        i === 0 ? null : <B key={i} p={[-0.2, r.y / 2, r.z]} s={[6.6, r.y, 1.2]} c="#22090f" r={0.01} />,
      )}
      {/* aisle lights */}
      {[-1.2, 0.2, 1.4, 2.6].map((z) => (
        <group key={z}>
          <Lit p={[-0.58, 0.03, z]} s={[0.04, 0.03, 0.12]} c="#ffb347" />
          <Lit p={[0.18, 0.03, z]} s={[0.04, 0.03, 0.12]} c="#ffb347" />
        </group>
      ))}

      {/* walls */}
      {/* back wall with a doorway (x 2.2 to 3.4) into the gallery behind */}
      <B p={[-0.8, 1.8, -3.6]} s={[6.0, 3.6, 0.2]} c={wall} rough={0.95} r={0.01} />
      <B p={[3.55, 1.8, -3.6]} s={[0.3, 3.6, 0.2]} c={wall} rough={0.95} r={0.01} />
      <B p={[2.8, 2.95, -3.6]} s={[1.2, 1.3, 0.2]} c={wall} rough={0.95} r={0.01} />
      <B p={[2.2, 1.15, -3.5]} s={[0.08, 2.3, 0.1]} c="#12070b" />
      <B p={[3.4, 1.15, -3.5]} s={[0.08, 2.3, 0.1]} c="#12070b" />
      {/* left wall with a doorway into the music room */}
      <B p={[-3.6, 1.8, -2.15]} s={[0.2, 3.6, 3.1]} c={wall} rough={0.95} r={0.01} />
      <B p={[-3.6, 1.8, 2.25]} s={[0.2, 3.6, 2.9000000000000004]} c={wall} rough={0.95} r={0.01} />
      <B p={[-3.6, 2.95, 0.1]} s={[0.2, 1.3, 1.4]} c={wall} rough={0.95} r={0.01} />
      <B p={[-3.5, 1.15, -0.6]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[-3.5, 1.15, 0.7999999999999999]} s={[0.1, 2.3, 0.08]} c="#0b0d14" />
      <B p={[0, 0.08, -3.465]} s={[7, 0.16, 0.05]} c="#12070b" />
      <B p={[-3.465, 0.08, 0]} s={[0.05, 0.16, 7]} c="#12070b" />

      {/* the screen + curtains */}
      <Screen active={section === 11} />
      {[-2.35, 1.95].map((x) => (
        <group key={x} position={[x, 0, -3.3]}>
          <B p={[0, 1.7, 0]} s={[0.6, 3.4, 0.18]} c="#7a1830" r={0.03} rough={1} />
          {[-0.2, 0, 0.2].map((fx) => (
            <mesh key={fx} position={[fx, 1.7, 0.1]}>
              <cylinderGeometry args={[0.05, 0.05, 3.3, 8]} />
              <meshStandardMaterial color="#5e1224" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      <B p={[-0.2, 3.35, -3.3]} s={[5.2, 0.3, 0.22]} c="#6a1428" r={0.04} rough={1} />

      {/* posters + marquee on the left wall */}
      <PosterFrame position={[-3.46, 1.9, -2.4]} movie={0} />
      <PosterFrame position={[-3.46, 1.9, -1.4]} movie={1} />
      <PosterFrame position={[-3.46, 1.9, 1.5]} movie={2} />
      <PosterFrame position={[-3.46, 1.9, 2.5]} movie={3} />
      <group position={[-3.45, 3.0, 0.2]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 0, 0]} s={[2.3, 0.56, 0.06]} c="#16090f" r={0.02} />
        <mesh position={[0, 0, 0.034]}>
          <planeGeometry args={[2.2, 0.48]} />
          <meshBasicMaterial map={marquee} toneMapped={false} color="#e6e6e6" />
        </mesh>
      </group>
      {[-1.4, 0.4, 2.2].map((z) => (
        <Lit key={z} p={[-3.44, 1.2, z]} s={[0.04, 0.3, 0.1]} c="#ffb347" />
      ))}

      {/* seats */}
      {rows.map((r) => cols.map((x) => <Seat key={x + "-" + r.z} p={[x, r.y, r.z]} />))}

      {/* popcorn corner */}
      <group position={[-2.9, 0, -2.75]}>
        <B p={[0, 0.5, 0]} s={[0.62, 1.0, 0.56]} c="#c1272d" r={0.03} />
        <B p={[0, 1.2, 0]} s={[0.56, 0.5, 0.5]} c="#ffe9a6" r={0.02} rough={0.2} />
        <B p={[0, 1.52, 0]} s={[0.6, 0.12, 0.54]} c="#c1272d" r={0.03} />
        <Lit p={[0, 1.2, 0.26]} s={[0.4, 0.3, 0.01]} c="#ffd27a" />
      </group>
      <mesh position={[-2.2, 0.16, -2.6]} castShadow>
        <cylinderGeometry args={[0.13, 0.1, 0.32, 20]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.7} />
      </mesh>

      <pointLight ref={glow} position={[-0.2, 2.0, -2.1]} intensity={2.4} distance={5} decay={2} />
      <pointLight position={[-0.2, 2.8, 1.4]} color="#ffb870" intensity={2.2} distance={6} decay={2} />

      <Hotspots section={section} onSelect={onSelect} list={THEATER_HOTSPOTS} roomId="theater" overview={10} />
    </group>
  );
}
