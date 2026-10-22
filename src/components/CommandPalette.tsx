"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { accent, useLock } from "@/lib/ui";

export type Command = { id: string; label: string; hint?: string; run: () => void };

export default function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  useLock(open);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  if (!open) return null;

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    setQuery("");
    setCursor(0);
    c.run();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") run(results[cursor]);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/60 px-4 pt-[18vh] font-mono"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="Command palette"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg"
        style={{
          background: "rgba(3,6,18,0.97)",
          boxShadow: `inset 0 0 0 1px ${accent(60, 0.6)}, 0 0 80px ${accent(50, 0.2)}`,
        }}
      >
        <input
          ref={input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={onKey}
          placeholder="JUMP TO…  (type to filter)"
          className="w-full bg-transparent px-5 py-4 text-sm tracking-widest text-slate-50 outline-none placeholder:text-slate-500"
          style={{ borderBottom: `1px solid ${accent(55, 0.3)}` }}
        />
        <ul className="max-h-72 overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-5 py-3 text-xs tracking-widest text-slate-500">NO MATCH</li>
          )}
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                onMouseEnter={() => setCursor(i)}
                onClick={() => run(c)}
                className="flex w-full cursor-pointer items-center justify-between px-5 py-2.5 text-left text-xs tracking-[0.25em]"
                style={{
                  color: i === cursor ? accent(80) : accent(65, 0.8),
                  background: i === cursor ? accent(50, 0.14) : "transparent",
                }}
              >
                <span>{c.label}</span>
                {c.hint && <span style={{ color: accent(60, 0.5) }}>{c.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div
          className="flex justify-between px-5 py-2 text-[10px] tracking-[0.25em]"
          style={{ color: accent(60, 0.5), borderTop: `1px solid ${accent(55, 0.2)}` }}
        >
          <span>↑↓ NAVIGATE · ↵ SELECT</span>
          <span>ESC CLOSE</span>
        </div>
      </div>
    </div>
  );
}
