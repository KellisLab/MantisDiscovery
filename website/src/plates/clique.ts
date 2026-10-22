// Clique minors and fractional clique covers in graphs with independence number two (Zenodo 23484533).
// The complement of the Petersen graph: ten vertices, thirty edges. Petersen has no triangle, so no three
// vertices of its complement are pairwise non-adjacent. The check tests all 120 triples for independence
// (each one lights the edges inside it), then a backtracking search lists every K₅ minor model with
// branch sets of one or two vertices (2,904 of them): five disjoint connected sets, every two joined by
// an edge. The plate inks the two mirror-image pinwheels among them, alternating, and walks each one's ten
// joining edges. χ = 5 by colouring search, so the minor is a K_χ: Hadwiger's inequality on this graph.
import { fmt, TAU } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const R1 = 1, R2 = 0.46, CY = 0.07;
const ang = (v: number) => Math.PI / 2 - (TAU * (v % 5)) / 5;
const P = Array.from({ length: 10 }, (_, v) => {
  const r = v < 5 ? R1 : R2;
  return [r * Math.cos(ang(v)), CY + r * Math.sin(ang(v))];
});
// Petersen: outer cycle, spokes, inner pentagram. The plate draws every other pair.
const key = (a: number, b: number) => Math.min(a, b) * 10 + Math.max(a, b);
const pet = new Set<number>();
for (let i = 0; i < 5; i++) [key(i, (i + 1) % 5), key(i, i + 5), key(5 + i, 5 + ((i + 2) % 5))].forEach((k) => pet.add(k));
const adj = (a: number, b: number) => a !== b && !pet.has(key(a, b));
const EDGES: [number, number][] = [];
for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) if (adj(a, b)) EDGES.push([a, b]);
const PAIRS: number[][] = [];
for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) PAIRS.push([i, j]);
const TRIPLES: [number, number, number][] = [];
for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) for (let c = b + 1; c < 10; c++) TRIPLES.push([a, b, c]);

const turn = (v: number) => (v < 5 ? (v + 1) % 5 : 5 + ((v - 4) % 5));

/** Every K₅ model whose branch sets have one or two vertices (exhaustive search), as candidate indices. */
function k5Models() {
  const cands: number[][] = [];
  for (let a = 0; a < 10; a++) { cands.push([a]); for (let b = a + 1; b < 10; b++) if (adj(a, b)) cands.push([a, b]); }
  const mask = cands.map((c) => c.reduce((s, v) => s | (1 << v), 0));
  // ok[i][j]: candidates i and j are disjoint and joined by an edge.
  const ok = cands.map((A, i) => cands.map((B, j) => !(mask[i] & mask[j]) && A.some((a) => B.some((b) => adj(a, b)))));
  const models: number[][] = [];
  // Grow cliques of compatible candidates; `allowed` holds the later candidates compatible with all chosen.
  const grow = (chosen: number[], allowed: number[]) => {
    if (chosen.length === 5) { models.push(chosen); return; }
    for (let a = 0; a < allowed.length; a++) {
      const i = allowed[a], next: number[] = [];
      for (let b = a + 1; b < allowed.length; b++) if (ok[i][allowed[b]]) next.push(allowed[b]);
      if (chosen.length + 1 + next.length >= 5) grow([...chosen, i], next);
    }
  };
  grow([], cands.map((_, i) => i));
  // The rotation of the drawing, acting on candidates.
  const rot = cands.map((c) => mask.indexOf(c.reduce((s, v) => s | (1 << turn(v)), 0)));
  return { cands, models, rot };
}
/** Smallest k with a proper k-colouring. */
function chromatic() {
  for (let k = 1; k <= 10; k++) {
    const col = new Int8Array(10).fill(-1);
    const go = (v: number): boolean => {
      if (v === 10) return true;
      for (let c = 0; c < k; c++) {
        let ok = true;
        for (let u = 0; u < v && ok; u++) if (adj(u, v) && col[u] === c) ok = false;
        if (ok) { col[v] = c; if (go(v + 1)) return true; }
      }
      col[v] = -1;
      return false;
    };
    if (go(0)) return k;
  }
  return 10;
}
const len = (a: number, b: number) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);

/** A stadium around the segment a-b (a ring when a = b). */
function hull(a: number, b: number, r: number) {
  const [ax, ay] = P[a], [bx, by] = P[b];
  const t0 = a === b ? 0 : Math.atan2(by - ay, bx - ax);
  const pts: number[] = [];
  for (let i = 0; i <= 16; i++) { const t = t0 + Math.PI / 2 + (Math.PI * i) / 16; pts.push(ax + r * Math.cos(t), ay + r * Math.sin(t)); }
  for (let i = 0; i <= 16; i++) { const t = t0 - Math.PI / 2 + (Math.PI * i) / 16; pts.push(bx + r * Math.cos(t), by + r * Math.sin(t)); }
  pts.push(pts[0], pts[1]);
  return pts;
}

const plate: PlateDef = {
  id: 'clique',
  bounds: [-1.3, -1.3, 1.3, 1.3],
  check: 'No three vertices are independent',
  create() {
    const { cands, models: all, rot } = k5Models();
    const sets = (m: number[]) => m.map((i) => cands[i]);
    const twist = (m: number[]) => Math.max(...(sets(m).find((s) => s.includes(0)) ?? [0]));
    const spokes = (m: number[]) => sets(m).reduce((t, s) => t + len(s[0], s[s.length - 1]), 0);
    const sym = all.filter((m) => m.every((i) => m.includes(rot[i])));
    // Of the models the search finds, show the rotation-symmetric ones with the shortest branch sets
    // (two mirror-image pinwheels), alternating.
    const short = Math.min(...sym.map(spokes));
    const shown = (sym.length ? sym.filter((m) => spokes(m) < short + 1e-9).sort((a, b) => twist(a) - twist(b)) : all.slice(0, 2)).map(sets);
    const models = shown.map((sets) => {
      const links: [number, number][] = [];
      for (const [i, j] of PAIRS) {
        let best: [number, number] | null = null, score = Infinity;
        for (const a of sets[i]) for (const b of sets[j]) {
          if (!adj(a, b)) continue;
          const s = len(a, b) + ((a < 5) === (b < 5) ? 0 : 9); // keep links on the rings when possible
          if (s < score) { score = s; best = [a, b]; }
        }
        links.push(best!);
      }
      return { sets, links, hulls: sets.map((s) => hull(s[0], s[s.length - 1], 0.085)) };
    });
    const chi = chromatic();

    const strokes: Stroke[] = EDGES.map(([a, b], i) => ({
      pts: [P[a][0], P[a][1], P[b][0], P[b][1]], tone: (a < 5) === (b < 5) ? 'draft' : 'faint', w: 0.9, at: (i / EDGES.length) * 0.5,
    }));

    let tested = 0, indep = 0, acc = 0, passAt = -1;
    const trail: { k: number; born: number }[] = [];
    const test = (k: number) => { const [a, b, c] = TRIPLES[k]; if (!adj(a, b) && !adj(b, c) && !adj(a, c)) indep++; };

    return {
      scene: {
        strokes,
        dots: P.map(([x, y]) => ({ x, y, r: 3.4, tone: 'ink' as const })),
        labels: [{ x: 0, y: -1.13, text: `α = 2,  χ = ${chi}`, tone: 'draft', align: 'center', math: true }],
      },
      update(dt, time) {
        if (tested < TRIPLES.length) {
          acc += dt * 72;
          while (acc >= 1 && tested < TRIPLES.length) { acc--; test(tested); trail.push({ k: tested, born: time }); tested++; }
          if (tested === TRIPLES.length) passAt = time;
        }
        while (trail.length && time - trail[0].born > 0.32) trail.shift();
      },
      draw(p: Painter, time, inked) {
        for (const { k, born } of trail) {
          const f = 1 - (time - born) / 0.32;
          const [a, b, c] = TRIPLES[k];
          for (const [u, v] of [[a, b], [b, c], [a, c]]) if (adj(u, v)) p.line(P[u][0], P[u][1], P[v][0], P[v][1], 'ink', { w: 1.4, alpha: f * 0.85 });
          for (const v of [a, b, c]) p.dot(P[v][0], P[v][1], 7, 'draft', { hollow: true, alpha: f });
        }
        if (passAt < 0 || inked <= 0) return;
        // The models, one at a time: draw in, hold, fade.
        const HOLD = 4.6;
        const u = Math.max(0, time - passAt - 0.7);
        const m = models[Math.floor(u / HOLD) % models.length];
        const f = (u % HOLD) / HOLD;
        const first = u < HOLD;
        const to = first ? Math.min(inked, 1) : Math.min(1, f / 0.16);
        const alpha = inked * (f > 0.9 ? Math.max(0, 1 - (f - 0.9) / 0.1) : 1);
        // While a model holds, walk its ten links: each pair of branch sets and the edge joining them.
        const h = f >= 0.18 && f < 0.88 ? Math.floor((f - 0.18) / 0.07) : -1;
        m.links.forEach(([a, b], n) => p.poly([P[a][0], P[a][1], P[b][0], P[b][1]], 'ink', { w: n === h ? 2.3 : 1.05, alpha, to }));
        m.sets.forEach((s, i) => {
          const lit = h >= 0 && PAIRS[h].includes(i);
          p.poly(m.hulls[i], 'ink', { w: lit ? 1 : 0.7, alpha: alpha * (lit ? 0.85 : 0.42), to });
          if (s.length === 2) p.poly([P[s[0]][0], P[s[0]][1], P[s[1]][0], P[s[1]][1]], 'ink', { w: 2.6, alpha, to });
        });
      },
      readings: () => [
        { label: 'Triples checked', value: `${fmt(tested)} of ${fmt(TRIPLES.length)}` },
        { label: 'Independent triples', value: fmt(indep), done: tested === TRIPLES.length && indep === 0 },
      ],
      settle() {
        while (tested < TRIPLES.length) test(tested++);
        passAt = 0;
      },
    };
  },
};

export default plate;
