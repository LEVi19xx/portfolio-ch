"use client";

import { useRef, useState } from "react";

// Placeholder content: swap in your real bio, projects, skills and links.

const accent = (l = 60, a = 1) => `hsl(var(--hue, 212) 100% ${l}% / ${a})`;

function Frame({
  index,
  title,
  children,
  wide,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      data-ui
      className={`pointer-events-auto relative w-full ${
        wide ? "max-w-5xl" : "max-w-2xl"
      } p-6 font-mono [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)] sm:p-9`}
      style={{
        background: "linear-gradient(135deg, rgba(3,6,18,0.9), rgba(3,6,18,0.78))",
        boxShadow: `inset 0 0 0 1px ${accent(55, 0.45)}, inset 0 0 60px ${accent(50, 0.08)}`,
      }}
    >
      <div
        className="mb-6 flex items-center gap-3 text-[11px] font-bold tracking-[0.35em]"
        style={{ color: accent(72) }}
      >
        <span style={{ color: accent(60, 0.6) }}>{`${index} //`}</span>
        {title}
        <span className="h-px flex-1" style={{ background: accent(55, 0.35) }} />
      </div>
      {children}
    </section>
  );
}

export function BioPanel() {
  const facts = [
    ["BASE", "Manila, PH"],
    ["FOCUS", "Front-end · Creative dev"],
    ["STACK", "Next.js · TypeScript · Canvas"],
    ["STATUS", "Open to new work"],
  ];
  return (
    <Frame index="02" title="BIO">
      <p className="text-sm leading-7 text-slate-200/90 sm:text-base sm:leading-8">
        I design and build interfaces that feel alive. I care about the
        details that make a site feel like a place instead of a page. Replace
        this paragraph with your own story.
      </p>
      <dl className="mt-7 grid gap-px sm:grid-cols-2" style={{ background: accent(55, 0.2) }}>
        {facts.map(([k, v]) => (
          <div
            key={k}
            className="group bg-[#050a1a]/90 px-4 py-3 transition-colors hover:bg-[#08122c]"
          >
            <dt className="text-[10px] tracking-[0.3em]" style={{ color: accent(60, 0.65) }}>
              {k}
            </dt>
            <dd className="mt-1 text-sm text-slate-100 transition-transform group-hover:translate-x-1">
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </Frame>
  );
}

function TiltCard({
  n,
  name,
  desc,
  tags,
}: {
  n: string;
  name: string;
  desc: string;
  tags: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(8px)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className="relative cursor-pointer p-5 transition-transform duration-150 ease-out"
      style={{
        boxShadow: `inset 0 0 0 1px ${accent(55, 0.35)}`,
        background: `radial-gradient(circle at var(--mx,50%) var(--my,50%), ${accent(55, 0.22)}, transparent 60%), rgba(5,10,26,0.7)`,
      }}
    >
      <div className="text-[10px] tracking-[0.3em]" style={{ color: accent(60, 0.6) }}>
        {n}
      </div>
      <h3 className="mt-2 text-lg font-bold tracking-wider text-slate-50">{name}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-300/85">{desc}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="px-2 py-0.5 text-[10px] tracking-widest"
            style={{ color: accent(75), boxShadow: `inset 0 0 0 1px ${accent(55, 0.4)}` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function VaultPanel() {
  return (
    <Frame index="03" title="VAULT" wide>
      <div className="grid gap-4 md:grid-cols-3">
        <TiltCard
          n="PROJECT_01"
          name="NEON TRANSIT"
          desc="Placeholder project. Describe what it does and the result it achieved."
          tags={["NEXT.JS", "CANVAS"]}
        />
        <TiltCard
          n="PROJECT_02"
          name="SIGNAL DESK"
          desc="Placeholder project. A dashboard with real-time data and fast interactions."
          tags={["REACT", "TS"]}
        />
        <TiltCard
          n="PROJECT_03"
          name="ORBIT UI"
          desc="Placeholder project. A component library with motion built in."
          tags={["TAILWIND", "A11Y"]}
        />
      </div>
      <p className="mt-5 text-[10px] tracking-[0.3em]" style={{ color: accent(60, 0.55) }}>
        HOVER A CARD — IT TILTS TOWARD YOU
      </p>
    </Frame>
  );
}

const SKILLS: [string, number][] = [
  ["TYPESCRIPT", 90],
  ["REACT / NEXT.JS", 92],
  ["CANVAS / WEBGL", 75],
  ["TAILWIND / CSS", 94],
  ["NODE.JS", 70],
  ["FIGMA", 65],
];

export function CodexPanel() {
  return (
    <Frame index="04" title="CODEX">
      <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {SKILLS.map(([name, level]) => (
          <li key={name} className="group">
            <div className="mb-1.5 flex justify-between text-[11px] tracking-[0.2em]">
              <span className="text-slate-100">{name}</span>
              <span style={{ color: accent(65, 0.8) }}>{level}%</span>
            </div>
            <div className="h-1 w-full" style={{ background: accent(50, 0.15) }}>
              <div
                className="h-full origin-left transition-[filter,transform] duration-300 group-hover:scale-y-[2.5] group-hover:brightness-150"
                style={{
                  width: `${level}%`,
                  background: `linear-gradient(90deg, ${accent(45)}, ${accent(75)})`,
                  boxShadow: `0 0 10px ${accent(60, 0.7)}`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function UplinkPanel() {
  const email = "you@example.com";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };
  return (
    <Frame index="05" title="UPLINK">
      <p className="text-sm leading-7 text-slate-200/90">
        Got a project, a role, or just an idea? Open a channel.
      </p>
      <button
        onClick={copy}
        className="group mt-6 flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.55)}`, background: accent(50, 0.07) }}
      >
        <span className="text-base tracking-widest text-slate-50 sm:text-lg">{email}</span>
        <span className="text-[10px] font-bold tracking-[0.3em]" style={{ color: accent(72) }}>
          {copied ? "COPIED ✓" : "TRANSMIT ▸ COPY"}
        </span>
      </button>
      <div className="mt-6 flex gap-6 text-[11px] tracking-[0.3em]">
        {[
          ["GITHUB", "https://github.com/LEVi19xx"],
          ["LINKEDIN", "#"],
          ["DRIBBBLE", "#"],
        ].map(([label, href]) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all hover:[text-shadow:0_0_10px_currentColor]"
            style={{ color: accent(70, 0.85) }}
          >
            {label} ↗
          </a>
        ))}
      </div>
    </Frame>
  );
}
