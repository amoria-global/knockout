import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LivestreamClient from '../livestream.client';
import {
  resolveSlug, fetchEventForSeo, eventSeoDescription,
  absUrl, livestreamWatchUrl, livestreamUrl, SITE_URL, SITE_NAME,
} from '@/lib/seo/seo';

/**
 * Canonical watch URL for a paid anonymous viewer.
 *
 *   /user/events/livestream/{slug}/{viewerId}
 *
 * The viewerId is the "watch id" - a UUID anchoring viewer name/email/
 * phone, device fingerprint, payment status, and timestamps in the
 * anonymous_stream_viewers row. The whole thing is fetched server-side
 * (and re-checked client-side every heartbeat) so a copied watch URL
 * keeps working on the same device as long as the payment row hasn't
 * been refunded.
 *
 * Free-event watch URLs continue to use the no-viewerId form at
 * /user/events/livestream/{slug} (one level up).
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string; viewerId: string }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, viewerId } = await params;
  // Bad viewerId → fall back to the slug-only canonical so we don't
  // emit a deliberately malformed URL in og:url.
  if (!UUID_RE.test(viewerId)) {
    return { title: 'Livestream', description: `Watch live on ${SITE_NAME}.`,
      alternates: { canonical: livestreamUrl(slug) } };
  }

  const r = await resolveSlug('stream', slug);
  if (!r) return { title: 'Livestream', description: `Watch live on ${SITE_NAME}.` };

  const ev = await fetchEventForSeo(r.id);
  const name = (ev?.title || r.title || 'Livestream').trim();
  const title = `Watch Live - ${name}`;
  const description = ev ? eventSeoDescription(ev)
                         : (r.description || `Watch ${name} live on ${SITE_NAME}.`);
  const image = absUrl(ev?.eventPhoto);
  const url = livestreamWatchUrl(r.slug, viewerId);

  return {
    title,
    description,
    // Canonical here is intentionally the watch URL (with viewerId) -
    // it's the user-shareable, paid-access version of the page. The
    // unauth/free slug URL one level up exists for crawlers + free
    // events and won't collide because it has its own canonical there.
    alternates: { canonical: url },
    robots: { index: false, follow: false },  // per-viewer link - keep out of Google
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
  const { slug, viewerId } = await params;
  if (!UUID_RE.test(viewerId)) {
    // Malformed watch id → drop to the slug-only page; user can re-enter
    // their email at the entry-fee gate to recover.
    redirect(`/user/events/livestream/${slug}`);
  }

  const r = await resolveSlug('stream', slug);
  if (!r) notFound();
  if (r.redirect) redirect(`/user/events/livestream/${r.redirect}/${viewerId}`);

  const ev = await fetchEventForSeo(r.id);

  // Per-viewer URLs aren't indexable - JSON-LD points at the
  // public livestream URL (one level up) so the Event still has a
  // canonical entity for Google.
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
    url: `${SITE_URL}/user/events/livestream/${r.slug}`,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    videoFormat: 'HD',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LivestreamClient eventId={r.id} viewerId={viewerId} />
    </>
  );
}
