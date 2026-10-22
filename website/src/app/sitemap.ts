import type { MetadataRoute } from 'next';
import { papers, site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['/', '/research/', '/method/', '/lab/'];
  return [
    ...pages.map((path) => ({ url: `${site.url}${path}`, changeFrequency: 'monthly' as const, priority: path === '/' ? 1 : 0.8 })),
    ...papers.map((p) => ({ url: `${site.url}/research/${p.slug}/`, lastModified: p.published, changeFrequency: 'yearly' as const, priority: 0.7 })),
  ];
}
