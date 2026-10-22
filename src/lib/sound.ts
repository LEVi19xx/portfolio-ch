// Tiny WebAudio layer: an ambient drone that follows flight speed plus UI blips.
// Off by default; browsers only allow audio after a user gesture, so enable() is called from a click.

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let droneGain: GainNode | null = null;
let droneFilter: BiquadFilterNode | null = null;
let enabled = false;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let lastKick = -10;

function ensure() {
  if (ctx || typeof window === "undefined") return;
  const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc.type = "sawtooth";
  osc2.type = "sine";
  osc.frequency.value = 55;
  osc2.frequency.value = 82.5;
  droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 220;
  droneGain = ctx.createGain();
  droneGain.gain.value = 0.05;
  osc.connect(droneFilter);
  osc2.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(master);
  osc.start();
  osc2.start();
}

function tone(freq: number, dur: number, vol: number, type: OscillatorType = "sine") {
  if (!enabled || !ctx || !master) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Five tiny synthesized tracks. Each one is a step function called once per 16th note.
const CHORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 196, 246.9]];
const SEVENTHS = [[220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 349.2], [164.8, 207.7, 246.9, 311.1]];
function noise(dur: number, vol: number, hp: number) {
  if (!ctx || !master) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start();
}

function kick(vol = 0.16) {
  tone(110, 0.22, vol);
  tone(55, 0.3, vol * 0.75);
  if (ctx) lastKick = ctx.currentTime;
}

type Track = { name: string; bpm: number; step: (s: number, n: number) => void };

const TRACKS: Track[] = [
  {
    name: "LO-FI",
    bpm: 84,
    step(s, n) {
      const bar = Math.floor(n / 16) % CHORDS.length;
      if (s % 8 === 0) kick();
      if (s % 2 === 1) noise(0.04, 0.05, 6000);
      if (s % 4 === 2) tone(CHORDS[bar][0] / 2, 0.35, 0.07, "triangle");
      if (s === 0) CHORDS[bar].forEach((f) => tone(f, 2.2, 0.025, "sawtooth"));
      if (s % 4 === 0) tone(CHORDS[bar][((n / 4) | 0) % 3] * 2, 0.4, 0.03, "sine");
    },
  },
  {
    name: "SYNTHWAVE",
    bpm: 108,
    step(s, n) {
      const bar = Math.floor(n / 16) % 4;
      const root = [110, 87.3, 98, 82.4][bar];
      const arp = [1, 1.5, 2, 1.5, 1.25, 1.5, 2, 2.5];
      if (s % 4 === 0) kick(0.15);
      if (s % 4 === 2) noise(0.05, 0.05, 7000);
      tone(root * 2 * arp[s % 8], 0.12, 0.028, "sawtooth");
      if (s % 2 === 0) tone(root, 0.14, 0.07, "square");
      if (s === 0) [1, 1.2, 1.5].forEach((m) => tone(root * 2 * m, 1.7, 0.02, "sawtooth"));
    },
  },
  {
    name: "CHILL KEYS",
    bpm: 72,
    step(s, n) {
      const bar = Math.floor(n / 16) % CHORDS.length;
      if (s === 0) CHORDS[bar].forEach((f) => tone(f, 2.8, 0.03, "sine"));
      if (s % 2 === 0) tone(CHORDS[bar][(s / 2) % 3] * 2, 0.55, 0.026, "sine");
      if (s === 0 || s === 10) kick(0.1);
      if (s === 4 || s === 12) noise(0.08, 0.04, 3000);
    },
  },
  {
    name: "JAZZ CAFE",
    bpm: 96,
    step(s, n) {
      const bar = Math.floor(n / 16) % SEVENTHS.length;
      const walk = [0, 1, 2, 1][(s / 4) | 0];
      if ([0, 3, 4, 7, 8, 11, 12, 15].includes(s)) noise(0.05, 0.035, 8000);
      if (s % 4 === 0) tone(SEVENTHS[bar][walk] / 2, 0.3, 0.08, "triangle");
      if (s === 0 || s === 10) SEVENTHS[bar].forEach((f) => tone(f, 0.9, 0.022, "sine"));
      if (s === 0) kick(0.07);
    },
  },
  {
    name: "ARCADE",
    bpm: 128,
    step(s, n) {
      const scale = [261.6, 293.7, 329.6, 392, 440, 523.3];
      if (s % 2 === 0) tone(scale[(n * 3 + ((n >> 3) & 3)) % 6], 0.1, 0.035, "square");
      if (s % 4 === 0) tone(65.4, 0.16, 0.07, "square");
      if (s % 8 === 0) kick(0.12);
      if (s % 2 === 1) noise(0.03, 0.04, 8000);
    },
  },
];
let trackIdx = -1;

function runTrack(i: number) {
  if (musicTimer) clearInterval(musicTimer);
  trackIdx = i;
  const tr = TRACKS[i];
  let n = 0;
  musicTimer = setInterval(() => {
    if (!ctx || !enabled) return;
    tr.step(n % 16, n);
    n++;
  }, 60000 / tr.bpm / 4);
}

export const sound = {
  isEnabled: () => enabled,
  async enable() {
    ensure();
    if (!ctx || !master) return;
    await ctx.resume();
    enabled = true;
    master.gain.setTargetAtTime(0.6, ctx.currentTime, 0.4);
  },
  disable() {
    enabled = false;
    if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  },
  blip() {
    tone(1180, 0.05, 0.04, "square");
  },
  click() {
    tone(620, 0.09, 0.06, "triangle");
  },
  // a tiny meow (rising squeak) or woof (low thump)
  pet(kind: "cat" | "dog") {
    if (kind === "cat") {
      tone(820, 0.12, 0.05, "triangle");
      setTimeout(() => tone(1050, 0.16, 0.045, "triangle"), 90);
    } else {
      tone(170, 0.1, 0.1, "square");
      setTimeout(() => tone(140, 0.12, 0.09, "square"), 130);
    }
  },
  arrive() {
    tone(440, 0.35, 0.07);
    tone(880, 0.5, 0.04);
  },
  isMusicOn: () => trackIdx >= 0,
  musicName: () => (trackIdx >= 0 ? TRACKS[trackIdx].name : ""),
  // 0..1, a pulse that spikes on every kick (the speaker and others ride it)
  beat() {
    return ctx ? Math.exp(-(ctx.currentTime - lastKick) * 7) : 0;
  },
  // off -> track 1 -> track 2 ... -> last track -> off
  async musicNext() {
    await sound.enable();
    const next = trackIdx + 1;
    if (next >= TRACKS.length) {
      sound.musicStop();
      return -1;
    }
    runTrack(next);
    return next;
  },
  musicStop() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    trackIdx = -1;
  },
  // 0..1, how fast the camera is flying
  setSpeed(v: number) {
    if (!enabled || !ctx || !droneFilter || !droneGain) return;
    const t = ctx.currentTime;
    droneFilter.frequency.setTargetAtTime(200 + v * 1800, t, 0.1);
    droneGain.gain.setTargetAtTime(0.05 + v * 0.07, t, 0.1);
  },
};
