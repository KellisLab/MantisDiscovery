// Stationary response and singular limits in a linear zonal gyrokinetic model (Zenodo 23484800).
// A poloidal cross-section of a torus with inverse aspect ratio ε = a/R₀ = 0.3 and field
// B ∝ 1/(1 + ε cos θ): nested flux surfaces (Shafranov-shifted, slightly D-shaped), passing orbits that
// circle the whole section and trapped banana orbits that bounce between two tips on the outboard side.
// Guiding centers move along each orbit with dθ/dt ∝ v∥. The check draws Maxwellian velocities at the
// outboard midplane: a particle is trapped iff (v∥/v)² < 2ε/(1 + ε), so the trapped share must match
// √(2ε/(1 + ε)) = 67.9% within three standard errors.
import { rng, fmt, TAU } from './kit';
import type { Painter } from './painter';
import type { Dot, PlateDef, Stroke } from './types';

const EPS = 0.3;
const CRIT = (2 * EPS) / (1 + EPS);
const EXACT = Math.sqrt(CRIT); // 0.6794
const DRIFT = 0.26; // radial excursion per unit v∥/v (the drawn scale of the guiding-center drift)
const SY = -1.42; // the pitch scale v∥/v ∈ [−1, 1] under the section
const LIFE = 1.5; // seconds a sampled particle's tick stays on the scale

// Flux coordinates (r, θ) → plate: minor radius 1, outward Shafranov shift, slight elongation and D.
const at = (r: number, th: number) => [0.12 * (1 - r * r) + r * Math.cos(th + 0.2 * r * r * Math.sin(th)), 1.08 * r * Math.sin(th)];
// |v∥/v| at angle θ for pitch ξ₀ at the outboard midplane, on a surface of local inverse aspect ratio e.
const pitch = (xi0: number, e: number, th: number) => Math.sqrt(Math.max(0, 1 - ((1 - xi0 * xi0) * (1 + e)) / (1 + e * Math.cos(th))));

type Orbit = { pts: number[]; run: Float64Array; period: number; phase: number };

/** A closed guiding-center orbit, sampled for drawing and resampled uniformly in time for its dot.
 *  r − DRIFT·v∥/v is conserved. Trapped: r0 is the radius of the tips. Passing: r0 is the mean radius. */
function orbit(trapped: boolean, r0: number, xi0: number, sign: number, period: number, phase: number): Orbit {
  const e = EPS * r0, n = 240, pts: number[] = [], T = [0];
  const k = trapped ? Math.sin(Math.acos(((1 - xi0 * xi0) * (1 + e) - 1) / e) / 2) : 0; // sin of half the bounce angle
  const mid = trapped ? 0 : (xi0 + pitch(xi0, e, Math.PI)) / 2;
  for (let i = 0; i <= n; i++) {
    const s = (TAU * i) / n;
    // Trapped: θ = 2 asin(k sin φ) runs between the tips ±θ_b; the exact field gives dt ∝ √(1 + e cos θ)/cos(θ/2) dφ.
    // Passing: θ runs all the way round with dt ∝ dθ/|v∥|.
    const th = trapped ? 2 * Math.asin(k * Math.sin(s)) : sign * s;
    const v = pitch(xi0, e, th);
    const [x, y] = at(r0 + DRIFT * (trapped ? (Math.cos(s) >= 0 ? v : -v) : sign * (v - mid)), th);
    pts.push(x, y);
    if (i) T.push(T[i - 1] + (trapped ? Math.sqrt(1 + e * Math.cos(th)) / Math.cos(th / 2) : 1 / v));
  }
  const M = 360, run = new Float64Array(2 * M);
  for (let m = 0, j = 0; m < M; m++) {
    const t = (T[n] * m) / M;
    while (T[j + 1] < t) j++;
    const f = (t - T[j]) / (T[j + 1] - T[j]);
    run[2 * m] = pts[2 * j] + (pts[2 * j + 2] - pts[2 * j]) * f;
    run[2 * m + 1] = pts[2 * j + 1] + (pts[2 * j + 3] - pts[2 * j + 1]) * f;
  }
  return { pts, run, period, phase };
}

const ORBITS = [
  orbit(false, 0.3, 0.6, 1, 9.5, 0.1), // co-passing, displaced outward
  orbit(false, 0.66, 0.7, -1, 12, 0.55), // counter-passing, displaced inward
  orbit(true, 0.5, 0.22, 1, 5.6, 0.3), // deeply trapped banana, tips at ±51°
  orbit(true, 0.84, 0.34, 1, 7.2, 0.8), // wider banana, tips at ±65°
];

const pos = (o: Orbit, time: number, out: number[]) => {
  const M = o.run.length / 2, u = ((((time / o.period + o.phase) % 1) + 1) % 1) * M;
  const m = Math.floor(u) % M, m1 = (m + 1) % M, f = u - Math.floor(u);
  out[0] = o.run[2 * m] + (o.run[2 * m1] - o.run[2 * m]) * f;
  out[1] = o.run[2 * m + 1] + (o.run[2 * m1 + 1] - o.run[2 * m + 1]) * f;
  return out;
};

const plate: PlateDef = {
  id: 'gk-stationary',
  bounds: [-1.62, -1.78, 1.62, 1.46],
  check: 'Trapped fraction matches √(2ε/(1 + ε))',
  create(seed) {
    const R = rng(seed);
    const strokes: Stroke[] = [];
    [0.2, 0.4, 0.6, 0.8, 1].forEach((r, i) => {
      const pts: number[] = [];
      for (let k = 0; k <= 160; k++) pts.push(...at(r, (TAU * k) / 160));
      strokes.push({ pts, tone: r === 1 ? 'draft' : 'faint', w: r === 1 ? 1.1 : 1, closed: true, at: 0.04 * (4 - i) });
    });
    strokes.push({ pts: [-1.12, 0, 1.12, 0], tone: 'ghost', dash: [2, 4], at: 0.2 });
    strokes.push({ pts: [0.08, 0, 0.16, 0], tone: 'draft', at: 0.22 }, { pts: [0.12, -0.04, 0.12, 0.04], tone: 'draft', at: 0.22 });
    ORBITS.forEach((o, i) => strokes.push({ pts: o.pts, tone: 'ink', w: i < 2 ? 0.7 : 0.95, at: 0.3 + i * 0.06 }));
    // Pitch scale: v∥/v from −1 to 1, the trapped band |v∥/v| < √(2ε/(1 + ε)) between two marks.
    strokes.push(
      { pts: [-1, SY, 1, SY], tone: 'faint', at: 0.48 },
      { pts: [-EXACT, SY, EXACT, SY], tone: 'draft', at: 0.52 },
      ...[-1, 1].map((s): Stroke => ({ pts: [s, SY - 0.035, s, SY + 0.035], tone: 'faint', at: 0.54 })),
      ...[-EXACT, EXACT].map((x): Stroke => ({ pts: [x, SY - 0.09, x, SY + 0.09], tone: 'draft', at: 0.55 })),
    );

    // Monte Carlo at the outboard midplane: isotropic Maxwellian velocity, B along z.
    let n = 0, trapped = 0, acc = 0;
    const CAP = 220;
    const tx = new Float64Array(CAP), tb = new Float64Array(CAP).fill(-99), tt = new Uint8Array(CAP);
    let head = 0;
    const sample = (born: number) => {
      const vx = R.normal(), vy = R.normal(), vz = R.normal();
      const xi = vz / Math.sqrt(vx * vx + vy * vy + vz * vz);
      const t = xi * xi < CRIT;
      n++;
      if (t) trapped++;
      tx[head] = xi; tb[head] = born; tt[head] = t ? 1 : 0;
      head = (head + 1) % CAP;
    };
    const tmp = [0, 0];
    const dots: Dot[] = ORBITS.map((o) => { const [x, y] = pos(o, 0, tmp); return { x, y, r: 2.6, tone: 'ink', transient: true }; });
    dots.push({ x: 1, y: 0, r: 3.2, tone: 'draft', hollow: true });

    return {
      scene: {
        strokes,
        dots,
        labels: [
          { x: 1.08, y: 0, text: 'ε = 0.3', tone: 'draft', math: true, size: 13 },
          { x: 0, y: SY + 0.17, text: 'trapped', tone: 'ghost', align: 'center' },
          { x: 1.07, y: SY, text: 'v∥/v', tone: 'ghost', math: true, size: 13 },
        ],
      },
      update(dt, time) {
        // A burst while the check runs on the draft, then a slow, steady trickle forever.
        acc += dt * (n < 330 ? 330 : 16);
        while (acc >= 1) { acc--; sample(time); }
      },
      draw(p: Painter, time, inked) {
        for (let i = 0; i < CAP; i++) {
          const age = time - tb[i];
          if (age < 0 || age > LIFE) continue;
          const a = 1 - age / LIFE, h = tt[i] ? 0.075 : 0.05;
          p.line(tx[i], SY - h, tx[i], SY + h, tt[i] && inked > 0 ? 'ink' : 'draft', { alpha: a * (tt[i] ? 0.35 + 0.5 * inked : 0.8), w: 0.8 });
        }
        for (const o of ORBITS) {
          const [x, y] = pos(o, time, tmp);
          if (inked < 1) p.dot(x, y, 2.6, 'draft', { hollow: true, alpha: 1 - inked });
          if (inked > 0) p.dot(x, y, 2.6, 'ink', { alpha: inked });
        }
      },
      readings: () => {
        const f = n ? trapped / n : 0;
        const ok = n >= 300 && Math.abs(f - EXACT) <= 3 * Math.sqrt((EXACT * (1 - EXACT)) / n);
        return [
          { label: 'Particles sampled', value: fmt(n) },
          { label: 'Trapped, exact 67.9%', value: n ? `${(100 * f).toFixed(1)}%` : ' ', done: ok },
        ];
      },
      settle() {
        for (let i = 0; i < 20000 - 60; i++) sample(-99);
        for (let i = 60; i > 0; i--) sample(-(LIFE * i) / 70); // the latest 60 samples, fading with age
      },
    };
  },
};

export default plate;
