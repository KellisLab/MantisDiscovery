// Sharp reach bounds and quantitative localization for opaque sets, in 3D.
// The unit square is a slab; a barrier is a fence of walls standing on it.
//   1  lines through the square, as beams, all stop on the classic fence (length √2 + √6/2)
//   2  the theorem: a set through two adjacent corners has length plus hull distances ≥ √2 + √6/2,
//      met exactly by the classic fence's Steiner tree on three corners
//   3  the 105 + 45 cases checked in exact arithmetic, as tiles turning over
//   4  the open gap between the best lower bound (2.00006, as cited in the paper) and the shortest known fence
import type { ReactNode } from 'react';
import { Group3D, Mesh, useCurrentFrame } from 'remotion';
import { C, beat, easeInOut, easeOut, label, lerp, prog, rng } from './kit';
import { Lights, Rod, Stage, Wall, mix3, orbit, type Cam, type Material, type V3 } from './kit3d';
import { TIMING } from './timing';

const MINT = '#3ddbb4';
const SKY = '#62d0ff';
const T = TIMING.opaque;
const [B1, B2, B3, B4] = T.beats;
export const OPAQUE_FRAMES = T.frames;

export type P = [number, number];
export const S = 2.6; // side of the square in world units
export const W = ([x, y]: P, h = 0): V3 => [(x - 0.5) * S, h, (0.5 - y) * S];
const A: P = [0, 0], B: P = [1, 0], Cc: P = [1, 1], D: P = [0, 1], M: P = [0.5, 0.5];
const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// The Fermat point of A, B, C (Weiszfeld): the centre of the classic fence's Steiner tree.
const F: P = (() => {
  let p: P = [0.7, 0.3];
  for (let i = 0; i < 200; i++) {
    let wx = 0, wy = 0, w = 0;
    for (const q of [A, B, Cc]) { const d = Math.max(1e-9, dist(p, q)); wx += q[0] / d; wy += q[1] / d; w += 1 / d; }
    p = [wx / w, wy / w];
  }
  return p;
})();
const FENCE: [P, P][] = [[F, A], [F, B], [F, Cc], [D, M]];
const LAMBDA = Math.SQRT2 + Math.sqrt(6) / 2;
const WALL_H = 0.17;

// Lines through the square, each entering from outside, with the first point where it meets the fence.
type Ray = { from: P; to: P; at: number };
const RAYS: Ray[] = (() => {
  const r = rng(7), out: Ray[] = [];
  while (out.length < 30) {
    const th = r() * Math.PI * 2, c: P = [0.1 + 0.8 * r(), 0.1 + 0.8 * r()];
    const d: P = [Math.cos(th), Math.sin(th)];
    // where the line leaves the square going backwards: the entry point
    let tIn = -Infinity;
    for (const k of [0, 1] as const) {
      if (Math.abs(d[k]) < 1e-9) continue;
      const t0 = (0 - c[k]) / d[k], t1 = (1 - c[k]) / d[k];
      tIn = Math.max(tIn, Math.min(t0, t1));
    }
    const entry: P = [c[0] + tIn * d[0], c[1] + tIn * d[1]];
    let best = Infinity, hit: P | null = null;
    for (const [p, q] of FENCE) {
      const ex = q[0] - p[0], ey = q[1] - p[1];
      const den = d[0] * ey - d[1] * ex;
      if (Math.abs(den) < 1e-12) continue;
      const t = ((p[0] - entry[0]) * ey - (p[1] - entry[1]) * ex) / den, u = ((p[0] - entry[0]) * d[1] - (p[1] - entry[1]) * d[0]) / den;
      if (t >= 0 && u >= 0 && u <= 1 && t < best) { best = t; hit = [entry[0] + t * d[0], entry[1] + t * d[1]]; }
    }
    if (!hit || best < 0.06) continue;
    out.push({ from: [entry[0] - 0.28 * d[0], entry[1] - 0.28 * d[1]], to: hit, at: B1 + 24 + out.length * 3.6 });
  }
  return out;
})();

// Beat 2: a set K through the two bottom corners, its convex hull, and the hull's distances to the top corners.
const K: P[] = [A, [0.26, 0.3], [0.66, 0.24], B];
const segDist = (p: P, a: P, b: P): [number, P] => {
  const vx = b[0] - a[0], vy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy)));
  const q: P = [a[0] + t * vx, a[1] + t * vy];
  return [dist(p, q), q];
};
const hullDist = (p: P, hull: P[]): [number, P] => {
  let best: [number, P] = [Infinity, p];
  for (let i = 0; i < hull.length; i++) { const r = segDist(p, hull[i], hull[(i + 1) % hull.length]); if (r[0] < best[0]) best = r; }
  return best;
};
const lenK = K.slice(1).reduce((s, p, i) => s + dist(K[i], p), 0);
const [dC, qC] = hullDist(Cc, K), [dD, qD] = hullDist(D, K);
const lenTree = dist(F, A) + dist(F, B) + dist(F, Cc);
const [dD2] = hullDist(D, [A, B, Cc]);

// Beat 3: 150 square tiles, 15 x 10, centred on the square and turned over in a sweep; the first 105 are
// six-leaf topologies, the other 45 five/four-leaf pairs.
const CELL = S / 15;
const TILES = Array.from({ length: 150 }, (_, i) => {
  const col = i % 15, row = Math.floor(i / 15);
  return { i, pos: [(col + 0.5) * CELL - S / 2, 0, (row + 0.5 - 5) * CELL] as V3, at: B3 + 22 + (col + row * 1.6) * 3.1, six: i < 105 };
});

// The camera holds a pose per beat and eases between them; the last pose is the first, so the loop is seamless.
const POSES: { at: number; target: V3; radius: number; height: number; deg: number }[] = [
  { at: B1, target: [0, 0, 0.15], radius: 4.9, height: 3.5, deg: -24 },
  { at: B2, target: [0, 0, 0.05], radius: 3.2, height: 5.4, deg: -8 },
  { at: B3, target: [0, 0, 0.15], radius: 4.5, height: 2.7, deg: 22 },
  { at: B4, target: [0, 0.7, 0.6], radius: 5.2, height: 1.6, deg: 2 },
  { at: T.frames, target: [0, 0, 0.15], radius: 4.9, height: 3.5, deg: -24 },
];
function camAt(f: number): Cam {
  let i = 0;
  while (i < POSES.length - 2 && f >= POSES[i + 1].at) i++;
  const a = POSES[i], b = POSES[i + 1];
  const t = easeInOut(prog(f, b.at - 34, b.at + 10)), drift = (f - a.at) * 0.035;
  return orbit(mix3(a.target, b.target, t), lerp(a.radius, b.radius, t), lerp(a.height, b.height, t), lerp(a.deg + drift, b.deg, t), 33);
}

const mat = {
  slab: { color: '#0d1118', roughness: 0.92 } as Material,
  grid: { color: '#1b2230', unlit: true } as Material,
  edge: { color: C.pencil, unlit: true, opacity: 0.55 } as Material,
  wall: { color: MINT, roughness: 0.38, metallic: 0.05, emissive: MINT, emissiveIntensity: 0.08 } as Material,
  pencil: (o: number) => ({ color: C.pencil, unlit: true, opacity: o }) as Material,
  ink: { color: C.ink, roughness: 0.35 } as Material,
};

export function Slab() {
  const g: ReactNode[] = [];
  for (let k = 1; k < 10; k++) {
    g.push(<Rod key={`x${k}`} a={W([k / 10, 0], 0.001)} b={W([k / 10, 1], 0.001)} radius={0.0022} material={mat.grid} segments={6} />);
    g.push(<Rod key={`y${k}`} a={W([0, k / 10], 0.001)} b={W([1, k / 10], 0.001)} radius={0.0022} material={mat.grid} segments={6} />);
  }
  const corners: P[] = [A, B, Cc, D];
  return (
    <>
      <Mesh geometry={{ kind: 'box', width: S, height: 0.08, depth: S }} material={mat.slab} position={[0, -0.04, 0]} receiveShadow />
      {g}
      {corners.map((p, i) => <Rod key={i} a={W(p, 0.002)} b={W(corners[(i + 1) % 4], 0.002)} radius={0.004} material={mat.edge} segments={6} />)}
    </>
  );
}

/** Walls along segments, each rising over [a, a + 24] and sinking over [b - 18, b]. */
function Fence({ segs, f, a, b, material = mat.wall }: { segs: [P, P][]; f: number; a: number; b: number; material?: Material }) {
  return (
    <>
      {segs.map(([p, q], i) => {
        const up = easeOut(prog(f, a + i * 5, a + 24 + i * 5)), down = 1 - easeInOut(prog(f, b - 18, b));
        const h = WALL_H * Math.min(up, down);
        return <Wall key={i} a={W(p)} b={W(q)} h={h} t={0.034} material={material} />;
      })}
    </>
  );
}

function Beams({ f }: { f: number }) {
  if (f < B1 || f > B2 + 4) return null;
  const out = 1 - prog(f, B2 - 20, B2);
  return (
    <>
      {RAYS.map((r, i) => {
        const t = easeOut(prog(f, r.at, r.at + 16));
        if (t <= 0) return null;
        const head: P = [lerp(r.from[0], r.to[0], t), lerp(r.from[1], r.to[1], t)];
        const linger = 1 - 0.75 * prog(f, r.at + 34, r.at + 70);
        const o = 0.85 * linger * out;
        return (
          <Group3D key={i}>
            <Rod a={W(r.from, 0.012)} b={W(head, 0.012)} radius={0.0042} material={mat.pencil(o)} segments={6} />
            {t >= 1 && <Mesh geometry={{ kind: 'sphere', radius: 0.022, segments: 16, rings: 10 }} material={{ ...mat.ink, opacity: Math.min(1, 0.4 + linger) * out }} position={W(r.to, 0.03)} />}
          </Group3D>
        );
      })}
    </>
  );
}

/** A dashed rod from a to b, drawn on to t. */
function Dashed({ a, b, t, material, y = 0.02 }: { a: P; b: P; t: number; material: Material; y?: number }) {
  const n = Math.max(2, Math.round(dist(a, b) * 26)), out: ReactNode[] = [];
  for (let k = 0; k < n; k++) {
    const s0 = k / n, s1 = (k + 0.55) / n;
    if (s0 >= t) break;
    const e = Math.min(s1, t);
    out.push(<Rod key={k} a={W([lerp(a[0], b[0], s0), lerp(a[1], b[1], s0)], y)} b={W([lerp(a[0], b[0], e), lerp(a[1], b[1], e)], y)} radius={0.0065} material={material} segments={6} />);
  }
  return <>{out}</>;
}

/** A convex region on the slab (a hull), hatched with fine rods so it reads as filled from any angle. */
function Hatch({ poly, alpha, step = 0.022 }: { poly: P[]; alpha: number; step?: number }) {
  if (alpha <= 0.01) return null;
  const ys = poly.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), out: ReactNode[] = [];
  for (let y = y0 + step / 2, k = 0; y < y1; y += step, k++) {
    const xs: number[] = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) xs.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    xs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < xs.length; j += 2) out.push(<Rod key={`${k}-${j}`} a={W([xs[j], y], 0.004)} b={W([xs[j + 1], y], 0.004)} radius={0.0026} material={{ color: MINT, unlit: true, opacity: 0.32 * alpha }} segments={5} />);
  }
  return <>{out}</>;
}

function Theorem({ f }: { f: number }) {
  if (f < B2 - 2 || f > B3 + 4) return null;
  const end = B3;
  const morph = easeInOut(prog(f, B2 + 92, B2 + 128));
  const kSegs: [P, P][] = K.slice(1).map((p, i) => [K[i], p]);
  const hullK = 1 - morph, hullT = morph;
  const dash = easeOut(prog(f, B2 + 44, B2 + 70));
  const leave = 1 - prog(f, end - 16, end);
  return (
    <>
      <Fence segs={kSegs} f={f} a={B2 + 10} b={B2 + 128} />
      <Fence segs={FENCE.slice(0, 3)} f={f} a={B2 + 104} b={end} />
      <Hatch poly={K} alpha={easeOut(prog(f, B2 + 30, B2 + 48)) * hullK * leave} />
      <Hatch poly={[A, B, Cc]} alpha={hullT * leave} />
      {hullK > 0.02 && <Dashed a={Cc} b={qC} t={dash} material={{ color: SKY, unlit: true, opacity: hullK * leave }} />}
      {hullK > 0.02 && <Dashed a={D} b={qD} t={dash} material={{ color: C.pencil, unlit: true, opacity: hullK * leave }} />}
      {hullT > 0.02 && <Dashed a={D} b={M} t={1} material={{ color: C.pencil, unlit: true, opacity: hullT * leave }} />}
      {[A, B, Cc, D].map((p, i) => <Mesh key={i} geometry={{ kind: 'sphere', radius: 0.03, segments: 16, rings: 10 }} material={{ ...mat.ink, opacity: leave }} position={W(p, 0.03)} />)}
    </>
  );
}

function Tiles({ f }: { f: number }) {
  if (f < B3 - 2 || f > B4 + 4) return null;
  const size = CELL - 0.03, rise = easeOut(prog(f, B3 + 4, B3 + 24)), leave = 1 - easeInOut(prog(f, B4 - 14, B4 + 2));
  return (
    <>
      {TILES.map((t) => {
        const turn = easeInOut(prog(f, t.at, t.at + 16));
        const lift = Math.sin(turn * Math.PI) * 0.16;
        const col = t.six ? MINT : SKY;
        const s = rise * leave;
        if (s <= 0.01) return null;
        return (
          <Group3D key={t.i} position={[t.pos[0], 0.02 + lift, t.pos[2]]} rotation={[turn * 180, 0, 0]} scale={[s, s, s]}>
            <Mesh geometry={{ kind: 'box', width: size, height: 0.012, depth: size }} material={{ color: '#2a3140', roughness: 0.6 }} position={[0, 0.006, 0]} castShadow />
            <Mesh geometry={{ kind: 'box', width: size, height: 0.012, depth: size }} material={{ color: col, roughness: 0.4, emissive: col, emissiveIntensity: 0.1 }} position={[0, -0.006, 0]} />
          </Group3D>
        );
      })}
    </>
  );
}

// Beat 4: the number line, floating above the near edge of the square.
const NL = { lo: 1.9, hi: 2.8, x0: -1.1, x1: 1.1, y: 1.35, z: 1.2 };
const nx = (v: number) => lerp(NL.x0, NL.x1, (v - NL.lo) / (NL.hi - NL.lo));
function Gap({ f }: { f: number }) {
  if (f < B4 - 2) return null;
  const t = easeOut(prog(f, B4 + 6, B4 + 34)), g = easeOut(prog(f, B4 + 30, B4 + 62)), leave = 1 - easeInOut(prog(f, T.frames - 30, T.frames - 6));
  const line = { color: C.pencil, unlit: true, opacity: 0.8 * leave } as Material;
  const lo = nx(2.00006), hi = nx(LAMBDA);
  return (
    <>
      <Rod a={[NL.x0, NL.y, NL.z]} b={[lerp(NL.x0, NL.x1, t), NL.y, NL.z]} radius={0.005} material={line} segments={6} />
      {[2.0, 2.2, 2.4, 2.6, 2.8].map((v) => t > (nx(v) - NL.x0) / (NL.x1 - NL.x0) && <Rod key={v} a={[nx(v), NL.y - 0.05, NL.z]} b={[nx(v), NL.y + 0.05, NL.z]} radius={0.004} material={line} segments={6} />)}
      {g > 0.01 && <Mesh geometry={{ kind: 'box', width: 1, height: 1, depth: 1 }} material={{ color: MINT, roughness: 0.3, opacity: 0.13 * leave, emissive: MINT, emissiveIntensity: 0.2 }}
        position={[lo + ((hi - lo) * g) / 2, NL.y, NL.z]} scale={[Math.max(0.001, (hi - lo) * g), 0.15, 0.15]} />}
      <Rod a={[lo, NL.y, NL.z]} b={[lo, NL.y + 0.28 * Math.max(t, 0.01), NL.z]} radius={0.009} material={{ ...mat.ink, opacity: leave }} segments={10} />
      {g > 0.98 && <Rod a={[hi, NL.y, NL.z]} b={[hi, NL.y + 0.28, NL.z]} radius={0.009} material={{ ...mat.wall, opacity: leave }} segments={10} />}
      <Fence segs={FENCE} f={f} a={B4 + 10} b={T.frames - 8} />
    </>
  );
}


function overlay(ctx: CanvasRenderingContext2D, project: (p: V3) => [number, number, number], f: number) {
  const b1 = beat(f, B1, B2), b2 = beat(f, B2, B3), b3 = beat(f, B3, B4), b4 = beat(f, B4, T.frames);
  const X = 72, Y = 1000;
  if (b1.alpha > 0) {
    const shown = RAYS.filter((r) => f >= r.at + 16).length;
    ctx.globalAlpha = b1.alpha;
    label(ctx, `lines ${String(shown).padStart(2, '0')}`, X, Y, C.pencil);
    label(ctx, 'missed 0', X + 230, Y, MINT);
    label(ctx, `fence √2 + √6/2 = ${LAMBDA.toFixed(4)}`, 1008, Y, C.muted, 'right', 26);
  }
  if (b2.alpha > 0) {
    const morph = easeInOut(prog(f, B2 + 92, B2 + 128)), grow = easeOut(prog(f, B2 + 52, B2 + 84));
    const parts = [lerp(lenK, lenTree, morph), lerp(dC, 0, morph), lerp(dD, dD2, morph)];
    const rx = X, rw = 936, scale = rw / 3.2, ry = 958;
    ctx.globalAlpha = b2.alpha;
    ctx.fillStyle = 'rgba(236,238,234,0.10)'; ctx.fillRect(rx, ry, rw, 8);
    let x = rx;
    parts.forEach((v, i) => { const w = v * scale * grow; ctx.fillStyle = [MINT, SKY, C.pencil][i]; ctx.fillRect(x, ry, w, 8); x += w; });
    const lx = rx + LAMBDA * scale;
    ctx.fillStyle = C.ink; ctx.fillRect(lx - 1, ry - 16, 2, 40);
    label(ctx, '√2 + √6/2', lx, ry - 26, C.ink, 'center', 26);
    label(ctx, (parts.reduce((s, v) => s + v, 0) * grow).toFixed(4), rx, ry + 62, MINT, 'left', 30);
    label(ctx, 'length', rx + 170, ry + 62, MINT, 'left', 26);
    label(ctx, '+ d(C)', rx + 300, ry + 62, SKY, 'left', 26);
    label(ctx, '+ d(D)', rx + 430, ry + 62, C.pencil, 'left', 26);
    if (morph > 0.96) label(ctx, 'equality', rx + rw, ry + 62, C.ink, 'right', 26);
    // the corner names, anchored to the square
    const names: [P, string][] = [[A, 'A'], [B, 'B'], [Cc, 'C'], [D, 'D']];
    for (const [p, n] of names) {
      const [cx, cy] = project(W(p, 0.04));
      const ox = p[0] < 0.5 ? -26 : 26, oy = p[1] < 0.5 ? 34 : -18;
      label(ctx, n, cx + ox, cy + oy, C.muted, 'center', 28);
    }
  }
  if (b3.alpha > 0) {
    const done = TILES.filter((t) => f >= t.at + 16), six = done.filter((t) => t.six).length, pairs = done.length - six;
    ctx.globalAlpha = b3.alpha;
    label(ctx, `six-leaf topologies ${String(six).padStart(3, ' ')} / 105`, X, Y - 44, MINT);
    label(ctx, `five/four-leaf pairs ${String(pairs).padStart(2, ' ')} / 45`, X, Y, SKY);
    label(ctx, 'exact arithmetic', 1008, Y, C.muted, 'right', 26);
  }
  if (b4.alpha > 0) {
    const t = easeOut(prog(f, B4 + 6, B4 + 34)), g = easeOut(prog(f, B4 + 30, B4 + 62));
    ctx.globalAlpha = b4.alpha;
    for (const v of [2.0, 2.2, 2.4, 2.6, 2.8]) {
      if (t <= (nx(v) - NL.x0) / (NL.x1 - NL.x0)) continue;
      const [x, y] = project([nx(v), NL.y - 0.05, NL.z]);
      label(ctx, v.toFixed(1), x, y + 38, C.muted, 'center', 26);
    }
    const [lx, ly] = project([nx(2.00006), NL.y + 0.28, NL.z]), [hx, hy] = project([nx(LAMBDA), NL.y + 0.28, NL.z]);
    label(ctx, '2.00006', lx, ly - 18, C.ink, 'center', 30);
    label(ctx, 'best lower bound', lx, ly - 58, C.muted, 'center', 24);
    if (g > 0.98) {
      label(ctx, LAMBDA.toFixed(4), hx, hy - 18, MINT, 'center', 30);
      label(ctx, 'shortest known fence', hx, hy - 58, C.muted, 'center', 24);
    }
    if (g > 0.5) {
      const [mx, my] = project([(nx(2.00006) + nx(LAMBDA)) / 2, NL.y + 0.12, NL.z]);
      ctx.globalAlpha = b4.alpha * prog(g, 0.5, 1);
      label(ctx, 'open', mx, my - 6, MINT, 'center', 32);
    }
  }
  ctx.globalAlpha = 1;
}

export const Opaque = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <Stage cam={cam} overlay={(ctx, project) => overlay(ctx, project, f)}>
      <Lights />
      <Slab />
      <Fence segs={FENCE} f={f} a={B1} b={B2 + 18} />
      <Beams f={f} />
      <Theorem f={f} />
      <Tiles f={f} />
      <Gap f={f} />
    </Stage>
  );
};

