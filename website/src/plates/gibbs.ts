// Relative covariance approximation in discrete Gibbs models (Zenodo 23484418).
// A hard-core lattice gas on a 5 × 26 strip of the square lattice at activity λ = 0.6: the Gibbs measure
// gives each set I of sites, no two of them neighbors, weight λ^|I|. A heat-bath Glauber chain updates
// one seeded random site per step: empty if a neighbor is occupied, else occupied with probability
// λ/(1 + λ). The check scans all 229 bonds of the strip after every step and counts adjacent occupied
// pairs (the hard-core rule); there are none. Below, the chain's density against the exact density from
// the column transfer matrix, the reference the paper uses for its strip experiments.
import { rng, fmt } from './kit';
import type { Painter } from './painter';
import type { Dot, PlateDef, Stroke } from './types';

const ROWS = 5, COLS = 26, N = ROWS * COLS, LAM = 0.6;
const Y0 = 1.6; // strip rows sit at y = Y0 … Y0 + 4
const TX0 = 0, TX1 = 18.5, TY0 = -9.6, TY1 = -2.6, DMAX = 0.4; // density trace panel
const SAMPLES = 320, EVERY = 4; // one density sample every 4 steps

/** Exact mean density: transfer matrix over column states (independent sets of a path on ROWS sites). */
function exactDensity() {
  const st: number[] = [];
  for (let m = 0; m < 1 << ROWS; m++) if ((m & (m >> 1)) === 0) st.push(m);
  const pop = (m: number) => { let c = 0; for (; m; m >>= 1) c += m & 1; return c; };
  const w = st.map((m) => LAM ** pop(m));
  const fw = [w.slice()], bw: number[][] = new Array(COLS);
  for (let c = 1; c < COLS; c++) fw.push(st.map((m, j) => w[j] * st.reduce((t, m2, k) => t + ((m & m2) === 0 ? fw[c - 1][k] : 0), 0)));
  bw[COLS - 1] = st.map(() => 1);
  for (let c = COLS - 2; c >= 0; c--) bw[c] = st.map((m) => st.reduce((t, m2, k) => t + ((m & m2) === 0 ? w[k] * bw[c + 1][k] : 0), 0));
  const Z = fw[COLS - 1].reduce((u, v) => u + v);
  let e = 0;
  for (let c = 0; c < COLS; c++) st.forEach((m, j) => { e += (fw[c][j] * bw[c][j] * pop(m)) / Z; });
  return e / N;
}
const RHO = exactDensity();
const ty = (d: number) => TY0 + (Math.min(d, DMAX) / DMAX) * (TY1 - TY0);

const plate: PlateDef = {
  id: 'gibbs',
  bounds: [-1.5, -15, COLS + 0.5, 13],
  check: 'No two neighbors are ever occupied',
  create(seed) {
    const R = rng(seed);
    const occ = new Uint8Array(N), vis = new Float32Array(N);
    const trace = new Float32Array(SAMPLES), recent: { i: number; t: number }[] = [];
    let steps = 0, pairs = 0, count = 0, filled = 0, head = 0, acc = 0;
    // The check: every bond of the strip, after every step.
    const scan = () => {
      let v = 0;
      for (let i = 0; i < N; i++) {
        if (!occ[i]) continue;
        if (i % ROWS < ROWS - 1 && occ[i + 1]) v++; // vertical bond
        if (i + ROWS < N && occ[i + ROWS]) v++; // horizontal bond
      }
      return v;
    };
    const step = (t: number) => {
      const i = R.int(N), r = i % ROWS;
      const blocked = (r > 0 && occ[i - 1]) || (r < ROWS - 1 && occ[i + 1]) || (i >= ROWS && occ[i - ROWS]) || (i + ROWS < N && occ[i + ROWS]);
      const v = blocked ? 0 : R.next() < LAM / (1 + LAM) ? 1 : 0;
      count += v - occ[i];
      occ[i] = v;
      steps++;
      pairs += scan();
      recent.push({ i, t });
      if (steps % EVERY === 0) { trace[head] = count / N; head = (head + 1) % SAMPLES; filled = Math.min(SAMPLES, filled + 1); }
    };
    // Lattice: bonds in ghost (one polyline per row and per column), sites as small pencil dots.
    const strokes: Stroke[] = [];
    for (let r = 0; r < ROWS; r++) strokes.push({ pts: [0, Y0 + r, COLS - 1, Y0 + r], tone: 'ghost', at: r * 0.04 });
    for (let c = 0; c < COLS; c++) strokes.push({ pts: [c, Y0, c, Y0 + ROWS - 1], tone: 'ghost', at: 0.18 + c * 0.006 });
    strokes.push({ pts: [TX0, ty(RHO), TX1 + 0.6, ty(RHO)], tone: 'ghost', dash: [2, 4], at: 0.4 });
    strokes.push({ pts: [TX0, TY0, TX1, TY0], tone: 'ghost', at: 0.38 });
    const dots: Dot[] = [];
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) dots.push({ x: c, y: Y0 + r, r: 0.9, tone: 'faint' });
    const pts: number[] = [];
    return {
      scene: {
        strokes,
        dots,
        labels: [
          { x: 0, y: Y0 + ROWS + 0.9, text: 'λ = 0.6', tone: 'draft', math: true },
          { x: COLS - 1, y: Y0 + ROWS + 0.9, text: '5 × 26 strip', tone: 'ghost', align: 'right' },
          { x: TX0, y: TY1 + 1.3, text: 'density', tone: 'ghost' },
          { x: TX1 + 1.1, y: ty(RHO), text: `exact ${RHO.toFixed(3)}`, tone: 'ghost' },
        ],
      },
      update(dt, time) {
        acc += dt * (time < 2 ? 150 : 45);
        while (acc >= 1) { acc--; step(time); }
        while (recent.length && time - recent[0].t > 0.3) recent.shift();
        const k = Math.min(1, dt / 0.12);
        for (let i = 0; i < N; i++) vis[i] += (occ[i] - vis[i]) * k;
      },
      draw(p: Painter, time, inked) {
        for (const u of recent) p.dot((u.i / ROWS) | 0, Y0 + (u.i % ROWS), 4.2, 'draft', { hollow: true, alpha: 0.75 * (1 - (time - u.t) / 0.3) });
        const h = 0.22;
        for (let i = 0; i < N; i++) {
          if (vis[i] < 0.02) continue;
          const x = (i / ROWS) | 0, y = Y0 + (i % ROWS);
          if (inked < 1) p.rect(x - h, y - h, x + h, y + h, 'draft', { fill: true, alpha: vis[i] * (1 - inked) });
          if (inked > 0) p.rect(x - h, y - h, x + h, y + h, 'ink', { fill: true, alpha: vis[i] * inked });
        }
        // Density trace: oldest sample at the left, newest at the right once the window is full.
        pts.length = 0;
        for (let k = 0; k < filled; k++) {
          const d = trace[(head - filled + k + SAMPLES) % SAMPLES];
          pts.push(TX0 + ((TX1 - TX0) * k) / (SAMPLES - 1), ty(d));
        }
        p.poly(pts, 'draft', { w: 0.9 });
      },
      readings: () => [
        { label: 'Glauber steps', value: fmt(steps) },
        { label: 'Occupied neighbors', value: fmt(pairs), done: steps >= 200 && pairs === 0 },
      ],
      settle() {
        for (let s = 0; s < 6000; s++) step(-9);
        vis.set(occ);
        recent.length = 0;
      },
    };
  },
};

export default plate;
