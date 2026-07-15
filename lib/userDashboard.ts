/**
 * Data for the User (consumer) dashboard.
 *
 * Mirrors the mobile `features/library/api.ts` + `features/analytics/api.ts`
 * against the same customer-scoped backend endpoints, so the web and app
 * dashboards show identical content:
 *   • Photos / Archives → GET /api/remote/customer/albums
 *   • Streams / watches → GET /api/remote/customer/streams
 *   • Recent payments   → GET /api/remote/customer/payments/pending
 *   • Snapshot          → GET /api/remote/customer/analytics
 * Everything maps defensively and returns safe empties on failure.
 */
import apiClient from '@/lib/api/client';

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);

// ────── Purchased / archived albums ──────────────────────────────────────

export type DashAlbum = {
  id: string;
  title: string;
  thumbnail?: string;
  photographer?: string;
  photoCount: number;
  date?: string;
  locked: boolean;
  archived: boolean;
  eventId?: string;
};

function mapAlbum(r: Raw): DashAlbum {
  return {
    id: String(r.id ?? ''),
    title: str(r.title) ?? 'Album',
    thumbnail: str(r.thumbnail) ?? str(r.coverImage),
    photographer: str(r.photographer),
    photoCount: num(r.photoCount) ?? 0,
    date: str(r.receivedDate) ?? str(r.date),
    locked: r.isLocked === true || r.locked === true,
    archived: r.isArchived === true || r.archived === true,
    eventId: str(r.eventId),
  };
}

export async function getPurchasedAlbums(): Promise<DashAlbum[]> {
  try {
    const res = await apiClient.get<Raw[]>('/api/remote/customer/albums');
    const data = Array.isArray(res?.data) ? res.data : [];
    return data.map(mapAlbum).filter((a) => a.id);
  } catch {
    return [];
  }
}

// ────── Completed streams (purchased access / watch history) ─────────────

export type DashStream = {
  id: string;
  eventId?: string;
  title: string;
  photographer?: string;
  coverImage?: string;
  date?: string;
  duration?: string;
  replayUrl?: string;
  peakViewers: number;
};

function mapStream(r: Raw): DashStream {
  return {
    id: String(r.id ?? ''),
    eventId: str(r.eventId),
    title: str(r.streamTitle) ?? str(r.eventTitle) ?? 'Live stream',
    photographer: str(r.photographerName),
    coverImage: str(r.coverImage),
    date: str(r.streamDate),
    duration: str(r.duration),
    replayUrl: str(r.replayUrl) || undefined,
    peakViewers: num(r.peakViewers) ?? 0,
  };
}

export async function getCompletedStreams(): Promise<DashStream[]> {
  try {
    const res = await apiClient.get<Raw[]>('/api/remote/customer/streams');
    const data = Array.isArray(res?.data) ? res.data : [];
    return data.map(mapStream).filter((s) => s.id);
  } catch {
    return [];
  }
}

// ────── Pending payments ─────────────────────────────────────────────────

export type DashPending = {
  id: string;
  eventName: string;
  photographerName?: string;
  amount: number;
  paidAmount: number;
  currency?: string;
  status: 'pending' | 'failed' | 'partially_paid';
};

function mapPending(r: Raw): DashPending {
  const rawStatus = (str(r.status) ?? '').toUpperCase();
  const status: DashPending['status'] =
    rawStatus === 'FAILED' ? 'failed' : rawStatus === 'PARTIAL' ? 'partially_paid' : 'pending';
  return {
    id: String(r.id ?? ''),
    eventName: str(r.eventTitle) ?? str(r.eventName) ?? 'Event',
    photographerName: str(r.photographerName),
    amount: num(r.amountInUsd) ?? num(r.amount) ?? 0,
    paidAmount: num(r.paidAmountInUsd) ?? num(r.paidAmount) ?? 0,
    currency: str(r.currency) ?? str(r.currencyAbbreviation),
    status,
  };
}

export async function getPendingPayments(): Promise<DashPending[]> {
  try {
    const res = await apiClient.get<Raw[]>('/api/remote/customer/payments/pending');
    const data = Array.isArray(res?.data) ? res.data : [];
    return data.map(mapPending).filter((p) => p.id);
  } catch {
    return [];
  }
}

// ────── Snapshot analytics ───────────────────────────────────────────────

export type DashAnalytics = {
  totalSpent: number;
  totalPhotos: number;
  totalBookings: number;
  totalEvents: number;
};

export async function getAnalytics(): Promise<DashAnalytics> {
  try {
    const res = await apiClient.get<Raw>('/api/remote/customer/analytics');
    const d = (res?.data ?? {}) as Raw;
    return {
      totalSpent: num(d.totalSpent) ?? 0,
      totalPhotos: num(d.totalPhotos) ?? 0,
      totalBookings: num(d.totalBookings) ?? 0,
      totalEvents: num(d.totalEvents) ?? 0,
    };
  } catch {
    return { totalSpent: 0, totalPhotos: 0, totalBookings: 0, totalEvents: 0 };
  }
}
