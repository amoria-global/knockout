/**
 * Facial Recognition API (Public)
 * POST /api/remote/public/face-search
 * No authentication required — resolves event from invite code
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface MatchedPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  eventId?: string;
  eventTitle?: string;
  photographerId?: string;
  photographerName?: string;
  pricePerImage?: number;
  createdAt?: string;
  alt?: string;
  isPurchased?: boolean;  // Indicates if user has purchased this photo (for PAID albums)
  albumId?: string;
  albumType?: 'paid' | 'free';
  currencyAbbreviation?: string;
  currencyId?: string;
}

export interface FacialRecognitionResponse {
  data: MatchedPhoto[];
}

/**
 * Upload a selfie for facial recognition to find matching photos.
 * Public endpoint — backend resolves the event from the invite code.
 * When inviteCode is empty, searches across all event albums (pending backend support).
 */
export async function uploadSelfieForRecognition(
  inviteCode: string,
  selfieFile: File,
  options?: { refid?: string; buyerId?: string }
): Promise<ApiResponse<FacialRecognitionResponse>> {
  const formData = new FormData();
  if (inviteCode.trim()) {
    formData.append('code', inviteCode.trim());
  }
  formData.append('selfie', selfieFile);

  const params = new URLSearchParams();
  if (options?.buyerId) params.set('buyerId', options.buyerId);
  if (options?.refid) params.set('refid', options.refid);
  const qs = params.toString();
  const url = qs ? `${API_ENDPOINTS.PUBLIC.FACE_SEARCH}?${qs}` : API_ENDPOINTS.PUBLIC.FACE_SEARCH;

  return apiClient.post<FacialRecognitionResponse>(
    url,
    formData,
    { retries: 1, timeout: 60000, skipAuth: true }
  );
}
