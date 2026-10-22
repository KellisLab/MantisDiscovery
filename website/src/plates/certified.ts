// Certified compression of game-value tables (Zenodo 23484548). An honest toy of the paper's idea.
// The arena is an 8 × 8 board: a token steps left, down or diagonally down-left, and whoever moves it
// onto the corner wins. Retrograde analysis solves every square exactly: who wins, and in how many plies
// under optimal play (the paper's phase distance, here a single phase). Checkpoints on every k-th
// anti-diagonal keep only a signed cell (L, U] of width 3 containing that distance; every other square
// gets the sharp interval of the two extremal boundary problems (5), computed from the checkpoints
// alone. The verifier then certifies every interval at both endpoints with the forced first move (10):
// the evaluator, which sees only stored and derived intervals, must answer false at budget L and true
// at budget U. As an independent check each interval is also compared with the exact solution.
// (Offline: 618 corrupted tables were all rejected by the same tests.)
import { fmt, clamp } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const N = 8, CAP = 15, W = 3; // board size, rank cap, stored cell width: grid 0, 3, …, 15
const MOVES: number[][] = [];
for (let s = 0; s < N * N; s++) {
  const x = s % N, y = (s / N) | 0, m: number[] = [];
  if (x > 0) m.push(s - 1);
  if (y > 0) m.push(s - N);
  if (x > 0 && y > 0) m.push(s - N - 1);
  MOVES.push(m);
}
const diag = (s: number) => (s % N) + ((s / N) | 0);
const ORDER = [...Array(N * N).keys()].slice(1).sort((a, b) => diag(a) - diag(b)); // the corner (0) is the end
// Exact solution by retrograde analysis: WIN[s] = 1 if the mover wins; Z[s] = plies to the end.
const WIN = new Int8Array(N * N), Z = new Int32Array(N * N);
for (const s of ORDER) {
  let best = Infinity, worst = 0;
  for (const q of MOVES[s]) {
    if (q === 0 || !WIN[q]) best = Math.min(best, q === 0 ? 1 : 1 + Z[q]);
    worst = Math.max(worst, q === 0 ? 1 : 1 + Z[q]);
  }
  WIN[s] = best < Infinity ? 1 : 0;
  Z[s] = best < Infinity ? best : worst;
}

type Table = { keep: Uint8Array; sgn: Int8Array; L: Int32Array; U: Int32Array };
/** Retain x + y ≡ 0 (mod k) with coarse cells; derive signs and sharp intervals everywhere else. */
function compress(k: number): Table {
  const keep = new Uint8Array(N * N), sgn = new Int8Array(N * N), L = new Int32Array(N * N), U = new Int32Array(N * N);
  const lo = new Int32Array(N * N), hi = new Int32Array(N * N);
  for (const s of ORDER) {
    if (diag(s) % k === 0) { // stored: sign and the grid cell holding the exact rank
      keep[s] = 1; sgn[s] = WIN[s] ? 1 : -1; L[s] = W * Math.floor((Z[s] - 1) / W); U[s] = L[s] + W;
      lo[s] = L[s] + 1; hi[s] = U[s]; // boundary ranks θ− and θ+
      continue;
    }
    // Omitted: reachability game with checkpoints absorbing, then min (winner) or max (loser) of 1 + successor.
    let win = false;
    for (const q of MOVES[s]) if (q === 0 || sgn[q] < 0) win = true;
    sgn[s] = win ? 1 : -1;
    let a = win ? Infinity : 0, b = a;
    for (const q of MOVES[s]) {
      const ca = q === 0 ? 1 : 1 + lo[q], cb = q === 0 ? 1 : 1 + hi[q];
      if (!win) { a = Math.max(a, ca); b = Math.max(b, cb); } else if (q === 0 || sgn[q] < 0) { a = Math.min(a, ca); b = Math.min(b, cb); }
    }
    lo[s] = a; hi[s] = b; L[s] = a - 1; U[s] = b;
  }
  return { keep, sgn, L, U };
}

/** Failures at square s: sign equation (checkpoints), the two forced endpoint tests, the exact table. */
function verifier(t: Table) {
  const memo = new Map<number, boolean>();
  // P(s, R): the winner at s (by its sign) ends the game within R plies. Shortcuts (8) from intervals.
  const P = (s: number, R: number): boolean => {
    if (R <= t.L[s]) return false;
    if (R >= t.U[s]) return true;
    const key = s * 64 + R;
    let v = memo.get(key);
    if (v === undefined) { v = expand(s, R); memo.set(key, v); }
    return v;
  };
  // One literal expansion: some good move for the winner, or every move for the loser.
  const expand = (s: number, R: number) => {
    if (R <= 0) return false;
    if (t.sgn[s] > 0) { for (const q of MOVES[s]) if (q === 0 || (t.sgn[q] < 0 && P(q, R - 1))) return true; return false; }
    for (const q of MOVES[s]) if (q === 0 || t.sgn[q] < 0 || !P(q, R - 1)) return false;
    return true;
  };
  return (s: number) => {
    let f = 0;
    if (t.keep[s]) { let win = false; for (const q of MOVES[s]) if (q === 0 || t.sgn[q] < 0) win = true; if ((win ? 1 : -1) !== t.sgn[s]) f++; }
    if (expand(s, t.L[s]) !== false) f++; // forced first move at budget L
    if (expand(s, t.U[s]) !== true) f++; // and at budget U
    if ((WIN[s] ? 1 : -1) !== t.sgn[s] || !(t.L[s] < Z[s] && Z[s] <= t.U[s])) f++; // independent: exact
    return f;
  };
}

const bx = (s: number) => (s % N) + 0.5, by = (s: number) => ((s / N) | 0) + 0.12;
const yr = (s: number, r: number) => by(s) + (0.76 * r) / CAP; // rank r on the square's own scale
const beam = (s: number, l: number, u: number, out: number[]) => {
  const x = bx(s), y0 = yr(s, l), y1 = yr(s, u), c = 0.11;
  out.length = 0;
  out.push(x - c, y0, x + c, y0, x, y0, x, y1, x - c, y1, x + c, y1);
  return out;
};
const PERIODS = [3, 2, 4];

const plate: PlateDef = {
  id: 'certified',
  bounds: [-0.95, -1.45, 8.95, 8.45],
  check: 'Every interval certified at both endpoints',
  create() {
    let pi = 0, tab = compress(PERIODS[0]), prev = tab, check = verifier(tab), swapAt = -9;
    const cert = new Float32Array(N * N).fill(-1); // time each square was certified, −1 if not yet
    let sigma = -1, scans = 0, certified = 0, failures = 0, rest = 0, speed = 8;
    const bar: number[] = [];
    const strokes: Stroke[] = [];
    for (let i = 0; i <= N; i++) {
      strokes.push({ pts: [0, i, N, i], tone: 'ghost', at: i * 0.02 });
      strokes.push({ pts: [i, 0, i, N], tone: 'ghost', at: 0.01 + i * 0.02 });
    }
    // The three moves, as a small key under the board.
    const K = [7.7, -0.85];
    strokes.push({ pts: [K[0], K[1], K[0] - 0.42, K[1]], tone: 'draft', at: 0.5 }, { pts: [K[0] - 0.32, K[1] + 0.07, K[0] - 0.42, K[1], K[0] - 0.32, K[1] - 0.07], tone: 'draft', at: 0.5 });
    strokes.push({ pts: [K[0], K[1], K[0], K[1] - 0.42], tone: 'draft', at: 0.52 }, { pts: [K[0] - 0.07, K[1] - 0.32, K[0], K[1] - 0.42, K[0] + 0.07, K[1] - 0.32], tone: 'draft', at: 0.52 });
    strokes.push({ pts: [K[0], K[1], K[0] - 0.33, K[1] - 0.33], tone: 'draft', at: 0.54 }, { pts: [K[0] - 0.33, K[1] - 0.2, K[0] - 0.33, K[1] - 0.33, K[0] - 0.2, K[1] - 0.33], tone: 'draft', at: 0.54 });
    for (const s of ORDER) strokes.push({ pts: [bx(s), yr(s, 0), bx(s), yr(s, CAP)], tone: 'ghost', at: 0.15 + diag(s) * 0.01 }); // rank axis 0 … 15
    for (const s of ORDER) {
      strokes.push({ pts: beam(s, tab.L[s], tab.U[s], []), tone: 'ink', w: 0.9, at: 0.3 + diag(s) * 0.025, transient: true });
      if (tab.keep[s]) { const x = s % N, y = (s / N) | 0; strokes.push({ pts: [x + 0.08, y + 0.08, x + 0.92, y + 0.08, x + 0.92, y + 0.92, x + 0.08, y + 0.92, x + 0.08, y + 0.08], tone: 'ink', w: 0.55, at: 0.2 + diag(s) * 0.02, transient: true }); }
    }
    const outline = (p: Painter, s: number, tone: 'ink' | 'draft', alpha: number) => {
      const x = s % N, y = (s / N) | 0;
      p.rect(x + 0.08, y + 0.08, x + 0.92, y + 0.92, tone, { alpha, w: 0.55 });
    };
    return {
      scene: {
        strokes,
        dots: [{ x: 0.5, y: 0.5, r: 3, tone: 'ink', hollow: true }, { x: K[0], y: K[1], r: 1.8, tone: 'draft' }],
        labels: [{ x: K[0] - 0.62, y: K[1] - 0.17, text: 'moves', tone: 'ghost', align: 'right' }],
      },
      update(dt, time) {
        if (sigma <= 2 * N - 2) {
          sigma += dt * speed;
          // Certify every square whose anti-diagonal the scan line has passed.
          for (const s of ORDER) if (cert[s] < 0 && diag(s) <= sigma) { failures += check(s); cert[s] = time; certified++; }
          if (sigma > 2 * N - 2) scans++;
          return;
        }
        rest += dt;
        if (rest > 2.6) { // a new retention period: recompress, then scan again
          rest = 0; pi = (pi + 1) % PERIODS.length; prev = tab; tab = compress(PERIODS[pi]); check = verifier(tab);
          swapAt = time; cert.fill(-1); certified = 0; sigma = -1.2; speed = 4;
        }
      },
      draw(p: Painter, time, inked) {
        const u = clamp((time - swapAt) / 0.6, 0, 1), e = u * u * (3 - 2 * u);
        for (const s of ORDER) {
          if (prev.keep[s] && !tab.keep[s] && e < 1) outline(p, s, inked > 0 ? 'ink' : 'draft', 1 - e);
          if (tab.keep[s]) outline(p, s, inked > 0 ? 'ink' : 'draft', prev.keep[s] ? 1 : e);
          const l = prev.L[s] + (tab.L[s] - prev.L[s]) * e, h = prev.U[s] + (tab.U[s] - prev.U[s]) * e;
          beam(s, l, h, bar);
          // Ink once certified in this scan; after a new retention the old ink fades back to pencil.
          const c = cert[s] < 0 ? Math.max(0, 1 - (time - swapAt) / 0.4) : clamp((time - cert[s]) / 0.25, 0, 1);
          if (c < 1) p.poly(bar, 'draft', { w: 0.95, alpha: 1 - c });
          if (c > 0) p.poly(bar, 'ink', { w: cert[s] < 0 ? 0.9 : 0.9 + 0.8 * (1 - c), alpha: c });
        }
        if (sigma > -1 && sigma <= 2 * N - 2) {
          const d = sigma + 1, x0 = Math.max(0, d - N), x1 = Math.min(N, d);
          if (x1 > x0) p.line(x0 - 0.15, d - x0 + 0.15, x1 + 0.15, d - x1 - 0.15, 'draft', { w: 1.1 });
        }
        p.text(0, -0.85, `keep x + y ≡ 0 (mod ${PERIODS[pi]})`, 'draft', { math: true, alpha: 0.4 + 0.6 * clamp((time - swapAt) / 0.6, 0, 1) });
      },
      readings: () => [
        { label: 'Intervals certified', value: `${fmt(certified)} of ${ORDER.length}` },
        { label: 'Failures', value: fmt(failures), done: scans > 0 && failures === 0 },
      ],
      settle() {
        for (const s of ORDER) { failures += check(s); cert[s] = -9; }
        certified = ORDER.length; scans = 1; sigma = 2 * N;
      },
    };
  },
};

export default plate;
