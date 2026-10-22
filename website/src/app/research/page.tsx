import type { Metadata } from 'next';
import { Plate } from '@/components/Plate';
import { PaperIndex } from '@/components/PaperIndex';
import { archiveItems, Draft, indexRows } from '@/components/plates';
import { fieldCount, fields, papers, site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Research',
  description: `${papers.length} papers from Mantis Discovery in mathematics, machine learning, physics and computer science, free to read on Zenodo.`,
};

export default function Research() {
  const rows = indexRows();
  const filters = [
    { id: 'all' as const, label: 'All', count: papers.length },
    ...fields.map((f) => ({ id: f.id, label: f.label, count: fieldCount(f.id) })),
  ];
  return (
    <>
      <section className="page-hero wrap" aria-labelledby="page-title">
        <p className="eyebrow">Archive · {papers.length} papers</p>
        <h1 id="page-title" className="display ink-in">Research</h1>
        <p className="lede">
          Every paper is on Zenodo with a DOI, free to read under {site.license}. Pick one to see what it shows
          and what it leaves open.
        </p>
      </section>
      <section className="archive archive--page wrap" aria-label="All papers">
        <PaperIndex
          rows={rows}
          stage="research-index"
          filters={filters}
          headingLevel="h2"
          plate={<Plate items={archiveItems(rows[0].plate)} mode="stage" stage="research-index" draft={<Draft id={rows[0].plate} />} label="Figure for the selected paper" />}
        />
      </section>
    </>
  );
}
