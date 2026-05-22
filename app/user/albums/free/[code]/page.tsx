'use client';

/**
 * Legacy free-album entry point.
 *
 * All free-album access has converged on `/user/find-my-photos` so the cap +
 * pay-for-extras enforcement, the cart UX, the returning-buyer detection and
 * the watermark/anti-scrape protections live in exactly one place. We keep
 * this route alive so emailed invite links of the form
 *   /user/albums/free/{code}
 * (and the old shape with ?email=…) still work. they just bounce to the
 * canonical page with the same params.
 *
 * The redirect is client-side because the email link sometimes carries a
 * fragment / extra query the photographer sent themselves and we want to
 * preserve all of it as-is.
 */

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function FreeAlbumLegacyRedirect() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = (params?.code as string | undefined)?.trim();
    if (!code) {
      router.replace('/user/find-my-photos');
      return;
    }
    const sp = new URLSearchParams();
    sp.set('code', code);
    // Forward everything the original URL carried (email, refid, buyerId, …)
    // so the canonical page can resume verification / restore buyer state.
    searchParams.forEach((value, key) => {
      if (key === 'code') return;
      sp.set(key, value);
    });
    router.replace(`/user/find-my-photos?${sp.toString()}`);
  }, [params, router, searchParams]);

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0b10',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <span>Loading your album…</span>
    </main>
  );
}
