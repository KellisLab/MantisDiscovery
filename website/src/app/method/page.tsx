import type { Metadata } from 'next';
import Link from 'next/link';
import { MethodLoop } from '@/components/MethodLoop';
import { method, paperBySlug } from '@/data/site';

export const metadata: Metadata = {
  title: 'Method',
  description: 'How Mantis Discovery works: researchers run every project, AI helps at each stage, and nothing goes out until it can be checked.',
};

export default function Method() {
  return (
    <>
      <section className="page-hero wrap" aria-labelledby="page-title">
        <p className="eyebrow">Method</p>
        <h1 id="page-title" className="display ink-in">{method.title}</h1>
        <p className="lede">{method.lede}</p>
      </section>

      <section className="method-loop wrap" aria-label="The five stages">
        <MethodLoop stages={method.stages} />
      </section>

      <section className="standards wrap" aria-labelledby="standards-title">
        <h2 id="standards-title" className="h-xl" data-split="lines">{method.standardsTitle}</h2>
        <ol className="standards__list">
          {method.standards.map((s, i) => {
            const p = paperBySlug(s.slug)!;
            return (
              <li key={s.name} className="standard" data-reveal="ink">
                <p className="standard__n meta">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="h-l">{s.name}</h3>
                <p className="standard__text">{s.text}</p>
                <figure className="standard__quote">
                  <blockquote className="paper"><p>“{s.quote}”</p></blockquote>
                  <figcaption className="meta"><span className="mark" data-state="shown" aria-hidden="true" /> <Link className="link" href={`/research/${p.slug}/`}>{p.title}</Link></figcaption>
                </figure>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
