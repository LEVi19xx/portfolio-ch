"use client";

import { useSyncExternalStore } from "react";

const q = () => (typeof window === "undefined" ? null : window.matchMedia("(pointer: coarse) and (orientation: portrait)"));

// Like a game on a phone: the house is built for landscape. In portrait there is only this prompt.
export async function goLandscape() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape");
  } catch {
    /* not supported (iPhone Safari) or refused: the prompt stays until the phone is turned */
  }
}

export default function RotateNotice() {
  const portrait = useSyncExternalStore(
    (cb) => {
      const m = q();
      m?.addEventListener("change", cb);
      return () => m?.removeEventListener("change", cb);
    },
    () => !!q()?.matches,
    () => false,
  );
  if (!portrait) return null;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-[#03040a] px-8 text-center font-mono text-white">
      <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden="true" className="animate-pulse">
        <rect x="26" y="10" width="32" height="64" rx="6" stroke="currentColor" strokeWidth="3" />
        <path d="M60 28c10 3 14 10 14 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M70 40l4 7 7-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm tracking-[0.3em]">ROTATE YOUR PHONE</p>
      <p className="max-w-xs text-[11px] leading-6 tracking-[0.15em] text-white/60">This house is best explored in landscape, like a game.</p>
      <button onClick={() => void goLandscape()} className="cursor-pointer rounded-full bg-white/10 px-5 py-3 text-[11px] tracking-[0.25em]">
        FULLSCREEN LANDSCAPE
      </button>
    </div>
  );
}
