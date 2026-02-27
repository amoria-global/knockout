/**
 * Facial Recognition & Invite Code APIs
 * POST /api/remote/customer/events/validate-invite-code
 * POST /api/remote/customer/events/facial-recognition-match
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// --- Validate Invite Code ---

export interface ValidateInviteCodeResponse {
  action: number;
  message: string;
  data?: {
    eventId: string;
    eventTitle: string;
  };
}

/**
 * Validate an invite code and return the associated event
 */
export async function validateInviteCode(inviteCode: string): Promise<ApiResponse<ValidateInviteCodeResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  const queryParams = new URLSearchParams({ inviteCode });
  return apiClient.post<ValidateInviteCodeResponse>(
    `${API_ENDPOINTS.CUSTOMER.VALIDATE_INVITE_CODE}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}

// --- Facial Recognition Match ---

export interface FacialRecognitionMatchResponse {
  action: number;
  message: string;
  data?: {
    eventId: string;
    matchedPhotos: Array<{
      id: string;
      url: string;
      thumbnailUrl?: string;
      alt?: string;
    }>;
    totalMatches: number;
  };
}

/**
 * Submit a selfie image + invite code for facial recognition matching
 */
export async function facialRecognitionMatch(image: File, inviteCode: string): Promise<ApiResponse<FacialRecognitionMatchResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  const formData = new FormData();
  formData.append('image', image);
  formData.append('inviteCode', inviteCode);

  return apiClient.post<FacialRecognitionMatchResponse>(
    API_ENDPOINTS.CUSTOMER.FACIAL_RECOGNITION_MATCH,
    formData,
    { retries: 0, timeout: 60000 }
  );
}
