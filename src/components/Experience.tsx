"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Boot from "./Boot";
import Chrome from "./Chrome";
import CommandPalette, { type Command } from "./CommandPalette";
import dynamic from "next/dynamic";
import {
  BioSheet,
  CodexSheet,
  HomeSheet,
  OpsSheet,
  UplinkSheet,
  VaultSheet,
} from "./Panels";
import { STATIONS } from "./stations";
import { PROFILE } from "@/content/content";
import { sound } from "@/lib/sound";
import { typeKey } from "@/lib/terminal";
import { ActiveContext } from "@/lib/ui";

const Scene = dynamic(() => import("@/scene/Scene"), { ssr: false });

const LAST = STATIONS.length - 1;

// what to do in each close-up
const HINTS: Record<number, string> = {
  1: "02 — BIO · READ THE BOOK · ESC TO GO BACK",
  2: "03 — OPS · CLICK A BADGE TO READ IT · ESC TO GO BACK",
  3: "04 — VAULT · CLICK A PROJECT ON THE MONITOR · ESC TO GO BACK",
  5: "06 — UPLINK · TAP THE PHONE · ESC TO GO BACK",
};

// Sheets sit on the right on desktop (the field moves left) and at the bottom on phones.
function Stage({
  visible,
  center,
  children,
}: {
  visible: boolean;
  center?: boolean;
  children: React.ReactNode;
}) {
  const pos = center
    ? "left-5 bottom-24 w-[calc(100%-2.5rem)] max-w-lg md:bottom-20 md:left-12"
    : "inset-x-5 bottom-20 max-h-[50vh] md:inset-x-auto md:bottom-auto md:left-[50%] md:right-[6vw] md:top-1/2 md:max-h-[78vh] md:-translate-y-1/2";
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[5] transition-[opacity,transform,visibility] duration-700 ease-out ${
        visible ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className={`absolute ${pos} flex`}>{children}</div>
    </div>
  );
}

export default function Experience() {
  const [section, setSection] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [palette, setPalette] = useState(false);
  const [day, setDay] = useState(false);
  const [musicName, setMusicName] = useState("");

  const go = useCallback((i: number) => {
    setSection((cur) => {
      const next = Math.max(0, Math.min(LAST, i));
      if (next !== cur) sound.arrive();
      return next;
    });
  }, []);
  const step = useCallback(
    (d: number) => {
      setSection((cur) => {
        const next = Math.max(0, Math.min(LAST, cur + d));
        if (next !== cur) sound.arrive();
        return next;
      });
    },
    [],
  );
  const navigate = useCallback(
    (i: number) => {
      sound.click();
      go(i);
    },
    [go],
  );

  const toggleSound = useCallback(async () => {
    if (sound.isEnabled()) {
      sound.disable();
      setSoundOn(false);
    } else {
      await sound.enable();
      setSoundOn(sound.isEnabled());
    }
  }, []);
  const toggleDay = useCallback(() => {
    sound.click();
    setDay((d) => !d);
  }, []);
  // the speaker cycles through the tracks, then switches off
  const toggleMusic = useCallback(async () => {
    await sound.musicNext();
    setMusicName(sound.musicName());
    setSoundOn(sound.isEnabled());
  }, []);
  // clicking a lanyard on the pegboard opens that job (the last one is a nudge to contact)
  const openCard = useCallback(
    (i: number) => {
      if (i === 3) {
        navigate(5);
        return;
      }
      navigate(2);
      window.dispatchEvent(new CustomEvent("ops-select", { detail: i }));
    },
    [navigate],
  );
  const onEnter = useCallback(async (withSound: boolean) => {
    if (withSound) {
      await sound.enable();
      setSoundOn(sound.isEnabled());
    }
  }, []);

  // one gesture = one section: wheel, swipe and keys all step through the sheets
  useEffect(() => {
    let acc = 0;
    let cooldown = 0;
    let touchY = 0;
    const locked = () => !!document.documentElement.dataset.lock;
    const scrollable = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-scroll]") as HTMLElement | null;
      if (!el || el.scrollHeight <= el.clientHeight + 2) return false;
      return true;
    };
    const onWheel = (e: WheelEvent) => {
      if (locked() || scrollable(e)) return;
      acc += e.deltaY;
      const now = performance.now();
      if (Math.abs(acc) > 60 && now > cooldown) {
        step(acc > 0 ? 1 : -1);
        cooldown = now + 900;
        acc = 0;
      } else if (now > cooldown + 200) acc *= 0.5;
    };
    const onKey = (e: KeyboardEvent) => {
      if (locked() || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest?.("input,textarea")) return;
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Home" || e.key === "Escape") go(0);
      else if (e.key === "End") go(LAST);
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (locked() || scrollable(e)) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) step(dy > 0 ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [step, go]);

  // Ctrl/Cmd+K or "/" opens the palette; hovering controls ticks softly
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.("input,textarea");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPalette((p) => !p);
      } else if (
        !typing &&
        !document.documentElement.dataset.lock &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (/^[a-z]$/i.test(e.key) || e.key === "Backspace" || e.key === "Enter")
      ) {
        // the keyboard in the room is live: letters land on the monitor terminal
        typeKey(e.key, { go: navigate, setDay, toggleMusic });
      }
    };
    let lastEl: Element | null = null;
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("button,a");
      if (el && el !== lastEl) sound.blip();
      lastEl = el ?? null;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerover", onOver);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerover", onOver);
    };
  }, [navigate, toggleMusic]);

  const commands = useMemo<Command[]>(
    () => [
      ...STATIONS.map((s, i) => ({
        id: s,
        label: `GO TO ${s}`,
        hint: String(i + 1).padStart(2, "0"),
        run: () => navigate(i),
      })),
      { id: "sound", label: soundOn ? "SOUND: TURN OFF" : "SOUND: TURN ON", run: toggleSound },
      { id: "day", label: day ? "SWITCH TO NIGHT" : "SWITCH TO DAY", run: toggleDay },
      { id: "music", label: musicName ? "MUSIC: NEXT TRACK (" + musicName + ")" : "MUSIC: PLAY", run: toggleMusic },
      {
        id: "email",
        label: "COPY EMAIL",
        hint: PROFILE.email,
        run: () => navigator.clipboard?.writeText(PROFILE.email),
      },
    ],
    [navigate, soundOn, toggleSound, day, toggleDay, musicName, toggleMusic],
  );

  return (
    <ActiveContext.Provider value={section}>
      <Scene
        section={section}
        day={day}
        onSelect={navigate}
        onOpenCard={openCard}
        onToggleDay={toggleDay}
        onToggleMusic={toggleMusic}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[4] transition-opacity duration-700 ${section === 0 ? "opacity-100" : "opacity-0"} bg-gradient-to-tr from-[#07080d]/85 via-[#07080d]/10 to-transparent`}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[4] transition-opacity duration-700 ${section === 4 ? "opacity-100" : "opacity-0"} bg-gradient-to-t from-[#07080d]/92 via-[#07080d]/45 to-transparent md:bg-gradient-to-l md:from-[#07080d]/95 md:via-[#07080d]/80 md:to-transparent md:[mask-image:linear-gradient(to_left,black_55%,transparent)]`}
      />
      <Stage center visible={section === 0}>
        <HomeSheet onNavigate={navigate} />
      </Stage>
      {/* BIO, OPS, VAULT and UPLINK are shown by objects in the room (book, badge, monitor, phone).
          Their sheets stay in the DOM, hidden, for crawlers and screen readers. */}
      <Stage visible={false}>
        <BioSheet />
      </Stage>
      <Stage visible={false}>
        <OpsSheet />
      </Stage>
      {/* the monitor in the room shows the projects now; this sheet stays in the DOM for crawlers and screen readers */}
      <Stage visible={false}>
        <VaultSheet />
      </Stage>
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-24 z-[5] flex justify-center transition-all duration-700 ${
          HINTS[section] ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <p className="rounded-full bg-[#07080d]/70 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-white/70 backdrop-blur-md">
          {HINTS[section]}
        </p>
      </div>
      <Stage visible={section === 4}>
        <CodexSheet />
      </Stage>
      <Stage visible={false}>
        <UplinkSheet />
      </Stage>
      <Chrome
        section={section}
        onNavigate={navigate}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        day={day}
        onToggleDay={toggleDay}
        musicName={musicName}
        onToggleMusic={toggleMusic}
        onOpenPalette={() => setPalette(true)}
      />
      <CommandPalette open={palette} onClose={() => setPalette(false)} commands={commands} />
      <Boot onEnter={onEnter} />
    </ActiveContext.Provider>
  );
}
