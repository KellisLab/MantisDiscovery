import type { Metadata } from 'next';
import Link from 'next/link';
import { itemFor } from '@/components/figures';
import { Plate } from '@/components/Plate';
import { Prose } from '@/components/Prose';
import { Tex } from '@/components/Tex';
import { method, paperBySlug, type MethodFigure } from '@/data/site';

export const metadata: Metadata = {
  title: 'Method',
  description: 'How we run projects at Mantis Discovery and check results before publishing them. The worked example comes from the clique minors paper.',
};

function Figure({ f, n }: { f: MethodFigure; n: number }) {
  if (f.kind === 'records') {
    return (
      <figure id={f.id} className="doc-figure">
        <div className="doc-figure__panels">
          {f.panels.map((p) => (
            <a key={p.label} className="doc-figure__panel" href={p.still.src} data-no-transition>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.still.src} width={p.still.w} height={p.still.h} alt={p.still.alt} loading="lazy" decoding="async" />
              <span className="doc-figure__label meta" aria-hidden="true">{p.label}</span>
              <span className="sr-only">, full size</span>
            </a>
          ))}
        </div>
        <figcaption><span className="doc-figure__n">Figure {n}.</span> <Tex>{f.caption}</Tex></figcaption>
      </figure>
    );
  }
  const paper = paperBySlug(f.slug)!;
  return (
    <figure id={f.id} className="doc-figure doc-figure--film">
      <Plate items={[itemFor(paper)]} caption={false} beats={false} label={`Figure ${n}`} />
      <figcaption><span className="doc-figure__n">Figure {n}.</span> <Tex>{f.caption}</Tex></figcaption>
    </figure>
  );
}

export default function Method() {
  let figures = 0;
  return (
    <>
      <section className="page-hero wrap" aria-labelledby="page-title">
        <p className="eyebrow">Method</p>
        <h1 id="page-title" className="display ink-in">{method.title}</h1>
        <p className="lede">{method.lede}</p>
        <nav className="doc-toc meta" aria-label="On this page">
          <span className="doc-toc__label">On this page</span>
          {method.sections.map((s) => <a key={s.id} className="link" href={`#${s.id}`}>{s.title}</a>)}
        </nav>
      </section>

      {method.sections.map((s) => (
        <section key={s.id} id={s.id} className="doc wrap" aria-labelledby={`${s.id}-title`}>
          <h2 id={`${s.id}-title`} className="h-l doc__title">{s.title}</h2>
          <div className="doc__body">
            {s.body.map((b, i) => (typeof b === 'string'
              ? <p key={i}><Prose>{b}</Prose></p>
              : <Figure key={i} f={b} n={++figures} />))}
          </div>
        </section>
      ))}

      <section className="doc-end wrap" aria-label="Further reading">
        <div className="actions">
          <Link className="btn" href="/research/">Read the papers <span className="btn__arrow" aria-hidden="true">→</span></Link>
          <Link className="go" href="/lab/">Meet the lab <span className="go__arrow" aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
