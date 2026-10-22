"use client";

import { useEffect, useState } from "react";
import {
  AWARDS,
  EXPERIENCE,
  HEADLINES,
  INTERESTS,
  MOVIES,
  PROFILE,
  PROJECTS,
  SKILLS,
  type Project,
} from "@/content/content";
import { sound } from "@/lib/sound";
import { accent, pulseField, useCountUp, useIsActive, useLock } from "@/lib/ui";

const hair = { borderColor: "hsl(var(--hue, 190) 60% 60% / 0.18)" };

// A clean typographic sheet: label, headline, content. No boxes.
function Sheet({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-scroll
      aria-label={title}
      className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain pr-1 font-mono"
      style={{ scrollbarWidth: "none" }}
    >
      <div
        className="flex items-center gap-3 text-[11px] tracking-[0.3em]"
        style={{ color: accent(68, 0.85) }}
      >
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className="h-px w-8" style={{ background: accent(60, 0.6) }} />
        <span>{title}</span>
      </div>
      <h2 className="mt-4 font-sans text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
        {HEADLINES[index]}
      </h2>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function Cta({
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
      className="pointer-events-auto cursor-pointer px-6 py-3 text-[11px] font-semibold tracking-[0.25em] transition-all hover:-translate-y-0.5"
      style={{
        color: primary ? "#03040a" : accent(72),
        background: primary ? accent(64) : "transparent",
        boxShadow: primary ? "none" : `inset 0 0 0 1px ${accent(60, 0.55)}`,
      }}
    >
      {children}
    </button>
  );
}

export function HomeSheet({ onNavigate }: { onNavigate: (i: number) => void }) {
  const [role, setRole] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRole((r) => (r + 1) % PROFILE.roles.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-start text-left font-mono">
      <h1 className="font-sans text-5xl font-semibold leading-none tracking-tight text-white sm:text-7xl">
        {PROFILE.name}
      </h1>
      <p className="mt-5 text-[11px] tracking-[0.35em]" style={{ color: accent(70, 0.8) }}>
        <span className="mr-3 inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: accent(65) }} />
        {PROFILE.title.toUpperCase()} — {PROFILE.location.toUpperCase()}
      </p>
      <p className="mt-4 h-7 text-sm tracking-[0.3em] text-white sm:text-lg">
        <span style={{ color: accent(62, 0.6) }}>I BUILD </span>
        <span key={role} className="inline-block animate-[rise_0.5s_ease-out]">
          {PROFILE.roles[role]}
        </span>
      </p>
      <div className="mt-9 flex gap-3">
        <Cta primary onClick={() => onNavigate(3)}>
          VIEW WORK
        </Cta>
        <Cta onClick={() => onNavigate(5)}>CONTACT</Cta>
      </div>
      <p className="mt-10 text-[10px] tracking-[0.35em]" style={{ color: accent(60, 0.45) }}>
        CLICK THE GLOWING DIAMONDS · SCROLL · HOLD TO RECOLOR
      </p>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const active = useIsActive(1);
  const n = useCountUp(value, active);
  return (
    <div>
      <div className="font-sans text-4xl font-semibold text-white sm:text-5xl">
        {n}
        <span style={{ color: accent(68) }}>{suffix}</span>
      </div>
      <div className="mt-1 text-[10px] tracking-[0.3em]" style={{ color: accent(60, 0.65) }}>
        {label}
      </div>
    </div>
  );
}

export function BioSheet() {
  return (
    <Sheet index={1} title="BIO">
      <div className="max-w-xl space-y-4 text-sm leading-7 text-slate-300">
        {PROFILE.bio.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        {PROFILE.stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>
      <dl className="mt-8 max-w-xl border-t text-xs" style={hair}>
        {PROFILE.facts.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b py-3" style={hair}>
            <dt className="tracking-[0.3em]" style={{ color: accent(60, 0.65) }}>
              {k}
            </dt>
            <dd className="text-slate-100">{v}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}

export function OpsSheet() {
  const [open, setOpen] = useState(0);
  // a lanyard clicked on the pegboard in the 3D room opens its entry here
  useEffect(() => {
    const onSelect = (e: Event) => setOpen((e as CustomEvent<number>).detail ?? 0);
    window.addEventListener("ops-select", onSelect);
    return () => window.removeEventListener("ops-select", onSelect);
  }, []);
  return (
    <Sheet index={2} title="OPS // EXPERIENCE">
      <ol className="max-w-xl border-t" style={hair}>
        {EXPERIENCE.map((e, i) => {
          const on = open === i;
          return (
            <li key={e.period} className="border-b" style={hair}>
              <button
                onClick={() => {
                  setOpen(i);
                  pulseField();
                }}
                onMouseEnter={() => setOpen(i)}
                className="group w-full cursor-pointer py-4 text-left"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className="font-sans text-lg font-medium transition-colors"
                    style={{ color: on ? "#fff" : "rgb(148 163 184)" }}
                  >
                    {e.role}
                    <span style={{ color: accent(68, on ? 0.95 : 0.5) }}> · {e.org}</span>
                  </span>
                  <span className="shrink-0 text-[10px] tracking-[0.25em]" style={{ color: accent(62, 0.7) }}>
                    {e.period}
                  </span>
                </div>
                <div
                  className={`grid transition-all duration-300 ${
                    on ? "grid-rows-[1fr] pt-2 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <p className="overflow-hidden text-xs leading-6 text-slate-400">{e.note}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}

function ProjectModal({ p, onClose }: { p: Project; onClose: () => void }) {
  useLock(true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={p.name}
    >
      <div
        data-ui
        data-scroll
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-full w-full max-w-xl overflow-y-auto p-7 font-mono sm:p-10"
        style={{
          background: "rgba(3,5,14,0.98)",
          boxShadow: `inset 0 0 0 1px ${accent(60, 0.45)}, 0 0 90px ${accent(50, 0.15)}`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 cursor-pointer text-[11px] tracking-[0.3em]"
          style={{ color: accent(70) }}
        >
          ESC ✕
        </button>
        <div className="text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
          {p.id} · {p.year} · {p.role.toUpperCase()}
        </div>
        <h3 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-white">{p.name}</h3>
        <p className="mt-4 text-sm leading-7 text-slate-300">{p.description}</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-200">
          {p.highlights.map((h) => (
            <li key={h} className="flex gap-3">
              <span style={{ color: accent(68) }}>→</span>
              {h}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2 text-[10px] tracking-widest" style={{ color: accent(75) }}>
          {p.stack.map((t) => (
            <span key={t} className="px-2 py-0.5" style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.4)}` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="mt-8 flex gap-3 text-[11px] font-semibold tracking-[0.25em]">
          {[
            ["LIVE", p.live],
            ["SOURCE", p.repo],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 transition-colors hover:brightness-125"
              style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.6)}` }}
            >
              {label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VaultSheet() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const project = PROJECTS.find((p) => p.id === openId);
  return (
    <>
      <Sheet index={3} title="VAULT // PROJECTS">
        <ul className="max-w-xl border-t" style={hair}>
          {PROJECTS.map((p) => {
            const on = hover === p.id;
            return (
              <li key={p.id} className="border-b" style={hair}>
                <button
                  onClick={() => setOpenId(p.id)}
                  onMouseEnter={() => {
                    setHover(p.id);
                    pulseField();
                  }}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(p.id)}
                  className="group flex w-full cursor-pointer items-start gap-5 py-4 text-left"
                >
                  <span className="pt-1.5 text-[10px] tracking-[0.25em]" style={{ color: accent(62, 0.7) }}>
                    {p.id}
                  </span>
                  <span className="flex-1">
                    <span
                      className="block font-sans text-xl font-medium tracking-tight transition-all"
                      style={{ color: on ? "#fff" : "rgb(203 213 225)", transform: on ? "translateX(6px)" : "none" }}
                    >
                      {p.name}
                    </span>
                    <span
                      className={`grid transition-all duration-300 ${
                        on ? "grid-rows-[1fr] pt-1.5 opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <span className="overflow-hidden text-xs leading-6 text-slate-400">
                        {p.summary}
                        <span className="mt-1.5 block text-[10px] tracking-widest" style={{ color: accent(72, 0.85) }}>
                          {p.stack.join("  ·  ")}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="pt-1.5 text-[10px] tracking-[0.25em]" style={{ color: accent(62, 0.7) }}>
                    {p.year} →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
      {project && <ProjectModal p={project} onClose={() => setOpenId(null)} />}
    </>
  );
}

export function CodexSheet() {
  const groups = Object.keys(SKILLS);
  const [group, setGroup] = useState(groups[0]);
  const active = useIsActive(4);
  return (
    <Sheet index={4} title="CODEX // SKILLS">
      <div className="mb-6 flex gap-5 text-[11px] font-semibold tracking-[0.25em]" role="tablist">
        {groups.map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={g === group}
            onClick={() => {
              setGroup(g);
              pulseField();
            }}
            className="cursor-pointer pb-1 transition-colors"
            style={{
              color: g === group ? "#fff" : accent(62, 0.6),
              borderBottom: `1px solid ${g === group ? accent(66) : "transparent"}`,
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <ul className="max-w-xl space-y-5">
        {SKILLS[group].map(([name, level]) => (
          <li key={`${group}-${name}`}>
            <div className="mb-2 flex justify-between text-[11px] tracking-[0.2em]">
              <span className="text-slate-100">{name}</span>
              <span style={{ color: accent(66, 0.85) }}>{level}</span>
            </div>
            <div className="h-px w-full" style={{ background: accent(55, 0.2) }}>
              <div
                className="h-px origin-left transition-[width] duration-1000 ease-out"
                style={{
                  width: active ? `${level}%` : "0%",
                  background: accent(68),
                  boxShadow: `0 0 8px ${accent(62, 0.9)}`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function UplinkSheet() {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
  };
  const field =
    "w-full border-b bg-transparent py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-white/60";
  return (
    <Sheet index={5} title="UPLINK // CONTACT">
      <button
        onClick={copy}
        className="group cursor-pointer text-left font-sans text-xl font-medium tracking-tight text-white transition-colors hover:text-[color:hsl(var(--hue,190)_100%_72%)] sm:text-2xl"
      >
        {PROFILE.email}
        <span className="ml-3 text-[10px] font-normal tracking-[0.3em]" style={{ color: accent(66, 0.8) }}>
          {copied ? "COPIED ✓" : "COPY"}
        </span>
      </button>
      <form onSubmit={send} className="mt-7 max-w-xl space-y-2">
        <div className="grid gap-x-6 sm:grid-cols-2">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
            style={hair}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={field}
            style={hair}
          />
        </div>
        <textarea
          required
          rows={3}
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${field} resize-none`}
          style={hair}
        />
        <div className="flex items-center gap-5 pt-4">
          <Cta primary onClick={() => {}}>
            TRANSMIT →
          </Cta>
          <span className="text-[10px] tracking-widest text-slate-500">Opens your mail app.</span>
        </div>
      </form>
      <div className="mt-8 flex gap-6 text-[11px] tracking-[0.3em]">
        {PROFILE.links.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.click()}
            className="transition-all hover:[text-shadow:0_0_10px_currentColor]"
            style={{ color: accent(70, 0.85) }}
          >
            {label} ↗
          </a>
        ))}
      </div>
    </Sheet>
  );
}

/* ───────── room intros and the (hidden) text versions of the lounge and gallery ───────── */
export function RoomIntro({
  title,
  tagline,
  actions,
}: {
  title: string;
  tagline: string;
  actions: { label: string; run: () => void; primary?: boolean }[];
}) {
  return (
    <div className="flex flex-col items-start text-left font-mono">
      <p className="text-[11px] tracking-[0.35em]" style={{ color: accent(70, 0.8) }}>
        <span className="mr-3 inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: accent(65) }} />
        YOU ARE IN A NEW ROOM
      </p>
      <h1 className="mt-4 font-sans text-5xl font-semibold leading-none tracking-tight text-white sm:text-7xl">
        {title}
      </h1>
      <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">{tagline}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {actions.map((a) => (
          <Cta key={a.label} primary={a.primary} onClick={a.run}>
            {a.label}
          </Cta>
        ))}
      </div>
    </div>
  );
}

export function LifeSheet() {
  return (
    <Sheet index={7} title="LIFE // AFTER HOURS">
      <ul className="max-w-xl space-y-4 text-sm text-slate-300">
        {INTERESTS.map((i) => (
          <li key={i.name}>
            <strong className="text-white">{i.name}</strong> — {i.blurb} {i.now}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function AwardsSheet() {
  return (
    <Sheet index={9} title="AWARDS // GALLERY">
      <ul className="max-w-xl space-y-4 text-sm text-slate-300">
        {AWARDS.map((a) => (
          <li key={a.title}>
            <strong className="text-white">{a.title}</strong> — {a.org}, {a.year}. {a.note}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function MoviesSheet() {
  return (
    <Sheet index={11} title="REEL // THEATER">
      <ul className="max-w-xl space-y-4 text-sm text-slate-300">
        {MOVIES.map((m) => (
          <li key={m.title}>
            <strong className="text-white">{m.title}</strong> — {m.genre}, {m.year}. {m.blurb}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
