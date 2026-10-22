"use client";

import { useEffect, useRef, useState } from "react";
import { BRUSHES, PAINT_COLORS, PAINT_H, PAINT_W, paint } from "@/lib/painting";
import { sound } from "@/lib/sound";
import { accent } from "@/lib/ui";

const pill = "cursor-pointer px-3 py-2 text-[11px] font-semibold tracking-[0.2em] transition-colors";

// The painting panel: the canvas you draw on is the same one the easel shows.
export default function PaintPanel() {
  const holder = useRef<HTMLDivElement>(null);
  const last = useRef<[number, number] | null>(null);
  const [color, setColor] = useState(PAINT_COLORS[2].hex);
  const [size, setSize] = useState(BRUSHES[1]);

  useEffect(() => {
    const el = holder.current;
    const cv = paint.canvas();
    cv.style.width = "100%";
    cv.style.height = "auto";
    cv.style.display = "block";
    cv.style.touchAction = "none";
    cv.style.cursor = "crosshair";
    el?.appendChild(cv);
    return () => void el?.removeChild(cv);
  }, []);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = paint.canvas().getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * PAINT_W, ((e.clientY - r.top) / r.height) * PAINT_H];
  };

  return (
    <section
      data-ui
      data-scroll
      aria-label="Painting"
      className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain pr-1 font-mono"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex items-center gap-3 text-[11px] tracking-[0.3em]" style={{ color: accent(68, 0.85) }}>
        <span>18</span>
        <span className="h-px w-8" style={{ background: accent(60, 0.6) }} />
        <span>CANVAS</span>
      </div>
      <h2 className="mt-4 font-sans text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl">
        Paint something.
      </h2>
      <p className="mt-3 max-w-md text-xs leading-6 text-slate-400">
        Draw below. The canvas on the easel changes as you paint.
      </p>

      <div
        ref={holder}
        className="mt-4 max-w-sm overflow-hidden rounded-md"
        style={{ boxShadow: `0 0 0 1px ${accent(60, 0.35)}` }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          const p = at(e);
          last.current = p;
          paint.line(p[0], p[1], p[0], p[1], color, size);
        }}
        onPointerMove={(e) => {
          if (!last.current || !(e.buttons & 1)) return;
          const p = at(e);
          paint.line(last.current[0], last.current[1], p[0], p[1], color, size);
          last.current = p;
        }}
        onPointerUp={() => (last.current = null)}
        onPointerCancel={() => (last.current = null)}
      />

      <div role="radiogroup" aria-label="Color" className="mt-4 flex flex-wrap gap-2">
        {PAINT_COLORS.map((c) => (
          <button
            key={c.hex}
            role="radio"
            aria-checked={c.hex === color}
            aria-label={c.name}
            title={c.name}
            onClick={() => {
              sound.click();
              setColor(c.hex);
            }}
            className="h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110"
            style={{
              background: c.hex,
              boxShadow: c.hex === color ? `0 0 0 2px #07080d, 0 0 0 4px ${accent(70)}` : "inset 0 0 0 1px rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {BRUSHES.map((b) => (
          <button
            key={b}
            aria-label={"Brush size " + b}
            onClick={() => {
              sound.click();
              setSize(b);
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center"
            style={{ boxShadow: `inset 0 0 0 1px ${b === size ? accent(70) : "rgba(255,255,255,0.18)"}` }}
          >
            <span className="rounded-full bg-white" style={{ width: Math.max(4, b / 1.6), height: Math.max(4, b / 1.6) }} />
          </button>
        ))}
        <button
          onClick={() => {
            sound.click();
            setColor("#f4efe3");
          }}
          className={pill}
          style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}
        >
          ERASER
        </button>
        <button
          onClick={() => {
            sound.click();
            paint.clear();
          }}
          className={pill}
          style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}
        >
          CLEAR
        </button>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = paint.png();
            a.download = "my-painting.png";
            a.click();
          }}
          className={pill}
          style={{ color: "#05070d", background: accent(64) }}
        >
          SAVE PNG
        </button>
      </div>
    </section>
  );
}
