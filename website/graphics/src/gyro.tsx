// Stationary response and singular limits in a linear zonal gyrokinetic model.
//   1  the setting: nested flux surfaces of a torus, with passing particles that circle it and trapped ones
//      that bounce on the outboard side (a schematic, not the paper's equilibrium)
//   2  the limits that do not commute: the time average of a slow rotation e^{iδt} is sin(δt)/(δt); along
//      δ = 0 it stays 1 for all time, while for any fixed δ > 0 it dies out as t grows
//   3  replacing the energy projection by ordinary orbit averaging moves the stationary field by 23.2%
//      (the paper's 25-dimensional orbit discretization; the two arrows are a schematic of that distance)
import { Group3D, Mesh, Model, staticFile, useCurrentFrame } from 'remotion';
import { C, beat, easeInOut, easeOut, label, lerp, prog, rgba } from './kit';
import { Lights, Rod, Stage, mix3, orbit, type Cam, type Material, type V3 } from './kit3d';
import { TIMING } from './timing';

const AZURE = '#4f9dff';
const VIOLET = '#a285ff';
const T = TIMING.gyro;
const [B1, B2, B3] = T.beats;
export const GYRO_FRAMES = T.frames;

// The torus, as scripts/models.mjs builds it.
const R0 = 1.25, PHI0 = -Math.PI / 4;
const tp = (r: number, th: number, ph: number): V3 => [(R0 + r * Math.cos(th)) * Math.cos(ph), r * Math.sin(th), -(R0 + r * Math.cos(th)) * Math.sin(ph)];

// Particles, as functions of the frame. Passing ones go round the torus along a helix; trapped ones bounce
// between two poloidal angles on the outboard side, their legs at slightly different radii (a banana), and drift.
type Particle = { kind: 'passing' | 'trapped'; at: (f: number) => { p: V3; phi: number } };
const on = (r: number, th: number, ph: number) => ({ p: tp(r, th, ph), phi: ph });
const PARTICLES: Particle[] = [
  { kind: 'passing', at: (f) => { const ph = PHI0 + 0.3 + f * ((2 * Math.PI) / 260); return on(0.32, 0.6 + ph / 2.4, ph); } },
  { kind: 'passing', at: (f) => { const ph = PHI0 + 3.3 + f * ((2 * Math.PI) / 300); return on(0.42, 2.8 + ph / 2.4, ph); } },
  { kind: 'trapped', at: (f) => { const s = (f / 96) * 2 * Math.PI, th = 0.78 * Math.sin(s); return on(0.36 + 0.06 * Math.cos(s), th, 2.55 + 1.1 * th + f * 0.0012); } },
  { kind: 'trapped', at: (f) => { const s = (f / 110) * 2 * Math.PI + 2, th = 0.62 * Math.sin(s); return on(0.24 + 0.05 * Math.cos(s), th, 0.95 + 1.1 * th + f * 0.001); } },
];
/** 0 inside the cut-away wedge (φ within 45° of 270°), 1 well outside it. */
const outsideWedge = (phi: number) => {
  const d = Math.abs(((((phi - (3 * Math.PI) / 2) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  return Math.min(1, Math.max(0, (d - Math.PI / 4) / 0.22));
};
const TRAIL = 64;

// The limits surface, as scripts/models.mjs builds it: t = 40u along x, δ = 0.5v along z.
const L = { T: 40, D: 0.5, P: 1, H: 0.85, w: 3.2, d: 2.2 };
const sinc = (x: number) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
const onSurface = (u: number, v: number, lift = 0.018): V3 => [(-0.5 + u) * L.w, sinc(L.T * u * L.D * Math.pow(v, L.P)) * L.H + lift, (-0.5 + v) * L.d];
const V0 = 0.5; // the fixed δ > 0 of the second path (δ = 0.25)
const PATH1 = { a: B2 + 34, b: B2 + 96 }, PATH2 = { a: B2 + 104, b: B2 + 170 };

// Beat 3: two stationary fields 23.2% apart (a schematic: directions are arbitrary, the ratio is the paper's).
const E_DIR = ((v: V3) => { const l = Math.hypot(...v); return v.map((c) => c / l) as V3; })([1, 0.5, 0.42]);
const E_LEN = 1.9;
const PERP = ((v: V3) => { const l = Math.hypot(...v); return v.map((c) => c / l) as V3; })([-0.35, 1, 0.05]);
const ORIGIN: V3 = [-1.15, -0.35, 0.2];
const E_TIP: V3 = [ORIGIN[0] + E_DIR[0] * E_LEN, ORIGIN[1] + E_DIR[1] * E_LEN, ORIGIN[2] + E_DIR[2] * E_LEN];
const A_TIP: V3 = [E_TIP[0] + PERP[0] * E_LEN * 0.232, E_TIP[1] + PERP[1] * E_LEN * 0.232, E_TIP[2] + PERP[2] * E_LEN * 0.232];

const POSES: { at: number; target: V3; radius: number; height: number; deg: number }[] = [
  { at: B1, target: [0, -0.1, 0.15], radius: 5.5, height: 2.7, deg: -14 },
  { at: B2, target: [0.15, 0.05, 0.25], radius: 6.6, height: 4.4, deg: 24 },
  { at: B3, target: [0.15, 0.25, 0.2], radius: 4.9, height: 1.2, deg: -8 },
  { at: T.frames, target: [0, -0.1, 0.15], radius: 5.5, height: 2.7, deg: -14 },
];
function camAt(f: number): Cam {
  let i = 0;
  while (i < POSES.length - 2 && f >= POSES[i + 1].at) i++;
  const a = POSES[i], b = POSES[i + 1];
  const t = easeInOut(prog(f, b.at - 30, b.at + 10)), drift = (f - a.at) * 0.04;
  return orbit(mix3(a.target, b.target, t), lerp(a.radius, b.radius, t), lerp(a.height, b.height, t), lerp(a.deg + drift, b.deg, t), 34);
}

const ink: Material = { color: C.ink, roughness: 0.35 };

function Torus({ f }: { f: number }) {
  const show = easeOut(prog(f, B1, B1 + 30)) * (1 - easeInOut(prog(f, B2 - 26, B2 - 4)));
  if (show <= 0.01) return null;
  const s = lerp(0.92, 1, show);
  return (
    <Group3D scale={s}>
      <Model src={staticFile('models/gyro-sections.glb')} material={{ ...ink, opacity: show }} />
      <Model src={staticFile('models/gyro-lines.glb')} material={{ color: AZURE, roughness: 0.45, emissive: AZURE, emissiveIntensity: 0.25, opacity: 0.85 * show }} />
      <Model src={staticFile('models/gyro-surface-2.glb')} material={{ color: AZURE, roughness: 0.35, opacity: 0.3 * show, doubleSided: true }} />
      <Model src={staticFile('models/gyro-surface-1.glb')} material={{ color: VIOLET, roughness: 0.35, opacity: 0.17 * show, doubleSided: true }} />
      <Model src={staticFile('models/gyro-surface-0.glb')} material={{ color: AZURE, roughness: 0.35, opacity: 0.1 * show, doubleSided: true }} />
      {PARTICLES.map((p, i) => {
        const { p: pos, phi } = p.at(f), o = show * outsideWedge(phi);
        return o > 0.01 && (
          <Mesh key={i} geometry={{ kind: 'sphere', radius: 0.042, segments: 20, rings: 12 }} position={pos}
            material={{ color: p.kind === 'passing' ? AZURE : VIOLET, roughness: 0.3, emissive: p.kind === 'passing' ? AZURE : VIOLET, emissiveIntensity: 0.3, opacity: o }} />
        );
      })}
    </Group3D>
  );
}

/** A polyline of rods along points, drawn on to t. */
function Path({ pts, t, radius, material }: { pts: V3[]; t: number; radius: number; material: Material }) {
  if (t <= 0) return null;
  const n = pts.length - 1, upto = t * n, out = [];
  for (let i = 0; i < n && i < upto; i++) {
    const e = Math.min(1, upto - i);
    out.push(<Rod key={i} a={pts[i]} b={mix3(pts[i], pts[i + 1], e)} radius={radius} material={material} segments={8} />);
  }
  return <>{out}</>;
}
const ridge = Array.from({ length: 61 }, (_, i) => onSurface(i / 60, 0, 0.02));
const slice = Array.from({ length: 121 }, (_, i) => onSurface(i / 120, V0, 0.02));
const headOf = (pts: V3[], t: number): V3 => { const x = Math.min(pts.length - 1.001, t * (pts.length - 1)), i = Math.floor(x); return mix3(pts[i], pts[i + 1], x - i); };

function Limits({ f }: { f: number }) {
  const show = easeOut(prog(f, B2 - 6, B2 + 26)) * (1 - easeInOut(prog(f, B3 - 26, B3 - 4)));
  if (show <= 0.01) return null;
  const t1 = easeInOut(prog(f, PATH1.a, PATH1.b)), t2 = easeInOut(prog(f, PATH2.a, PATH2.b));
  return (
    <Group3D position={[0, (1 - show) * -0.25, 0]}>
      <Model src={staticFile('models/gyro-limits.glb')} material={{ color: VIOLET, roughness: 0.7, emissive: VIOLET, emissiveIntensity: 0.02, opacity: show < 0.99 ? show : 1, doubleSided: true }} />
      <Path pts={ridge} t={t1} radius={0.012} material={{ color: AZURE, roughness: 0.4, emissive: AZURE, emissiveIntensity: 0.3, opacity: show }} />
      <Path pts={slice} t={t2} radius={0.012} material={{ ...ink, opacity: show }} />
      {t1 > 0 && <Mesh geometry={{ kind: 'sphere', radius: 0.045 }} position={headOf(ridge, t1)} material={{ color: AZURE, roughness: 0.3, emissive: AZURE, emissiveIntensity: 0.3, opacity: show }} />}
      {t2 > 0 && <Mesh geometry={{ kind: 'sphere', radius: 0.045 }} position={headOf(slice, t2)} material={{ ...ink, opacity: show }} />}
    </Group3D>
  );
}

function Arrow({ a, b, t, radius, material }: { a: V3; b: V3; t: number; radius: number; material: Material }) {
  if (t <= 0.001) return null;
  const tip = mix3(a, b, t), d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d), head = 0.15;
  const base = mix3(a, b, Math.max(0, t - head / len));
  const yaw = (Math.atan2(-d[2], d[0]) * 180) / Math.PI, pitch = (Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180) / Math.PI;
  const mid = mix3(base, tip, 0.5);
  return (
    <>
      <Rod a={a} b={base} radius={radius} material={material} segments={14} />
      <Group3D position={mid} rotation={[0, yaw, 0]}>
        <Mesh geometry={{ kind: 'cylinder', radiusTop: 0, radiusBottom: radius * 3, height: 1, segments: 20 }} material={material} rotation={[0, 0, -90 + pitch]} scale={[1, Math.min(head, len * t), 1]} />
      </Group3D>
    </>
  );
}

function Fields({ f }: { f: number }) {
  const show = easeOut(prog(f, B3 - 12, B3 + 12)) * (1 - easeInOut(prog(f, T.frames - 26, T.frames - 4)));
  if (show <= 0.01) return null;
  const e = easeOut(prog(f, B3 + 2, B3 + 40)), a = easeOut(prog(f, B3 + 40, B3 + 76)), gap = easeOut(prog(f, B3 + 76, B3 + 100));
  const axis = { color: C.pencil, unlit: true, opacity: 0.35 * show } as Material;
  const dashes = [];
  for (let k = 0; k < 7; k++) {
    const s0 = k / 7, s1 = (k + 0.55) / 7;
    if (s0 < gap) dashes.push(<Rod key={k} a={mix3(E_TIP, A_TIP, s0)} b={mix3(E_TIP, A_TIP, Math.min(s1, gap))} radius={0.008} material={{ color: C.ink, unlit: true, opacity: show }} segments={6} />);
  }
  return (
    <>
      <Rod a={ORIGIN} b={[ORIGIN[0] + 0.9, ORIGIN[1], ORIGIN[2]]} radius={0.004} material={axis} segments={6} />
      <Rod a={ORIGIN} b={[ORIGIN[0], ORIGIN[1] + 0.9, ORIGIN[2]]} radius={0.004} material={axis} segments={6} />
      <Rod a={ORIGIN} b={[ORIGIN[0], ORIGIN[1], ORIGIN[2] + 0.9]} radius={0.004} material={axis} segments={6} />
      <Arrow a={ORIGIN} b={E_TIP} t={e} radius={0.02} material={{ color: AZURE, roughness: 0.35, emissive: AZURE, emissiveIntensity: 0.2, opacity: show }} />
      <Arrow a={ORIGIN} b={A_TIP} t={a} radius={0.02} material={{ color: VIOLET, roughness: 0.35, emissive: VIOLET, emissiveIntensity: 0.2, opacity: show }} />
      {dashes}
    </>
  );
}


function overlay(ctx: CanvasRenderingContext2D, project: (p: V3) => [number, number, number], f: number) {
  const X = 72, Y = 1000;
  const b1 = beat(f, B1, B2), b2 = beat(f, B2, B3), b3 = beat(f, B3, T.frames);
  if (b1.alpha > 0) {
    // trails
    ctx.lineCap = 'round';
    for (const p of PARTICLES) {
      const col = p.kind === 'passing' ? AZURE : VIOLET;
      let prev = project(p.at(Math.max(0, f - TRAIL)).p);
      for (let k = TRAIL - 1; k >= 0; k--) {
        const here = p.at(Math.max(0, f - k)), cur = project(here.p);
        ctx.strokeStyle = rgba(col, 0.75 * (1 - k / TRAIL) * b1.alpha * outsideWedge(here.phi));
        ctx.lineWidth = 2.4 * (1 - k / TRAIL) + 0.6;
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(cur[0], cur[1]); ctx.stroke();
        prev = cur;
      }
    }
    ctx.globalAlpha = b1.alpha * prog(f, B1 + 30, B1 + 50);
    label(ctx, 'flux surfaces 3', X, Y, C.ink);
    label(ctx, 'passing', X + 330, Y, AZURE);
    label(ctx, 'trapped', X + 520, Y, VIOLET);
  }
  if (b2.alpha > 0) {
    ctx.globalAlpha = b2.alpha;
    const at = (u: number, v: number, dy = 0) => { const [x, y] = project(onSurface(u, v, 0)); return [x, y + dy] as const; };
    // the axes, along the near and left edges
    const [tx, ty] = at(0.55, 1, 50);
    label(ctx, 'time t →', tx, ty, C.muted, 'center', 26);
    const [dx, dy] = at(0, 0.8, 0);
    label(ctx, 'detuning δ', dx - 24, dy + 10, C.muted, 'right', 26);
    if (f > PATH1.b) {
      ctx.globalAlpha = b2.alpha * prog(f, PATH1.b, PATH1.b + 12);
      const [x, y] = project(headOf(ridge, 1));
      label(ctx, '1', x + 26, y - 14, AZURE, 'left', 34);
      label(ctx, 'δ → 0 first', X, Y - 44, AZURE);
      label(ctx, '1', X + 300, Y - 44, AZURE);
    }
    if (f > PATH2.b) {
      ctx.globalAlpha = b2.alpha * prog(f, PATH2.b, PATH2.b + 12);
      const [x, y] = project(headOf(slice, 1));
      label(ctx, '0', x + 26, y - 6, C.ink, 'left', 34);
      label(ctx, 't → ∞ first', X, Y, C.ink);
      label(ctx, '0', X + 300, Y, C.ink);
    }
  }
  if (b3.alpha > 0) {
    ctx.globalAlpha = b3.alpha * prog(f, B3 + 30, B3 + 46);
    const [ex, ey] = project(E_TIP), [ax, ay] = project(A_TIP);
    label(ctx, 'energy projection', ex + 26, ey + 46, AZURE, 'left', 26);
    if (f > B3 + 70) { ctx.globalAlpha = b3.alpha * prog(f, B3 + 70, B3 + 86); label(ctx, 'orbit average', ax - 10, ay - 26, VIOLET, 'center', 26); }
    if (f > B3 + 96) {
      ctx.globalAlpha = b3.alpha * prog(f, B3 + 96, B3 + 110);
      const [mx, my] = project(mix3(E_TIP, A_TIP, 0.5));
      label(ctx, '23.2%', mx + 26, my + 10, C.ink, 'left', 34);
      label(ctx, 'stationary field moved by 23.2%', X, Y, C.ink);
    }
  }
  ctx.globalAlpha = 1;
}

export const Gyro = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <Stage cam={cam} overlay={(ctx, project) => overlay(ctx, project, f)}>
      <Lights shadows={false} />
      <Torus f={f} />
      <Limits f={f} />
      <Fields f={f} />
    </Stage>
  );
};
