// A dark studio as an equirectangular Radiance .hdr, for the figures' image-based light: a near-black room,
// one wide soft box overhead, a cool strip low behind the camera's usual side and a faint floor bounce.
// Written flat (no run-length encoding), which every .hdr reader accepts.
import fs from 'node:fs';

const W = 1024, H = 512;
const out = new URL('../src/public/env/studio.hdr', import.meta.url).pathname;
fs.mkdirSync(new URL('../src/public/env/', import.meta.url).pathname, { recursive: true });

const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// Direction for pixel (i, j), three.js convention: the centre column looks toward +x, a quarter across is +z.
function dir(i, j) {
  const u = (i + 0.5) / W, v = (j + 0.5) / H;
  const phi = (u - 0.5) * 2 * Math.PI, theta = v * Math.PI; // theta from +y
  return [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];
}

function radiance([x, y, z]) {
  let r = 0.012, g = 0.014, b = 0.02; // the room
  // soft box overhead, a little toward -x (the key light's side)
  const box = smooth(0.62, 0.9, y) * smooth(-0.55, 0.15, -x * 0.6 + y * 0.4);
  r += 5.2 * box; g += 5.1 * box; b += 4.9 * box;
  // cool strip low on the far side (rim)
  const strip = smooth(0.08, 0.0, Math.abs(y - 0.12)) * smooth(0.2, 0.75, -z);
  r += 1.1 * strip; g += 1.35 * strip; b += 1.8 * strip;
  // floor bounce
  const floor = smooth(-0.2, -0.9, y);
  r += 0.02 * floor; g += 0.022 * floor; b += 0.03 * floor;
  return [r, g, b];
}

function rgbe([r, g, b]) {
  const m = Math.max(r, g, b);
  if (m < 1e-32) return [0, 0, 0, 0];
  const e = Math.ceil(Math.log2(m) + 1e-9), s = 256 / Math.pow(2, e);
  return [Math.min(255, Math.floor(r * s)), Math.min(255, Math.floor(g * s)), Math.min(255, Math.floor(b * s)), e + 128];
}

const header = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${H} +X ${W}\n`, 'ascii');
const px = Buffer.alloc(W * H * 4);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) px.set(rgbe(radiance(dir(i, j))), (j * W + i) * 4);
fs.writeFileSync(out, Buffer.concat([header, px]));
console.log('wrote', out, fs.statSync(out).size, 'bytes');
