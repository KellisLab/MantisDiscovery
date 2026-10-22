import type { Metadata } from 'next';
import Link from 'next/link';
import { Plate } from '@/components/Plate';
import { archiveItems, Draft } from '@/components/plates';
import { lab, mantis, site, team, type Member as Person } from '@/data/site';

// A name, and on hover or focus a short bio above it (the bio is also its accessible description).
function Member({ m }: { m: Person }) {
  if (!m.bio) return <li className="member"><span className="member__name">{m.name}</span></li>;
  const id = `bio-${m.name.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <li className="member">
      <button type="button" className="member__name member__name--bio" aria-describedby={id}>{m.name}</button>
      <span id={id} role="tooltip" className="member__bio">{m.bio}</span>
    </li>
  );
}

export const metadata: Metadata = {
  title: 'Lab',
  description: 'Mantis Discovery is a group of 25+ researchers, including PhD students and olympiad medalists, who do research with AI and check every result.',
};

export default function Lab() {
  return (
    <>
      <section className="page-hero page-hero--lab wrap" aria-labelledby="page-title">
        <div className="lab-hero__text">
          <p className="eyebrow">The lab · {mantis.relation}</p>
          <h1 id="page-title" className="display ink-in">{lab.title}</h1>
          <p className="lede">{lab.lede}</p>
          <div className="lab-stat">
            <p className="lab-stat__n num" aria-hidden="true">{lab.researchers}</p>
            <p className="lab-stat__text"><span className="sr-only">{lab.researchers} </span>{lab.researchersText}</p>
          </div>
        </div>
        <div className="lab-hero__plate">
          <Plate items={archiveItems('sidon')} mode="cycle" draft={<Draft id="sidon" />} label="Live figures from the lab's papers, one after another" />
        </div>
      </section>

      <section id="team" className="team wrap" aria-labelledby="team-title">
        <h2 id="team-title" className="h-xl" data-split="lines">Team</h2>
        <div className="team__group">
          <h3 className="team__label">Leads</h3>
          <ul className="team__names team__names--leads">
            {team.leads.map((m) => <Member key={m.name} m={m} />)}
          </ul>
        </div>
        <div className="team__group">
          <h3 className="team__label">Mantis discoverers</h3>
          <ul className="team__names">
            {team.members.map((m) => <Member key={m.name} m={m} />)}
          </ul>
        </div>
      </section>

      <section className="work wrap" aria-labelledby="work-title">
        <h2 id="work-title" className="h-xl" data-split="lines">How we work with AI</h2>
        <ol className="work__list">
          {lab.work.map((w, i) => (
            <li key={w.name} className="work__item" data-reveal="ink">
              <p className="meta">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="h-l">{w.name}</h3>
              <p>{w.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="join wrap" aria-labelledby="join-title">
        <h2 id="join-title" className="h-xl" data-split="lines">{lab.joinTitle}</h2>
        <p className="lede">{lab.joinText}</p>
        <div className="actions">
          <a className="btn" href={`mailto:${site.email}`}>{lab.joinAction} <span className="btn__arrow" aria-hidden="true">→</span></a>
          <Link className="go" href="/research/">Read the papers first <span className="go__arrow" aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
