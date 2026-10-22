// Repetition graphs and the growth of pattern-avoiding sequences (Zenodo 23484513).
// A random ascent sequence of length 34 (x₁ = 0, each xᵢ ≤ 1 + asc(x₁ ⋯ xᵢ₋₁)) avoiding 0120, 0121 and
// 0122, drawn by incremental random choice with rejection. Value against position, the ascent bound as a
// faint staircase, and arcs joining consecutive occurrences of equal values: the arcs of the paper's
// repetition graph. Avoiding all three patterns forces every repeat into an opening run of 0s and 1s, so
// the arcs gather there. The check runs through all C(34, 4) = 46,376 four-term subsequences, ending
// position by ending position, counting occurrences, and re-tests the ascent condition; each verified
// prefix is inked. Then a new sequence is drawn and checked.
import { rng, fmt, type Rng } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const N = 34, TOP = 24, TOTAL = (N * (N - 1) * (N - 2) * (N - 3)) / 24;
const X = (i: number) => -0.96 + (2.02 * i) / (N - 1);
const Y = (v: number) => -0.8 + (1.8 * v) / TOP;
const BASE = Y(-0.75);

/** Random choice with rejection: an opening run of 0s and 1s, then values from 0 … 1 + asc. A value is
 *  rejected if appending it completes 0120, 0121 or 0122, i.e. if it is one of the values of an
 *  increasing triple already present (kept up to date as entries are accepted). */
function sample(R: Rng): number[] {
  for (;;) {
    const L = 13 + R.int(4), x = [0], dead = new Set<number>();
    let asc = 0;
    while (x.length < N) {
      const n = x.length, hi = 1 + asc, last = x[n - 1];
      const v = n < L ? R.int(2) : R.int(hi + 1);
      if (dead.has(v)) continue;
      if (n >= L && v < last) {
        // Spend the ascent credit across the rest: take a descent only now and then.
        let s = 0;
        for (let u = 2; u <= hi; u++) if (!x.includes(u)) s++;
        if (s < 2 || R.next() > Math.min(0.6, ((s - 1) / (N - n)) * 1.6)) continue;
      }
      if (v > last) asc++;
      x.push(v);
      for (let j = 1; j < n; j++) if (x[j] < v) for (let i = 0; i < j; i++) if (x[i] < x[j]) dead.add(x[i]).add(x[j]).add(v);
      if (n === L - 1 && asc < 3) break; // too little credit: start again
    }
    if (x.length === N && Math.max(...x) <= TOP) return x;
  }
}
type Seq = { x: number[]; bound: number[]; arcs: [number, number][]; arcPts: number[][]; stair: number[] };
function build(x: number[]): Seq {
  const bound: number[] = [];
  let asc = 0;
  for (let i = 0; i < N; i++) { bound.push(i === 0 ? 0 : 1 + asc); if (i > 0 && x[i] > x[i - 1]) asc++; }
  const arcs: [number, number][] = [], lastAt = new Map<number, number>();
  x.forEach((v, q) => { const p = lastAt.get(v); if (p !== undefined) arcs.push([p, q]); lastAt.set(v, q); });
  const arcPts = arcs.map(([p, q]) => {
    const h = (1.8 / TOP) * Math.min(0.78, 0.3 + 0.12 * (q - p)), pts: number[] = [];
    for (let t = 0; t <= 18; t++) { const a = (Math.PI * t) / 18; pts.push(X(p) + ((X(q) - X(p)) * (1 - Math.cos(a))) / 2, Y(x[p]) + h * Math.sin(a)); }
    return pts;
  });
  const stair: number[] = [];
  for (let i = 1; i < N; i++) stair.push(X(i) - 1.01 / (N - 1), Y(bound[i]), X(i) + 1.01 / (N - 1), Y(bound[i]));
  return { x, bound, arcs, arcPts, stair };
}

const plate: PlateDef = {
  id: 'ascent',
  bounds: [-1.26, -1.22, 1.26, 1.3],
  check: 'Avoids 0120, 0121 and 0122',
  create(seed) {
    const R = rng(seed);
    let S = build(sample(R));
    const strokes: Stroke[] = [
      { pts: [X(0) - 0.06, BASE, X(N - 1) + 0.06, BASE], tone: 'ghost', at: 0 },
      { pts: [X(0) - 0.1, Y(0), X(0) - 0.1, Y(TOP)], tone: 'ghost', at: 0.02 },
      ...[0, 10, 20].map((v): Stroke => ({ pts: [X(0) - 0.13, Y(v), X(0) - 0.1, Y(v)], tone: 'ghost', at: 0.04 })),
      { pts: S.stair, tone: 'faint', transient: true, at: 0.1 },
      ...S.x.map((v, i): Stroke => ({ pts: [X(i), BASE, X(i), Y(v)], tone: 'faint', transient: true, at: 0.15 + i * 0.008 })),
      ...S.arcPts.map((pts, n): Stroke => ({ pts, tone: 'ink', transient: true, at: 0.4 + n * 0.01 })),
    ];
    // The check, in order of the last position l: every (i < j < k < l).
    let i = 0, j = 1, k = 2, l = 3, checked = 0, occ = 0, rounds = 0, ascOk = true;
    let mode: 'check' | 'rest' | 'fade' | 'grow' = 'check', t = 0, prev: Seq | null = null;
    const ascent = (x: number[]) => { let a = 0; return x[0] === 0 && x.every((v, n) => { const ok = n === 0 || v <= 1 + a; if (n > 0 && v > x[n - 1]) a++; return ok; }); };
    const restart = () => { i = 0; j = 1; k = 2; l = 3; checked = 0; occ = 0; ascOk = ascent(S.x); mode = 'check'; };
    const run = (n: number) => {
      const x = S.x;
      for (; n > 0 && l < N; n--) {
        if (x[i] < x[j] && x[j] < x[k] && (x[l] === x[i] || x[l] === x[j] || x[l] === x[k])) occ++;
        checked++;
        if (++i < j) continue;
        i = 0;
        if (++j < k) continue;
        j = 1;
        if (++k < l) continue;
        k = 2;
        l++;
      }
      if (l === N && mode === 'check') { rounds++; mode = 'rest'; t = 0; }
    };
    restart();

    return {
      scene: {
        strokes,
        dots: S.x.map((v, n) => ({ x: X(n), y: Y(v), r: 2.6, tone: 'ink' as const, transient: true })),
        labels: [
          { x: X(0), y: BASE - 0.09, text: '1', tone: 'ghost', align: 'center' },
          { x: X(N - 1), y: BASE - 0.09, text: '34', tone: 'ghost', align: 'center' },
          ...[0, 10, 20].map((v) => ({ x: X(0) - 0.16, y: Y(v), text: String(v), tone: 'ghost' as const, align: 'right' as const })),
          { x: X(3), y: Y(9.4), text: 'xᵢ ≤ 1 + asc', tone: 'draft', align: 'left', math: true },
        ],
      },
      update(dt) {
        t += dt;
        if (mode === 'check') run(Math.ceil((TOTAL * dt) / 1.5));
        else if (mode === 'rest' && t > 3.2) { mode = 'fade'; t = 0; prev = S; }
        else if (mode === 'fade' && t > 0.45) { S = build(sample(R)); mode = 'grow'; t = 0; }
        else if (mode === 'grow' && t > 1.5) { restart(); t = 0; }
      },
      draw(p: Painter, _time, inked) {
        const seq = mode === 'fade' && prev ? prev : S;
        const a = mode === 'fade' ? Math.max(0, 1 - t / 0.45) : 1;
        const shown = mode === 'grow' ? Math.min(N, Math.floor((t / 1.3) * N) + 1) : N;
        // Verified prefix: positions before the cursor (all, once the round is complete).
        const upto = mode === 'check' ? l : mode === 'grow' ? -1 : N;
        const ink = (n: number) => (n < upto ? inked : 0);
        p.poly(seq.stair.slice(0, Math.max(0, shown - 1) * 4), 'faint', { alpha: a });
        for (let n = 0; n < shown; n++) p.line(X(n), BASE, X(n), Y(seq.x[n]), 'faint', { alpha: a * 0.8 });
        seq.arcs.forEach(([, q], m) => {
          if (q >= shown) return;
          const f = ink(q);
          if (f < 1) p.poly(seq.arcPts[m], 'draft', { alpha: a, w: 1.1 });
          if (f > 0) p.poly(seq.arcPts[m], 'ink', { alpha: a * f, w: 1.1 });
        });
        for (let n = 0; n < shown; n++) {
          const f = ink(n);
          if (f < 1) p.dot(X(n), Y(seq.x[n]), 2.6, 'draft', { hollow: true, alpha: a });
          if (f > 0) p.dot(X(n), Y(seq.x[n]), 2.6, 'ink', { alpha: a * f });
        }
        if (mode === 'check' && l < N) {
          p.line(X(l), BASE, X(l), Y(TOP), 'draft', { w: 0.8 });
          for (const n of [i, j, k]) p.dot(X(n), Y(seq.x[n]), 5, 'draft', { hollow: true, alpha: 0.7 });
        }
      },
      readings: () => [
        { label: 'Subsequences tested', value: checked === TOTAL ? `all ${fmt(TOTAL)}` : fmt(checked) },
        { label: 'Pattern occurrences', value: fmt(occ), done: rounds > 0 && occ === 0 && ascOk },
      ],
      settle() {
        run(TOTAL);
        mode = 'rest';
        t = 0;
      },
    };
  },
};

export default plate;
