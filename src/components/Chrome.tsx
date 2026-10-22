"use client";

import { useEffect, useState } from "react";
import { PROFILE } from "@/content/content";
import { STATIONS } from "./stations";
import { accent } from "@/lib/ui";

// Minimal chrome: brand mark, controls, and a glass dock. The room is the interface.
export default function Chrome({
  section,
  onNavigate,
  soundOn,
  onToggleSound,
  day,
  onToggleDay,
  musicName,
  onToggleMusic,
  onOpenPalette,
}: {
  section: number;
  onNavigate: (i: number) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  day: boolean;
  onToggleDay: () => void;
  musicName: string;
  onToggleMusic: () => void;
  onOpenPalette: () => void;
}) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 20000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const btn = "pointer-events-auto cursor-pointer tracking-[0.25em] transition-colors hover:text-white";

  return (
    <div className="pointer-events-none fixed inset-0 z-10 font-mono text-[10px] uppercase">
      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
        <button
          onClick={() => onNavigate(0)}
          aria-label="Home"
          className="pointer-events-auto flex cursor-pointer items-center gap-3 tracking-[0.3em] text-white/90"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold backdrop-blur-md"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
          >
            {PROFILE.name
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </span>
          <span className={`hidden transition-opacity sm:inline ${section === 0 ? "opacity-0" : "opacity-100"}`}>
            {PROFILE.name}
          </span>
        </button>
        <div
          className="flex items-center gap-4 rounded-full px-4 py-2 text-white/70 backdrop-blur-md sm:gap-5"
          style={{ background: "rgba(10,13,22,0.6)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
        >
          <button onClick={onToggleDay} aria-pressed={day} className={btn}>
            {day ? "NIGHT" : "DAY"}
          </button>
          <button onClick={onToggleMusic} aria-pressed={!!musicName} className={`${btn} hidden sm:inline`}>
            MUSIC {musicName || "OFF"}
          </button>
          <button onClick={onToggleSound} aria-pressed={soundOn} className={btn}>
            SND {soundOn ? "ON" : "OFF"}
          </button>
          <button onClick={onOpenPalette} className={`${btn} hidden sm:inline`}>
            CTRL+K
          </button>
          <span className="hidden tracking-[0.25em] sm:inline">{time}</span>
        </div>
      </header>

      <nav
        aria-label="Sections"
        className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-full p-1.5 backdrop-blur-xl sm:bottom-6"
        style={{ background: "rgba(10,13,22,0.72)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }}
      >
        {STATIONS.map((s, i) => {
          const on = i === section;
          return (
            <button
              key={s}
              onClick={() => onNavigate(i)}
              aria-current={on}
              className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 tracking-[0.2em] transition-all duration-300 sm:px-4"
              style={{
                background: on ? "rgba(255,255,255,0.12)" : "transparent",
                color: on ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              <span style={{ color: on ? accent(70) : "inherit" }}>{String(i + 1).padStart(2, "0")}</span>
              <span className={on ? "inline" : "hidden md:inline"}>{s}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
