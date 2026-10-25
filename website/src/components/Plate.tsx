'use client';
// A paper's figure: a short 3D film (graphics/, rendered with Kinetograph) in the plate's frame, with the
// caption for the beat it is on set as text beneath it.
//   mode 'fixed'  one figure (paper pages, 404), looping while it is on screen
//   mode 'cycle'  the Lab page: each paper's figure once, then the next
//   mode 'stage'  the index: rows call showOnStage(stage, id) on pointer, focus or scroll
// Under reduced motion nothing plays by itself: the poster stays, with its beat's caption, until the
// visitor presses Play.
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { FigureId, FigureMedia } from '@/data/site';
import { useReducedMotion } from '@/engine/next';
import { Tex } from './Tex';

export type PlateItem = FigureMedia & { title?: string; meta?: string; href?: string };

/** Each figure's lead colour (the ticks of its frame). */
const INK: Record<FigureId, string> = { opaque: '#3ddbb4', clique: '#ffb547', gyro: '#4f9dff', elliptic: '#ff6f91', void: '#3ddbb4' };

const stages = new Map<string, (id: FigureId) => void>();
export const showOnStage = (stage: string, id: FigureId) => stages.get(stage)?.(id);

type Props = {
  items: PlateItem[];
  mode?: 'fixed' | 'cycle' | 'stage';
  stage?: string;
  caption?: boolean;
  /** Show the beat captions under the frame (the 404 says it in its own words). */
  beats?: boolean;
  className?: string;
  label?: string;
};

const beatAt = (item: PlateItem, t: number) => item.starts.reduce((b, s, i) => (t >= s - 0.1 ? i : b), 0);

export function Plate({ items, mode = 'fixed', stage, caption = true, beats = true, className, label }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  // The beat the film is on, as its last time update reported it (for the figure it reported it for).
  const [seen, setSeen] = useState<{ id: FigureId; beat: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const held = useRef(false); // paused by the visitor
  const onScreen = useRef(false);
  const reduced = useReducedMotion();
  const item = items[index];
  // Until the film reports its time, it shows its first frame, or under reduced motion its poster.
  const beat = seen && seen.id === item.id ? seen.beat : reduced ? beatAt(item, item.posterAt) : 0;

  const tryPlay = () => {
    const v = video.current;
    if (v && onScreen.current && !held.current && !reduced) v.play().catch(() => {});
  };

  // Play while on screen, pause when it leaves.
  useEffect(() => {
    const v = video.current!;
    const io = new IntersectionObserver(([e]) => {
      onScreen.current = e.isIntersecting;
      if (e.isIntersecting) tryPlay();
      else v.pause();
    }, { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // The index asks for another paper's figure.
  useEffect(() => {
    if (!stage) return;
    stages.set(stage, (id) => {
      const i = items.findIndex((x) => x.id === id);
      if (i >= 0) setIndex(i);
    });
    return () => { stages.delete(stage); };
  }, [stage, items]);

  // A new figure plays from its start.
  useEffect(() => {
    tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reduced]);

  const toggle = () => {
    const v = video.current!;
    if (v.paused) { held.current = false; v.play().catch(() => {}); }
    else { held.current = true; v.pause(); }
  };

  const n = item.beats.length;
  return (
    <figure className={`plate ${className ?? ''}`} aria-label={label} style={{ '--plate-ink': INK[item.id] } as CSSProperties}>
      <div className="plate__frame">
        <video
          ref={video}
          className="plate__video"
          src={item.src}
          poster={item.poster}
          muted
          playsInline
          preload="none"
          loop={mode !== 'cycle'}
          width={960}
          height={960}
          aria-label={item.alt}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => { const b = beatAt(item, e.currentTarget.currentTime); if (b !== beat || seen?.id !== item.id) setSeen({ id: item.id, beat: b }); }}
          onEnded={() => { if (mode === 'cycle') setIndex((i) => (i + 1) % items.length); }}
        />
        <span className="plate__tick plate__tick--tl" aria-hidden="true" />
        <span className="plate__tick plate__tick--tr" aria-hidden="true" />
        <span className="plate__tick plate__tick--bl" aria-hidden="true" />
        <span className="plate__tick plate__tick--br" aria-hidden="true" />
        <button type="button" className="plate__pause" onClick={toggle}>
          <span aria-hidden="true" className="plate__pause-icon" data-paused={!playing || undefined} />
          {playing ? 'Pause' : 'Play'}
          <span className="sr-only"> the figure</span>
        </button>
      </div>
      {beats && <div className="plate__beat">
        {n > 1 && (
          <p className="plate__steps meta" aria-hidden="true">
            {item.beats.map((_, i) => <span key={i} className="plate__step" data-on={i === beat || undefined} data-done={i < beat || undefined} />)}
            <span className="plate__step-n num">{beat + 1}/{n}</span>
          </p>
        )}
        <p key={`${item.id}-${beat}`} className="plate__beat-text"><Tex>{item.beats[beat]}</Tex></p>
      </div>}
      {caption && item.title && (
        <figcaption className="plate__caption">
          {item.href ? <Link className="plate__title" href={item.href}>{item.title}</Link> : <span className="plate__title">{item.title}</span>}
          {item.meta && <span className="plate__meta meta">{item.meta}</span>}
        </figcaption>
      )}
    </figure>
  );
}
