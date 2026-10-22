// Each paper's figure has its own two colours: its drafts in a soft second hue and its ink in a vivid
// first hue, so a figure blooms from one colour into the other as its check passes. Every colour clears
// 4.5:1 on the night ground, so labels and readings set in them stay readable.
import type { PlateId } from '@/data/site';

const AZURE = '#4f9dff';
const VIOLET = '#a285ff';
const ROSE = '#ff6f91';
const AMBER = '#ffb547';
const MINT = '#3ddbb4';
const SKY = '#62d0ff';
const LIME = '#b9d63a';
const CORAL = '#ff8a5c';

export type PlateColors = { ink: string; draft: string };

export const plateColors: Record<PlateId, PlateColors> = {
  sidon: { ink: AZURE, draft: VIOLET },
  'gk-stationary': { ink: AMBER, draft: ROSE },
  'gk-boundary': { ink: CORAL, draft: AMBER },
  opaque: { ink: MINT, draft: SKY },
  matching: { ink: VIOLET, draft: AZURE },
  repetition: { ink: LIME, draft: MINT },
  'log-sobolev': { ink: SKY, draft: VIOLET },
  permanents: { ink: ROSE, draft: VIOLET },
  certified: { ink: MINT, draft: LIME },
  clique: { ink: AMBER, draft: CORAL },
  ascent: { ink: VIOLET, draft: ROSE },
  coresets: { ink: LIME, draft: SKY },
  elliptic: { ink: SKY, draft: MINT },
  gibbs: { ink: ROSE, draft: AMBER },
  calibration: { ink: CORAL, draft: VIOLET },
  void: { ink: MINT, draft: AZURE },
};
