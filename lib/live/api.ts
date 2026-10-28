/**
 * Wishes API. Public: GET /public/events/{id}/wishes, POST /public/events/{id}/wishes[/video], POST .../{wishId}/hide.
 * Host: GET /photographer/events/{id}/wishes and PUT .../{wishId}/moderation (these take the signed-in fetcher).
 * Every call checks `action`: HTTP 200 with action 0 is a refusal.
 */
import { wishErrorMessage } from './composer';
import type { Wish, WishPage, WishStatus, WishVisibility } from './types';

type Raw = Record<string, unknown>;
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** The same base the rest of the site uses: the proxy in production, the backend directly in development. */
export function apiBase(): string {
  return typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? '/api/proxy'
    : process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
}

const text = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);

export function mapWish(r: Raw): Wish {
  const status = String(r.status ?? '').toLowerCase();
  const seconds = Number(r.duration);
  return {
    id: String(r.id ?? ''),
    type: r.type === 'VIDEO' ? 'video' : 'text',
    authorName: text(r.authorName) ?? 'Guest',
    message: typeof r.message === 'string' ? r.message : '',
    videoUrl: text(r.videoUrl),
    thumbnailUrl: text(r.thumbnailUrl),
    durationSeconds: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : undefined,
    visibility: String(r.visibility ?? '').toLowerCase() === 'public' ? 'public' : 'private',
    status: status === 'approved' || status === 'hidden' ? (status as WishStatus) : 'pending',
    createdAt: text(r.createdAt),
    mine: r.mine === true,
  };
}

async function envelope(res: Response, fallback: string): Promise<Raw> {
  const body = (await res.json().catch(() => ({}))) as Raw;
  if (!res.ok || body.action === 0) throw new Error(typeof body.message === 'string' && body.message ? body.message : fallback);
  return body;
}

const eid = encodeURIComponent;

/** Approved public wishes, newest first. `fingerprint` only flags the caller's own wishes. */
export async function listWishes(eventId: string, fingerprint: string, page = 0, size = 20, f: Fetcher = fetch): Promise<WishPage> {
  const res = await f(`${apiBase()}/api/remote/public/events/${eid(eventId)}/wishes?page=${page}&size=${size}&deviceFingerprint=${eid(fingerprint)}`);
  const d = ((await envelope(res, 'Could not load the wishes.')).data ?? {}) as Raw;
  return {
    items: (Array.isArray(d.items) ? (d.items as Raw[]) : []).map(mapWish).filter((w) => w.id),
    page: Number(d.page) || 0,
    totalPages: Number(d.totalPages) || 0,
    total: Number(d.total) || 0,
    allowWishInvites: typeof d.allowWishInvites === 'boolean' ? d.allowWishInvites : undefined,
  };
}

export async function hideOwnWish(eventId: string, wishId: string, fingerprint: string, f: Fetcher = fetch): Promise<void> {
  const res = await f(`${apiBase()}/api/remote/public/events/${eid(eventId)}/wishes/${eid(wishId)}/hide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceFingerprint: fingerprint }),
  });
  await envelope(res, 'Could not hide this wish.');
}

export async function sendTextWish(
  eventId: string,
  data: { name: string; email: string; message: string; visibility: WishVisibility; fingerprint: string },
  f: Fetcher = fetch,
): Promise<void> {
  const res = await f(`${apiBase()}/api/remote/public/events/${eid(eventId)}/wishes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: data.name, email: data.email, message: data.message, visibility: data.visibility, deviceFingerprint: data.fingerprint }),
  });
  const body = (await res.json().catch(() => ({}))) as Raw;
  if (!res.ok || body.action !== 1) throw new Error(wishErrorMessage(text(body.message), 'text'));
}

export async function sendVideoWish(
  eventId: string,
  data: { name: string; email: string; message?: string; visibility: WishVisibility; durationSeconds?: number; video: Blob; fingerprint: string },
  f: Fetcher = fetch,
): Promise<void> {
  const form = new FormData();
  form.append('name', data.name);
  form.append('email', data.email);
  form.append('video', new File([data.video], `wish-${Date.now()}.webm`, { type: data.video.type || 'video/webm' }));
  form.append('deviceFingerprint', data.fingerprint);
  form.append('visibility', data.visibility);
  if (data.durationSeconds && data.durationSeconds > 0) form.append('duration', String(Math.ceil(data.durationSeconds)));
  if (data.message?.trim()) form.append('message', data.message.trim());
  const res = await f(`${apiBase()}/api/remote/public/events/${eid(eventId)}/wishes/video`, { method: 'POST', body: form });
  const body = (await res.json().catch(() => ({}))) as Raw;
  if (!res.ok || body.action !== 1) throw new Error(wishErrorMessage(text(body.message), 'video'));
}

export async function listHostWishes(eventId: string, f: Fetcher): Promise<Wish[]> {
  const res = await f(`${apiBase()}/api/remote/photographer/events/${eid(eventId)}/wishes`);
  const body = await envelope(res, 'Could not load the wishes.');
  return (Array.isArray(body.data) ? (body.data as Raw[]) : []).map(mapWish).filter((w) => w.id);
}

export async function moderateWish(eventId: string, wishId: string, status: 'approved' | 'hidden', f: Fetcher): Promise<Wish> {
  const res = await f(`${apiBase()}/api/remote/photographer/events/${eid(eventId)}/wishes/${eid(wishId)}/moderation`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: status.toUpperCase() }),
  });
  return mapWish(((await envelope(res, 'Could not update this wish.')).data ?? {}) as Raw);
}
