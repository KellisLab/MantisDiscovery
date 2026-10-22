// The hero: heat flowing on a torus. Pure math, no DOM: shared by the WebGL stage, the reduced-motion
// still and the server-rendered pencil wireframe.
//
// Surface: x = (R + r cos v) cos u, y = r sin v, z = (R + r cos v) sin u.
// Two heat fields live on it, one fed by a source the visitor steers (human), one by a source that
// wanders on its own (AI). Each obeys  ∂ₜh = κ Δh − λ h + f  with Δ the Laplace-Beltrami operator of
// the torus metric ds² = (R + r cos v)² du² + r² dv²:
//   Δh = h_uu / a² + (a h_v)_v / (a r²),   a(v) = R + r cos v.
// Under both lies the ground (ambient): the whole surface is never quite at rest, warmer here and cooler
// there in a pattern that drifts slowly and never repeats.
// The surface deforms with all three (meshPoint): the tube swells where it is warm and thins where the
// ground is cool, and the ring itself widens, lifts and dips with its cross-section, so the whole shape
// keeps flowing while the two heats add their own swellings on top.

export const R = 1;
export const r = 0.42;
export const NU = 64; // heat grid around the ring
export const NV = 32; // heat grid around the tube
export const KAPPA = 0.05;
export const COOL = 0.2;
export const SIGMA = 0.24;
export const FOV = 30; // degrees
export const CAM_Z = 6.0;
export const TILT = 0.6; // radians: a low view across the ring, from the side
export const ROLL = -0.4; // radians: the ring leans in the frame
export const TAU = Math.PI * 2;

const du = TAU / NU;
const dv = TAU / NV;
const a = new Float64Array(NV); // a(v_j)
const aHalf = new Float64Array(NV); // a(v_{j+1/2})
for (let j = 0; j < NV; j++) {
  a[j] = R + r * Math.cos(j * dv);
  aHalf[j] = R + r * Math.cos((j + 0.5) * dv);
}

export type Source = { u: number; v: number; q: number };

/** One explicit step of a heat field. Stable for dt < min(a² du², r² dv²) / (4κ) ≈ 0.016: callers sub-step. */
export function stepHeat(h: Float32Array, src: Source, dt: number, tmp: Float32Array) {
  const s2 = 2 * SIGMA * SIGMA;
  for (let j = 0; j < NV; j++) {
    const jm = (j + NV - 1) % NV, jp = (j + 1) % NV;
    const aj = a[j];
    const cu = 1 / (aj * aj * du * du);
    const cvp = aHalf[j] / (aj * r * r * dv * dv);
    const cvm = aHalf[jm] / (aj * r * r * dv * dv);
    // Source distance along the surface (local metric), wrapped in both directions.
    let dvS = Math.abs(j * dv - src.v) % TAU; if (dvS > Math.PI) dvS = TAU - dvS;
    const yv = r * dvS;
    for (let i = 0; i < NU; i++) {
      const k = j * NU + i;
      const f = h[k];
      const lap = (h[j * NU + ((i + 1) % NU)] - 2 * f + h[j * NU + ((i + NU - 1) % NU)]) * cu
        + (h[jp * NU + i] - f) * cvp - (f - h[jm * NU + i]) * cvm;
      let duS = Math.abs(i * du - src.u) % TAU; if (duS > Math.PI) duS = TAU - duS;
      const xu = aj * duS;
      const s = src.q * Math.exp(-(xu * xu + yv * yv) / s2);
      tmp[k] = f + dt * (KAPPA * lap - COOL * f + s);
    }
  }
  h.set(tmp);
}

/** The AI source wanders on its own: around the ring, and up and down the tube. */
export function aiPath(t: number): Source {
  return { u: (0.19 * t + 0.3) % TAU, v: 1.35 * Math.sin(0.43 * t) + 0.5 * Math.sin(0.17 * t + 1), q: 1.25 };
}

export function surface(u: number, v: number): [number, number, number] {
  const c = R + r * Math.cos(v);
  return [c * Math.cos(u), r * Math.sin(v), c * Math.sin(u)];
}
export function normal(u: number, v: number): [number, number, number] {
  return [Math.cos(v) * Math.cos(u), Math.sin(v), Math.cos(v) * Math.sin(u)];
}

// The deformation. `heat` is the two fields as the shader reads them (each scaled by HEAT_SCALE and
// clipped at 1, then summed); `ring` is that heat averaged around the tube at the same angle u. The
// stage's vertex shader uses the same formulas, so the WebGL figure, the reduced-motion still and the
// pointer picking agree. The power keeps the cool background (heat about 0.1) at rest and puts the
// swelling at the sources (a single field peaks near 1); the cap limits where both fields stack.
export const HEAT_SCALE = 200 / 255; // the heat texture stores min(255, 200 h)
export const SWELL = 0.3; // fraction of the tube radius added at heat 1
export const SWELL_P = 1.4;
export const SWELL_CAP = 1;
export const RING_SWELL = 0.1; // the ring widens where its cross-section is warm
export const LIFT = 0.24; // and rises out of its plane
export const swollen = (heat: number) => r * (1 + SWELL * Math.pow(Math.min(Math.max(heat, 0), SWELL_CAP), SWELL_P));
/** `bulge` is the ground at this point and `ringB` the ground around the tube here, both in [-1, 1]. */
export function meshPoint(u: number, v: number, heat: number, ring: number, bulge = 0, ringB = 0): [number, number, number] {
  const rr = swollen(heat) * (1 + AMB_TUBE * bulge), c = R * (1 + RING_SWELL * ring + AMB_RING * ringB) + rr * Math.cos(v);
  return [c * Math.cos(u), rr * Math.sin(v) + LIFT * ring + AMB_LIFT * ringB, c * Math.sin(u)];
}
/** Both fields at grid node k, as the shader sees them. */
export const heatAtNode = (human: Float32Array, ai: Float32Array, k: number) =>
  Math.min(1, human[k] * HEAT_SCALE) + Math.min(1, ai[k] * HEAT_SCALE);
/** A grid quantity at (s, t) in [0, 1)², interpolated between nodes like the shader's texture lookup. */
function lerp2(at: (k: number) => number, s: number, t: number) {
  const x = s * NU, y = t * NV;
  const i0 = Math.floor(x), j0 = Math.floor(y), fx = x - i0, fy = y - j0;
  const i = ((i0 % NU) + NU) % NU, j = ((j0 % NV) + NV) % NV, i1 = (i + 1) % NU, j1 = (j + 1) % NV;
  return (at(j * NU + i) * (1 - fx) + at(j * NU + i1) * fx) * (1 - fy) + (at(j1 * NU + i) * (1 - fx) + at(j1 * NU + i1) * fx) * fy;
}
/** Both fields at (s, t). */
export const heatAt = (human: Float32Array, ai: Float32Array, s: number, t: number) => lerp2((k) => heatAtNode(human, ai, k), s, t);
/** The heat around the tube at ring position s, from the same four samples the shader takes. */
export const ringAt = (human: Float32Array, ai: Float32Array, s: number) =>
  (heatAt(human, ai, s, 0) + heatAt(human, ai, s, 0.25) + heatAt(human, ai, s, 0.5) + heatAt(human, ai, s, 0.75)) / 4;
/** The ground at (s, t), and around the tube at ring position s (the same four samples). */
export const ambAt = (amb: Float32Array, s: number, t: number) => lerp2((k) => amb[k], s, t);
export const ambRingAt = (amb: Float32Array, s: number) =>
  (ambAt(amb, s, 0) + ambAt(amb, s, 0.25) + ambAt(amb, s, 0.5) + ambAt(amb, s, 0.75)) / 4;

// The ground: a handful of waves around the ring (m) and the tube (n). Each one's strength swells and
// fades and its crest drifts, all at unrelated slow rates (the drift itself wanders), so the surface
// bulges, thins and warps everywhere at once and never in the same way twice. The waves with n = 0 bend
// the ring; the rest ripple the tube.
export const AMB_TUBE = 0.26; // the tube's radius moves by up to this fraction
export const AMB_RING = 0.05; // the ring widens or narrows by up to this fraction
export const AMB_LIFT = 0.16; // and rises or dips by up to this much
export const AMB_T0 = 37; // seconds into the pattern at the first frame, so it opens already flowing
// No wave has m = 1 and n = 0: that one would only rock the whole ring, not deform it.
//                                                       m   n  weight drift  phase breathe
const WAVES: [number, number, number, number, number, number][] = [
  [2, 0, 0.8, 0.11, 0.0, 0.05],
  [3, 0, 0.55, -0.16, 1.7, 0.071],
  [1, 1, 0.9, -0.13, 2.9, 0.061],
  [2, -1, 0.7, 0.17, 0.6, 0.083],
  [3, 1, 0.5, -0.19, 5.2, 0.039],
  [1, -2, 0.45, 0.23, 3.3, 0.107],
  [4, 2, 0.35, -0.27, 1.1, 0.057],
  [5, -1, 0.3, 0.21, 4.1, 0.093],
];
const WAVE_NORM = 1 / (0.36 * WAVES.reduce((sum, w) => sum + w[2], 0));
/** The ground at time t: one value in [-1, 1] per heat-grid node (row-major, NU across, NV down). */
export function ambient(out: Float32Array, t: number) {
  const amp = WAVES.map(([, , wgt, , ph, br]) => wgt * WAVE_NORM * (0.55 + 0.45 * Math.sin(br * t + 1.3 * ph)));
  const at = WAVES.map(([, , , dr, ph, br]) => ph + dr * t + 0.9 * Math.sin(0.37 * br * t + ph));
  for (let j = 0; j < NV; j++) {
    for (let i = 0; i < NU; i++) {
      let b = 0;
      for (let k = 0; k < WAVES.length; k++) b += amp[k] * Math.cos(WAVES[k][0] * i * du + WAVES[k][1] * j * dv + at[k]);
      out[j * NU + i] = Math.max(-1, Math.min(1, b));
    }
  }
}

/** Model → view: spin about the torus axis (y), tilt toward the viewer (x), lean in the frame (z). Matches the stage. */
export function toView([x, y, z]: [number, number, number], spin: number): [number, number, number] {
  const cs = Math.cos(spin), ss = Math.sin(spin);
  const x1 = cs * x + ss * z, z1 = -ss * x + cs * z; // Ry(spin)
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  const y2 = ct * y - st * z1, z2 = st * y + ct * z1; // Rx(tilt)
  const cr = Math.cos(ROLL), sr = Math.sin(ROLL);
  return [cr * x1 - sr * y2, sr * x1 + cr * y2, z2 - CAM_Z]; // Rz(roll), then the camera distance
}

const F = 1 / Math.tan((FOV * Math.PI) / 360);
/** View → normalized device coordinates (x scaled by the viewport aspect, like the GL camera). */
export function project([x, y, z]: [number, number, number], aspect = 1): [number, number, number] {
  return [(F * x) / (-z * aspect), (F * y) / -z, -z];
}

/** True when the surface at (u, v) faces the camera. */
export function facing(u: number, v: number, spin: number) {
  const p = toView(surface(u, v), spin);
  const n = toView(normal(u, v), spin);
  const nz = n[2] + CAM_Z; // toView translated; undo for a direction
  return n[0] * -p[0] + n[1] * -p[1] + nz * -p[2] > 0;
}

/** Pencil wireframe (meridians and parallels) as projected polylines in NDC, for the SVG draft. */
export function wireframe(spin: number, meridians = 24, parallels = 10, steps = 56) {
  const lines: { pts: number[] }[] = [];
  const ring = (fu: (t: number) => number, fv: (t: number) => number) => {
    const pts: number[] = [];
    for (let s = 0; s <= steps; s++) {
      const [x, y] = project(toView(surface(fu(s / steps), fv(s / steps)), spin));
      pts.push(x, y);
    }
    lines.push({ pts });
  };
  for (let m = 0; m < meridians; m++) ring(() => (m / meridians) * TAU, (t) => t * TAU);
  for (let p = 0; p < parallels; p++) ring((t) => t * TAU, () => (p / parallels) * TAU);
  return lines;
}
