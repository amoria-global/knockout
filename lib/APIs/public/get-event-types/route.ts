/**
 * Event Types API
 * GET /api/remote/public/event-types
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface EventType {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface GetEventTypesResponse {
  action: number;
  message: string;
  data: EventType[];
}

/**
 * Get all active event types/categories
 */
export async function getEventTypes(): Promise<ApiResponse<GetEventTypesResponse>> {
  return apiClient.get<GetEventTypesResponse>(
    API_ENDPOINTS.PUBLIC.EVENT_TYPES,
    { retries: 2 }
  );
}