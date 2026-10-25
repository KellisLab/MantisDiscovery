// 3D helpers for the figures: the stage (a 3D layer with a 2D layer exactly over it, for hairlines and
// labels), the light rig, an orbiting camera, a projector that matches the 3D layer's perspective camera,
// and rods (cylinders laid between two points).
import type { ReactNode } from 'react';
import { AbsoluteFill, AmbientLight, Camera3D, Canvas, DirectionalLight, Group3D, Mesh, Scene3D, staticFile } from 'remotion';
import { C, SIZE } from './kit';

export type V3 = [number, number, number];
export type Cam = { position: V3; target: V3; fov: number };
export type Material = { color?: string; emissive?: string; emissiveIntensity?: number; metallic?: number; roughness?: number; opacity?: number; unlit?: boolean; doubleSided?: boolean };

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dotp = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A camera circling the target: `deg` is the angle round the y axis, from +z toward +x. */
export function orbit(target: V3, radius: number, height: number, deg: number, fov = 35): Cam {
  const a = (deg * Math.PI) / 180;
  return { position: [target[0] + radius * Math.sin(a), target[1] + height, target[2] + radius * Math.cos(a)], target, fov };
}

/** World point → [x, y, depth] in pixels of a box of width x height, as the 3D layer's camera draws it. */
export function projector(cam: Cam, width = SIZE, height = SIZE) {
  const z = norm(sub(cam.position, cam.target)), x = norm(cross([0, 1, 0], z)), y = cross(z, x);
  const f = 1 / Math.tan(((cam.fov * Math.PI) / 180) / 2), aspect = width / height;
  return (p: V3): [number, number, number] => {
    const r = sub(p, cam.position), vx = dotp(r, x), vy = dotp(r, y), d = -dotp(r, z);
    return [((f / aspect) * (vx / d) + 1) / 2 * width, (1 - (f * (vy / d))) / 2 * height, d];
  };
}

/** The studio light: the generated .hdr for soft reflections, a key that casts shadows, and a cool rim. */
export function Lights({ key = 1.05, ambient = 0.06, shadows = true }: { key?: number; ambient?: number; shadows?: boolean }) {
  return (
    <>
      <AmbientLight color="#c9d4ff" intensity={ambient} />
      <DirectionalLight direction={[0.55, -1, -0.35]} intensity={key} castShadow={shadows} shadow={{ mapSize: 2048, radius: 2 }} />
      <DirectionalLight color="#9fb7ff" direction={[-0.4, -0.25, 1]} intensity={0.35} />
    </>
  );
}

export const studio = () => ({ src: staticFile('env/studio.hdr'), intensity: 0.22 });

/**
 * One figure frame: the night ground, the 3D scene, and a 2D layer drawn over it in the same pixels.
 * `overlay` gets the canvas context and the projector for this frame's camera.
 */
export function Stage({ cam, children, overlay, opacity = 1 }: {
  cam: Cam;
  children: ReactNode;
  overlay?: (ctx: CanvasRenderingContext2D, project: ReturnType<typeof projector>) => void;
  opacity?: number;
}) {
  const project = projector(cam);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill style={{ opacity }}>
        <Scene3D width={SIZE} height={SIZE} environment={studio()}>
          <Camera3D fov={cam.fov} position={cam.position} target={cam.target} near={0.05} far={60} />
          {children}
        </Scene3D>
      </AbsoluteFill>
      {overlay && (
        <AbsoluteFill>
          <Canvas width={SIZE} height={SIZE} draw={(ctx: CanvasRenderingContext2D) => overlay(ctx, project)} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

/** A cylinder from a to b. */
export function Rod({ a, b, radius = 0.01, material, segments = 12, shadow = false }: { a: V3; b: V3; radius?: number; material: Material; segments?: number; shadow?: boolean }) {
  const d = sub(b, a), len = Math.hypot(d[0], d[1], d[2]);
  if (len < 1e-6) return null;
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const yaw = (Math.atan2(-d[2], d[0]) * 180) / Math.PI, pitch = (Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180) / Math.PI;
  return (
    <Group3D position={mid} rotation={[0, yaw, 0]}>
      <Mesh geometry={{ kind: 'cylinder', radiusTop: radius, radiusBottom: radius, height: 1, segments }} material={material}
        rotation={[0, 0, -90 + pitch]} scale={[1, len, 1]} castShadow={shadow} receiveShadow={false} />
    </Group3D>
  );
}

/** A wall standing on the xz plane from a to b (a fence post line): `h` tall, `t` thick. */
export function Wall({ a, b, h, t = 0.03, material, y0 = 0 }: { a: V3; b: V3; h: number; t?: number; material: Material; y0?: number }) {
  const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz);
  if (len < 1e-6 || h <= 1e-4) return null;
  const yaw = (Math.atan2(-dz, dx) * 180) / Math.PI;
  return (
    <Mesh geometry={{ kind: 'box', width: 1, height: 1, depth: 1 }} material={material}
      position={[(a[0] + b[0]) / 2, y0 + h / 2, (a[2] + b[2]) / 2]} rotation={[0, yaw, 0]} scale={[len + t, h, t]} castShadow receiveShadow />
  );
}
