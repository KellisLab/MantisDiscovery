import type { Metadata } from 'next';
import Link from 'next/link';
import { Plate } from '@/components/Plate';
import { voidItem } from '@/components/figures';
import { notFound as copy } from '@/data/site';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'No page exists at this address.',
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
        <Plate items={[voidItem()]} caption={false} beats={false} label="Figure: an empty square" />
      </div>
    </section>
  );
}
