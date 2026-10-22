/* eslint-disable react-hooks/immutability -- three.js objects are mutated inside useFrame by design */
"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OVERVIEWS, roomOf, type RoomId } from "../components/stations";
import { AccentProvider, useAccent } from "./accent";
import { Chair, Codex, Hotspots, Lamp, Monitor, Mug, Uplink, Walker, WindowSwitch } from "./Props";
import { Badges, Book, Pet, PetCorner, TSquare } from "./Extras";
import Atelier from "./Atelier";
import FlowerShop from "./FlowerShop";
import Gallery from "./Gallery";
import Lounge from "./Lounge";
import MusicRoom from "./MusicRoom";
import { FpWalls, Hallways, HouseShell } from "./Hall";
import { control, crowd, ROOM_ORIGIN, walkable, W } from "./nav";
import Room, { B, City } from "./Room";
import Theater from "./Theater";
import { plankTexture } from "./textures";

type V3 = [number, number, number];

const WHOLE_ROOM = { pos: [11.2, 7.4, 11.2] as V3, target: [-0.2, 1.0, -0.2] as V3 };

// Where the camera parks for each section, relative to its room: [position, look-at target]
const VIEWS: { pos: V3; target: V3; close?: boolean }[] = [
  WHOLE_ROOM, // 0 home: the whole studio
  { pos: [-1.8, 1.76, 1.85], target: [-2.7, 0.92, 0.95], close: true }, // 1 bio: right up to the open book
  { pos: [0.6, 2.2, 0.45], target: [0.6, 1.95, -3.2], close: true }, // 2 ops: the badge, big
  { pos: [-0.9, 1.8, -1.1], target: [-1.7, 1.43, -3.0], close: true }, // 3 vault: right up to the monitor
  { pos: [4.6, 3.0, 4.8], target: [0.4, 1.2, 0.8] }, // 4 codex: core
  { pos: [2.99, 1.18, -2.19], target: [2.6, 0.97, -2.9], close: true }, // 5 uplink: the phone fills the view
  WHOLE_ROOM, // 6 lounge
  { pos: [0.4, 1.3, 0.4], target: [0.4, 1.2, -3.3], close: true }, // 7 life: the TV fills the view
  WHOLE_ROOM, // 8 gallery
  { pos: [0, 1.9, 0.55], target: [0, 1.9, -3.3], close: true }, // 9 awards: the framed wall
  WHOLE_ROOM, // 10 theater
  { pos: [-0.2, 1.9, 1.7], target: [-0.2, 2.0, -3.4], close: true }, // 11 reel: the screen fills the view
  WHOLE_ROOM, // 12 music
  { pos: [0.4, 2.0, -1.0], target: [0.4, 0.95, -2.9], close: true }, // 13 jam: right over the keys
  WHOLE_ROOM, // 14 florist
  { pos: [4.7, 3.0, 5.0], target: [0.3, 1.2, 0.5] }, // 15 bouquet: the workbench
  WHOLE_ROOM, // 16 atelier
  { pos: [3.4, 2.6, 3.0], target: [-1.3, 1.1, -2.0] }, // 17 canvas: the easel
  { pos: [5.2, 3.0, 2.5], target: [1.8, 0.9, -2.4] }, // 18 letter: the writing desk
  { pos: [4.8, 2.9, 4.8], target: [0.8, 0.9, 0.6] }, // 19 busk: the rug and the crowd
  { pos: [4.9, 3.0, 3.6], target: [2.4, 1.2, -1.9] }, // 20 booth: the photobooth
];

const UP = new THREE.Vector3(0, 1, 0);

function Rig({ section }: { section: number }) {
  const { camera, size, pointer } = useThree();
  const accent = useAccent();
  const pos = useRef(new THREE.Vector3(-9, 11, 6));
  const look = useRef(new THREE.Vector3(-24, 1, -12));
  const tmp = useMemo(
    () => ({
      p: new THREE.Vector3(),
      t: new THREE.Vector3(),
      off: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      right: new THREE.Vector3(),
      tg: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, dt) => {
    // exploring: the camera is hers (first person), over her shoulder, or high over the whole house
    if (control.active && control.seat < 0) {
      const cam = camera as THREE.PerspectiveCamera;
      const x = crowd.walker.x;
      const z = crowd.walker.z;
      const sy = Math.sin(control.yaw);
      const cy = Math.cos(control.yaw);
      const cp = Math.cos(control.pitch);
      const sp = Math.sin(control.pitch);
      if (control.map) {
        tmp.p.set(-5.05 + 3, 42, -5.1 + 23);
        tmp.t.set(-5.05, 0, -5.1);
      } else if (control.fp) {
        // the rooms are built for a taller viewer than her chibi body, so the eyes sit higher than her head
        tmp.p.set(x, 1.5, z);
        tmp.t.set(x + sy * cp * 3, 1.5 + sp * 3, z + cy * cp * 3);
      } else {
// a camera on a sphere around her: drag to orbit, wheel to pull back until it is a bird's-eye follow view
        const e = Math.max(0.08, Math.min(1.4, 0.38 + Math.max(0, control.zoom - 3) * 0.08 - control.pitch * 0.9));
        let d = control.zoom;
        // pull in when a wall would be between her and the camera: every step of the way must be floor
        const clear = (len: number) => {
          for (let t = 0.2; t <= 1.001; t += 0.1) if (!walkable(x - sy * Math.cos(e) * len * t, z - cy * Math.cos(e) * len * t)) return false;
          return true;
        };
        while (d > 0.5 && !clear(d)) d -= 0.2;
        tmp.p.set(x - sy * Math.cos(e) * d, 0.8 + Math.sin(e) * d, z - cy * Math.cos(e) * d);
        tmp.t.set(x, 0.8, z);
      }
      const fov = control.map ? 36 : control.fp ? 72 : 46;
      cam.fov += (fov - cam.fov) * Math.min(1, dt * 5);
      cam.updateProjectionMatrix();
      const kp = 1 - Math.exp(-(control.map ? 3 : 11) * dt);
      const kl = 1 - Math.exp(-(control.map ? 3 : 18) * dt);
      pos.current.lerp(tmp.p, kp);
      look.current.lerp(tmp.t, kl);
      camera.position.copy(pos.current);
      camera.lookAt(look.current);
      return;
    }
    const v = VIEWS[section] ?? VIEWS[0];
    const overview = OVERVIEWS.includes(section);
    const [ox, , oz] = ROOM_ORIGIN[roomOf(section)];
    const aspect = size.width / size.height;
    const wide = aspect > 1.15;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += ((wide ? 28 : 40) - cam.fov) * Math.min(1, dt * 4);
    cam.updateProjectionMatrix();

    tmp.t.set(v.target[0] + ox, v.target[1], v.target[2] + oz);
    tmp.off
      .set(...v.pos)
      .sub(tmp.tg.set(...v.target))
      .multiplyScalar(v.close ? (wide ? 1 : 1.9) : (overview ? 1 : 1.32) * (wide ? 1 : 1.2));
    // drag-to-look: orbit around the subject
    const lookScale = v.close ? 0.2 : 1;
    tmp.off.applyAxisAngle(UP, accent.state.yaw * lookScale);
    tmp.dir.set(tmp.off.z, 0, -tmp.off.x).normalize();
    tmp.off.applyAxisAngle(tmp.dir, accent.state.pitch * lookScale);
    tmp.p.copy(tmp.t).add(tmp.off);

    tmp.dir.subVectors(tmp.t, tmp.p).normalize();
    tmp.right.crossVectors(tmp.dir, camera.up).normalize();
    // sheets live on the right, so slide the view to keep the subject on the left (desktop) or the top (phone)
    const shift = overview || v.close ? 0 : wide ? 1.55 : 0;
    tmp.p.addScaledVector(tmp.right, shift);
    tmp.t.addScaledVector(tmp.right, shift);
    if (!wide && !overview && !v.close) tmp.t.y -= 0.9;
    // gentle parallax from the cursor
    tmp.p.addScaledVector(tmp.right, pointer.x * (v.close ? 0.08 : 0.45));
    tmp.p.y += pointer.y * (v.close ? 0.05 : 0.25);

    const k = 1 - Math.exp(-3 * dt);
    pos.current.lerp(tmp.p, k);
    look.current.lerp(tmp.t, k);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}

const C = {
  hemiSkyN: new THREE.Color("#8c9ad8"),
  hemiSkyD: new THREE.Color("#c4dcff"),
  hemiGroundN: new THREE.Color("#2a2018"),
  hemiGroundD: new THREE.Color("#7a6a58"),
  sunN: new THREE.Color("#ffb070"),
  sunD: new THREE.Color("#fff0d6"),
  keyN: new THREE.Color("#b4ccff"),
  keyD: new THREE.Color("#ffffff"),
  bgN: new THREE.Color("#07080d"),
  bgD: new THREE.Color("#a9c6ee"),
};

// how much of the shared lighting each room wants
const ROOM_LIGHT: Record<RoomId, { hemi: number; sun: number; key: number }> = {
  studio: { hemi: 1, sun: 1, key: 1 },
  lounge: { hemi: 0.85, sun: 0.8, key: 0.9 },
  gallery: { hemi: 1.5, sun: 0.12, key: 1.2 },
  theater: { hemi: 0.7, sun: 0.05, key: 0.8 },
  music: { hemi: 0.9, sun: 0.1, key: 0.9 },
  flowers: { hemi: 1.2, sun: 1.0, key: 1.0 },
  atelier: { hemi: 1.1, sun: 0.1, key: 1.0 },
};

function Lights({ room }: { room: RoomId }) {
  const accent = useAccent();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const factor = useRef({ hemi: 1, sun: 1, key: 1 });
  const where = useRef({ x: ROOM_ORIGIN.studio[0], z: ROOM_ORIGIN.studio[2] });
  const sunTarget = useMemo(() => new THREE.Object3D(), []);
  const keyTarget = useMemo(() => new THREE.Object3D(), []);
  const { scene } = useThree();

  useFrame((_, dt) => {
    const s = accent.state;
    s.mood += ((s.day ? 1 : 0) - s.mood) * Math.min(1, dt * 1.8);
    s.lamp += ((s.lampOn ? 1 : 0) - s.lamp) * Math.min(1, dt * 6);
    const m = s.mood;
    const f = factor.current;
    const here = control.active ? control.room : room;
    const goal = ROOM_LIGHT[here];
    const k = Math.min(1, dt * 4);
    f.hemi += (goal.hemi - f.hemi) * k;
    f.sun += (goal.sun - f.sun) * k;
    f.key += (goal.key - f.key) * k;
    // the shadow-casting lights follow whichever room you are in
    const o = ROOM_ORIGIN[here];
    where.current.x += (o[0] - where.current.x) * Math.min(1, dt * 3);
    where.current.z += (o[2] - where.current.z) * Math.min(1, dt * 3);
    const { x: ox, z: oz } = where.current;
    sunTarget.position.set(ox, 0, oz);
    keyTarget.position.set(ox, 0, oz);
    if (hemi.current) {
      hemi.current.color.copy(C.hemiSkyN).lerp(C.hemiSkyD, m);
      hemi.current.groundColor.copy(C.hemiGroundN).lerp(C.hemiGroundD, m);
      hemi.current.intensity = (1.05 + m * 0.7) * f.hemi;
    }
    if (sun.current) {
      sun.current.color.copy(C.sunN).lerp(C.sunD, m);
      sun.current.intensity = (4.4 - m * 0.8) * f.sun;
      sun.current.position.set(ox - 10 + m * 1.5, 6 + m * 4.5, oz + 1.5 + m * 2.5);
    }
    if (key.current) {
      key.current.color.copy(C.keyN).lerp(C.keyD, m);
      key.current.intensity = (2.0 - m * 0.35) * f.key;
      key.current.position.set(ox + 8, 9, oz + 8);
    }
    (scene.fog as THREE.Fog | null)?.color.copy(C.bgN).lerp(C.bgD, m);
    (scene.background as THREE.Color | null)?.copy(C.bgN).lerp(C.bgD, m);
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#8c9ad8", "#2a2018", 1.05]} />
      <ambientLight intensity={0.35} />
      <primitive object={sunTarget} />
      <primitive object={keyTarget} />
      <directionalLight
        ref={sun}
        target={sunTarget}
        position={[-34, 6, -10.5]}
        intensity={4.4}
        color="#ffb070"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight
        ref={key}
        target={keyTarget}
        position={[-16, 9, -4]}
        intensity={2.0}
        color="#b4ccff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  );
}

function StudioLights() {
  const accent = useAccent();
  const rim = useRef<THREE.PointLight>(null);
  useFrame(() => rim.current?.color.copy(accent.color));
  return (
    <>
      <pointLight position={[-1.7, 1.5, -2.2]} color="#7ad7ff" intensity={2.2} distance={3.6} decay={2} />
      <pointLight ref={rim} position={[0.4, 2.6, 1.2]} intensity={0.8} distance={5} decay={2} />
    </>
  );
}

// One platform under the whole house
function HouseFloor() {
  const planks = useMemo(() => {
    const t = plankTexture(6);
    t.repeat.set(16, 7);
    return t;
  }, []);
  return (
    <group>
      <B p={[-5.05, -0.18, -5.1]} s={[38.6, 0.3, 18.2]} c="#14111a" r={0.05} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.05, -0.001, -5.1]} receiveShadow>
        <planeGeometry args={[38, 17.6]} />
        <meshStandardMaterial map={planks} roughness={0.6} />
      </mesh>
    </group>
  );
}

// One room of the house. In the cutaway view the rooms in front of the camera are left out,
// because their near walls would hide the room you are looking at.
function RoomGroup({ id, room, children }: { id: RoomId; room: RoomId; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const free = control.active && (control.seat < 0 || control.map);
    const cur = ROOM_ORIGIN[control.active ? control.room : room];
    const o = ROOM_ORIGIN[id];
    g.current.visible = free || !(o[0] > cur[0] + 0.1 || o[2] > cur[2] + 0.1);
  });
  return (
    <group ref={g} position={ROOM_ORIGIN[id]}>
      <FpWalls id={id} />
      {children}
    </group>
  );
}

function Glow() {
  const accent = useAccent();
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(cv);
  }, []);
  useFrame(() => {
    mat.current?.color.copy(accent.color);
    if (mat.current) mat.current.opacity = 0.2 * (1 - accent.state.mood * 0.8);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.05, -0.5, -5.1]}>
      <planeGeometry args={[70, 50]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

// Drag = look around (springs back). Hold still = recolor the whole site. Also owns --hue.
function Gestures() {
  const accent = useAccent();
  const vel = useRef(0);
  const lastWrite = useRef(0);
  const down = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const s = accent.state;
    document.documentElement.style.setProperty("--hue", String(Math.round(s.hue)));
    const blocked = (e: PointerEvent) =>
      !!document.documentElement.dataset.lock ||
      !!(e.target as HTMLElement | null)?.closest("a,button,input,textarea,[data-ui],[data-scroll]");
    // every finger or mouse button that started on the scene; deltas are measured here because
    // touch pointers do not report movementX
    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const spread = () => {
      const [a, b] = [...pts.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (e: PointerEvent) => {
      if (blocked(e)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) pinch = spread();
      down.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onMove = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      const d = down.current;
      if (!p || !d) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      // two fingers pull the camera back and forth
      if (pts.size === 2 && control.active && control.seat < 0) {
        const now = spread();
        if (pinch > 0) window.dispatchEvent(new CustomEvent("walk-zoom", { detail: now < pinch ? 1 : -1 }));
        pinch = now;
        s.dragging = true;
        return;
      }
      if (!s.dragging && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
        s.dragging = true;
        s.held = false;
      }
      if (s.dragging && control.active && control.seat < 0) {
        control.yaw -= dx * 0.0055;
        control.pitch = Math.max(-1.1, Math.min(1.1, control.pitch - dy * 0.004));
      } else if (s.dragging) {
        s.yaw = Math.max(-0.75, Math.min(0.75, s.yaw - dx * 0.004));
        s.pitch = Math.max(-0.3, Math.min(0.4, s.pitch + dy * 0.003));
      }
    };
    const onUp = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size === 0) {
        down.current = null;
        s.dragging = false;
        s.held = false;
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [accent]);

  useFrame(({ clock }, dt) => {
    const s = accent.state;
    const d = down.current;
    if (d && !s.dragging && !control.active && performance.now() - d.t > 350) s.held = true;
    if (!s.dragging) {
      s.yaw *= Math.exp(-1.3 * dt);
      s.pitch *= Math.exp(-1.3 * dt);
    }
    vel.current += ((s.held ? 90 : 0) - vel.current) * Math.min(1, dt * 3);
    s.hue = (s.hue + vel.current * dt) % 360;
    accent.color.setHSL(s.hue / 360, 1, 0.62);
    accent.basic.color.copy(accent.color);
    if (clock.elapsedTime - lastWrite.current > 0.1) {
      lastWrite.current = clock.elapsedTime;
      document.documentElement.style.setProperty("--hue", String(Math.round(s.hue)));
    }
  });
  return null;
}

function SyncState({ section, day }: { section: number; day: boolean }) {
  const accent = useAccent();
  useEffect(() => {
    accent.state.close = !!VIEWS[section]?.close;
    accent.state.room = roomOf(section);
  }, [accent, section]);
  useEffect(() => {
    accent.state.day = day;
  }, [accent, day]);
  return null;
}

export default function Scene({
  section,
  day,
  onSelect,
  onOpenCard,
  onToggleDay,
  onToggleMusic,
  onSit,
  onStand,
}: {
  onSit: (i: number) => void;
  onStand: () => void;
  section: number;
  day: boolean;
  onSelect: (i: number) => void;
  onOpenCard: (index: number) => void;
  onToggleDay: () => void;
  onToggleMusic: () => void;
}) {
  const room = roomOf(section);
  // phones and tablets get cheaper shadows and no multisampling, decided once (changing them later would stall the frame)
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [quality, setQuality] = useState(2);
  return (
    <div className="fixed inset-0" style={{ touchAction: "none" }}>
      <Canvas
        shadows={touch ? "basic" : "soft"}
        dpr={quality === 2 ? [1, touch ? 1.5 : 1.75] : quality === 1 ? [1, 1.25] : 0.8}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 28, near: 0.1, far: 160, position: [-9, 11, 6] }}
      >
        <color attach="background" args={["#07080d"]} />
        <fog attach="fog" args={["#07080d", 40, 110]} />
        <AccentProvider>
          <SyncState section={section} day={day} />
          <Gestures />
          <Rig section={section} />
          <Lights room={room} />
          <Glow />
          <HouseFloor />
          <HouseShell />
          <Hallways />
          <group position={ROOM_ORIGIN.studio}>
            <City />
          </group>

          <RoomGroup id="studio" room={room}>
            <StudioLights />
            <Room />
            <Monitor active={section === 3} onFocus={() => onSelect(3)} />
            <Mug />
            <Lamp />
            <Chair off={section === 3} />
            <Badges onOpen={onOpenCard} active={section === 2} />
            <Book />
            <PetCorner />
            <TSquare />
            <Uplink onToggleMusic={onToggleMusic} active={section === 5} />
            <Codex active={section === 4} onSelect={() => onSelect(4)} />
            <WindowSwitch onToggle={onToggleDay} />
            <Hotspots section={section} onSelect={onSelect} />
          </RoomGroup>
          <RoomGroup id="lounge" room={room}>
            <Lounge section={section} onSelect={onSelect} />
          </RoomGroup>
          <RoomGroup id="gallery" room={room}>
            <Gallery section={section} onSelect={onSelect} />
          </RoomGroup>
          <RoomGroup id="theater" room={room}>
            <Theater section={section} onSelect={onSelect} />
          </RoomGroup>
          <RoomGroup id="music" room={room}>
            <MusicRoom section={section} onSelect={onSelect} onToggleMusic={onToggleMusic} />
          </RoomGroup>
          <RoomGroup id="flowers" room={room}>
            <FlowerShop section={section} onSelect={onSelect} />
          </RoomGroup>
          <RoomGroup id="atelier" room={room}>
            <Atelier section={section} onSelect={onSelect} />
          </RoomGroup>

          {/* the people and pets of the house walk between rooms in world space */}
          <Walker onSelect={() => undefined} section={section} onSit={onSit} onStand={onStand} />
          <Pet kind="cat" start={W("studio", [-0.6, 1.8])} />
          <Pet kind="dog" start={W("studio", [2.0, 0.9])} />
        </AccentProvider>
        {/* if the frame rate drops, quietly lower the resolution (cheap to change, no recompiling) */}
        <PerformanceMonitor
          onDecline={() => setQuality((q) => Math.max(0, q - 1))}
          onIncline={() => setQuality((q) => Math.min(2, q + 1))}
          flipflops={2}
        />
        <EffectComposer multisampling={touch ? 0 : 4}>
          <Bloom intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette offset={0.3} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
