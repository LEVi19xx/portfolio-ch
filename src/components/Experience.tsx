"use client";

import { useCallback, useRef, useState } from "react";
import Hero from "./Hero";
import Hud from "./Hud";
import { STATIONS } from "./stations";
import TunnelBackground from "./TunnelBackground";
import { BioPanel, CodexPanel, UplinkPanel, VaultPanel } from "./Panels";

function Station({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-6 pb-20 pt-24 transition-[opacity,transform,visibility] duration-700 ease-out ${
        visible
          ? "visible scale-100 opacity-100"
          : "invisible scale-90 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export default function Experience() {
  const [active, setActive] = useState(0);
  const flyTo = useRef<(i: number) => void>(() => {});
  const registerFlyTo = useCallback((fn: (i: number) => void) => {
    flyTo.current = fn;
  }, []);
  const navigate = useCallback((i: number) => flyTo.current(i), []);

  // while flying (-1) keep the last panel's slot empty so the tunnel is unobstructed
  return (
    <>
      <TunnelBackground
        stations={STATIONS}
        onActive={setActive}
        registerFlyTo={registerFlyTo}
      />
      <Station visible={active === 0}>
        <Hero visible={active === 0} onNavigate={navigate} />
      </Station>
      <Station visible={active === 1}>
        <BioPanel />
      </Station>
      <Station visible={active === 2}>
        <VaultPanel />
      </Station>
      <Station visible={active === 3}>
        <CodexPanel />
      </Station>
      <Station visible={active === 4}>
        <UplinkPanel />
      </Station>
      <Hud active={active} onNavigate={navigate} />
    </>
  );
}
