"use client";

import { useEffect, useRef, useState } from "react";
import { control, crowd, DOORS, furniture, hubsOf, ROOM_IDS, ROOM_ORIGIN, roomAt, SPACING, walkable } from "@/scene/nav";

// the house as an architect's blueprint: blue paper, white linework, door swings, furniture outlines, a title block,
// and a pulsing marker for where you are. Tap anywhere to walk there.
const X0 = -25.6;
const X1 = 15.2;
const Z0 = -15.6;
const Z1 = 5.4;
const R = 3.6;
const NAMES: Record<string, string> = {
  studio: "STUDIO",
  lounge: "LOUNGE",
  gallery: "GALLERY",
  theater: "THEATER",
  music: "MUSIC ROOM",
  flowers: "FLOWER SHOP",
  atelier: "ATELIER",
};

type Gaps = Record<"W" | "E" | "N" | "S", number[]>;
const gaps: Record<string, Gaps> = Object.fromEntries(ROOM_IDS.map((id) => [id, { W: [], E: [], N: [], S: [] }]));
// each doorway cuts the wall of the room it is in and the facing wall of the room beyond it
for (const d of DOORS) {
  const [ox, , oz] = ROOM_ORIGIN[d.room];
  if (d.wall === "W") {
    gaps[d.room].W.push(oz + d.at);
    gaps[d.to].E.push(oz + d.at);
  } else {
    gaps[d.room].N.push(ox + d.at);
    gaps[d.to].S.push(ox + d.at);
  }
}

export default function Blueprint({ className, large = false, onPick }: { className?: string; large?: boolean; onPick?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;
    const W = cv.width;
    const H = cv.height;
    const kx = W / (X1 - X0);
    const kz = H / (Z1 - Z0);
    const px = (x: number) => (x - X0) * kx;
    const pz = (z: number) => (z - Z0) * kz;
    const line = (x1: number, z1: number, x2: number, z2: number) => {
      c.beginPath();
      c.moveTo(px(x1), pz(z1));
      c.lineTo(px(x2), pz(z2));
      c.stroke();
    };
    const ink = "#d9eeff";
    const font = (s: number, w = 500) => `${w} ${Math.round(s * kx)}px ui-monospace, Consolas, monospace`;
    // a wall from a to b along one axis, leaving gaps where the doors are
    const wall = (axis: "x" | "z", fixed: number, a: number, b: number, g: number[]) => {
      const cuts = g.slice().sort((p, q) => p - q);
      let cur = a;
      const seg = (s: number, e: number) => (axis === "x" ? line(s, fixed, e, fixed) : line(fixed, s, fixed, e));
      for (const m of cuts) {
        seg(cur, m - 0.7);
        cur = m + 0.7;
      }
      seg(cur, b);
    };

    const draw = (t: number) => {
      // paper
      c.fillStyle = "#0b2f5e";
      c.fillRect(0, 0, W, H);
      c.lineWidth = 1;
      for (let x = Math.ceil(X0); x < X1; x++) {
        c.strokeStyle = x % 5 === 0 ? "rgba(217,238,255,0.2)" : "rgba(217,238,255,0.07)";
        line(x, Z0, x, Z1);
      }
      for (let z = Math.ceil(Z0); z < Z1; z++) {
        c.strokeStyle = z % 5 === 0 ? "rgba(217,238,255,0.2)" : "rgba(217,238,255,0.07)";
        line(X0, z, X1, z);
      }

      // hallways: dashed outlines
      c.strokeStyle = "rgba(217,238,255,0.55)";
      c.setLineDash([4, 4]);
      c.lineWidth = 1;
      const hall = (x: number, z: number, w: number, h: number) => c.strokeRect(px(x), pz(z), w * kx, h * kz);
      for (const cx of [-SPACING / 2, -SPACING * 1.5]) hall(cx - 1.5, Z0 + 1.6, 3, Z1 - Z0 - 3.2);
      hall(X0 + 1.6, -SPACING / 2 - 1.5, X1 - 8.6 - X0, 3);
      hall(SPACING / 2 - 1.5, Z0 + 1.6, 3, -3.7 - (Z0 + 1.6));
      c.setLineDash([]);

      for (const id of ROOM_IDS) {
        const [ox, , oz] = ROOM_ORIGIN[id];
        const here = control.room === id;
        // floor
        c.fillStyle = here ? "rgba(120,190,255,0.28)" : "rgba(217,238,255,0.06)";
        c.fillRect(px(ox - R), pz(oz - R), 2 * R * kx, 2 * R * kz);
        // walls, doubled like a drafted plan
        c.strokeStyle = ink;
        c.lineWidth = 3;
        wall("x", oz - R, ox - R, ox + R, gaps[id].N);
        wall("x", oz + R, ox - R, ox + R, gaps[id].S);
        wall("z", ox - R, oz - R, oz + R, gaps[id].W);
        wall("z", ox + R, oz - R, oz + R, gaps[id].E);
        c.lineWidth = 1;
        c.strokeStyle = "rgba(217,238,255,0.55)";
        c.strokeRect(px(ox - R + 0.25), pz(oz - R + 0.25), (2 * R - 0.5) * kx, (2 * R - 0.5) * kz);
        // name and area
        c.fillStyle = ink;
        c.textAlign = "center";
        c.font = font(0.7, 700);
        c.fillText(NAMES[id], px(ox), pz(oz - 2.75));
        c.fillStyle = "rgba(217,238,255,0.6)";
        c.font = font(0.52);
        c.fillText("49 M²", px(ox), pz(oz - 2.1));
        if (here) {
          c.strokeStyle = "#9fd8ff";
          c.lineWidth = 2;
          c.strokeRect(px(ox - R - 0.2), pz(oz - R - 0.2), (2 * R + 0.4) * kx, (2 * R + 0.4) * kz);
        }
      }

      // furniture, in thin lines
      c.strokeStyle = "rgba(159,216,255,0.8)";
      c.lineWidth = 1;
      for (const [x, z, r] of furniture()) {
        c.strokeRect(px(x - r * 0.8), pz(z - r * 0.8), r * 1.6 * kx, r * 1.6 * kz);
        line(x - r * 0.8, z - r * 0.8, x + r * 0.8, z + r * 0.8);
      }

      // door swings
      c.strokeStyle = ink;
      c.lineWidth = 1;
      for (const d of DOORS) {
        const [ox, , oz] = ROOM_ORIGIN[d.room];
        if (d.wall === "W") {
          const hx = ox - R;
          const hz = oz + d.at - 0.7;
          line(hx, hz, hx - 1.4, hz);
          c.beginPath();
          c.arc(px(hx), pz(hz), 1.4 * kx, Math.PI / 2, Math.PI);
          c.stroke();
        } else {
          const hx = ox + d.at - 0.7;
          const hz = oz - R;
          line(hx, hz, hx, hz - 1.4);
          c.beginPath();
          c.arc(px(hx), pz(hz), 1.4 * kx, -Math.PI / 2, 0);
          c.stroke();
        }
      }

      // overall dimensions along the top and the left edge
      c.strokeStyle = "rgba(217,238,255,0.7)";
      c.fillStyle = "rgba(217,238,255,0.85)";
      c.font = font(0.5);
      c.textAlign = "center";
      const top = Z0 + 0.9;
      line(-SPACING * 2 - R, top, R, top);
      line(-SPACING * 2 - R, top - 0.3, -SPACING * 2 - R, top + 0.3);
      line(R, top - 0.3, R, top + 0.3);
      c.fillText((SPACING * 2 + 2 * R).toFixed(1) + " M", px(-SPACING), pz(top) - 5);
      const left = X0 + 0.9;
      line(left, -SPACING - R, left, R);
      line(left - 0.3, -SPACING - R, left + 0.3, -SPACING - R);
      line(left - 0.3, R, left + 0.3, R);
      c.save();
      c.translate(px(left) - 5, pz(-SPACING / 2));
      c.rotate(-Math.PI / 2);
      c.fillText((SPACING + 2 * R).toFixed(1) + " M", 0, 0);
      c.restore();

      // north arrow
      const nx = X1 - 2.2;
      const nz = -4.9;
      c.strokeStyle = ink;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(px(nx), pz(nz), 1.2 * kx, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(px(nx), pz(nz - 1.0));
      c.lineTo(px(nx + 0.4), pz(nz + 0.5));
      c.lineTo(px(nx), pz(nz + 0.2));
      c.lineTo(px(nx - 0.4), pz(nz + 0.5));
      c.closePath();
      c.fill();
      c.textAlign = "center";
      c.font = font(0.55, 700);
      c.fillText("N", px(nx), pz(nz - 1.5));

      // title block
      const bx = 4.8;
      const bz = -2.4;
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.strokeRect(px(bx), pz(bz), 9.6 * kx, 5.6 * kz);
      line(bx, bz + 2.2, bx + 9.6, bz + 2.2);
      line(bx, bz + 3.9, bx + 9.6, bz + 3.9);
      c.textAlign = "left";
      c.fillStyle = ink;
      c.font = font(0.62, 700);
      c.fillText("CJ COLOMA RESIDENCE", px(bx + 0.4), pz(bz + 1.0));
      c.font = font(0.46);
      c.fillStyle = "rgba(217,238,255,0.75)";
      c.fillText("PORTFOLIO HOUSE · 7 ROOMS", px(bx + 0.4), pz(bz + 1.7));
      c.fillStyle = ink;
      c.font = font(0.56, 700);
      c.fillText("FLOOR PLAN", px(bx + 0.4), pz(bz + 3.2));
      c.font = font(0.46);
      c.fillStyle = "rgba(217,238,255,0.75)";
      c.fillText("SCALE 1:100   SHEET A-01", px(bx + 0.4), pz(bz + 4.7));

      // you are here
      const hue = document.documentElement.style.getPropertyValue("--hue") || "190";
      const x = px(crowd.walker.x);
      const y = pz(crowd.walker.z);
      const pulse = (Math.sin(t / 300) + 1) / 2;
      c.strokeStyle = `hsla(${hue} 100% 70% / ${0.8 - pulse * 0.6})`;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, (0.8 + pulse * 1.2) * kx, 0, Math.PI * 2);
      c.stroke();
      c.save();
      c.translate(x, y);
      c.rotate(Math.PI - control.yaw);
      c.fillStyle = `hsl(${hue} 100% 68%)`;
      c.strokeStyle = "#04162e";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, -1.0 * kx);
      c.lineTo(0.55 * kx, 0.6 * kx);
      c.lineTo(0, 0.25 * kx);
      c.lineTo(-0.55 * kx, 0.6 * kx);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    };
    draw(0);
    let timer = 0;
    const loop = () => {
      draw(performance.now());
      timer = window.setTimeout(loop, 90);
    };
    loop();
    return () => window.clearTimeout(timer);
  }, []);

  const go = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = X0 + ((e.clientX - r.left) / r.width) * (X1 - X0);
    const z = Z0 + ((e.clientY - r.top) / r.height) * (Z1 - Z0);
    let to: [number, number] = [x, z];
    if (!walkable(x, z)) {
      // landed on a wall or outside: head for the nearest room instead
      const room =
        roomAt([x, z]) ??
        ROOM_IDS.slice().sort(
          (a, b) => Math.hypot(ROOM_ORIGIN[a][0] - x, ROOM_ORIGIN[a][2] - z) - Math.hypot(ROOM_ORIGIN[b][0] - x, ROOM_ORIGIN[b][2] - z),
        )[0];
      to = hubsOf(room)[0];
    }
    window.dispatchEvent(new CustomEvent("walk-goto", { detail: to }));
    onPick?.();
  };

  const w = large ? 1400 : 760;
  return (
    <canvas
      ref={ref}
      width={w}
      height={Math.round((w * (Z1 - Z0)) / (X1 - X0))}
      aria-label="Blueprint of the house. Tap a place to walk there."
      className={"pointer-events-auto cursor-pointer rounded-md " + (className ?? "")}
      style={{ boxShadow: "0 0 0 1px rgba(217,238,255,0.5), 0 10px 40px rgba(0,0,0,0.5)" }}
      onPointerDown={go}
    />
  );
}

// a small blueprint you can open up big
export function BlueprintDock({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={"pointer-events-auto absolute " + className}>
        <Blueprint className="w-full" />
        <button
          onClick={() => setOpen(true)}
          aria-label="Enlarge the blueprint"
          className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-[#04162e]/80 text-[11px] text-white/80"
        >
          ⤢
        </button>
      </div>
      {open && (
        <div
          className="pointer-events-auto fixed inset-0 z-[20] flex items-center justify-center bg-[#04162e]/85 p-3 backdrop-blur-sm"
          data-ui
          onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative max-h-full w-full max-w-5xl">
            <Blueprint large className="max-h-[88vh] w-full object-contain" onPick={() => setOpen(false)} />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close the blueprint"
              className="absolute right-2 top-2 flex h-8 cursor-pointer items-center rounded bg-[#04162e]/90 px-3 font-mono text-[11px] tracking-[0.2em] text-white"
            >
              CLOSE ✕
            </button>
            <p className="mt-2 text-center font-mono text-[10px] tracking-[0.25em] text-white/60">TAP A ROOM OR A HALL TO WALK THERE</p>
          </div>
        </div>
      )}
    </>
  );
}
