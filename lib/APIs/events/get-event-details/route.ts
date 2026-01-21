/**
 * Get Event Details API
 * GET /api/remote/events/:id
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

export interface GetEventDetailsResponse {
  event: Event;
  isRegistered: boolean;
  registrationDetails?: {
    registrationId: string;
    registeredAt: string;
  };
}

/**
 * Get Event Details
 * Uses enhanced API client with automatic retry and error handling
 * Includes registration status if user is authenticated
 */
export async function getEventDetails(eventId: string): Promise<ApiResponse<GetEventDetailsResponse>> {
  const response = await apiClient.get<GetEventDetailsResponse>(
    `${API_ENDPOINTS.LEGACY.EVENTS}/${eventId}`,
    {
      // Skip auth only if user is not authenticated (public access allowed)
      skipAuth: !isAuthenticated(),
      retries: 2,
    }
  );

  return response;
}
