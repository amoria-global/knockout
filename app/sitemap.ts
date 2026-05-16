import type { MetadataRoute } from 'next';
import {
  SITE_URL, fetchEventsForSitemap, fetchPhotographersForSitemap,
} from '@/lib/seo/seo';

// Re-generated at most every 30 min so new/updated events & photographers
// (and their lastModified) reach crawlers quickly.
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/user/photographers`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  const [events, photographers] = await Promise.all([
    fetchEventsForSitemap().catch(() => []),
    fetchPhotographersForSitemap().catch(() => []),
  ]);

  const eventRoutes: MetadataRoute.Sitemap = events
    .filter(e => e && e.id)
    .map(e => ({
      url: `${SITE_URL}/user/events/view-event?id=${encodeURIComponent(e.id)}`,
      lastModified: e.updatedAt ? new Date(e.updatedAt) : now,
      changeFrequency: 'hourly',
      priority: 0.7,
    }));

  const photographerRoutes: MetadataRoute.Sitemap = photographers
    .filter(p => p && p.id)
    .map(p => ({
      url: `${SITE_URL}/user/photographers/view-profile?id=${encodeURIComponent(p.id)}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'daily',
      priority: 0.6,
    }));

  return [...staticRoutes, ...eventRoutes, ...photographerRoutes];
}
