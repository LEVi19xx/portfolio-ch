"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Boot from "./Boot";
import Chrome from "./Chrome";
import WalkHud from "./WalkHud";
import BoothPanel from "./BoothPanel";
import BouquetPanel from "./BouquetPanel";
import BuskPanel from "./BuskPanel";
import LetterPanel from "./LetterPanel";
import PaintPanel from "./PaintPanel";
import CommandPalette, { type Command } from "./CommandPalette";
import dynamic from "next/dynamic";
import {
  AwardsSheet,
  BioSheet,
  CodexSheet,
  HomeSheet,
  LifeSheet,
  MoviesSheet,
  OpsSheet,
  RoomIntro,
  UplinkSheet,
  VaultSheet,
} from "./Panels";
import { OVERVIEWS, ROOMS, roomIndexOf, roomOf, STATIONS } from "./stations";
import { PROFILE, ROOM_INTROS } from "@/content/content";
import { KEY_MAP, noteFreq } from "@/lib/piano";
import { sound } from "@/lib/sound";
import { typeKey } from "@/lib/terminal";
import { ActiveContext } from "@/lib/ui";
import { control } from "@/scene/nav";

const Scene = dynamic(() => import("@/scene/Scene"), { ssr: false });

const LAST = STATIONS.length - 1;

// what to do in each close-up
const HINTS: Record<number, string> = {
  1: "02 — BIO · READ THE BOOK · ESC TO GO BACK",
  2: "03 — OPS · CLICK A BADGE TO READ IT · ESC TO GO BACK",
  3: "04 — VAULT · CLICK A PROJECT ON THE MONITOR · ESC TO GO BACK",
  5: "06 — UPLINK · TAP THE PHONE · ESC TO GO BACK",
  7: "08 — LIFE · CLICK A CHANNEL ON THE TV · ESC TO GO BACK",
  9: "10 — AWARDS · CLICK A FRAME TO READ IT · ESC TO GO BACK",
  11: "12 — REEL · PICK A FILM, PRESS PLAY · ESC TO GO BACK",
  13: "14 — JAM · CLICK THE KEYS OR USE Z–M AND Q–U · ESC TO GO BACK",
  15: "16 — BOUQUET · CHOOSE FLOWERS AND COLORS ON THE RIGHT · ESC TO GO BACK",
  17: "18 — CANVAS · PAINT ON THE RIGHT, WATCH THE EASEL · ESC TO GO BACK",
  18: "19 — LETTER · TYPE ON THE RIGHT, THE PAPER FILLS UP · ESC TO GO BACK",
  19: "20 — BUSK · PICK A SONG, PRESS PLAY · Z–M AND Q–U PLAY NOTES · ESC TO GO BACK",
  20: "21 — PHOTOBOOTH · PICK A FRAME, TURN ON THE CAMERA, SHOOT · ESC TO GO BACK",
};

// Sheets sit on the right on desktop and at the bottom on phones.
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
  const [walk, setWalk] = useState(false);
  const sectionRef = useRef(0);

  // the camera flies to the room and the character walks there, through the doors
  const go = useCallback((raw: number) => {
    const next = Math.max(0, Math.min(LAST, raw));
    if (next === sectionRef.current) return;
    sound.arrive();
    sectionRef.current = next;
    setSection(next);
  }, []);
  const step = useCallback((d: number) => go(sectionRef.current + d), [go]);
  // you drive her (explore mode): the camera is hers, and sitting somewhere opens that section
  const startWalk = useCallback(() => {
    sound.click();
    window.dispatchEvent(new Event("walk-start"));
    control.active = true;
    control.map = false;
    document.documentElement.dataset.walk = "1";
    setWalk(true);
    go(OVERVIEWS[ROOMS.findIndex((r) => r.id === control.room)]);
  }, [go]);
  const endWalk = useCallback(() => {
    if (!control.active) return;
    control.active = false;
    control.map = false;
    control.keys.clear();
    delete document.documentElement.dataset.walk;
    window.dispatchEvent(new Event("walk-end"));
    setWalk(false);
  }, []);
  // while you drive her, every shortcut (room tabs, the dock, hotspots, commands) walks her there instead
  const navigate = useCallback(
    (i: number) => {
      sound.click();
      if (control.active) {
        window.dispatchEvent(new CustomEvent("walk-to", { detail: i }));
        return;
      }
      go(i);
    },
    [go],
  );
  const onSit = useCallback((i: number) => go(i), [go]);
  const onStand = useCallback(() => {
    go(OVERVIEWS[ROOMS.findIndex((r) => r.id === control.room)]);
  }, [go]);
  // walking into another room in explore mode changes which room the page talks about
  useEffect(() => {
    const onRoom = (e: Event) => {
      if (control.seat >= 0) return;
      const id = (e as CustomEvent<string>).detail;
      const i = ROOMS.findIndex((r) => r.id === id);
      if (i >= 0) go(OVERVIEWS[i]);
    };
    window.addEventListener("walk-room", onRoom);
    return () => window.removeEventListener("walk-room", onRoom);
  }, [go]);

  // labels attached to 3D objects are DOM: let CSS hide the ones from other rooms
  useEffect(() => {
    document.documentElement.dataset.room = roomOf(section);
  }, [section]);

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
    // you drive her from the start
    startWalk();
  }, [startWalk]);

  // one gesture = one section: wheel, swipe and keys all step through the experience
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
      if (locked() || scrollable(e) || control.active) return;
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
      if (control.active) {
        // Esc: stand up first, then leave
        if (e.key === "Escape") {
          if (control.seat >= 0) window.dispatchEvent(new Event("walk-stand"));
          else endWalk();
        }
        return;
      }
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Escape") {
        // back to the first view of the room you are in
        go(OVERVIEWS[roomIndexOf(sectionRef.current)]);
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(LAST);
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (locked() || scrollable(e) || control.active) return;
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
  }, [step, go, endWalk]);

  // Ctrl/Cmd+K or "/" opens the palette; hovering controls ticks softly
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.("input,textarea");
      const semitone = KEY_MAP[e.key.toLowerCase()];
      if (
        (sectionRef.current === 13 || sectionRef.current === 19) &&
        semitone !== undefined &&
        !typing &&
        !e.repeat &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !document.documentElement.dataset.lock
      ) {
        e.preventDefault();
        void sound.note(noteFreq(semitone));
        window.dispatchEvent(new CustomEvent("piano-press", { detail: semitone }));
        return;
      }
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPalette((p) => !p);
      } else if (
        !typing &&
        !control.active &&
        !document.documentElement.dataset.lock &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (/^[a-z]$/i.test(e.key) || e.key === "Backspace" || e.key === "Enter")
      ) {
        // the keyboard in the studio is live: letters land on the monitor terminal
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
      ...ROOMS.map((r) => ({
        id: "room-" + r.id,
        label: `ENTER THE ${r.name}`,
        hint: r.blurb.toUpperCase(),
        run: () => navigate(r.sections[0]),
      })),
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

  const overview = OVERVIEWS.includes(section);

  return (
    <ActiveContext.Provider value={section}>
      <Scene
        section={section}
        day={day}
        onSelect={navigate}
        onOpenCard={openCard}
        onToggleDay={toggleDay}
        onToggleMusic={toggleMusic}
        onSit={onSit}
        onStand={onStand}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[4] transition-opacity duration-700 ${overview && !walk ? "opacity-100" : "opacity-0"} bg-gradient-to-tr from-[#07080d]/85 via-[#07080d]/10 to-transparent`}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[4] transition-opacity duration-700 ${section === 4 || section === 15 || section === 17 || section === 18 || section === 19 || section === 20 ? "opacity-100" : "opacity-0"} bg-gradient-to-t from-[#07080d]/95 via-[#07080d]/80 to-transparent md:bg-gradient-to-l md:from-[#07080d]/95 md:via-[#07080d]/80 md:to-transparent md:[mask-image:linear-gradient(to_left,black_55%,transparent)]`}
      />

      {/* STUDIO */}
      <Stage center visible={section === 0 && !walk}>
        <HomeSheet onNavigate={navigate} />
      </Stage>
      {/* BIO, OPS, VAULT, UPLINK, LIFE and AWARDS are shown by objects in the rooms (book, badge, monitor, phone, TV, frames).
          Their sheets stay in the DOM, hidden, for crawlers and screen readers. */}
      <Stage visible={false}>
        <BioSheet />
      </Stage>
      <Stage visible={false}>
        <OpsSheet />
      </Stage>
      <Stage visible={false}>
        <VaultSheet />
      </Stage>
      <Stage visible={section === 4}>
        <CodexSheet />
      </Stage>
      <Stage visible={false}>
        <UplinkSheet />
      </Stage>

      {/* LOUNGE + GALLERY */}
      <Stage center visible={section === 6 && !walk}>
        <RoomIntro
          title={ROOM_INTROS.lounge.title}
          tagline={ROOM_INTROS.lounge.tagline}
          actions={[
            { label: "WATCH THE TV", run: () => navigate(7), primary: true },
            { label: "NEXT ROOM", run: () => navigate(8) },
          ]}
        />
      </Stage>
      <Stage visible={false}>
        <LifeSheet />
      </Stage>
      <Stage center visible={section === 8 && !walk}>
        <RoomIntro
          title={ROOM_INTROS.gallery.title}
          tagline={ROOM_INTROS.gallery.tagline}
          actions={[
            { label: "SEE THE AWARDS", run: () => navigate(9), primary: true },
            { label: "BACK TO THE STUDIO", run: () => navigate(0) },
          ]}
        />
      </Stage>
      <Stage visible={false}>
        <AwardsSheet />
      </Stage>

      {/* THEATER + MUSIC ROOM + FLOWER SHOP */}
      <Stage center visible={section === 10 && !walk}>
        <RoomIntro
          title={ROOM_INTROS.theater.title}
          tagline={ROOM_INTROS.theater.tagline}
          actions={[
            { label: "TAKE A SEAT", run: () => navigate(11), primary: true },
            { label: "NEXT ROOM", run: () => navigate(12) },
          ]}
        />
      </Stage>
      <Stage visible={false}>
        <MoviesSheet />
      </Stage>
      <Stage center visible={section === 12 && !walk}>
        <RoomIntro
          title={ROOM_INTROS.music.title}
          tagline={ROOM_INTROS.music.tagline}
          actions={[
            { label: "PLAY THE KEYS", run: () => navigate(13), primary: true },
            { label: "NEXT ROOM", run: () => navigate(14) },
          ]}
        />
      </Stage>
      <Stage center visible={section === 14 && !walk}>
        <RoomIntro
          title={ROOM_INTROS.flowers.title}
          tagline={ROOM_INTROS.flowers.tagline}
          actions={[
            { label: "BUILD A BOUQUET", run: () => navigate(15), primary: true },
            { label: "BACK TO THE STUDIO", run: () => navigate(0) },
          ]}
        />
      </Stage>
      <Stage visible={section === 15}>
        <BouquetPanel />
      </Stage>

      {/* ATELIER */}
      <Stage center visible={section === 16 && !walk}>
        <RoomIntro
          title={ROOM_INTROS.atelier.title}
          tagline={ROOM_INTROS.atelier.tagline}
          actions={[
            { label: "PAINT", run: () => navigate(17), primary: true },
            { label: "WRITE A LETTER", run: () => navigate(18) },
          ]}
        />
      </Stage>
      <Stage visible={section === 17}>
        <PaintPanel />
      </Stage>
      <Stage visible={section === 18}>
        <LetterPanel />
      </Stage>
      <Stage visible={section === 19}>
        <BuskPanel />
      </Stage>
      <Stage visible={section === 20}>
        <BoothPanel key={section === 20 ? "on" : "off"} />
      </Stage>

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-24 z-[5] hidden justify-center transition-all duration-700 md:flex ${
          HINTS[section] ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <p className="rounded-full bg-[#07080d]/70 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-white/70 backdrop-blur-md">
          {HINTS[section]}
        </p>
      </div>

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
        walk={walk}
        onToggleWalk={walk ? endWalk : startWalk}
      />
      {walk && <WalkHud onExit={endWalk} />}
      <CommandPalette open={palette} onClose={() => setPalette(false)} commands={commands} />

      <Boot onEnter={onEnter} />
    </ActiveContext.Provider>
  );
}
