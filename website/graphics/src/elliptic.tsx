// Locality and global information in elliptic solvers, on a 32 x 32 grid drawn as bars.
//   1  the discrete Green's function of the 5-point Dirichlet Laplacian at one point p: how much the solution
//      at p depends on the forcing at each grid point. With uniform forcing, 79.9% of u(p) comes from outside
//      the 7 x 7 window around p (local radius w = 3; src/data/green.json, checked by a direct solve)
//   2  the order of the paper's bound: n^d / (w + 1)^d shared numbers, here (32 / 4)^2 = 64, one per 4 x 4 block
//   3  the paper's experiment: a model with 16 sine moments errs by 6.1% on smooth forcings and 67.0% on
//      white ones (the two fields are samples of each kind, not the paper's data)
import { Mesh, useCurrentFrame } from 'remotion';
import green from './data/green.json';
import { C, beat, easeInOut, easeOut, label, lerp, prog, rng } from './kit';
import { Lights, Rod, Stage, mix3, orbit, type Cam, type Material, type V3 } from './kit3d';
import { TIMING } from './timing';

const ROSE = '#ff6f91';
const VIOLET = '#a285ff';
const T = TIMING.elliptic;
const [B1, B2, B3] = T.beats;
export const ELLIPTIC_FRAMES = T.frames;

const n = green.n, w = green.w, [PI, PJ] = green.p; // p as 1-based grid indices
const G = 0.086, BAR = 0.068, HMAX = 1.25;
const pos = (i: number, j: number): [number, number] => [(i - (n + 1) / 2) * G, (j - (n + 1) / 2) * G];
const inWindow = (i: number, j: number) => Math.abs(i - PI) <= w && Math.abs(j - PJ) <= w;

// Two forcings: a smooth one (a few low modes) and white noise.
const r = rng(23);
const SMOOTH: number[] = [], WHITE: number[] = [];
for (let j = 1; j <= n; j++) for (let i = 1; i <= n; i++) {
  const x = i / (n + 1), y = j / (n + 1);
  SMOOTH.push(0.85 * Math.sin(2 * Math.PI * x) * Math.sin(2 * Math.PI * y) + 0.3 * Math.sin(Math.PI * x) * Math.sin(Math.PI * y));
  const g = (r() + r() + r() - 1.5) / 0.75; // roughly normal, sd ≈ 0.67
  WHITE.push(Math.max(-1.4, Math.min(1.4, g)));
}

const MORPH = { flat: B2 + 6, smooth: B3 + 6, white: B3 + 120 };
const BLOCKS = { lines: B2 + 40, marks: B2 + 64 };

function heightAt(k: number, i: number, j: number, f: number) {
  const gH = green.g[k] * HMAX;
  const d = Math.hypot(i - PI, j - PJ);
  const rise = easeOut(prog(f, B1 + 8 + d * 1.6, B1 + 40 + d * 1.6));
  let h = gH * rise;
  const toFlat = easeInOut(prog(f, MORPH.flat + d * 0.5, MORPH.flat + 30 + d * 0.5));
  h = lerp(h, 0.02, toFlat);
  const toSmooth = easeInOut(prog(f, MORPH.smooth + (i + j) * 0.5, MORPH.smooth + 30 + (i + j) * 0.5));
  // forcings stand on the base: an offset keeps the negative values visible
  h = lerp(h, Math.max(0.02, 0.3 + SMOOTH[k] * 0.36), toSmooth);
  const toWhite = easeInOut(prog(f, MORPH.white + (i + j) * 0.5, MORPH.white + 24 + (i + j) * 0.5));
  h = lerp(h, Math.max(0.02, 0.3 + WHITE[k] * 0.26), toWhite);
  return { h, toWhite };
}

const POSES: { at: number; target: V3; radius: number; height: number; deg: number }[] = [
  { at: B1, target: [0, 0.25, 0.1], radius: 4.8, height: 2.9, deg: -28 },
  { at: B2, target: [0, 0, 0.2], radius: 3.6, height: 4.9, deg: -12 },
  { at: B3, target: [0.3, 0.15, 0.1], radius: 5.9, height: 4.0, deg: 16 },
  { at: T.frames, target: [0, 0.25, 0.1], radius: 4.8, height: 2.9, deg: -28 },
];
function camAt(f: number): Cam {
  let i = 0;
  while (i < POSES.length - 2 && f >= POSES[i + 1].at) i++;
  const a = POSES[i], b = POSES[i + 1];
  const t = easeInOut(prog(f, b.at - 30, b.at + 10)), drift = (f - a.at) * 0.035;
  return orbit(mix3(a.target, b.target, t), lerp(a.radius, b.radius, t), lerp(a.height, b.height, t), lerp(a.deg + drift, b.deg, t), 34);
}

const mat = {
  rose: { color: ROSE, roughness: 0.5, emissive: ROSE, emissiveIntensity: 0.06 } as Material,
  violet: { color: '#7d6bc4', roughness: 0.6 } as Material,
  base: { color: '#0b0e14', unlit: true } as Material,
};

function Bars({ f }: { f: number }) {
  const leave = 1 - easeInOut(prog(f, T.frames - 26, T.frames - 4));
  const winColor = 1 - easeInOut(prog(f, MORPH.flat, MORPH.flat + 20)); // the window's bars stand out in beat 1
  const out = [];
  for (let j = 1; j <= n; j++) for (let i = 1; i <= n; i++) {
    const k = (j - 1) * n + (i - 1);
    const { h, toWhite } = heightAt(k, i, j, f);
    const hh = h * leave;
    if (Math.abs(hh) < 0.002) continue;
    const [x, z] = pos(i, j);
    const inside = inWindow(i, j) && winColor > 0.5;
    const smoothPhase = f >= MORPH.smooth;
    const m = smoothPhase ? (toWhite > 0.5 ? mat.violet : mat.rose) : inside ? mat.rose : mat.violet;
    out.push(<Mesh key={k} geometry={{ kind: 'box', width: 1, height: 1, depth: 1 }} material={m} position={[x, hh / 2, z]} scale={[BAR, Math.abs(hh), BAR]} castShadow receiveShadow />);
  }
  return <>{out}</>;
}

function Window({ f }: { f: number }) {
  const t = easeOut(prog(f, B1 + 70, B1 + 100)) * (1 - easeInOut(prog(f, MORPH.flat - 10, MORPH.flat + 12)));
  if (t <= 0.01) return null;
  const [cx, cz] = pos(PI, PJ), half = (w + 0.5) * G, top = HMAX * 1.12 * t;
  const c: V3[] = [[cx - half, 0, cz - half], [cx + half, 0, cz - half], [cx + half, 0, cz + half], [cx - half, 0, cz + half]];
  const m = { color: C.ink, unlit: true, opacity: 0.85 * t } as Material;
  const up = (p: V3): V3 => [p[0], top, p[2]];
  return (
    <>
      {c.map((p, i) => <Rod key={`b${i}`} a={p} b={c[(i + 1) % 4]} radius={0.005} material={m} segments={6} />)}
      {c.map((p, i) => <Rod key={`t${i}`} a={up(p)} b={up(c[(i + 1) % 4])} radius={0.005} material={m} segments={6} />)}
      {c.map((p, i) => <Rod key={`v${i}`} a={p} b={up(p)} radius={0.005} material={m} segments={6} />)}
    </>
  );
}

function Blocks({ f }: { f: number }) {
  const show = easeOut(prog(f, BLOCKS.lines, BLOCKS.lines + 24)) * (1 - easeInOut(prog(f, B3 - 20, B3 + 4)));
  if (show <= 0.01) return null;
  const s = w + 1, m = n / s, lines = [], marks = [];
  const lineM = { color: C.ink, unlit: true, opacity: 0.55 * show } as Material;
  const ext = (n / 2) * G;
  for (let k = 0; k <= m; k++) {
    const c = (k * s - n / 2) * G;
    lines.push(<Rod key={`x${k}`} a={[c, 0.03, -ext]} b={[c, 0.03, ext]} radius={0.0035} material={lineM} segments={6} />);
    lines.push(<Rod key={`z${k}`} a={[-ext, 0.03, c]} b={[ext, 0.03, c]} radius={0.0035} material={lineM} segments={6} />);
  }
  for (let bj = 0; bj < m; bj++) for (let bi = 0; bi < m; bi++) {
    const k = bj * m + bi, t = easeOut(prog(f, BLOCKS.marks + k * 0.9, BLOCKS.marks + 16 + k * 0.9));
    if (t <= 0) continue;
    const x = ((bi + 0.5) * s - n / 2) * G, z = ((bj + 0.5) * s - n / 2) * G;
    marks.push(<Mesh key={k} geometry={{ kind: 'box', width: 1, height: 1, depth: 1 }} material={{ ...mat.rose, opacity: show }} position={[x, 0.06 + 0.2 * t, z]} scale={0.085 * t} castShadow />);
  }
  return <>{lines}{marks}</>;
}

// The error gauge for beat 3: a column from 0 to 100% beside the grid.
const GAUGE = { x: (n / 2) * G + 0.36, z: 0.3, h: 1.4 };
function Gauge({ f }: { f: number }) {
  const show = easeOut(prog(f, B3 + 10, B3 + 30)) * (1 - easeInOut(prog(f, T.frames - 26, T.frames - 4)));
  if (show <= 0.01) return null;
  const smooth = easeOut(prog(f, MORPH.smooth + 50, MORPH.smooth + 80)) * 0.061, white = easeOut(prog(f, MORPH.white + 40, MORPH.white + 80)) * (0.67 - 0.061);
  const level = smooth + white;
  const frame = { color: C.pencil, unlit: true, opacity: 0.6 * show } as Material;
  const fillColor = f >= MORPH.white + 40 ? '#7d6bc4' : ROSE;
  return (
    <>
      <Rod a={[GAUGE.x, 0, GAUGE.z]} b={[GAUGE.x, GAUGE.h, GAUGE.z]} radius={0.004} material={frame} segments={6} />
      {[0, 0.25, 0.5, 0.75, 1].map((v) => <Rod key={v} a={[GAUGE.x - 0.05, v * GAUGE.h, GAUGE.z]} b={[GAUGE.x + 0.05, v * GAUGE.h, GAUGE.z]} radius={0.003} material={frame} segments={6} />)}
      {level > 0.001 && <Mesh geometry={{ kind: 'box', width: 1, height: 1, depth: 1 }} material={{ color: fillColor, roughness: 0.45, emissive: fillColor, emissiveIntensity: 0.1, opacity: show }}
        position={[GAUGE.x + 0.11, (level * GAUGE.h) / 2, GAUGE.z]} scale={[0.1, level * GAUGE.h, 0.1]} />}
    </>
  );
}

function overlay(ctx: CanvasRenderingContext2D, project: (p: V3) => [number, number, number], f: number) {
  const X = 72, Y = 1000;
  const b1 = beat(f, B1, B2), b2 = beat(f, B2, B3), b3 = beat(f, B3, T.frames);
  if (b1.alpha > 0) {
    const [px, py] = project([pos(PI, PJ)[0], HMAX + 0.02, pos(PI, PJ)[1]]);
    ctx.globalAlpha = b1.alpha * prog(f, B1 + 40, B1 + 56);
    label(ctx, 'p', px, py - 18, C.ink, 'center', 30);
    ctx.globalAlpha = b1.alpha * prog(f, B1 + 90, B1 + 106);
    label(ctx, 'outside the 7 × 7 window', X, Y, C.ink);
    label(ctx, `${green.outside.toFixed(1)}%`, 1008, Y, VIOLET, 'right', 34);
    label(ctx, 'grid 32 × 32', X, Y - 44, C.muted, 'left', 26);
  }
  if (b2.alpha > 0) {
    ctx.globalAlpha = b2.alpha * prog(f, BLOCKS.lines, BLOCKS.lines + 16);
    label(ctx, 'blocks of (w + 1) × (w + 1) = 4 × 4', X, Y - 44, C.muted, 'left', 26);
    const shown = Math.min(green.blocks, Math.floor(Math.max(0, f - BLOCKS.marks) / 0.9 + 0.5));
    if (f > BLOCKS.marks) {
      label(ctx, 'shared numbers', X, Y, C.ink);
      label(ctx, `${String(shown).padStart(2, ' ')}`, 1008, Y, ROSE, 'right', 34);
    }
  }
  if (b3.alpha > 0) {
    ctx.globalAlpha = b3.alpha * prog(f, B3 + 30, B3 + 46);
    label(ctx, '16 sine moments, mean energy error', X, Y - 44, C.muted, 'left', 26);
    const [gx, gy0] = project([GAUGE.x + 0.2, 0.061 * GAUGE.h, GAUGE.z]), [, gy1] = project([GAUGE.x + 0.2, 0.67 * GAUGE.h, GAUGE.z]);
    if (f > MORPH.smooth + 60) {
      ctx.globalAlpha = b3.alpha * prog(f, MORPH.smooth + 60, MORPH.smooth + 76);
      label(ctx, 'smooth', X, Y, ROSE);
      label(ctx, '6.1%', X + 170, Y, ROSE);
      label(ctx, '6.1%', gx + 14, gy0 + 10, ROSE, 'left', 28);
    }
    if (f > MORPH.white + 60) {
      ctx.globalAlpha = b3.alpha * prog(f, MORPH.white + 60, MORPH.white + 76);
      label(ctx, 'white', X + 380, Y, VIOLET);
      label(ctx, '67.0%', X + 530, Y, VIOLET);
      label(ctx, '67.0%', gx + 14, gy1 + 10, VIOLET, 'left', 28);
    }
  }
  ctx.globalAlpha = 1;
}

export const Elliptic = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const ext = (n / 2) * G + 0.12;
  return (
    <Stage cam={cam} overlay={(ctx, project) => overlay(ctx, project, f)}>
      <Lights />
      <Mesh geometry={{ kind: 'box', width: 2 * ext, height: 0.04, depth: 2 * ext }} material={mat.base} position={[0, -0.025, 0]} />
      <Bars f={f} />
      <Window f={f} />
      <Blocks f={f} />
      <Gauge f={f} />
    </Stage>
  );
};
