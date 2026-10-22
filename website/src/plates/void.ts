// The 404 plate: the unit square with no barrier at all. Every line drawn through it gets through.
import { rng, fmt, TAU } from './kit';
import type { Painter } from './painter';
import type { PlateDef } from './types';

type Ray = { x0: number; y0: number; x1: number; y1: number; born: number };

const plate: PlateDef = {
  id: 'void',
  bounds: [-0.32, -0.3, 1.32, 1.3],
  check: 'Lines through an empty square',
  create(seed) {
    const R = rng(seed);
    const rays: Ray[] = [];
    let tested = 0, spawn = 0;
    const fire = (born: number): Ray => {
      const a = R.next() * TAU;
      const nx = Math.cos(a), ny = Math.sin(a);
      const cs = [0, nx, ny, nx + ny];
      const c = Math.min(...cs) + R.next() * (Math.max(...cs) - Math.min(...cs));
      const dx = -ny, dy = nx;
      tested++;
      return { x0: nx * c - dx * 2.2, y0: ny * c - dy * 2.2, x1: nx * c + dx * 2.2, y1: ny * c + dy * 2.2, born };
    };
    return {
      scene: {
        strokes: [{ pts: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0], tone: 'ink', dash: [3, 4] }],
        labels: [{ x: 0.5, y: -0.17, text: 'barrier length 0', tone: 'draft', align: 'center', math: true }],
      },
      update(dt, time) {
        spawn += dt * 7;
        while (spawn >= 1) { spawn--; rays.push(fire(time)); }
        while (rays.length && time - rays[0].born > 2.2) rays.shift();
      },
      draw(p: Painter, time) {
        for (const r of rays) {
          const age = time - r.born;
          const grow = Math.min(1, age / 0.5);
          const fade = age < 1.4 ? 1 : Math.max(0, 1 - (age - 1.4) / 0.8);
          p.line(r.x0, r.y0, r.x0 + (r.x1 - r.x0) * grow, r.y0 + (r.y1 - r.y0) * grow, 'draft', { alpha: fade * 0.8 });
        }
      },
      readings: () => [
        { label: 'Lines tested', value: fmt(tested) },
        { label: 'Got through', value: fmt(tested), done: tested >= 12 },
      ],
      settle() {
        for (let i = 0; i < 24; i++) rays.push(fire(-1));
      },
    };
  },
};

export default plate;
