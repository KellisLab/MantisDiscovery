// Sharp reach bounds and quantitative localization for opaque sets (Zenodo 23484629).
// The unit square Q and its shortest known opaque barrier: the Steiner tree on three corners plus the
// segment from the fourth corner to the center, length Λ = √2 + √6/2. The check shoots random lines
// at the square from every direction; each one is stopped at its first point on the barrier.
import { rng, segHit, fmt, TAU } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const t = (3 - Math.sqrt(3)) / 6; // Fermat point of A, B, C lies on the diagonal at (t, t)
const A = [0, 0], B = [1, 0], C = [0, 1], D = [1, 1], O = [0.5, 0.5], F = [t, t];
// The barrier as segments [x0, y0, x1, y1].
const BARRIER = [
  [F[0], F[1], A[0], A[1]],
  [F[0], F[1], B[0], B[1]],
  [F[0], F[1], C[0], C[1]],
  [D[0], D[1], O[0], O[1]],
];
const BOX: [number, number, number, number] = [-0.32, -0.3, 1.32, 1.3];

type Ray = { x0: number; y0: number; x1: number; y1: number; born: number; hit: boolean };

/** A random line meeting Q, entering from outside: returns the ray start, its first barrier hit. */
function castRay(r: () => number, barrier: number[][]) {
  const a = r() * TAU;
  const nx = Math.cos(a), ny = Math.sin(a);
  // Offsets c for which {x·n = c} meets the square: between the min and max of the corners.
  const cs = [0, nx, ny, nx + ny];
  const c = Math.min(...cs) + r() * (Math.max(...cs) - Math.min(...cs));
  const dx = -ny, dy = nx;
  // Start far outside the square along the line, travel in +d.
  const sx = nx * c - dx * 2.2, sy = ny * c - dy * 2.2;
  let best = Infinity;
  for (const [x0, y0, x1, y1] of barrier) {
    const h = segHit(sx, sy, dx * 4.4, dy * 4.4, x0, y0, x1 - x0, y1 - y0);
    if (h && h[0] >= 0 && h[0] <= 1 && h[1] >= -1e-9 && h[1] <= 1 + 1e-9) best = Math.min(best, h[0]);
  }
  const hit = best < Infinity;
  const tEnd = hit ? best : 1;
  return { sx, sy, ex: sx + dx * 4.4 * tEnd, ey: sy + dy * 4.4 * tEnd, hit };
}

const plate: PlateDef = {
  id: 'opaque',
  bounds: BOX,
  check: 'Every line through the square meets the barrier',
  create(seed) {
    const R = rng(seed);
    const strokes: Stroke[] = [
      { pts: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0], tone: 'draft', dash: [3, 4], at: 0 },
      // Barrier, drawn from the corners inward like a pen would.
      { pts: [A[0], A[1], F[0], F[1]], tone: 'ink', w: 1.5, at: 0.25 },
      { pts: [B[0], B[1], F[0], F[1]], tone: 'ink', w: 1.5, at: 0.3 },
      { pts: [C[0], C[1], F[0], F[1]], tone: 'ink', w: 1.5, at: 0.35 },
      { pts: [D[0], D[1], O[0], O[1]], tone: 'ink', w: 1.5, at: 0.45 },
      // 120° marks at the Steiner point.
      ...[0, 1, 2].map((k): Stroke => {
        const base = [Math.atan2(A[1] - F[1], A[0] - F[0]), Math.atan2(B[1] - F[1], B[0] - F[0]), Math.atan2(C[1] - F[1], C[0] - F[0])][k];
        const pts: number[] = [];
        for (let i = 0; i <= 10; i++) { const a = base + (i / 10) * 0.5 - 0.25; pts.push(F[0] + 0.045 * Math.cos(a), F[1] + 0.045 * Math.sin(a)); }
        return { pts, tone: 'faint', at: 0.6 };
      }),
    ];
    const rays: Ray[] = [];
    let tested = 0, through = 0, spawn = 0;
    const fire = (born: number) => {
      const c = castRay(R.next, BARRIER);
      tested++;
      if (!c.hit) through++;
      return { x0: c.sx, y0: c.sy, x1: c.ex, y1: c.ey, born, hit: c.hit };
    };
    return {
      scene: {
        strokes,
        dots: [
          { x: A[0], y: A[1], r: 2.4, tone: 'ink' },
          { x: B[0], y: B[1], r: 2.4, tone: 'ink' },
          { x: C[0], y: C[1], r: 2.4, tone: 'ink' },
          { x: D[0], y: D[1], r: 2.4, tone: 'ink' },
          { x: O[0], y: O[1], r: 2, tone: 'draft', hollow: true },
        ],
        labels: [
          { x: -0.06, y: -0.06, text: 'A', tone: 'ghost', align: 'right' },
          { x: 1.06, y: -0.06, text: 'B', tone: 'ghost' },
          { x: -0.06, y: 1.06, text: 'C', tone: 'ghost', align: 'right' },
          { x: 1.06, y: 1.06, text: 'D', tone: 'ghost' },
          { x: 0.5, y: -0.18, text: 'Λ = √2 + √6/2 = 2.6389…', tone: 'draft', align: 'center', math: true, pill: true },
        ],
      },
      update(dt, time) {
        spawn += dt * 9;
        while (spawn >= 1) { spawn--; rays.push(fire(time)); }
        while (rays.length && time - rays[0].born > 2.4) rays.shift();
      },
      draw(p: Painter, time) {
        for (const r of rays) {
          const age = time - r.born;
          const grow = Math.min(1, age / 0.35);
          const fade = age < 1.6 ? 1 : Math.max(0, 1 - (age - 1.6) / 0.8);
          const x1 = r.x0 + (r.x1 - r.x0) * grow, y1 = r.y0 + (r.y1 - r.y0) * grow;
          p.line(r.x0, r.y0, x1, y1, 'faint', { alpha: fade });
          if (grow >= 1 && r.hit) p.dot(r.x1, r.y1, 1.8, 'ink', { alpha: fade });
        }
      },
      readings: () => [
        { label: 'Lines tested', value: fmt(tested) },
        { label: 'Got through', value: fmt(through), done: tested >= 24 && through === 0 },
      ],
      settle() {
        for (let i = 0; i < 10000; i++) fire(0);
        for (let i = 0; i < 26; i++) rays.push(fire(-1));
      },
    };
  },
};

export default plate;
