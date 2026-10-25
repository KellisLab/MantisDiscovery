// The 404: the unit square with no barrier, so every line goes straight through it.
import { useCurrentFrame } from 'remotion';
import { C, easeInOut, easeOut, lerp, prog, rng } from './kit';
import { Lights, Rod, Stage, orbit, type Material } from './kit3d';
import { Slab, W, type P } from './opaque';
import { TIMING } from './timing';

const T = TIMING.void;
export const VOID_FRAMES = T.frames;

// Lines across the square, each from well outside one side to well outside the other, staggered so that
// a few are always crossing and the loop has no seam.
const r = rng(19);
const LINES = Array.from({ length: 14 }, (_, i) => {
  const th = r() * Math.PI, c: P = [0.15 + 0.7 * r(), 0.15 + 0.7 * r()], d: P = [Math.cos(th), Math.sin(th)];
  return { a: [c[0] - 1.1 * d[0], c[1] - 1.1 * d[1]] as P, b: [c[0] + 1.1 * d[0], c[1] + 1.1 * d[1]] as P, at: (i * T.frames) / 14 };
});
const LIFE = 70;

export const Void = () => {
  const f = useCurrentFrame();
  const cam = orbit([0, 0, 0.1], 4.9, 3.5, -24 + 6 * Math.sin((f / T.frames) * 2 * Math.PI), 33);
  return (
    <Stage cam={cam}>
      <Lights />
      <Slab />
      {LINES.flatMap((l, i) => {
        // each line runs twice per loop window so it wraps cleanly at the seam
        return [l.at, l.at - T.frames].map((at, k) => {
          const t = prog(f, at, at + LIFE);
          if (t <= 0 || t >= 1) return null;
          const head = easeOut(prog(t, 0, 0.55)), tail = easeInOut(prog(t, 0.45, 1));
          const pa: P = [lerp(l.a[0], l.b[0], tail), lerp(l.a[1], l.b[1], tail)], pb: P = [lerp(l.a[0], l.b[0], head), lerp(l.a[1], l.b[1], head)];
          return <Rod key={`${i}-${k}`} a={W(pa, 0.012)} b={W(pb, 0.012)} radius={0.0045} material={{ color: C.pencil, unlit: true, opacity: 0.85 } as Material} segments={6} />;
        });
      })}
    </Stage>
  );
};
