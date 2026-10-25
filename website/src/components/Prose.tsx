import Link from 'next/link';
import { Fragment } from 'react';
import { Tex } from './Tex';

/** A paragraph's text with [text](href) links: internal ones through next/link, others to a new site. */
export function Prose({ children }: { children: string }) {
  const parts = children.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((s, i) => {
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(s);
        if (!m) return <Fragment key={i}><Tex>{s}</Tex></Fragment>;
        const [, text, href] = m;
        return href.startsWith('/')
          ? <Link key={i} className="link" href={href}><Tex>{text}</Tex></Link>
          : <a key={i} className="link" href={href} rel="noopener"><Tex>{text}</Tex></a>;
      })}
    </>
  );
}
