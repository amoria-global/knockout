import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LivestreamClient from './livestream.client';
import {
  resolveSlug, fetchEventForSeo, eventSeoDescription,
  absUrl, livestreamUrl, SITE_URL, SITE_NAME,
} from '@/lib/seo/seo';

/**
 * Canonical SEO route for livestreams.
 *
 * Path: /user/events/livestream/{slug}
 *
 * Server-renders metadata + BroadcastEvent JSON-LD so a livestream is
 * indexable as a separate entity from its underlying event. The slug
 * is the stream's own slug; resolveSlug('stream', ...) returns the
 * parent event's id (the live-stream UI needs the event row to load
 * stream tokens), and the URL stays slug-based.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveSlug('stream', slug);
  if (!r) return { title: 'Livestream', description: `Watch live on ${SITE_NAME}.` };

  const ev = await fetchEventForSeo(r.id);
  const name = (ev?.title || r.title || 'Livestream').trim();
  const title = `Watch Live - ${name}`;
  const description = ev ? eventSeoDescription(ev)
                         : (r.description || `Watch ${name} live on ${SITE_NAME}.`);
  const image = absUrl(ev?.eventPhoto);
  const url = livestreamUrl(r.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'video.other',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'player',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const r = await resolveSlug('stream', slug);
  if (!r) notFound();
  if (r.redirect) redirect(livestreamUrl(r.redirect));

  const ev = await fetchEventForSeo(r.id);

  // schema.org BroadcastEvent is the right type for a scheduled/ongoing
  // livestream. Falls back gracefully when the parent event payload is
  // missing - we still emit a Person-less, location-less Event so the
  // page is at least typed.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BroadcastEvent',
    name: ev?.title || r.title || 'Livestream',
    isLiveBroadcast: true,
    ...(ev?.eventDate
      ? { startDate: ev.startTime ? `${ev.eventDate}T${ev.startTime}` : ev.eventDate }
      : {}),
    ...(ev?.eventPhoto ? { thumbnailUrl: absUrl(ev.eventPhoto) } : {}),
    description: ev ? eventSeoDescription(ev) : (r.description || ''),
    url: livestreamUrl(r.slug),
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    videoFormat: 'HD',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LivestreamClient eventId={r.id} />
    </>
  );
}
