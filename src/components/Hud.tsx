"use client";

import { useEffect, useState } from "react";
import { STATIONS } from "./stations";

const bars = (pct: number, total = 8) =>
  "■".repeat(Math.round((pct / 100) * total)).padEnd(total, "·");

const wander = (v: number, min: number, max: number, step: number) =>
  Math.max(min, Math.min(max, v + (Math.random() - 0.5) * step));

function Panel({
  title,
  align,
  children,
}: {
  title: string;
  align: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-44 text-[10px] leading-5 tracking-widest text-cyan-400/80 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      <div className="mb-1 border-b border-cyan-500/30 pb-1 font-bold text-cyan-300">
        {align === "left" ? "› " : ""}
        {title}
        {align === "right" ? " ‹" : ""}
      </div>
      {children}
    </div>
  );
}

export default function Hud({
  active,
  onNavigate,
}: {
  active: number;
  onNavigate: (i: number) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [stats, setStats] = useState({ cpu: 48, mem: 70, net: 44, ping: 7 });

  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => {
      setNow(new Date());
      setStats((s) => ({
        cpu: wander(s.cpu, 20, 90, 14),
        mem: wander(s.mem, 55, 85, 6),
        net: wander(s.net, 15, 95, 18),
        ping: Math.round(wander(s.ping, 3, 20, 5)),
      }));
    }, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const clock = now
    ? now.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const utc = now ? now.toISOString().slice(0, 19).replace("T", "_") : "";

  return (
    <div className="pointer-events-none fixed inset-0 z-10 font-mono uppercase">
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex h-10 items-center justify-between border-b border-cyan-500/10 px-5">
        <div className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-sm border border-cyan-300 text-xs font-bold text-cyan-300">
          R
        </div>
        <div className="flex items-center gap-4 text-[11px] tracking-widest text-cyan-400/60">
          <div className="pointer-events-auto flex items-center gap-3 text-cyan-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="LinkedIn">
              <path d="M4 3a2 2 0 100 4 2 2 0 000-4zM2 9h4v12H2zM9 9h4v2c.8-1.3 2.2-2.2 4-2.2 3.2 0 4 2.1 4 5V21h-4v-6c0-1.4-.3-2.4-1.8-2.4S13 13.7 13 15v6H9z" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6" aria-label="Dribbble">
              <circle cx="12" cy="12" r="9" />
              <path d="M5 7c5 1 9 0 13-3M3 12c6 0 12 1 15 8M8 20c0-6 3-10 8-12" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="Medium">
              <circle cx="6" cy="12" r="4" />
              <ellipse cx="14" cy="12" rx="2.6" ry="4" />
              <rect x="19" y="8" width="2" height="8" rx="1" />
            </svg>
          </div>
          <span>{clock}</span>
        </div>
      </div>

      {/* timeline */}
      <div className="pointer-events-auto absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-6 border-x border-cyan-500/30 bg-cyan-950/30 px-8 py-2 [clip-path:polygon(0_0,100%_0,94%_100%,6%_100%)]">
        {STATIONS.map((y, i) => (
          <button
            key={y}
            onClick={() => onNavigate(i)}
            className="flex cursor-pointer flex-col items-center gap-1 text-[10px] tracking-widest"
          >
            <span
              className={`h-2 w-2 rotate-45 border ${
                i === active
                  ? "border-cyan-300 bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
                  : "border-cyan-500/50"
              }`}
            />
            <span className={i === active ? "text-cyan-300" : "text-cyan-500/50"}>
              {y}
            </span>
          </button>
        ))}
      </div>

      {/* corners */}
      <div className="absolute left-3 top-14">
        <Panel title="SYS_MONITOR" align="left">
          <div>CPU {stats.cpu.toFixed(0)}%</div>
          <div>{bars(stats.cpu)}</div>
          <div>MEM {stats.mem.toFixed(0)}%</div>
          <div>{bars(stats.mem)}</div>
          <div>NEURAL_LINK::ACTIVE</div>
        </Panel>
      </div>
      <div className="absolute right-3 top-14">
        <Panel title="NET_STATUS" align="right">
          <div>UPLINK {stats.net.toFixed(0)}%</div>
          <div>{bars(stats.net)}</div>
          <div>PING: {stats.ping}MS</div>
          <div>UTC: {utc}</div>
          <div>LAT: 37.7749°N / 122.4194°W</div>
        </Panel>
      </div>
      <div className="absolute bottom-3 left-3">
        <Panel title="SEC_SCAN" align="left">
          <div>THREAT::NONE</div>
          <div>FIREWALL::ENABLED</div>
          <div>SIGNAL {stats.net.toFixed(0)}%</div>
          <div>{bars(stats.net)}</div>
        </Panel>
      </div>
      <div className="absolute bottom-3 right-3">
        <Panel title="NODE_MAP" align="right">
          <div>NODES::12,851 ACTIVE</div>
          <div>BW: {bars(stats.cpu, 4)}</div>
          <div>UPTIME: 10269D 08H 13M</div>
          <div>LAST_SYNC: 0.978S</div>
        </Panel>
      </div>

      {/* radar */}
      <div className="absolute bottom-3 left-1/2 hidden translate-x-[360px] lg:block">
        <div className="relative h-12 w-12 rounded-full border border-cyan-500/40">
          <div className="absolute inset-2 rounded-full border border-cyan-500/25" />
          <div className="absolute inset-0 animate-spin rounded-full [animation-duration:4s] [background:conic-gradient(from_0deg,rgba(34,211,238,0.35),transparent_25%)]" />
          <div className="absolute left-3 top-6 h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
        </div>
      </div>

      {/* bottom nav */}
      <nav className="pointer-events-auto absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-8 border-x border-cyan-500/30 bg-cyan-950/30 px-14 py-4 text-[11px] tracking-[0.25em] [clip-path:polygon(4%_0,96%_0,100%_100%,0_100%)]">
        {STATIONS.map((item, i) => (
          <button
            key={item}
            onClick={() => onNavigate(i)}
            className={`cursor-pointer transition-colors hover:text-cyan-200 hover:[text-shadow:0_0_8px_#22d3ee] ${
              i === active ? "text-cyan-200 [text-shadow:0_0_8px_#22d3ee]" : "text-cyan-400/70"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}
