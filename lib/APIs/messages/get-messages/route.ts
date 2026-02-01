/**
 * Get Messages API
 * GET /api/remote/messages/conversations/:id/messages
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
import type { Message } from '../send-message/route';

export interface GetMessagesRequest {
  conversationId: string;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
}

export interface GetMessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Get Messages in Conversation
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function getMessages(params: GetMessagesRequest): Promise<ApiResponse<GetMessagesResponse>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required',
    };
  }

  const { conversationId, ...queryParams } = params;
  const query = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.LEGACY.MESSAGES}/conversations/${conversationId}/messages?${queryString}`
    : `${API_ENDPOINTS.LEGACY.MESSAGES}/conversations/${conversationId}/messages`;

  const response = await apiClient.get<GetMessagesResponse>(endpoint, {
    retries: 2,
  });

  return response;
}
