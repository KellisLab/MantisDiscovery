// The plotter: one driver per canvas. It drafts a plate in pencil, runs the plate's check against the
// draft, strikes the ink only once the check passes, then keeps the check running live.
//   out → draft → test → ink → live
// Everything runs on gsap.ticker (one clock), pauses off screen and when the tab is hidden, and draws
// a single finished still under reduced motion.
import { gsap } from 'gsap';
import type { PlateId } from '@/data/site';
import { plateColors } from './colors';
import { Painter, lengths, type Palette } from './painter';
import { loadPlate } from './registry';
import type { PlateDef, PlateInstance, Reading } from './types';

type Phase = 'idle' | 'out' | 'draft' | 'test' | 'ink' | 'live';

export type PlotterState = { id: PlateId | null; readings: Reading[]; check: string; passed: boolean };

const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export class Plotter {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private p: Painter;
  private cache: HTMLCanvasElement | null = null;
  private dpr = 1;
  private def: PlateDef | null = null;
  private inst: PlateInstance | null = null;
  private lens: Float32Array[] = [];
  private phase: Phase = 'idle';
  private t = 0; // seconds in the current phase
  private clock = 0; // seconds of live time for the current plate
  private passedAt = -1;
  private queued: { id: PlateId; seed: number; skipDraft?: boolean } | null = null;
  private visible = false;
  private paused = false;
  private running = false;
  private reduced: boolean;
  private speed = 1;
  private lastEmit = 0;
  private alpha = 1;
  private cycle: { ids: PlateId[]; every: number; i: number; wait: number } | null = null;
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private destroyed = false;
  private base: Palette; // the page's tokens; each plate lays its own two colours over them

  constructor(canvas: HTMLCanvasElement, private onState: (s: PlotterState) => void, opts: { reduced: boolean }) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d')!;
    this.reduced = opts.reduced;
    this.base = readPalette();
    this.p = new Painter(this.g, this.base, [0, 0, 1, 1]);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.sync(); }, { rootMargin: '80px' });
    this.io.observe(canvas);
    document.addEventListener('visibilitychange', this.sync);
    document.fonts?.ready.then(() => { if (!this.destroyed) { this.base = readPalette(); this.paint(); this.cache = null; this.still(); } });
    this.resize();
  }

  /** Show a plate. Fast switches (pointer on an index row) draft quicker. */
  show(id: PlateId, o: { seed?: number; fast?: boolean; skipDraft?: boolean } = {}) {
    if (this.def?.id === id && this.phase !== 'out' && !this.queued) return;
    this.speed = o.fast ? 1.7 : 1;
    // skipDraft: the server already painted this plate's pencil draft, so start at the check.
    this.queued = { id, seed: o.seed ?? 1 + Math.floor(Math.random() * 1e6), skipDraft: o.skipDraft };
    if (this.reduced || !this.inst || this.phase === 'idle') { this.swap(); return; }
    if (this.phase !== 'out') { this.phase = 'out'; this.t = 0; }
    this.sync();
  }

  /** Cycle through plates (the home hero). `every` = seconds of live time per plate. */
  play(ids: PlateId[], every: number, o: { skipDraft?: boolean } = {}) {
    this.cycle = { ids, every, i: 0, wait: every };
    this.show(ids[0], { seed: 7, skipDraft: o.skipDraft });
  }

  setPaused(v: boolean) {
    this.paused = v;
    this.sync();
    if (v) this.still();
  }

  destroy() {
    this.destroyed = true;
    this.io.disconnect();
    this.ro.disconnect();
    document.removeEventListener('visibilitychange', this.sync);
    gsap.ticker.remove(this.tick);
  }


  // Run the ticker only while it can be seen and there is something to move.
  private sync = () => {
    const want = !this.destroyed && !this.reduced && !this.paused && this.visible && !document.hidden && this.phase !== 'idle';
    if (want && !this.running) { gsap.ticker.add(this.tick); this.running = true; }
    if (!want && this.running) { gsap.ticker.remove(this.tick); this.running = false; }
  };

  private async swap() {
    const q = this.queued;
    if (!q) return;
    const def = await loadPlate(q.id);
    if (this.destroyed || this.queued !== q) return; // a newer request won
    this.queued = null;
    this.def = def;
    this.paint();
    this.inst = def.create(q.seed);
    this.lens = this.inst.scene.strokes.map((s) => lengths(s.pts));
    this.p.fit(this.p.w, this.p.h, def.bounds);
    this.cache = null;
    this.clock = 0;
    this.passedAt = -1;
    this.alpha = 1;
    if (this.reduced) {
      this.inst.settle?.();
      this.phase = 'live';
      this.still();
      this.emit(true);
      return;
    }
    this.phase = q.skipDraft ? 'test' : 'draft';
    this.t = 0;
    this.emit(true);
    this.sync();
    if (this.paused) this.still();
  }

  /** Lay the current plate's colours over the page tokens. */
  private paint() {
    this.p.pal = this.def ? { ...this.base, ...plateColors[this.def.id] } : this.base;
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.p.fit(r.width, r.height, this.def?.bounds ?? [0, 0, 1, 1]);
    this.cache = null;
    this.still();
  }

  /** Draw one frame without advancing time (resize, pause, reduced motion). */
  private still() {
    if (!this.inst) return;
    this.frame();
  }

  private tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    this.t += dt * this.speed;
    const inst = this.inst;
    switch (this.phase) {
      case 'out':
        this.alpha = Math.max(0, 1 - this.t / 0.28);
        if (this.alpha <= 0) { this.phase = 'idle'; this.swap(); return; }
        break;
      case 'draft':
        if (this.t >= 1.1) { this.phase = 'test'; this.t = 0; }
        break;
      case 'test': {
        // The check runs against the drafted figure; ink only once it has passed.
        const ok = inst?.readings().some((r) => r.done) ?? true;
        if ((ok && this.t > 0.5) || this.t > 2.6) { this.phase = 'ink'; this.t = 0; this.passedAt = this.clock; }
        break;
      }
      case 'ink':
        if (this.t >= 0.6) { this.phase = 'live'; this.t = 0; }
        break;
      case 'live':
        if (this.cycle && this.cycle.ids.length > 1) {
          this.cycle.wait -= dt;
          if (this.cycle.wait <= 0) {
            this.cycle.i = (this.cycle.i + 1) % this.cycle.ids.length;
            this.cycle.wait = this.cycle.every;
            this.show(this.cycle.ids[this.cycle.i]);
          }
        }
        break;
    }
    if (inst && (this.phase === 'test' || this.phase === 'ink' || this.phase === 'live' || this.phase === 'out')) {
      this.clock += dt;
      if (this.phase !== 'out') inst.update?.(dt, this.clock);
    }
    this.frame();
    this.emit(false);
  };

  private frame() {
    const { g, p, inst } = this;
    if (!inst || !p.w) return;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    p.clear();
    const scene = inst.scene;
    const phase = this.reduced ? 'live' : this.phase;
    g.globalAlpha = 1;

    if (phase === 'live' || phase === 'out' || phase === 'idle') {
      this.drawCached();
    } else if (phase === 'draft') {
      const u = Math.min(1, this.t / 1.1);
      const n = scene.strokes.length;
      scene.strokes.forEach((s, i) => {
        const at = s.at ?? (n > 1 ? (i / (n - 1)) * 0.55 : 0);
        const f = Math.max(0, Math.min(1, (u - at) / 0.45));
        if (f > 0) p.strokeOf(s, s.tone === 'ink' ? 'draft' : s.tone, f, this.lens[i]);
      });
      p.dots(scene.dots, 'draft', Math.max(0, Math.min(1, (u - 0.5) / 0.35)));
      p.labels(scene.labels, Math.max(0, Math.min(1, (u - 0.45) / 0.4)));
    } else {
      // test and ink: the full draft underneath, ink striking over the 'ink' strokes.
      const v = phase === 'ink' ? expoOut(Math.min(1, this.t / 0.6)) : 0;
      scene.strokes.forEach((s, i) => {
        if (s.transient) return;
        p.strokeOf(s, s.tone === 'ink' ? 'draft' : s.tone, 1, this.lens[i]);
        if (s.tone === 'ink' && v > 0) p.strokeOf(s, 'ink', v, this.lens[i]);
      });
      const still = scene.dots?.filter((d) => !d.transient);
      if (v > 0) p.dots(still, 'final', v);
      else p.dots(still, 'draft', 1);
      p.labels(scene.labels, 1);
    }
    if (phase !== 'draft') {
      g.globalAlpha = 1;
      const inked = phase === 'test' ? 0 : phase === 'ink' ? expoOut(Math.min(1, this.t / 0.6)) : 1;
      inst.draw?.(p, this.clock, inked);
    }
    if (this.alpha < 1) {
      // Fade out by painting the ground over the frame (keeps the canvas transparent elsewhere).
      g.globalCompositeOperation = 'destination-out';
      g.globalAlpha = 1 - this.alpha;
      g.fillRect(0, 0, p.w, p.h);
      g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = 1;
  }

  // The finished static scene, rendered once into an offscreen canvas and blitted every frame.
  private drawCached() {
    const { p, inst } = this;
    if (!inst) return;
    if (!this.cache) {
      const c = document.createElement('canvas');
      c.width = this.canvas.width;
      c.height = this.canvas.height;
      const cg = c.getContext('2d')!;
      cg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const cp = new Painter(cg, p.pal, this.def!.bounds);
      cp.fit(p.w, p.h, this.def!.bounds);
      inst.scene.strokes.forEach((s, i) => { if (!s.transient) cp.strokeOf(s, s.tone, 1, this.lens[i]); });
      cp.dots(inst.scene.dots?.filter((d) => !d.transient), 'final', 1);
      cp.labels(inst.scene.labels, 1);
      this.cache = c;
    }
    const g = this.g;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.cache, 0, 0);
    g.restore();
  }

  private emit(force: boolean) {
    const now = performance.now();
    if (!force && now - this.lastEmit < 125) return;
    this.lastEmit = now;
    const readings = this.inst?.readings() ?? [];
    this.onState({
      id: this.def?.id ?? null,
      readings,
      check: this.def?.check ?? '',
      passed: readings.some((r) => r.done) && (this.reduced || this.passedAt >= 0),
    });
  }
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (k: string, d: string) => cs.getPropertyValue(k).trim() || d;
  return {
    ink: v('--c-fg', '#eeede8'),
    draft: v('--c-draft', '#a4dded'),
    ground: v('--c-bg', '#0a0b0c'),
    sans: v('--f-sans', 'system-ui, sans-serif'),
    mono: v('--f-mono', 'ui-monospace, monospace'),
    math: v('--f-math', 'Georgia, serif'),
  };
}
