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

  const res = await apiClient.get<GetStreamChatsResponse>(endpoint, { retries: 1 });
  if (res.success) res.data = normalizeChatList(res.data);
  return res;
}

/**
 * The chat list reply is { data: [messages], page, size, total }. The shared client merges the root fields (page, size,
 * total) into the unwrapped data, and when that data is an array the merge spreads it into an object keyed 0, 1, 2 ...
 * The live page then saw something that was not an array and showed no messages at all to a signed-in viewer. Rebuild
 * the list from any of the shapes that can arrive: an array, the keyed object, or { data: [...] }.
 */
export function normalizeChatList(raw: unknown): GetStreamChatsResponse {
  if (Array.isArray(raw)) return { data: raw as StreamChatMessage[] };
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return { ...(o as object), data: o.data as StreamChatMessage[] } as GetStreamChatsResponse;
    const keyed = Object.keys(o)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => o[k] as StreamChatMessage);
    const { page, size, total } = o as { page?: number; size?: number; total?: number };
    return { data: keyed, ...(page !== undefined ? { page } : {}), ...(size !== undefined ? { size } : {}), ...(total !== undefined ? { total } : {}) } as GetStreamChatsResponse;
  }
  return { data: [] };
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
