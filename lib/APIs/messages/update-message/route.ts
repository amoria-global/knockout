/**
 * Update Message API
 * PUT /api/remote/chat/messages/{id}?senderId=&content=
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface UpdateMessageResponse {
  action: number;
  message: string;
}

/**
 * Update a message by ID
 */
export async function updateMessage(
  id: string,
  senderId: string,
  content: string
): Promise<ApiResponse<UpdateMessageResponse>> {
  const params = new URLSearchParams({ senderId, content });
  return apiClient.put<UpdateMessageResponse>(
    `${API_ENDPOINTS.CHAT.UPDATE_MESSAGE(id)}?${params}`,
    undefined,
    { retries: 1 }
  );
}