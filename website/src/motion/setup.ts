// Global motion for this site: runs once on the client, before the first page initializes.
//  - The page transition is the carriage pass: a pencil line sweeps left to right trailing the
//    ground (leave), then an ink line leads the ground off the new page (enter).
import { gsap } from 'gsap';
import { ease, onScroll, setTransition } from '@/engine';

// The name of the place the visitor is going (the clicked link's text), shown on the carriage.
let destination = '';
const nameOf = (a: HTMLAnchorElement) => {
  const path = new URL(a.href, location.href).pathname;
  if (path === '/') return 'Mantis Discovery';
  if (path.startsWith('/research/') && path !== '/research/') return a.querySelector('.row__title, .next__title')?.textContent || a.textContent || '';
  return ({ '/research/': 'Research', '/method/': 'Method', '/lab/': 'Lab' } as Record<string, string>)[path] ?? a.textContent ?? '';
};

export function setupMotion() {
  addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a');
    if (a) destination = nameOf(a as HTMLAnchorElement).trim().slice(0, 90);
  }, true);
  setTransition({
    leave: (c) => {
      const panel = c.querySelector('.curtain__panel');
      const pen = c.querySelector('.curtain__pen');
      const ink = c.querySelector('.curtain__ink');
      const label = c.querySelector<HTMLElement>('.curtain__label');
      if (label) label.textContent = destination;
      return gsap.timeline()
        .set(c, { autoAlpha: 1 })
        .set(ink, { autoAlpha: 0 })
        .set(pen, { autoAlpha: 1 })
        .set(label, { clipPath: 'inset(-20% 100% -20% 0%)' })
        .fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.6, ease: ease.inOut }, 0)
        .fromTo(pen, { x: 0 }, { x: () => innerWidth, duration: 0.6, ease: ease.inOut }, 0)
        // The name is written while the ground is still crossing, so the covered screen never waits on it.
        .to(label, { clipPath: 'inset(-20% -2% -20% 0%)', duration: 0.45, ease: ease.out }, 0.15)
        .set(pen, { autoAlpha: 0 });
    },
    enter: (c) => {
      const panel = c.querySelector('.curtain__panel');
      const ink = c.querySelector('.curtain__ink');
      const label = c.querySelector('.curtain__label');
      return gsap.timeline()
        .set(ink, { autoAlpha: 1, x: 0 })
        .to(label, { clipPath: 'inset(-20% -2% -20% 100%)', duration: 0.45, ease: ease.inOut }, 0)
        .to(panel, { xPercent: 100, duration: 0.7, ease: ease.inOut }, 0)
        .to(ink, { x: () => innerWidth, duration: 0.7, ease: ease.inOut }, 0)
        .set(c, { autoAlpha: 0 })
        .set(panel, { xPercent: -100 });
    },
  });

  // The header steps aside while reading down and returns on the way up.
  let last = 0;
  const root = document.documentElement.classList;
  onScroll(({ y }) => {
    root.toggle('scrolled', y > 24);
    if (Math.abs(y - last) < 6) return;
    const menu = document.getElementById('menu');
    const menuOpen = !!menu && !menu.hasAttribute('hidden');
    root.toggle('frame-away', y > 200 && y > last && !menuOpen);
    last = y;
  });
}
