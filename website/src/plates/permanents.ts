// Galois groups and real critical points of constrained permanents (Zenodo 23484570).
// The 3 × 3 matrices with row sums r = (1, 1.3, 0.7) and column sums s = (0.9, 1.2, 0.9), charted by
// x = (a₁₁, a₁₂, a₂₁, a₂₂) as in the paper's (9) and seen through one fixed projection of x-space; the
// transportation polytope (every entry ≥ 0) is the pencil wireframe. Newton's method on the gradient of
// per(A) (four quadratics; the Hessian is linear in x) runs from seeded random nonnegative matrices,
// with steps capped at length 1. A point is kept only when the gradient norm is below 1e-12 (deduped
// within 1e-7) and is marked by its Morse index, the inertia of the Hessian. The real gradient has
// topological degree four, so a nondegenerate fiber has at least four real critical points: the check
// passes at four. (Offline: this fiber has 16 distinct complex points, 14 real, N₀ − N₁ + N₂ = 1 − 5 + 8 = 4.)
import { rng, fmt, clamp } from './kit';
import { lengths, type Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const R = [1, 1.3, 0.7], S = [0.9, 1.2, 0.9];
// Entry u = 3i + j of A(x) is C0[u] + Σₖ E[k][u]·xₖ.
const C0 = [0, 0, R[0], 0, 0, R[1], S[0], S[1], R[2] - S[0] - S[1]];
const E = [
  [1, 0, -1, 0, 0, 0, -1, 0, 1],
  [0, 1, -1, 0, 0, 0, 0, -1, 1],
  [0, 0, 0, 1, 0, -1, -1, 0, 1],
  [0, 0, 0, 0, 1, -1, 0, -1, 1],
];
// ∂²per/∂a_ij∂a_kl is the complementary entry a_mn (i ≠ k, j ≠ l), so H_pq = Σ_w K[p,q,w]·a_w.
const K = new Float64Array(144);
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) for (let l = 0; l < 3; l++) {
  if (i === k || j === l) continue;
  for (let p = 0; p < 4; p++) for (let q = 0; q < 4; q++) K[(p * 4 + q) * 9 + 3 * (3 - i - k) + 3 - j - l] += E[p][3 * i + j] * E[q][3 * k + l];
}
const A = (x: number[], a: number[]) => { for (let u = 0; u < 9; u++) a[u] = C0[u] + E[0][u] * x[0] + E[1][u] * x[1] + E[2][u] * x[2] + E[3][u] * x[3]; return a; };
const a9 = new Array(9).fill(0), c9 = new Array(9).fill(0), g4 = [0, 0, 0, 0], H16 = new Array(16).fill(0), M = new Array(20).fill(0);
function grad(x: number[], g = g4) {
  const a = A(x, a9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const i1 = 3 * ((i + 1) % 3), i2 = 3 * ((i + 2) % 3), j1 = (j + 1) % 3, j2 = (j + 2) % 3;
    c9[3 * i + j] = a[i1 + j1] * a[i2 + j2] + a[i1 + j2] * a[i2 + j1]; // permanent of the minor
  }
  for (let k = 0; k < 4; k++) { let t = 0; for (let u = 0; u < 9; u++) t += E[k][u] * c9[u]; g[k] = t; }
  return g;
}
function hess(x: number[], H = H16) {
  const a = A(x, a9);
  for (let pq = 0; pq < 16; pq++) { let t = 0; for (let w = 0; w < 9; w++) t += K[pq * 9 + w] * a[w]; H[pq] = t; }
  return H;
}
/** Solve H d = g (4 × 4, partial pivoting); false if singular. */
function solve(H: number[], g: number[], d: number[]) {
  for (let i = 0; i < 4; i++) { for (let j = 0; j < 4; j++) M[i * 5 + j] = H[i * 4 + j]; M[i * 5 + 4] = g[i]; }
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let i = c + 1; i < 4; i++) if (Math.abs(M[i * 5 + c]) > Math.abs(M[p * 5 + c])) p = i;
    if (Math.abs(M[p * 5 + c]) < 1e-14) return false;
    for (let j = 0; j < 5; j++) { const t = M[c * 5 + j]; M[c * 5 + j] = M[p * 5 + j]; M[p * 5 + j] = t; }
    for (let i = c + 1; i < 4; i++) { const f = M[i * 5 + c] / M[c * 5 + c]; for (let j = c; j < 5; j++) M[i * 5 + j] -= f * M[c * 5 + j]; }
  }
  for (let i = 3; i >= 0; i--) { let t = M[i * 5 + 4]; for (let j = i + 1; j < 4; j++) t -= M[i * 5 + j] * d[j]; d[i] = t / M[i * 5 + i]; }
  return true;
}
/** Morse index: negative eigenvalues of the symmetric Hessian (cyclic Jacobi). */
function morse(H: number[]) {
  const a = H.slice();
  for (let sweep = 0; sweep < 40; sweep++) {
    let off = 0;
    for (let p = 0; p < 4; p++) for (let q = p + 1; q < 4; q++) off += a[p * 4 + q] ** 2;
    if (off < 1e-26) break;
    for (let p = 0; p < 4; p++) for (let q = p + 1; q < 4; q++) {
      const apq = a[p * 4 + q];
      if (Math.abs(apq) < 1e-300) continue;
      const th = (a[q * 5] - a[p * 5]) / (2 * apq);
      const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 4; k++) { const kp = a[k * 4 + p], kq = a[k * 4 + q]; a[k * 4 + p] = c * kp - s * kq; a[k * 4 + q] = s * kp + c * kq; }
      for (let k = 0; k < 4; k++) { const pk = a[p * 4 + k], qk = a[q * 4 + k]; a[p * 4 + k] = c * pk - s * qk; a[q * 4 + k] = s * pk + c * qk; }
    }
  }
  return (a[0] < 0 ? 1 : 0) + (a[5] < 0 ? 1 : 0) + (a[10] < 0 ? 1 : 0) + (a[15] < 0 ? 1 : 0);
}

// A fixed projection of x-space to the plate, chosen offline to separate the critical points.
const F = [[-0.2929, -0.9065, 0.119, 0.2799], [0.0776, -0.2938, -0.788, -0.5354]];
const PX = (x: number[]) => F[0][0] * x[0] + F[0][1] * x[1] + F[0][2] * x[2] + F[0][3] * x[3] + 0.2702;
const PY = (x: number[]) => F[1][0] * x[0] + F[1][1] * x[1] + F[1][2] * x[2] + F[1][3] * x[3] + 0.666;

/** Transportation polytope: vertices have four tight entries; edges share three. */
function polytope() {
  const verts: { x: number[]; tight: number[] }[] = [];
  const d = [0, 0, 0, 0], Hs = new Array(16).fill(0), gs = [0, 0, 0, 0], a = new Array(9).fill(0);
  for (let m = 0; m < 512; m++) {
    const T = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((u) => (m >> u) & 1);
    if (T.length !== 4) continue;
    T.forEach((u, i) => { for (let k = 0; k < 4; k++) Hs[i * 4 + k] = E[k][u]; gs[i] = -C0[u]; });
    if (!solve(Hs, gs, d)) continue;
    const x = d.slice();
    if (A(x, a).some((v) => v < -1e-9) || verts.some((v) => Math.hypot(v.x[0] - x[0], v.x[1] - x[1], v.x[2] - x[2], v.x[3] - x[3]) < 1e-9)) continue;
    verts.push({ x, tight: [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((u) => Math.abs(a[u]) < 1e-9) });
  }
  const strokes: Stroke[] = [];
  verts.forEach((v, i) => verts.forEach((w, j) => {
    if (j > i && v.tight.filter((u) => w.tight.includes(u)).length >= 3) strokes.push({ pts: [PX(v.x), PY(v.x), PX(w.x), PY(w.x)], tone: 'faint' });
  }));
  strokes.forEach((s, i) => { s.at = (0.45 * i) / strokes.length; });
  return strokes;
}

type Run = { pts: number[]; lens: Float32Array; x: number[]; born: number; dur: number; settled: boolean };
type Crit = { x: number[]; px: number; py: number; index: number; born: number };

const plate: PlateDef = {
  id: 'permanents',
  bounds: [-0.8, -0.8, 0.8, 0.8],
  check: 'Gradient vanishes to twelve digits',
  create(seed) {
    const rand = rng(seed);
    const runs: Run[] = [], found: Crit[] = [];
    const xa = new Array(9).fill(0), step = [0, 0, 0, 0];
    let starts = 0, spawn = 0.6;
    // A random nonnegative matrix with these margins (rejection in the bounding box), then Newton.
    const start = (born: number): Run => {
      const x = [0, 0, 0, 0];
      do { x[0] = rand.next() * 0.9; x[1] = rand.next(); x[2] = rand.next() * 0.9; x[3] = rand.next() * 1.2; } while (A(x, xa).some((v) => v < 0));
      const pts = [PX(x), PY(x)];
      for (let it = 0; it < 60; it++) {
        const g = grad(x);
        if (Math.hypot(g[0], g[1], g[2], g[3]) < 1e-14 || !solve(hess(x), g, step)) break;
        const n = Math.hypot(step[0], step[1], step[2], step[3]), f = n > 1 ? 1 / n : 1;
        for (let k = 0; k < 4; k++) x[k] -= f * step[k];
        pts.push(PX(x), PY(x));
      }
      starts++;
      return { pts, lens: lengths(pts), x, born, dur: 0.2 + 0.055 * (pts.length / 2), settled: false };
    };
    // The check: keep the end point only if the gradient vanishes there to twelve digits.
    const verify = (r: Run, time: number) => {
      r.settled = true;
      const g = grad(r.x);
      if (!(Math.hypot(g[0], g[1], g[2], g[3]) < 1e-12)) return;
      if (found.some((c) => Math.hypot(c.x[0] - r.x[0], c.x[1] - r.x[1], c.x[2] - r.x[2], c.x[3] - r.x[3]) < 1e-7)) return;
      found.push({ x: r.x.slice(), px: PX(r.x), py: PY(r.x), index: morse(hess(r.x)), born: time });
    };
    const mark = (p: Painter, c: Crit, tone: 'ink' | 'draft', alpha: number, scale: number) => {
      if (c.index === 0) p.dot(c.px, c.py, 3.4, tone, { alpha, scale });
      else if (c.index === 1) p.dot(c.px, c.py, 3.1, tone, { hollow: true, alpha, scale });
      else p.dot(c.px, c.py, 2.6, tone, { hollow: c.index === 2, square: true, alpha, scale });
    };
    return {
      scene: {
        strokes: polytope(),
        dots: [
          { x: -0.5, y: 0.7, r: 3.1, tone: 'draft' },
          { x: -0.12, y: 0.7, r: 2.9, tone: 'draft', hollow: true },
          { x: 0.24, y: 0.7, r: 2.5, tone: 'draft', hollow: true, square: true },
        ],
        labels: [
          { x: -0.45, y: 0.7, text: 'minimum', tone: 'ghost' },
          { x: -0.07, y: 0.7, text: 'index 1', tone: 'ghost' },
          { x: 0.29, y: 0.7, text: 'index 2', tone: 'ghost' },
          { x: 0, y: -0.7, text: 'r = (1, 1.3, 0.7)    s = (0.9, 1.2, 0.9)', tone: 'draft', align: 'center', math: true },
        ],
      },
      update(dt, time) {
        spawn += dt * (time < 2 ? 7 : 0.8);
        while (spawn >= 1) { spawn--; runs.push(start(time)); }
        for (const r of runs) if (!r.settled && time - r.born >= r.dur) verify(r, time);
        while (runs.length && time - runs[0].born > runs[0].dur + 4.8) runs.shift();
      },
      draw(p: Painter, time, inked) {
        for (const r of runs) {
          const age = time - r.born, u = clamp(age / r.dur, 0, 1);
          const fade = age < r.dur + 1.6 ? 1 : Math.max(0, 1 - (age - r.dur - 1.6) / 3.2);
          p.dot(r.pts[0], r.pts[1], 1.5, 'draft', { hollow: true, alpha: fade * 0.9 });
          p.poly(r.pts, 'draft', { to: u, lens: r.lens, alpha: fade * 0.6, w: 0.8 });
        }
        for (const c of found) {
          const pop = 1 + 0.9 * Math.max(0, 1 - (time - c.born) / 0.35);
          if (inked < 1) mark(p, c, 'draft', 1 - inked, pop);
          if (inked > 0) mark(p, c, 'ink', inked, pop);
        }
      },
      readings: () => [
        { label: 'Newton starts', value: fmt(starts) },
        // Degree four: every nondegenerate real fiber has at least four real critical points.
        { label: 'Real critical points', value: fmt(found.length), done: found.length >= 4 },
      ],
      settle() {
        for (let i = 0; i < 180; i++) verify(start(-9), -9);
        for (let i = 0; i < 6; i++) { const r = start(0); r.born = -r.dur - 0.2; verify(r, -9); runs.push(r); }
      },
    };
  },
};

export default plate;
