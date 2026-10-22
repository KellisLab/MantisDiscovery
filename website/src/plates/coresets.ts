// Regression coresets: attainable fits, conditioning, and reuse (Zenodo 23484487).
// Coefficient space β ∈ ℝ² for a regression with two features and three rows (xᵢ, yᵢ). Each row is the
// line xᵢ·β = yᵢ; their pairwise intersections are the two-row interpolants, and by the paper's Theorem
// 3.2 (d + 1 rows) the triangle they span is the closure of all weighted least-squares fits on these
// rows. The check draws seeded random positive weights a, solves β(a) = (XᵀAX)⁻¹XᵀAy exactly (2 × 2), and
// tests its barycentric coordinates in the triangle (tolerance 1e-12). The data drift slowly, so the
// lines turn and the triangle reshapes; every live weighting is solved again against the moving data.
import { rng, fmt, lineInBox } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const BOX: [number, number, number, number] = [-1.3, -1.3, 1.3, 1.3];
const TH = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]; // outward normals of the three rows
const NORM = [1, 1.15, 0.9]; // row norms: they leave the lines alone and change the weighting
const PA = [0.3, 2.4, 4.1], PC = [1.1, 3, 5.2];
const CY = -0.2; // the triangle sits a little low so its bounding box is centered
const END = [2, 2, 0]; // which end of each clipped line carries its row number

/** The three rows at time t, flat [x₁, x₂, y] × 3. */
function rows(t: number, d: number[]) {
  for (let i = 0; i < 3; i++) {
    const a = TH[i] + 0.1 * (Math.sin(0.13 * t + PA[i]) - Math.sin(PA[i]));
    const c = 0.42 + 0.05 * (Math.sin(0.09 * t + PC[i]) - Math.sin(PC[i])) + Math.sin(a) * CY;
    d[3 * i] = NORM[i] * Math.cos(a); d[3 * i + 1] = NORM[i] * Math.sin(a); d[3 * i + 2] = NORM[i] * c;
  }
  return d;
}
/** Interpolant of rows p and q (vertex opposite row j): solve xₚ·β = yₚ, x_q·β = y_q. */
function interp(d: number[], p: number, q: number, out: number[], k: number) {
  const a = d[3 * p], b = d[3 * p + 1], c = d[3 * q], e = d[3 * q + 1], D = a * e - b * c;
  out[k] = (d[3 * p + 2] * e - b * d[3 * q + 2]) / D;
  out[k + 1] = (a * d[3 * q + 2] - d[3 * p + 2] * c) / D;
}
/** Weighted least squares β(a) = (XᵀAX)⁻¹XᵀAy. */
function fit(d: number[], w: number[], out: number[]) {
  let m00 = 0, m01 = 0, m11 = 0, b0 = 0, b1 = 0;
  for (let i = 0; i < 3; i++) {
    const x = d[3 * i], y = d[3 * i + 1], v = d[3 * i + 2], a = w[i];
    m00 += a * x * x; m01 += a * x * y; m11 += a * y * y; b0 += a * x * v; b1 += a * y * v;
  }
  const D = m00 * m11 - m01 * m01;
  out[0] = (m11 * b0 - m01 * b1) / D;
  out[1] = (m00 * b1 - m01 * b0) / D;
}
/** Smallest barycentric coordinate of (x, y) in the triangle V = [x0, y0, x1, y1, x2, y2]. */
function inside(V: number[], x: number, y: number) {
  const ux = V[2] - V[0], uy = V[3] - V[1], vx = V[4] - V[0], vy = V[5] - V[1], D = ux * vy - uy * vx;
  const l1 = ((x - V[0]) * vy - (y - V[1]) * vx) / D, l2 = (ux * (y - V[1]) - uy * (x - V[0])) / D;
  return Math.min(1 - l1 - l2, l1, l2);
}

type Fit = { w: number[]; born: number; x: number; y: number };

const plate: PlateDef = {
  id: 'coresets',
  bounds: BOX,
  check: 'Every weighted fit lands in the hull',
  create(seed) {
    const R = rng(seed);
    const d = rows(0, new Array(9).fill(0)), V = new Array(6).fill(0), b = [0, 0];
    const tri = () => { interp(d, 1, 2, V, 0); interp(d, 0, 2, V, 2); interp(d, 0, 1, V, 4); };
    tri();
    const line = (i: number) => {
      const n = Math.hypot(d[3 * i], d[3 * i + 1]);
      return lineInBox(Math.atan2(d[3 * i + 1], d[3 * i]), d[3 * i + 2] / n, BOX);
    };
    const fits: Fit[] = [];
    let solved = 0, outside = 0, spawn = 0;
    // The check: solve one weighting on the current data and test it against the current triangle.
    const test = (f: Fit) => {
      fit(d, f.w, b);
      f.x = b[0]; f.y = b[1];
      if (inside(V, b[0], b[1]) < -1e-12) outside++;
    };
    const sample = (born: number) => {
      const f: Fit = { w: [0, 1, 2].map(() => Math.exp(R.range(-2.2, 2.2))), born, x: 0, y: 0 };
      solved++;
      test(f);
      return f;
    };
    const strokes: Stroke[] = [0, 1, 2].map((i): Stroke => ({ pts: [...line(i)!], tone: 'draft', at: 0.05 + i * 0.1, transient: true }));
    strokes.push({ pts: [...V, V[0], V[1]], tone: 'ink', at: 0.4, transient: true });
    const hatch: number[] = []; // scratch for one frame's hatching
    return {
      scene: {
        strokes,
        dots: [0, 2, 4].map((k) => ({ x: V[k], y: V[k + 1], r: 2.6, tone: 'ink' as const, transient: true })),
        labels: [{ x: 0, y: -1.17, text: 'xᵢ · β = yᵢ,   i = 1, 2, 3', tone: 'draft', align: 'center', math: true }],
      },
      update(dt, time) {
        rows(time, d);
        tri();
        spawn += dt * (time < 2 ? 26 : 6);
        while (spawn >= 1) { spawn--; fits.push(sample(time)); }
        while (fits.length && time - fits[0].born > 3.6) fits.shift();
        for (const f of fits) test(f); // live weightings follow the moving data and are checked again
      },
      draw(p: Painter, time, inked) {
        // Hatching: fixed diagonal family clipped to the current triangle.
        hatch.length = 0;
        const hx = Math.SQRT1_2, hy = Math.SQRT1_2;
        let lo = Infinity, hi = -Infinity;
        for (let k = 0; k < 6; k += 2) { const s = V[k] * hx + V[k + 1] * hy; lo = Math.min(lo, s); hi = Math.max(hi, s); }
        for (let c = Math.ceil(lo / 0.06) * 0.06; c < hi; c += 0.06) {
          let n = 0;
          for (let k = 0; k < 6; k += 2) {
            const k2 = (k + 2) % 6, di = V[k] * hx + V[k + 1] * hy - c, dj = V[k2] * hx + V[k2 + 1] * hy - c;
            if ((di < 0) !== (dj < 0)) { const f = di / (di - dj); hatch.push(V[k] + (V[k2] - V[k]) * f, V[k + 1] + (V[k2 + 1] - V[k + 1]) * f); n++; }
          }
          if (n === 2) p.line(hatch[hatch.length - 4], hatch[hatch.length - 3], hatch[hatch.length - 2], hatch[hatch.length - 1], 'faint', { alpha: 0.8 });
        }
        for (let i = 0; i < 3; i++) {
          const l = line(i);
          if (!l) continue;
          p.line(l[0], l[1], l[2], l[3], 'draft', { w: 0.9 });
          // Row index near a fixed end of each line (right, upper left, upper right), so it never jumps.
          const e = END[i], ux = l[2 - e] - l[e], uy = l[3 - e] - l[e + 1], un = Math.hypot(ux, uy);
          p.text(l[e] + (ux / un) * 0.1 - (uy / un) * 0.07, l[e + 1] + (uy / un) * 0.1 + (ux / un) * 0.07, String(i + 1), 'ghost', { align: 'center' });
        }
        const tri6 = [V[0], V[1], V[2], V[3], V[4], V[5], V[0], V[1]];
        if (inked < 1) p.poly(tri6, 'draft', { alpha: 1 - inked });
        if (inked > 0) p.poly(tri6, 'ink', { alpha: inked });
        for (const f of fits) {
          const age = time - f.born, a = Math.min(1, age / 0.15) * (age < 2.2 ? 1 : Math.max(0, 1 - (age - 2.2) / 1.4));
          p.dot(f.x, f.y, 1.35, inked > 0 ? 'ink' : 'draft', { alpha: a * (inked > 0 ? 0.55 + 0.45 * inked : 1) });
        }
        for (let k = 0; k < 6; k += 2) {
          if (inked < 1) p.dot(V[k], V[k + 1], 2.6, 'draft', { hollow: true, alpha: 1 - inked });
          if (inked > 0) p.dot(V[k], V[k + 1], 2.6, 'ink', { alpha: inked });
        }
      },
      readings: () => [
        { label: 'Weightings solved', value: fmt(solved) },
        { label: 'Outside the hull', value: fmt(outside), done: solved >= 40 && outside === 0 },
      ],
      settle() {
        for (let i = 0; i < 400; i++) sample(-9);
        for (let i = 0; i < 70; i++) fits.push(sample(-1));
      },
    };
  },
};

export default plate;
