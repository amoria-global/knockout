/**
 * Create Event API
 * POST /api/remote/events
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';
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
 */
export async function createEvent(data: CreateEventRequest) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required to create events',
    };
  }

  const response = await apiRequest<Event>(API_ENDPOINTS.EVENTS, {
    method: 'POST',
    body: data,
    token,
  });

  return response;
}
