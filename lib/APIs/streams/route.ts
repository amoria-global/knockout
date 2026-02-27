/**
 * Stream Interaction APIs
 * Endpoints for stream chats, viewers, participants, reports, ratings, blocking
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// --- Stream Chats ---

export interface StreamChatMessage {
  id: string;
  content: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp: string;
  videoUrl?: string;
}

export interface GetStreamChatsResponse {
  action: number;
  message: string;
  data: {
    content: StreamChatMessage[];
    totalElements: number;
  };
}

export async function getStreamChats(eventId: string, page = 0, size = 50): Promise<ApiResponse<GetStreamChatsResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  return apiClient.get<GetStreamChatsResponse>(
    `${API_ENDPOINTS.STREAMS.CHATS(eventId)}?page=${page}&size=${size}`,
    { retries: 1 }
  );
}

export async function sendStreamChat(eventId: string, content: string): Promise<ApiResponse<{ action: number; message: string }>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  const queryParams = new URLSearchParams({ content });
  return apiClient.post(
    `${API_ENDPOINTS.STREAMS.CHATS(eventId)}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}

export async function sendStreamVideoChat(eventId: string, video: File, content?: string): Promise<ApiResponse<{ action: number; message: string; data: { chatId: string; videoUrl: string } }>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  const formData = new FormData();
  formData.append('video', video);
  if (content) formData.append('content', content);

  return apiClient.post(
    API_ENDPOINTS.STREAMS.CHAT_VIDEO(eventId),
    formData,
    { retries: 0, timeout: 60000 }
  );
}

// --- Stream Viewers ---

export interface ViewerCountResponse {
  action: number;
  message: string;
  data: { viewerCount: number };
}

export async function getStreamViewerCount(eventId: string): Promise<ApiResponse<ViewerCountResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  return apiClient.get<ViewerCountResponse>(
    API_ENDPOINTS.STREAMS.VIEWERS(eventId),
    { retries: 1 }
  );
}

// --- Stream Participants ---

export interface StreamParticipant {
  customerId: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  joinedAt: string;
}

export interface ParticipantsResponse {
  action: number;
  message: string;
  data: StreamParticipant[];
}

export async function getStreamParticipants(eventId: string): Promise<ApiResponse<ParticipantsResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  return apiClient.get<ParticipantsResponse>(
    API_ENDPOINTS.STREAMS.PARTICIPANTS(eventId),
    { retries: 1 }
  );
}

// --- Stream URL ---

export interface StreamUrlResponse {
  action: number;
  message: string;
  data: {
    eventId: string;
    eventTitle: string;
    isStreaming: boolean;
    token?: string;
    expiresAt?: string;
  };
}

export async function getStreamUrl(eventId: string): Promise<ApiResponse<StreamUrlResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  return apiClient.get<StreamUrlResponse>(
    API_ENDPOINTS.STREAMS.URL(eventId),
    { retries: 1 }
  );
}

// --- Stream Reports ---

export async function reportStreamIssue(eventId: string, issueType: string, description?: string): Promise<ApiResponse<{ action: number; message: string }>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  const queryParams = new URLSearchParams({ issueType });
  if (description) queryParams.append('description', description);

  return apiClient.post(
    `${API_ENDPOINTS.STREAMS.REPORTS(eventId)}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}

// --- Stream Ratings ---

export async function rateStream(eventId: string, rating: number, comment?: string): Promise<ApiResponse<{ action: number; message: string }>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  const queryParams = new URLSearchParams({ rating: rating.toString() });
  if (comment) queryParams.append('comment', comment);

  return apiClient.post(
    `${API_ENDPOINTS.STREAMS.RATINGS(eventId)}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}

// --- Stream Block ---

export async function blockUserInStream(eventId: string, blockedUserId: string): Promise<ApiResponse<{ action: number; message: string }>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  const queryParams = new URLSearchParams({ blockedUserId });

  return apiClient.post(
    `${API_ENDPOINTS.STREAMS.BLOCK(eventId)}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}
