"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EXPERIENCE, PROFILE } from "@/content/content";
import { sound } from "@/lib/sound";
import { useAccent } from "./accent";
import { Hit, pointerOff, type V3 } from "./Hit";
import { BED_CAT, BED_DOG, crowd, findPath, HUBS, type P2 } from "./nav";
import { B, Lit } from "./Room";
import { badgeDetailTexture, canvasTexture, cardTexture } from "./textures";

/* ───────────────────────── ID badges: pick one and it swings out, huge, with the details ───────────────────────── */
export function Badges({ onOpen, active }: { onOpen: (index: number) => void; active: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const [selected, setSelected] = useState(0);
  const sel = active ? selected : -1;

  const entries = useMemo(
    () => [
      ...EXPERIENCE.map((e, i) => ({
        role: e.role,
        org: e.org,
        period: e.period,
        note: e.note,
        hue: [200, 160, 28][i % 3],
        hint: "CLICK ANOTHER BADGE",
      })),
      {
        role: "Your next role?",
        org: "Open",
        period: "2026 →",
        note: "I am open to new work. If you have something interesting, let us talk.",
        hue: 300,
        hint: "CLICK AGAIN TO CONTACT ME",
      },
    ],
    [],
  );
  const small = useMemo(() => entries.map((e) => cardTexture(e.role, e.org, e.period, e.hue)), [entries]);
  const big = useMemo(
    () => entries.map((e) => badgeDetailTexture(e.role, e.org, e.period, e.note, e.hue, e.hint)),
    [entries],
  );

  // a badge clicked in another view (or the old sheet) can ask us to open a specific one
  useEffect(() => {
    const onSelect = (e: Event) => setSelected((e as CustomEvent<number>).detail ?? 0);
    window.addEventListener("ops-select", onSelect);
    return () => window.removeEventListener("ops-select", onSelect);
  }, []);

  useFrame(({ clock }, dt) => {
    const k = Math.min(1, dt * 6);
    refs.current.forEach((g, i) => {
      if (!g) return;
      const on = sel === i;
      const baseX = -0.88 + i * 0.58;
      g.position.x += ((on ? 0 : baseX) - g.position.x) * k;
      g.position.y += ((on ? 0.53 : 0) - g.position.y) * k;
      g.position.z += ((on ? 0.95 : 0) - g.position.z) * k;
      const s = g.scale.x + ((on ? 2.1 : 1) - g.scale.x) * k;
      g.scale.setScalar(s);
      g.rotation.z = on ? 0 : Math.sin(clock.elapsedTime * 0.9 + i * 1.7) * 0.025;
      const m = mats.current[i];
      if (m) {
        const c = sel >= 0 && !on ? 0.38 : 1;
        m.color.setScalar(m.color.r + (c - m.color.r) * k);
      }
    });
  });

  return (
    <group position={[0.6, 2.62, -3.41]}>
      {entries.map((e, i) => (
        <group key={e.org} position={[-0.88 + i * 0.58, 0, 0]} ref={(el) => void (refs.current[i] = el)}>
          <Lit p={[0, -0.17, 0]} s={[0.014, 0.34, 0.004]} c="#d8dcec" />
          <B p={[0, -0.57, 0]} s={[0.36, 0.48, 0.012]} c="#f3f5fa" r={0.012} rough={0.5} />
          <mesh position={[0, -0.57, 0.0075]}>
            <planeGeometry args={[0.34, 0.46]} />
            <meshBasicMaterial ref={(el) => void (mats.current[i] = el)} map={sel === i ? big[i] : small[i]} toneMapped={false} />
          </mesh>
          <Hit
            p={[0, -0.57, 0.04]}
            s={[0.38, 0.5, 0.06]}
            always
            off={!active}
            onClick={() => {
              sound.click();
              if (i === 3 && sel === 3) onOpen(3);
              else setSelected(i);
            }}
          />
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── the open book on its stand: the bio is printed on its pages ───────────────────────── */
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

function makeBook() {
  const W = 1280;
  const H = 860;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  let lastHue = -999;
  const serif = 'Georgia, "Times New Roman", serif';
  const mono = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

  const draw = (hue: number) => {
    if (Math.abs(hue - lastHue) < 4) return;
    lastHue = hue;
    const ink = "#2a2433";
    const acc = `hsl(${hue} 70% 36%)`;
    // paper + gutter shadow
    ctx.fillStyle = "#efe7d4";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(W / 2 - 90, 0, W / 2 + 90, 0);
    g.addColorStop(0, "rgba(60,40,20,0)");
    g.addColorStop(0.5, "rgba(60,40,20,0.28)");
    g.addColorStop(1, "rgba(60,40,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(W / 2 - 90, 0, 180, H);

    // left page
    ctx.textAlign = "left";
    ctx.fillStyle = acc;
    ctx.font = `600 22px ${mono}`;
    ctx.fillText("02 // BIO", 80, 100);
    ctx.fillStyle = ink;
    ctx.font = `700 60px ${serif}`;
    let y = 190;
    wrapText(ctx, "I build interfaces that feel alive.", 500).forEach((l) => {
      ctx.fillText(l, 80, y);
      y += 70;
    });
    ctx.fillStyle = acc;
    ctx.fillRect(80, y - 24, 90, 5);
    ctx.font = `400 29px ${serif}`;
    ctx.fillStyle = ink;
    y += 34;
    PROFILE.bio.forEach((p) => {
      wrapText(ctx, p, 500).forEach((l) => {
        ctx.fillText(l, 80, y);
        y += 44;
      });
      y += 20;
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a7f68";
    ctx.font = `italic 22px ${serif}`;
    ctx.fillText("— 1 —", W / 4, H - 50);

    // right page
    ctx.textAlign = "left";
    let sx = 700;
    PROFILE.stats.forEach((s) => {
      ctx.fillStyle = ink;
      ctx.font = `700 76px ${serif}`;
      ctx.fillText(`${s.value}${s.suffix}`, sx, 190);
      ctx.fillStyle = acc;
      ctx.font = `600 18px ${mono}`;
      ctx.fillText(s.label, sx, 226);
      sx += 190;
    });
    ctx.fillStyle = "rgba(42,36,51,0.25)";
    ctx.fillRect(700, 270, 500, 2);
    let fy = 340;
    PROFILE.facts.forEach(([k, v]) => {
      ctx.fillStyle = acc;
      ctx.font = `600 19px ${mono}`;
      ctx.fillText(k, 700, fy);
      ctx.fillStyle = ink;
      ctx.font = `400 30px ${serif}`;
      ctx.fillText(v, 700, fy + 40);
      ctx.fillStyle = "rgba(42,36,51,0.15)";
      ctx.fillRect(700, fy + 62, 500, 1.5);
      fy += 104;
    });
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a7f68";
    ctx.font = `italic 22px ${serif}`;
    ctx.fillText("— 2 —", (W * 3) / 4, H - 50);
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

export function Book() {
  const accent = useAccent();
  const [book] = useState(makeBook);
  useFrame(() => book.draw(accent.state.hue));
  return (
    <group position={[-2.7, 0, 0.95]} rotation={[0, Math.PI / 4, 0]}>
      {/* little round table */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.6, 24]} />
        <meshStandardMaterial color="#2a2220" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.605, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.03, 40]} />
        <meshStandardMaterial color="#3a2d28" roughness={0.45} />
      </mesh>
      {/* the book, tilted back on a rest */}
      <B p={[0, 0.66, 0.11]} s={[0.5, 0.05, 0.1]} c="#2a1f1a" r={0.01} />
      <group position={[0, 0.9, 0]} rotation={[-0.6, 0, 0]}>
        <B p={[0, 0, -0.012]} s={[0.67, 0.47, 0.03]} c="#6b2d2d" r={0.012} rough={0.6} />
        <B p={[0, 0, 0.004]} s={[0.645, 0.445, 0.014]} c="#e9e0c8" r={0.004} rough={0.8} />
        <mesh position={[0, 0, 0.0125]}>
          <planeGeometry args={[0.62, 0.42]} />
          <meshBasicMaterial map={book.tex} toneMapped={false} color="#d8d4ca" />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────────────────── the phone: an upright iPhone with a real contact screen ───────────────────────── */
const PW = 540;
const PH = 1146;
type Rect = { x: number; y: number; w: number; h: number };

function makePhone() {
  const cv = document.createElement("canvas");
  cv.width = PW;
  cv.height = PH;
  const ctx = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  let last = 0;
  let toast = 0;
  const sf = '-apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif';
  const hot: { r: Rect; run: () => void }[] = [];
  let hover = -1;

  const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const locate = (u: number, v: number) => {
    const x = u * PW;
    const y = (1 - v) * PH;
    return hot.findIndex((h) => inRect(h.r, x, y));
  };
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const flash = () => (toast = performance.now() + 1500);
  const host = (u: string) => (u === "#" ? "not set yet" : u.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  const copy = () => {
    navigator.clipboard?.writeText(PROFILE.email).catch(() => undefined);
    flash();
  };
  const open = (u: string) => {
    if (u !== "#") window.open(u, "_blank", "noopener,noreferrer");
  };

  const draw = (t: number, hue: number) => {
    if (t - last < 1 / 20) return;
    last = t;
    const blue = `hsl(${hue} 100% 62%)`;
    ctx.clearRect(0, 0, PW, PH);
    ctx.save();
    rr(0, 0, PW, PH, 70);
    ctx.clip();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, PW, PH);

    // status bar: time, dynamic island, signal / wifi / battery
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = `600 26px ${sf}`;
    ctx.fillText(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), 56, 56);
    ctx.fillStyle = "#050506";
    rr(PW / 2 - 88, 22, 176, 50, 25);
    ctx.fill();
    ctx.strokeStyle = "#17171b";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#0c1018";
    ctx.beginPath();
    ctx.arc(PW / 2 + 52, 47, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) {
      rr(366 + i * 9, 56 - (i + 1) * 5, 6, (i + 1) * 5 + 2, 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(425, 58, i * 6.5, -Math.PI * 0.78, -Math.PI * 0.22);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2.5;
    rr(452, 38, 40, 20, 6);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    rr(455, 41, 28, 14, 4);
    ctx.fill();

    // nav bar
    ctx.fillStyle = blue;
    ctx.font = `400 27px ${sf}`;
    ctx.fillText("‹ Contacts", 28, 128);
    ctx.textAlign = "right";
    ctx.fillText("Edit", PW - 28, 128);
    ctx.textAlign = "center";

    // avatar + name
    const grad = ctx.createLinearGradient(190, 160, 350, 320);
    grad.addColorStop(0, "#a8a9b0");
    grad.addColorStop(1, "#5f6068");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(PW / 2, 246, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `500 60px ${sf}`;
    ctx.fillText(
      PROFILE.name
        .split(" ")
        .map((w) => w[0])
        .join(""),
      PW / 2,
      267,
    );
    ctx.font = `600 40px ${sf}`;
    ctx.fillText(PROFILE.name, PW / 2, 378);
    ctx.fillStyle = "#8e8e93";
    ctx.font = `400 22px ${sf}`;
    ctx.fillText(PROFILE.title, PW / 2, 412);

    hot.length = 0;
    // three action tiles: mail, copy, web
    const tiles: { label: string; run: () => void; icon: (cx: number, cy: number) => void }[] = [
      {
        label: "mail",
        run: () => {
          window.location.href = `mailto:${PROFILE.email}`;
        },
        icon: (cx, cy) => {
          rr(cx - 24, cy - 17, 48, 34, 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 22, cy - 13);
          ctx.lineTo(cx, cy + 3);
          ctx.lineTo(cx + 22, cy - 13);
          ctx.stroke();
        },
      },
      {
        label: "copy",
        run: copy,
        icon: (cx, cy) => {
          rr(cx - 20, cy - 22, 30, 36, 6);
          ctx.stroke();
          rr(cx - 8, cy - 10, 30, 36, 6);
          ctx.stroke();
        },
      },
      {
        label: "web",
        run: () => open(PROFILE.links[0]?.href ?? "#"),
        icon: (cx, cy) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, cy, 10, 22, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 22, cy);
          ctx.lineTo(cx + 22, cy);
          ctx.stroke();
        },
      },
    ];
    tiles.forEach((tile, i) => {
      const r = { x: 27 + i * 166, y: 450, w: 154, h: 112 };
      hot.push({ r, run: tile.run });
      ctx.fillStyle = hover === i ? "#2c2c2e" : "#1c1c1e";
      rr(r.x, r.y, r.w, r.h, 22);
      ctx.fill();
      ctx.strokeStyle = blue;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = "round";
      tile.icon(r.x + r.w / 2, r.y + 44);
      ctx.fillStyle = blue;
      ctx.font = `500 19px ${sf}`;
      ctx.fillText(tile.label, r.x + r.w / 2, r.y + 94);
    });

    // grouped list
    const rows: { label: string; value: string; run: () => void }[] = [
      { label: "email", value: PROFILE.email, run: copy },
      ...PROFILE.links.map((l) => ({
        label: l.label.toLowerCase(),
        value: host(l.href),
        run: () => open(l.href),
      })),
    ];
    const listY = 596;
    const rowH = 88;
    ctx.fillStyle = "#1c1c1e";
    rr(27, listY, PW - 54, rows.length * rowH, 22);
    ctx.fill();
    rows.forEach((row, i) => {
      const r = { x: 27, y: listY + i * rowH, w: PW - 54, h: rowH };
      hot.push({ r, run: row.run });
      const idx = hot.length - 1;
      if (hover === idx) {
        ctx.save();
        rr(27, listY, PW - 54, rows.length * rowH, 22);
        ctx.clip();
        ctx.fillStyle = "#2c2c2e";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#8e8e93";
      ctx.font = `400 17px ${sf}`;
      ctx.fillText(row.label, 54, r.y + 34);
      ctx.fillStyle = "#fff";
      ctx.font = `400 25px ${sf}`;
      ctx.fillText(row.value, 54, r.y + 66);
      ctx.textAlign = "right";
      ctx.fillStyle = "#636366";
      ctx.font = `400 36px ${sf}`;
      ctx.fillText("›", PW - 52, r.y + 56);
      if (i < rows.length - 1) {
        ctx.fillStyle = "#38383a";
        ctx.fillRect(54, r.y + rowH - 1, PW - 108, 1);
      }
    });

    // Send Message cell
    const sy = listY + rows.length * rowH + 24;
    const send = { x: 27, y: sy, w: PW - 54, h: 80 };
    hot.push({
      r: send,
      run: () => {
        window.location.href = `mailto:${PROFILE.email}`;
      },
    });
    ctx.fillStyle = hover === hot.length - 1 ? "#2c2c2e" : "#1c1c1e";
    rr(send.x, send.y, send.w, send.h, 22);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = blue;
    ctx.font = `500 27px ${sf}`;
    ctx.fillText("Send Message", PW / 2, send.y + 51);

    // toast
    if (performance.now() < toast) {
      ctx.fillStyle = "rgba(60,60,64,0.96)";
      rr(PW / 2 - 96, 1030, 192, 62, 31);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `500 25px ${sf}`;
      ctx.fillText("✓  Copied", PW / 2, 1070);
    }
    // home indicator
    ctx.fillStyle = "#fff";
    rr(PW / 2 - 78, PH - 26, 156, 8, 4);
    ctx.fill();
    ctx.restore();
    tex.needsUpdate = true;
  };

  return {
    tex,
    draw,
    move(u: number, v: number) {
      hover = locate(u, v);
      return hover >= 0;
    },
    leave() {
      hover = -1;
    },
    click(u: number, v: number) {
      const i = locate(u, v);
      if (i < 0) return false;
      hot[i].run();
      return true;
    },
  };
}

export function Phone({ active }: { active: boolean }) {
  const accent = useAccent();
  const [phone] = useState(makePhone);
  const downAt = useRef<[number, number] | null>(null);
  useFrame(({ clock }) => phone.draw(clock.elapsedTime, accent.state.hue));
  return (
    <group position={[2.6, 0.8, -2.92]} rotation={[0, 0.5, 0]}>
      <B p={[0, 0.012, -0.075]} s={[0.12, 0.024, 0.1]} c="#14161f" r={0.008} />
      <group position={[0, 0.185, 0]} rotation={[-0.25, 0, 0]}>
        {/* titanium frame + side buttons */}
        <B p={[0, 0, 0]} s={[0.172, 0.346, 0.0135]} c="#8e8f98" r={0.028} rough={0.32} metal={0.85} />
        <B p={[0.0875, 0.06, 0]} s={[0.003, 0.05, 0.008]} c="#a2a3ad" r={0.001} metal={0.8} />
        {[0.09, 0.03, -0.02].map((y) => (
          <B key={y} p={[-0.0875, y + 0.04, 0]} s={[0.003, y === 0.09 ? 0.016 : 0.032, 0.008]} c="#a2a3ad" r={0.001} metal={0.8} />
        ))}
        <mesh
          position={[0, 0, 0.0076]}
          onPointerMove={(e) => {
            if (!active || !e.uv) return;
            e.stopPropagation();
            document.body.style.cursor = phone.move(e.uv.x, e.uv.y) ? "pointer" : "";
          }}
          onPointerOut={() => {
            phone.leave();
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
            if (phone.click(e.uv.x, e.uv.y)) sound.click();
          }}
        >
          <planeGeometry args={[0.158, 0.335]} />
          <meshBasicMaterial map={phone.tex} toneMapped={false} transparent />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────────────────── the pets' corner: beds and bowls under the window ───────────────────────── */
export function PetCorner() {
  return (
    <group>
      {/* mat + bowls */}
      <B p={[-2.35, 0.007, -0.46]} s={[0.46, 0.012, 0.62]} c="#2b3a4c" r={0.01} rough={1} />
      <group position={[-2.35, 0.013, -0.3]}>
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.06, 0.05, 28]} />
          <meshStandardMaterial color="#e9ecf5" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.047, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.01, 24]} />
          <meshStandardMaterial color="#8a5a3a" roughness={0.9} />
        </mesh>
      </group>
      <group position={[-2.35, 0.013, -0.62]}>
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.06, 0.05, 28]} />
          <meshStandardMaterial color="#e9ecf5" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.008, 24]} />
          <meshStandardMaterial color="#6cb6ee" roughness={0.1} metalness={0.2} />
        </mesh>
      </group>

      {/* dog bed */}
      <B p={[-2.95, 0.06, -0.05]} s={[0.5, 0.12, 0.64]} c="#7d6a58" r={0.05} rough={0.95} />
      <B p={[-2.95, 0.12, -0.05]} s={[0.4, 0.05, 0.54]} c="#d3c4b2" r={0.025} rough={1} />

      {/* cat bed */}
      <mesh position={[-2.95, 0.05, -0.85]} castShadow receiveShadow>
        <cylinderGeometry args={[0.23, 0.23, 0.1, 32]} />
        <meshStandardMaterial color="#b07a8a" roughness={0.95} />
      </mesh>
      <mesh position={[-2.95, 0.1, -0.85]}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 32]} />
        <meshStandardMaterial color="#ecd0d8" roughness={1} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── pets: a cat that does its own thing, a dog that follows the person ───────────────────────── */
type Kind = "cat" | "dog";

const SPEC = {
  cat: { speed: 0.75, body: "#e0904f", belly: "#f4e3cf", ear: "#e0904f", patch: "#e0904f" },
  // white with light-brown patches
  dog: { speed: 1.05, body: "#f6f2ea", belly: "#ffffff", ear: "#c9a074", patch: "#c9a074" },
} as const;

const BOWL_STAND: P2 = [-2.05, -0.45];
const BOWL_LOOK: P2 = [-2.35, -0.45];

export function Pet({ kind, start }: { kind: Kind; start: P2 }) {
  const spec = SPEC[kind];
  const bed = kind === "dog" ? BED_DOG : BED_CAT;
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const nav = useRef({
    x: start[0],
    z: start[1],
    yaw: 0,
    path: [] as P2[],
    task: "none" as "none" | "bed" | "bowl",
    idleUntil: 1.5,
    sleepUntil: 0,
    sleepFrom: 0,
    eatUntil: 0,
    nextEat: 25,
    repath: 0,
    napOkAt: 0,
    phase: 0,
    jump: 0,
    sleep: 0,
    eat: 0,
    lift: 0,
  });
  const [emote, setEmote] = useState("");
  const [showEmote, setShowEmote] = useState(false);
  const [status, setStatus] = useState("");
  const statusRef = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  useFrame(({ clock }, dt) => {
    const n = nav.current;
    const t = clock.elapsedTime;
    n.jump = Math.max(0, n.jump - dt * 2.4);

    // the dog wakes up as soon as the person gets moving again
    if (kind === "dog" && t < n.sleepUntil && crowd.walker.still < 0.4 && t > n.sleepFrom + 3) n.sleepUntil = 0;

    const sleeping = t < n.sleepUntil;
    const eating = t < n.eatUntil;
    const st = sleeping ? "z z Z" : eating ? "nom nom" : "";
    if (st !== statusRef.current) {
      statusRef.current = st;
      setStatus(st);
    }

    if (!sleeping && !eating && n.path.length === 0) {
      if (kind === "dog") {
        const still = crowd.walker.still;
        if (n.task === "none" && still > 7 && t > n.napOkAt) {
          n.path = findPath([n.x, n.z], bed);
          n.task = "bed";
        } else if (n.task === "none" && t > n.nextEat) {
          n.path = findPath([n.x, n.z], BOWL_STAND);
          n.task = "bowl";
        }
      } else if (t > n.idleUntil) {
        const r = Math.random();
        if (r < 0.35) {
          n.path = findPath([n.x, n.z], bed);
          n.task = "bed";
        } else if (r < 0.5 && t > n.nextEat) {
          n.path = findPath([n.x, n.z], BOWL_STAND);
          n.task = "bowl";
        } else {
          const choices = HUBS.filter((h) => Math.hypot(h[0] - n.x, h[1] - n.z) > 1.0);
          const pick = choices[Math.floor(Math.random() * choices.length)];
          if (pick) n.path = findPath([n.x, n.z], pick);
        }
      }
    }
    if (kind === "dog" && !sleeping && !eating && n.task === "none") {
      // follow the person, stopping a little short
      const wx = crowd.walker.x;
      const wz = crowd.walker.z;
      const d = Math.hypot(wx - n.x, wz - n.z);
      if (t > n.repath && d > 1.5) {
        const k = 0.95 / (d || 1);
        n.path = findPath([n.x, n.z], [wx + (n.x - wx) * k, wz + (n.z - wz) * k]);
        n.repath = t + 0.9;
      }
    }

    let moving = false;
    let targetYaw = n.yaw;
    if (!sleeping && !eating && n.path.length > 0) {
      const [tx, tz] = n.path[0];
      const dx = tx - n.x;
      const dz = tz - n.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.07) {
        n.path.shift();
        if (n.path.length === 0) {
          if (n.task === "bed") {
            n.sleepFrom = t;
            n.sleepUntil = t + (kind === "dog" ? 16 : 11) + Math.random() * 6;
            n.napOkAt = n.sleepUntil + 20;
            n.task = "none";
          } else if (n.task === "bowl") {
            n.eatUntil = t + 4.5;
            n.nextEat = t + 40 + Math.random() * 30;
            n.task = "none";
          } else n.idleUntil = t + 2 + Math.random() * 3;
        }
      } else {
        const sp = spec.speed * (kind === "dog" && d > 2.5 ? 1.6 : 1) * dt;
        n.x += (dx / d) * Math.min(sp, d);
        n.z += (dz / d) * Math.min(sp, d);
        targetYaw = Math.atan2(dx, dz);
        moving = true;
      }
    } else if (eating) {
      targetYaw = Math.atan2(BOWL_LOOK[0] - n.x, BOWL_LOOK[1] - n.z);
    } else if (sleeping) {
      targetYaw = Math.PI / 2; // curled up facing into the room
    } else if (kind === "dog") {
      targetYaw = Math.atan2(crowd.walker.x - n.x, crowd.walker.z - n.z);
    }
    let diff = targetYaw - n.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    n.yaw += diff * Math.min(1, dt * 8);
    if (moving) n.phase += dt * (kind === "dog" ? 12 : 10);
    n.sleep += ((sleeping ? 1 : 0) - n.sleep) * Math.min(1, dt * 4);
    n.eat += ((eating ? 1 : 0) - n.eat) * Math.min(1, dt * 6);
    // settle onto the cushion while asleep
    n.lift += ((sleeping ? (kind === "dog" ? 0.12 : 0.1) : 0) - n.lift) * Math.min(1, dt * 5);

    const swing = moving ? Math.sin(n.phase) : 0;
    legs.current.forEach((l, i) => {
      if (!l) return;
      const sgn = i === 0 || i === 3 ? 1 : -1;
      const target = moving ? swing * 0.7 * sgn : 0;
      l.rotation.x += (target - l.rotation.x) * Math.min(1, dt * 14);
      l.scale.y += (1 - n.sleep * 0.7 - l.scale.y) * Math.min(1, dt * 6);
    });
    if (body.current) {
      body.current.position.y = -n.sleep * 0.07 + (moving ? Math.abs(Math.sin(n.phase)) * 0.012 : Math.sin(t * 2) * 0.002);
      body.current.rotation.x = n.eat * 0.12;
    }
    if (head.current) {
      const dip = n.sleep * 0.5 + n.eat * 0.95 + (moving || eating ? 0 : Math.sin(t * 0.8) * 0.08);
      head.current.rotation.x += (dip - head.current.rotation.x) * Math.min(1, dt * 5);
    }
    if (tail.current) {
      const wag = kind === "dog" ? Math.sin(t * (moving ? 14 : 9)) * 0.5 : Math.sin(t * 2.2) * 0.35;
      tail.current.rotation.y = wag * (1 - n.sleep * 0.7);
    }
    if (root.current) {
      root.current.position.set(n.x, n.lift + Math.sin(n.jump * Math.PI) * 0.25, n.z);
      root.current.rotation.y = n.yaw;
    }
  });

  const dog = kind === "dog";
  const bodyLen = dog ? 0.3 : 0.2;
  const bodyR = dog ? 0.085 : 0.065;
  const legH = dog ? 0.16 : 0.11;
  const legR = dog ? 0.03 : 0.024;
  const baseY = legH + bodyR - 0.01;

  const legPos: [number, number][] = [
    [-0.05, bodyLen / 2 + 0.01],
    [0.05, bodyLen / 2 + 0.01],
    [-0.05, -bodyLen / 2 - 0.01],
    [0.05, -bodyLen / 2 - 0.01],
  ];

  return (
    <group ref={root} position={[start[0], 0, start[1]]}>
      <group ref={body}>
        {/* torso */}
        <mesh position={[0, baseY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[bodyR, bodyLen, 8, 16]} />
          <meshStandardMaterial color={spec.body} roughness={0.85} />
        </mesh>
        <mesh position={[0, baseY - bodyR * 0.45, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[bodyR * 0.7, bodyLen * 0.8, 6, 12]} />
          <meshStandardMaterial color={spec.belly} roughness={0.9} />
        </mesh>
        {dog && (
          <>
            {/* light-brown saddle and a rump patch */}
            <mesh position={[0, baseY + bodyR * 0.5, 0.02]} scale={[bodyR * 0.95, bodyR * 0.62, bodyLen * 0.42]}>
              <sphereGeometry args={[1, 18, 12]} />
              <meshStandardMaterial color={spec.patch} roughness={0.9} />
            </mesh>
            <mesh position={[0.05, baseY + bodyR * 0.2, -bodyLen * 0.38]} scale={[bodyR * 0.5, bodyR * 0.55, bodyR * 0.55]}>
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color={spec.patch} roughness={0.9} />
            </mesh>
          </>
        )}
        {/* legs */}
        {legPos.map(([x, z], i) => (
          <group key={i} ref={(el) => void (legs.current[i] = el)} position={[x, legH, z]}>
            <mesh position={[0, -legH / 2, 0]} castShadow>
              <capsuleGeometry args={[legR, legH - legR * 2, 4, 8]} />
              <meshStandardMaterial color={spec.body} roughness={0.85} />
            </mesh>
          </group>
        ))}
        {/* head */}
        <group ref={head} position={[0, baseY + bodyR * 0.9, bodyLen / 2 + (dog ? 0.1 : 0.08)]}>
          <mesh castShadow>
            <sphereGeometry args={[dog ? 0.085 : 0.07, 20, 16]} />
            <meshStandardMaterial color={spec.body} roughness={0.85} />
          </mesh>
          {dog ? (
            <>
              <mesh position={[0, -0.02, 0.085]} castShadow>
                <boxGeometry args={[0.07, 0.055, 0.09]} />
                <meshStandardMaterial color={spec.belly} roughness={0.85} />
              </mesh>
              <mesh position={[0, 0.005, 0.135]}>
                <sphereGeometry args={[0.019, 10, 8]} />
                <meshStandardMaterial color="#14101a" roughness={0.3} />
              </mesh>
              {/* a patch over one eye */}
              <mesh position={[0.04, 0.03, 0.03]} scale={[0.045, 0.05, 0.055]}>
                <sphereGeometry args={[1, 14, 10]} />
                <meshStandardMaterial color={spec.patch} roughness={0.9} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.075, 0.0, -0.01]} rotation={[0, 0, s * 0.5]} castShadow>
                  <boxGeometry args={[0.035, 0.1, 0.06]} />
                  <meshStandardMaterial color={spec.ear} roughness={0.85} />
                </mesh>
              ))}
            </>
          ) : (
            <>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.042, 0.07, 0]} rotation={[0, 0, -s * 0.2]} castShadow>
                  <coneGeometry args={[0.028, 0.06, 4]} />
                  <meshStandardMaterial color={spec.ear} roughness={0.85} />
                </mesh>
              ))}
              <mesh position={[0, -0.012, 0.064]}>
                <sphereGeometry args={[0.012, 8, 6]} />
                <meshStandardMaterial color="#e89aa6" roughness={0.5} />
              </mesh>
            </>
          )}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.032, 0.012, dog ? 0.07 : 0.06]}>
              <sphereGeometry args={[0.011, 8, 6]} />
              <meshStandardMaterial color="#15121c" roughness={0.3} />
            </mesh>
          ))}
        </group>
        {/* tail */}
        <group ref={tail} position={[0, baseY + (dog ? 0.03 : 0.02), -bodyLen / 2 - 0.05]}>
          <mesh position={[0, dog ? 0.04 : 0.07, -0.02]} rotation={[-0.5, 0, 0]} castShadow>
            <capsuleGeometry args={[dog ? 0.02 : 0.013, dog ? 0.1 : 0.2, 4, 8]} />
            <meshStandardMaterial color={spec.body} roughness={0.85} />
          </mesh>
        </group>
      </group>

      <Html position={[0, dog ? 0.62 : 0.5, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[11px] text-white transition-opacity duration-300"
          style={{
            opacity: showEmote || status ? 1 : 0,
            background: "rgba(8,10,18,0.86)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)",
          }}
        >
          {showEmote ? emote : status}
        </div>
      </Html>
      <Hit
        p={[0, 0.2, 0]}
        s={dog ? [0.5, 0.5, 0.7] : [0.4, 0.4, 0.5]}
        onClick={() => {
          nav.current.jump = 1;
          nav.current.sleepUntil = 0;
          nav.current.eatUntil = 0;
          sound.pet(kind);
          setEmote(kind === "cat" ? "Meow!" : "Woof!");
          setShowEmote(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setShowEmote(false), 1400);
        }}
      />
    </group>
  );
}

/* ───────────────────────── a T-square hanging on the wall: click it to make it swing ───────────────────────── */
function rulerTexture() {
  return canvasTexture(96, 1024, (c, w, h) => {
    c.fillStyle = "#f3e6c4";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#17110c";
    c.font = "bold 26px ui-monospace, Consolas, monospace";
    for (let i = 0; i <= 48; i++) {
      const y = 14 + i * 20.6;
      const len = i % 10 === 0 ? 60 : i % 5 === 0 ? 44 : 26;
      c.fillRect(0, y, len, i % 10 === 0 ? 4 : 3);
      if (i % 10 === 0 && i > 0) {
        c.save();
        c.translate(70, y + 10);
        c.rotate(Math.PI / 2);
        c.fillText(String(i / 10), 0, 0);
        c.restore();
      }
    }
  });
}

export function TSquare() {
  const g = useRef<THREE.Group>(null);
  const ang = useRef(0.03);
  const vel = useRef(0);
  const [ruler] = useState(rulerTexture);
  useFrame((_, dt) => {
    // a damped pendulum around the nail (dt is clamped so a slow frame can never make it blow up)
    const d = Math.min(dt, 0.03);
    vel.current += (-ang.current * 22 - vel.current * 1.1) * d;
    ang.current += vel.current * d;
    if (g.current) g.current.rotation.z = ang.current;
  });
  return (
    <group position={[-1.35, 2.88, -3.455]}>
      {/* the nail */}
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.007, 0.007, 0.03, 10]} />
        <meshStandardMaterial color="#b8bcc6" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.016, 12, 10]} />
        <meshStandardMaterial color="#d0d4de" metalness={0.8} roughness={0.25} />
      </mesh>
      <group ref={g}>
        {/* the head: a wide, dark crossbar so it reads as a T */}
        <B p={[0, -0.075, 0.03]} s={[0.6, 0.11, 0.034]} c="#4a2f22" r={0.006} rough={0.5} />
        <B p={[0, -0.133, 0.03]} s={[0.6, 0.008, 0.036]} c="#c4c8d2" r={0.002} metal={0.85} rough={0.3} />
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} position={[x, -0.075, 0.049]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.006, 12]} />
            <meshStandardMaterial color="#c4c8d2" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, -0.04, 0.0485]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.012, 0.0035, 8, 16]} />
          <meshStandardMaterial color="#c4c8d2" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* the blade, hanging straight down with a bold ruler scale */}
        <B p={[0, -0.6, 0.012]} s={[0.085, 0.92, 0.01]} c="#f3e6c4" r={0.003} rough={0.5} />
        <mesh position={[0, -0.6, 0.0175]}>
          <planeGeometry args={[0.078, 0.9]} />
          <meshStandardMaterial map={ruler} roughness={0.5} />
        </mesh>
        <B p={[-0.0445, -0.6, 0.012]} s={[0.005, 0.92, 0.012]} c="#c4c8d2" r={0.001} metal={0.85} rough={0.3} />
        <Hit p={[0, -0.55, 0.04]} s={[0.64, 1.1, 0.1]} onClick={() => (vel.current += 1.6)} />
      </group>
    </group>
  );
}

export type { V3 };
