/**
 * Create Event API
 * POST /api/remote/events
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

export interface CreateEventRequest {
  title: string;
  description: string;
  eventType: string;
  date: string;
  time: string;
  location?: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  isVirtual: boolean;
  virtualLink?: string;
  coverImage?: string;
  price?: number;
  maxAttendees?: number;
  tags?: string[];
}

/**
 * Create Event
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function createEvent(data: CreateEventRequest): Promise<ApiResponse<Event>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required to create events',
    };
  }

  const response = await apiClient.post<Event>(
    API_ENDPOINTS.LEGACY.EVENTS,
    data,
    {
      retries: 1, // Less retries for write operations
    }
  );

  return response;
}
