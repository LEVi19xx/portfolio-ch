"use client";

import { useEffect, useState } from "react";
import { PROFILE } from "@/content/content";
import { accent } from "@/lib/ui";

const LINES = [
  "BOOT SEQUENCE v2.6",
  "› LINKING NEURAL INTERFACE ........ OK",
  "› MOUNTING TUNNEL RENDERER ........ OK",
  "› CALIBRATING LENS ................ OK",
  `› LOADING PROFILE: ${PROFILE.name} ... OK`,
];

export default function Boot({ onEnter }: { onEnter: (withSound: boolean) => void }) {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (shown >= LINES.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), 340);
    return () => clearTimeout(id);
  }, [shown]);

  const enter = (withSound: boolean) => {
    onEnter(withSound);
    setLeaving(true);
    setTimeout(() => setGone(true), 900);
  };

  if (gone) return null;
  const ready = shown >= LINES.length;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#03040a] px-6 font-mono transition-opacity duration-700 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Intro"
    >
      <div className="w-full max-w-lg">
        <div className="min-h-32 space-y-1.5 text-xs tracking-widest" style={{ color: accent(68, 0.9) }}>
          {LINES.slice(0, shown).map((l) => (
            <div key={l}>{l}</div>
          ))}
          {!ready && <span className="inline-block h-3 w-2 animate-pulse" style={{ background: accent(68) }} />}
        </div>

        <div
          className={`mt-8 flex flex-col gap-3 transition-all duration-500 sm:flex-row ${
            ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          <button
            onClick={() => enter(true)}
            className="cursor-pointer whitespace-nowrap px-8 py-3 text-xs font-bold tracking-[0.3em] transition-all hover:-translate-y-0.5 hover:brightness-125"
            style={{ background: accent(62), color: "#03040a" }}
          >
            ENTER ♪ WITH SOUND
          </button>
          <button
            onClick={() => enter(false)}
            className="cursor-pointer whitespace-nowrap px-8 py-3 text-xs font-bold tracking-[0.3em] transition-all hover:-translate-y-0.5"
            style={{ color: accent(70), boxShadow: `inset 0 0 0 1px ${accent(55, 0.6)}` }}
          >
            ENTER SILENT
          </button>
        </div>
      </div>
    </div>
  );
}
