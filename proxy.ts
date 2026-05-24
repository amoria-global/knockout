import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Home app proxy (Next.js 16 edge middleware).
 *
 * Two responsibilities, in order:
 *  1. SEO redirects: translate legacy ?id=<uuid> URLs to slug URLs so
 *     backlinks, bookmarks, and Google's cached results forward their
 *     authority to canonical slug routes.
 *  2. Route protection: redirect unauthenticated traffic to /user/auth/login
 *     when hitting a protected prefix.
 *
 * Both run on the edge - keep work minimal for the 99% of traffic that
 * hits neither code path (the early return handles them).
 */

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com').replace(/\/+$/, '');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lookupSlug(
  type: 'event' | 'photographer' | 'stream',
  id: string,
): Promise<string | null> {
  if (!UUID_RE.test(id)) return null;
  try {
    const r = await fetch(
      `${BACKEND}/api/remote/public/seo/slug-for?type=${type}&id=${encodeURIComponent(id)}`,
      { cache: 'no-store' },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { slug?: string };
    return j?.slug && /^[a-z0-9-]+$/.test(j.slug) ? j.slug : null;
  } catch {
    return null;
  }
}

async function seoRedirect(request: NextRequest): Promise<NextResponse | null> {
  const url = request.nextUrl;
  const path = url.pathname;
  const id = url.searchParams.get('id') || url.searchParams.get('eventId');
  if (!id) return null;

  let redirectPath: string | null = null;
  if (path === '/user/events/view-event') {
    const slug = await lookupSlug('event', id);
    if (slug) redirectPath = `/user/events/${slug}`;
  } else if (path === '/user/photographers/view-profile') {
    const slug = await lookupSlug('photographer', id);
    if (slug) redirectPath = `/photographers/${slug}`;
  } else if (path === '/user/events/live-stream') {
    const slug = await lookupSlug('stream', id);
    if (slug) {
      // If the legacy URL carries ?viewerId=<UUID>, push it into the path
      // so the canonical /user/events/livestream/{slug}/{viewerId} watch
      // URL becomes the indexable share link.
      const vid = url.searchParams.get('viewerId');
      const isValidVid = vid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vid);
      redirectPath = isValidVid
        ? `/user/events/livestream/${slug}/${vid}`
        : `/user/events/livestream/${slug}`;
    }
  }
  if (!redirectPath) return null;

  // Preserve only query params the destination still needs (e.g.
  // ?reserved=1, ?group=1). Strip the ones that have been promoted
  // into the path (id, eventId, viewerId) and the ones that no longer
  // mean anything to the new pages (from=payment - live-stream now
  // always retries on access denial, no hint needed).
  const passthrough = new URLSearchParams();
  url.searchParams.forEach((v, k) => {
    if (k === 'id' || k === 'eventId') return;
    if (k === 'viewerId' && redirectPath?.includes('/livestream/')) return;
    if (k === 'from') return;
    passthrough.append(k, v);
  });
  const finalUrl = new URL(
    redirectPath + (passthrough.toString() ? '?' + passthrough.toString() : ''),
    url.origin,
  );
  return NextResponse.redirect(finalUrl, 301);
}

export async function proxy(request: NextRequest) {
  // 1. SEO redirects come first so a logged-in user hitting an old
  //    legacy URL still gets canonicalised (auth check below uses the
  //    final URL anyway).
  const seo = await seoRedirect(request);
  if (seo) return seo;

  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get('authToken')?.value;
  const hasToken = !!authToken;

  // Protected routes that require authentication (allowlist approach)
  const protectedPrefixes = [
    '/user/photographers/book-now',
  ];

  const isProtectedRoute = protectedPrefixes.some(prefix =>
    pathname.startsWith(prefix)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // No token on a protected route → redirect to login with return URL
  if (!hasToken) {
    const loginUrl = new URL('/user/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
