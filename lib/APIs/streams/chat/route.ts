/**
 * Stream Chat API
 * GET  /api/remote/coordinator/streams/:streamId/chats
 * POST /api/remote/coordinator/streams/:streamId/chats
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface StreamChatMessage {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
  avatar?: string;
}

export interface GetStreamChatsResponse {
  data: StreamChatMessage[];
}

export interface SendStreamChatRequest {
  message: string;
}

/**
 * Get chat messages for a live stream
 */
export async function getStreamChats(
  streamId: string,
  page?: number,
  size?: number
): Promise<ApiResponse<GetStreamChatsResponse>> {
  const queryParams = new URLSearchParams();
  if (page !== undefined) queryParams.append('page', page.toString());
  if (size !== undefined) queryParams.append('size', size.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.STREAMS.CHATS(streamId)}?${queryString}`
    : API_ENDPOINTS.STREAMS.CHATS(streamId);

  return apiClient.get<GetStreamChatsResponse>(endpoint, { retries: 1 });
}

/**
 * Send a chat message to a live stream
 */
export async function sendStreamChat(
  streamId: string,
  message: string
): Promise<ApiResponse<StreamChatMessage>> {
  return apiClient.post<StreamChatMessage>(
    API_ENDPOINTS.STREAMS.CHATS(streamId),
    { message },
    { retries: 1 }
  );
}
