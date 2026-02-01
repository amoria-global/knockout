/**
 * Get All Events API
 * GET /api/remote/events
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface Event {
  id: string;
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
  currentAttendees: number;
  organizerId: string;
  organizerName: string;
  organizerImage?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GetEventsRequest {
  page?: number;
  limit?: number;
  search?: string;
  eventType?: string;
  isVirtual?: boolean;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetEventsResponse {
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Get All Events (with filters)
 * Uses enhanced API client with automatic retry and error handling
 */
export async function getEvents(params?: GetEventsRequest): Promise<ApiResponse<GetEventsResponse>> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.LEGACY.EVENTS}?${queryString}`
    : API_ENDPOINTS.LEGACY.EVENTS;

  const response = await apiClient.get<GetEventsResponse>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  return response;
}
