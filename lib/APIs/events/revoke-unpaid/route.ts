/**
 * Revoke Unpaid Event API
 * POST /api/remote/customer/events/{id}/revoke-unpaid
 */

import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface RevokeUnpaidResponse {
  action: number;
  message: string;
}

/**
 * Revoke an unpaid event (payment failed in booking wizard)
 */
export async function revokeUnpaidEvent(eventId: string): Promise<ApiResponse<RevokeUnpaidResponse>> {
  return apiClient.post<RevokeUnpaidResponse>(
    `/api/remote/customer/events/${eventId}/revoke-unpaid`,
    undefined,
    { retries: 1 }
  );
}
