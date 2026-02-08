/**
 * Confirm Event Completion API Route
 * POST /api/remote/customer/events/{eventId}/confirm-completion
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

/**
 * Confirm completion of an event (requires authentication)
 */
export async function confirmEventCompletion(
  eventId: string
): Promise<ApiResponse<Record<string, unknown>>> {
  const endpoint = API_ENDPOINTS.CUSTOMER.EVENTS_CONFIRM_COMPLETION(eventId);

  const response = await apiClient.post<Record<string, unknown>>(endpoint, undefined, {
    retries: 1,
  });

  return response;
}
