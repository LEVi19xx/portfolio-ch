"use client";

import { useEffect, useRef, useState } from "react";
import { control, crowd, hubsOf, ROOM_IDS, ROOM_ORIGIN, roomAt, SPACING, walkable } from "@/scene/nav";

// world bounds of the house, for the map
const X0 = -24.6;
const X1 = 14.4;
const Z0 = -14.4;
const Z1 = 4.4;
const ROOM_COLORS: Record<string, string> = {
  studio: "#3b4a73",
  lounge: "#5a4673",
  gallery: "#3c5470",
  theater: "#6e3a48",
  music: "#4d3b82",
  flowers: "#7a5a6c",
  atelier: "#6b5546",
};

// A small map of the house: where you are, which way you face, and tap anywhere to walk there.
function MiniMap({ className }: { className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext("2d");
    if (!c) return;
    const W = cv.width;
    const H = cv.height;
    const px = (x: number) => ((x - X0) / (X1 - X0)) * W;
    const pz = (z: number) => ((z - Z0) / (Z1 - Z0)) * H;
    const draw = () => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = "rgba(10,13,22,0.78)";
      c.fillRect(0, 0, W, H);
      // halls
      c.fillStyle = "rgba(255,255,255,0.1)";
      for (const x of [-SPACING / 2, -SPACING * 1.5]) c.fillRect(px(x - 1.4), pz(Z0 + 0.6), px(x + 1.4) - px(x - 1.4), pz(Z1 - 0.6) - pz(Z0 + 0.6));
      c.fillRect(px(X0 + 0.6), pz(-SPACING / 2 - 1.4), px(X1 - 8) - px(X0 + 0.6), pz(-SPACING / 2 + 1.4) - pz(-SPACING / 2 - 1.4));
      c.fillRect(px(SPACING / 2 - 1.4), pz(Z0 + 0.6), px(SPACING / 2 + 1.4) - px(SPACING / 2 - 1.4), pz(-3.6) - pz(Z0 + 0.6));
      // rooms
      for (const id of ROOM_IDS) {
        const [ox, , oz] = ROOM_ORIGIN[id];
        const here = control.room === id;
        c.fillStyle = ROOM_COLORS[id];
        c.globalAlpha = here ? 1 : 0.7;
        c.fillRect(px(ox - 3.6), pz(oz - 3.6), px(ox + 3.6) - px(ox - 3.6), pz(oz + 3.6) - pz(oz - 3.6));
        c.globalAlpha = 1;
        if (here) {
          c.strokeStyle = "#fff";
          c.lineWidth = 2;
          c.strokeRect(px(ox - 3.6), pz(oz - 3.6), px(ox + 3.6) - px(ox - 3.6), pz(oz + 3.6) - pz(oz - 3.6));
        }
        c.fillStyle = "rgba(255,255,255,0.85)";
        c.font = "600 " + Math.round(W / 40) + "px ui-monospace, Consolas, monospace";
        c.textAlign = "center";
        c.fillText(id.toUpperCase(), px(ox), pz(oz - 2.7));
      }
      // you
      const hue = document.documentElement.style.getPropertyValue("--hue") || "190";
      const x = px(crowd.walker.x);
      const y = pz(crowd.walker.z);
      c.save();
      c.translate(x, y);
      c.rotate(Math.PI - control.yaw);
      c.fillStyle = "hsl(" + hue + " 100% 65%)";
      c.strokeStyle = "#07080d";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, -W / 40);
      c.lineTo(W / 70, W / 70);
      c.lineTo(0, W / 160);
      c.lineTo(-W / 70, W / 70);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    };
    draw();
    const id = window.setInterval(draw, 100);
    return () => window.clearInterval(id);
  }, []);

  const go = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = X0 + ((e.clientX - r.left) / r.width) * (X1 - X0);
    const z = Z0 + ((e.clientY - r.top) / r.height) * (Z1 - Z0);
    let to: [number, number] = [x, z];
    if (!walkable(x, z)) {
      // landed on a wall or outside: head for the nearest room instead
      const room = roomAt([x, z]) ?? ROOM_IDS.slice().sort((a, b) => Math.hypot(ROOM_ORIGIN[a][0] - x, ROOM_ORIGIN[a][2] - z) - Math.hypot(ROOM_ORIGIN[b][0] - x, ROOM_ORIGIN[b][2] - z))[0];
      to = hubsOf(room)[0];
    }
    window.dispatchEvent(new CustomEvent("walk-goto", { detail: to }));
  };
  return (
    <canvas
      ref={ref}
      width={440}
      height={210}
      aria-label="Map of the house. Tap a place to walk there."
      className={"pointer-events-auto cursor-pointer rounded-lg " + className}
      style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
      onPointerDown={go}
    />
  );
}

// Shown while you drive the character: what the keys do, what E will do next, and a touch stick.
export default function WalkHud({ onExit }: { onExit: () => void }) {
  const [hint, setHint] = useState("");
  const [fp, setFp] = useState(control.fp);
  const [map, setMap] = useState(control.map);
  const [help, setHelp] = useState(false);
  const knob = useRef<HTMLDivElement>(null);
  const pad = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onHint = (e: Event) => setHint((e as CustomEvent<string>).detail);
    window.addEventListener("walk-hint", onHint);
    return () => window.removeEventListener("walk-hint", onHint);
  }, []);

  const key = (code: string) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code, key: code }));
    window.dispatchEvent(new KeyboardEvent("keyup", { code, key: code }));
  };

  const stick = (e: React.PointerEvent) => {
    const el = pad.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    const l = Math.max(1, Math.hypot(x, y));
    control.joy.x = x / l;
    control.joy.y = y / l;
    if (knob.current) knob.current.style.transform = `translate(${(x / l) * 34}px, ${(y / l) * 34}px)`;
  };
  const release = () => {
    control.joy.x = 0;
    control.joy.y = 0;
    if (knob.current) knob.current.style.transform = "translate(0,0)";
  };

  const chip =
    "pointer-events-auto cursor-pointer rounded-full bg-[#0a0d16]/70 px-3 py-2 tracking-[0.2em] text-white/70 backdrop-blur-md hover:text-white";

  return (
    <div className="pointer-events-none fixed inset-0 z-[9] font-mono text-[10px] uppercase" data-ui>
      {/* crosshair */}
      {fp && !map && <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />}

      {hint && (
        <div className="absolute inset-x-0 bottom-52 flex justify-center md:bottom-40">
          <p className="rounded-full bg-[#07080d]/75 px-5 py-2.5 tracking-[0.3em] text-white backdrop-blur-md">{hint}</p>
        </div>
      )}

      <div
        className={`absolute left-3 top-[14rem] max-w-[17rem] rounded-xl bg-[#0a0d16]/80 p-3 leading-relaxed tracking-[0.18em] text-white/70 backdrop-blur-md md:left-8 md:top-20 md:block md:bg-[#0a0d16]/60 ${help ? "block" : "hidden"}`}
      >
        <p className="text-white/90">EXPLORING</p>
        <p>WASD · MOVE</p>
        <p>DRAG / ← → · LOOK</p>
        <p>WHEEL / + − · ZOOM</p>
        <p>SHIFT · RUN</p>
        <p>E · SIT / USE</p>
        <p>V · VIEW &nbsp; M · MAP</p>
        <p>R · RESET VIEW</p>
        <p>ESC · BACK</p>
        <p className="mt-2 text-white/90 md:hidden">TOUCH: STICK MOVES · DRAG LOOKS · PINCH ZOOMS · TAP THE MAP TO GO ANYWHERE</p>
      </div>

      <div className="absolute right-3 top-[6.5rem] flex gap-1.5 md:right-8 md:top-20 md:gap-2">
        <button
          className={chip}
          onClick={() => {
            key("KeyV");
            setFp(control.fp);
          }}
        >
          {fp ? "1ST PERSON" : "3RD PERSON"}
        </button>
        <button className={chip + " md:hidden"} onClick={() => setHelp((h) => !h)} aria-label="Help">
          ?
        </button>
        <button className={chip} onClick={() => window.dispatchEvent(new Event("walk-reset"))}>
          ↺ RESET
        </button>
        <button
          className={chip}
          onClick={() => {
            key("KeyM");
            setMap(control.map);
          }}
        >
          {map ? "CLOSE MAP" : "MAP"}
        </button>
        <button className={chip} onClick={() => window.dispatchEvent(new CustomEvent("walk-zoom", { detail: -1 }))}>
          +
        </button>
        <button className={chip} onClick={() => window.dispatchEvent(new CustomEvent("walk-zoom", { detail: 1 }))}>
          −
        </button>
        <button className={chip} onClick={onExit}>
          EXIT
        </button>
      </div>

      {/* where am I: a map you can tap to walk anywhere */}
      <MiniMap className="absolute left-3 top-[9.5rem] w-[9.5rem] md:bottom-24 md:left-8 md:top-auto md:w-60" />

      {/* touch controls */}
      <div className="absolute bottom-24 left-5 md:hidden">
        <div
          ref={pad}
          className="pointer-events-auto relative h-28 w-28 touch-none rounded-full bg-white/10 backdrop-blur-md"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            stick(e);
          }}
          onPointerMove={(e) => e.buttons && stick(e)}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <div
            ref={knob}
            className="absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full bg-white/40"
            style={{ transition: "transform 60ms linear" }}
          />
        </div>
      </div>
      <div className="absolute bottom-24 right-5 flex flex-col gap-2 md:hidden">
        <button className={`${chip} h-14 w-14 text-sm`} onClick={() => key("KeyE")}>
          E
        </button>
        <button className={chip} onClick={() => key("Space")}>
          STAND
        </button>
      </div>
    </div>
  );
}
