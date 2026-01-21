/**
 * Join Event API
 * POST /api/remote/events/:id/join
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Event } from '../get-events/route';

export interface JoinEventRequest {
  eventId: string;
  attendeeInfo?: {
    specialRequirements?: string;
    numberOfGuests?: number;
  };
}

export interface JoinEventResponse {
  success: boolean;
  message: string;
  registrationId: string;
  event: Event;
}

/**
 * Join Event
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function joinEvent(data: JoinEventRequest): Promise<ApiResponse<JoinEventResponse>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required to join events',
    };
  }

  const { eventId, attendeeInfo } = data;

  const response = await apiClient.post<JoinEventResponse>(
    `${API_ENDPOINTS.LEGACY.EVENTS}/${eventId}/join`,
    attendeeInfo || {},
    {
      retries: 1, // Less retries for write operations
    }
  );

  return response;
}
