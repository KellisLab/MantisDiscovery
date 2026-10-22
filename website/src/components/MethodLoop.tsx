'use client';
// The research loop, drawn as a knot: one closed strand that winds twice round the ring and crosses
// itself five times (a (2, 5) torus knot). Its two passes are the two hands in the work, people in azure
// and AI in chartreuse (the hero's two heat sources), and they cross at each of the five stages, over and
// under in turn. The whole knot is pencilled in; as you read down the chapters both passes are inked
// together up to the current stage, which is ringed, while two short pulses of light keep running along it.
// One variable (the active stage) drives the ink, the rings, the dial, the labels, the counter and the
// phone strip. Drawn on a canvas on the GSAP ticker while it is on screen; the labels, the legend and the
// counter are text over it. Reduced motion draws the same picture without the pulses.
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { onScroll, prefersReducedMotion } from '@/engine';
import { usePage } from '@/engine/next';

type Stage = { id: string; name: string; ai: string; people: string };

const TAU = Math.PI * 2;
const RING = 0.29; // the crossings sit on this circle, as a share of the stage's side (labels at 0.385)
const SWING = 0.07; // how far each pass swings out and in between two crossings
const PEOPLE = [61, 139, 255]; // #3d8bff
const AI = [182, 208, 52]; // #b6d034
const PENCIL = 'rgba(159,171,199,0.3)';
const INK = 'rgba(236,238,234,';
const BREAK = 0.035; // half the break in the pass that runs underneath at a crossing, in stages
const angleOf = (i: number, n: number) => -Math.PI / 2 + (i / n) * TAU;

/** A point of the knot. s counts stages along the strand: crossing k is at s = k on the people's pass
 *  (s from −0.5 to n − 0.5) and again at s = n + k on the AI's pass (n − 0.5 to 2n − 0.5). */
function knotAt(s: number, n: number, S: number): [number, number] {
  // The curve r = R + A cos(nθ/2), θ over two turns, crosses itself where the cosine is 0, at θ = π/n + 2πk/n;
  // it is turned so that crossing k sits at stage k's angle.
  const theta = Math.PI / n + (s * TAU) / n;
  const r = S * (RING + SWING * Math.cos((n * theta) / 2));
  const a = theta - Math.PI / n - Math.PI / 2;
  return [S / 2 + r * Math.cos(a), S / 2 + r * Math.sin(a)];
}

function trace(g: CanvasRenderingContext2D, s0: number, s1: number, n: number, S: number) {
  const steps = Math.max(2, Math.ceil((s1 - s0) / 0.02));
  g.beginPath();
  for (let i = 0; i <= steps; i++) {
    const [x, y] = knotAt(s0 + ((s1 - s0) * i) / steps, n, S);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.stroke();
}

/** Which pass is on top at crossing k: the strand goes over and under in turn, so the people's pass is
 *  on top at even crossings and the AI's at odd ones (n is odd, so the turns agree all the way round). */
const overAt = (k: number, n: number) => (k % 2 === 0 ? 0 : n);
/** How near the strand is at s, 0 to 1: on the torus the knot lies on, its height is cos(πs), highest
 *  where a pass is on top at a crossing and lowest where it runs underneath. */
const nearAt = (s: number) => (Math.cos(Math.PI * s) + 1) / 2;

/** The stretches of a pass (base − 0.5 to base + n − 0.5) that are drawn: it breaks where it runs underneath. */
function stretches(base: number, n: number) {
  const out: [number, number][] = [];
  let from = base - 0.5;
  for (let k = 0; k < n; k++) {
    if (overAt(k, n) === base) continue;
    out.push([from, base + k - BREAK]);
    from = base + k + BREAK;
  }
  out.push([from, base + n - 0.5]);
  return out;
}

/** Ink along the strand from s0 to s1, wider and brighter where it comes near. */
function ink(g: CanvasRenderingContext2D, s0: number, s1: number, n: number, S: number, rgb: number[]) {
  const steps = Math.max(1, Math.ceil((s1 - s0) / 0.04));
  for (let i = 0; i < steps; i++) {
    const a = s0 + ((s1 - s0) * i) / steps, b = s0 + ((s1 - s0) * (i + 1)) / steps, near = nearAt((a + b) / 2), k = 0.5 + 0.5 * near;
    g.strokeStyle = `rgb(${Math.round(rgb[0] * k)},${Math.round(rgb[1] * k)},${Math.round(rgb[2] * k)})`;
    g.lineWidth = 1.1 + 1.1 * near;
    trace(g, a, b, n, S);
  }
}

function drawKnot(g: CanvasRenderingContext2D, S: number, n: number, progress: number, active: number, time: number, pulses: boolean) {
  g.clearRect(0, 0, S, S);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const cx = S / 2, cy = S / 2;
  const inkTo = progress - 0.5; // each pass is inked from its start up to here (people) or n + here (AI)

  // A dial round the counter, inked as far as the reader has come.
  for (let k = 0; k < 60; k++) {
    const t = k / 60, a = -Math.PI / 2 + t * TAU;
    const r0 = S * (k % 12 === 0 ? 0.174 : 0.184), r1 = S * 0.196;
    g.strokeStyle = t < progress / n - 1e-6 ? `${INK}0.6)` : 'rgba(159,171,199,0.18)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)); g.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)); g.stroke();
  }

  // The whole knot in pencil, then both passes inked up to the current stage.
  for (const base of [0, n]) {
    for (const [a, b] of stretches(base, n)) {
      g.strokeStyle = PENCIL; g.lineWidth = 1;
      trace(g, a, b, n, S);
      const i0 = Math.max(a, base - 0.5), i1 = Math.min(b, base + inkTo);
      if (i1 > i0) ink(g, i0, i1, n, S, base ? AI : PEOPLE);
    }
  }

  // A ring round each crossing: open in pencil ahead, inked once reached, larger at the current stage.
  for (let k = 0; k < n; k++) {
    const [x, y] = knotAt(k, n, S);
    const ring = (rad: number, style: string, w: number) => { g.strokeStyle = style; g.lineWidth = w; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke(); };
    if (k === active) { ring(10, `${INK}0.95)`, 1.25); ring(16, `${INK}0.2)`, 1); }
    else ring(7, k < active ? `${INK}0.7)` : 'rgba(159,171,199,0.4)', 1);
  }

  // Two short pulses of light, half a strand apart so one is always on each pass, run along the knot;
  // they duck out of sight where their pass runs underneath.
  if (!pulses) return;
  const at = (s: number) => {
    const t = ((((s + 0.5) % (2 * n)) + 2 * n) % (2 * n)) - 0.5;
    const base = t < n - 0.5 ? 0 : n, local = t - base, k = Math.round(local);
    return { base, local, hidden: k >= 0 && k < n && Math.abs(local - k) < BREAK + 0.015 && overAt(k, n) !== base };
  };
  for (let b = 0; b < 2; b++) {
    const head = ((time * 0.32 + b * n) % (2 * n)) - 0.5;
    for (let j = 13; j >= 0; j--) {
      const s1 = head - j * 0.032, s0 = s1 - 0.032, p = at((s0 + s1) / 2);
      if (p.hidden) continue;
      // Near white at the head, fading back into the pass's own colour along the tail.
      const c = (p.base ? AI : PEOPLE).map((v) => Math.round(v + (255 - v) * 0.6 * (1 - j / 14)));
      g.globalAlpha = (p.local <= inkTo ? 0.95 : 0.45) * (1 - j / 14) ** 1.5;
      g.strokeStyle = `rgb(${c.join(',')})`;
      g.lineWidth = 1.6 + 1.2 * nearAt((s0 + s1) / 2);
      trace(g, s0, s1, n, S);
    }
    const p = at(head);
    if (p.hidden) continue;
    g.globalAlpha = p.local <= inkTo ? 1 : 0.5;
    g.fillStyle = `rgb(${(p.base ? AI : PEOPLE).map((v) => Math.round(v + (255 - v) * 0.6)).join(',')})`;
    const [x, y] = knotAt(head, n, S);
    g.beginPath(); g.arc(x, y, 1.8 + 1.1 * nearAt(head), 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}

export function MethodLoop({ stages }: { stages: Stage[] }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(0);
  const n = stages.length;

  // The active stage is the last chapter whose top has crossed the reading line, level with the
  // middle of the sticky figure. Read from position on every scroll, so a jump (a link, a key, a
  // restored position) lands on the right stage; under reduced motion the figure just changes in steps.
  usePage(() => {
    const chapters = [...(root.current?.querySelectorAll<HTMLElement>('[data-stage]') ?? [])];
    const read = () => {
      const line = innerHeight * 0.42;
      let i = 0;
      chapters.forEach((el, k) => { if (el.getBoundingClientRect().top <= line) i = k; });
      activeRef.current = i;
      setActive(i);
    };
    read();
    return onScroll(read);
  });

  useEffect(() => {
    const cv = canvas.current!, box = stage.current!;
    const g = cv.getContext('2d');
    if (!g) return;
    const reduced = prefersReducedMotion();
    let S = 0, time = 0, progress = activeRef.current + 1, visible = false, running = false;

    const resize = () => {
      const b = box.getBoundingClientRect();
      if (!b.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      S = b.width;
      cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const draw = () => { if (S) drawKnot(g, S, n, progress, activeRef.current, time, !reduced); };
    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 1 / 20);
      time += dt;
      // The ink runs on to the new stage rather than jumping there.
      progress += (activeRef.current + 1 - progress) * Math.min(1, dt * 2.5);
      draw();
    };
    const sync = () => {
      const want = !reduced && visible && !document.hidden;
      if (want && !running) { gsap.ticker.add(tick); running = true; }
      if (!want && running) { gsap.ticker.remove(tick); running = false; }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
    io.observe(box);
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    document.addEventListener('visibilitychange', sync);
    // Reduced motion: redraw in steps when the stage changes.
    const off = reduced ? onScroll(() => { if (activeRef.current + 1 !== progress) { progress = activeRef.current + 1; draw(); } }) : () => {};
    resize();
    return () => {
      io.disconnect(); ro.disconnect(); off();
      document.removeEventListener('visibilitychange', sync);
      gsap.ticker.remove(tick);
    };
  }, [n]);

  const upto = active + 1;
  const label = (i: number) => {
    const a = angleOf(i, n), x = 50 + 38.5 * Math.cos(a), y = 50 + 38.5 * Math.sin(a);
    const side = Math.cos(a) < -0.3 ? 'left' : Math.cos(a) > 0.3 ? 'right' : 'middle';
    return { left: `${x}%`, top: `${y}%`, side };
  };
  return (
    <div ref={root} className="loop">
      <div ref={stage} className="loop__stage" aria-hidden="true">
        <canvas ref={canvas} className="loop__canvas" />
        {stages.map((s, i) => {
          const p = label(i);
          return (
            <span key={s.id} className="loop__label" data-side={p.side} data-state={i === active ? 'now' : i < active ? 'done' : 'ahead'}
              style={{ left: p.left, top: p.top }}>{s.name}</span>
          );
        })}
        <div className="loop__center">
          <span className="loop__count">{String(Math.min(upto, n)).padStart(2, '0')}</span>
          <span className="loop__of">of {String(n).padStart(2, '0')}</span>
          <span className="loop__now">{stages[Math.min(active, n - 1)].name}</span>
        </div>
        <p className="loop__legend"><span><i data-hand="people" />People</span><span><i data-hand="ai" />AI, alongside</span></p>
      </div>
      <div className="loop__strip" aria-hidden="true">
        <span className="loop__strip-n">{String(Math.min(upto, n)).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
        <span className="loop__strip-name">{stages[Math.min(active, n - 1)].name}</span>
        <span className="loop__strip-ticks">{stages.map((s, i) => <i key={s.id} data-on={i < upto || undefined} />)}</span>
      </div>
      <ol className="loop__chapters">
        {stages.map((s, i) => (
          <li key={s.id} data-stage={i} className="chapter" data-active={i === active || undefined}>
            <p className="chapter__n meta">{String(i + 1).padStart(2, '0')}</p>
            <h2 className="h-xl chapter__name">{s.name}</h2>
            <div className="chapter__roles">
              <div><p className="eyebrow muted">People</p><p>{s.people}</p></div>
              <div><p className="eyebrow muted">AI, alongside</p><p>{s.ai}</p></div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
