import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Motion } from '@/components/Motion';
import { papers, site } from '@/data/site';
import { math, mono, sans, sansExtra } from './fonts';
import './globals.css';
import '../styles/chrome.css';
import '../styles/plate.css';
import '../styles/pages.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.role}`, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: './' },
  openGraph: { type: 'website', siteName: site.name, images: [{ url: `${site.url}/og.png`, width: 1200, height: 630, alt: 'Mantis Discovery' }] },
  twitter: { card: 'summary_large_image', images: [`${site.url}/og.png`] },
};

export const viewport: Viewport = {
  themeColor: '#0a0b0c',
  colorScheme: 'dark',
};

// Runs before first paint: hidden-until-revealed styles only apply when JS and motion are on.
const flags = `document.documentElement.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ResearchOrganization',
  name: site.name,
  url: site.url,
  email: `mailto:${site.email}`,
  description: site.description,
  knowsAbout: ['Mathematics', 'Machine learning', 'Physics', 'Chemistry', 'Biology', 'AI for science'],
  subjectOf: papers.map((p) => ({ '@type': 'ScholarlyArticle', name: p.title, url: `https://doi.org/${p.doi}` })),
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${sans.variable} ${sansExtra.variable} ${mono.variable} ${math.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: flags }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <div id="curtain" aria-hidden="true">
          <div className="curtain__panel" />
          <div className="curtain__pen" />
          <div className="curtain__ink" />
          <p className="curtain__label" />
        </div>
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <Motion />
      </body>
    </html>
  );
}
