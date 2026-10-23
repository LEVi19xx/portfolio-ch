"use client";

import { useState } from "react";
import { PROFILE } from "@/content/content";
import { LETTER_MAX, letter, useLetter } from "@/lib/letter";
import { sound } from "@/lib/sound";
import { dbReady, saveLetter } from "@/lib/supabase";
import { accent } from "@/lib/ui";

const pill = "cursor-pointer px-3 py-2 text-[11px] font-semibold tracking-[0.2em] transition-colors";

// The letter desk: type here and the paper on the desk fills up.
export default function LetterPanel() {
  const l = useLetter();
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  // saved to the database when it is set up, so it arrives even on a phone with no mail app
  const post = async () => {
    if (!dbReady()) return mail();
    setState("saving");
    const r = await saveLetter(l.name, l.text);
    if (r.ok) {
      setState("sent");
      letter.clear();
      setTimeout(() => setState("idle"), 5000);
    } else {
      setError(r.error);
      setState("error");
    }
  };

  const mail = () => {
    const subject = encodeURIComponent("A letter from " + (l.name || "a visitor"));
    const body = encodeURIComponent(l.text + "\n\n— " + (l.name || "a visitor"));
    window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(l.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: nothing to do */
    }
  };

  return (
    <section
      data-ui
      data-scroll
      aria-label="Letter"
      className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain pr-1 font-mono"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex items-center gap-3 text-[11px] tracking-[0.3em]" style={{ color: accent(68, 0.85) }}>
        <span>19</span>
        <span className="h-px w-8" style={{ background: accent(60, 0.6) }} />
        <span>LETTER</span>
      </div>
      <h2 className="mt-4 font-sans text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl">
        Write a letter.
      </h2>
      <p className="mt-3 max-w-md text-xs leading-6 text-slate-400">
        Say anything. It appears on the paper on the desk, and you can send it to me by email when you are done.
      </p>

      <label className="mt-5 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
        FROM
        <input
          value={l.name}
          onChange={(e) => letter.setName(e.target.value)}
          placeholder="Your name"
          className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none placeholder:text-slate-500"
          style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.35)}` }}
        />
      </label>
      <label className="mt-4 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
        LETTER
        <textarea
          value={l.text}
          onChange={(e) => letter.setText(e.target.value)}
          rows={8}
          placeholder="Dear CJ..."
          className="mt-2 block w-full resize-none rounded-md bg-white/5 px-3 py-2 text-sm normal-case leading-6 tracking-normal text-white outline-none placeholder:text-slate-500"
          style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.35)}` }}
        />
      </label>
      <p className="mt-1 text-right text-[10px] tracking-[0.2em] text-slate-500">
        {l.text.length} / {LETTER_MAX}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => {
            sound.click();
            void post();
          }}
          disabled={!l.text.trim() || state === "saving"}
          className={pill + " disabled:cursor-not-allowed disabled:opacity-40"}
          style={{ color: "#05070d", background: accent(64) }}
        >
          {state === "saving" ? "SENDING..." : state === "sent" ? "SENT ✓" : dbReady() ? "SEND LETTER" : "SEND BY EMAIL"}
        </button>
        {dbReady() && (
          <button
            onClick={() => {
              sound.click();
              mail();
            }}
            disabled={!l.text.trim()}
            className={pill + " disabled:cursor-not-allowed disabled:opacity-40"}
            style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}
          >
            EMAIL IT
          </button>
        )}
        <button
          onClick={copy}
          disabled={!l.text.trim()}
          className={pill + " disabled:cursor-not-allowed disabled:opacity-40"}
          style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}
        >
          {copied ? "COPIED" : "COPY"}
        </button>
        <button
          onClick={() => {
            sound.click();
            letter.clear();
          }}
          className={pill}
          style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}
        >
          NEW PAPER
        </button>
      </div>
      {state === "sent" && <p className="mt-3 text-[11px] text-slate-300">Your letter was delivered. Thank you!</p>}
      {state === "error" && <p className="mt-3 text-[11px] text-rose-300">{error}</p>}
    </section>
  );
}
