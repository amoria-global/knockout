/**
 * Join Event API
 * POST /api/remote/events/:id/join
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';
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
 */
export async function joinEvent(data: JoinEventRequest) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required to join events',
    };
  }

  const { eventId, attendeeInfo } = data;

  const response = await apiRequest<JoinEventResponse>(
    `${API_ENDPOINTS.EVENTS}/${eventId}/join`,
    {
      method: 'POST',
      body: attendeeInfo || {},
      token,
    }
  );

  return response;
}
