import type { MetadataRoute } from 'next';

// Written once at build time: the site is exported as static files.
export const dynamic = 'force-static';
import { site } from '@/data/site';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${site.url}/sitemap.xml` };
}
