/**
 * Delete Message API
 * DELETE /api/remote/chat/messages/{id}?senderId=
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface DeleteMessageResponse {
  action: number;
  message: string;
}

/**
 * Delete a message by ID
 */
export async function deleteMessage(
  id: string,
  senderId: string
): Promise<ApiResponse<DeleteMessageResponse>> {
  const params = new URLSearchParams({ senderId });
  return apiClient.delete<DeleteMessageResponse>(
    `${API_ENDPOINTS.CHAT.DELETE_MESSAGE(id)}?${params}`,
    { retries: 1 }
  );
}