// Calibration limits in mixed-precision quantization (Zenodo 23484231).
// A toy, not the paper's networks: six weight tensors of n_g thousand weights with sensitivities s_g, each
// stored at 2, 3, 4 or 8 bits. Storage C(a) = Σ n_g a_g / 8 KB; error under an additive model
// E(a) = Σ s_g 4^(−a_g). The check enumerates all 4⁶ = 4,096 allocations, plots storage against log error,
// and tests each against the budget M: pencil inside it, faint over it. The lower-left frontier and the
// lowest-error allocation within the budget are inked, its bit widths drawn as six bars in the empty
// corner. Then the budget sweeps between 100 and 160 KB and the best allocation follows it.
import { fmt, fixed } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const SIZES = [6, 28, 60, 72, 40, 10], SENS = [16, 4, 0.5, 1, 6, 30], BITS = [2, 3, 4, 8];
const ALL = 4 ** SIZES.length;
const C0 = 48, C1 = 222, L0 = -3.25, L1 = 0.75; // plotted ranges: storage KB, log10 error
const X = (c: number) => -0.91 + (2.0 * (c - C0)) / (C1 - C0);
const Y = (l: number) => -0.82 + (1.92 * (l - L0)) / (L1 - L0);
const BASE = Y(L0) - 0.05, LEFT = X(C0) - 0.05;
const M0 = 130, MA = 30; // the budget sweeps M0 ± MA
// The best allocation's bits, as six bars in the empty corner under the frontier.
const GX = X(53), GY = Y(L0) + 0.22, GW = 0.05, GG = 0.026, GH = 0.24;

const plate: PlateDef = {
  id: 'calibration',
  bounds: [-1.3, -1.28, 1.24, 1.26],
  check: 'Every allocation checked against the budget',
  create() {
    const cost = new Float64Array(ALL), err = new Float64Array(ALL), px = new Float64Array(ALL), py = new Float64Array(ALL);
    const minAt = new Map<number, number>(); // lowest error found at each storage value
    let n = 0, acc = 0, passAt = -1, M = M0, best = -1;
    const evaluate = (m: number) => {
      let c = 0, e = 0;
      for (let g = 0, x = m; g < SIZES.length; g++, x >>= 2) { const b = BITS[x & 3]; c += (SIZES[g] * b) / 8; e += SENS[g] * 4 ** -b; }
      cost[m] = c; err[m] = e; px[m] = X(c); py[m] = Y(Math.log10(e));
      const k = minAt.get(c);
      if (k === undefined || e < err[k]) minAt.set(c, m);
    };
    // Frontier: sweep storage values upward, keep each strictly lower error. Best within M: last one ≤ M.
    let front: number[] = [], stairs: number[] = [];
    const frontier = () => {
      front = [];
      for (const c of [...minAt.keys()].sort((a, b) => a - b)) {
        const m = minAt.get(c)!;
        if (!front.length || err[m] < err[front[front.length - 1]]) front.push(m);
      }
      stairs = [];
      front.forEach((m, i) => {
        stairs.push(px[m], py[m]);
        if (i + 1 < front.length) stairs.push(px[front[i + 1]], py[m]);
      });
    };
    const within = () => { let w = 0; for (let m = 0; m < n; m++) if (cost[m] <= M) w++; return w; };
    const pickBest = () => { best = -1; for (const m of front) if (cost[m] <= M) best = m; };
    let inside = 0;
    const bars = [2, 2, 2, 2, 2, 2];

    const ticks: Stroke[] = [];
    for (const c of [50, 100, 150, 200]) ticks.push({ pts: [X(c), BASE, X(c), BASE - 0.03], tone: 'ghost', at: 0.05 });
    for (let l = 0; l >= -3; l--) ticks.push({ pts: [LEFT, Y(l), LEFT - 0.03, Y(l)], tone: 'ghost', at: 0.05 });
    return {
      scene: {
        strokes: [
          { pts: [LEFT, BASE, X(C1), BASE], tone: 'ghost', at: 0 },
          { pts: [LEFT, BASE, LEFT, Y(L1)], tone: 'ghost', at: 0 },
          ...ticks,
          { pts: [X(M0), BASE, X(M0), Y(L1)], tone: 'ink', transient: true, at: 0.3 },
        ],
        labels: [
          ...[50, 100, 150, 200].map((c) => ({ x: X(c), y: BASE - 0.1, text: String(c), tone: 'ghost' as const, align: 'center' as const })),
          { x: X(216), y: BASE - 0.21, text: 'storage, KB', tone: 'ghost', align: 'right' },
          ...['1', '0.1', '0.01', '0.001'].map((s, i) => ({ x: LEFT - 0.06, y: Y(-i), text: s, tone: 'ghost' as const, align: 'right' as const })),
          { x: LEFT + 0.05, y: Y(L1) + 0.07, text: 'error', tone: 'ghost', align: 'left' },
        ],
      },
      update(dt, time) {
        if (n < ALL) {
          acc += dt * (ALL / 1.7);
          const k = Math.min(ALL - n, Math.floor(acc));
          acc -= k;
          for (let i = 0; i < k; i++) evaluate(n++);
          frontier();
          if (n === ALL) passAt = time;
        } else {
          M = M0 - MA * Math.sin((time - passAt) * 0.32);
        }
        pickBest();
        inside = within();
        if (best >= 0) for (let g = 0; g < SIZES.length; g++) bars[g] += (BITS[(best >> (2 * g)) & 3] - bars[g]) * Math.min(1, dt * 9);
      },
      draw(p: Painter, _time, inked) {
        // The cloud: every allocation evaluated so far, tested against the budget.
        const h = (1.05 * Math.max(0.9, p.k)) / p.s; // half a dot, in plate units
        for (let m = 0; m < n; m++) p.rect(px[m] - h, py[m] - h, px[m] + h, py[m] + h, cost[m] <= M ? 'draft' : 'faint', { fill: true });
        for (let m = Math.max(0, n - 40); m < n && n < ALL; m++) p.dot(px[m], py[m], 3, 'draft', { hollow: true, alpha: 0.5 });
        const tone = inked > 0 ? 'ink' : 'draft';
        if (stairs.length > 2) p.poly(stairs, tone, { w: 1.1 });
        const x = X(M);
        p.line(x, BASE, x, Y(L1), tone, { w: 1 });
        const right = M < 136;
        p.text(x + (right ? 0.03 : -0.03), Y(L1) + 0.07, `M = ${fixed(M, 0)}`, 'draft', { math: true, size: 13, align: right ? 'left' : 'right' });
        if (best >= 0) {
          p.dot(px[best], py[best], 4.2, tone, { square: true, hollow: true });
          for (let g = 0, v = best; g < SIZES.length; g++, v >>= 2) {
            const b = BITS[v & 3], x0 = GX + g * (GW + GG);
            p.rect(x0, GY, x0 + GW, GY + (GH * bars[g]) / 8, tone, { w: 0.9 });
            p.text(x0 + GW / 2, GY + (GH * bars[g]) / 8 + 0.05, String(b), 'draft', { align: 'center', size: 10 });
          }
          p.line(GX - 0.03, GY, GX + 6 * GW + 5 * GG + 0.03, GY, 'ghost');
          p.text(GX - 0.03, GY - 0.07, 'bit widths', 'ghost', { size: 10 });
        }
      },
      readings: () => [
        { label: 'Allocations enumerated', value: n === ALL ? `all ${fmt(ALL)}` : fmt(n) },
        { label: 'Within budget', value: fmt(inside), done: passAt >= 0 },
      ],
      settle() {
        while (n < ALL) evaluate(n++);
        frontier();
        passAt = 0;
        pickBest();
        inside = within();
        for (let g = 0; g < SIZES.length; g++) bars[g] = BITS[(best >> (2 * g)) & 3];
      },
    };
  },
};

export default plate;
