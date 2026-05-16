import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth + API noise should never be indexed.
      disallow: ['/api/', '/user/auth/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
