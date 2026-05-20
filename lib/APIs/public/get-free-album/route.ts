/**
 * FREE Album Photos API
 * GET /api/remote/public/albums/free/{albumId}
 * Authentication required (Viewer account created during OTP verification)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface FreeAlbumPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  sortOrder: number;
  createdAt: string;
  isFree: boolean;
}

export interface FreeAlbumData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  coverImage?: string;
  expiresAt?: string;
  albumType: string;
  photoCount: number;
  photographerName?: string;
  photos: FreeAlbumPhoto[];
  // Capped free album: first `maxFreeDownloads` selected are free, the
  // rest cost `pricePerExtraImage` each (paid via the existing paid-album
  // flow). `capped` true means the photographer has configured a cap and/or
  // a per-extra price; the access link itself stays reusable across visits.
  capped?: boolean;
  maxFreeDownloads?: number | null;
  pricePerExtraImage?: number | null;
  currencyId?: string;
  currencyAbbreviation?: string;
  currencySymbol?: string;
  // Photos this viewer has already free-downloaded (cumulative) or paid
  // for. Frontend marks them OWNED — free to re-download, excluded from
  // cap counting and from the pay-for-extras total.
  alreadyAcquiredPhotoIds?: string[];
}

/**
 * Get FREE album photos after successful OTP verification.
 * Returns all photos with download URLs (all free, no payment required).
 * Requires authentication via session cookie (set during OTP verification).
 */
export async function getFreeAlbum(
  albumId: string
): Promise<ApiResponse<FreeAlbumData>> {
  // No headers needed - session cookie sent automatically

  const response = await apiClient.get<FreeAlbumData>(
    API_ENDPOINTS.PUBLIC.FREE_ALBUM_GET(albumId),
    {
      retries: 1,
      skipAuth: false,  // Require auth for FREE albums (via session cookie)
      credentials: 'include'  // CRITICAL: Include cookies in cross-origin requests
    }
  );

  // Handle wrapped { action, data } response
  if (response.success && response.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = response.data as any;
    if (raw?.data && typeof raw.data === 'object') {
      response.data = raw.data as FreeAlbumData;
    }
  }

  return response;
}

/** Persist the client's photo selection (so a regenerated grant is
 *  scoped to exactly these). Capped albums only; no-op otherwise. */
export async function selectFreeAlbumPhotos(albumId: string, photoIds: string[]) {
  return apiClient.post(
    `/api/remote/public/albums/free/${albumId}/select`,
    { photoIds },
    { retries: 1, skipAuth: false, credentials: 'include' }
  );
}

/** Consume the one-time grant after a completed bulk download. */
export async function consumeFreeAlbumGrant(albumId: string) {
  return apiClient.post(
    `/api/remote/public/albums/free/${albumId}/consume`,
    {},
    { retries: 1, skipAuth: false, credentials: 'include' }
  );
}

/**
 * Cumulative download log for capped free albums. Posts the IDs the viewer
 * just downloaded so the next visit shows them as OWNED. Idempotent — the
 * backend UNIONs into AlbumAccessGrant.selectedPhotoIds.
 */
export async function logFreeAlbumDownload(albumId: string, photoIds: string[]) {
  return apiClient.post(
    `/api/remote/public/albums/free/${albumId}/log-download`,
    { photoIds },
    { retries: 1, skipAuth: false, credentials: 'include' }
  );
}
