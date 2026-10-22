// The inertia of matching cofactor matrices (Zenodo 23484622). The paper's text is not on its record yet,
// so the plate shows only the object it is about: the cube graph Q₃ (8 vertices, 12 edges), drawn in an
// oblique projection with the hidden corner's edges dashed. The check enumerates all C(12, 4) = 495 sets
// of four edges and keeps those that cover all eight vertices, the perfect matchings, dropping each one into
// the row below as it is found. Then the cube shows them one at a time.
import { fmt } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const S = 1.06, DX = 0.46, DY = 0.34; // front square side, receding axis offset (fractions of a side)
const X0 = (-S * (1 + DX)) / 2, Y0 = -0.4;
const corner = (v: number, s = S, ox = X0, oy = Y0) =>
  [ox + s * ((v & 1) + DX * ((v >> 2) & 1)), oy + s * (((v >> 1) & 1) + DY * ((v >> 2) & 1))];
const E: [number, number][] = [];
for (let v = 0; v < 8; v++) for (let b = 0; b < 3; b++) { const w = v ^ (1 << b); if (v < w) E.push([v, w]); }
const HIDDEN = 4; // the corner (0, 0, 1) sits behind the front face
const SUBSETS: number[][] = [];
for (let a = 0; a < 12; a++) for (let b = a + 1; b < 12; b++) for (let c = b + 1; c < 12; c++) for (let d = c + 1; d < 12; d++) SUBSETS.push([a, b, c, d]);
const covers = (s: number[]) => s.reduce((m, e) => m | (1 << E[e][0]) | (1 << E[e][1]), 0) === 255;

// The row of found matchings: small cubes, centred on however many there are.
const MS = 0.15, STEP = 0.262, MY = -1.02;

const plate: PlateDef = {
  id: 'matching',
  bounds: [-1.27, -1.3, 1.27, 1.24],
  check: 'Perfect matchings of the cube, counted',
  create() {
    const strokes: Stroke[] = E.map(([a, b], i) => {
      const [x0, y0] = corner(a), [x1, y1] = corner(b);
      return { pts: [x0, y0, x1, y1], tone: 'draft', dash: a === HIDDEN || b === HIDDEN ? [3, 4] : undefined, at: i * 0.04 };
    });
    let checked = 0, acc = 0, passAt = -1, cen = 0, last = -1;
    const found: { s: number[]; at: number }[] = [];
    const step = (time: number) => {
      const s = SUBSETS[checked++];
      last = checked - 1;
      if (covers(s)) found.push({ s, at: time });
    };
    const edge = (p: Painter, e: number, tone: 'ink' | 'draft' | 'faint', w: number, alpha = 1, to = 1, s = S, ox = X0, oy = Y0) => {
      const [x0, y0] = corner(E[e][0], s, ox, oy), [x1, y1] = corner(E[e][1], s, ox, oy);
      p.poly([x0, y0, x1, y1], tone, { w, alpha, to });
    };
    return {
      scene: {
        strokes,
        dots: Array.from({ length: 8 }, (_, v) => { const [x, y] = corner(v); return { x, y, r: 3.4, tone: 'ink' as const }; }),
        labels: [
          { x: X0 - 0.06, y: Y0 - 0.1, text: 'Q₃', tone: 'draft', align: 'right', math: true, size: 16 },
          { x: 0, y: MY - 0.17, text: 'perfect matchings', tone: 'ghost', align: 'center' },
        ],
      },
      update(dt, time) {
        if (checked < SUBSETS.length) {
          acc += dt * 240;
          while (acc >= 1 && checked < SUBSETS.length) { acc--; step(time); }
          if (checked === SUBSETS.length) passAt = time;
        }
        cen += (found.length - cen) * Math.min(1, dt * 7);
      },
      draw(p: Painter, time, inked) {
        const done = passAt >= 0;
        // Main cube: the set being tested, fresh finds, then the matchings in turn.
        if (!done && last >= 0) for (const e of SUBSETS[last]) edge(p, e, 'faint', 2.6);
        if (!done || inked < 1) {
          for (const f of found) {
            const a = 1 - (time - f.at) / 0.5;
            if (a > 0) for (const e of f.s) edge(p, e, 'draft', 2.6, a);
          }
        }
        let cur = -1;
        if (done && inked > 0 && found.length) {
          const HOLD = 2.1;
          const u = Math.max(0, time - passAt - 0.5);
          cur = Math.floor(u / HOLD) % found.length;
          const f = (u % HOLD) / HOLD;
          const to = u < HOLD ? inked : Math.min(1, f / 0.18);
          const alpha = f > 0.88 ? Math.max(0, 1 - (f - 0.88) / 0.12) : 1;
          for (const e of found[cur].s) edge(p, e, 'ink', 2.8, alpha * inked, to);
        }
        // The row of found matchings.
        const w = MS * (1 + DX);
        found.forEach((f, i) => {
          const ox = (i - (cen - 1) / 2) * STEP - w / 2, oy = MY;
          const age = Math.min(1, (time - f.at) / 0.3);
          for (let e = 0; e < 12; e++) edge(p, e, 'faint', 1.1, age, 1, MS, ox, oy);
          const tone = inked > 0 ? 'ink' : 'draft';
          for (const e of f.s) edge(p, e, tone, i === cur ? 2.2 : 1.5, age * (cur < 0 || i === cur ? 1 : 0.62), 1, MS, ox, oy);
          if (i === cur) p.line(ox, oy - 0.07, ox + w, oy - 0.07, 'ink', { w: 1 });
        });
      },
      readings: () => [
        { label: 'Edge sets checked', value: `${fmt(checked)} of ${fmt(SUBSETS.length)}` },
        { label: 'Perfect matchings', value: fmt(found.length), done: passAt >= 0 },
      ],
      settle() {
        while (checked < SUBSETS.length) step(-9);
        passAt = 0;
        cen = found.length;
      },
    };
  },
};

export default plate;
