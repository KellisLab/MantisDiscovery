// Figure items for the client plates, and the rows of the paper index (serializable, built on the server).
import { fieldLabel, figureMedia, plain, papers, techName, voidFigure, type FigureId, type Paper } from '@/data/site';
import type { PlateItem } from './Plate';
import type { IndexRow } from './PaperIndex';

export function itemFor(p: Paper): PlateItem {
  return { ...figureMedia(p.figure), title: p.title, meta: `${fieldLabel(p.field)}, ${p.area.toLowerCase()}`, href: `/research/${p.slug}/` };
}

/** Plate items for every paper, starting from a given figure. */
export function archiveItems(first?: FigureId) {
  const items = papers.map(itemFor);
  const i = items.findIndex((x) => x.id === first);
  return i > 0 ? [...items.slice(i), ...items.slice(0, i)] : items;
}

export const voidItem = (): PlateItem => figureMedia(voidFigure);

/** Rows for the archive index. */
export function indexRows(): IndexRow[] {
  return papers.map((p, i) => ({
    slug: p.slug,
    n: String(i + 1).padStart(2, '0'),
    title: p.title,
    summary: plain(p.summary),
    fieldLabel: fieldLabel(p.field),
    area: p.area,
    record: p.record,
    figure: p.figure.id,
    records: p.mantis.records,
    uses: p.mantis.uses.map(techName),
  }));
}
