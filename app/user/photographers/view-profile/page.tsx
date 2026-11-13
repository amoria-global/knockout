import type { Metadata } from 'next';
import { Suspense } from 'react';
import ViewProfilePage from '../../../pages/photographer/view-profile';
import {
  fetchPhotographerForSeo, photographerUnavailableReason, photographerDisplayName, clamp, absUrl,
  SITE_URL, SITE_NAME,
} from '@/lib/seo/seo';

// Server-render fresh so a crawler always gets the current name/bio.
export const dynamic = 'force-dynamic';

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

function readId(sp: Record<string, string | string[] | undefined>): string | null {
  const v = sp.id;
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const id = readId(await searchParams);
  if (!id) return { title: 'Photographer' };

  const p = await fetchPhotographerForSeo(id);
  if (!p) {
    // A profile awaiting approval (or one that does not exist) must not be indexed. A passing outage returns null
    // from the check, so it keeps the default robots rules and nothing drops out of search by accident.
    const gone = await photographerUnavailableReason(id);
    return {
      title: gone === 'pending' ? 'Profile pending' : 'Photographer',
      description: `Book photographers on ${SITE_NAME}.`,
      ...(gone ? { robots: { index: false, follow: false } } : {}),
    };
  }

  const name = photographerDisplayName(p);            // e.g. "Legacy Studio"
  const title = `Book - ${name}`;                     // → "Book - Legacy Studio | Amoria Connekyt"
  const description = clamp(
    p.about || p.professionalPhilosophy ||
    `Book ${name} for professional event photography and live streaming on ${SITE_NAME}.`
  );
  const image = absUrl(p.profilePicture) || absUrl(p.coverPicture);
  const url = `${SITE_URL}/user/photographers/view-profile?id=${encodeURIComponent(p.id)}`;

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

export default async function Page({ searchParams }: { searchParams: SP }) {
  const id = readId(await searchParams);
  const p = id ? await fetchPhotographerForSeo(id) : null;

  const jsonLd = p ? {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: photographerDisplayName(p),
    description: clamp(p.about || p.professionalPhilosophy || `Book ${photographerDisplayName(p)} on ${SITE_NAME}.`),
    ...(p.city ? { areaServed: p.city } : {}),
    ...(p.profilePicture ? { image: absUrl(p.profilePicture) } : {}),
    url: `${SITE_URL}/user/photographers/view-profile?id=${encodeURIComponent(p.id)}`,
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
        <ViewProfilePage />
      </Suspense>
    </>
  );
}
