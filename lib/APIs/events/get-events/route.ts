/**
 * Get All Events API
 * GET /api/remote/events
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

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
 */
export async function getEvents(params?: GetEventsRequest) {
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
    ? `${API_ENDPOINTS.EVENTS}?${queryString}`
    : API_ENDPOINTS.EVENTS;

  const response = await apiRequest<GetEventsResponse>(endpoint, {
    method: 'GET',
  });

  return response;
}
