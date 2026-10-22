'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { mantis, nav, site } from '@/data/site';
import { startScroll, stopScroll, prefersReducedMotion } from '@/engine';

function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="mantis-mark" aria-hidden="true" />
      <span className="brand__name"><span>Mantis</span> <span>Discovery</span></span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  // The menu remembers the page it was opened on, so changing page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const current = (href: string) => (pathname === href || pathname.startsWith(href) ? 'page' : undefined);

  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    if (!open) { startScroll(); return; }
    stopScroll();
    const links = [...el.querySelectorAll<HTMLAnchorElement>('a')];
    links[0]?.focus();
    if (!prefersReducedMotion()) {
      gsap.fromTo(el.querySelectorAll('.menu__links a'), { clipPath: 'inset(-20% 100% -20% 0%)' }, { clipPath: 'inset(-20% -2% -20% 0%)', duration: 0.9, ease: 'expo.out', stagger: 0.06 });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenOn(null); btn.current?.focus(); return; }
      if (e.key !== 'Tab') return;
      const items: HTMLElement[] = [btn.current!, ...links];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className="header">
        <Brand />
        <nav className="nav" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="draw" aria-current={current(n.href)}>{n.label}</Link>
          ))}
        </nav>
        <div className="header__end">
          <a className="go" href={mantis.url} rel="noopener">Mantis <span className="go__arrow" aria-hidden="true">↗</span></a>
          <a className="btn" href={`mailto:${site.email}`}>Write to us</a>
        </div>
        <button ref={btn} type="button" className="menu-btn" aria-expanded={open} aria-controls="menu" onClick={() => setOpenOn(open ? null : pathname)}>
          <span className="menu-btn__icon" aria-hidden="true" />
          {open ? 'Close' : 'Menu'}
        </button>
      </header>
      <nav id="menu" ref={menu} className="menu" aria-label="Menu" hidden={!open}>
        <div className="menu__links">
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}><span className="mark" aria-hidden="true" />Home</Link>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)}><span className="mark" aria-hidden="true" />{n.label}</Link>
          ))}
        </div>
        <div className="menu__foot">
          <a className="btn" href={`mailto:${site.email}`}>Write to us</a>
          <a className="go" href={mantis.url} rel="noopener">Mantis main site <span className="go__arrow" aria-hidden="true">↗</span></a>
        </div>
      </nav>
    </>
  );
}
