// Critical logarithmic Sobolev stability: moment bounds and heat flow (Zenodo 23484591).
// A density with a small escaping bump, p₀ = 0.92·N(−0.8, 0.45²) + 0.08·N(3.2, 0.3²), carried by the
// Ornstein-Uhlenbeck flow toward the standard Gaussian γ. The flow is exact: each component N(μ, σ²) is
// N(μe^{−t}, σ²e^{−2t} + 1 − e^{−2t}) at time t. Earlier times are pencil, γ is ink, p_t is the bold curve.
// The check computes the relative Fisher information I(p_t | γ) = ∫ p_t |∂ₓ log(p_t/γ)|² on 801 points
// of [−7, 7] at every step of the flow and passes once a full sweep 0 ≤ t ≤ 2.4 has seen it only fall.
// The strip below is its record, on a log scale.
import { TAU } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke } from './types';

const W = [0.92, 0.08], MU = [-0.8, 3.2], SD = [0.45, 0.3];
const TMAX = 2.4;
const X0 = -3.8, X1 = 4.6, YS = 5.2; // density panel: baseline y = 0, height = density × YS
const SX0 = -3.6, SX1 = 4.4; // strip: t ∈ [0, 2.4] → x, log₁₀ I ∈ [−3, 1] → y
const sx = (t: number) => SX0 + ((SX1 - SX0) * t) / TMAX;
const sy = (I: number) => -2.95 + 0.475 * (Math.log10(I) + 3);
const SNAP = [0, 0.15, 0.35, 0.6, 1, 1.6];

// Component parameters at flow time t, written into scratch arrays (no allocation per frame).
const cm = [0, 0], cs = [0, 0], ca = [0, 0];
function flow(t: number) {
  const e1 = Math.exp(-t), e2 = e1 * e1;
  for (let c = 0; c < 2; c++) {
    const v = SD[c] * SD[c] * e2 + 1 - e2;
    cm[c] = MU[c] * e1; cs[c] = v; ca[c] = W[c] / Math.sqrt(TAU * v);
  }
}
const density = (x: number) => {
  let p = 0;
  for (let c = 0; c < 2; c++) p += ca[c] * Math.exp(-((x - cm[c]) ** 2) / (2 * cs[c]));
  return p;
};
/** I(p_t | γ) = ∫ (p' + x p)² / p, trapezoid rule on 801 points of [−7, 7], derivatives analytic. */
function fisher(t: number) {
  flow(t);
  const n = 801, h = 14 / (n - 1);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = -7 + i * h;
    let p = 0, dp = 0;
    for (let c = 0; c < 2; c++) {
      const g = ca[c] * Math.exp(-((x - cm[c]) ** 2) / (2 * cs[c]));
      p += g; dp -= (g * (x - cm[c])) / cs[c];
    }
    if (p > 1e-300) sum += ((i === 0 || i === n - 1 ? 0.5 : 1) * (dp + x * p) ** 2) / p;
  }
  return sum * h;
}
const curve = <T extends number[] | Float64Array>(t: number, out: T): T => {
  flow(t);
  const n = out.length / 2;
  for (let i = 0; i < n; i++) { const x = X0 + ((X1 - X0) * i) / (n - 1); out[2 * i] = x; out[2 * i + 1] = YS * density(x); }
  return out;
};

const plate: PlateDef = {
  id: 'log-sobolev',
  bounds: [-4.15, -3.55, 4.95, 5.55],
  check: 'Fisher information falls along the flow',
  create() {
    const strokes: Stroke[] = [
      { pts: [X0, 0, X1, 0], tone: 'ghost', w: 1.2, at: 0 },
      { pts: [0, -0.07, 0, 0], tone: 'ghost', at: 0.02 },
      ...SNAP.map((t, i): Stroke => ({ pts: curve(t, new Array(482)), tone: i === 0 ? 'draft' : 'faint', at: 0.05 + i * 0.05 })),
      { pts: curve(40, new Array(482)), tone: 'ink', w: 1.15, at: 0.36 }, // γ: the flow at t = ∞
      { pts: curve(0, new Array(482)), tone: 'ink', w: 1.7, at: 0.42, transient: true },
      { pts: [SX0, -2.95, SX1, -2.95], tone: 'ghost', at: 0.48 },
      ...SNAP.map((t): Stroke => ({ pts: [sx(t), -2.95, sx(t), -2.86], tone: 'faint', at: 0.52 })),
      // The record the check will retrace, sketched for the draft.
      { pts: Array.from({ length: 49 }, (_, k) => [sx(k * 0.05), sy(fisher(k * 0.05))]).flat(), tone: 'draft', at: 0.55, transient: true },
    ];

    const live = new Float64Array(482);
    const CAP = 4096;
    const trace = new Float64Array(2 * CAP), last = new Float64Array(2 * CAP);
    let nTrace = 0, nLast = 0;
    let t = 0, I = fisher(0), prev = Infinity, rising = 0, sweeps = 0, failed = 0, rest = -1;
    const record = () => {
      I = fisher(t);
      if (I > prev) rising++;
      prev = I;
      if (nTrace < CAP) { trace[2 * nTrace] = sx(t); trace[2 * nTrace + 1] = sy(I); nTrace++; }
    };
    record();
    const finish = () => {
      sweeps++;
      if (rising) failed++;
      last.set(trace.subarray(0, 2 * nTrace)); nLast = nTrace;
    };

    return {
      scene: {
        strokes,
        labels: [
          { x: -0.8, y: 4.62, text: 'p₀', tone: 'draft', align: 'center', math: true },
          { x: 1.2, y: 1.45, text: 'γ', tone: 'draft', math: true },
          { x: SX0, y: -0.75, text: 'I(pₜ | γ)', tone: 'draft', math: true, size: 13 },
          { x: SX1 + 0.18, y: -2.95, text: 't', tone: 'ghost', math: true, size: 13 },
        ],
      },
      update(dt) {
        if (rest >= 0) { // a short pause at equilibrium, then the flow starts again from p₀
          rest += dt;
          if (rest > 1.1) { rest = -1; t = 0; prev = Infinity; rising = 0; nTrace = 0; record(); }
          return;
        }
        t = Math.min(TMAX, t + dt * (sweeps === 0 ? 2 : 0.32)); // the first sweep is the check on the draft
        record();
        if (t >= TMAX) { finish(); rest = 0; }
      },
      draw(p: Painter, _time, inked) {
        const pencil = inked < 1, ink = inked > 0;
        if (nLast > 1) p.poly(last.subarray(0, 2 * nLast), 'faint');
        if (nTrace > 1) p.poly(trace.subarray(0, 2 * nTrace), 'draft', { w: 1.1 });
        const fade = rest >= 0 ? Math.max(0, 1 - rest / 0.5) : Math.min(1, t / 0.06 + 0.15);
        curve(t, live);
        if (pencil) p.poly(live, 'draft', { w: 1.7, alpha: fade * (1 - inked) });
        if (ink) p.poly(live, 'ink', { w: 1.7, alpha: fade * inked });
        const x = sx(t), y = sy(I);
        if (pencil) p.dot(x, y, 2.6, 'draft', { hollow: true, alpha: 1 - inked });
        if (ink) p.dot(x, y, 2.6, 'ink', { alpha: inked });
      },
      readings: () => [
        { label: 'Flow time t', value: t.toFixed(2) },
        { label: 'Fisher information', value: I.toPrecision(3), done: sweeps > 0 && failed === 0 },
      ],
      settle() {
        t = 0; prev = Infinity; rising = 0; nTrace = 0;
        for (let k = 0; k <= 240; k++) { t = (TMAX * k) / 240; record(); }
        finish();
        t = 0.8; I = fisher(t); // the still: mid-flow, between the pencil curves at 0.6 and 1.0
      },
    };
  },
};

export default plate;
