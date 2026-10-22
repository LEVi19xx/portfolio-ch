"use client";

import { useSyncExternalStore } from "react";

export type FlowerType =
  | "rose"
  | "tulip"
  | "daisy"
  | "sunflower"
  | "lily"
  | "peony"
  | "lavender"
  | "hydrangea"
  | "carnation"
  | "orchid";
export const FLOWER_TYPES: FlowerType[] = [
  "rose", "tulip", "daisy", "sunflower", "lily", "peony", "lavender", "hydrangea", "carnation", "orchid",
];

// what each flower says, for the chalkboard
export const FLOWER_INFO: Record<FlowerType, { name: string; meaning: string }> = {
  rose: { name: "ROSE", meaning: "Love and appreciation" },
  tulip: { name: "TULIP", meaning: "Perfect love, a fresh start" },
  daisy: { name: "DAISY", meaning: "Innocence and cheer" },
  sunflower: { name: "SUNFLOWER", meaning: "Loyalty and warmth" },
  lily: { name: "LILY", meaning: "Devotion and renewal" },
  peony: { name: "PEONY", meaning: "Good fortune and romance" },
  lavender: { name: "LAVENDER", meaning: "Calm and devotion" },
  hydrangea: { name: "HYDRANGEA", meaning: "Gratitude and heartfelt thanks" },
  carnation: { name: "CARNATION", meaning: "Admiration and fascination" },
  orchid: { name: "ORCHID", meaning: "Luxury, strength and beauty" },
};

export const COLORS = [
  { name: "RED", hex: "#e0314b" },
  { name: "PINK", hex: "#ff8fb1" },
  { name: "WHITE", hex: "#f6f2ea" },
  { name: "YELLOW", hex: "#ffd84a" },
  { name: "PURPLE", hex: "#9b6bff" },
  { name: "ORANGE", hex: "#ff8a3d" },
  { name: "BLUE", hex: "#5aa9ff" },
  { name: "LILAC", hex: "#c9a7ff" },
  { name: "PEACH", hex: "#ffb88a" },
  { name: "CORAL", hex: "#ff6f61" },
  { name: "BURGUNDY", hex: "#8c1d40" },
];
export const WRAPS = [
  { name: "KRAFT", hex: "#c9a574" },
  { name: "BLUSH", hex: "#f4c6d0" },
  { name: "MINT", hex: "#a8dcc8" },
  { name: "NAVY", hex: "#26324f" },
  { name: "CREAM", hex: "#f1e8d4" },
  { name: "LILAC", hex: "#d9c8f2" },
  { name: "NOIR", hex: "#25252d" },
];
export const RIBBONS = [
  { name: "RED", hex: "#d62839" },
  { name: "GOLD", hex: "#d4af37" },
  { name: "WHITE", hex: "#ffffff" },
  { name: "BLACK", hex: "#17171d" },
  { name: "TEAL", hex: "#2ec4b6" },
  { name: "PINK", hex: "#ff8fb1" },
  { name: "PURPLE", hex: "#7b4bd6" },
];
export const CONTAINERS = [
  { id: "wrap", name: "PAPER WRAP" },
  { id: "basket", name: "BASKET" },
  { id: "vase", name: "GLASS VASE" },
] as const;
export type Container = (typeof CONTAINERS)[number]["id"];

export const CARD_STYLES = [
  { id: "cream", name: "CREAM", bg: "#f6efdf", ink: "#3a2f45", edge: "#d9c7a0" },
  { id: "blush", name: "BLUSH", bg: "#fbd9e1", ink: "#5a2a3d", edge: "#f1a9bd" },
  { id: "navy", name: "NAVY", bg: "#26324f", ink: "#f3e9d0", edge: "#d4af37" },
  { id: "mint", name: "MINT", bg: "#d8f1e6", ink: "#1f4a3c", edge: "#8cccb2" },
] as const;
export type CardStyle = (typeof CARD_STYLES)[number]["id"];

export const OCCASIONS = [
  { name: "BIRTHDAY", text: "Happy birthday! I hope your day blooms with joy." },
  { name: "THANK YOU", text: "Thank you for everything. You make a real difference." },
  { name: "LOVE", text: "You are the reason my days feel brighter." },
  { name: "GET WELL", text: "Thinking of you. Get well soon, and rest up." },
  { name: "CONGRATS", text: "Congratulations! You earned every bit of this." },
];

export const DELIVERY_SPEEDS = [
  { id: "standard", name: "STANDARD", note: "arrives in 2-3 days" },
  { id: "express", name: "EXPRESS", note: "same day" },
  { id: "pickup", name: "PICK-UP", note: "collect at the shop" },
] as const;
export type DeliverySpeed = (typeof DELIVERY_SPEEDS)[number]["id"];

export const MAX_FLOWERS = 15;
export const MESSAGE_MAX = 240;

export type Stem = { type: FlowerType; color: string };
export type Card = { style: CardStyle; to: string; from: string; message: string };
export type Delivery = { speed: DeliverySpeed; address: string; date: string };
export type BouquetState = {
  flowers: Stem[];
  wrap: string;
  ribbon: string;
  container: Container;
  pickType: FlowerType;
  pickColor: string;
  card: Card;
  delivery: Delivery;
  orderedAt: number; // when the last order was placed (ms), 0 = never
};

let state: BouquetState = {
  flowers: [
    { type: "rose", color: "#e0314b" },
    { type: "tulip", color: "#ff8fb1" },
    { type: "daisy", color: "#f6f2ea" },
    { type: "rose", color: "#ff8fb1" },
    { type: "sunflower", color: "#ffd84a" },
  ],
  wrap: "#f4c6d0",
  ribbon: "#d4af37",
  container: "wrap",
  pickType: "rose",
  pickColor: "#e0314b",
  card: { style: "cream", to: "", from: "", message: "" },
  delivery: { speed: "standard", address: "", date: "" },
  orderedAt: 0,
};
const listeners = new Set<() => void>();
const set = (patch: Partial<BouquetState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const nameOf = (hex: string, list: { name: string; hex: string }[]) =>
  (list.find((c) => c.hex === hex)?.name ?? "CUSTOM").toLowerCase();

export const bouquet = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  pickType: (pickType: FlowerType) => set({ pickType }),
  pickColor: (pickColor: string) => set({ pickColor }),
  // clicking a bunch in the shop starts a bouquet with that flower
  pick: (pickType: FlowerType, pickColor: string) => set({ pickType, pickColor }),
  add: () => {
    if (state.flowers.length >= MAX_FLOWERS) return;
    set({ flowers: [...state.flowers, { type: state.pickType, color: state.pickColor }] });
  },
  remove: (i: number) => set({ flowers: state.flowers.filter((_, n) => n !== i) }),
  clear: () => set({ flowers: [] }),
  randomize: () => {
    const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    const n = 6 + Math.floor(Math.random() * 7);
    set({
      flowers: Array.from({ length: n }, () => ({ type: rnd(FLOWER_TYPES), color: rnd(COLORS).hex })),
      wrap: rnd(WRAPS).hex,
      ribbon: rnd(RIBBONS).hex,
    });
  },
  setWrap: (wrap: string) => set({ wrap }),
  setRibbon: (ribbon: string) => set({ ribbon }),
  setContainer: (container: Container) => set({ container }),
  setCard: (patch: Partial<Card>) => set({ card: { ...state.card, ...patch } }),
  setDelivery: (patch: Partial<Delivery>) => set({ delivery: { ...state.delivery, ...patch } }),
  order: () => set({ orderedAt: Date.now() }),
  describe: () => {
    const counts = new Map<string, number>();
    state.flowers.forEach((f) => {
      const k = nameOf(f.color, COLORS) + " " + f.type;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    const parts = [...counts].map(([k, n]) => n + " " + k + (n > 1 ? "s" : ""));
    const where =
      state.container === "wrap"
        ? "wrapped in " + nameOf(state.wrap, WRAPS) + " paper"
        : state.container === "basket"
          ? "in a basket"
          : "in a glass vase";
    return (
      (parts.length ? parts.join(", ") : "an empty bouquet") +
      ", " +
      where +
      " with a " +
      nameOf(state.ribbon, RIBBONS) +
      " ribbon"
    );
  },
  // the whole order, written out for an email
  order_text: () => {
    const { card, delivery } = state;
    const speed = DELIVERY_SPEEDS.find((s) => s.id === delivery.speed);
    return [
      "BOUQUET ORDER",
      "",
      "Bouquet: " + bouquet.describe() + ".",
      "",
      "GIFT CARD (" + card.style + ")",
      "To: " + (card.to || "-"),
      "From: " + (card.from || "-"),
      "Message: " + (card.message || "-"),
      "",
      "DELIVERY",
      "Option: " + (speed ? speed.name + " (" + speed.note + ")" : "-"),
      "Address: " + (delivery.address || "-"),
      "Date: " + (delivery.date || "-"),
    ].join("\n");
  },
};

export const useBouquet = () => useSyncExternalStore(bouquet.subscribe, bouquet.get, bouquet.get);
