import * as THREE from "three";

export function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (ctx) draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function plankTexture() {
  const tex = canvasTexture(1024, 1024, (c, w, h) => {
    c.fillStyle = "#241d1b";
    c.fillRect(0, 0, w, h);
    const rows = 12;
    for (let r = 0; r < rows; r++) {
      const y = (r / rows) * h;
      let x = -((r * 173) % 256);
      while (x < w) {
        const len = 200 + ((r * 97 + x * 31) % 160);
        const tone = 30 + ((r * 53 + x * 17) % 14);
        c.fillStyle = `hsl(18 18% ${tone}%)`;
        c.fillRect(x + 1.5, y + 1.5, len - 3, h / rows - 3);
        x += len;
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.4, 2.4);
  return tex;
}

export function skyTexture() {
  return canvasTexture(16, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    // sphere uv: top of the canvas is the zenith, bottom is straight down
    g.addColorStop(0, "#0b0a22");
    g.addColorStop(0.3, "#1d1745");
    g.addColorStop(0.46, "#6a3f78");
    g.addColorStop(0.52, "#e48a60");
    g.addColorStop(0.58, "#4a2f5e");
    g.addColorStop(0.72, "#14102a");
    g.addColorStop(1, "#07080d");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}

export function skyDayTexture() {
  return canvasTexture(16, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#3f7fd0");
    g.addColorStop(0.35, "#8fbaf0");
    g.addColorStop(0.52, "#e6f0ff");
    g.addColorStop(0.6, "#b9d2f2");
    g.addColorStop(1, "#a9c6ee");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}

export function cardTexture(role: string, org: string, period: string, hue: number) {
  return canvasTexture(256, 340, (c, w, h) => {
    c.fillStyle = "#f3f5fa";
    c.fillRect(0, 0, w, h);
    c.fillStyle = `hsl(${hue} 80% 52%)`;
    c.fillRect(0, 0, w, 62);
    c.fillStyle = "#fff";
    c.font = "700 20px ui-monospace, monospace";
    c.fillText(org.toUpperCase().slice(0, 16), 16, 38);
    c.fillStyle = "#cfd5e3";
    c.fillRect(88, 92, 80, 80);
    c.fillStyle = "#9aa3b8";
    c.beginPath();
    c.arc(128, 122, 16, 0, Math.PI * 2);
    c.fill();
    c.fillRect(104, 146, 48, 22);
    c.fillStyle = "#10131c";
    c.font = "700 21px system-ui, sans-serif";
    c.fillText(role.slice(0, 20), 16, 214);
    c.fillStyle = "#5b6479";
    c.font = "500 16px ui-monospace, monospace";
    c.fillText(period, 16, 240);
    for (let i = 0; i < 38; i++) {
      c.fillStyle = "#10131c";
      c.fillRect(16 + i * 6, 276, 1 + ((i * 7) % 3), 40);
    }
  });
}

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (c.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

// The big, readable face of an ID badge once you pick it
export function badgeDetailTexture(
  role: string,
  org: string,
  period: string,
  note: string,
  hue: number,
  hint: string,
) {
  return canvasTexture(512, 680, (c, w, h) => {
    c.fillStyle = "#f3f5fa";
    c.fillRect(0, 0, w, h);
    c.fillStyle = `hsl(${hue} 80% 52%)`;
    c.fillRect(0, 0, w, 112);
    c.fillStyle = "#fff";
    c.font = "700 34px ui-monospace, Consolas, monospace";
    c.fillText(org.toUpperCase().slice(0, 18), 32, 68);
    c.fillStyle = "#10131c";
    c.font = "800 44px system-ui, Segoe UI, sans-serif";
    let y = 190;
    wrap(c, role, w - 64).forEach((l) => {
      c.fillText(l, 32, y);
      y += 52;
    });
    c.fillStyle = `hsl(${hue} 70% 40%)`;
    c.font = "600 24px ui-monospace, Consolas, monospace";
    c.fillText(period, 32, y + 6);
    c.fillStyle = "#d6dbe8";
    c.fillRect(32, y + 28, w - 64, 3);
    c.fillStyle = "#3c4458";
    c.font = "400 26px system-ui, Segoe UI, sans-serif";
    y += 78;
    wrap(c, note, w - 64).forEach((l) => {
      c.fillText(l, 32, y);
      y += 36;
    });
    for (let i = 0; i < 44; i++) {
      c.fillStyle = "#10131c";
      c.fillRect(32 + i * 10, h - 118, 1 + ((i * 7) % 4), 52);
    }
    c.fillStyle = "#7c86a3";
    c.font = "500 17px ui-monospace, Consolas, monospace";
    c.fillText(hint, 32, h - 28);
  });
}

// Small drawn logos for the skills core. Everything is vector-drawn here, no image files.
export function techLogo(name: "react" | "typescript" | "next" | "node" | "tailwind" | "figma") {
  return canvasTexture(256, 256, (c, w, h) => {
    c.translate(w / 2, h / 2);
    const tile = (col: string) => {
      c.fillStyle = col;
      c.beginPath();
      c.roundRect(-116, -116, 232, 232, 52);
      c.fill();
    };
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (name === "react") {
      tile("#20232a");
      c.strokeStyle = "#61dafb";
      c.lineWidth = 10;
      for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
        c.save();
        c.rotate(a);
        c.beginPath();
        c.ellipse(0, 0, 82, 31, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      c.fillStyle = "#61dafb";
      c.beginPath();
      c.arc(0, 0, 14, 0, Math.PI * 2);
      c.fill();
    } else if (name === "typescript") {
      tile("#3178c6");
      c.fillStyle = "#fff";
      c.font = "800 118px system-ui, sans-serif";
      c.fillText("TS", 4, 8);
    } else if (name === "next") {
      tile("#000");
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(0, 0, 88, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#000";
      c.font = "800 108px system-ui, sans-serif";
      c.fillText("N", -2, 6);
    } else if (name === "node") {
      tile("#16221a");
      c.fillStyle = "#539e43";
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        c.lineTo(Math.cos(a) * 94, Math.sin(a) * 94);
      }
      c.closePath();
      c.fill();
      c.fillStyle = "#fff";
      c.font = "800 52px system-ui, sans-serif";
      c.fillText("node", 0, 4);
    } else if (name === "tailwind") {
      tile("#0f172a");
      c.fillStyle = "#38bdf8";
      for (const dy of [-26, 26]) {
        c.beginPath();
        c.moveTo(-86, dy + 4);
        c.bezierCurveTo(-70, dy - 40, -40, dy - 40, -18, dy - 14);
        c.bezierCurveTo(4, dy + 12, 26, dy + 12, 42, dy - 6);
        c.bezierCurveTo(48, dy - 12, 60, dy - 26, 86, dy - 22);
        c.bezierCurveTo(70, dy + 22, 40, dy + 22, 18, dy + 2);
        c.bezierCurveTo(-4, dy - 20, -26, dy - 20, -42, dy - 2);
        c.bezierCurveTo(-50, dy + 8, -60, dy + 18, -86, dy + 4);
        c.closePath();
        c.fill();
      }
    } else {
      tile("#1e1e1e");
      c.translate(0, 12);
      const R = 24;
      c.fillStyle = "#f24e1e";
      c.beginPath();
      c.roundRect(-48, -84, 48, 48, [R, 0, 0, R]);
      c.fill();
      c.fillStyle = "#ff7262";
      c.beginPath();
      c.roundRect(0, -84, 48, 48, [0, R, R, 0]);
      c.fill();
      c.fillStyle = "#a259ff";
      c.beginPath();
      c.roundRect(-48, -36, 48, 48, [R, 0, 0, R]);
      c.fill();
      c.fillStyle = "#1abcfe";
      c.beginPath();
      c.arc(24, -12, R, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#0acf83";
      c.beginPath();
      c.roundRect(-48, 12, 48, 48, [R, 0, R, R]);
      c.fill();
    }
  });
}
