/**
 * Confirm Event Completion API
 * POST /api/remote/customer/events/{id}/confirm-completion
 */

import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface ConfirmCompletionResponse {
  action: number;
  message: string;
}

/**
 * Confirm completion of an event by ID
 */
export async function confirmCompletion(eventId: string): Promise<ApiResponse<ConfirmCompletionResponse>> {
  return apiClient.post<ConfirmCompletionResponse>(
    `/api/remote/customer/events/${eventId}/confirm-completion`,
    undefined,
    { retries: 2 }
  );
}
