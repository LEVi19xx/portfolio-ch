"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { control } from "@/scene/nav";
import { BlueprintDock } from "./Blueprint";
import { OVERVIEWS, ROOMS } from "./stations";

// the size of the window, kept in sync as it resizes or rotates
const subscribeSize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  window.addEventListener("orientationchange", cb);
  return () => {
    window.removeEventListener("resize", cb);
    window.removeEventListener("orientationchange", cb);
  };
};
const sizeNow = () => window.innerWidth + "x" + window.innerHeight;
// "compact" = a phone, a tablet, or any window too small for the desktop layout: the game-pad HUD takes over.
// `scale` shrinks the pad in very short windows so everything still fits.
export function useCompact() {
  const size = useSyncExternalStore(subscribeSize, sizeNow, () => "1200x800");
  const touch = useSyncExternalStore(
    (cb) => {
      const q = window.matchMedia("(pointer: coarse)");
      q.addEventListener("change", cb);
      return () => q.removeEventListener("change", cb);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
  const [w, h] = size.split("x").map(Number);
  return { compact: touch || h < 560 || w < 1280, touch, scale: Math.max(0.6, Math.min(1, h / 430)) };
}

const key = (code: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { code, key: code }));
  window.dispatchEvent(new KeyboardEvent("keyup", { code, key: code }));
};

// the thumb stick: drag from the middle, it moves her. Uses pointer capture so the other thumb can still look around.
function Stick({ className }: { className: string }) {
  const knob = useRef<HTMLDivElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const stick = (e: React.PointerEvent) => {
    const el = pad.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    const l = Math.max(1, Math.hypot(x, y));
    control.joy.x = x / l;
    control.joy.y = y / l;
    if (knob.current) knob.current.style.transform = `translate(${(x / l) * 36}px, ${(y / l) * 36}px)`;
  };
  const release = () => {
    control.joy.x = 0;
    control.joy.y = 0;
    if (knob.current) knob.current.style.transform = "translate(0,0)";
  };
  return (
    <div
      ref={pad}
      className={"pointer-events-auto absolute touch-none rounded-full bg-white/10 backdrop-blur-md " + className}
      style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)" }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        stick(e);
      }}
      onPointerMove={(e) => e.buttons && stick(e)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div ref={knob} className="absolute left-1/2 top-1/2 -ml-7 -mt-7 h-14 w-14 rounded-full bg-white/45" style={{ transition: "transform 60ms linear" }} />
    </div>
  );
}

const round =
  "pointer-events-auto flex cursor-pointer items-center justify-center rounded-full bg-[#0a0d16]/70 text-white/85 backdrop-blur-md active:bg-white/25";
const chip =
  "pointer-events-auto cursor-pointer rounded-full bg-[#0a0d16]/70 px-3 py-2 tracking-[0.2em] text-white/70 backdrop-blur-md hover:text-white";

// Shown while you drive the character: what E will do next, the camera and view buttons, the blueprint and the controls.
// On a phone held sideways it is laid out like a game pad: stick on the left, buttons on the right, a menu on top.
export default function WalkHud({
  onExit,
  day,
  soundOn,
  onToggleDay,
  onToggleSound,
}: {
  onExit: () => void;
  day: boolean;
  soundOn: boolean;
  onToggleDay: () => void;
  onToggleSound: () => void;
}) {
  const { compact, scale } = useCompact();
  const [hint, setHint] = useState("");
  const [fp, setFp] = useState(control.fp);
  const [map, setMap] = useState(control.map);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onHint = (e: Event) => setHint((e as CustomEvent<string>).detail);
    window.addEventListener("walk-hint", onHint);
    return () => window.removeEventListener("walk-hint", onHint);
  }, []);

  const view = () => {
    key("KeyV");
    setFp(control.fp);
  };
  const zoom = (d: number) => window.dispatchEvent(new CustomEvent("walk-zoom", { detail: d }));
  const reset = () => window.dispatchEvent(new Event("walk-reset"));
  const goRoom = (i: number) => {
    window.dispatchEvent(new CustomEvent("walk-to", { detail: OVERVIEWS[i] }));
    setMenu(false);
  };

  const at = (origin: string) => ({ transform: `scale(${scale})`, transformOrigin: origin });
  if (compact) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[9] font-mono text-[10px] uppercase" data-ui>
        {fp && !map && <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />}

        {/* what E does here */}
        {hint && (
          <div className="absolute inset-x-0 bottom-5 flex justify-center">
            <p className="max-w-[40vw] rounded-full bg-[#07080d]/75 px-4 py-2 text-center tracking-[0.2em] text-white backdrop-blur-md">{hint}</p>
          </div>
        )}

        {/* left thumb: move */}
        <div className="absolute bottom-5 left-6" style={at("bottom left")}>
          <Stick className="relative h-32 w-32" />
        </div>

        {/* right thumb: act */}
        <div className="absolute bottom-5 right-6 h-[10.5rem] w-[9.5rem]" style={at("bottom right")}>
        <button className={round + " absolute bottom-0 right-0 h-[4.5rem] w-[4.5rem] text-xl font-bold"} onClick={() => key("KeyE")} aria-label="Use or sit">
          E
        </button>
        <button className={round + " absolute bottom-1 right-[5.4rem] h-12 w-12"} onClick={() => key("Space")} aria-label="Stand up">
          ⤓
        </button>
        <div className="absolute bottom-[5.6rem] right-0 grid grid-cols-2 gap-2">
          <button className={round + " h-11 w-11 text-base"} onClick={view} aria-label="Switch camera view">
            {fp ? "1P" : "3P"}
          </button>
          <button className={round + " h-11 w-11 text-base"} onClick={reset} aria-label="Reset the camera">
            ↺
          </button>
          <button className={round + " h-11 w-11 text-lg"} onClick={() => zoom(-1)} aria-label="Zoom in">
            +
          </button>
          <button className={round + " h-11 w-11 text-lg"} onClick={() => zoom(1)} aria-label="Zoom out">
            −
          </button>
        </div>
        </div>

        {/* the blueprint, top left */}
        <div className="absolute left-3 top-3 w-[10.5rem]" style={at("top left")}>
          <BlueprintDock className="relative w-full" />
        </div>

        {/* menu, top right */}
        <button className={round + " absolute right-3 top-3 h-11 w-11 text-lg"} style={at("top right")} onClick={() => setMenu((m) => !m)} aria-label="Menu">
          ☰
        </button>
        {menu && (
          <div
            className="pointer-events-auto absolute right-3 top-16 max-h-[calc(100vh-5rem)] w-52 overflow-y-auto rounded-xl bg-[#0a0d16]/90 p-2 backdrop-blur-xl"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)", ...at("top right") }}
          >
            <p className="px-2 pb-1 pt-1 tracking-[0.25em] text-white/50">GO TO</p>
            <div className="grid grid-cols-2 gap-1">
              {ROOMS.map((r, i) => (
                <button key={r.id} onClick={() => goRoom(i)} className="cursor-pointer rounded-lg bg-white/5 px-2 py-2 text-left tracking-[0.15em] text-white/85 active:bg-white/20">
                  {r.name}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-1">
              <button onClick={onToggleDay} className="flex-1 cursor-pointer rounded-lg bg-white/5 px-2 py-2 tracking-[0.15em] text-white/85">
                {day ? "NIGHT" : "DAY"}
              </button>
              <button onClick={onToggleSound} className="flex-1 cursor-pointer rounded-lg bg-white/5 px-2 py-2 tracking-[0.15em] text-white/85">
                SND {soundOn ? "ON" : "OFF"}
              </button>
            </div>
            <button onClick={onExit} className="mt-1 w-full cursor-pointer rounded-lg bg-white/10 px-2 py-2 tracking-[0.2em] text-white">
              EXIT EXPLORE
            </button>
            <p className="px-2 pt-2 leading-4 tracking-[0.1em] text-white/45">DRAG THE SCREEN TO LOOK · PINCH TO ZOOM · TAP THE BLUEPRINT TO WALK ANYWHERE</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[9] font-mono text-[10px] uppercase" data-ui>
      {fp && !map && <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />}

      {hint && (
        <div className="absolute inset-x-0 bottom-40 flex justify-center">
          <p className="rounded-full bg-[#07080d]/75 px-5 py-2.5 tracking-[0.3em] text-white backdrop-blur-md">{hint}</p>
        </div>
      )}

      <div className="absolute left-8 top-20 max-w-[17rem] rounded-xl bg-[#0a0d16]/60 p-3 leading-relaxed tracking-[0.18em] text-white/60 backdrop-blur-md">
        <p className="text-white/90">EXPLORING</p>
        <p>WASD · MOVE</p>
        <p>DRAG / ← → · LOOK</p>
        <p>WHEEL / + − · ZOOM</p>
        <p>SHIFT · RUN</p>
        <p>E · SIT / USE</p>
        <p>V · VIEW &nbsp; M · MAP</p>
        <p>R · RESET VIEW</p>
        <p>ESC · BACK</p>
      </div>

      <div className="absolute right-8 top-20 flex gap-2">
        <button className={chip} onClick={view}>
          {fp ? "1ST PERSON" : "3RD PERSON"}
        </button>
        <button className={chip} onClick={reset}>
          ↺ RESET
        </button>
        <button
          className={chip}
          onClick={() => {
            key("KeyM");
            setMap(control.map);
          }}
        >
          {map ? "CLOSE MAP" : "3D MAP"}
        </button>
        <button className={chip} onClick={() => zoom(-1)}>
          +
        </button>
        <button className={chip} onClick={() => zoom(1)}>
          −
        </button>
        <button className={chip} onClick={onExit}>
          EXIT
        </button>
      </div>

      <BlueprintDock className="bottom-24 left-8 w-72" />
    </div>
  );
}
