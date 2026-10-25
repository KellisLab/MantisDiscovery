// Shared look and timing for the paper figures: the site's night palette, its two faces, small helpers for
// beats (each figure is a few beats that cross-fade and loop), and the labels drawn over the 3D layer.
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/SpaceMono';

export const sans = loadInter('normal', { weights: ['400', '500'], subsets: ['latin', 'latin-ext', 'greek'] }).fontFamily;
export const mono = loadMono('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily;

export const SIZE = 1080;
export const FPS = 30;

export const C = {
  bg: '#080B10',
  ink: '#ECEEEA',
  pencil: '#9FABC7',
  muted: '#A8AAA9',
  line: 'rgba(236,238,234,0.12)',
  faint: 'rgba(159,171,199,0.22)',
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Progress of frame f through [a, b], clamped to 0..1. */
export const prog = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => { const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A beat from frame a to b: its progress, and an opacity that fades in and out over `fade` frames. */
export function beat(f: number, a: number, b: number, fade = 14) {
  const p = prog(f, a, b);
  const alpha = f < a || f > b ? 0 : Math.min(clamp01((f - a) / fade), clamp01((b - f) / fade));
  return { p, alpha, on: f >= a && f <= b };
}

/** Deterministic random numbers (mulberry32), so a frame is the same however often it is drawn. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rgba from a hex colour and an alpha. */
export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp01(a)})`;
};

type Ctx = CanvasRenderingContext2D;

/** Space Mono has no Greek, so a label with Greek letters is set in Inter instead. */
const GREEK = /[\u0370-\u03ff]/;

/** A figure label: mono, or Inter when it holds Greek. */
export function label(ctx: Ctx, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left', size = 30) {
  ctx.fillStyle = color;
  ctx.font = GREEK.test(text) ? `500 ${Math.round(size * 0.94)}px ${sans}` : `400 ${size}px ${mono}`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}
