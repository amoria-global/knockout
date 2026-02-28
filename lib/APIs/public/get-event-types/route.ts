/**
 * Get Event Types API
 * GET /api/remote/public/event-types
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface EventType {
  id: string;
  name: string;
}

export type GetEventTypesResponse = EventType[];

/**
 * Get all available event types (public, no auth required)
 */
export async function getEventTypes(): Promise<ApiResponse<GetEventTypesResponse>> {
  return apiClient.get<GetEventTypesResponse>(
    API_ENDPOINTS.PUBLIC.EVENT_TYPES,
    { skipAuth: true, retries: 2 }
  );
}
