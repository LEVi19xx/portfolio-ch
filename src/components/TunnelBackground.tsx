"use client";

import { useEffect, useRef } from "react";

const HALF_W = 1.6;
const HALF_H = 1;
const RING_SPACING = 0.55;
const RING_COUNT = 64;
const NEAR = 0.35;
const SEGMENTS = 6;
const BULGE_RADIUS = 200;
const BULGE_STRENGTH = 0.28;

type Vec3 = [number, number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// stations are gates along the tunnel; you "arrive" STAND units in front of each one
const GATE_GAP = 14;
const STAND = 5;

type Props = {
  stations: string[];
  onActive: (index: number) => void;
  registerFlyTo: (fn: (index: number) => void) => void;
};

export default function TunnelBackground({ stations, onActive, registerFlyTo }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onActiveRef = useRef(onActive);
  useEffect(() => {
    onActiveRef.current = onActive;
  }, [onActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // raw pointer target; the smoothed cursor drives the camera and the lens bulge
    const target = { x: w / 2, y: h / 2 };
    const cursor = { x: w * 0.65, y: h / 2 };
    // journey: travel eases toward goal; scroll/keys/hold move the goal, idle snaps to a gate
    const lastStation = stations.length - 1;
    let travel = 0;
    let goal = 0;
    let vel = 0;
    let drift = 0;
    let lastInput = 0;
    let activeIdx = -2;
    let pressed = false;
    const nudge = (d: number) => {
      goal = Math.max(-2, Math.min(lastStation * GATE_GAP + 2, goal + d));
      lastInput = performance.now();
    };
    const jump = (i: number) => {
      goal = Math.max(0, Math.min(lastStation, i)) * GATE_GAP;
      lastInput = performance.now() + 1500;
    };
    registerFlyTo(jump);
    // holding the mouse charges up: hue cycles endlessly and a color wave runs down the tunnel
    let hue = 212;
    let hueVel = 0;
    let lastHue = -1;
    let lastHueWrite = 0;
    let charge = 0;
    let nextWave = 0;
    const waves: number[] = [];
    const streaks: { x: number; y: number; z: number; v: number; len: number }[] = [];
    let nextStreak = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      nudge(e.deltaY * 0.012);
    };
    const onKey = (e: KeyboardEvent) => {
      const here = Math.round(goal / GATE_GAP);
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
        jump(here + 1);
        e.preventDefault();
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        jump(here - 1);
        e.preventDefault();
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      nudge((touchY - y) * 0.05);
      touchY = y;
    };
    const onDown = (e: PointerEvent) => {
      // holding on buttons/links/cards shouldn't launch the camera
      if ((e.target as HTMLElement | null)?.closest("a,button,[data-ui]")) return;
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const camera = { x: 0, y: 0 };
    let focal = 0;
    let bendT = 0;
    const out: [number, number] = [0, 0];

    // tunnel space -> screen, then push points away from the cursor (lens bulge)
    const project = (X: number, Y: number, Z: number, strength: number) => {
      const s = focal / Z;
      // the tunnel snakes: the centerline sways sideways and up/down with depth,
      // anchored at the camera so the near end stays straight
      const wz = Z + travel;
      const bx =
        Math.sin(wz * 0.11 + bendT * 0.5) * 1.9 -
        Math.sin(travel * 0.11 + bendT * 0.5) * 1.9 +
        Math.sin(wz * 0.047 - bendT * 0.3) * 1.2 -
        Math.sin(travel * 0.047 - bendT * 0.3) * 1.2;
      const by =
        Math.sin(wz * 0.083 + 1.7 + bendT * 0.4) * 0.8 -
        Math.sin(travel * 0.083 + 1.7 + bendT * 0.4) * 0.8;
      let px = w / 2 + (X + bx - camera.x) * s;
      let py = h / 2 + (Y + by - camera.y) * s;
      const dx = px - cursor.x;
      const dy = py - cursor.y;
      const d2 = dx * dx + dy * dy;
      const r2 = BULGE_RADIUS * BULGE_RADIUS;
      if (d2 < r2 * 6) {
        const k = 1 + strength * Math.exp(-d2 / r2);
        px = cursor.x + dx * k;
        py = cursor.y + dy * k;
      }
      out[0] = px;
      out[1] = py;
    };

    const polyline = (pts: Vec3[], strength: number) => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        project(pts[i][0], pts[i][1], pts[i][2], strength);
        if (i === 0) ctx.moveTo(out[0], out[1]);
        else ctx.lineTo(out[0], out[1]);
      }
      ctx.stroke();
    };

    const passes = [
      { shift: 150, light: 55, strength: BULGE_STRENGTH * 1.55, mul: 0.4 },
      { shift: -110, light: 55, strength: BULGE_STRENGTH * 1.3, mul: 0.35 },
      { shift: 0, light: 60, strength: BULGE_STRENGTH, mul: 1 },
    ];

    const farZ = RING_COUNT * RING_SPACING;
    const longZs: number[] = [];
    for (let s = 0; s <= 40; s++) {
      longZs.push(NEAR * 0.6 + (s / 40) ** 2.2 * farZ * 0.6);
    }
    const corners: [number, number][] = [
      [-HALF_W, -HALF_H],
      [HALF_W, -HALF_H],
      [HALF_W, HALF_H],
      [-HALF_W, HALF_H],
    ];

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const follow = 1 - Math.pow(0.05, dt);
      cursor.x = lerp(cursor.x, target.x, follow);
      cursor.y = lerp(cursor.y, target.y, follow);

      const nx = (cursor.x / w - 0.5) * 2;
      const ny = (cursor.y / h - 0.5) * 2;
      const camFollow = 1 - Math.pow(0.25, dt);
      camera.x = lerp(camera.x, nx * HALF_W * 0.22, camFollow);
      camera.y = lerp(camera.y, ny * HALF_H * 0.22, camFollow);
      focal = Math.max(w, h) * 0.55;
      if (!reduceMotion) bendT += dt;

      if (pressed && !reduceMotion) nudge(5 * dt);
      if (now - lastInput > 650 && !pressed) {
        goal = Math.max(0, Math.min(lastStation, Math.round(goal / GATE_GAP))) * GATE_GAP;
      }
      const prevTravel = travel;
      travel = lerp(travel, goal, 1 - Math.pow(reduceMotion ? 0.0001 : 0.04, dt));
      vel = dt > 0 ? (travel - prevTravel) / dt : 0;
      if (!reduceMotion) drift += dt * 0.35;
      // speed punch: the lens widens while flying
      focal *= 1 + Math.min(0.3, Math.abs(vel) * 0.012);

      const nearest = Math.round(travel / GATE_GAP);
      const here =
        Math.abs(vel) < 0.6 && Math.abs(travel - nearest * GATE_GAP) < 1.2 ? nearest : -1;
      if (here !== activeIdx) {
        activeIdx = here;
        onActiveRef.current(here);
      }

      charge = lerp(charge, pressed && !reduceMotion ? 1 : 0, 1 - Math.pow(0.15, dt));
      hueVel = lerp(hueVel, charge * 110, 1 - Math.pow(0.2, dt));
      hue = (hue + hueVel * dt) % 360;
      const hueInt = Math.round(hue);
      if (hueInt !== lastHue && now - lastHueWrite > 80) {
        lastHue = hueInt;
        lastHueWrite = now;
        document.documentElement.style.setProperty("--hue", String(hueInt));
      }
      const spread = charge * 5;
      if (pressed && now > nextWave) {
        waves.push(now);
        nextWave = now + 450;
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#03040a";
      ctx.fillRect(0, 0, w, h);
      ctx.lineJoin = "round";
      ctx.lineWidth = 1;

      const ringPos = travel + drift;
      const phase = ((ringPos % RING_SPACING) + RING_SPACING) % RING_SPACING;

      for (const pass of passes) {
        const ghost = pass.mul < 1;

        // rectangular rings flowing toward the viewer
        for (let i = 0; i < RING_COUNT; i++) {
          const z = NEAR + i * RING_SPACING - phase;
          if (z < NEAR * 0.6 || (ghost && i % 2)) continue;
          const fade = Math.max(0, 1 - z / farZ);
          const near = Math.min(1, (z - NEAR * 0.6) / 0.6);
          ctx.globalAlpha = pass.mul * (0.15 + fade * 0.85) * near;
          ctx.strokeStyle = `hsl(${(hue + pass.shift + z * spread + 720) % 360} 100% ${pass.light}%)`;

          const ring: Vec3[] = [];
          for (let c = 0; c < 4; c++) {
            const [x0, y0] = corners[c];
            const [x1, y1] = corners[(c + 1) % 4];
            for (let s = 0; s < SEGMENTS; s++) {
              const t = s / SEGMENTS;
              ring.push([lerp(x0, x1, t), lerp(y0, y1, t), z]);
            }
          }
          ring.push(ring[0]);
          polyline(ring, pass.strength);
        }

        if (ghost) continue;

        // lines running down the floor, ceiling and walls
        ctx.globalAlpha = pass.mul * 0.55;
        ctx.strokeStyle = `hsl(${(hue + pass.shift + 720) % 360} 100% ${pass.light}%)`;
        const line = (x: number, y: number) =>
          polyline(
            longZs.map((z): Vec3 => [x, y, z]),
            pass.strength,
          );
        for (let i = 0; i <= 8; i++) {
          const x = lerp(-HALF_W, HALF_W, i / 8);
          ctx.globalAlpha = pass.mul * (i === 4 ? 0.95 : 0.5);
          line(x, -HALF_H);
          line(x, HALF_H);
        }
        ctx.globalAlpha = pass.mul * 0.95;
        line(-HALF_W, 0);
        line(HALF_W, 0);
        ctx.globalAlpha = pass.mul * 0.5;
        for (let i = 1; i < 4; i++) {
          const y = lerp(-HALF_H, HALF_H, i / 4);
          line(-HALF_W, y);
          line(HALF_W, y);
        }
      }

      // gates: one glowing doorway per station, with its label floating above
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k <= lastStation; k++) {
        const z = STAND + k * GATE_GAP - travel;
        if (z < NEAR || z > 55) continue;
        const a = Math.min(1, (z - NEAR) / 1.5) * Math.min(1, (55 - z) / 25);
        const gh = (hue + 170) % 360;
        const pulse = 0.75 + Math.sin(now / 400 + k) * 0.25;
        ctx.lineJoin = "miter";
        for (let layer = 0; layer < 3; layer++) {
          const inset = [0, 0, 0.12][layer];
          const hw = HALF_W - inset;
          const hh = HALF_H - inset;
          ctx.strokeStyle = `hsl(${gh} 100% ${layer === 0 ? 70 : 55}% / ${a * [0.2, 0.95, 0.4][layer] * pulse})`;
          ctx.lineWidth = [7, 2.5, 1][layer];
          polyline(
            [[-hw, -hh, z], [hw, -hh, z], [hw, hh, z], [-hw, hh, z], [-hw, -hh, z]],
            BULGE_STRENGTH,
          );
        }
        project(0, -HALF_H - 0.25, z, BULGE_STRENGTH);
        const size = Math.max(7, Math.min(64, (focal * 0.2) / z));
        ctx.font = `bold ${size}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = `hsl(${gh} 100% 78% / ${a})`;
        ctx.fillText(`0${k + 1} // ${stations[k]}`, out[0], out[1]);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.lineJoin = "round";

      // glowing light streaks racing down the corner edges and wall lines
      ctx.globalCompositeOperation = "lighter";
      if (!reduceMotion && streaks.length < 7 && now > nextStreak) {
        const c = corners[Math.floor(Math.random() * 4)];
        const onWall = Math.random() < 0.4;
        streaks.push({
          x: onWall ? c[0] : lerp(-HALF_W, HALF_W, Math.floor(Math.random() * 9) / 8),
          y: onWall ? lerp(-HALF_H, HALF_H, Math.floor(Math.random() * 5) / 4) : c[1],
          z: farZ * 0.55,
          v: 5 + Math.random() * 6,
          len: 1.2 + Math.random() * 1.6,
        });
        nextStreak = now + 350 + Math.random() * 700;
      }
      ctx.lineCap = "round";
      for (let i = streaks.length - 1; i >= 0; i--) {
        const st = streaks[i];
        st.z -= st.v * dt;
        if (st.z < NEAR * 0.8) {
          streaks.splice(i, 1);
          continue;
        }
        const head = Math.max(NEAR * 0.7, st.z);
        const tail = head + st.len;
        project(st.x, st.y, tail, BULGE_STRENGTH);
        const tx = out[0];
        const ty = out[1];
        project(st.x, st.y, head, BULGE_STRENGTH);
        const g = ctx.createLinearGradient(tx, ty, out[0], out[1]);
        const sh = (hue + 170) % 360;
        g.addColorStop(0, `hsl(${sh} 100% 60% / 0)`);
        g.addColorStop(1, `hsl(${sh} 100% 72% / 0.95)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = Math.min(6, 1.2 + 3 / head);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(out[0], out[1]);
        ctx.stroke();
      }
      ctx.lineCap = "butt";

      // node glows where ring corners meet the wall lines
      for (let i = 0; i < RING_COUNT; i += 2) {
        const z = NEAR + i * RING_SPACING - phase;
        if (z < NEAR) continue;
        const fade = Math.max(0, 1 - z / farZ);
        ctx.fillStyle = `hsl(${(hue + 20 + z * spread) % 360} 100% 65% / ${0.2 + fade * 0.5})`;
        const size = Math.min(6, 1.5 + 2 / z);
        for (const [cx, cy] of corners) {
          project(cx, cy, z, BULGE_STRENGTH);
          ctx.fillRect(out[0] - size / 2, out[1] - size / 2, size, size);
        }
      }

      // soft colored glow hugging the screen edges
      const edge = Math.min(w, h) * 0.22;
      const glow = 0.1 + charge * 0.18 + Math.sin(now / 1800) * 0.03;
      const eh = `${hue} 100% 55%`;
      const sides: [number, number, number, number, number, number][] = [
        [0, 0, 0, edge, w, edge],
        [0, h, 0, h - edge, w, edge],
        [0, 0, edge, 0, edge, h],
        [w, 0, w - edge, 0, edge, h],
      ];
      for (const [x0, y0, x1, y1, rw, rh] of sides) {
        const eg = ctx.createLinearGradient(x0, y0, x1, y1);
        eg.addColorStop(0, `hsl(${eh} / ${glow})`);
        eg.addColorStop(1, `hsl(${eh} / 0)`);
        ctx.fillStyle = eg;
        const rx = x0 === w ? w - edge : 0;
        const ry = y0 === h ? h - edge : 0;
        ctx.fillRect(rx, ry, rw, rh);
      }
      ctx.globalCompositeOperation = "source-over";

      // shockwaves rippling out from the cursor while held
      while (waves.length && now - waves[0] > 1400) waves.shift();
      for (const t0 of waves) {
        const age = (now - t0) / 1400;
        ctx.globalAlpha = (1 - age) * 0.6;
        ctx.strokeStyle = `hsl(${hue} 100% 65%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 14 + age * 320, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 1;

      // dark core at the end of the tunnel
      ctx.globalAlpha = 1;
      // follow the bend: the core sits where the far end of the tunnel projects
      project(0, 0, farZ * 0.5, 0);
      const coreX = out[0];
      const coreY = out[1];
      const core = ctx.createRadialGradient(
        coreX,
        coreY,
        0,
        coreX,
        coreY,
        Math.min(w, h) * 0.25,
      );
      core.addColorStop(0, "rgba(3,4,10,0.95)");
      core.addColorStop(1, "rgba(3,4,10,0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      // reticle at the cursor
      const pulse = 1 + Math.sin(now / 330) * 0.08;
      ctx.save();
      ctx.translate(cursor.x, cursor.y);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `hsl(${(hue - 50 + 360) % 360} 100% 62%)`;
      ctx.lineWidth = 1.2;
      const r = 10 * pulse;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = `hsl(${(hue - 50 + 360) % 360} 100% 62% / 0.5)`;
      for (const [ax, ay] of [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ]) {
        const bx = ax * 22;
        const by = ay * 22;
        ctx.beginPath();
        ctx.moveTo(bx + ay * 4 - ax * 4, by + ax * 4 - ay * 4);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx - ay * 4 - ax * 4, by - ax * 4 - ay * 4);
        ctx.stroke();
      }
      ctx.restore();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [stations, registerFlyTo]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 h-full w-full"
    />
  );
}
