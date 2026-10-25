import { statSync } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { Plate } from '@/components/Plate';
import { PaperIndex } from '@/components/PaperIndex';
import { archiveItems, indexRows } from '@/components/figures';
import { papers, posterPdf, posterPreview, posters, site, workInProgress, type Poster } from '@/data/site';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Mantis Discovery’s papers are free to read on Zenodo. This page also has posters for the projects we are still working on.',
};

/** A poster PDF's size in KB, read when the page is built. */
const posterKb = (p: Poster) => Math.round(statSync(path.join(process.cwd(), 'public/media/posters', `${p.slug}.pdf`)).size / 1024);

export default function Research() {
  const rows = indexRows();
  return (
    <>
      <section className="page-hero wrap" aria-labelledby="page-title">
        <p className="eyebrow">Papers · {papers.length}</p>
        <h1 id="page-title" className="display ink-in">Research</h1>
        <p className="lede">
          Every paper is on Zenodo with a DOI, free to read under {site.license}. Each paper’s page lists what
          the paper shows and what it does not claim. Further down the page are posters for projects that are
          not finished yet.
        </p>
      </section>
      <section className="archive archive--page wrap" aria-label="All papers">
        <PaperIndex
          rows={rows}
          stage="research-index"
          headingLevel="h2"
          plate={<Plate items={archiveItems(rows[0].figure)} mode="stage" stage="research-index" label="Figure for the selected paper" />}
        />
      </section>
      <section id="work-in-progress" className="wip wrap" aria-labelledby="wip-title">
        <header className="archive__head">
          <h2 id="wip-title" className="h-xl" data-split="lines">{workInProgress.title}</h2>
          <p className="archive__lede">{workInProgress.lede}</p>
        </header>
        <ul className="posters">
          {posters.map((p) => (
            <li key={p.slug} className="poster">
              {/* A file, not a page: the engine's page transition leaves it alone. */}
              <a className="poster__link" href={posterPdf(p)} data-no-transition>
                <span className="poster__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterPreview(p, 'lg')} srcSet={`${posterPreview(p, 'sm')} 576w, ${posterPreview(p, 'lg')} 1152w`}
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 32vw" width={1152} height={864}
                    alt="" loading="lazy" decoding="async" />
                </span>
                <span className="poster__meta meta">
                  <span><span className="mark" aria-hidden="true" /> {p.field}</span>
                  <span>{p.area}</span>
                </span>
                <h3 className="poster__title">{p.title}</h3>
                <span className="poster__file meta">Poster, PDF, {posterKb(p)} KB <span className="poster__go" aria-hidden="true">→</span></span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
