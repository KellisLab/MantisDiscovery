import Link from 'next/link';
import { Film } from '@/components/Film';
import { HeroTorus } from '@/components/HeroTorus';
import { MantisDemo } from '@/components/MantisDemo';
import { Plate } from '@/components/Plate';
import { PaperIndex } from '@/components/PaperIndex';
import { archiveItems, indexRows } from '@/components/figures';
import { approach, approachLink, asset, film, home, lab, mantisDemo, olympiads, site, workInProgress } from '@/data/site';

export default function Home() {
  const rows = indexRows();
  return (
    <>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero__text">
          <p className="eyebrow hero__aff" data-reveal="fade" data-intro>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="csail-logo" src={asset('/brand/csail.svg')} width={70} height={40} alt="MIT CSAIL" />
            <span>{home.eyebrow}</span>
          </p>
          <h1 id="hero-title" className="display hero__title">{home.title}</h1>
          <p className="lede hero__lede" data-reveal="ink" data-intro data-delay="0.15">{home.lede}</p>
          <div className="actions" data-reveal="fade" data-intro data-delay="0.3">
            <Link className="btn" href={home.actions[0].href}>{home.actions[0].label} <span className="btn__arrow" aria-hidden="true">→</span></Link>
            <Link className="go" href={home.actions[1].href}>{home.actions[1].label} <span className="go__arrow" aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="hero__visual">
          <HeroTorus />
        </div>
      </section>

      <section className="statement wrap" aria-labelledby="statement-title">
        <div className="statement__copy">
          <h2 id="statement-title" className="h-xl statement__title" data-split="lines">{home.statementTitle}</h2>
          <p className="statement__text" data-split="lines">{home.statement}</p>
        </div>
        <figure className="statement__demo" data-station="demo">
          <MantisDemo src={mantisDemo.src} poster={mantisDemo.poster} label={mantisDemo.label} />
        </figure>
      </section>

      <section className="film-section wrap" aria-labelledby="film-title">
        <div className="film-section__head">
          <h2 id="film-title" className="h-xl" data-split="lines">{film.title}</h2>
        </div>
        <Film src={film.src} poster={film.poster} posterPhone={film.posterPhone} captions={film.captions} title={film.title} duration={film.duration} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'VideoObject', name: film.name, description: film.description,
          thumbnailUrl: new URL(film.poster, site.url).href, contentUrl: new URL(film.src, site.url).href, uploadDate: film.date, duration: film.iso,
        }).replace(/</g, '\\u003c') }} />
      </section>

      <section className="approach wrap" aria-labelledby="approach-title">
        <header className="approach__head">
          <h2 id="approach-title" className="h-xl" data-split="lines">{approach.title}</h2>
          <p className="approach__lede">{approach.lede}</p>
        </header>
        <ol className="approach__list">
          {approach.techs.map((t, i) => (
            <li key={t.id} id={`tech-${t.id}`} className="tech">
              <div className="tech__copy">
                <p className="tech__n meta">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="h-l tech__name">{t.name}</h3>
                <p className="tech__text">{t.text}</p>
                <p className="tech__benefit">{t.benefit}</p>
              </div>
              <figure className="tech__still still">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.still.src} width={t.still.w} height={t.still.h} alt={t.still.alt} loading="lazy" decoding="async" />
                <figcaption className="meta">{t.still.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ol>
        <p className="section-more"><Link className="go" href={approachLink.href}>{approachLink.label} <span className="go__arrow" aria-hidden="true">→</span></Link></p>
      </section>

      <section className="archive wrap" aria-labelledby="archive-title">
        <header className="archive__head">
          <h2 id="archive-title" className="h-xl" data-split="lines">{home.archiveTitle}</h2>
          <p className="archive__lede">{home.archiveLede}</p>
        </header>
        <PaperIndex
          rows={rows}
          stage="home-index"
          plate={<Plate items={archiveItems(rows[0].figure)} mode="stage" stage="home-index" label="Figure for the selected paper" />}
        />
        <p className="section-more archive__more"><Link className="go" href={workInProgress.link.href}>{workInProgress.link.label} <span className="go__arrow" aria-hidden="true">→</span></Link></p>
      </section>

      <section className="teaser wrap" aria-labelledby="teaser-title">
        <p className="teaser__n num" aria-hidden="true">{lab.researchers}</p>
        <div className="teaser__text">
          <h2 id="teaser-title" className="h-xl" data-split="lines">{home.labTitle}</h2>
          <p className="lede">{home.labText}</p>
          <Link className="btn" href={home.labAction.href}>{home.labAction.label} <span className="btn__arrow" aria-hidden="true">→</span></Link>
        </div>
        <div className="teaser__olympiads">
          <p className="teaser__sub"><span className="sr-only">{lab.researchers} </span>{home.medalists}</p>
          <ul className="olympiads" aria-label="Olympiads" data-reveal="ink">
            {olympiads.map((o) => (
              <li key={o.name} className="olympiad">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="olympiad__logo" src={o.logo} alt={o.alt} width={o.w} height={o.h} loading="lazy" decoding="async" />
                <span className="olympiad__name meta">{o.name}<span className="sr-only">, {o.full}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
