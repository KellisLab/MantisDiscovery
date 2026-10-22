import type { MetadataRoute } from 'next';

// Written once at build time: the site is exported as static files.
export const dynamic = 'force-static';
import { papers, site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['/', '/research/', '/method/', '/lab/'];
  return [
    ...pages.map((path) => ({ url: `${site.url}${path}`, changeFrequency: 'monthly' as const, priority: path === '/' ? 1 : 0.8 })),
    ...papers.map((p) => ({ url: `${site.url}/research/${p.slug}/`, lastModified: p.published, changeFrequency: 'yearly' as const, priority: 0.7 })),
  ];
}
