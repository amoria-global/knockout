/**
 * Send Message API
 * POST /api/remote/chat/send (FormData)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface SendMessageResponse {
  action: number;
  message: string;
  data?: {
    id: string;
    content: string;
    createdAt: string;
  };
}

/**
 * Send a message (supports text and media via FormData)
 */
export async function sendMessage(data: FormData): Promise<ApiResponse<SendMessageResponse>> {
  return apiClient.post<SendMessageResponse>(
    API_ENDPOINTS.CHAT.SEND,
    data,
    { retries: 1 }
  );
}
