/**
 * Get Conversations API
 * GET /api/remote/chat/conversations
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface GetConversationsResponse {
  action: number;
  message: string;
  data: Conversation[];
}

/**
 * Get all conversations for the authenticated user
 */
export async function getConversations(): Promise<ApiResponse<GetConversationsResponse>> {
  return apiClient.get<GetConversationsResponse>(
    API_ENDPOINTS.CHAT.CONVERSATIONS,
    { retries: 2 }
  );
}
