// The figures' fixed geometry and data, computed once and written into src/:
//   public/models/gyro-*.glb  a tokamak-like torus cut open: three nested flux surfaces, field lines on the
//                             outer one, and the surfaces' sections at the two cuts
//   public/models/gyro-limits.glb  sin(δt)/(δt), the time average of a slow rotation e^{iδt}
//   data/green.json           the discrete Green's function of the 5-point Dirichlet Laplacian on a 32 x 32 grid
//                             at one point, and the share of it outside a 7 x 7 window there
import fs from 'node:fs';
import { heightField, merge, surface, tube, writeGlb } from './glb.mjs';

const models = new URL('../src/public/models/', import.meta.url).pathname;
const data = new URL('../src/data/', import.meta.url).pathname;
fs.mkdirSync(models, { recursive: true });
for (const f of fs.readdirSync(models)) fs.unlinkSync(models + f);

// --- the torus -------------------------------------------------------------------------------------------
// x = (R0 + r cos θ) cos φ, y = r sin θ, z = -(R0 + r cos θ) sin φ; θ = 0 is the outboard midplane. The wedge
// centred on φ = 270° (facing +z, the camera's usual side) is cut away: φ runs from -45° to 225°.
export const TORUS = { R0: 1.25, radii: [0.5, 0.32, 0.15], phi0: -Math.PI / 4, phi1: (5 * Math.PI) / 4, q: 3 };
const tp = (r, th, ph) => [(TORUS.R0 + r * Math.cos(th)) * Math.cos(ph), r * Math.sin(th), -(TORUS.R0 + r * Math.cos(th)) * Math.sin(ph)];
const span = TORUS.phi1 - TORUS.phi0;
const AZURE = [0.31, 0.616, 1], VIOLET = [0.635, 0.522, 1];
TORUS.radii.forEach((r, k) => {
  writeGlb(models + `gyro-surface-${k}.glb`, {
    ...surface((u, v) => tp(r, v * 2 * Math.PI, TORUS.phi0 + u * span), { nu: 96, nv: 40 }),
    material: { color: [...(k === 1 ? VIOLET : AZURE), [0.13, 0.17, 0.26][k]], roughness: 0.35, emissive: (k === 1 ? VIOLET : AZURE).map((c) => c * 0.05) },
  });
});
// field lines on the outer surface: θ = θ0 + (φ - φ0) / q
const lines = [];
for (let k = 0; k < 16; k++) {
  const th0 = (k / 16) * 2 * Math.PI, pts = [];
  for (let i = 0; i <= 220; i++) { const ph = TORUS.phi0 + (i / 220) * span; pts.push(tp(TORUS.radii[0] + 0.004, th0 + (ph - TORUS.phi0) / TORUS.q, ph)); }
  lines.push(tube(pts, 0.0055, 6));
}
writeGlb(models + 'gyro-lines.glb', { ...merge(lines), material: { color: [...AZURE, 1], roughness: 0.45, emissive: AZURE.map((c) => c * 0.25) } });
// the sections at the two cuts, and the magnetic axis
const rings = [];
for (const ph of [TORUS.phi0, TORUS.phi1]) for (const r of TORUS.radii) {
  const pts = [];
  for (let i = 0; i <= 96; i++) pts.push(tp(r, (i / 96) * 2 * Math.PI, ph));
  rings.push(tube(pts, 0.007, 8));
}
const axis = [];
for (let i = 0; i <= 160; i++) axis.push(tp(0, 0, TORUS.phi0 + (i / 160) * span));
rings.push(tube(axis, 0.006, 8));
writeGlb(models + 'gyro-sections.glb', { ...merge(rings), material: { color: [0.925, 0.933, 0.918, 1], roughness: 0.4 } });

// --- sin(δt)/(δt) ----------------------------------------------------------------------------------------
// t = 40u along x, δ = 0.5v along z, height 0.85 at the ridge.
export const LIMITS = { T: 40, D: 0.5, P: 1, H: 0.85, w: 3.2, d: 2.2 };
const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
writeGlb(models + 'gyro-limits.glb', {
  ...heightField((u, v) => sinc(LIMITS.T * u * LIMITS.D * Math.pow(v, LIMITS.P)) * LIMITS.H, { nx: 180, nz: 110, w: LIMITS.w, d: LIMITS.d }),
  material: { color: [...VIOLET, 1], roughness: 0.7, emissive: VIOLET.map((c) => c * 0.02) },
});

// --- the Green's function --------------------------------------------------------------------------------
// G(p, x) = Σ φ_mn(p) φ_mn(x) / λ_mn over the grid's sine modes, λ_mn = 4 sin²(mπ/2N) + 4 sin²(nπ/2N) (h = 1),
// exact for the 5-point Laplacian on n x n interior points (N = n + 1).
const n = 32, N = n + 1, w = 3, P = [13, 19]; // p as interior indices 1..n
const s = (k, i) => Math.sin((k * i * Math.PI) / N);
const G = [];
for (let j = 1; j <= n; j++) for (let i = 1; i <= n; i++) {
  let g = 0;
  for (let m = 1; m < N; m++) for (let l = 1; l < N; l++) g += (s(m, P[0]) * s(l, P[1]) * s(m, i) * s(l, j)) / (4 * Math.sin((m * Math.PI) / (2 * N)) ** 2 + 4 * Math.sin((l * Math.PI) / (2 * N)) ** 2);
  G.push(g);
}
const peak = Math.max(...G), total = G.reduce((a, b) => a + b, 0);
let inside = 0;
for (let j = 1; j <= n; j++) for (let i = 1; i <= n; i++) if (Math.abs(i - P[0]) <= w && Math.abs(j - P[1]) <= w) inside += G[(j - 1) * n + (i - 1)];
const outside = +(100 * (1 - inside / total)).toFixed(1);
fs.writeFileSync(data + 'green.json', JSON.stringify({ n, w, p: P, outside, blocks: (n / (w + 1)) ** 2, g: G.map((v) => +(v / peak).toFixed(4)) }));
console.log(JSON.stringify({ n, w, p: P, outside, blocks: (n / (w + 1)) ** 2 }));
console.log('models:', fs.readdirSync(models).join(', '));
