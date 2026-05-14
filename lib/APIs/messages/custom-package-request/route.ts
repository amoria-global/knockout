/**
 * Custom Package Request API
 *
 * POST /api/remote/chat/custom-package-request
 *
 * Used by the booking wizard's "Custom package" path. Sends the client's
 * proposed budget + photo/video counts + notes to the backend, which
 * formats them into a chat message and seeds the conversation with the
 * photographer. After it succeeds the wizard redirects the client to the
 * dashboard inbox for that photographer so they can negotiate live.
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface CustomPackageRequestPayload {
  photographerId: string;
  proposedPrice: number;
  /** Currency abbreviation (e.g. "RWF", "USD"). Defaults to RWF server-side if omitted. */
  currencyCode?: string;
  photoCount: number;
  videoCount: number;
  notes?: string;
}

export interface CustomPackageRequestResponse {
  action: number;
  message: string;
  data?: {
    photographerId: string;
    messageId?: string;
  };
}

export async function sendCustomPackageRequest(
  payload: CustomPackageRequestPayload
): Promise<ApiResponse<CustomPackageRequestResponse>> {
  return apiClient.post<CustomPackageRequestResponse>(
    API_ENDPOINTS.CHAT.CUSTOM_PACKAGE_REQUEST,
    payload,
    { retries: 1 }
  );
}
