/**
 * Live Stream APIs
 * GET /api/remote/events/:id/live-stream
 * POST /api/remote/events/:id/start-stream
 * POST /api/remote/events/:id/end-stream
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
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function getLiveStreamInfo(eventId: string): Promise<ApiResponse<LiveStreamInfo>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required to access live streams',
    };
  }

  const response = await apiClient.get<LiveStreamInfo>(
    `${API_ENDPOINTS.LEGACY.EVENTS}/${eventId}/live-stream`,
    {
      retries: 2,
    }
  );

  return response;
}

/**
 * Start Live Stream
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function startLiveStream(eventId: string): Promise<ApiResponse<LiveStreamInfo>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required to start live streams',
    };
  }

  const response = await apiClient.post<LiveStreamInfo>(
    `${API_ENDPOINTS.LEGACY.EVENTS}/${eventId}/start-stream`,
    undefined,
    {
      retries: 1, // Less retries for write operations
    }
  );

  return response;
}

/**
 * End Live Stream
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function endLiveStream(eventId: string): Promise<ApiResponse<void>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required to end live streams',
    };
  }

  const response = await apiClient.post<void>(
    `${API_ENDPOINTS.LEGACY.EVENTS}/${eventId}/end-stream`,
    undefined,
    {
      retries: 1, // Less retries for write operations
    }
  );

  return response;
}
