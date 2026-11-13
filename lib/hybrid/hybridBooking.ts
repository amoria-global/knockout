import type { PackageBenchmarkStats } from './offerBrief';
import { getKnockoutApiBase } from './locationSearch';

/**
 * "Post My Event" (hybrid booking) API client for the public website (`knockout`).
 * Uses `/api/proxy/api/remote/*` in production and `NEXT_PUBLIC_API_URL/api/remote/*` in dev,
 * attaching `credentials: 'include'` and `Authorization: Bearer <authToken>` when signed in.
 */

export type PhotographerType = 'FREELANCER' | 'STUDIO' | 'ANY';
export type LocationCoverage = 'SAME_CITY' | 'NEARBY_CITY' | 'ANY';
export type SmartMatchTier = 'PREMIUM' | 'PREFERRED' | 'SUGGESTED' | 'ALTERNATIVE';
export type RecommendationTier = 'HIGH' | 'MEDIUM' | 'LOW' | SmartMatchTier;
export type OpportunityDeliveryPolicy = 'CLIENT' | 'PHOTOGRAPHER_PACKAGE';
export type OpportunityPricingMode = 'CLIENT_OFFER' | 'PACKAGE';

export interface HybridOptions {
  enabled: boolean;
  country: string;
  timezone: string;
  currency: string;
  eventTypes: { id: string; name: string }[];
  photographerSpecialties: { value: string; label: string }[];
  cities: { name: string; latitude: number; longitude: number }[];
  photographerTypes: { value: PhotographerType; label: string; description: string }[];
  coverageOptions: { value: LocationCoverage; label: string; description: string }[];
  budgetPresets: { label: string; min: number | null; max: number | null }[];
  timeStepMinutes: number;
  matchWindowHours: number[];
  defaultMatchWindowHours: number;
  inviteWindowMinutes: number;
  firstBatchSize: number;
  escrowOptions: number[];
  instagramRequired: boolean;
  packageBenchmarks?: PackageBenchmarkStats;
}

export interface MatchPreviewPayload {
  eventDate: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  photographerType?: PhotographerType;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  specialty?: string;
  photographerSpecialty?: string;
  locationCoverage?: LocationCoverage;
  eventId?: string;
  coverageMode?: string;
  clientType?: string;
  editedPhotos?: number;
  shortVideosQty?: number;
  shortVideosDuration?: string;
  longVideosQty?: number;
  longVideosDuration?: string;
  instantUpdates?: boolean;
  digitalDeliveryDays?: number;
  hasLiveStream?: boolean;
  allowWishInvites?: boolean;
  photoBooksQty?: number;
  photoBookSize?: string;
  photoBookPages?: string;
  photoBookPhotos?: number;
  photoAlbumsQty?: number;
  photoAlbumSize?: string;
  photoAlbumPrints?: string;
  wallPortraitsQty?: number;
  wallPortraitSize?: string;
  wallPortraitFrame?: string;
  printProductionTime?: string;
  printProposedDate?: string;
  printCollectionMethod?: string;
  editingStyle?: string;
  usageRights?: string;
}

export interface MatchPreviewResult {
  count: number;
  matchCount: number;
  durationMinutes?: number;
  durationLabel?: string;
  firstBatchSize?: number;
  tierCounts?: Partial<Record<RecommendationTier, number>>;
  breakdown?: {
    total?: number;
    availableOnDate?: number;
    availableForFullEvent?: number;
    withinBudget?: number;
    typeMatched?: number;
    specialtyMatched?: number;
    inCoverage?: number;
    instagramEnriched?: number;
    sameCity?: number;
    nearbyFallback?: boolean;
  };
  packagePriceLow?: number;
  packagePriceRecommended?: number;
  packagePricePriority?: number;
}

export interface MatchRequestPayload {
  title?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  photographerType?: PhotographerType;
  specialty?: string;
  photographerSpecialty?: string;
  locationCoverage?: LocationCoverage;
  expirationHours?: number;
  instructions?: string;
  city?: string;
  country?: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
  hasLiveStream?: boolean;
  allowWishInvites?: boolean;
  minimumPhotos?: number;
  clientType?: string;
  digitalDeliveryDays?: number;
  printDeliveryMethod?: string;
  printDeliveryAddress?: string;
  printProposedDate?: string;
}

export interface HybridDraftPayload {
  eventId?: string;
  title?: string;
  eventType?: string;
  eventCategoryId?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  venue?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  minBudget?: number;
  maxBudget?: number;
  hasLiveStream?: boolean;
  allowWishInvites?: boolean;
  minimumPhotos?: number;
  draftStep?: 1 | 2 | 3 | 4 | 5;
}

export interface HybridDraftResponse {
  id: string;
  title?: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  venue?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  eventStatus?: string;
  bookingStatus?: string;
  isPublished?: boolean;
  updatedAt?: string;
}

export interface CandidateSummary {
  candidateId?: string;
  photographerId: string;
  photographerName: string;
  name: string;
  profilePicture?: string;
  avatar?: string;
  photographerType?: string;
  rating?: number;
  reviewCount?: number;
  distanceKm?: number;
  distanceLabel?: string;
  city?: string;
  sameCity?: boolean;
  typicalPriceRange?: string;
  recommendationTier: RecommendationTier;
  smartTier?: SmartMatchTier;
  matchScore?: number;
  primarySpecialty?: string;
  rank?: number;
  instagramHandle?: string;
  instagramFollowers?: number;
  slug?: string;
  about?: string;
  specialties: string[];
  approvedAt?: string;
  deliveryPolicy?: OpportunityDeliveryPolicy;
  packageDeliveryDays?: number;
  packageDeliveryDescription?: string;
  matchedPackageId?: string;
  matchedPackageName?: string;
  matchedPackagePrice?: number;
  matchedPackageCurrency?: string;
  matchedPackagePhotos?: number;
  matchedPackageVideos?: number;
  matchedPackageHours?: number;
  pricingMode?: OpportunityPricingMode;
  proposedPrice?: number;
  agreedPrice?: number;
}

type Envelope<T> = { action?: number; message?: string; error?: string; data?: T };

export class HybridApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'HybridApiError';
  }
}

const remote = (path: string) => `${getKnockoutApiBase()}/api/remote${path}`;

async function call<T>(path: string, init: RequestInit, fallbackMessage: string): Promise<T | undefined> {
  let res: Response;
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    res = await fetch(remote(path), {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch {
    throw new HybridApiError('Network error. Check your connection and try again.', 0);
  }
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || body?.action !== 1) {
    throw new HybridApiError(body?.message || fallbackMessage, res.status, body?.error);
  }
  return body.data;
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);

let optionsCache: Promise<HybridOptions> | null = null;

export function getHybridOptions(): Promise<HybridOptions> {
  if (!optionsCache) {
    optionsCache = call<HybridOptions>('/public/hybrid/options', { method: 'GET' }, 'Could not load the event options.')
      .then((d) => {
        if (!d) throw new HybridApiError('Could not load the event options.', 500);
        return d;
      })
      .catch((e) => {
        optionsCache = null;
        throw e;
      });
  }
  return optionsCache;
}

export async function previewMatchCount(payload: MatchPreviewPayload): Promise<MatchPreviewResult> {
  const data = await call<Record<string, unknown>>(
    '/events/match-preview',
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not count matching photographers.',
  );
  const count = num(data?.matchCount);
  if (count === undefined) throw new HybridApiError('Could not count matching photographers.', 500);
  return {
    count,
    matchCount: count,
    durationMinutes: num(data?.durationMinutes),
    durationLabel: str(data?.durationLabel),
    firstBatchSize: num(data?.firstBatchSize),
    tierCounts: (data?.tierCounts as MatchPreviewResult['tierCounts']) || undefined,
    breakdown: data?.breakdown as MatchPreviewResult['breakdown'],
    packagePriceLow: num(data?.packagePriceLow),
    packagePriceRecommended: num(data?.packagePriceRecommended),
    packagePricePriority: num(data?.packagePricePriority),
  };
}

export async function getHybridDraft(): Promise<HybridDraftResponse | null> {
  try {
    const d = await call<Record<string, unknown>>(
      '/events/hybrid-draft',
      { method: 'GET' },
      'Could not load event draft.',
    );
    if (!d || !d.id) return null;
    return {
      id: String(d.id),
      title: str(d.title),
      description: str(d.description),
      eventDate: str(d.eventDate),
      startTime: str(d.startTime),
      endTime: str(d.endTime),
      city: str(d.city),
      venue: str(d.venue),
      location: str(d.location),
      minBudget: num(d.minBudget),
      maxBudget: num(d.maxBudget),
      eventStatus: str(d.eventStatus),
      bookingStatus: str(d.bookingStatus),
      isPublished: typeof d.isPublished === 'boolean' ? d.isPublished : false,
      updatedAt: str(d.updatedAt),
    };
  } catch {
    return null;
  }
}

export async function saveHybridDraft(payload: HybridDraftPayload): Promise<HybridDraftResponse | null> {
  const d = await call<Record<string, unknown>>(
    '/events/hybrid-draft',
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not save event draft.',
  );
  if (!d || !d.id) return null;
  return {
    id: String(d.id),
    title: str(d.title),
    description: str(d.description),
    eventDate: str(d.eventDate),
    startTime: str(d.startTime),
    endTime: str(d.endTime),
    city: str(d.city),
    venue: str(d.venue),
    location: str(d.location),
    minBudget: num(d.minBudget),
    maxBudget: num(d.maxBudget),
    eventStatus: str(d.eventStatus),
    bookingStatus: str(d.bookingStatus),
    isPublished: typeof d.isPublished === 'boolean' ? d.isPublished : false,
    updatedAt: str(d.updatedAt),
  };
}

export async function deleteHybridDraft(eventId: string): Promise<void> {
  if (!eventId) return;
  try {
    await call(`/events/hybrid-draft/${encodeURIComponent(eventId)}`, { method: 'DELETE' }, 'Could not delete event draft.');
  } catch {
    // Ignore delete failures on already-deleted drafts
  }
}

export async function publishMatchRequest(
  eventId: string,
  payload: MatchRequestPayload,
): Promise<{ eventId: string; invitedCount?: number; status?: string; alreadyPublished?: boolean }> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/match-request`,
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not post your event to photographers.',
  );
  return {
    eventId,
    invitedCount: num(data?.invitedCount),
    status: str(data?.status),
    alreadyPublished: data?.alreadyPublished === true,
  };
}

export function formatRwf(n?: number | null): string {
  if (n === undefined || n === null) return '';
  return `${Math.round(n).toLocaleString('en-US')} RWF`;
}

export function budgetLabel(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${Math.round(min).toLocaleString('en-US')} - ${formatRwf(max)}`;
  if (max != null) return `Up to ${formatRwf(max)}`;
  return `From ${formatRwf(min)}`;
}

export const hhmm = (t?: string) => (t ? t.slice(0, 5) : '');

export function durationBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins;
}

export function durationText(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hrs = h === 0 ? '' : `${h} ${h === 1 ? 'hr' : 'hrs'}`;
  return m === 0 ? hrs : `${hrs ? hrs + ' ' : ''}${m} min`;
}
