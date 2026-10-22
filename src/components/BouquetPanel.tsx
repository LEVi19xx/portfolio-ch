"use client";

import { useState } from "react";
import { PROFILE } from "@/content/content";
import {
  bouquet,
  CARD_STYLES,
  COLORS,
  CONTAINERS,
  DELIVERY_SPEEDS,
  FLOWER_INFO,
  FLOWER_TYPES,
  MAX_FLOWERS,
  MESSAGE_MAX,
  OCCASIONS,
  RIBBONS,
  useBouquet,
  WRAPS,
} from "@/lib/bouquet";
import { sound } from "@/lib/sound";
import { accent } from "@/lib/ui";

const hair = { borderColor: "hsl(var(--hue, 190) 60% 60% / 0.18)" };

function Swatches({
  list,
  value,
  onPick,
  label,
}: {
  list: { name: string; hex: string }[];
  value: string;
  onPick: (hex: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {list.map((c) => {
        const on = c.hex === value;
        return (
          <button
            key={c.hex}
            role="radio"
            aria-checked={on}
            aria-label={c.name}
            title={c.name}
            onClick={() => {
              sound.click();
              onPick(c.hex);
            }}
            className="h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110"
            style={{
              background: c.hex,
              boxShadow: on ? `0 0 0 2px #07080d, 0 0 0 4px ${accent(70)}` : "inset 0 0 0 1px rgba(255,255,255,0.25)",
            }}
          />
        );
      })}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-5 text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
      {children}
    </div>
  );
}

const pill = "cursor-pointer px-3 py-2 text-[11px] font-semibold tracking-[0.2em] transition-colors";
const field =
  "mt-1 block w-full rounded-md bg-white/5 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none placeholder:text-slate-500";
const fieldStyle = { boxShadow: `inset 0 0 0 1px ${accent(55, 0.35)}` };

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

const TABS = ["FLOWERS", "WRAP", "CARD", "DELIVERY"] as const;

// The bouquet shop: build the bouquet, choose how it is wrapped, write the gift card and set up the delivery.
// Everything you change shows up on the workbench in the shop.
export default function BouquetPanel() {
  const b = useBouquet();
  const [tab, setTab] = useState<(typeof TABS)[number]>("FLOWERS");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const full = b.flowers.length >= MAX_FLOWERS;
  const info = FLOWER_INFO[b.pickType];
  const ready = b.flowers.length > 0 && b.card.to.trim() !== "" && b.delivery.address.trim() !== "";

  const placeOrder = () => {
    sound.click();
    bouquet.order();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    const subject = encodeURIComponent("Bouquet order for " + (b.card.to || "a friend"));
    window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${encodeURIComponent(bouquet.order_text())}`;
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bouquet.order_text());
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
      aria-label="Bouquet shop"
      className="pointer-events-auto max-h-full w-full overflow-y-auto overscroll-contain pr-1 font-mono"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex items-center gap-3 text-[11px] tracking-[0.3em]" style={{ color: accent(68, 0.85) }}>
        <span>16</span>
        <span className="h-px w-8" style={{ background: accent(60, 0.6) }} />
        <span>BOUQUET</span>
      </div>
      <h2 className="mt-4 font-sans text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl">
        Build a bouquet.
      </h2>
      <p className="mt-3 max-w-md text-xs leading-6 text-slate-400">
        Pick the flowers, choose how it is wrapped, write a card and set the delivery. The table in the shop changes as you go.
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Steps">
        {TABS.map((t, i) => (
          <Chip key={t} on={tab === t} onClick={() => setTab(t)}>
            {i + 1} {t}
          </Chip>
        ))}
      </div>

      {tab === "FLOWERS" && (
        <>
          <Label>FLOWER</Label>
          <div className="flex flex-wrap gap-1.5">
            {FLOWER_TYPES.map((t) => (
              <Chip key={t} on={b.pickType === t} onClick={() => bouquet.pickType(t)}>
                {t.toUpperCase()}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            {info.name}: {info.meaning}
          </p>

          <Label>COLOR</Label>
          <Swatches list={COLORS} value={b.pickColor} onPick={bouquet.pickColor} label="Flower color" />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sound.click();
                bouquet.add();
              }}
              disabled={full}
              className={pill + " disabled:cursor-not-allowed disabled:opacity-40"}
              style={{ color: "#05070d", background: accent(64) }}
            >
              + ADD {b.pickType.toUpperCase()}
            </button>
            <span className="text-[10px] tracking-[0.2em] text-slate-500">
              {b.flowers.length} / {MAX_FLOWERS}
            </span>
          </div>

          {b.flowers.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {b.flowers.map((f, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      sound.click();
                      bouquet.remove(i);
                    }}
                    className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[10px] tracking-[0.15em] text-slate-200 transition-colors hover:text-white"
                    style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
                    aria-label={"Remove " + f.type}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                    {f.type.toUpperCase()}
                    <span className="text-slate-500">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex gap-2 border-t pt-5" style={hair}>
            <button
              onClick={() => {
                sound.click();
                bouquet.randomize();
              }}
              className={pill}
              style={{ color: accent(72), boxShadow: `inset 0 0 0 1px ${accent(55, 0.5)}` }}
            >
              ✦ SURPRISE ME
            </button>
            <button
              onClick={() => {
                sound.click();
                bouquet.clear();
              }}
              className={pill}
              style={{ color: "rgb(148 163 184)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}
            >
              CLEAR
            </button>
          </div>
          <p className="mt-3 text-[10px] leading-5 tracking-wider text-slate-500">
            Tip: click a bucket or a vase in the shop, ring the bell, tip the watering can, or grow a seed in the pot on the counter.
          </p>
        </>
      )}

      {tab === "WRAP" && (
        <>
          <Label>HOLDER</Label>
          <div className="flex flex-wrap gap-1.5">
            {CONTAINERS.map((c) => (
              <Chip key={c.id} on={b.container === c.id} onClick={() => bouquet.setContainer(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            {b.container === "wrap" && (
              <div>
                <Label>WRAP</Label>
                <Swatches list={WRAPS} value={b.wrap} onPick={bouquet.setWrap} label="Wrapping paper" />
              </div>
            )}
            <div>
              <Label>RIBBON</Label>
              <Swatches list={RIBBONS} value={b.ribbon} onPick={bouquet.setRibbon} label="Ribbon" />
            </div>
          </div>
        </>
      )}

      {tab === "CARD" && (
        <>
          <Label>OCCASION</Label>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS.map((o) => (
              <Chip key={o.name} on={b.card.message === o.text} onClick={() => bouquet.setCard({ message: o.text })}>
                {o.name}
              </Chip>
            ))}
          </div>

          <Label>CARD STYLE</Label>
          <div className="flex flex-wrap gap-2">
            {CARD_STYLES.map((s) => (
              <button
                key={s.id}
                aria-label={s.name}
                title={s.name}
                onClick={() => {
                  sound.click();
                  bouquet.setCard({ style: s.id });
                }}
                className="h-9 w-7 cursor-pointer transition-transform hover:scale-110"
                style={{
                  background: s.bg,
                  boxShadow: b.card.style === s.id ? `0 0 0 2px #07080d, 0 0 0 4px ${accent(70)}` : `inset 0 0 0 2px ${s.edge}`,
                }}
              />
            ))}
          </div>

          <label className="mt-4 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
            TO
            <input
              value={b.card.to}
              onChange={(e) => bouquet.setCard({ to: e.target.value.slice(0, 40) })}
              placeholder="Who is it for?"
              className={field}
              style={fieldStyle}
            />
          </label>
          <label className="mt-3 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
            MESSAGE
            <textarea
              value={b.card.message}
              onChange={(e) => bouquet.setCard({ message: e.target.value.slice(0, MESSAGE_MAX) })}
              rows={5}
              placeholder="Write a few words for the card..."
              className={field + " resize-none leading-6"}
              style={fieldStyle}
            />
          </label>
          <p className="mt-1 text-right text-[10px] tracking-[0.2em] text-slate-500">
            {b.card.message.length} / {MESSAGE_MAX}
          </p>
          <label className="mt-1 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
            FROM
            <input
              value={b.card.from}
              onChange={(e) => bouquet.setCard({ from: e.target.value.slice(0, 40) })}
              placeholder="Your name"
              className={field}
              style={fieldStyle}
            />
          </label>
        </>
      )}

      {tab === "DELIVERY" && (
        <>
          <Label>HOW</Label>
          <div className="flex flex-wrap gap-1.5">
            {DELIVERY_SPEEDS.map((d) => (
              <Chip key={d.id} on={b.delivery.speed === d.id} onClick={() => bouquet.setDelivery({ speed: d.id })}>
                {d.name}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {DELIVERY_SPEEDS.find((d) => d.id === b.delivery.speed)?.note}
          </p>

          <label className="mt-4 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
            DELIVER TO (ADDRESS)
            <textarea
              value={b.delivery.address}
              onChange={(e) => bouquet.setDelivery({ address: e.target.value.slice(0, 200) })}
              rows={3}
              placeholder="Street, city..."
              className={field + " resize-none leading-6"}
              style={fieldStyle}
            />
          </label>
          <label className="mt-3 block text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
            DATE
            <input
              type="date"
              value={b.delivery.date}
              onChange={(e) => bouquet.setDelivery({ date: e.target.value })}
              className={field}
              style={fieldStyle}
            />
          </label>

          <div className="mt-5 rounded-md p-3 text-[11px] leading-5 text-slate-300" style={{ boxShadow: `inset 0 0 0 1px ${accent(55, 0.3)}` }}>
            <div className="text-[10px] tracking-[0.3em]" style={{ color: accent(62, 0.75) }}>
              ORDER SUMMARY
            </div>
            <p className="mt-1">{bouquet.describe()}.</p>
            <p className="mt-1 text-slate-400">
              Card for {b.card.to || "..."}, from {b.card.from || "..."}.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 pb-2">
            <button
              onClick={placeOrder}
              disabled={!ready}
              className={pill + " disabled:cursor-not-allowed disabled:opacity-40"}
              style={{ color: "#05070d", background: accent(64) }}
            >
              {sent ? "ORDER SENT ✓" : "PLACE ORDER →"}
            </button>
            <button onClick={copy} className="cursor-pointer text-[11px] tracking-[0.2em]" style={{ color: accent(72) }}>
              {copied ? "COPIED ✓" : "COPY ORDER"}
            </button>
          </div>
          <p className="pb-2 text-[10px] leading-5 tracking-wider text-slate-500">
            {ready
              ? "Opens your mail app with the whole order written out, and the box in the shop closes."
              : "Add at least one flower, who the card is for, and an address to place the order."}
          </p>
        </>
      )}
    </section>
  );
}
