/**
 * Get Conversations API
 * GET /api/remote/messages/conversations
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    image?: string;
    userType: string;
    isOnline: boolean;
    lastSeen?: string;
  }[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  bookingId?: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetConversationsRequest {
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  totalPages: number;
  totalUnread: number;
}

/**
 * Get All Conversations
 */
export async function getConversations(params?: GetConversationsRequest) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required',
    };
  }

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
    ? `${API_ENDPOINTS.MESSAGES}/conversations?${queryString}`
    : `${API_ENDPOINTS.MESSAGES}/conversations`;

  const response = await apiRequest<GetConversationsResponse>(endpoint, {
    method: 'GET',
    token,
  });

  return response;
}
