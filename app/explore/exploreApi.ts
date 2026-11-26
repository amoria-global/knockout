/**
 * Explore API client. Every call answers with the usual envelope, and an HTTP 200 with action 0 is a failure, so each
 * helper checks `action` before it trusts `data`.
 */

export const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://backend.connekyt.com").replace(/\/$/, "");

export interface ExploreItem {
  id: string;
  albumId: string;
  mediaType: "PHOTO" | "VIDEO";
  title: string | null;
  category: string | null;
  categoryLabel: string | null;
  creator: { id: string; name: string; logo: string | null };
  thumbnailUrl: string | null;
  previewUrl: string | null;
  srcset: Record<string, string | null>;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  durationSeconds?: number;
  previewClipSeconds?: number;
  previewVideoUrl?: string;
  previewIframeUrl?: string;
  price: { listing: number; listingCurrency: string | null; amount: number | null; currency: string };
  tags: string[];
  licence: string;
}

export interface Facets {
  categories: { name: string; label: string; count: number; clips: number }[];
  tags: { name: string; count: number }[];
  total: number;
  clips: number;
  viewerCurrency: string;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface FeedQuery {
  q?: string;
  category?: string;
  type?: "" | "PHOTO" | "VIDEO";
  minPrice?: string;
  maxPrice?: string;
  tag?: string;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
  currency: string;
  cursor?: string | null;
  size?: number;
}

export interface QuoteGroup { albumId: string; photoIds: string[]; amount: number; currencyId: string }
export interface Quote {
  lines: { id: string; title: string | null; mediaType: string; thumbnailUrl: string | null; price: number }[];
  groups: QuoteGroup[];
  unavailable: string[];
  total: number;
  currency: string | null;
}

export interface UnlockedItem {
  id: string;
  mediaType: "PHOTO" | "VIDEO";
  title: string | null;
  thumbnailUrl: string | null;
  viewUrl?: string;
  downloadUrl?: string;
}
export interface Unlocked { refid: string; items: UnlockedItem[]; zipUrl: string }

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let body: { action?: number; data?: T; message?: string } | null = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok || !body || body.action !== 1) {
    const err = new Error(body?.message || `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return body.data as T;
}

export function feedUrl(q: FeedQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.category) p.set("category", q.category);
  if (q.type) p.set("type", q.type);
  if (q.minPrice) p.set("minPrice", q.minPrice);
  if (q.maxPrice) p.set("maxPrice", q.maxPrice);
  if (q.tag) p.append("tag", q.tag);
  p.set("sort", q.sort || "newest");
  p.set("currency", q.currency);
  p.set("size", String(q.size || 24));
  if (q.cursor) p.set("cursor", q.cursor);
  return `${BACKEND_BASE}/api/public/explore/feed?${p.toString()}`;
}

export const fetchFeed = (q: FeedQuery, signal?: AbortSignal) =>
  call<{ items: ExploreItem[]; nextCursor: string | null; viewerCurrency: string }>(feedUrl(q), { signal });

export const fetchItem = (id: string, currency: string) =>
  call<ExploreItem>(`${BACKEND_BASE}/api/public/explore/items/${encodeURIComponent(id)}?currency=${encodeURIComponent(currency)}`);

export const fetchFacets = (currency: string) =>
  call<Facets>(`${BACKEND_BASE}/api/public/explore/facets?currency=${encodeURIComponent(currency)}`);

export const fetchQuote = (items: string[], currency: string) =>
  call<Quote>(`${BACKEND_BASE}/api/public/explore/cart/quote`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, currency }),
  });

export const unlockByCode = (code: string) =>
  call<Unlocked>(`${BACKEND_BASE}/api/public/content/unlock`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
  });

export const recoverByEmail = (email: string) =>
  call<unknown>(`${BACKEND_BASE}/api/public/content/recover`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
  });

/** Format a price the way the rest of the product does: whole units for RWF-like currencies, cents for the rest. */
export function money(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "";
  const cents = ["USD", "EUR", "GBP"].includes(currency);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency", currency, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en")}`;
  }
}

export function clock(seconds?: number): string {
  if (!seconds || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
