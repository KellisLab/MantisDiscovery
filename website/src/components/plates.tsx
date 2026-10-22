// Server-side plate helpers: plate items for the client plotter, and the pencil draft painted into
// the first HTML frame. Imports every plate module statically (server only; the client loads each
// plate as its own chunk through the registry).
import { fieldLabel, plain, papers, type PlateId, type Paper } from '@/data/site';
import { PlateSvg } from '@/plates/svg';
import type { PlateDef } from '@/plates/types';
import type { PlateItem } from './Plate';
import type { IndexRow } from './PaperIndex';
import opaque from '@/plates/opaque';
import sidon from '@/plates/sidon';
import voidPlate from '@/plates/void';
import gkStationary from '@/plates/gk-stationary';
import gkBoundary from '@/plates/gk-boundary';
import matching from '@/plates/matching';
import repetition from '@/plates/repetition';
import logSobolev from '@/plates/log-sobolev';
import permanents from '@/plates/permanents';
import certified from '@/plates/certified';
import clique from '@/plates/clique';
import ascent from '@/plates/ascent';
import coresets from '@/plates/coresets';
import elliptic from '@/plates/elliptic';
import gibbs from '@/plates/gibbs';
import calibration from '@/plates/calibration';

const defs: Record<PlateId, PlateDef> = {
  opaque, sidon, void: voidPlate, 'gk-stationary': gkStationary, 'gk-boundary': gkBoundary, matching, repetition,
  'log-sobolev': logSobolev, permanents, certified, clique, ascent, coresets, elliptic, gibbs, calibration,
};

export function itemFor(p: Paper): PlateItem {
  return {
    id: p.plate,
    title: p.title,
    meta: `${fieldLabel(p.field)}, ${p.area.toLowerCase()}`,
    href: `/research/${p.slug}/`,
    figure: plain(p.figure),
    check: defs[p.plate].check,
  };
}

/** Plate items for the whole archive, starting from a given plate. */
export function archiveItems(first: PlateId = 'opaque') {
  const items = papers.map(itemFor);
  const i = items.findIndex((x) => x.id === first);
  return i > 0 ? [...items.slice(i), ...items.slice(0, i)] : items;
}

export function Draft({ id }: { id: PlateId }) {
  return <PlateSvg def={defs[id]} seed={7} />;
}

/** Rows for the archive index (serializable, for the client component). */
export function indexRows(): IndexRow[] {
  return papers.map((p, i) => ({
    slug: p.slug,
    n: String(i + 1).padStart(2, '0'),
    title: p.title,
    summary: plain(p.summary),
    field: p.field,
    fieldLabel: fieldLabel(p.field),
    area: p.area,
    record: p.record,
    plate: p.plate,
  }));
}

