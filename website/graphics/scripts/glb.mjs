// A minimal glTF 2.0 binary writer: triangle meshes (positions, normals, indices), one material each.
// Kinetograph reads base colour, metallic, roughness and emissive from the material.
import fs from 'node:fs';

/**
 * Write a .glb. Pass one mesh as `{ positions, normals, indices, material }`, or several as `{ parts: [...] }`.
 * `positions` and `normals` are flat [x, y, z, ...]; `indices` are triangles.
 */
export function writeGlb(file, spec) {
  const parts = spec.parts ?? [spec];
  const pad4 = (n) => (n + 3) & ~3;
  const chunks = [], views = [], accessors = [], meshes = [], materials = [];
  let off = 0;
  const push = (arr, target) => {
    const buf = Buffer.alloc(pad4(arr.byteLength));
    Buffer.from(arr.buffer).copy(buf);
    chunks.push(buf);
    views.push({ buffer: 0, byteOffset: off, byteLength: arr.byteLength, target });
    off += buf.length;
    return views.length - 1;
  };
  for (const part of parts) {
    const pos = new Float32Array(part.positions), nor = new Float32Array(part.normals), idx = new Uint32Array(part.indices);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pos[i + k]); max[k] = Math.max(max[k], pos[i + k]); }
    const a = accessors.length;
    accessors.push(
      { bufferView: push(pos, 34962), componentType: 5126, count: pos.length / 3, type: 'VEC3', min, max },
      { bufferView: push(nor, 34962), componentType: 5126, count: nor.length / 3, type: 'VEC3' },
      { bufferView: push(idx, 34963), componentType: 5125, count: idx.length, type: 'SCALAR' },
    );
    const m = part.material ?? {};
    materials.push({
      pbrMetallicRoughness: { baseColorFactor: m.color ?? [1, 1, 1, 1], metallicFactor: m.metallic ?? 0, roughnessFactor: m.roughness ?? 0.6 },
      emissiveFactor: m.emissive ?? [0, 0, 0], doubleSided: true,
      ...(m.color && m.color[3] < 1 ? { alphaMode: 'BLEND' } : {}),
    });
    meshes.push({ primitives: [{ attributes: { POSITION: a, NORMAL: a + 1 }, indices: a + 2, material: materials.length - 1 }] });
  }
  const bin = Buffer.concat(chunks);
  const json = {
    asset: { version: '2.0', generator: 'mantis-discovery figures' },
    scene: 0, scenes: [{ nodes: meshes.map((_, i) => i) }], nodes: meshes.map((_, i) => ({ mesh: i })),
    meshes, materials, buffers: [{ byteLength: bin.length }], bufferViews: views, accessors,
  };
  let jsonBuf = Buffer.from(JSON.stringify(json));
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad4(jsonBuf.length) - jsonBuf.length, 0x20)]);
  const header = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + bin.length, 8);
  jh.writeUInt32LE(jsonBuf.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(file, Buffer.concat([header, jh, jsonBuf, bh, bin]));
}

/** A height field over [-w/2, w/2] x [-d/2, d/2] in the xz plane: y = h(u, v) with u, v in 0..1. */
export function heightField(h, { nx, nz, w, d }) {
  return surface((u, v) => [(-0.5 + u) * w, h(u, v), (-0.5 + v) * d], { nu: nx, nv: nz });
}

/** A parametric surface p(u, v), u and v in 0..1, with normals from finite differences. */
export function surface(p, { nu, nv }) {
  const positions = [], normals = [], indices = [];
  const at = (i, j) => p(i / nu, j / nv);
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const q = at(i, j);
    const pu = at(Math.min(nu, i + 1), j), mu = at(Math.max(0, i - 1), j), pv = at(i, Math.min(nv, j + 1)), mv = at(i, Math.max(0, j - 1));
    const tu = [pu[0] - mu[0], pu[1] - mu[1], pu[2] - mu[2]], tv = [pv[0] - mv[0], pv[1] - mv[1], pv[2] - mv[2]];
    let n = [tv[1] * tu[2] - tv[2] * tu[1], tv[2] * tu[0] - tv[0] * tu[2], tv[0] * tu[1] - tv[1] * tu[0]];
    const l = Math.hypot(...n) || 1; n = n.map((c) => c / l);
    positions.push(...q); normals.push(...n);
  }
  const row = nu + 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * row + i, b = a + 1, c = a + row, e = c + 1;
    indices.push(a, c, b, b, c, e);
  }
  return { positions, normals, indices };
}

/** A tube of radius r along a polyline of [x, y, z] points. */
export function tube(points, r, sides = 8) {
  const positions = [], normals = [], indices = [];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = (a) => { const l = Math.hypot(...a) || 1; return a.map((c) => c / l); };
  let prevN = null;
  points.forEach((p, i) => {
    const t = nrm(sub(points[Math.min(points.length - 1, i + 1)], points[Math.max(0, i - 1)]));
    // a normal carried along the curve (parallel transport), so the tube does not twist
    let n = prevN ? nrm(sub(prevN, t.map((c) => c * (prevN[0] * t[0] + prevN[1] * t[1] + prevN[2] * t[2])))) : nrm(cross(t, Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    prevN = n;
    const b = cross(t, n);
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      const dir = [n[0] * c + b[0] * sn, n[1] * c + b[1] * sn, n[2] * c + b[2] * sn];
      positions.push(p[0] + dir[0] * r, p[1] + dir[1] * r, p[2] + dir[2] * r);
      normals.push(...dir);
    }
  });
  for (let i = 0; i + 1 < points.length; i++) for (let s = 0; s < sides; s++) {
    const a = i * sides + s, b = i * sides + ((s + 1) % sides), c = a + sides, e = b + sides;
    indices.push(a, c, b, b, c, e);
  }
  return { positions, normals, indices };
}

/** Several meshes merged into one (same material). */
export function merge(meshes) {
  const out = { positions: [], normals: [], indices: [] };
  for (const m of meshes) {
    const base = out.positions.length / 3;
    for (const v of m.positions) out.positions.push(v);
    for (const v of m.normals) out.normals.push(v);
    for (const i of m.indices) out.indices.push(base + i);
  }
  return out;
}
