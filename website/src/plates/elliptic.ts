// Locality and global information in elliptic solvers (Zenodo 23484455).
// The Dirichlet Laplacian on a 24 × 24 interior grid (5-point stencil, zero on the boundary square).
// Its Green's function is exact from the sine expansion G(p, q) = Σ φ_kl(p) φ_kl(q)/λ_kl, evaluated
// separably as S C Sᵀ with C_kl = s_k(i_p) s_l(j_p)/λ_kl: two 24 × 24 products per point, well under a
// millisecond. Pencil contours of G(p, ·) show how the solution at p depends on every input value; the
// ink box is the local window of radius w = 3. The check sums G(p, ·) inside and outside the window:
// at every grid point but the four corners (49.1% there) most of the influence lies outside, which is
// the paper's point that local information is not enough. p walks a slow loop that avoids the corners.
import { contours } from './kit';
import type { Painter } from './painter';
import type { Dot, PlateDef, Stroke } from './types';

const n = 24, W = 3, F = n + 2; // F × F field including the zero boundary
const S = new Float64Array(n * n); // S[i n + k] = s_k(i) = √(2/(n+1)) sin(kπi/(n+1))
const LAM = new Float64Array(n * n); // λ_kl = 4 − 2cos(kπ/(n+1)) − 2cos(lπ/(n+1))
for (let a = 0; a < n; a++) {
  for (let b = 0; b < n; b++) {
    S[a * n + b] = Math.sqrt(2 / (n + 1)) * Math.sin(((a + 1) * (b + 1) * Math.PI) / (n + 1));
    LAM[a * n + b] = 4 - 2 * Math.cos(((a + 1) * Math.PI) / (n + 1)) - 2 * Math.cos(((b + 1) * Math.PI) / (n + 1));
  }
}
const LEVELS = [0.03, 0.07, 0.12, 0.18, 0.26, 0.36, 0.5];

// A slow figure-eight through the grid, a grid point every 3 cells of arc length; never a corner point.
const PATH: [number, number][] = [];
const eight = (a: number) => [12.5 + 9.5 * Math.sin(a), 12.5 + 8 * Math.sin(2 * a + 0.6)];
for (let i = 1, s = 0, next = 0, [x, y] = eight(0); i <= 4000; i++) {
  const [u, v] = eight((2 * Math.PI * i) / 4000);
  s += Math.hypot(u - x, v - y);
  x = u; y = v;
  if (s < next) continue;
  next += 3;
  const q: [number, number] = [Math.round(x), Math.round(y)], last = PATH[PATH.length - 1];
  if (!last || last[0] !== q[0] || last[1] !== q[1]) PATH.push(q);
}

const C = new Float64Array(n * n), T = new Float64Array(n * n);
/** G(p, ·) into f[j F + i] (plate point (i, j), boundary zeros); returns the share outside the window. */
function green(ip: number, jp: number, f: Float64Array) {
  for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) C[k * n + l] = (S[(ip - 1) * n + k] * S[(jp - 1) * n + l]) / LAM[k * n + l];
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let l = 0; l < n; l++) s += C[k * n + l] * S[j * n + l];
      T[k * n + j] = s;
    }
  }
  let all = 0, near = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += S[i * n + k] * T[k * n + j];
      f[(j + 1) * F + i + 1] = s;
      all += s;
      if (Math.abs(i + 1 - ip) <= W && Math.abs(j + 1 - jp) <= W) near += s;
    }
  }
  return 1 - near / all;
}

/** Join marching-squares segments into loops and round their corners (one Chaikin pass). */
function loops(segs: number[][]) {
  const key = (x: number, y: number) => `${Math.round(x * 1e5)},${Math.round(y * 1e5)}`;
  const ends = new Map<string, number[]>();
  segs.forEach((s, i) => {
    for (const k of [key(s[0], s[1]), key(s[2], s[3])]) { const e = ends.get(k); if (e) e.push(i); else ends.set(k, [i]); }
  });
  const used = new Uint8Array(segs.length), out: { pts: number[]; closed: boolean }[] = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    let pts = segs[i].slice();
    for (;;) {
      const k = key(pts[pts.length - 2], pts[pts.length - 1]);
      const j = (ends.get(k) ?? []).find((m) => !used[m]);
      if (j === undefined) break;
      used[j] = 1;
      const s = segs[j];
      if (key(s[0], s[1]) === k) pts.push(s[2], s[3]); else pts.push(s[0], s[1]);
    }
    const closed = key(pts[0], pts[1]) === key(pts[pts.length - 2], pts[pts.length - 1]);
    if (closed) {
      pts.length -= 2;
      for (let pass = 0; pass < 1; pass++) {
        const m = pts.length / 2, q: number[] = [];
        for (let a = 0; a < m; a++) {
          const b = (a + 1) % m;
          q.push(0.75 * pts[2 * a] + 0.25 * pts[2 * b], 0.75 * pts[2 * a + 1] + 0.25 * pts[2 * b + 1], 0.25 * pts[2 * a] + 0.75 * pts[2 * b], 0.25 * pts[2 * a + 1] + 0.75 * pts[2 * b + 1]);
        }
        pts = q;
      }
    }
    out.push({ pts, closed });
  }
  return out;
}

// For drawing only: Catmull-Rom upsampling ×3 of the lattice values (odd reflection at the walls, as
// the sine series continues), so the contours are smooth. The check reads the lattice values themselves.
const U = 3, FU = (F - 1) * U + 1;
const rows = new Float64Array(F * FU), fine = new Float64Array(FU * FU);
const cr = (a: number, b: number, c: number, d: number, t: number) =>
  b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
const odd = (g: (i: number) => number, i: number) => (i < 0 ? -g(-i) : i > F - 1 ? -g(2 * (F - 1) - i) : g(i));
function upsample(f: Float64Array) {
  for (let j = 0; j < F; j++) {
    const g = (i: number) => f[j * F + i];
    for (let m = 0; m < FU; m++) {
      const i = Math.min(F - 2, Math.floor(m / U)), t = m / U - i;
      rows[j * FU + m] = cr(odd(g, i - 1), g(i), g(i + 1), odd(g, i + 2), t);
    }
  }
  for (let m = 0; m < FU; m++) {
    const g = (j: number) => rows[j * FU + m];
    for (let q = 0; q < FU; q++) {
      const j = Math.min(F - 2, Math.floor(q / U)), t = q / U - j;
      fine[q * FU + m] = cr(odd(g, j - 1), g(j), g(j + 1), odd(g, j + 2), t);
    }
  }
  return fine;
}

type Field = { ip: number; jp: number; share: number; lines: { pts: number[]; closed: boolean }[] };
const field = new Float64Array(F * F);
const solve = ([ip, jp]: [number, number]): Field => {
  const share = green(ip, jp, field), f = upsample(field);
  return { ip, jp, share, lines: LEVELS.flatMap((v) => loops(contours(f, FU, FU, 0, 0, F - 1, F - 1, v))) };
};
const box = (i: number, j: number) => [Math.max(0.5, i - W - 0.5), Math.max(0.5, j - W - 0.5), Math.min(n + 0.5, i + W + 0.5), Math.min(n + 0.5, j + W + 0.5)];

const plate: PlateDef = {
  id: 'elliptic',
  bounds: [-1.4, -1.4, 26.4, 26.4],
  check: 'Most influence lies outside the window',
  create() {
    let k = 0, hold = 0, glide = 1;
    let cur = solve(PATH[0]), prev = cur;
    const strokes: Stroke[] = [{ pts: [0, 0, n + 1, 0, n + 1, n + 1, 0, n + 1, 0, 0], tone: 'draft', at: 0 }];
    cur.lines.forEach((l, i) => strokes.push({ pts: l.pts, tone: 'draft', closed: l.closed, at: 0.15 + (i / cur.lines.length) * 0.3, transient: true }));
    const [b0, b1, b2, b3] = box(cur.ip, cur.jp);
    strokes.push({ pts: [b0, b1, b2, b1, b2, b3, b0, b3, b0, b1], tone: 'ink', w: 1.2, at: 0.5, transient: true });
    const dots: Dot[] = [];
    for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) dots.push({ x: i, y: j, r: 0.75, tone: 'ghost', square: true });
    dots.push({ x: cur.ip, y: cur.jp, r: 3.2, tone: 'ink', transient: true });
    const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

    return {
      scene: { strokes, dots },
      update(dt) {
        glide = Math.min(1, glide + dt / 0.9);
        hold += dt;
        if (hold > 2.2) { hold = 0; glide = 0; k = (k + 1) % PATH.length; prev = cur; cur = solve(PATH[k]); }
      },
      draw(p: Painter, _t, inked) {
        const e = ease(glide);
        for (const l of prev.lines) if (e < 1) p.poly(l.pts, 'draft', { closed: l.closed, alpha: 1 - e });
        for (const l of cur.lines) p.poly(l.pts, 'draft', { closed: l.closed, alpha: e });
        const x = prev.ip + (cur.ip - prev.ip) * e, y = prev.jp + (cur.jp - prev.jp) * e;
        const [x0, y0, x1, y1] = box(x, y);
        for (let i = Math.ceil(x0); i <= x1; i++) for (let j = Math.ceil(y0); j <= y1; j++) p.dot(i, j, 1.1, 'draft', { square: true });
        if (inked < 1) { p.rect(x0, y0, x1, y1, 'draft', { w: 1.2, alpha: 1 - inked }); p.dot(x, y, 3.2, 'draft', { hollow: true, alpha: 1 - inked }); }
        if (inked > 0) { p.rect(x0, y0, x1, y1, 'ink', { w: 1.2, alpha: inked }); p.dot(x, y, 3.2, 'ink', { alpha: inked }); }
        p.text(x + 0.55, y + 0.75, 'p', 'draft', { math: true, size: 13 });
      },
      readings: () => [
        { label: 'Point p', value: `(${cur.ip}, ${cur.jp})` },
        { label: 'Outside the window', value: `${(100 * cur.share).toFixed(1)}%`, done: cur.share > 0.5 },
      ],
      settle() {
        glide = 1;
        prev = cur;
      },
    };
  },
};

export default plate;
