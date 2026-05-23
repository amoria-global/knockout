import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ViewEventClient from '../view-event/view-event.client';
import {
  resolveSlug, fetchEventForSeo, eventSeoTitle, eventSeoDescription,
  absUrl, eventUrl, SITE_URL, SITE_NAME,
} from '@/lib/seo/seo';

/**
 * Canonical SEO route for events.
 *
 * Path: /user/events/{slug}
 *
 * - resolves slug -> entity id via /api/remote/public/seo/resolve
 * - historical slugs (after rename) 301 to the current slug here
 * - emits Metadata + JSON-LD Event schema pointed at the slug URL
 * - delegates to the existing client component, passing the id as a prop
 *
 * The legacy /user/events/view-event?id=... route still works and is
 * 301-redirected to this route by middleware.ts so backlinks transfer
 * their SEO weight.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveSlug('event', slug);
  if (!r) return { title: 'Event', description: `Discover events on ${SITE_NAME}.` };

  const ev = await fetchEventForSeo(r.id);
  if (!ev || !ev.title) return { title: r.title || 'Event' };

  const title = eventSeoTitle(ev);
  const description = eventSeoDescription(ev);
  const image = absUrl(ev.eventPhoto);
  const url = eventUrl(r.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const r = await resolveSlug('event', slug);
  if (!r) notFound();
  // Slug history hit: 301 to the current canonical slug.
  if (r.redirect) redirect(eventUrl(r.redirect));

  const ev = await fetchEventForSeo(r.id);

  const jsonLd = ev && ev.title ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: eventSeoDescription(ev),
    ...(ev.eventDate ? { startDate: ev.startTime ? `${ev.eventDate}T${ev.startTime}` : ev.eventDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    ...(ev.hasLiveStream
      ? {
          eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
          location: { '@type': 'VirtualLocation', url: eventUrl(r.slug) },
        }
      : ev.location
      ? { location: { '@type': 'Place', name: ev.location } }
      : {}),
    ...(ev.eventPhoto ? { image: [absUrl(ev.eventPhoto)] } : {}),
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    url: eventUrl(r.slug),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ViewEventClient eventId={r.id} />
    </>
  );
}
