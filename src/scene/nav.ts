// The whole house as one world. Six rooms sit in a 3x2 grid with hallways between them;
// the people and pets walk between rooms through real doorways and along the halls.
//
//        c=2        c=1        c=0          (x goes more negative to the left)
//  r=1   STUDIO ──  LOUNGE ──  GALLERY
//                                 │ (door in the theater's back wall)
//  r=0   FLOWERS ── MUSIC ───  THEATER
import type { RoomId } from "../components/stations";

export type P2 = [number, number];

export const SPACING = 10.2; // 7.2 for a room plus a 3 wide hallway between rooms
const GRID: Record<RoomId, [number, number]> = {
  studio: [2, 1],
  lounge: [1, 1],
  gallery: [0, 1],
  theater: [0, 0],
  music: [1, 0],
  flowers: [2, 0],
  atelier: [-1, 1], // east of the gallery
};
export const ROOM_IDS = Object.keys(GRID) as RoomId[];
export const ROOM_ORIGIN = Object.fromEntries(
  ROOM_IDS.map((id) => [id, [-GRID[id][0] * SPACING, 0, -GRID[id][1] * SPACING]]),
) as Record<RoomId, [number, number, number]>;

// local room coordinates -> world
export const W = (room: RoomId, p: P2): P2 => [ROOM_ORIGIN[room][0] + p[0], ROOM_ORIGIN[room][2] + p[1]];

type Obstacle = [number, number, number]; // x, z, radius
type RoomNav = { hubs: P2[]; obstacles: Obstacle[] };

// Places to stroll between, and things in the way, in each room's own coordinates.
const LOCAL: Record<RoomId, RoomNav> = {
  studio: {
    hubs: [
      [1.0, 2.4], [2.5, 1.2], [2.6, -1.3], [0.9, -1.9], [-0.2, 0.1],
      [-2.3, 0.5], [-2.0, 2.5], [-0.6, 2.3], [1.6, 0.2],
      [3.0, 0.2], // where the lounge door comes in
    ],
    obstacles: [
      [0.4, 0.8, 0.6], // skills pedestal
      [-1.6, -2.2, 0.55], // chair
      [-3.0, -1.7, 0.5], // plant
      [-2.7, 0.95, 0.5], // reading table
      [-2.95, -0.05, 0.4], // dog bed
      [-2.95, -0.85, 0.3], // cat bed
      [-2.3, -0.45, 0.28], // bowls
    ],
  },
  lounge: {
    hubs: [
      [2.3, 1.2], [2.3, -1.2], [0.3, -1.3], [-1.4, -0.4], [-2.2, 1.0], [-1.7, -2.0],
      [-2.8, 0.2], // inside the door that leads to the studio
      [3.0, 0.0], // where the gallery door comes in
    ],
    obstacles: [
      [-0.5, 1.95, 0.75], [1.1, 1.95, 0.75], // sofa
      [0.2, 0.35, 0.65], // coffee table
      [-2.85, -2.75, 0.3], // lamp
      [-3.27, 2.55, 0.3], // guitar
      [2.85, -2.85, 0.45], [-2.8, -1.45, 0.4], // plants
    ],
  },
  gallery: {
    hubs: [
      [1.0, -0.8], [-0.8, 0.2], [-0.5, 2.6], [1.6, 2.6], [1.8, -0.4],
      [-2.8, 0.0], // inside the door that leads to the lounge
      [2.8, 3.0], // where the theater's back door comes in
      [3.0, 0.0], // where the atelier door comes in (east wall)
    ],
    obstacles: [
      [0.2, 0.7, 0.55], // trophy pedestal
      [2.6, -1.9, 0.8], // photobooth
      [-2.2, 1.9, 0.45], [-1.7, 1.9, 0.45], [-1.2, 1.9, 0.45], // bench
    ],
  },
  theater: {
    hubs: [
      [-0.2, -1.2], [-0.2, 0.5], [-0.2, 1.7], [-0.2, 2.9], [-2.2, -1.2], [1.7, -1.2], [2.8, 0.4],
      [-3.0, 0.1], // inside the door that leads to the music room
      [2.8, -2.9], // inside the back door that leads to the gallery
    ],
    obstacles: [
      ...[-0.1, 1.1, 2.3].flatMap((z) =>
        [-2.35, -1.8, -1.25, 0.85, 1.4, 1.95].map((x): Obstacle => [x, z, 0.38]),
      ),
      [-2.9, -2.75, 0.5], // popcorn
    ],
  },
  music: {
    hubs: [
      [1.2, 1.0], [-0.4, -0.2], [-2.4, 0.9], [2.4, -1.5], [0.4, 2.6], [-0.5, 1.4],
      [-2.9, -1.0], // inside the door that leads to the flower shop
      [3.0, 0.1], // where the theater door comes in
    ],
    obstacles: [
      [-0.2, -2.85, 0.5], [0.4, -2.85, 0.5], [1.0, -2.85, 0.5], // keyboard stand
      [-0.85, -3.1, 0.35], [1.65, -3.1, 0.35], // speakers
      [-2.2, -2.4, 0.95], // drums
      [-1.7, 2.2, 0.8], // DJ table
      [-3.1, 2.5, 0.4], // amp
    ],
  },
  flowers: {
    hubs: [
      [2.2, 0.6], [2.2, 2.2], [0.5, -1.4], [-0.9, 1.0], [-1.6, 2.4], [0.3, 2.4],
      [3.0, -1.0], // where the music room door comes in
    ],
    obstacles: [
      [0.3, 0.5, 0.7], // workbench
      ...Array.from({ length: 10 }, (_, i): Obstacle => [-2.75, -3.06 + i * 0.68, 0.28]), // buckets
      [1.25, 2.6, 0.7], // display table
      [2.9, 0.9, 0.4], // delivery box
      [2.9, 2.2, 0.4], [-1.1, 3.1, 0.4], // plants
      [-1.9, 3.05, 0.3], // watering can
    ],
  },
  atelier: {
    hubs: [
      [-0.2, 1.4], [1.8, 0.6], [-2.3, 1.8], [0.6, -0.8], [0.5, 2.6],
      [-2.8, 0.0], // inside the door that leads to the gallery
    ],
    obstacles: [
      [-1.5, -1.9, 0.6], // easel
      [-0.5, -0.9, 0.28], // stool
      [-3.0, -2.6, 0.5], // paint cart
      [1.4, -3.0, 0.5], [2.4, -3.0, 0.5], // writing desk
      [1.9, -2.2, 0.35], // desk chair
      [3.0, 1.2, 0.4], [-3.0, 2.9, 0.4], // plants
    ],
  },
};



export const hubsOf = (room: RoomId): P2[] => LOCAL[room].hubs.map((h) => W(room, h));
const obstaclesOf = (room: RoomId): Obstacle[] =>
  LOCAL[room].obstacles.map(([x, z, r]): Obstacle => [ROOM_ORIGIN[room][0] + x, ROOM_ORIGIN[room][2] + z, r]);

// The doorways: which wall, where, and which room it opens into.
type Door = { room: RoomId; wall: "W" | "N"; at: number; interior: P2; to: RoomId; entry: P2 };
export const DOORS: Door[] = [
  { room: "lounge", wall: "W", at: 0.2, interior: [-2.8, 0.2], to: "studio", entry: [3.0, 0.2] },
  { room: "gallery", wall: "W", at: 0.0, interior: [-2.8, 0.0], to: "lounge", entry: [3.0, 0.0] },
  { room: "theater", wall: "N", at: 2.8, interior: [2.8, -2.9], to: "gallery", entry: [2.8, 3.0] },
  { room: "theater", wall: "W", at: 0.1, interior: [-3.0, 0.1], to: "music", entry: [3.0, 0.1] },
  { room: "music", wall: "W", at: -1.0, interior: [-2.9, -1.0], to: "flowers", entry: [3.0, -1.0] },
  { room: "atelier", wall: "W", at: 0.0, interior: [-2.8, 0.0], to: "gallery", entry: [3.0, 0.0] },
];

// where the person is right now, so the dog can follow
export const crowd = { walker: { x: W("studio", [1.2, 0.6])[0], z: W("studio", [1.2, 0.6])[1], still: 0 } };

// the pets' corner (studio), beds and bowls, in world coordinates
export const BED_DOG: P2 = W("studio", [-2.95, -0.05]);
export const BED_CAT: P2 = W("studio", [-2.95, -0.85]);
export const BOWL_STAND: P2 = W("studio", [-2.05, -0.45]);
export const BOWL_LOOK: P2 = W("studio", [-2.35, -0.45]);

function blockedIn(room: RoomId, a: P2, b: P2, skip: P2[]) {
  for (const [cx, cz, r] of obstaclesOf(room)) {
    if (skip.some((s) => Math.hypot(s[0] - cx, s[1] - cz) < r)) continue;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((cx - a[0]) * dx + (cz - a[1]) * dz) / l2));
    if (Math.hypot(a[0] + dx * t - cx, a[1] + dz * t - cz) < r) return true;
  }
  return false;
}

export function roomAt(p: P2): RoomId | null {
  for (const id of ROOM_IDS) {
    const [ox, , oz] = ROOM_ORIGIN[id];
    if (Math.abs(p[0] - ox) <= 3.6 && Math.abs(p[1] - oz) <= 3.6) return id;
  }
  return null;
}

// ───── the graph, built once ─────
type GNode = { p: P2; room: RoomId | null; adj: { to: number; d: number }[] };
const nodes: GNode[] = [];
const roomNodes = Object.fromEntries(ROOM_IDS.map((id) => [id, [] as number[]])) as Record<RoomId, number[]>;
const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const link = (a: number, b: number) => {
  const d = dist(nodes[a].p, nodes[b].p);
  nodes[a].adj.push({ to: b, d });
  nodes[b].adj.push({ to: a, d });
};
const findNode = (p: P2) => nodes.findIndex((n) => dist(n.p, p) < 0.01);

for (const id of ROOM_IDS) {
  for (const h of hubsOf(id)) {
    nodes.push({ p: h, room: id, adj: [] });
    roomNodes[id].push(nodes.length - 1);
  }
  const ns = roomNodes[id];
  for (let i = 0; i < ns.length; i++)
    for (let j = i + 1; j < ns.length; j++)
      if (!blockedIn(id, nodes[ns[i]].p, nodes[ns[j]].p, [nodes[ns[i]].p, nodes[ns[j]].p])) link(ns[i], ns[j]);
}
// hallway nodes: through the door, across the hallway, into the neighbouring room
const hallway: number[] = [];
for (const d of DOORS) {
  const doorP = W(d.room, d.wall === "W" ? [-3.6, d.at] : [d.at, -3.6]);
  const entry = W(d.to, d.entry);
  const mid: P2 = [(doorP[0] + entry[0]) / 2, (doorP[1] + entry[1]) / 2];
  const interior = findNode(W(d.room, d.interior));
  const entryIdx = findNode(entry);
  nodes.push({ p: doorP, room: null, adj: [] });
  const doorIdx = nodes.length - 1;
  nodes.push({ p: mid, room: null, adj: [] });
  const midIdx = nodes.length - 1;
  hallway.push(doorIdx, midIdx);
  link(interior, doorIdx);
  link(doorIdx, midIdx);
  link(midIdx, entryIdx);
}

// shortest walkable route through the house between two world points (tiny Dijkstra)
export function findPath(from: P2, to: P2): P2[] {
  const n = nodes.length;
  const A = n; // temp start
  const B = n + 1; // temp end
  const extra: { to: number; d: number }[][] = [[], []];
  const attach = (p: P2, id: number) => {
    const room = roomAt(p);
    const slot = id - n;
    if (room) {
      const ok = roomNodes[room].filter((i) => !blockedIn(room, p, nodes[i].p, [p, nodes[i].p]));
      const pool = ok.length ? ok : roomNodes[room];
      for (const i of pool) {
        const d = dist(p, nodes[i].p);
        extra[slot].push({ to: i, d });
        (id === A ? attachBack.A : attachBack.B).push({ i, d });
      }
    } else {
      // in a hallway: hook onto the nearest hallway and door nodes
      const near = [...hallway]
        .map((i) => ({ i, d: dist(p, nodes[i].p) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      for (const { i, d } of near) {
        extra[slot].push({ to: i, d });
        (id === A ? attachBack.A : attachBack.B).push({ i, d });
      }
    }
  };
  const attachBack = { A: [] as { i: number; d: number }[], B: [] as { i: number; d: number }[] };
  attach(from, A);
  attach(to, B);

  // same room, straight line: just go there
  const rf = roomAt(from);
  if (rf && rf === roomAt(to) && !blockedIn(rf, from, to, [from, to])) return [to];

  const d = Array<number>(n + 2).fill(Infinity);
  const prev = Array<number>(n + 2).fill(-1);
  const done = Array<boolean>(n + 2).fill(false);
  d[A] = 0;
  const edgesOf = (u: number) => {
    if (u === A) return extra[0];
    if (u === B) return [];
    const list = [...nodes[u].adj];
    for (const { i, d: dd } of attachBack.B) if (i === u) list.push({ to: B, d: dd });
    for (const { i, d: dd } of attachBack.A) if (i === u) list.push({ to: A, d: dd });
    return list;
  };
  for (let k = 0; k < n + 2; k++) {
    let u = -1;
    for (let i = 0; i < n + 2; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0 || d[u] === Infinity) break;
    done[u] = true;
    if (u === B) break;
    for (const e of edgesOf(u)) {
      if (done[e.to]) continue;
      const nd = d[u] + e.d;
      if (nd < d[e.to]) {
        d[e.to] = nd;
        prev[e.to] = u;
      }
    }
  }
  if (prev[B] < 0) return [to];
  const path: P2[] = [to];
  for (let c = prev[B]; c !== A && c >= 0; c = prev[c]) path.unshift(nodes[c].p);
  return path;
}

export const pathLength = (from: P2, path: P2[]) => {
  let len = 0;
  let cur = from;
  for (const p of path) {
    len += dist(cur, p);
    cur = p;
  }
  return len;
};

// ───── playing as the character ─────
// Explore mode: the person drives, the camera sits in her head (or just behind it), and E sits her down.
export const control = {
  active: false,
  fp: false, // first person, or a camera behind her
  zoom: 2.6, // how far behind her the camera sits (wheel / + -)
  map: false, // bird's-eye view of the whole house
  yaw: 0, // where she faces (0 = +z), radians; turning left raises it
  pitch: 0,
  seat: -1, // section she is sitting at, -1 = standing
  room: "studio" as RoomId,
  keys: new Set<string>(),
  joy: { x: 0, y: 0 }, // touch stick, -1..1
};

const allObstacles: Obstacle[] = ROOM_IDS.flatMap((id) => obstaclesOf(id));
const INNER = 3.3;
const inRoomBox = (x: number, z: number) =>
  ROOM_IDS.some((id) => {
    const [ox, , oz] = ROOM_ORIGIN[id];
    return Math.abs(x - ox) <= INNER && Math.abs(z - oz) <= INNER;
  });
// a doorway: the gap in the wall, from one room's floor to the next
const corridors = DOORS.map((d) => {
  const [ox, , oz] = ROOM_ORIGIN[d.room];
  const gap = SPACING - 2 * INNER;
  return d.wall === "W"
    ? { x0: ox - INNER - gap, x1: ox - INNER, z0: oz + d.at - 0.5, z1: oz + d.at + 0.5 }
    : { x0: ox + d.at - 0.5, x1: ox + d.at + 0.5, z0: oz - INNER - gap, z1: oz - INNER };
});
// the hallway strips: two vertical ones between the columns and one horizontal one between the rows
const HM = 3.6 + 0.3; // wall face + a margin
const hallStrips = [
  ...[0, 1].map((c) => ({ x0: -(c + 1) * SPACING + HM, x1: -c * SPACING - HM, z0: -SPACING - INNER, z1: INNER })),
  { x0: -2 * SPACING - INNER, x1: SPACING - HM, z0: -SPACING + HM, z1: -HM },
  // the short hall to the atelier, east of the gallery and theater
  { x0: HM, x1: SPACING - HM, z0: -SPACING - INNER, z1: -HM },
];
export const walkable = (x: number, z: number) =>
  inRoomBox(x, z) ||
  hallStrips.some((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) ||
  corridors.some((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1);

// move from (x,z) by (dx,dz): slide along walls and around furniture
export function stepTo(x: number, z: number, dx: number, dz: number): P2 {
  let nx = x + dx;
  let nz = z + dz;
  if (!walkable(nx, nz)) {
    if (walkable(x + dx, z)) nz = z;
    else if (walkable(x, z + dz)) nx = x;
    else {
      nx = x;
      nz = z;
    }
  }
  for (const [cx, cz, r] of allObstacles) {
    const ex = nx - cx;
    const ez = nz - cz;
    const d = Math.hypot(ex, ez);
    const min = r + 0.16;
    if (d < min && d > 1e-4) {
      const px = cx + (ex / d) * min;
      const pz = cz + (ez / d) * min;
      if (walkable(px, pz)) {
        nx = px;
        nz = pz;
      } else {
        nx = x;
        nz = z;
      }
    }
  }
  return [nx, nz];
}
