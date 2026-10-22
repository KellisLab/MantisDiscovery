// Boundary spectra and weak collisional relaxation in an electrostatic gyrokinetic model (Zenodo 23484782).
// The complex plane of the undriven evolution: the closed left half-plane (hatched) is its spectrum for
// zero inflow, the imaginary axis (ink) its spectrum for periodic boundaries. On the axis sit approximate
// eigenvalues iω, ω = −2.5 … 2.5, each with a residual disc of the paper's radius
// C(ν^{1/3} + ν^{1/5}|ω|^{2/5}), drawn with C = 1 since the constant is not computed here. The collision
// rate ν sweeps down six decades on a log scale; the check evaluates the stated bound at the drawn ν and
// passes once the residual at |ω| = 1 has fallen below 0.1. It evaluates the bound; it does not prove it.
import { lineInBox, TAU } from './kit';
import type { Painter } from './painter';
import type { PlateDef, Stroke, Tone } from './types';

const BOX: [number, number, number, number] = [-4.2, -3.6, 3, 3.6]; // Re λ × Im λ
const OMEGA = Array.from({ length: 11 }, (_, k) => -2.5 + 0.5 * k);
const radius = (nu: number, w: number) => Math.cbrt(nu) + Math.pow(nu, 0.2) * Math.pow(Math.abs(w), 0.4);
const SWEEP = 10; // seconds: 9 s from 10⁻¹ down to 10⁻⁷, a short hold, then restart
const logNu = (u: number) => -1 - 6 * Math.min(1, u / 0.9);
const U0 = 0.547; // where the sweep stands when the check starts: ν ≈ 2.2 × 10⁻⁵
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sci = (v: number) => {
  let e = Math.floor(Math.log10(v)), m = v / 10 ** e;
  if (m >= 9.95) { m = 1; e++; }
  return `${m.toFixed(1)} × 10${e < 0 ? '⁻' : ''}${[...String(Math.abs(e))].map((d) => SUP[+d]).join('')}`;
};

const N = 72;
const ring = new Float64Array(2 * (N + 1));
/** A residual disc, clipped to the plot window (large discs at strong collisions overrun it). */
function disc(p: Painter, cy: number, r: number, tone: Tone, alpha: number, w: number) {
  let n = 0;
  const flush = () => { if (n > 1) p.poly(ring.subarray(0, 2 * n), tone, { w, alpha }); n = 0; };
  for (let i = 0; i <= N; i++) {
    const x = r * Math.cos((TAU * i) / N), y = cy + r * Math.sin((TAU * i) / N);
    if (y > BOX[3] || y < BOX[1]) { flush(); continue; }
    ring[2 * n] = x; ring[2 * n + 1] = y; n++;
  }
  flush();
}

const plate: PlateDef = {
  id: 'gk-boundary',
  bounds: [-4.35, -3.8, 3.35, 3.9],
  check: 'Residuals vanish as collisions weaken',
  create() {
    const strokes: Stroke[] = [];
    // Hatching of the closed left half-plane: lines x − y = const at 45°.
    const H: [number, number, number, number] = [BOX[0], BOX[1], 0, BOX[3]];
    for (let c = -5.55, i = 0; c < 2.6; c += 0.25, i++) {
      const s = lineInBox(-Math.PI / 4, c, H);
      if (s) strokes.push({ pts: [s[0], s[1], s[2], s[3]], tone: 'faint', at: 0.02 + i * 0.008 });
    }
    strokes.push(
      { pts: [BOX[0], 0, BOX[2], 0], tone: 'ghost', w: 1.2, at: 0.3 },
      { pts: [0, BOX[1], 0, BOX[3]], tone: 'ink', w: 1.3, at: 0.32 },
    );
    const nu0 = 10 ** logNu(U0);
    OMEGA.forEach((w, k) => {
      const r = radius(nu0, w), pts: number[] = [];
      for (let i = 0; i <= N; i++) pts.push(r * Math.cos((TAU * i) / N), w + r * Math.sin((TAU * i) / N));
      strokes.push({ pts, tone: 'ink', w: 0.8, at: 0.42 + k * 0.012, transient: true });
    });

    let u = U0, passed = false;
    const nu = () => 10 ** logNu(u);

    return {
      scene: {
        strokes,
        dots: OMEGA.map((w) => ({ x: 0, y: w, r: 2, tone: 'ink' as const })),
        labels: [
          { x: 2.95, y: 0.24, text: 'Re λ', tone: 'draft', align: 'right', math: true },
          { x: 0.2, y: 3.42, text: 'Im λ', tone: 'draft', math: true },
          { x: 0.2, y: 1.1, text: 'i', tone: 'ghost', math: true, size: 12 },
          { x: 0.2, y: -0.9, text: '−i', tone: 'ghost', math: true, size: 12 },
          { x: 2.95, y: -3.42, text: 'r = ∛ν + ⁵√(νω²)', tone: 'draft', align: 'right', math: true, size: 13 },
        ],
      },
      update(dt) {
        u = (u + dt / SWEEP) % 1;
        if (radius(nu(), 1) < 0.1) passed = true;
      },
      draw(p: Painter, _t, inked) {
        const v = nu();
        const fade = Math.max(0, Math.min(1, u / 0.03, (1 - u) / 0.05)); // out at the end, back in at the restart
        for (const w of OMEGA) {
          const r = radius(v, w);
          const a = fade * Math.min(1, 0.1 / r + 0.3), lw = Math.abs(w) === 1 ? 1.15 : 0.8;
          if (inked < 1) disc(p, w, r, 'draft', a * (1 - inked), lw);
          if (inked > 0) disc(p, w, r, 'ink', a * inked, lw);
        }
      },
      readings: () => [
        { label: 'Collision rate ν', value: sci(nu()) },
        { label: 'Residual at |ω| = 1', value: radius(nu(), 1).toPrecision(3), done: passed },
      ],
      settle() {
        u = 0.675; // ν = 10^−5.5, past the threshold
        passed = radius(nu(), 1) < 0.1;
      },
    };
  },
};

export default plate;
