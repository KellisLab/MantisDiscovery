'use client';
// The live plate. A canvas plotter over the server-rendered pencil draft, with the check's name,
// its two live readings and a caption that follows whichever paper is being drawn.
//   mode 'fixed'  one plate (paper pages, 404)
//   mode 'cycle'  the Lab page: walks the archive
//   mode 'stage'  the index: rows call showOnStage(stage, id) on pointer, focus or scroll
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { PlateId } from '@/data/site';
import { plateColors } from '@/plates/colors';
import { Plotter, type PlotterState } from '@/plates/plotter';
import { prefetchPlate } from '@/plates/registry';
import { prefersReducedMotion } from '@/engine';
import { useReducedMotion } from '@/engine/next';

export type PlateItem = {
  id: PlateId;
  title: string;
  meta: string;
  href?: string;
  figure: string;
  check: string;
};

const stages = new Map<string, (id: PlateId) => void>();
export const showOnStage = (stage: string, id: PlateId) => stages.get(stage)?.(id);

type Props = {
  items: PlateItem[];
  mode?: 'fixed' | 'cycle' | 'stage';
  every?: number;
  stage?: string;
  caption?: boolean;
  /** The server-rendered draft of items[0] (<PlateSvg />). */
  draft?: ReactNode;
  className?: string;
  label?: string;
};

export function Plate({ items, mode = 'fixed', every = 9, stage, caption = true, draft, className, label }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const plotter = useRef<Plotter | null>(null);
  const [state, setState] = useState<PlotterState>({ id: items[0].id, readings: [], check: items[0].check, passed: false });
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const p = new Plotter(canvas.current!, (s) => { setState(s); setLive(true); }, { reduced: prefersReducedMotion() });
    plotter.current = p;
    if (mode === 'cycle') {
      p.play(items.map((i) => i.id), every, { skipDraft: !!draft });
      items.slice(1, 3).forEach((i) => prefetchPlate(i.id));
    } else {
      p.show(items[0].id, { seed: 7, skipDraft: !!draft });
    }
    if (stage) stages.set(stage, (id) => { prefetchPlate(id); p.show(id, { fast: true }); });
    return () => {
      p.destroy();
      if (stage) stages.delete(stage);
    };
    // items never change for a mounted plate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = items.find((i) => i.id === state.id) ?? items[0];
  const readings = state.readings.length ? state.readings : [{ label: ' ', value: ' ' }, { label: ' ', value: ' ' }];

  const toggle = () => {
    const v = !paused;
    setPaused(v);
    plotter.current?.setPaused(v);
  };

  return (
    <figure className={`plate ${className ?? ''}`} data-live={live || undefined} data-passed={state.passed || undefined} aria-label={label}
      style={{ '--plate-ink': plateColors[current.id].ink, '--plate-draft': plateColors[current.id].draft } as CSSProperties}>
      <div className="plate__frame">
        <div className="plate__draft">{draft}</div>
        <canvas ref={canvas} className="plate__canvas" role="img" aria-label={current.figure} />
        <span className="plate__tick plate__tick--tl" aria-hidden="true" />
        <span className="plate__tick plate__tick--tr" aria-hidden="true" />
        <span className="plate__tick plate__tick--bl" aria-hidden="true" />
        <span className="plate__tick plate__tick--br" aria-hidden="true" />
        {!reduced && (
          <button type="button" className="plate__pause" onClick={toggle} aria-pressed={paused}>
            <span aria-hidden="true" className="plate__pause-icon" data-paused={paused || undefined} />
            {paused ? 'Play' : 'Pause'}
            <span className="sr-only"> figure animation</span>
          </button>
        )}
      </div>
      <div className="plate__check">
        <p className="plate__check-name">
          <span className="mark" data-state={state.passed ? 'shown' : 'open'} aria-hidden="true" />
          <span>{state.check || current.check}</span>
          <span className="plate__check-state">{state.passed ? 'holds' : 'checking'}</span>
        </p>
        <dl className="plate__readings">
          {readings.slice(0, 2).map((r, i) => (
            <div key={i} className="plate__reading">
              <dt>{r.label}</dt>
              <dd data-done={r.done || undefined}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {caption && (
        <figcaption className="plate__caption">
          {current.href ? (
            <a className="plate__title" href={current.href}>{current.title}</a>
          ) : (
            <span className="plate__title">{current.title}</span>
          )}
          <span className="plate__meta meta">{current.meta}</span>
        </figcaption>
      )}
    </figure>
  );
}
