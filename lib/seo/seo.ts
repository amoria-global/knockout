/**
 * Server-side SEO helpers.
 *
 * generateMetadata / sitemap run on the server (or at build) where the
 * browser-only apiClient (localStorage, window) can't run - so we fetch the
 * public backend directly with plain fetch + `no-store` so every crawl gets
 * the current title/description (nothing stale to "propagate").
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://connekyt.com').replace(/\/+$/, '');
export const SITE_NAME = 'Amoria Connekyt';

const BACKEND_BASE = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://backend.connekyt.com/'
).replace(/\/+$/, '') + '/';

function backendUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ''), BACKEND_BASE).toString();
}

/** Trim to a clean meta-description length on a word boundary. */
export function clamp(text: string | null | undefined, max = 160): string {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, '').trim() + '…';
}

/** Absolute, crawlable URL for an OG/Twitter image (backend already returns
 *  full URLs, but be defensive about relative paths). */
export function absUrl(u: string | null | undefined): string | undefined {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  try { return backendUrl(u); } catch { return undefined; }
}

async function getJson(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(backendUrl(path), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Backend public endpoints wrap the payload as `{ data: … }` (sometimes
 *  with extra root fields) or return it at the root - unwrap both. */
function unwrap<T = Record<string, unknown>>(j: unknown): T | null {
  if (j == null || typeof j !== 'object') return null;
  const o = j as Record<string, unknown>;
  if (o.data != null && typeof o.data === 'object') return o.data as T;
  return o as T;
}

export interface SeoEvent {
  id: string;
  title?: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  eventPhoto?: string;
  eventStatus?: string;
  streamStatus?: string | null;
  hasLiveStream?: boolean | null;
  updatedAt?: string;
}

export interface SeoPhotographer {
  id: string;
  firstName?: string;
  lastName?: string;
  preferredUsername?: string | null;
  about?: string | null;
  professionalPhilosophy?: string | null;
  profilePicture?: string | null;
  coverPicture?: string | null;
  address?: string | null;
  updatedAt?: string;
}

export async function fetchEventForSeo(id: string): Promise<SeoEvent | null> {
  return unwrap<SeoEvent>(await getJson(`/api/remote/public/events/${encodeURIComponent(id)}`));
}

export async function fetchPhotographerForSeo(id: string): Promise<SeoPhotographer | null> {
  return unwrap<SeoPhotographer>(await getJson(`/api/remote/public/photographers/list/${encodeURIComponent(id)}`));
}

function listOf(j: unknown): Record<string, unknown>[] {
  const root = unwrap<Record<string, unknown>>(j) as Record<string, unknown> | null;
  if (!root) return [];
  const c = root.content ?? root.events ?? root.photographers ?? root;
  return Array.isArray(c) ? (c as Record<string, unknown>[]) : [];
}

export async function fetchEventsForSitemap(): Promise<SeoEvent[]> {
  return listOf(await getJson('/api/remote/public/events/list?page=0&size=300')) as unknown as SeoEvent[];
}

export async function fetchPhotographersForSitemap(): Promise<SeoPhotographer[]> {
  return listOf(await getJson('/api/remote/public/photographers/list?page=0&size=300')) as unknown as SeoPhotographer[];
}

// ─── Slug system (V267+) ───────────────────────────────────────────────────
// New canonical URLs are slug-based. Legacy ?id= URLs still work via
// middleware.ts which 301s them to /slug. Pages SSR through these helpers:

export interface SlugResolution {
  id: string;
  slug: string;
  /** Non-null when the inbound slug is historical; caller should 301 here. */
  redirect: string | null;
  type: string;
  title?: string | null;
  description?: string | null;
}

export type SluggableType = 'event' | 'photographer' | 'stream' | 'gallery';

/**
 * Translate a slug to {id, current-slug}. Used by every slug-based page's
 * SSR loader. Returns null if the slug doesn't resolve at all (page should
 * 404). When .redirect is set the slug is historical - caller should
 * server-redirect to the canonical URL to consolidate SEO signal.
 */
export async function resolveSlug(type: SluggableType, slug: string): Promise<SlugResolution | null> {
  const r = await getJson(`/api/remote/public/seo/resolve?type=${encodeURIComponent(type)}&slug=${encodeURIComponent(slug)}`);
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.slug !== 'string') return null;
  return {
    id: o.id,
    slug: o.slug,
    redirect: (o.redirect as string | null | undefined) ?? null,
    type: (o.type as string) || type,
    title: (o.title as string | null | undefined) ?? null,
    description: (o.description as string | null | undefined) ?? null,
  };
}

export interface SeoStream {
  id: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventPhoto?: string;
  streamStatus?: string;
  slug?: string;
  updatedAt?: string;
}

export interface SeoGallery {
  id: string;
  title?: string;
  description?: string | null;
  coverImage?: string | null;
  slug?: string;
  updatedAt?: string;
}

export async function fetchStreamForSeo(id: string): Promise<SeoStream | null> {
  return unwrap<SeoStream>(await getJson(`/api/remote/public/events/${encodeURIComponent(id)}/stream`))
      ?? unwrap<SeoStream>(await getJson(`/api/remote/public/streams/${encodeURIComponent(id)}`));
}

export async function fetchGalleryForSeo(slug: string): Promise<SeoGallery | null> {
  return unwrap<SeoGallery>(await getJson(`/api/public/content/album-by-slug/${encodeURIComponent(slug)}`));
}

export interface SitemapFeed {
  events: string[];
  photographers: string[];
  streams: string[];
  galleries: string[];
}

/** One-shot sitemap data feed - returns every indexable slug grouped by type. */
export async function fetchSitemapFeed(): Promise<SitemapFeed> {
  const r = await getJson('/api/remote/public/seo/sitemap/data');
  const o = (r ?? {}) as Record<string, unknown>;
  const arr = (k: string): string[] => Array.isArray(o[k]) ? (o[k] as unknown[]).filter(x => typeof x === 'string') as string[] : [];
  return { events: arr('events'), photographers: arr('photographers'), streams: arr('streams'), galleries: arr('galleries') };
}

// ─── URL builders ──────────────────────────────────────────────────────────
// Centralised so a future re-org changes one place. All paths are slug-based.

export function eventUrl(slug: string): string {
  return `${SITE_URL}/user/events/${encodeURIComponent(slug)}`;
}
export function livestreamUrl(slug: string): string {
  return `${SITE_URL}/user/events/livestream/${encodeURIComponent(slug)}`;
}
export function photographerUrl(slug: string): string {
  return `${SITE_URL}/photographers/${encodeURIComponent(slug)}`;
}
export function galleryUrl(slug: string): string {
  return `${SITE_URL}/user/browse-photos/${encodeURIComponent(slug)}`;
}

export function photographerDisplayName(p: SeoPhotographer): string {
  const u = (p.preferredUsername || '').trim();
  if (u) return u;
  const full = `${p.firstName || ''} ${p.lastName || ''}`.trim();
  return full || 'Photographer';
}

/**
 * Status-aware event title prefix:
 *   live now              → "Watch Live - <name>"
 *   livestream, upcoming  → "Reserve Spot for Livestreaming - <name>"
 *   completed / ended     → "<name>"  (just the name)
 *   regular, upcoming     → "Book - <name>"
 * The "| Amoria Connekyt" suffix comes from the root metadata title template.
 */
export function eventSeoTitle(ev: SeoEvent): string {
  const name = (ev.title || 'Event').trim();
  const status = (ev.eventStatus || '').toUpperCase();
  const stream = (ev.streamStatus || '').toLowerCase();
  const liveStreaming = ['live', 'started', 'streaming'].includes(stream);
  const hasStream = ev.hasLiveStream === true || liveStreaming || stream === 'ended';

  const isLiveNow = status === 'ONGOING' && stream !== 'ended' && (ev.hasLiveStream === true || liveStreaming);
  if (isLiveNow) return `Watch Live - ${name}`;
  if (status === 'COMPLETED' || stream === 'ended') return name;
  if (hasStream) return `Reserve Spot for Livestreaming - ${name}`;
  return `Book - ${name}`;
}

export function eventSeoDescription(ev: SeoEvent): string {
  if (ev.description && ev.description.trim()) return clamp(ev.description);
  const bits = [
    ev.title,
    ev.eventDate ? `on ${ev.eventDate}` : '',
    ev.location ? `at ${ev.location}` : '',
  ].filter(Boolean).join(' ');
  return clamp(`${bits}. Book or watch live on ${SITE_NAME}.`);
}
