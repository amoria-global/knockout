/**
 * Publish Event API Route
 * POST /api/remote/customer/events/{eventId}/publish
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

/**
 * Publish an event (requires authentication)
 */
export async function publishEvent(
  eventId: string
): Promise<ApiResponse<Record<string, unknown>>> {
  const endpoint = API_ENDPOINTS.CUSTOMER.EVENTS_PUBLISH(eventId);

  const response = await apiClient.post<Record<string, unknown>>(endpoint, undefined, {
    retries: 1,
  });

  return response;
}
