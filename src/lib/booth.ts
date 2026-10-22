"use client";

import { useSyncExternalStore } from "react";

// The photobooth in the gallery: frame templates (polaroid, couple, photo strip, heart), themes, and the prints pinned to the booth.
export type TemplateId = "polaroid" | "couple" | "strip" | "heart";
export const TEMPLATES: { id: TemplateId; name: string; shots: number; w: number; h: number; blurb: string }[] = [
  { id: "polaroid", name: "POLAROID", shots: 1, w: 640, h: 780, blurb: "One photo, a white border and a caption." },
  { id: "couple", name: "COUPLE POLAROID", shots: 2, w: 1040, h: 780, blurb: "Two photos side by side with a heart between them." },
  { id: "strip", name: "PHOTO STRIP", shots: 4, w: 480, h: 1500, blurb: "Four quick shots, the classic booth strip." },
  { id: "heart", name: "HEART FRAME", shots: 1, w: 760, h: 840, blurb: "A heart-shaped frame for two." },
];

export type ThemeId = "cream" | "blush" | "noir" | "sky" | "mint";
export const THEMES: { id: ThemeId; name: string; bg: string; ink: string; accent: string }[] = [
  { id: "cream", name: "CREAM", bg: "#f7f0e1", ink: "#3a2f45", accent: "#e07a8f" },
  { id: "blush", name: "BLUSH", bg: "#fbd6df", ink: "#5a2a3d", accent: "#e0314b" },
  { id: "noir", name: "NOIR", bg: "#17171d", ink: "#f3ece0", accent: "#ff8fb1" },
  { id: "sky", name: "SKY", bg: "#cfe6ff", ink: "#1f3a5a", accent: "#5aa9ff" },
  { id: "mint", name: "MINT", bg: "#d8f1e6", ink: "#1f4a3c", accent: "#3fbf7f" },
];

export type Shot = { source: CanvasImageSource; w: number; h: number };

function heartPath(c: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  c.beginPath();
  c.moveTo(cx, cy + s * 0.9);
  c.bezierCurveTo(cx - s * 1.6, cy - s * 0.1, cx - s * 0.9, cy - s * 1.2, cx, cy - s * 0.45);
  c.bezierCurveTo(cx + s * 0.9, cy - s * 1.2, cx + s * 1.6, cy - s * 0.1, cx, cy + s * 0.9);
  c.closePath();
}

// draw a shot into a rectangle, cropped to fill it
function cover(c: CanvasRenderingContext2D, shot: Shot, x: number, y: number, w: number, h: number) {
  const k = Math.max(w / shot.w, h / shot.h);
  const sw = w / k;
  const sh = h / k;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.drawImage(shot.source, (shot.w - sw) / 2, (shot.h - sh) / 2, sw, sh, x, y, w, h);
  c.restore();
}

function tape(c: CanvasRenderingContext2D, x: number, y: number, rot: number, color: string) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = color;
  c.globalAlpha = 0.55;
  c.fillRect(-60, -16, 120, 32);
  c.globalAlpha = 1;
  c.restore();
}

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? line + " " + w : w;
    if (c.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

// compose the final print
export function compose(id: TemplateId, themeId: ThemeId, shots: Shot[], caption: string, date: string): HTMLCanvasElement {
  const tpl = TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
  const th = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const cv = document.createElement("canvas");
  cv.width = tpl.w;
  cv.height = tpl.h;
  const c = cv.getContext("2d");
  if (!c) return cv;
  const shot = (i: number) => shots[Math.min(i, shots.length - 1)];
  c.fillStyle = th.bg;
  c.fillRect(0, 0, tpl.w, tpl.h);
  c.textAlign = "center";
  c.textBaseline = "alphabetic";
  const script = "italic 700 46px 'Segoe Script', 'Brush Script MT', 'Bradley Hand', cursive";
  const small = "600 24px ui-monospace, Consolas, monospace";
  const text = caption.trim();

  if (shots.length > 0 && id === "polaroid") {
    c.shadowColor = "rgba(0,0,0,0.25)";
    c.shadowBlur = 18;
    cover(c, shot(0), 40, 40, 560, 560);
    c.shadowBlur = 0;
    c.strokeStyle = th.ink;
    c.globalAlpha = 0.12;
    c.lineWidth = 3;
    c.strokeRect(40, 40, 560, 560);
    c.globalAlpha = 1;
    c.fillStyle = th.ink;
    c.font = script;
    wrap(c, text || "us, today", 540).slice(0, 2).forEach((l, i) => c.fillText(l, 320, 668 + i * 50));
    c.fillStyle = th.accent;
    c.font = small;
    c.fillText(date, 320, 756);
    tape(c, 320, 26, -0.04, th.accent);
  } else if (shots.length > 0 && id === "couple") {
    cover(c, shot(0), 40, 40, 460, 580);
    cover(c, shot(1), 540, 40, 460, 580);
    c.strokeStyle = th.bg;
    c.lineWidth = 10;
    heartPath(c, 520, 330, 62);
    c.fillStyle = th.accent;
    c.fill();
    c.stroke();
    c.fillStyle = th.ink;
    c.font = script;
    wrap(c, text || "you and me", 940).slice(0, 1).forEach((l) => c.fillText(l, 520, 696));
    c.fillStyle = th.accent;
    c.font = small;
    c.fillText(date, 520, 750);
    tape(c, 200, 22, -0.08, th.accent);
    tape(c, 840, 22, 0.08, th.accent);
  } else if (shots.length > 0 && id === "strip") {
    for (let i = 0; i < 4; i++) cover(c, shot(i), 40, 40 + i * 330, 400, 300);
    c.fillStyle = th.accent;
    heartPath(c, 240, 1396, 20);
    c.fill();
    c.fillStyle = th.ink;
    c.font = "italic 700 38px 'Segoe Script', 'Brush Script MT', cursive";
    c.fillText((text || "photobooth").slice(0, 22), 240, 1448);
    c.fillStyle = th.accent;
    c.font = "600 20px ui-monospace, Consolas, monospace";
    c.fillText(date, 240, 1482);
  } else if (shots.length > 0 && id === "heart") {
    c.save();
    heartPath(c, 380, 360, 230);
    c.clip();
    cover(c, shot(0), 0, 0, 760, 680);
    c.restore();
    c.strokeStyle = th.accent;
    c.lineWidth = 14;
    heartPath(c, 380, 360, 230);
    c.stroke();
    c.fillStyle = th.ink;
    c.font = script;
    wrap(c, text || "love", 640).slice(0, 1).forEach((l) => c.fillText(l, 380, 730));
    c.fillStyle = th.accent;
    c.font = small;
    c.fillText(date, 380, 790);
  }
  // little hearts in the corners
  c.fillStyle = th.accent;
  c.globalAlpha = 0.8;
  for (const [x, y, s] of [
    [tpl.w - 46, tpl.h - 46, 11],
    [46, tpl.h - 46, 8],
  ] as [number, number, number][]) {
    heartPath(c, x, y, s);
    c.fill();
  }
  c.globalAlpha = 1;
  return cv;
}

/* ───────────── the prints pinned to the booth, and the flash ───────────── */
type BoothState = { prints: string[]; flashAt: number };
let state: BoothState = { prints: [], flashAt: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<BoothState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const booth = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  pin: (url: string) => set({ prints: [url, ...state.prints].slice(0, 4) }),
  clear: () => set({ prints: [] }),
  flash: () => set({ flashAt: Date.now() }),
};
export const useBooth = () => useSyncExternalStore(booth.subscribe, booth.get, booth.get);
