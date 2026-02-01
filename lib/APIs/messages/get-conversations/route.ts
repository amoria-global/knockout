/**
 * Get Conversations API
 * GET /api/remote/messages/conversations
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
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function getConversations(params?: GetConversationsRequest): Promise<ApiResponse<GetConversationsResponse>> {
  if (!isAuthenticated()) {
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
    ? `${API_ENDPOINTS.LEGACY.MESSAGES}/conversations?${queryString}`
    : `${API_ENDPOINTS.LEGACY.MESSAGES}/conversations`;

  const response = await apiClient.get<GetConversationsResponse>(endpoint, {
    retries: 2,
  });

  return response;
}
