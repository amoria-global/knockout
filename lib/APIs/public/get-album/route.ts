/**
 * Public Album API
 * GET /api/remote/public/albums?code={inviteCode}
 * No authentication required — open to all visitors with a valid invite code
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface AlbumPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

export interface AlbumData {
  albumId: string;
  title: string;
  photos: AlbumPhoto[];
}

/**
 * Fetch all photos in a published album by invite code.
 * Public endpoint — no auth needed.
 */
export async function getAlbumByCode(inviteCode: string): Promise<ApiResponse<AlbumData>> {
  return apiClient.get<AlbumData>(
    `${API_ENDPOINTS.PUBLIC.ALBUM_BY_CODE}?code=${encodeURIComponent(inviteCode)}`,
    { retries: 1, skipAuth: true }
  );
}
