// Small numeric toolkit shared by the plates. Pure functions, no DOM: safe on the server.

/** Deterministic PRNG (mulberry32). Same seed, same figure. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo: number, hi: number) => lo + (hi - lo) * next(),
    int: (n: number) => Math.floor(next() * n),
    normal: () => {
      const u = Math.max(next(), 1e-12);
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
    },
  };
}
export type Rng = ReturnType<typeof rng>;

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
export const fixed = (n: number, d: number) => n.toFixed(d);

/** Polyline of a circle or arc, flat array. */
export function arc(cx: number, cy: number, r: number, a0 = 0, a1 = TAU, n = 96) {
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  return pts;
}

/** Sample y = f(x) on [x0, x1]. */
export function graph(f: (x: number) => number, x0: number, x1: number, n = 160) {
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push(x, f(x));
  }
  return pts;
}

/** Intersection parameter of segment p→p+r with segment q→q+s. Returns [t, u] or null. */
export function segHit(
  px: number, py: number, rx: number, ry: number,
  qx: number, qy: number, sx: number, sy: number,
  eps = 1e-12,
): [number, number] | null {
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < eps) return null;
  const t = ((qx - px) * sy - (qy - py) * sx) / den;
  const u = ((qx - px) * ry - (qy - py) * rx) / den;
  return [t, u];
}

/** Clip the infinite line {x : x·n = c}, n = (cos a, sin a), to a box. Returns two endpoints or null. */
export function lineInBox(a: number, c: number, box: [number, number, number, number]) {
  const [x0, y0, x1, y1] = box;
  const nx = Math.cos(a), ny = Math.sin(a);
  const dx = -ny, dy = nx; // direction along the line
  const px = nx * c, py = ny * c; // closest point to origin
  let tmin = -Infinity, tmax = Infinity;
  const clip = (p: number, d: number, lo: number, hi: number) => {
    if (Math.abs(d) < 1e-12) return p >= lo && p <= hi;
    let t0 = (lo - p) / d, t1 = (hi - p) / d;
    if (t0 > t1) [t0, t1] = [t1, t0];
    tmin = Math.max(tmin, t0);
    tmax = Math.min(tmax, t1);
    return tmin <= tmax;
  };
  if (!clip(px, dx, x0, x1) || !clip(py, dy, y0, y1)) return null;
  return [px + dx * tmin, py + dy * tmin, px + dx * tmax, py + dy * tmax] as const;
}

/** Marching squares: iso-lines of a grid field f[j*nx + i] over [x0,x1]×[y0,y1]. Returns segments. */
export function contours(
  f: Float64Array | number[], nx: number, ny: number,
  x0: number, y0: number, x1: number, y1: number, level: number,
) {
  const segs: number[][] = [];
  const hx = (x1 - x0) / (nx - 1), hy = (y1 - y0) / (ny - 1);
  const v = (i: number, j: number) => f[j * nx + i];
  const interp = (a: number, b: number) => (level - a) / (b - a);
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
      const idx = (a > level ? 1 : 0) | (b > level ? 2 : 0) | (c > level ? 4 : 0) | (d > level ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const X = x0 + i * hx, Y = y0 + j * hy;
      const e = [
        [X + interp(a, b) * hx, Y], // bottom
        [X + hx, Y + interp(b, c) * hy], // right
        [X + interp(d, c) * hx, Y + hy], // top
        [X, Y + interp(a, d) * hy], // left
      ];
      const table: Record<number, number[][]> = {
        1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 2], [0, 1]], 6: [[0, 2]], 7: [[3, 2]],
        8: [[2, 3]], 9: [[0, 2]], 10: [[0, 3], [1, 2]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[0, 3]],
      };
      for (const [p, q] of table[idx]) segs.push([e[p][0], e[p][1], e[q][0], e[q][1]]);
    }
  }
  return segs;
}
