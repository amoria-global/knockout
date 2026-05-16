import type { Metadata } from 'next';
import ViewEventClient from './view-event.client';
import {
  fetchEventForSeo, eventSeoTitle, eventSeoDescription, absUrl,
  SITE_URL, SITE_NAME,
} from '@/lib/seo/seo';

// Always server-render with fresh data so a crawler/scraper sees the
// current status-aware title immediately (nothing stale to propagate).
export const dynamic = 'force-dynamic';

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

function readId(sp: Record<string, string | string[] | undefined>): string | null {
  const v = sp.id ?? sp.eventId;
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const id = readId(await searchParams);
  if (!id) return { title: 'Event' };

  const ev = await fetchEventForSeo(id);
  if (!ev || !ev.title) {
    return { title: 'Event', description: `Discover events on ${SITE_NAME}.` };
  }

  const title = eventSeoTitle(ev);            // e.g. "Watch Live - UMUDENDE LIVE CONCERT"
  const description = eventSeoDescription(ev);
  const image = absUrl(ev.eventPhoto);
  const url = `${SITE_URL}/user/events/view-event?id=${encodeURIComponent(ev.id)}`;

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

export default async function Page({ searchParams }: { searchParams: SP }) {
  const id = readId(await searchParams);
  const ev = id ? await fetchEventForSeo(id) : null;

  // schema.org Event (+ BroadcastEvent for live-streamed ones) so it can
  // show as a rich result / be picked up fast by engines that support it.
  const jsonLd = ev && ev.title ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: eventSeoDescription(ev),
    ...(ev.eventDate ? { startDate: ev.startTime ? `${ev.eventDate}T${ev.startTime}` : ev.eventDate } : {}),
    eventStatus:
      (ev.eventStatus || '').toUpperCase() === 'COMPLETED'
        ? 'https://schema.org/EventScheduled'
        : 'https://schema.org/EventScheduled',
    ...(ev.hasLiveStream
      ? {
          eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
          location: { '@type': 'VirtualLocation', url: `${SITE_URL}/user/events/view-event?id=${encodeURIComponent(ev.id)}` },
        }
      : ev.location
      ? { location: { '@type': 'Place', name: ev.location } }
      : {}),
    ...(ev.eventPhoto ? { image: [absUrl(ev.eventPhoto)] } : {}),
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    url: `${SITE_URL}/user/events/view-event?id=${encodeURIComponent(ev.id)}`,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ViewEventClient />
    </>
  );
}
