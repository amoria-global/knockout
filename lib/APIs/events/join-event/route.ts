/**
 * Join Event API
 * POST /api/remote/customer/events/join
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface JoinEventRequest {
  eventId: string;
  packageType?: string;
  numberOfPeople?: number;
}

export interface JoinEventResponse {
  action: number;
  message: string;
  data?: {
    id: string;
    eventId: string;
    status: string;
  };
}

/**
 * Join an event
 */
export async function joinEvent(data: JoinEventRequest): Promise<ApiResponse<JoinEventResponse>> {
  return apiClient.post<JoinEventResponse>(
    API_ENDPOINTS.CUSTOMER.EVENTS_JOIN,
    data,
    { retries: 2 }
  );
}
