// Clique minors in graphs with independence number two: the paper's computer-verified K56 model in H, the
// complement of the Higman-Sims graph, drawn from the certificate files (src/data/hs.json).
//   1  100 vertices; 44 branch sets are pairs joined by an edge of H, 12 are single vertices; each pair contracts
//   2  every one of the C(56, 2) = 1,540 pairs of branch sets is checked for an edge of H between them, in the
//      verifier's order, until all of them touch
//   3  the negative control: swap vertices 1 and 4 and the check stops at the first missing touch, pair (0, 23)
// The placement on a sphere is schematic: it is not a drawing of H.
import { Mesh, useCurrentFrame } from 'remotion';
import hs from './data/hs.json';
import { C, beat, easeInOut, easeOut, label, lerp, mono, prog, rgba, rng } from './kit';
import { Lights, Rod, Stage, mix3, orbit, type Material, type V3 } from './kit3d';
import { TIMING } from './timing';

const AMBER = '#ffb547';
const CORAL = '#ff8a5c';
const T = TIMING.clique;
const [B1, B2, B3] = T.beats;
export const CLIQUE_FRAMES = T.frames;

const R = 1.12;
const N = hs.branches.length; // 56
const PAIRS = (N * (N - 1)) / 2; // 1,540

// Branch nodes on a Fibonacci sphere; a pair's two vertices sit either side of their node until they contract.
const r = rng(5);
const NODES = hs.branches.map((_, i) => {
  const y = 1 - (2 * (i + 0.5)) / N, rad = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
  const p: V3 = [Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R];
  // a tangent direction for the pair's spread
  const a = r() * Math.PI * 2, n: V3 = [p[0] / R, p[1] / R, p[2] / R];
  const u0: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const t1 = norm(cross(n, u0)), t2 = cross(n, t1);
  const t: V3 = [Math.cos(a) * t1[0] + Math.sin(a) * t2[0], Math.cos(a) * t1[1] + Math.sin(a) * t2[1], Math.cos(a) * t1[2] + Math.sin(a) * t2[2]];
  return { p, t };
});
function cross(a: V3, b: V3): V3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a: V3): V3 { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
const add = (a: V3, b: V3, s: number): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const SPREAD = 0.095;

// The pairs in the verifier's order: (0, 1), (0, 2), ..., (54, 55).
const ORDER: [number, number][] = [];
for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) ORDER.push([i, j]);
const CHECK = { a: B2 + 12, b: B2 + 182 };
const checkedAt = (f: number) => Math.floor(Math.min(1, Math.max(0, (f - CHECK.a) / (CHECK.b - CHECK.a))) * PAIRS);

// The negative control.
const [SV1, SV4] = hs.swap.vertices; // 1 and 4
const [BR0, BR12] = hs.swap.branches; // branch 0 = {1}, branch 12 = {4, 86}
const [FAIL_A, FAIL_B] = hs.swap.firstFailingPair; // (0, 23)
const SWAP = { split: B3 + 18, a: B3 + 40, b: B3 + 78, join: B3 + 100 };
const RECHECK = { a: B3 + 108, step: 2.6 };
const FAIL_AT = RECHECK.a + (FAIL_B - 1) * RECHECK.step;

const mat = {
  vertex: { color: C.ink, roughness: 0.35 } as Material,
  link: (o: number) => ({ color: AMBER, roughness: 0.4, emissive: AMBER, emissiveIntensity: 0.15, opacity: o }) as Material,
};

/** Where vertex k of branch b sits at frame f, before any swap (contraction, and branch 12 opening in beat 3). */
function slot(b: number, k: number, f: number): V3 {
  const node = NODES[b], size = hs.branches[b].length;
  const contract = easeInOut(prog(f, B1 + 92, B1 + 150));
  let spread = size === 2 ? SPREAD * (1 - contract) : 0;
  const open = easeInOut(prog(f, SWAP.split - 14, SWAP.split)) * (1 - easeInOut(prog(f, SWAP.join, SWAP.join + 16)));
  if (b === BR12) spread = Math.max(spread, SPREAD * 1.4 * open);
  return size === 1 ? node.p : add(node.p, node.t, k === 0 ? -spread : spread);
}

/** Every vertex's position at frame f: vertices 1 and 4 trade places on arcs over the sphere in beat 3. */
function positions(f: number) {
  const pos = new Map<number, V3>();
  hs.branches.forEach((members, b) => members.forEach((v, k) => pos.set(v, slot(b, k, f))));
  const t = easeInOut(prog(f, SWAP.a, SWAP.b));
  if (t > 0) {
    const a = slot(BR0, 0, f), c = slot(BR12, 0, f), lift = Math.sin(t * Math.PI) * 0.35;
    const arc = (p: V3, q: V3): V3 => { const m = mix3(p, q, t), l = Math.hypot(...m) || 1; return add(m, m, lift / l); };
    pos.set(SV1, arc(a, c));
    pos.set(SV4, arc(c, a));
  }
  return pos;
}

function Graph({ f }: { f: number }) {
  const pos = positions(f);
  const contract = easeInOut(prog(f, B1 + 92, B1 + 150));
  const leave = 1 - easeInOut(prog(f, T.frames - 24, T.frames - 4));
  const hot = f > SWAP.split - 20 && f < SWAP.join + 24;
  const out = [];
  let idx = 0;
  for (let b = 0; b < N; b++) {
    const members = hs.branches[b];
    for (const v of members) {
      const s = easeOut(prog(f, B1 + 4 + idx * 0.4, B1 + 22 + idx * 0.4)) * leave;
      idx++;
      if (s <= 0.01) continue;
      const radius = lerp(0.03, members.length === 2 ? 0.046 : 0.04, contract);
      const swapped = hot && (v === SV1 || v === SV4);
      out.push(<Mesh key={v} geometry={{ kind: 'sphere', radius, segments: 20, rings: 12 }} material={swapped ? { color: CORAL, roughness: 0.35, emissive: CORAL, emissiveIntensity: 0.2 } : mat.vertex} position={pos.get(v)!} scale={s} />);
    }
    if (members.length === 2) {
      // the edge of H that keeps a pair connected; branch 12 shows its new edge, {1, 86}, while it is open
      const drawn = easeOut(prog(f, B1 + 34 + b * 0.6, B1 + 58 + b * 0.6));
      let o = Math.min(drawn, 1 - prog(f, B1 + 140, B1 + 150)) * leave, ends: [number, number] = [members[0], members[1]], t = drawn;
      if (b === BR12 && f > SWAP.split - 14) {
        const after = f >= SWAP.b;
        ends = after ? [SV1, members[1]] : [members[0], members[1]];
        o = (after ? easeOut(prog(f, SWAP.b, SWAP.b + 10)) * (1 - easeInOut(prog(f, SWAP.join, SWAP.join + 14))) : easeOut(prog(f, SWAP.split - 14, SWAP.split)) * (1 - prog(f, SWAP.a, SWAP.a + 8))) * leave;
        t = 1;
      }
      if (o > 0.01) out.push(<Rod key={`l${b}`} a={pos.get(ends[0])!} b={mix3(pos.get(ends[0])!, pos.get(ends[1])!, t)} radius={0.011} material={mat.link(o)} segments={10} />);
    }
  }
  return <>{out}</>;
}


/** K with a subscript, set in the mono face. */
function kn(ctx: CanvasRenderingContext2D, n: string, x: number, y: number, color: string, size = 30) {
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.font = `400 ${size}px ${mono}`;
  ctx.fillText('K', x, y);
  const w = ctx.measureText('K').width;
  ctx.font = `400 ${Math.round(size * 0.68)}px ${mono}`;
  ctx.fillText(n, x + w + 1, y + size * 0.22);
}

function overlay(ctx: CanvasRenderingContext2D, project: (p: V3) => [number, number, number], f: number) {
  const X = 72, Y = 1000;
  const pts = NODES.map((n) => project(n.p));
  const depths = pts.map((p) => p[2]), dMin = Math.min(...depths), dMax = Math.max(...depths);
  const near = (d: number) => 1 - (d - dMin) / Math.max(1e-6, dMax - dMin);

  // the chords: every pair checked so far
  const n = checkedAt(f);
  const fade = 1 - 0.86 * easeInOut(prog(f, B3 + 2, B3 + 16));
  const leave = 1 - easeInOut(prog(f, T.frames - 24, T.frames - 4));
  if (n > 0) {
    ctx.lineWidth = 1;
    for (let k = 0; k < n; k++) {
      const [i, j] = ORDER[k], a = pts[i], b = pts[j];
      const fresh = k > n - 14 && f < CHECK.b + 4;
      const depth = (near(a[2]) + near(b[2])) / 2;
      ctx.strokeStyle = fresh ? rgba(C.ink, 0.9 * leave) : rgba(AMBER, (0.03 + 0.12 * depth) * fade * leave);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  // beat 3: the re-check from branch 0, one pair at a time, until (0, 23) has no edge
  if (f >= RECHECK.a) {
    const done = Math.min(FAIL_B - 1, Math.floor((f - RECHECK.a) / RECHECK.step));
    ctx.lineWidth = 2;
    for (let j = 1; j <= done; j++) {
      const a = pts[FAIL_A], b = pts[j];
      ctx.strokeStyle = rgba(AMBER, 0.85 * leave);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    if (f >= FAIL_AT) {
      const a = pts[FAIL_A], b = pts[FAIL_B], t = easeOut(prog(f, FAIL_AT, FAIL_AT + 12));
      const mx = lerp(a[0], b[0], 0.5), my = lerp(a[1], b[1], 0.5);
      ctx.strokeStyle = rgba(CORAL, leave); ctx.setLineDash([10, 9]); ctx.lineWidth = 2.4;
      // the line stops short of the middle from both ends: there is no edge of H between the two branch sets
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], mx, 0.82 * t), lerp(a[1], my, 0.82 * t)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(lerp(b[0], mx, 0.82 * t), lerp(b[1], my, 0.82 * t)); ctx.stroke();
      ctx.setLineDash([]);
      if (t > 0.9) {
        ctx.lineWidth = 2.4; const s = 9;
        ctx.beginPath(); ctx.moveTo(mx - s, my - s); ctx.lineTo(mx + s, my + s); ctx.moveTo(mx + s, my - s); ctx.lineTo(mx - s, my + s); ctx.stroke();
      }
    }
  }

  // labels
  const b1 = beat(f, B1, B2), b2 = beat(f, B2, B3), b3 = beat(f, B3, T.frames);
  if (b1.alpha > 0) {
    const contract = prog(f, B1 + 92, B1 + 150);
    ctx.globalAlpha = b1.alpha;
    if (contract < 0.5) {
      ctx.globalAlpha = b1.alpha * (1 - prog(contract, 0.3, 0.5));
      label(ctx, 'vertices 100', X, Y, C.ink);
      label(ctx, '44 pairs joined by an edge', X + 300, Y, AMBER, 'left', 26);
    } else {
      ctx.globalAlpha = b1.alpha * prog(contract, 0.5, 0.7);
      label(ctx, 'branch sets 56', X, Y, C.ink);
      label(ctx, '12 single, 44 contracted', X + 330, Y, C.muted, 'left', 26);
    }
  }
  if (b2.alpha > 0) {
    ctx.globalAlpha = b2.alpha;
    const shown = checkedAt(f).toLocaleString('en-US');
    label(ctx, `pairs that touch ${shown.padStart(5, ' ')} / 1,540`, X, Y, AMBER);
    if (f > CHECK.b + 6) { ctx.globalAlpha = b2.alpha * prog(f, CHECK.b + 6, CHECK.b + 20); kn(ctx, '56', 1008 - 190, Y, C.ink, 34); label(ctx, 'minor', 1008, Y, C.muted, 'right', 30); }
  }
  if (b3.alpha > 0) {
    ctx.globalAlpha = b3.alpha;
    label(ctx, `swap vertices ${SV1} and ${SV4}`, X, Y - 44, CORAL);
    if (f >= RECHECK.a) {
      const checked = Math.min(FAIL_B, 1 + Math.floor((f - RECHECK.a) / RECHECK.step));
      label(ctx, `pairs checked ${String(checked).padStart(2, ' ')}`, X, Y, C.ink);
      if (f >= FAIL_AT + 8) label(ctx, `first missing (${FAIL_A}, ${FAIL_B})`, 1008, Y, CORAL, 'right');
    }
    // name the branch sets involved
    const tag = (b: number, text: string, color: string) => { const [x, y] = pts[b]; label(ctx, text, x + 18, y - 16, color, 'left', 26); };
    if (f > SWAP.split - 10) { tag(BR0, String(BR0), CORAL); tag(BR12, String(BR12), C.muted); }
    if (f >= FAIL_AT) tag(FAIL_B, String(FAIL_B), CORAL);
  }
  ctx.globalAlpha = 1;
}

// The sphere turns while the vertices gather, comes to rest while the pairs are checked (so 1,540 hairlines
// stay sharp and the video stays small), and turns slowly again for the swap.
const SPIN: number[] = [];
for (let f = 0, a = -30; f <= T.frames; f++) {
  SPIN.push(a);
  a += 0.3 * (1 - easeInOut(prog(f, B1 + 140, B2 + 60))) + 0.12 * easeInOut(prog(f, B3, B3 + 50));
}

export const Clique = () => {
  const f = useCurrentFrame();
  const cam = orbit([0, -0.12, 0], 5.3, 1.25, SPIN[Math.max(0, Math.min(T.frames, Math.round(f)))], 33);
  return (
    <Stage cam={cam} overlay={(ctx, project) => overlay(ctx, project, f)}>
      <Lights shadows={false} />
      <Graph f={f} />
    </Stage>
  );
};
