// A rounding morphism for additive structure: Sidon subsets and codes (Zenodo 23484825).
// A planar (Singer) difference set: S = {1, 5, 11, 24, 25, 27} in ℤ₃₁, k = 6, m = k(k − 1) + 1 = 31.
// Every nonzero residue is a difference of two elements of S exactly once: the extremal case of the
// paper's bound (t + 1)(k(k − 1) + 1) ≤ m at t = 0. The check walks the 30 ordered differences and
// fills a table of residues; a repeat would be a collision. Then the set translates by one residue
// (a translate of a difference set is a difference set) and the check runs again.
import { arc, TAU, fmt } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const M = 31;
const S0 = [1, 5, 11, 24, 25, 27];
const angle = (r: number) => Math.PI / 2 - (TAU * r) / M; // clockwise from the top
const pos = (r: number, rad = 1) => [rad * Math.cos(angle(r)), rad * Math.sin(angle(r))];

// Difference table: 30 cells in a row under the circle.
const TY = -1.5, TX0 = -1.2, TW = 2.4, CW = TW / 30;

const PAIRS: [number, number][] = [];
for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) PAIRS.push([i, j]);
const ORDER: [number, number][] = [];
for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (i !== j) ORDER.push([i, j]);

const plate: PlateDef = {
  id: 'sidon',
  bounds: [-1.34, -1.72, 1.34, 1.34],
  check: 'Every difference occurs exactly once',
  create() {
    const strokes: Stroke[] = [{ pts: arc(0, 0, 1, 0, TAU, 180), tone: 'draft', at: 0 }];
    for (let r = 0; r < M; r++) {
      const [x0, y0] = pos(r, 1), [x1, y1] = pos(r, r % 5 === 0 ? 1.075 : 1.04);
      strokes.push({ pts: [x0, y0, x1, y1], tone: r % 5 === 0 ? 'draft' : 'faint', at: 0.1 + (r / M) * 0.3 });
    }
    PAIRS.forEach(([i, j], n) => {
      const [x0, y0] = pos(S0[i]), [x1, y1] = pos(S0[j]);
      strokes.push({ pts: [x0, y0, x1, y1], tone: 'ink', w: 0.8, at: 0.3 + (n / PAIRS.length) * 0.25, transient: true });
    });
    for (let d = 0; d < 30; d++) {
      const x = TX0 + d * CW;
      strokes.push({ pts: [x + CW * 0.14, TY, x + CW * 0.86, TY], tone: 'faint', at: 0.6 + d * 0.004 });
    }

    let shift = 0, glide = 0; // the set's translation, and the animated fraction of the next step
    let step = 0, acc = 0, rest = 0;
    let seen = new Uint8Array(31);
    let repeats = 0, lastD = -1, lastPair = -1;
    const checkPair = (k: number) => {
      const [i, j] = ORDER[k];
      const d = (((S0[i] - S0[j]) % M) + M) % M;
      if (seen[d]) repeats++;
      seen[d] = 1;
      return d;
    };

    return {
      scene: {
        strokes,
        dots: S0.map((r) => { const [x, y] = pos(r); return { x, y, r: 3.2, tone: 'ink' as const, transient: true }; }),
        labels: [
          { x: 0, y: 1.19, text: '0', tone: 'ghost', align: 'center' },
          { x: 0, y: 0.02, text: 'ℤ₃₁', tone: 'draft', align: 'center', math: true, size: 17 },
          { x: TX0, y: TY - 0.12, text: '1', tone: 'ghost', align: 'left' },
          { x: TX0 + TW, y: TY - 0.12, text: '30', tone: 'ghost', align: 'right' },
          { x: 0, y: TY + 0.14, text: 'differences mod 31', tone: 'ghost', align: 'center' },
        ],
      },
      update(dt) {
        if (step < ORDER.length) {
          acc += dt;
          while (acc > 0.075 && step < ORDER.length) { acc -= 0.075; lastPair = step; lastD = checkPair(step); step++; }
          return;
        }
        rest += dt;
        if (rest > 2.4) {
          glide = Math.min(1, glide + dt / 0.7);
          if (glide >= 1) { glide = 0; rest = 0; acc = 0; shift = (shift + 1) % M; step = 0; seen = new Uint8Array(31); lastD = -1; lastPair = -1; }
        }
      },
      draw(p: Painter, _t, inked) {
        const e = glide < 0.5 ? 4 * glide ** 3 : 1 - (-2 * glide + 2) ** 3 / 2;
        const s = shift + e;
        const pt = (r: number) => pos(r + s);
        for (const [i, j] of PAIRS) {
          const [x0, y0] = pt(S0[i]), [x1, y1] = pt(S0[j]);
          if (inked < 1) p.line(x0, y0, x1, y1, 'draft', { w: 0.9 });
          if (inked > 0) p.line(x0, y0, x1, y1, 'ink', { w: 0.8, alpha: inked });
        }
        if (lastPair >= 0 && step <= ORDER.length && rest < 0.4) {
          const [i, j] = ORDER[lastPair];
          const [x0, y0] = pt(S0[i]), [x1, y1] = pt(S0[j]);
          p.line(x0, y0, x1, y1, 'ink', { w: 2.4 });
        }
        for (const r of S0) { const [x, y] = pt(r); p.dot(x, y, 3.2, inked > 0 ? 'ink' : 'draft', { hollow: inked === 0 }); }
        for (let d = 1; d <= 30; d++) {
          if (!seen[d]) continue;
          const x = TX0 + (d - 1) * CW;
          p.rect(x + CW * 0.14, TY - 0.04, x + CW * 0.86, TY + 0.04, d === lastD && step < ORDER.length ? 'ink' : 'draft', { fill: true, alpha: d === lastD ? 1 : 0.9 });
        }
      },
      readings: () => [
        { label: 'Differences checked', value: `${fmt(step)} of 30` },
        { label: 'Repeated', value: fmt(repeats), done: step === ORDER.length && repeats === 0 },
      ],
      settle() {
        while (step < ORDER.length) { lastD = checkPair(step); step++; }
        lastD = -1;
      },
    };
  },
};

export default plate;
