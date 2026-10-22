// Plate modules load on demand, one chunk each, so a paper page only ships its own figure.
import type { PlateId } from '@/data/site';
import type { PlateDef } from './types';

const loaders: Record<PlateId, () => Promise<{ default: PlateDef }>> = {
  opaque: () => import('./opaque'),
  sidon: () => import('./sidon'),
  void: () => import('./void'),
  'gk-stationary': () => import('./gk-stationary'),
  'gk-boundary': () => import('./gk-boundary'),
  matching: () => import('./matching'),
  repetition: () => import('./repetition'),
  'log-sobolev': () => import('./log-sobolev'),
  permanents: () => import('./permanents'),
  certified: () => import('./certified'),
  clique: () => import('./clique'),
  ascent: () => import('./ascent'),
  coresets: () => import('./coresets'),
  elliptic: () => import('./elliptic'),
  gibbs: () => import('./gibbs'),
  calibration: () => import('./calibration'),
};

const cache = new Map<PlateId, Promise<PlateDef>>();

export function loadPlate(id: PlateId): Promise<PlateDef> {
  let p = cache.get(id);
  if (!p) {
    p = loaders[id]().then((m) => m.default);
    cache.set(id, p);
  }
  return p;
}

/** Warm the chunk for a plate that is about to be shown (next in a cycle, a hovered row). */
export const prefetchPlate = (id: PlateId) => { void loadPlate(id); };
