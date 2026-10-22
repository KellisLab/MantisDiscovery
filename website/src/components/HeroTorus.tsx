'use client';
// The hero: heat flowing on a torus. One source is the visitor's (human), one wanders on its own (AI),
// and under both the whole surface drifts warmer and cooler in a slow pattern that never repeats. The
// heat diffuses over the curved surface and the surface deforms with it: the tube swells and thins and
// the ring bends, everywhere at once, so the shape keeps flowing.
// The torus is drawn as a cloud of points on the page's scroll stage (src/hero/stage.ts), a fixed canvas
// behind the content. Scrolling down the points scatter and re-form as the Mantis demo, then as the film;
// at each stop the real picture fades in over them, and scrolling up runs it back. The cloud trails the
// scroll on a spring, so it dissolves and re-forms at its own unhurried pace however fast the page moves.
// This component holds the hero's square (the server-rendered pencil wireframe, the first frame and the
// figure without JavaScript), runs the heat on the GSAP ticker and works out from the scroll where the
// particles are. Reduced motion gets one settled Canvas 2D still and no stage.
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AMB_T0, NU, NV, R, TAU, aiPath, ambAt, ambRingAt, ambient, facing, heatAt, heatAtNode, meshPoint, project, r, ringAt, stepHeat, toView, wireframe, type Source } from '@/hero/torus';
import type { Rect, Stage } from '@/hero/stage';
import { prefersReducedMotion } from '@/engine';
import { useReducedMotion } from '@/engine/next';

const SPIN_RATE = 0.055; // rad/s: one turn in about two minutes
const FOLLOW = 2.8; // rad/s: how quickly the particle cloud catches up with the scroll

function Wire() {
  const lines = wireframe(0);
  const X = (x: number) => (x * 50 + 50).toFixed(2);
  const Y = (y: number) => (-y * 50 + 50).toFixed(2);
  return (
    <svg className="torus__wire" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {lines.map((l, i) => {
        let d = '';
        for (let k = 0; k < l.pts.length; k += 2) d += `${k ? 'L' : 'M'}${X(l.pts[k])} ${Y(l.pts[k + 1])}`;
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const toNdc = (b: DOMRect): Rect => [((b.left + b.width / 2) / innerWidth) * 2 - 1, 1 - ((b.top + b.height / 2) / innerHeight) * 2, b.width / innerWidth, b.height / innerHeight];

/** Where along their path the particles belong at scroll position y: 0 the torus, 1 the demo, 2 the
 *  film. Each station holds them while its element is near the middle of the screen; in between, the
 *  position runs evenly from one station to the next. */
function posAt(y: number, boxes: DOMRect[]) {
  const vh = innerHeight;
  const anchor = boxes.map((b) => b.top + y + b.height / 2 - vh / 2);
  const hold = [0.14 * vh, 0.18 * vh, 0.18 * vh];
  for (let k = 0; k < 2; k++) {
    // Keep at least 0.4 of a screen of flight between neighbours that sit close together.
    const room = anchor[k + 1] - anchor[k] - 0.4 * vh;
    if (hold[k] + hold[k + 1] > room) { const s = Math.max(0, room) / (hold[k] + hold[k + 1]); hold[k] *= s; hold[k + 1] *= s; }
  }
  for (let k = 0; k < 2; k++) {
    const from = anchor[k] + hold[k], to = anchor[k + 1] - hold[k + 1];
    if (y <= from) return k;
    if (y < to) return k + (y - from) / (to - from);
  }
  return 2;
}

/** One poster, read down to one colour per grid cell (gw across, gh down). */
function sampleColors(src: string, gw: number, gh: number) {
  return new Promise<Float32Array | null>((res) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = gw; c.height = gh;
      const g = c.getContext('2d', { willReadFrequently: true });
      if (!g) return res(null);
      g.drawImage(img, 0, 0, gw, gh);
      const d = g.getImageData(0, 0, gw, gh).data, out = new Float32Array(gw * gh * 3);
      for (let k = 0; k < gw * gh; k++) { out[k * 3] = d[k * 4] / 255; out[k * 3 + 1] = d[k * 4 + 1] / 255; out[k * 3 + 2] = d[k * 4 + 2] / 255; }
      res(out);
    };
    img.onerror = () => res(null);
    img.src = src;
  });
}

/** The settled torus as points, for reduced motion: the same shape and colours as the live figure. */
function drawStill(cv: HTMLCanvasElement, human: Float32Array, ai: Float32Array, amb: Float32Array) {
  const b = cv.getBoundingClientRect();
  if (!b.width) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = b.width * dpr; cv.height = b.height * dpr;
  const g = cv.getContext('2d')!;
  g.scale(dpr, dpr);
  g.globalCompositeOperation = 'lighter';
  let s = 11;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const node = (f: Float32Array, u: number, v: number) => f[(Math.floor(v * NV) % NV) * NU + (Math.floor(u * NU) % NU)];
  for (let k = 0; k < 6000; k++) {
    const u = rnd();
    let v = 0;
    for (;;) { v = rnd(); if (rnd() * (R + r) <= R + r * Math.cos(v * TAU)) break; }
    const [x, y, z] = project(toView(meshPoint(u * TAU, v * TAU, heatAt(human, ai, u, v), ringAt(human, ai, u), ambAt(amb, u, v), ambRingAt(amb, u)), 0));
    const hh = Math.min(1, node(human, u, v) * 0.8), aa = Math.min(1, node(ai, u, v) * 0.8);
    const depth = clamp01((z - 4.4) / 3.2);
    g.fillStyle = Math.min(hh, aa) > 0.15 ? '#eceeea' : hh > aa && hh > 0.08 ? '#3d8bff' : aa > 0.08 ? '#b6d034' : '#9fabc7';
    g.globalAlpha = Math.min(1, (0.34 + 0.8 * Math.max(hh, aa)) * (1 - 0.6 * depth));
    const size = 0.9 + 1.6 * Math.max(hh, aa);
    g.fillRect(((x + 1) / 2) * b.width - size / 2, ((1 - y) / 2) * b.height - size / 2, size, size);
  }
}

export function HeroTorus() {
  const box = useRef<HTMLDivElement>(null);
  const still = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [inked, setInked] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = box.current!;
    const human = new Float32Array(NU * NV), ai = new Float32Array(NU * NV), tmp = new Float32Array(NU * NV);
    const amb = new Float32Array(NU * NV);
    ambient(amb, AMB_T0);
    const H: Source = { u: 2.5, v: 0.7, q: 1.25 }; // starts on the near flank
    const target = { u: H.u, v: H.v };

    if (prefersReducedMotion()) {
      // One settled still: run the flow with both sources parked, draw once, no WebGL.
      const A: Source = { u: 5.6, v: -0.5, q: 1.25 };
      for (let n = 0; n < 700; n++) { stepHeat(human, H, 0.012, tmp); stepHeat(ai, A, 0.012, tmp); }
      drawStill(still.current!, human, ai, amb);
      return;
    }

    const demo = document.querySelector<HTMLElement>('[data-station="demo"]');
    const film = document.querySelector<HTMLElement>('[data-station="film"]');
    const canvas = document.createElement('canvas');
    canvas.className = 'stage-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    let stage: Stage | null = null;
    let disposed = false, running = false, t = 0, spin = 0, reveal = 0, idle = false;
    let pos = -1, vel = 0; // where the particle cloud is (see posAt), and how fast it is moving
    const inkedRef = { current: false };
    const show = (e: HTMLElement | null, v: number) => { if (e) e.style.opacity = v >= 1 ? '' : v.toFixed(3); };

    const tick = (_time: number, deltaMs: number) => {
      if (!stage) return;
      const dt = Math.min(deltaMs / 1000, 1 / 20);
      const boxes = [el.getBoundingClientRect(), (demo ?? el).getBoundingClientRect(), (film ?? demo ?? el).getBoundingClientRect()];
      const goal = posAt(scrollY, boxes);
      if (pos < 0) pos = goal;
      // The cloud trails the scroll on a critically damped spring: it eases off, travels and settles
      // without overshooting, so a quick flick still dissolves slowly.
      vel += (FOLLOW * FOLLOW * (goal - pos) - 2 * FOLLOW * vel) * dt;
      pos = Math.min(2, Math.max(0, pos + vel * dt));
      const settled = Math.abs(goal - pos) < 1e-4 && Math.abs(vel) < 1e-3;
      if (settled) { pos = goal; vel = 0; }
      // Each picture fades in over the last stretch of its points' flight, so it condenses out of the
      // cloud, and fades out over the first stretch as they leave.
      const resolve: [number, number] = [1 - smooth(0, 0.35, Math.abs(pos - 1)), smooth(1.65, 2, pos)];
      show(demo, resolve[0]);
      show(film, resolve[1]);
      // A playing film that dissolves on the way back up stops; play starts it again.
      if (resolve[1] < 0.5) film?.querySelector('video')?.pause();
      // Nothing to draw while the cloud rests as a picture that has fully faded in.
      const blank = settled && ((pos === 1 && resolve[0] >= 1) || (pos === 2 && resolve[1] >= 1));
      if (blank) { if (!idle) { stage.clear(); idle = true; } return; }
      idle = false;

      if (!pausedRef.current) {
        t += dt;
        spin += dt * SPIN_RATE;
        if (pos < 1) {
          // The human source eases toward where the visitor points; the AI source keeps exploring.
          let du = target.u - H.u; du -= TAU * Math.round(du / TAU);
          H.u = (H.u + du * Math.min(1, dt * 4) + TAU) % TAU;
          let dv = target.v - H.v; dv -= TAU * Math.round(dv / TAU);
          H.v = H.v + dv * Math.min(1, dt * 4);
          const A = aiPath(t);
          const n = Math.ceil(dt / 0.012);
          for (let k = 0; k < n; k++) { stepHeat(human, H, dt / n, tmp); stepHeat(ai, A, dt / n, tmp); }
          ambient(amb, AMB_T0 + t);
          stage.upload(human, ai, amb);
        }
      }
      reveal = Math.min(1, reveal + dt / 1.8);
      if (reveal >= 1 && !inkedRef.current) { inkedRef.current = true; setInked(true); }
      stage.render({
        rects: [toNdc(boxes[0]), toNdc(boxes[1]), toNdc(boxes[2])],
        pos, resolve, spin, time: t, reveal,
      });
    };
    const sync = () => {
      const want = !disposed && !document.hidden && !!stage;
      if (want && !running) { gsap.ticker.add(tick); running = true; }
      if (!want && running) { gsap.ticker.remove(tick); running = false; }
    };
    document.addEventListener('visibilitychange', sync);
    const onResize = () => stage?.resize(innerWidth, innerHeight);
    addEventListener('resize', onResize);

    // Pointing at the torus moves the human source to the nearest visible point of the surface.
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const px = ((e.clientX - b.left) / b.width) * 2 - 1, py = 1 - ((e.clientY - b.top) / b.height) * 2;
      let best = 0.09, bu = -1, bv = 0;
      for (let i = 0; i < NU; i++) {
        const ring = ringAt(human, ai, i / NU), ringB = ambRingAt(amb, i / NU);
        for (let j = 0; j < NV; j++) {
          const u = (i / NU) * TAU, v = (j / NV) * TAU;
          if (!facing(u, v, spin)) continue;
          const k = j * NU + i;
          const [x, y] = project(toView(meshPoint(u, v, heatAtNode(human, ai, k), ring, amb[k], ringB), spin));
          const d = (x - px) ** 2 + (y - py) ** 2;
          if (d < best) { best = d; bu = u; bv = v; }
        }
      }
      if (bu >= 0) { target.u = bu; target.v = bv; }
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onMove);

    import('@/hero/stage').then(async ({ Stage }) => {
      if (disposed) return;
      try {
        stage = new Stage(canvas);
      } catch {
        canvas.remove();
        return; // no WebGL: the pencil wireframe stays, and the pictures stay as they are
      }
      onResize();
      setLive(true);
      sync();
      const phone = matchMedia('(max-width: 600px)').matches;
      const posters = [
        demo?.querySelector('video')?.getAttribute('poster'),
        film?.getAttribute(phone ? 'data-poster-phone' : 'data-poster'),
      ];
      const [gw, gh] = stage.grid;
      const [a, b] = await Promise.all(posters.map((p) => (p ? sampleColors(p, gw, gh) : Promise.resolve(null))));
      if (disposed || !stage) return;
      if (a) stage.setColors(1, a);
      if (b) stage.setColors(2, b);
    });

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', sync);
      removeEventListener('resize', onResize);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onMove);
      gsap.ticker.remove(tick);
      stage?.destroy();
      canvas.remove();
      show(demo, 1);
      show(film, 1);
    };
  }, []);

  const toggle = () => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); };

  return (
    <figure className="torus" data-live={live || reduced || undefined} data-inked={inked || reduced || undefined}>
      <div ref={box} className="torus__stage" data-station="torus" role="img"
        aria-label="A torus drawn in points. Its whole surface slowly swells, thins and bends as warmth drifts over it, and two sources add heat of their own: one follows the visitor, the other moves on its own. Where both heats meet, the points turn white.">
        <Wire />
        <canvas ref={still} className="torus__still" aria-hidden="true" />
        {!reduced && (
          <button type="button" className="plate__pause torus__pause" onClick={toggle} aria-pressed={paused}>
            <span aria-hidden="true" className="plate__pause-icon" data-paused={paused || undefined} />
            {paused ? 'Play' : 'Pause'}
            <span className="sr-only"> heat flow animation</span>
          </button>
        )}
      </div>
    </figure>
  );
}
