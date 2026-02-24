/**
 * Get Messages API
 * GET /api/remote/chat/messages/{partnerId}
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
  read: boolean;
}

export interface GetMessagesResponse {
  action: number;
  message: string;
  data: ChatMessage[];
}

/**
 * Get messages with a specific partner
 */
export async function getMessages(partnerId: string): Promise<ApiResponse<GetMessagesResponse>> {
  return apiClient.get<GetMessagesResponse>(
    API_ENDPOINTS.CHAT.MESSAGES(partnerId),
    { retries: 2 }
  );
}
