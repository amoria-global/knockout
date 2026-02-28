/**
 * Facial Recognition API
 * POST /api/remote/customer/events/facial-recognition
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
 * Upload a selfie for facial recognition to find matching photos
 */
export async function uploadSelfieForRecognition(
  inviteCode: string,
  selfieFile: File
): Promise<ApiResponse<FacialRecognitionResponse>> {
  const formData = new FormData();
  formData.append('inviteCode', inviteCode);
  formData.append('selfie', selfieFile);

  return apiClient.post<FacialRecognitionResponse>(
    API_ENDPOINTS.CUSTOMER.FACIAL_RECOGNITION,
    formData,
    { retries: 1, timeout: 60000 }
  );
}
