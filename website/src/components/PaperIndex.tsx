'use client';
// The archive index. Each row redraws the sticky plate: on pointer and focus with a fine pointer,
// and on touch screens whichever row crosses the middle of the viewport. An optional field filter.
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Field, PlateId } from '@/data/site';
import { showOnStage } from './Plate';

export type IndexRow = {
  slug: string;
  n: string;
  title: string;
  summary: string;
  field: Field;
  fieldLabel: string;
  area: string;
  record: number;
  plate: PlateId;
};

type Props = {
  rows: IndexRow[];
  stage: string;
  filters?: { id: Field | 'all'; label: string; count: number }[];
  plate: ReactNode;
  headingLevel?: 'h2' | 'h3';
};

export function PaperIndex({ rows, stage, filters, plate, headingLevel = 'h3' }: Props) {
  const [active, setActive] = useState(rows[0].slug);
  const [field, setField] = useState<Field | 'all'>('all');
  const list = useRef<HTMLOListElement>(null);
  const shown = useMemo(() => (field === 'all' ? rows : rows.filter((r) => r.field === field)), [rows, field]);
  const H = headingLevel;

  const activate = (r: IndexRow) => {
    setActive(r.slug);
    showOnStage(stage, r.plate);
  };

  // The row crossing the reading line drives the plate while scrolling. A pointer on the rows takes
  // over (the row under it shows), and a pointer on the plate's caption holds the plate still so its
  // link doesn't change underfoot. A pointer resting anywhere else leaves the scroll in charge.
  const pointing = useRef(false);
  const holding = useRef(false);
  useEffect(() => {
    if (!list.current) return;
    const touch = matchMedia('(hover: none), (pointer: coarse)').matches;
    const io = new IntersectionObserver((entries) => {
      if (pointing.current || holding.current) return;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const r = rows.find((x) => x.slug === (e.target as HTMLElement).dataset.slug);
        if (r) activate(r);
      }
    }, { rootMargin: touch ? '-48% 0px -48% 0px' : '-40% 0px -58% 0px' });
    list.current.querySelectorAll('li').forEach((li) => io.observe(li));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return (
    <div className="index">
      <div className="index__stage"
        onPointerOver={(e) => { holding.current = !!(e.target as Element).closest('.plate__caption'); }}
        onPointerLeave={() => { holding.current = false; }}>{plate}</div>
      <div className="index__body">
        {filters && (
          <div className="filters" role="group" aria-label="Filter by field">
            {filters.map((f) => (
              <button key={f.id} type="button" className="chip" aria-pressed={field === f.id}
                onClick={() => { setField(f.id); const first = f.id === 'all' ? rows[0] : rows.find((r) => r.field === f.id); if (first) activate(first); }}>
                <span>{f.label}</span><span className="chip__n num">{f.count}</span>
              </button>
            ))}
          </div>
        )}
        {filters && <p className="sr-only" aria-live="polite">{shown.length} papers shown</p>}
        <ol ref={list} className="rows" onPointerEnter={() => { pointing.current = true; }} onPointerLeave={() => { pointing.current = false; }}>
          {shown.map((r) => (
            <li key={r.slug} data-slug={r.slug} className="row" data-active={active === r.slug || undefined}>
              <Link href={`/research/${r.slug}/`} className="row__link"
                onPointerEnter={() => activate(r)} onFocus={() => activate(r)}>
                <span className="row__n meta" aria-hidden="true">{r.n}</span>
                <span className="row__main">
                  <H className="row__title">{r.title}</H>
                  <span className="row__summary">{r.summary}</span>
                  <span className="row__meta meta">
                    <span><span className="mark" data-state={active === r.slug ? 'shown' : 'open'} aria-hidden="true" /> {r.fieldLabel}</span>
                    <span>{r.area}</span>
                    <span className="num">Zenodo {r.record}</span>
                  </span>
                </span>
                <span className="row__go" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
