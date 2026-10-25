import type { Metadata } from 'next';
import Link from 'next/link';
import { Plate } from '@/components/Plate';
import { archiveItems } from '@/components/figures';
import { lab, mantis, site, team, type Member as Person } from '@/data/site';

// A name, and on hover or focus a short bio above it (the bio is also its accessible description).
function Member({ m }: { m: Person }) {
  const role = m.role && <span className="member__role">{m.role}</span>;
  if (!m.bio) return <li className="member"><span className="member__name">{m.name}</span>{role}</li>;
  const id = `bio-${m.name.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <li className="member">
      <button type="button" className="member__name member__name--bio" aria-describedby={id}>{m.name}</button>
      {role}
      <span id={id} role="tooltip" className="member__bio">{m.bio}</span>
    </li>
  );
}

export const metadata: Metadata = {
  title: 'Lab',
  description: 'Mantis Discovery has more than 25 researchers, including PhD students and olympiad medalists. We use AI in our research and check each result before publishing.',
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
          <Plate items={archiveItems('gyro')} mode="cycle" label="Figures from the lab's papers, one after another" />
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
          <h3 className="team__label">Researchers</h3>
          <ul className="team__names">
            {team.members.map((m) => <Member key={m.name} m={m} />)}
          </ul>
        </div>
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
