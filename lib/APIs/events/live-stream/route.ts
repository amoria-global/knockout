/**
 * Live Stream APIs
 * GET /api/remote/events/:id/live-stream
 * POST /api/remote/events/:id/start-stream
 * POST /api/remote/events/:id/end-stream
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';

export interface LiveStreamInfo {
  streamId: string;
  streamUrl: string;
  chatRoomId: string;
  status: 'waiting' | 'live' | 'ended';
  viewers: number;
  startedAt?: string;
}

/**
 * Get Live Stream Info
 */
export async function getLiveStreamInfo(eventId: string) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required to access live streams',
    };
  }

  const response = await apiRequest<LiveStreamInfo>(
    `${API_ENDPOINTS.EVENTS}/${eventId}/live-stream`,
    {
      method: 'GET',
      token,
    }
  );

  return response;
}

/**
 * Start Live Stream
 */
export async function startLiveStream(eventId: string) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required to start live streams',
    };
  }

  const response = await apiRequest<LiveStreamInfo>(
    `${API_ENDPOINTS.EVENTS}/${eventId}/start-stream`,
    {
      method: 'POST',
      token,
    }
  );

  return response;
}

/**
 * End Live Stream
 */
export async function endLiveStream(eventId: string) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required to end live streams',
    };
  }

  const response = await apiRequest(
    `${API_ENDPOINTS.EVENTS}/${eventId}/end-stream`,
    {
      method: 'POST',
      token,
    }
  );

  return response;
}
