import type { MetadataRoute } from 'next';
import {
  SITE_URL, fetchSitemapFeed,
  eventUrl, photographerUrl, livestreamUrl, galleryUrl,
} from '@/lib/seo/seo';

// Re-generated at most every 30 min so new entities reach crawlers quickly.
// One sitemap covers every public entity type with an SEO route: events,
// photographers, livestreams, content galleries. Static landing routes go
// first so the homepage anchors the index even when the DB feed is empty.
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/user/photographers`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  const feed = await fetchSitemapFeed().catch(() => ({ events: [], photographers: [], streams: [], galleries: [] }));

  const eventRoutes: MetadataRoute.Sitemap = feed.events.map(slug => ({
    url: eventUrl(slug),
    lastModified: now,
    changeFrequency: 'hourly',
    priority: 0.7,
  }));

  const photographerRoutes: MetadataRoute.Sitemap = feed.photographers.map(slug => ({
    url: photographerUrl(slug),
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const streamRoutes: MetadataRoute.Sitemap = feed.streams.map(slug => ({
    url: livestreamUrl(slug),
    lastModified: now,
    // Livestreams change state often (upcoming -> live -> ended); ping hourly.
    changeFrequency: 'hourly',
    priority: 0.75,
  }));

  const galleryRoutes: MetadataRoute.Sitemap = feed.galleries.map(slug => ({
    url: galleryUrl(slug),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...eventRoutes, ...photographerRoutes, ...streamRoutes, ...galleryRoutes];
}
