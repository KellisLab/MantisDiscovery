// Server-rendered pencil draft of a plate. It is the first frame in the HTML (and the figure for
// visitors without JavaScript); the canvas plotter takes over from exactly this drawing.
import { plateColors } from './colors';
import type { PlateDef } from './types';

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function PlateSvg({ def, seed = 7, className }: { def: PlateDef; seed?: number; className?: string }) {
  const { scene } = def.create(seed);
  const [x0, y0, x1, y1] = def.bounds;
  const w = x1 - x0, h = y1 - y0;
  // Plate space is y-up; flip into SVG space.
  const X = (x: number) => r3(x - x0);
  const Y = (y: number) => r3(y1 - y);
  const unit = Math.max(w, h) / 560; // one CSS px at a 560px plate
  const path = (pts: number[], closed?: boolean) => {
    let d = `M${X(pts[0])} ${Y(pts[1])}`;
    for (let i = 2; i < pts.length; i += 2) d += `L${X(pts[i])} ${Y(pts[i + 1])}`;
    return closed ? `${d}Z` : d;
  };
  const c = plateColors[def.id];
  const tone = (t: string) => (t === 'ghost' ? { stroke: c.ink, o: 0.13 } : t === 'faint' ? { stroke: c.draft, o: 0.26 } : { stroke: c.draft, o: 0.62 });
  return (
    <svg className={className} viewBox={`0 0 ${r3(w)} ${r3(h)}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {scene.strokes.map((s, i) => {
          const t = tone(s.tone);
          return (
            <path key={i} d={path(s.pts, s.closed)} stroke={t.stroke} strokeOpacity={t.o} vectorEffect="non-scaling-stroke"
              strokeWidth={r3((s.tone === 'faint' || s.tone === 'ghost' ? 0.8 : 1) * (s.w ?? 1))}
              strokeDasharray={s.dash ? s.dash.join(' ') : undefined} />
          );
        })}
        {scene.dots?.map((d, i) => (
          <circle key={`d${i}`} cx={X(d.x)} cy={Y(d.y)} r={r3(d.r * unit)} stroke={c.draft} strokeOpacity={0.62} vectorEffect="non-scaling-stroke" strokeWidth={1} />
        ))}
      </g>
    </svg>
  );
}
