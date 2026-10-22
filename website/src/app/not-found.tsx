import type { Metadata } from 'next';
import Link from 'next/link';
import { Plate } from '@/components/Plate';
import { Draft } from '@/components/plates';
import { notFound as copy } from '@/data/site';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'No page exists at this address. Every line through an empty square gets through.',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="lost wrap" aria-labelledby="lost-title">
      <div className="lost__text">
        <p className="eyebrow muted">404</p>
        <h1 id="lost-title" className="display ink-in">{copy.title}</h1>
        <p className="lede">{copy.text}</p>
        <div className="actions">
          <Link className="btn" href={copy.actions[0].href}>{copy.actions[0].label} <span className="btn__arrow" aria-hidden="true">→</span></Link>
          <Link className="go" href={copy.actions[1].href}>{copy.actions[1].label} <span className="go__arrow" aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="lost__plate">
        <Plate
          items={[{ id: 'void', title: 'An empty square', meta: 'No barrier, no page', figure: 'The unit square with no barrier. Random lines drawn through it all get through.', check: 'Lines through an empty square' }]}
          caption={false}
          draft={<Draft id="void" />}
          label="Figure: an empty square"
        />
      </div>
    </section>
  );
}
