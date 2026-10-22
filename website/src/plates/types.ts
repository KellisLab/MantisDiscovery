// A plate is a figure computed from the object a paper studies. It has a static scene (drafted in
// pencil, then inked) and a live layer that runs a check and reports readings while it draws.
import type { PlateId } from '@/data/site';
import type { Painter } from './painter';

/** ink: bone, the proved/drawn object. draft: non-photo blue pencil. faint: light pencil. ghost: frames, grids. */
export type Tone = 'ink' | 'draft' | 'faint' | 'ghost';

export interface Stroke {
  /** Flat [x0, y0, x1, y1, ...] in plate units (y points up). */
  pts: number[];
  /** Final tone. Every stroke is drafted first; only 'ink' strokes get the ink pass. */
  tone: Tone;
  /** Width multiplier on the tone's default width. */
  w?: number;
  /** Dash pattern in CSS px. */
  dash?: number[];
  closed?: boolean;
  /** 0..1 start offset inside the draft pass. Default spreads strokes by index. */
  at?: number;
  /** Drafted by the plotter in the intro, then drawn by the plate's own draw() (it moves). */
  transient?: boolean;
}

export interface Dot {
  x: number;
  y: number;
  /** Radius in CSS px. */
  r: number;
  tone: Tone;
  hollow?: boolean;
  square?: boolean;
  /** Drafted in the intro, then drawn by the plate's own draw(). */
  transient?: boolean;
}

export interface Label {
  x: number;
  y: number;
  text: string;
  tone: Tone;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  /** STIX italic, for mathematics. */
  math?: boolean;
  /** CSS px. */
  size?: number;
  /** Frame the label like the main Mantis site's figure tags, optionally with a leading dot. */
  pill?: boolean;
  dot?: boolean;
}

export interface Scene {
  strokes: Stroke[];
  dots?: Dot[];
  labels?: Label[];
}

export interface Reading {
  label: string;
  value: string;
  /** true once the check this reading reports has passed (value turns from pencil to ink). */
  done?: boolean;
}

export interface PlateInstance {
  scene: Scene;
  /** Advance the live check and the plate's own dynamics. dt and time in seconds. */
  update?(dt: number, time: number): void;
  /** Draw the live layer over the scene, every frame after the draft pass. `inked` is 0 while the
   *  check runs on the draft, rises to 1 during the ink strike, and stays 1: draw moving objects in
   *  pencil until it rises. */
  draw?(p: Painter, time: number, inked: number): void;
  readings(): Reading[];
  /** Reduced motion: finish the check now so one still frame shows a real result. */
  settle?(): void;
}

export interface PlateDef {
  id: PlateId;
  /** Region of plate space to fit in the canvas: [x0, y0, x1, y1]. */
  bounds: [number, number, number, number];
  /** Short name of the check, shown above the readings. */
  check: string;
  create(seed: number): PlateInstance;
}
