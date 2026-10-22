// Repetition under a deadline: memory bounds and capacity profiles (Zenodo 23484607).
// An alternating arena of N = 8 positions on a directed cycle, owners alternating (circles and squares);
// each square may also step back. Every action costs one unit of a reserve of capacity H, so a phase has
// H live positions; a position seen k = 3 times allows a repetition claim (ink ring). A token walks the
// arena, tallying visits, while the check searches every live history of the arena at the current H for
// a third visit. Alternation spaces visits two moves apart, so none exists when H ≤ 2k − 2 = 4: the case
// where the paper proves exact value monitoring needs no history memory. Above it the plate shows the
// paper's explicit upper bound ⌈log₂ U(N, k − 1, S)⌉ + 1 bits, S = (H − 2k + 2)₊, with U counted here
// by enumerating the 3⁸ count vectors. It is an upper bound only; the paper's lower bound is a Θ(·).
import { arc, rng, fmt, TAU } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const N = 8, K = 3, RA = 0.96, CY = 0.06, RC = 0.4;
const CAPS = [3, 4, 5, 6, 7, 8, 9, 10];
const th = (i: number) => Math.PI / 2 - (TAU * i) / N;
const V = Array.from({ length: N }, (_, i) => [RA * Math.cos(th(i)), CY + RA * Math.sin(th(i))]);
const out = (v: number) => (v % 2 ? [(v + 1) % N, v - 1] : [(v + 1) % N]); // squares may step back

/** Action v → w as a polyline, parameter a0..a1 of the way: along the circle, or bowed inward going back. */
function path(v: number, w: number, a0 = 0, a1 = 1, n = 22) {
  const pts: number[] = [];
  const fwd = w === (v + 1) % N;
  const ca = th(v) + TAU / (2 * N), cx = 0.62 * Math.cos(ca), cy = CY + 0.62 * Math.sin(ca);
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    if (fwd) { const a = th(v) - (TAU / N) * t; pts.push(RA * Math.cos(a), CY + RA * Math.sin(a)); }
    else {
      const u = 1 - t;
      pts.push(u * u * V[v][0] + 2 * u * t * cx + t * t * V[w][0], u * u * V[v][1] + 2 * u * t * cy + t * t * V[w][1]);
    }
  }
  return pts;
}
function head(pts: number[], L = 0.055, s = 0.45) {
  const n = pts.length, x = pts[n - 2], y = pts[n - 1];
  const a = Math.atan2(y - pts[n - 5], x - pts[n - 6]);
  return [x + L * Math.cos(a + Math.PI - s), y + L * Math.sin(a + Math.PI - s), x, y, x + L * Math.cos(a + Math.PI + s), y + L * Math.sin(a + Math.PI + s)];
}
/** Every live history with H positions (clock 0 … H − 1), from every start. */
function histories(H: number) {
  const all: number[][] = [];
  const walk = (h: number[]) => { if (h.length === H) { all.push(h.slice()); return; } for (const w of out(h[h.length - 1])) { h.push(w); walk(h); h.pop(); } };
  for (let s = 0; s < N; s++) walk([s]);
  return all;
}
/** The paper's upper bound (12): ⌈log₂ U(N, k − 1, S)⌉ + 1, U counted over all vectors in {0, …, k − 1}^N. */
function bounds() {
  const bySum = new Array(N * (K - 1) + 1).fill(0);
  for (let m = 0; m < K ** N; m++) { let x = m, s = 0; for (let i = 0; i < N; i++) { s += x % K; x = Math.floor(x / K); } bySum[s]++; }
  return (S: number) => { let U = 0; for (let t = 0; t <= S; t++) U += bySum[t]; return Math.ceil(Math.log2(U)) + 1; };
}

const plate: PlateDef = {
  id: 'repetition',
  bounds: [-1.3, -1.3, 1.3, 1.3],
  check: 'Threefold repetition needs H ≥ 2k − 1',
  create(seed) {
    const R = rng(seed);
    const bitsFor = bounds();
    const strokes: Stroke[] = [];
    for (let v = 0; v < N; v++) for (const w of out(v)) {
      const pts = path(v, w, 0.16, 0.84);
      strokes.push({ pts, tone: 'draft', w: w === v - 1 ? 0.8 : 1, at: 0.05 + v * 0.05 }, { pts: head(pts), tone: 'draft', at: 0.1 + v * 0.05 });
    }
    strokes.push({ pts: arc(0, CY, RC, 0, TAU, 120), tone: 'ghost', at: 0.5 });

    // The walk: one phase per capacity.
    let ci = 0, H = CAPS[0], pos = 0, clock = 0, from = 0, to = 0, t = 0;
    let mode: 'rest' | 'move' | 'claim' | 'expire' = 'rest';
    const counts = new Int8Array(N);
    // The search over live histories at the current H.
    let list: number[][] = [], searched = 0, found = 0, rounds = 0, agree = true;
    const begin = (c: number) => {
      ci = c; H = CAPS[ci];
      counts.fill(0);
      pos = R.int(N); counts[pos] = 1; clock = 0; mode = 'rest'; t = 0;
      list = histories(H); searched = 0; found = 0;
    };
    const search = (n: number) => {
      for (; n > 0 && searched < list.length; n--) {
        const h = list[searched++], c = new Int8Array(N);
        if (h.some((v) => ++c[v] >= K)) found++;
      }
      if (searched === list.length) { rounds++; agree = agree && (found > 0) === (H >= 2 * K - 1); }
    };
    const choose = () => { const o = out(pos); return o.length > 1 && R.next() < 0.5 ? o[1] : o[0]; };
    const arrive = () => {
      pos = to; clock++;
      if (++counts[pos] >= K) { mode = 'claim'; t = 0; } else { mode = 'rest'; t = 0; }
    };
    begin(0);

    return {
      scene: {
        strokes,
        dots: V.map(([x, y], i) => ({ x, y, r: i % 2 ? 5.2 : 5.8, tone: 'ink' as const, hollow: true, square: i % 2 === 1 })),
        labels: [{ x: 0, y: -1.2, text: 'N = 8,  k = 3', tone: 'draft', align: 'center', math: true }],
      },
      update(dt) {
        if (searched < list.length) search(Math.max(1, Math.ceil((list.length * dt) / 0.7)));
        t += dt;
        if (mode === 'rest' && t > 0.17) {
          if (clock < H - 1) { from = pos; to = choose(); mode = 'move'; t = 0; }
          else { mode = 'expire'; t = 0; }
        } else if (mode === 'move' && t > 0.3) arrive();
        else if ((mode === 'claim' && t > 1.7) || (mode === 'expire' && t > 1.3)) {
          if (searched === list.length) begin((ci + 1) % CAPS.length);
        }
      },
      draw(p: Painter, _time, inked) {
        const tone = inked > 0 ? 'ink' : 'draft';
        // Clock: H reserve units around the centre; the unit being spent drains during the move.
        const spent = mode === 'expire' ? Math.min(H, clock + Math.min(1, t / 0.5)) : mode === 'move' ? clock + Math.min(1, t / 0.3) : clock;
        for (let j = 0; j < H; j++) {
          const g = Math.min(0.09, 0.9 / H) * 0.5, a0 = Math.PI / 2 - (TAU * j) / H - g, a1 = Math.PI / 2 - (TAU * (j + 1)) / H + g;
          const left = Math.min(1, Math.max(0, j + 1 - spent));
          if (left > 0) p.poly(arc(0, CY, RC, a1, a1 + (a0 - a1) * left, 16), tone, { w: 2.2 });
          if (left < 1) p.poly(arc(0, CY, RC, a1 + (a0 - a1) * left, a0, 16), 'faint', { w: 1.6 });
        }
        p.text(0, CY + 0.06, `H = ${H}`, tone, { align: 'center', math: true, size: 19 });
        const S = Math.max(0, H - 2 * K + 2);
        p.text(0, CY - 0.11, `S = ${S}`, 'draft', { align: 'center', math: true, size: 13 });
        // Tallies: one pip per visit, in a row just outside the position (spaced in CSS px).
        const r = RA + 21 / p.s, da = 7 / p.s / r;
        for (let v = 0; v < N; v++) for (let c = 0; c < counts[v]; c++) {
          const a = th(v) + (c - (counts[v] - 1) / 2) * da;
          p.dot(r * Math.cos(a), CY + r * Math.sin(a), 2.5, counts[v] >= K ? tone : 'draft');
        }
        if (mode === 'claim') p.dot(V[pos][0], V[pos][1], 11 + 3 * Math.min(1, t / 0.25), 'ink', { hollow: true, alpha: Math.min(1, t / 0.15) });
        // The token, and the action it is taking.
        let x = V[pos][0], y = V[pos][1];
        if (mode === 'move') {
          const u = Math.min(1, t / 0.3), e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
          const pts = path(from, to, 0, e, 16);
          p.poly(pts, tone, { w: 1.2, alpha: 0.8 });
          x = pts[pts.length - 2]; y = pts[pts.length - 1];
        }
        p.dot(x, y, 3.6, tone, { alpha: mode === 'expire' ? Math.max(0.25, 1 - t / 0.6) : 1 });
      },
      readings: () => [
        { label: 'Histories searched', value: `${fmt(searched)} of ${fmt(list.length)}` },
        {
          label: 'History memory',
          value: searched < list.length ? 'searching' : found ? `≤ ${bitsFor(Math.max(0, H - 2 * K + 2))} bits` : 'none',
          done: rounds > 0 && agree,
        },
      ],
      settle() {
        // A still at H = 6: the full search, and a legal walk ending in a third visit at clock 4.
        begin(CAPS.indexOf(6));
        search(list.length);
        counts.fill(0);
        pos = 2; counts[2] = 1;
        for (const w of [3, 2, 3, 2]) { from = pos; to = w; arrive(); }
        t = 1;
      },
    };
  },
};

export default plate;
