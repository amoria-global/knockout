/**
 * Get Event Details API
 * GET /api/remote/events/:id
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';
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
 */
export async function getEventDetails(eventId: string) {
  const token = getAuthToken();

  const response = await apiRequest<GetEventDetailsResponse>(
    `${API_ENDPOINTS.EVENTS}/${eventId}`,
    {
      method: 'GET',
      token: token || undefined,
    }
  );

  return response;
}
