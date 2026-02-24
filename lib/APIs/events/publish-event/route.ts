/**
 * Publish Event API
 * POST /api/remote/customer/events/{id}/publish
 */

import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface PublishEventResponse {
  action: number;
  message: string;
}

/**
 * Publish an event by ID
 */
export async function publishEvent(eventId: string): Promise<ApiResponse<PublishEventResponse>> {
  return apiClient.post<PublishEventResponse>(
    `/api/remote/customer/events/${eventId}/publish`,
    undefined,
    { retries: 2 }
  );
}
