// The painter maps plate units (y up) into a canvas and owns the tones, so every plate draws with the
// same hand: non-photo-blue pencil for drafts, bone ink for what holds.
import type { Dot, Label, Stroke, Tone } from './types';

export type Palette = { ink: string; draft: string; ground: string; sans: string; mono: string; math: string };

const TONES: Record<Tone, { c: 'ink' | 'draft'; a: number; w: number }> = {
  ink: { c: 'ink', a: 1, w: 1.35 },
  draft: { c: 'draft', a: 0.62, w: 1 },
  faint: { c: 'draft', a: 0.26, w: 0.8 },
  ghost: { c: 'ink', a: 0.13, w: 0.8 },
};

export class Painter {
  g: CanvasRenderingContext2D;
  w = 0; // CSS px
  h = 0;
  s = 1; // plate unit → CSS px
  k = 1; // line weight factor for this size
  private ox = 0;
  private oy = 0;
  private b: [number, number, number, number];

  constructor(g: CanvasRenderingContext2D, public pal: Palette, bounds: [number, number, number, number]) {
    this.g = g;
    this.b = bounds;
  }

  /** Fit the plate's bounds into a w×h box (contain), centered. */
  fit(w: number, h: number, bounds = this.b) {
    this.b = bounds;
    this.w = w;
    this.h = h;
    const [x0, y0, x1, y1] = bounds;
    this.s = Math.min(w / (x1 - x0), h / (y1 - y0));
    this.ox = (w - (x1 - x0) * this.s) / 2;
    this.oy = (h - (y1 - y0) * this.s) / 2;
    this.k = Math.min(1.35, Math.max(0.85, Math.min(w, h) / 560));
  }

  X = (x: number) => this.ox + (x - this.b[0]) * this.s;
  Y = (y: number) => this.oy + (this.b[3] - y) * this.s;

  clear() {
    this.g.clearRect(0, 0, this.w, this.h);
  }

  private style(tone: Tone, w = 1, alpha = 1, color?: 'ink' | 'draft') {
    const t = TONES[tone];
    const g = this.g;
    g.strokeStyle = this.pal[color ?? t.c];
    g.fillStyle = this.pal[color ?? t.c];
    g.globalAlpha = t.a * alpha;
    g.lineWidth = t.w * w * this.k;
  }

  /** Stroke a polyline (flat array). `to` in 0..1 draws only the first part of its length. */
  poly(pts: ArrayLike<number>, tone: Tone, o: { w?: number; dash?: number[]; closed?: boolean; alpha?: number; to?: number; color?: 'ink' | 'draft'; lens?: Float32Array } = {}) {
    const n = pts.length / 2;
    if (n < 2) return;
    const g = this.g;
    this.style(tone, o.w, o.alpha, o.color);
    g.setLineDash(o.dash ?? []);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(this.X(pts[0]), this.Y(pts[1]));
    const to = o.to ?? 1;
    if (to >= 1) {
      for (let i = 1; i < n; i++) g.lineTo(this.X(pts[2 * i]), this.Y(pts[2 * i + 1]));
      if (o.closed) g.closePath();
    } else if (to > 0) {
      const lens = o.lens ?? lengths(pts);
      const target = lens[n - 1] * to;
      for (let i = 1; i < n; i++) {
        if (lens[i] >= target) {
          const seg = lens[i] - lens[i - 1] || 1;
          const f = (target - lens[i - 1]) / seg;
          g.lineTo(this.X(pts[2 * i - 2] + (pts[2 * i] - pts[2 * i - 2]) * f), this.Y(pts[2 * i - 1] + (pts[2 * i + 1] - pts[2 * i - 1]) * f));
          break;
        }
        g.lineTo(this.X(pts[2 * i]), this.Y(pts[2 * i + 1]));
      }
    }
    g.stroke();
    g.setLineDash([]);
  }

  line(x0: number, y0: number, x1: number, y1: number, tone: Tone, o: { w?: number; dash?: number[]; alpha?: number; color?: 'ink' | 'draft' } = {}) {
    this.poly([x0, y0, x1, y1], tone, o);
  }

  dot(x: number, y: number, r: number, tone: Tone, o: { hollow?: boolean; square?: boolean; alpha?: number; color?: 'ink' | 'draft'; scale?: number } = {}) {
    const g = this.g;
    this.style(tone, 1, o.alpha, o.color);
    const R = r * (o.scale ?? 1) * Math.max(0.9, this.k);
    if (R <= 0) return;
    const X = this.X(x), Y = this.Y(y);
    g.beginPath();
    if (o.square) g.rect(X - R, Y - R, 2 * R, 2 * R);
    else g.arc(X, Y, R, 0, Math.PI * 2);
    if (o.hollow) { g.lineWidth = Math.max(1, this.k); g.stroke(); } else g.fill();
  }

  /** Axis-aligned rectangle in plate units. */
  rect(x0: number, y0: number, x1: number, y1: number, tone: Tone, o: { fill?: boolean; alpha?: number; w?: number; color?: 'ink' | 'draft' } = {}) {
    const g = this.g;
    this.style(tone, o.w, o.alpha, o.color);
    const X = this.X(Math.min(x0, x1)), Y = this.Y(Math.max(y0, y1));
    const W = Math.abs(this.X(x1) - this.X(x0)), H = Math.abs(this.Y(y1) - this.Y(y0));
    if (o.fill) g.fillRect(X, Y, W, H);
    else { g.beginPath(); g.rect(X, Y, W, H); g.stroke(); }
  }

  /** Labels are set in the brand mono (MantisMono), formulas in STIX italic. `pill` frames the label
   *  like the tags on the main Mantis site's figures, with an optional leading dot. */
  text(x: number, y: number, text: string, tone: Tone, o: { align?: CanvasTextAlign; baseline?: CanvasTextBaseline; math?: boolean; size?: number; alpha?: number; pill?: boolean; dot?: boolean } = {}) {
    if (Math.min(this.w, this.h) < 220) return; // too small for labels: they would print over each other
    const g = this.g;
    this.style(tone === 'ink' ? 'ink' : tone, 1, o.alpha);
    g.globalAlpha = (tone === 'ink' ? 1 : tone === 'ghost' ? 0.62 : 0.88) * (o.alpha ?? 1); // 4.5:1 or better on night
    const size = (o.size ?? (o.math ? 14 : 10.5)) * Math.min(1.15, Math.max(0.9, this.k));
    g.font = o.math ? `italic 400 ${size}px ${this.pal.math}` : `400 ${size}px ${this.pal.mono}`;
    g.textAlign = o.align ?? 'left';
    g.textBaseline = o.baseline ?? 'middle';
    let X = this.X(x);
    const Y = this.Y(y);
    if (o.pill) {
      const w = g.measureText(text).width, padX = size * 0.75, dotW = o.dot ? size * 0.9 : 0, h = size * 1.9;
      const left = g.textAlign === 'center' ? X - (w + dotW) / 2 - padX : g.textAlign === 'right' ? X - w - dotW - 2 * padX : X;
      const a = g.globalAlpha;
      g.globalAlpha = a * 0.55;
      g.lineWidth = 1;
      g.beginPath();
      g.roundRect(left + 0.5, Y - h / 2 + 0.5, w + dotW + 2 * padX, h, h / 2);
      g.stroke();
      g.globalAlpha = a;
      if (o.dot) { g.beginPath(); g.arc(left + padX + size * 0.25, Y, size * 0.2, 0, Math.PI * 2); g.fill(); }
      g.textAlign = 'left';
      X = left + padX + dotW;
    }
    g.fillText(text, X, Y);
  }

  /** Draw a scene's labels and dots at a given reveal (used by the plotter). */
  labels(labels: Label[] = [], alpha = 1) {
    for (const l of labels) this.text(l.x, l.y, l.text, l.tone, { align: l.align, baseline: l.baseline, math: l.math, size: l.size, alpha, pill: l.pill, dot: l.dot });
  }
  dots(dots: Dot[] = [], tone: 'draft' | 'final', scale = 1) {
    for (const d of dots) {
      if (tone === 'draft') this.dot(d.x, d.y, d.r, 'draft', { hollow: true, square: d.square, scale });
      else this.dot(d.x, d.y, d.r, d.tone, { hollow: d.hollow, square: d.square, scale });
    }
  }
  strokeOf(s: Stroke, tone: Tone, to = 1, lens?: Float32Array, alpha = 1) {
    this.poly(s.pts, tone, { w: s.w, dash: s.dash, closed: s.closed && to >= 1, to, lens, alpha });
  }
}

/** Cumulative arc length of a flat polyline. */
export function lengths(pts: ArrayLike<number>) {
  const n = pts.length / 2;
  const out = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    out[i] = out[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
  }
  return out;
}
