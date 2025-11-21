/**
 * Get Messages API
 * GET /api/remote/messages/conversations/:id/messages
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';
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
 */
export async function getMessages(params: GetMessagesRequest) {
  const token = getAuthToken();

  if (!token) {
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
    ? `${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/messages?${queryString}`
    : `${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/messages`;

  const response = await apiRequest<GetMessagesResponse>(endpoint, {
    method: 'GET',
    token,
  });

  return response;
}
