// The easel's canvas. The paint panel draws on it and the easel in the atelier shows the very same pixels.
export const PAINT_W = 640;
export const PAINT_H = 480;

export const PAINT_COLORS = [
  { name: "INK", hex: "#17171d" },
  { name: "WHITE", hex: "#fdfaf2" },
  { name: "RED", hex: "#e0314b" },
  { name: "ORANGE", hex: "#ff8a3d" },
  { name: "YELLOW", hex: "#ffd84a" },
  { name: "GREEN", hex: "#3fbf7f" },
  { name: "SKY", hex: "#5aa9ff" },
  { name: "VIOLET", hex: "#9b6bff" },
  { name: "PINK", hex: "#ff8fb1" },
];
export const BRUSHES = [4, 10, 22];

let canvas: HTMLCanvasElement | null = null;
const listeners = new Set<() => void>();
const poke = () => listeners.forEach((l) => l());

function blank(c: CanvasRenderingContext2D) {
  c.fillStyle = "#f4efe3";
  c.fillRect(0, 0, PAINT_W, PAINT_H);
  // a tiny starter sketch so the easel is not empty
  const sky = c.createLinearGradient(0, 0, 0, PAINT_H * 0.65);
  sky.addColorStop(0, "#ffb88a");
  sky.addColorStop(1, "#ffe6c9");
  c.fillStyle = sky;
  c.fillRect(40, 40, PAINT_W - 80, PAINT_H * 0.6);
  c.fillStyle = "#ff7a59";
  c.beginPath();
  c.arc(PAINT_W * 0.62, PAINT_H * 0.42, 52, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#5b4b8a";
  c.beginPath();
  c.moveTo(40, PAINT_H * 0.62);
  c.lineTo(PAINT_W * 0.3, PAINT_H * 0.34);
  c.lineTo(PAINT_W * 0.52, PAINT_H * 0.56);
  c.lineTo(PAINT_W * 0.72, PAINT_H * 0.4);
  c.lineTo(PAINT_W - 40, PAINT_H * 0.62);
  c.closePath();
  c.fill();
  c.fillStyle = "#3a2f5c";
  c.fillRect(40, PAINT_H * 0.62, PAINT_W - 80, PAINT_H * 0.3);
}

export const paint = {
  canvas(): HTMLCanvasElement {
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = PAINT_W;
      canvas.height = PAINT_H;
      const c = canvas.getContext("2d");
      if (c) blank(c);
    }
    return canvas;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  line(x0: number, y0: number, x1: number, y1: number, color: string, size: number) {
    const c = this.canvas().getContext("2d");
    if (!c) return;
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = size;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    if (x0 === x1 && y0 === y1) {
      c.beginPath();
      c.arc(x0, y0, size / 2, 0, Math.PI * 2);
      c.fill();
    }
    poke();
  },
  clear() {
    const c = this.canvas().getContext("2d");
    if (!c) return;
    c.fillStyle = "#f4efe3";
    c.fillRect(0, 0, PAINT_W, PAINT_H);
    poke();
  },
  png(): string {
    return this.canvas().toDataURL("image/png");
  },
};
