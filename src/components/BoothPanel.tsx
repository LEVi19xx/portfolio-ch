"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { booth, compose, TEMPLATES, THEMES, type Shot, type TemplateId, type ThemeId } from "@/lib/booth";
import { sound } from "@/lib/sound";
import { accent } from "@/lib/ui";

const pill = "cursor-pointer px-3 py-2 text-[11px] font-semibold tracking-[0.2em] transition-colors";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-5 text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => {
        sound.click();
        onClick();
      }}
      className={pill}
      style={{
        color: on ? "#05070d" : accent(72),
        background: on ? accent(64) : "transparent",
        boxShadow: on ? "none" : `inset 0 0 0 1px ${accent(55, 0.5)}`,
      }}
    >
      {children}
    </button>
  );
}

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

// The photobooth: pick a frame, smile at the camera, and take home a polaroid or a couple strip.
// Photos never leave the browser: the camera feed is drawn onto a canvas right here.
export default function BoothPanel() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<"off" | "starting" | "on" | "error">("off");
  const [tpl, setTpl] = useState<TemplateId>("couple");
  const [theme, setTheme] = useState<ThemeId>("blush");
  const [caption, setCaption] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [pinned, setPinned] = useState(false);
  const template = TEMPLATES.find((t) => t.id === tpl) ?? TEMPLATES[0];

  const stopCam = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCam("off");
  };
  // the panel is remounted when you leave the booth, which turns the camera off
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  const startCam = async () => {
    sound.click();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam("error");
      return;
    }
    setCam("starting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false });
      stream.current = s;
      setCam("on");
      requestAnimationFrame(() => {
        const v = video.current;
        if (v) {
          v.srcObject = s;
          void v.play();
        }
      });
    } catch {
      setCam("error");
    }
  };

  // one frame from the camera, mirrored like a mirror would show it
  const grab = (): Shot | null => {
    const v = video.current;
    if (!v || !v.videoWidth) return null;
    const cv = document.createElement("canvas");
    cv.width = v.videoWidth;
    cv.height = v.videoHeight;
    const c = cv.getContext("2d");
    if (!c) return null;
    c.translate(cv.width, 0);
    c.scale(-1, 1);
    c.drawImage(v, 0, 0);
    return { source: cv, w: cv.width, h: cv.height };
  };

  const shoot = async () => {
    if (busy || cam !== "on") return;
    setBusy(true);
    setShots([]);
    setPinned(false);
    const got: Shot[] = [];
    for (let i = 0; i < template.shots; i++) {
      for (let n = 3; n >= 1; n--) {
        setCount(n);
        void sound.note(n === 1 ? 880 : 660);
        await wait(900);
      }
      setCount(0);
      const s = grab();
      if (s) got.push(s);
      booth.flash();
      setFlash(true);
      void sound.note(1320);
      setTimeout(() => setFlash(false), 220);
      await wait(900);
    }
    setShots(got);
    setBusy(false);
  };

  // no camera? use your own photos instead
  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const got: Shot[] = [];
    for (const f of Array.from(files).slice(0, template.shots)) {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
        got.push({ source: img, w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        /* not an image: skip it */
      }
    }
    if (got.length) {
      setPinned(false);
      setShots(got);
    }
  };

  // recompose whenever the frame, the theme or the caption changes
  const print = useMemo(
    () => (shots.length ? compose(tpl, theme, shots, caption, today()).toDataURL("image/jpeg", 0.9) : ""),
    [shots, tpl, theme, caption],
  );

  const download = () => {
    sound.click();
    const a = document.createElement("a");
    a.href = print;
    a.download = "photobooth-" + tpl + ".jpg";
    a.click();
  };

  return (
    <section
      data-ui
      data-scroll
      aria-label="Photobooth"
      className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain pr-1 font-mono"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex items-center gap-3 text-[11px] tracking-[0.3em]" style={{ color: accent(68, 0.85) }}>
        <span>21</span>
        <span className="h-px w-8" style={{ background: accent(60, 0.6) }} />
        <span>PHOTOBOOTH</span>
      </div>
      <h2 className="mt-4 font-sans text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl">
        Say cheese.
      </h2>
      <p className="mt-3 max-w-md text-xs leading-6 text-slate-400">
        Pick a frame, turn on the camera and press shoot. Your photos stay in your browser: nothing is uploaded.
      </p>

      <Label>FRAME</Label>
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATES.map((t) => (
          <Chip key={t.id} on={tpl === t.id} onClick={() => setTpl(t.id)}>
            {t.name}
          </Chip>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        {template.blurb} ({template.shots} {template.shots > 1 ? "photos" : "photo"})
      </p>

      <Label>COLOR</Label>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            aria-label={t.name}
            title={t.name}
            onClick={() => {
              sound.click();
              setTheme(t.id);
            }}
            className="h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${t.bg} 55%, ${t.accent} 55%)`,
              boxShadow: theme === t.id ? `0 0 0 2px #07080d, 0 0 0 4px ${accent(70)}` : "inset 0 0 0 1px rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>

      <label className="mt-4 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
        CAPTION
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 40))}
          placeholder="us, today"
          className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none placeholder:text-slate-500"
          style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.35)}` }}
        />
      </label>

      <div className="relative mt-5 aspect-[4/3] max-w-sm overflow-hidden rounded-md bg-black/50" style={{ boxShadow: `0 0 0 1px ${accent(60, 0.35)}` }}>
        {cam === "on" ? (
          <video ref={video} playsInline muted className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-[11px] leading-5 text-slate-400">
            {cam === "error" ? "Camera unavailable or blocked. You can upload photos instead." : "The camera is off."}
            <button onClick={startCam} className={pill} style={{ color: "#05070d", background: accent(64) }}>
              {cam === "starting" ? "STARTING..." : "TURN ON CAMERA"}
            </button>
          </div>
        )}
        {count > 0 && (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-8xl font-bold text-white" style={{ textShadow: "0 0 30px rgba(0,0,0,0.6)" }}>
            {count}
          </div>
        )}
        {flash && <div className="absolute inset-0 bg-white" />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={shoot}
          disabled={busy || cam !== "on"}
          className={pill + " disabled:cursor-not-allowed disabled:opacity-40"}
          style={{ color: "#05070d", background: accent(64) }}
        >
          {busy ? "SMILE..." : "● SHOOT " + template.shots + (template.shots > 1 ? " PHOTOS" : " PHOTO")}
        </button>
        <label className={pill} style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}>
          UPLOAD INSTEAD
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void upload(e.target.files)} />
        </label>
        {cam === "on" && (
          <button onClick={stopCam} className={pill} style={{ color: "rgb(148 163 184)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}>
            CAMERA OFF
          </button>
        )}
      </div>

      {print && (
        <>
          <Label>YOUR PRINT</Label>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={print} alt="Your photobooth print" className="max-h-80 max-w-full rounded-sm" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }} />
          <div className="mt-3 flex flex-wrap gap-2 pb-2">
            <button onClick={download} className={pill} style={{ color: "#05070d", background: accent(64) }}>
              DOWNLOAD
            </button>
            <button
              onClick={() => {
                sound.click();
                booth.pin(print);
                setPinned(true);
              }}
              className={pill}
              style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}
            >
              {pinned ? "PINNED ✓" : "PIN TO THE BOOTH"}
            </button>
            <button
              onClick={() => {
                sound.click();
                setShots([]);
              }}
              className={pill}
              style={{ color: "rgb(148 163 184)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
            >
              RETAKE
            </button>
          </div>
        </>
      )}
    </section>
  );
}
