// Walking helpers shared by the person and the pets: where to stroll, what is in the way, and a tiny path finder.

export type P2 = [number, number];

export const HUBS: P2[] = [
  [1.0, 2.4], [2.5, 1.2], [2.6, -1.3], [0.9, -1.9], [-0.2, 0.1],
  [-2.3, 0.5], [-2.0, 2.5], [-0.6, 2.3], [1.6, 0.2],
];

// x, z, radius
export const OBSTACLES: [number, number, number][] = [
  [0.4, 0.8, 0.6], // skills pedestal
  [-1.6, -2.2, 0.55], // chair
  [-3.0, -1.7, 0.5], // plant
  [-2.7, 0.95, 0.5], // reading table
  [-2.95, -0.05, 0.4], // dog bed
  [-2.95, -0.85, 0.3], // cat bed
  [-2.3, -0.45, 0.28], // bowls
];

// where the person is right now, so the dog can follow
export const crowd = { walker: { x: 1.2, z: 0.6, still: 0 } }; // still = seconds since the person last moved

// the pets' corner, under the window: beds and bowls
export const BED_DOG: P2 = [-2.95, -0.05];
export const BED_CAT: P2 = [-2.95, -0.85];

export function blocked(a: P2, b: P2, skip: P2[]) {
  for (const [cx, cz, r] of OBSTACLES) {
    if (skip.some((s) => Math.hypot(s[0] - cx, s[1] - cz) < r)) continue;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((cx - a[0]) * dx + (cz - a[1]) * dz) / l2));
    if (Math.hypot(a[0] + dx * t - cx, a[1] + dz * t - cz) < r) return true;
  }
  return false;
}

// shortest walkable route through the hubs (tiny Dijkstra)
export function findPath(from: P2, to: P2): P2[] {
  const nodes = [from, ...HUBS, to];
  const n = nodes.length;
  const dist = Array<number>(n).fill(Infinity);
  const prev = Array<number>(n).fill(-1);
  const done = Array<boolean>(n).fill(false);
  dist[0] = 0;
  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    done[u] = true;
    for (let v = 0; v < n; v++) {
      if (done[v] || blocked(nodes[u], nodes[v], [from, to])) continue;
      const d = dist[u] + Math.hypot(nodes[u][0] - nodes[v][0], nodes[u][1] - nodes[v][1]);
      if (d < dist[v]) {
        dist[v] = d;
        prev[v] = u;
      }
    }
  }
  if (prev[n - 1] < 0) return [to];
  const path: P2[] = [];
  for (let c = n - 1; c > 0; c = prev[c]) path.unshift(nodes[c]);
  return path;
}
