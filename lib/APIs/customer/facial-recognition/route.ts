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
  createdAt?: string;
  alt?: string;
}

export interface FacialRecognitionResponse {
  data: MatchedPhoto[];
}

/**
 * Upload a selfie for facial recognition to find matching photos.
 * Public endpoint — backend resolves the event from the invite code.
 */
export async function uploadSelfieForRecognition(
  inviteCode: string,
  selfieFile: File
): Promise<ApiResponse<FacialRecognitionResponse>> {
  const formData = new FormData();
  formData.append('code', inviteCode);
  formData.append('selfie', selfieFile);

  return apiClient.post<FacialRecognitionResponse>(
    API_ENDPOINTS.PUBLIC.FACE_SEARCH,
    formData,
    { retries: 1, timeout: 60000, skipAuth: true }
  );
}
