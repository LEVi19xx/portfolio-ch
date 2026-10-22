/* eslint-disable react-hooks/immutability -- three.js objects are mutated inside useFrame by design */
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AccentProvider, useAccent } from "./accent";
import {
  Chair,
  Codex,
  Walker,
  Hotspots,
  Lamp,
  Monitor,
  Mug,
  Uplink,
  WindowSwitch,
} from "./Props";
import { Badges, Book, Pet, PetCorner, TSquare } from "./Extras";
import Room from "./Room";

type V3 = [number, number, number];

// Where the camera parks for each section: [position, look-at target]
const VIEWS: { pos: V3; target: V3; close?: boolean }[] = [
  { pos: [11.2, 7.4, 11.2], target: [-0.2, 1.0, -0.2] }, // 0 home: whole room
  { pos: [-1.8, 1.76, 1.85], target: [-2.7, 0.92, 0.95], close: true }, // 1 bio: right up to the open book
  { pos: [0.6, 2.2, 0.45], target: [0.6, 1.95, -3.2], close: true }, // 2 ops: the badge, big
  { pos: [-0.9, 1.8, -1.1], target: [-1.7, 1.43, -3.0], close: true }, // 3 vault: right up to the monitor, it fills the view
  { pos: [4.6, 3.0, 4.8], target: [0.4, 1.2, 0.8] }, // 4 codex: core
  { pos: [2.99, 1.18, -2.19], target: [2.6, 0.97, -2.9], close: true }, // 5 uplink: the phone fills the view
];

const UP = new THREE.Vector3(0, 1, 0);

function Rig({ section }: { section: number }) {
  const { camera, size, pointer } = useThree();
  const accent = useAccent();
  const pos = useRef(new THREE.Vector3(17, 11, 17));
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const tmp = useMemo(
    () => ({
      p: new THREE.Vector3(),
      t: new THREE.Vector3(),
      off: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      right: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, dt) => {
    const v = VIEWS[section] ?? VIEWS[0];
    const aspect = size.width / size.height;
    const wide = aspect > 1.15;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += ((wide ? 28 : 40) - cam.fov) * Math.min(1, dt * 4);
    cam.updateProjectionMatrix();

    tmp.t.set(...v.target);
    tmp.off
      .set(...v.pos)
      .sub(tmp.t)
      .multiplyScalar(v.close ? (wide ? 1 : 1.9) : (section === 0 ? 1 : 1.32) * (wide ? 1 : 1.2));
    // drag-to-look: orbit around the subject
    const lookScale = v.close ? 0.2 : 1;
    tmp.off.applyAxisAngle(UP, accent.state.yaw * lookScale);
    tmp.dir.set(tmp.off.z, 0, -tmp.off.x).normalize();
    tmp.off.applyAxisAngle(tmp.dir, accent.state.pitch * lookScale);
    tmp.p.copy(tmp.t).add(tmp.off);

    tmp.dir.subVectors(tmp.t, tmp.p).normalize();
    tmp.right.crossVectors(tmp.dir, camera.up).normalize();
    // sheets live on the right, so slide the view to keep the subject on the left (desktop) or the top (phone)
    const shift = section === 0 || v.close ? 0 : wide ? 1.55 : 0;
    tmp.p.addScaledVector(tmp.right, shift);
    tmp.t.addScaledVector(tmp.right, shift);
    if (!wide && section !== 0 && !v.close) tmp.t.y -= 0.9;
    // gentle parallax from the cursor
    tmp.p.addScaledVector(tmp.right, pointer.x * (v.close ? 0.08 : 0.45));
    tmp.p.y += pointer.y * (v.close ? 0.05 : 0.25);

    const k = 1 - Math.exp(-2.6 * dt);
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

function Lights() {
  const accent = useAccent();
  const rim = useRef<THREE.PointLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();

  useFrame((_, dt) => {
    const s = accent.state;
    s.mood += ((s.day ? 1 : 0) - s.mood) * Math.min(1, dt * 1.8);
    s.lamp += ((s.lampOn ? 1 : 0) - s.lamp) * Math.min(1, dt * 6);
    const m = s.mood;
    rim.current?.color.copy(accent.color);
    if (hemi.current) {
      hemi.current.color.copy(C.hemiSkyN).lerp(C.hemiSkyD, m);
      hemi.current.groundColor.copy(C.hemiGroundN).lerp(C.hemiGroundD, m);
      hemi.current.intensity = 1.05 + m * 0.7;
    }
    if (sun.current) {
      sun.current.color.copy(C.sunN).lerp(C.sunD, m);
      sun.current.intensity = 4.4 - m * 0.8;
      sun.current.position.set(-10 + m * 1.5, 6 + m * 4.5, 1.5 + m * 2.5);
    }
    if (key.current) {
      key.current.color.copy(C.keyN).lerp(C.keyD, m);
      key.current.intensity = 2.0 - m * 0.35;
    }
    (scene.fog as THREE.Fog | null)?.color.copy(C.bgN).lerp(C.bgD, m);
    (scene.background as THREE.Color | null)?.copy(C.bgN).lerp(C.bgD, m);
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#8c9ad8", "#2a2018", 1.05]} />
      <ambientLight intensity={0.35} />
      {/* low sun through the window: its shadow draws the light patch on the floor */}
      <directionalLight
        ref={sun}
        position={[-10, 6, 1.5]}
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
      {/* cool key from the camera side */}
      <directionalLight
        ref={key}
        position={[8, 9, 8]}
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
      <pointLight position={[-1.7, 1.5, -2.2]} color="#7ad7ff" intensity={2.2} distance={3.6} decay={2} />
      <pointLight position={[-1.7, 0.3, -2.2]} color="#ffb25a" intensity={2.2} distance={2.8} decay={2} />
      <pointLight ref={rim} position={[0.4, 2.6, 1.2]} intensity={0.8} distance={5} decay={2} />
    </>
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
    if (mat.current) mat.current.opacity = 0.22 * (1 - accent.state.mood * 0.8);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
      <planeGeometry args={[22, 22]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

// Pointer gestures. Drag = look around (springs back). Hold still = recolor the whole site.
// Also owns the page's --hue so the HTML sheets recolor with the room.
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
    const onDown = (e: PointerEvent) => {
      if (blocked(e)) return;
      down.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onMove = (e: PointerEvent) => {
      const d = down.current;
      if (!d) return;
      if (!s.dragging && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
        s.dragging = true;
        s.held = false;
      }
      if (s.dragging) {
        s.yaw = Math.max(-0.75, Math.min(0.75, s.yaw - e.movementX * 0.004));
        s.pitch = Math.max(-0.3, Math.min(0.4, s.pitch + e.movementY * 0.003));
      }
    };
    const onUp = () => {
      down.current = null;
      s.dragging = false;
      s.held = false;
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
    if (d && !s.dragging && performance.now() - d.t > 350) s.held = true;
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

// tells every Hit whether the camera is in a close-up (so nothing floating in front can steal clicks)
function SyncClose({ section }: { section: number }) {
  const accent = useAccent();
  useEffect(() => {
    accent.state.close = !!VIEWS[section]?.close;
  }, [accent, section]);
  return null;
}

function SyncDay({ day }: { day: boolean }) {
  const accent = useAccent();
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
}: {
  section: number;
  day: boolean;
  onSelect: (i: number) => void;
  onOpenCard: (index: number) => void;
  onToggleDay: () => void;
  onToggleMusic: () => void;
}) {
  return (
    <div className="fixed inset-0">
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 28, near: 0.1, far: 120, position: [17, 11, 17] }}
      >
        <color attach="background" args={["#07080d"]} />
        <fog attach="fog" args={["#07080d", 30, 70]} />
        <AccentProvider>
          <SyncDay day={day} />
          <SyncClose section={section} />
          <Gestures />
          <Rig section={section} />
          <Lights />
          <Glow />
          <Room />
          <Monitor active={section === 3} onFocus={() => onSelect(3)} />
          <Mug />
          <Lamp />
          <Chair off={section === 3} />
          <Badges onOpen={onOpenCard} active={section === 2} />
          <Book />
          <PetCorner />
          <TSquare />
          <Pet kind="cat" start={[-0.6, 1.8]} />
          <Pet kind="dog" start={[2.0, 0.9]} />
          <Uplink onToggleMusic={onToggleMusic} active={section === 5} />
          <Codex active={section === 4} onSelect={() => onSelect(4)} />
          <WindowSwitch onToggle={onToggleDay} />
          <Walker onSelect={() => undefined} section={section} />
          <Hotspots section={section} onSelect={onSelect} />
        </AccentProvider>
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette offset={0.3} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
