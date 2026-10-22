// Development harness: one plate at a time, at /plates-lab/<id>/. 404 in production builds.
import { notFound } from 'next/navigation';
import { Plate } from '@/components/Plate';
import type { PlateId } from '@/data/site';

const IDS: PlateId[] = ['opaque', 'sidon', 'void', 'gk-stationary', 'gk-boundary', 'matching', 'repetition', 'log-sobolev', 'permanents', 'certified', 'clique', 'ascent', 'coresets', 'elliptic', 'gibbs', 'calibration'];

export const dynamicParams = false;
export function generateStaticParams() {
  return IDS.map((id) => ({ id }));
}
export const metadata = { robots: { index: false } };

export default async function Lab({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { id } = await params;
  if (!IDS.includes(id as PlateId)) notFound();
  return (
    <section style={{ padding: '7rem var(--margin) 4rem', display: 'grid', gridTemplateColumns: 'minmax(0, 640px) minmax(0, 360px)', gap: '3rem', alignItems: 'start' }}>
      <Plate items={[{ id: id as PlateId, title: `Plate: ${id}`, meta: 'Development harness', figure: `Plate ${id}`, check: '' }]} />
      <div style={{ display: 'grid', gap: '1rem' }}>
        <h1 className="h-l">{id}</h1>
        <div style={{ width: 300 }}>
          <Plate items={[{ id: id as PlateId, title: 'At 300 px', meta: 'Phone size', figure: `Plate ${id}`, check: '' }]} caption />
        </div>
      </div>
    </section>
  );
}
