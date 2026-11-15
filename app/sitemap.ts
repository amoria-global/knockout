import type { MetadataRoute } from 'next';
import {
  SITE_URL, fetchSitemapFeed,
  eventUrl, photographerUrl, livestreamUrl, galleryUrl,
} from '@/lib/seo/seo';

// No lastModified: the feed carries slugs only, and a generation time stamped on every URL teaches crawlers to ignore
// the field. Add real updatedAt values here once the feed returns them.
// Re-generated at most every 30 min so new entities reach crawlers quickly.
// One sitemap covers every public entity type with an SEO route: events,
// photographers, livestreams, content galleries. Static landing routes go
// first so the homepage anchors the index even when the DB feed is empty.
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/user/photographers`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/user/events`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/user/hall-of-fame`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/user/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/user/help-center`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/user/photographer-guide`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/user/contact_us`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/user/trust-safety`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/user/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/user/terms-of-service`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/get-app`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const feed = await fetchSitemapFeed().catch(() => ({ events: [], photographers: [], streams: [], galleries: [] }));

  const eventRoutes: MetadataRoute.Sitemap = feed.events.map(slug => ({
    url: eventUrl(slug),
    changeFrequency: 'hourly',
    priority: 0.7,
  }));

  const photographerRoutes: MetadataRoute.Sitemap = feed.photographers.map(slug => ({
    url: photographerUrl(slug),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const streamRoutes: MetadataRoute.Sitemap = feed.streams.map(slug => ({
    url: livestreamUrl(slug),
    // Livestreams change state often (upcoming -> live -> ended); ping hourly.
    changeFrequency: 'hourly',
    priority: 0.75,
  }));

  const galleryRoutes: MetadataRoute.Sitemap = feed.galleries.map(slug => ({
    url: galleryUrl(slug),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...eventRoutes, ...photographerRoutes, ...streamRoutes, ...galleryRoutes];
}
