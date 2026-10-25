import Link from 'next/link';
import { asset, mantis, nav, papers, site } from '@/data/site';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__lead">
          <h2>Contact</h2>
          <a className="btn" href={`mailto:${site.email}`}>
            Write to us <span className="btn__arrow" aria-hidden="true">→</span>
          </a>
        </div>
        <div className="footer__col">
          <h3>Discovery</h3>
          <Link href="/">Home</Link>
          {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        </div>
        <div className="footer__col">
          <h3>Papers</h3>
          {papers.map((p) => <Link key={p.slug} href={`/research/${p.slug}/`}>{p.tag}</Link>)}
        </div>
        <div className="footer__col">
          <h3>Mantis</h3>
          <a href={mantis.url} rel="noopener">Main site</a>
          <a href={`mailto:${site.email}`}>Email</a>
        </div>
      </div>
      <p className="footer__word" aria-hidden="true"><span className="mantis-mark" />Discovery</p>
      <div className="footer__base meta">
        <p className="num">© 2026 {site.name}. Papers are free to read under {site.license}.</p>
        <span className="footer__aff">
          <a href={mantis.url} rel="noopener">mantis.csail.mit.edu</a>
          <a className="footer__csail" href="https://www.csail.mit.edu/" rel="noopener">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="csail-logo" src={asset('/brand/csail.svg')} width={70} height={40} alt="MIT CSAIL" />
          </a>
        </span>
      </div>
    </footer>
  );
}
