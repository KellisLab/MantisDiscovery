import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyCite } from '@/components/CopyCite';
import { Plate } from '@/components/Plate';
import { Draft, itemFor } from '@/components/plates';
import { Tex } from '@/components/Tex';
import { doiUrl, fieldLabel, fileUrl, plain, papers, recordUrl, site } from '@/data/site';

export const dynamicParams = false;
export function generateStaticParams() {
  return papers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/research/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const p = papers.find((x) => x.slug === slug);
  if (!p) return {};
  const paper = p.files[0];
  return {
    title: p.short ?? p.title, // the layout adds " | Mantis Discovery"; short forms keep the whole within 70
    description: plain(p.summary),
    openGraph: { type: 'article', title: p.title, description: plain(p.summary), images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Mantis Discovery' }] },
    // Highwire Press tags, which Google Scholar reads to index a paper and its PDF.
    other: {
      citation_title: p.title,
      citation_author: site.name,
      citation_publication_date: p.published.replace(/-/g, '/'),
      citation_publisher: 'Zenodo',
      citation_doi: p.doi,
      ...(paper ? { citation_pdf_url: fileUrl(p, paper.name) } : {}),
    },
  };
}

const kb = (b: number) => `${Math.round(b / 1024)} KB`;
const date = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// Unaligned fields, and the DOI without a duplicate url field, so the entry wraps cleanly on a phone.
function bibtex(p: (typeof papers)[number]) {
  return [
    `@misc{mantisdiscovery_${p.record},`,
    `  title = {${p.title}},`,
    `  author = {{Mantis Discovery}},`,
    `  year = {${p.published.slice(0, 4)}},`,
    `  publisher = {Zenodo},`,
    `  doi = {${p.doi}}`,
    `}`,
  ].join('\n');
}

export default async function Paper({ params }: PageProps<'/research/[slug]'>) {
  const { slug } = await params;
  const i = papers.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = papers[i];
  const next = papers[(i + 1) % papers.length];
  const paper = p.files[0];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: p.title,
    name: p.title,
    author: { '@type': 'Organization', name: site.name, url: site.url },
    datePublished: p.published,
    identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: p.doi },
    sameAs: [doiUrl(p), recordUrl(p)],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    about: fieldLabel(p.field),
    ...(p.abstract ? { abstract: plain(p.abstract.join(' ')) } : {}),
  };

  return (
    <article className="paper-page">
      <section className="paper-hero wrap" aria-labelledby="paper-title">
        <nav className="crumbs meta" aria-label="Breadcrumb">
          <Link className="link" href="/research/">Research</Link>
          <span aria-hidden="true">/</span>
          <span>{fieldLabel(p.field)}</span>
        </nav>
        <h1 id="paper-title" className="h-xl paper-hero__title ink-in">{p.title}</h1>
        <div className="paper-hero__grid">
          <div className="paper-hero__main">
            <div className="paper-hero__plate">
              <Plate items={[itemFor(p)]} caption={false} draft={<Draft id={p.plate} />} label={`Live figure for ${p.title}`} />
            </div>
            {p.shows.length > 0 && (
              <section className="claims" aria-labelledby="claims-title">
                <h2 id="claims-title" className="sr-only">What the paper shows and what it does not claim</h2>
                <div className="claims__col">
                  <p className="claims__head"><span className="mark" data-state="shown" aria-hidden="true" /> Shows</p>
                  <ol className="claims__list">
                    {p.shows.map((s, k) => (
                      <li key={k} className="claim claim--shown" data-reveal="ink"><span className="claim__n meta">{String(k + 1).padStart(2, '0')}</span><p className="theorem"><Tex>{s}</Tex></p></li>
                    ))}
                  </ol>
                </div>
                <div className="claims__col claims__col--open">
                  <p className="claims__head"><span className="mark" aria-hidden="true" /> Does not claim</p>
                  <ul className="claims__list">
                    {p.limits.map((s, k) => (
                      <li key={k} className="claim claim--open" data-reveal="ink"><p className="paper"><Tex>{s}</Tex></p></li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
          <div className="paper-hero__side">
            <p className="lede paper-hero__summary"><Tex>{p.summary}</Tex></p>
            <dl className="facts">
              <div><dt>Field</dt><dd>{fieldLabel(p.field)}, {p.area.toLowerCase()}</dd></div>
              <div><dt>Published</dt><dd>{date(p.published)} on Zenodo</dd></div>
              <div><dt>DOI</dt><dd><a className="link mono" href={doiUrl(p)} rel="noopener">{p.doi}</a></dd></div>
              <div><dt>License</dt><dd>{site.license}</dd></div>
              {paper && <div><dt>File</dt><dd className="num">{paper.pages} pages, {kb(paper.bytes)}</dd></div>}
            </dl>
            <div className="actions">
              {paper ? (
                <a className="btn" href={fileUrl(p, paper.name)} rel="noopener" data-no-transition>Read the PDF <span className="btn__arrow" aria-hidden="true">↓</span></a>
              ) : (
                <a className="btn" href={recordUrl(p)} rel="noopener">Open on Zenodo <span className="btn__arrow" aria-hidden="true">↗</span></a>
              )}
              {paper && <a className="go" href={recordUrl(p)} rel="noopener">Zenodo record <span className="go__arrow" aria-hidden="true">↗</span></a>}
              {p.files.slice(1).map((f) => (
                <a key={f.name} className="go" href={fileUrl(p, f.name)} rel="noopener" data-no-transition>{f.label} <span className="go__arrow" aria-hidden="true">↓</span></a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="abstract wrap" aria-labelledby="abstract-title">
        <h2 id="abstract-title" className="h-l">{p.abstract ? 'Abstract' : 'Record'}</h2>
        <div className="abstract__body">
          {p.abstract ? (
            p.abstract.map((para, k) => <p key={k} className="paper"><Tex>{para}</Tex></p>)
          ) : (
            <p className="paper">This record is open on Zenodo, where its file and metadata can be read in full.</p>
          )}
        </div>
        <div className="abstract__cite">
          <h3 className="eyebrow muted">Cite</h3>
          <CopyCite text={bibtex(p)} />
        </div>
      </section>

      <section className="next wrap" aria-label="Next paper">
        <Link className="next__link" href={`/research/${next.slug}/`}>
          <span className="eyebrow muted">Next paper</span>
          <span className="next__title h-xl">{next.title}</span>
          <span className="next__meta meta">{fieldLabel(next.field)}, {next.area.toLowerCase()} <span className="next__go" aria-hidden="true">→</span></span>
          <span className="next__figure" aria-hidden="true">
            <Draft id={next.plate} />
            <span className="plate__tick plate__tick--tl" />
            <span className="plate__tick plate__tick--tr" />
            <span className="plate__tick plate__tick--bl" />
            <span className="plate__tick plate__tick--br" />
          </span>
        </Link>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </article>
  );
}
