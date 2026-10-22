"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { booth, useBooth } from "@/lib/booth";
import { useAccent } from "./accent";
import { Hit } from "./Hit";
import { B, Lit } from "./Room";
import { canvasTexture } from "./textures";

// pinned prints, in a little grid on the side of the booth
function Prints() {
  const { prints } = useBooth();
  const maps = useMemo(
    () =>
      prints.map((url) => {
        const t = new THREE.TextureLoader().load(url);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }),
    [prints],
  );
  return (
    <group position={[0.66, 1.15, 0]} rotation={[0, Math.PI / 2, 0]}>
      <B p={[0, 0, -0.01]} s={[1.0, 1.1, 0.03]} c="#b98a58" r={0.01} rough={0.95} />
      {maps.map((m, i) => (
        <group key={i} position={[(i % 2 ? 0.22 : -0.22) + (i === 2 ? 0.02 : 0), i < 2 ? 0.26 : -0.26, 0.012]} rotation={[0, 0, (i - 1.5) * 0.06]}>
          <mesh>
            <planeGeometry args={[0.4, 0.46]} />
            <meshStandardMaterial map={m} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.25, 0.002]}>
            <planeGeometry args={[0.1, 0.03]} />
            <meshBasicMaterial color="#ff8fb1" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
      {maps.length === 0 && (
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.8, 0.9]} />
          <meshBasicMaterial map={emptyBoard} transparent />
        </mesh>
      )}
    </group>
  );
}

let emptyBoard: THREE.Texture;
if (typeof document !== "undefined") {
  emptyBoard = canvasTexture(256, 288, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.textAlign = "center";
    c.font = "700 22px 'Segoe Print', 'Comic Sans MS', cursive";
    c.fillText("pin your", w / 2, h / 2 - 8);
    c.fillText("prints here", w / 2, h / 2 + 24);
  });
}

export default function PhotoBooth({ onOpen }: { onOpen: () => void }) {
  const accent = useAccent();
  const flashLight = useRef<THREE.PointLight>(null);
  const bulb = useRef<THREE.MeshBasicMaterial>(null);
  const sign = useMemo(
    () =>
      canvasTexture(384, 128, (c, w, h) => {
        c.fillStyle = "#17171d";
        c.fillRect(0, 0, w, h);
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = "italic 800 64px system-ui, sans-serif";
        c.shadowColor = "#ff8fb1";
        c.shadowBlur = 18;
        c.fillStyle = "#ffd0e0";
        c.fillText("PHOTO", w / 2, h / 2 + 4);
      }),
    [],
  );
  useFrame(() => {
    const since = (Date.now() - booth.get().flashAt) / 1000;
    const k = since < 0.3 ? 1 - since / 0.3 : 0;
    if (flashLight.current) flashLight.current.intensity = 0.6 + k * 14;
    if (bulb.current) bulb.current.color.setScalar(0.6 + k * 0.4).lerp(accent.color, 1 - k);
  });
  return (
    <group position={[2.6, 0, -1.9]} rotation={[0, -Math.PI / 2, 0]}>
      {/* shell: back, sides, roof */}
      <B p={[0, 1.15, -0.55]} s={[1.3, 2.3, 0.1]} c="#2b2f45" r={0.02} />
      <B p={[-0.6, 1.15, 0]} s={[0.1, 2.3, 1.1]} c="#3a3f5c" r={0.02} />
      <B p={[0.6, 1.15, 0]} s={[0.1, 2.3, 1.1]} c="#3a3f5c" r={0.02} />
      <B p={[0, 2.36, 0]} s={[1.4, 0.12, 1.2]} c="#e0597e" r={0.03} />
      <B p={[0, 0.03, 0]} s={[1.25, 0.06, 1.05]} c="#17171d" r={0.01} />
      {/* sign */}
      <group position={[0, 2.62, 0.05]}>
        <B p={[0, 0, 0]} s={[1.0, 0.3, 0.06]} c="#17171d" r={0.02} />
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[0.94, 0.26]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      </group>
      {/* inside: stool, camera, bulbs */}
      <mesh position={[0, 0.45, -0.1]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 20]} />
        <meshStandardMaterial color="#e0597e" roughness={0.6} />
      </mesh>
      <B p={[0, 0.22, -0.1]} s={[0.05, 0.44, 0.05]} c="#17171d" r={0.01} />
      <B p={[0, 1.5, 0.52]} s={[0.34, 0.2, 0.1]} c="#17171d" r={0.02} />
      <mesh position={[0, 1.5, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 18]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 1.5, 0.57]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshBasicMaterial ref={x < 0 ? bulb : undefined} color="#fff3d6" toneMapped={false} />
        </mesh>
      ))}
      <Lit p={[0, 2.25, 0.2]} s={[1.0, 0.03, 0.05]} c="#ffe2b0" />
      <pointLight ref={flashLight} position={[0, 1.7, 0.3]} color="#ffe6d0" intensity={0.6} distance={3.6} decay={2} />
      {/* curtain: two panels, a gap in the middle */}
      <B p={[0, 2.22, 0.55]} s={[1.3, 0.04, 0.04]} c="#17171d" r={0.01} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * 0.4, 1.1, 0.55]} s={[0.46, 2.1, 0.03]} c="#7a2442" r={0.015} rough={1} />
      ))}
      <Prints />
      <Hit p={[0, 1.2, 0.3]} s={[1.5, 2.4, 1.4]} onClick={onOpen} />
    </group>
  );
}
