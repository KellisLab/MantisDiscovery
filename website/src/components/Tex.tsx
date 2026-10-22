import { Fragment } from 'react';

// Keep short formulas on one line: bind binary operators to their operands with no-break spaces, and
// join adjacent brackets, as in (t + 1)(k − 1), with a word joiner so a line can't break between them.
const bind = (s: string) => s.replace(/ ([=+−≤≥<>×∈]) /g, ' $1 ').replace(/(\d) (bits|bytes|KB)/g, '$1 $2').replace(/\)\(/g, ')\u2060(');

/** Renders ^{…} as <sup> and _{…} as <sub>. Everything else is plain text. */
export function Tex({ children }: { children: string }) {
  const parts = bind(children).split(/(\^\{[^}]*\}|_\{[^}]*\})/g);
  return (
    <>
      {parts.map((s, i) => {
        if (s.startsWith('^{')) return <sup key={i}>{s.slice(2, -1)}</sup>;
        if (s.startsWith('_{')) return <sub key={i}>{s.slice(2, -1)}</sub>;
        return <Fragment key={i}>{s}</Fragment>;
      })}
    </>
  );
}
