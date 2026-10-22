"use client";

import { busk, SONGS, useBusk } from "@/lib/busk";
import { sound } from "@/lib/sound";
import { accent } from "@/lib/ui";

const pill = "cursor-pointer px-3 py-2 text-[11px] font-semibold tracking-[0.2em] transition-colors";

// Busking: play on the rug in the music room, watch the crowd grow and the tips pile up in the guitar case.
export default function BuskPanel() {
  const b = useBusk();
  return (
    <section
      data-ui
      data-scroll
      aria-label="Busking"
      className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain pr-1 font-mono"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex items-center gap-3 text-[11px] tracking-[0.3em]" style={{ color: accent(68, 0.85) }}>
        <span>20</span>
        <span className="h-px w-8" style={{ background: accent(60, 0.6) }} />
        <span>BUSK</span>
      </div>
      <h2 className="mt-4 font-sans text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl">
        Play for tips.
      </h2>
      <p className="mt-3 max-w-md text-xs leading-6 text-slate-400">
        Pick a song and play. A crowd gathers and drops coins in the guitar case. You can also play extra notes on the keyboard: Z to M and Q to U.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {SONGS.map((s, i) => {
          const on = b.song === i;
          return (
            <button
              key={s.name}
              onClick={() => {
                sound.click();
                busk.setSong(i);
              }}
              className={pill}
              style={{
                color: on ? "#05070d" : accent(72),
                background: on ? accent(64) : "transparent",
                boxShadow: on ? "none" : `inset 0 0 0 1px ${accent(55, 0.5)}`,
              }}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            sound.click();
            busk.toggle();
          }}
          className={pill}
          style={{ color: "#05070d", background: accent(64) }}
        >
          {b.playing ? "■ STOP" : "▶ START PLAYING"}
        </button>
        <button
          onClick={() => {
            sound.click();
            busk.reset();
          }}
          className={pill}
          style={{ color: "rgb(148 163 184)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
        >
          EMPTY THE CASE
        </button>
      </div>

      <div className="mt-6 grid max-w-sm grid-cols-2 gap-3">
        <div className="rounded-md p-3" style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.3)}` }}>
          <div className="text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
            CROWD
          </div>
          <div className="mt-1 font-sans text-3xl font-semibold text-white">{b.crowd}</div>
        </div>
        <div className="rounded-md p-3" style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.3)}` }}>
          <div className="text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
            TIPS
          </div>
          <div className="mt-1 font-sans text-3xl font-semibold text-white">{b.tips}</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-5 tracking-wider text-slate-500">
        The longer you play, the bigger the crowd. Stop, and they drift away.
      </p>
    </section>
  );
}
