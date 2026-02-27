/**
 * Mark Messages as Read API
 * PATCH /api/remote/chat/messages/{partnerId}/read
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface MarkReadResponse {
  action: number;
  message: string;
}

/**
 * Mark all messages from a partner as read
 */
export async function markAsRead(partnerId: string): Promise<ApiResponse<MarkReadResponse>> {
  return apiClient.patch<MarkReadResponse>(
    API_ENDPOINTS.CHAT.MARK_READ(partnerId),
    undefined,
    { retries: 1 }
  );
}