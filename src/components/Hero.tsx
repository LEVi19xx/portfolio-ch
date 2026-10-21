"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Edit these to make the hero yours.
const PROFILE = {
  name: "CJ COLOMA",
  tagline: "I BUILD",
  roles: ["INTERFACES", "WEB EXPERIENCES", "DIGITAL SYSTEMS", "THINGS THAT MOVE"],
  status: "SYSTEM ONLINE · AVAILABLE FOR WORK",
  stats: [
    { label: "PROJECTS", value: "24+" },
    { label: "YEARS", value: "05" },
    { label: "COFFEES", value: "∞" },
  ],
};

const GLYPHS = "▓▒░<>/\\[]{}#$%&*+=_01";

// Text that decodes from noise; call replay() to scramble it again.
function useScramble(target: string) {
  const [text, setText] = useState(target);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const replay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    let frame = 0;
    const total = target.length * 2 + 8;
    timer.current = setInterval(() => {
      frame++;
      const revealed = Math.floor((frame / total) * target.length * 1.4);
      setText(
        target
          .split("")
          .map((ch, i) =>
            ch === " " || i < revealed
              ? ch
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(""),
      );
      if (revealed >= target.length && timer.current) {
        clearInterval(timer.current);
        setText(target);
      }
    }, 35);
  }, [target]);

  useEffect(() => {
    const start = setTimeout(replay, 200);
    return () => {
      clearTimeout(start);
      if (timer.current) clearInterval(timer.current);
    };
  }, [replay]);

  return [text, replay] as const;
}

function useTypewriter(words: string[]) {
  const [state, setState] = useState({ word: 0, chars: 0, deleting: false });

  useEffect(() => {
    const current = words[state.word];
    const done = !state.deleting && state.chars === current.length;
    const empty = state.deleting && state.chars === 0;
    const delay = done ? 1600 : empty ? 300 : state.deleting ? 35 : 75;
    const id = setTimeout(() => {
      setState((s) => {
        if (done) return { ...s, deleting: true };
        if (empty)
          return { word: (s.word + 1) % words.length, chars: 0, deleting: false };
        return { ...s, chars: s.chars + (s.deleting ? -1 : 1) };
      });
    }, delay);
    return () => clearTimeout(id);
  }, [state, words]);

  return words[state.word].slice(0, state.chars);
}

const accent = (l = 60, a = 1) => `hsl(var(--hue, 212) 100% ${l}% / ${a})`;

function HudButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="group pointer-events-auto relative px-8 py-3 text-xs font-bold tracking-[0.3em] transition-all duration-200 hover:-translate-y-0.5 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
      style={{
        color: primary ? "#03040a" : accent(70),
        background: primary ? accent(62) : accent(50, 0.08),
        boxShadow: `inset 0 0 0 1px ${accent(55, 0.6)}`,
      }}
    >
      <span className="relative z-10">{children}</span>
      <span
        className="absolute inset-0 -translate-x-full transition-transform duration-500 group-hover:translate-x-0"
        style={{ background: accent(65, primary ? 0.35 : 0.18) }}
      />
    </button>
  );
}

export default function Hero({
  visible,
  onNavigate,
}: {
  visible: boolean;
  onNavigate: (i: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [name, replayName] = useScramble(PROFILE.name);
  const role = useTypewriter(PROFILE.roles);

  useEffect(() => {
    if (visible) replayName();
  }, [visible, replayName]);

  // pointer parallax without re-rendering: write --px/--py straight onto the element
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--px", String((e.clientX / window.innerWidth - 0.5) * 2));
      el.style.setProperty("--py", String((e.clientY / window.innerHeight - 0.5) * 2));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={root}
      className="pointer-events-none flex flex-col items-center justify-center text-center font-mono"
      style={{ ["--px" as string]: 0, ["--py" as string]: 0 }}
    >
      <div
        className="mb-6 flex items-center gap-3 text-[11px] tracking-[0.35em]"
        style={{ color: accent(70, 0.85) }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: accent(60) }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: accent(65) }}
          />
        </span>
        {PROFILE.status}
      </div>

      <h1
        onPointerEnter={replayName}
        className="pointer-events-auto relative cursor-default select-none text-[clamp(2.6rem,9vw,7.5rem)] font-bold leading-none tracking-[0.08em] will-change-transform"
        style={{
          color: "#eaf6ff",
          transform:
            "translate(calc(var(--px) * -14px), calc(var(--py) * -10px)) rotateX(calc(var(--py) * -6deg)) rotateY(calc(var(--px) * 8deg))",
          textShadow: `calc(var(--px) * 5px) calc(var(--py) * 3px) 0 hsl(350 100% 55% / 0.55),
            calc(var(--px) * -5px) calc(var(--py) * -3px) 0 hsl(150 100% 50% / 0.45),
            0 0 40px ${accent(55, 0.55)}`,
        }}
      >
        {name}
      </h1>

      <p
        className="mt-6 min-h-8 text-base tracking-[0.3em] sm:text-xl"
        style={{
          color: accent(75, 0.95),
          transform: "translate(calc(var(--px) * -6px), calc(var(--py) * -4px))",
        }}
      >
        <span style={{ color: accent(60, 0.55) }}>{PROFILE.tagline} </span>
        {role}
        <span className="ml-1 inline-block w-[0.6ch] animate-pulse" style={{ background: accent(70) }}>
          &nbsp;
        </span>
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <HudButton onClick={() => onNavigate(2)} primary>
          VIEW WORK
        </HudButton>
        <HudButton onClick={() => onNavigate(4)}>CONTACT</HudButton>
      </div>

      <dl className="mt-14 flex items-stretch gap-0 text-[10px] tracking-[0.3em]">
        {PROFILE.stats.map((s, i) => (
          <div
            key={s.label}
            className="px-6 sm:px-10"
            style={{ borderLeft: i ? `1px solid ${accent(55, 0.25)}` : undefined }}
          >
            <dd className="text-2xl font-bold sm:text-3xl" style={{ color: accent(72) }}>
              {s.value}
            </dd>
            <dt style={{ color: accent(60, 0.6) }}>{s.label}</dt>
          </div>
        ))}
      </dl>

      <div
        className="absolute bottom-24 hidden text-[10px] tracking-[0.4em] sm:block"
        style={{ color: accent(60, 0.5) }}
      >
        SCROLL · ↓ · HOLD — FLY THROUGH THE PORTFOLIO
      </div>
    </div>
  );
}
