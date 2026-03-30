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
