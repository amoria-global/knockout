import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import ViewProfilePage, { ProfilePendingScreen } from '../../pages/photographer/view-profile';
import {
  resolveSlug, fetchPhotographerForSeo, photographerUnavailableReason, photographerDisplayName,
  clamp, absUrl, photographerUrl, SITE_URL, SITE_NAME,
} from '@/lib/seo/seo';

/**
 * Canonical SEO route for photographer profiles.
 *
 * Path: /photographers/{slug}
 *
 * Mirrors the metadata + JSON-LD already on
 * /user/photographers/view-profile?id=... but with a stable, search-engine
 * friendly URL. Middleware redirects the legacy route to here.
 */

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveSlug('photographer', slug);
  if (!r) return { title: 'Photographer', description: `Book photographers on ${SITE_NAME}.` };
  // Awaiting approval: the backend sends no name, so there is nothing to show and nothing to index.
  if (r.pending) return { title: 'Profile pending', robots: { index: false, follow: false } };

  const p = await fetchPhotographerForSeo(r.id);
  if (!p) {
    // The slug resolves but the profile does not load. If it is awaiting approval (or gone), keep it out of search and
    // do not print the person's name in the title: they have not been approved to appear publicly. A passing outage
    // returns null from the check, so a good page never drops out of search by accident.
    const gone = await photographerUnavailableReason(r.id);
    return gone
      ? { title: gone === 'pending' ? 'Profile pending' : 'Photographer', robots: { index: false, follow: false } }
      : { title: r.title || 'Photographer' };
  }

  const name = photographerDisplayName(p);
  const title = `Book - ${name}`;
  const description = clamp(
    p.about || p.professionalPhilosophy ||
    `Book ${name} for professional event photography and live streaming on ${SITE_NAME}.`
  );
  const image = absUrl(p.profilePicture) || absUrl(p.coverPicture);
  const url = photographerUrl(r.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
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
  const r = await resolveSlug('photographer', slug);
  if (!r) notFound();
  if (r.pending) return <ProfilePendingScreen />;
  if (r.redirect) redirect(photographerUrl(r.redirect));

  const p = await fetchPhotographerForSeo(r.id);

  const jsonLd = p ? {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: photographerDisplayName(p),
    description: clamp(p.about || p.professionalPhilosophy || `Book ${photographerDisplayName(p)} on ${SITE_NAME}.`),
    ...(p.city ? { areaServed: p.city } : {}),
    ...(p.profilePicture ? { image: absUrl(p.profilePicture) } : {}),
    url: photographerUrl(r.slug),
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={null}>
        <ViewProfilePage photographerId={r.id} />
      </Suspense>
    </>
  );
}
