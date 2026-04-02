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

// Public viewer count (no auth required)
export async function getPublicViewerCount(eventId: string): Promise<ApiResponse<ViewerCountResponse>> {
  return apiClient.get<ViewerCountResponse>(
    API_ENDPOINTS.PUBLIC.EVENT_VIEWERS(eventId),
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

// --- Stream Video (replay URL + live metadata) ---

export interface StreamVideoData {
  replayUrl: string | null;
  connectionStatus: 'live' | 'idle' | 'error' | null;
  viewerCount: number;
  peakViewers: number;
  streamHealth: string | null;
  totalMessages: number;
}

export interface StreamVideoResponse {
  action: number;
  message: string;
  data: StreamVideoData;
}

export async function getStreamVideo(eventId: string): Promise<ApiResponse<StreamVideoResponse>> {
  return apiClient.get<StreamVideoResponse>(
    API_ENDPOINTS.STREAMS.VIDEO(eventId),
    { skipAuth: !isAuthenticated(), retries: 1 }
  );
}

// --- Stream Token Validation ---

export interface ValidateStreamTokenResponse {
  valid: boolean;
  eventId?: string;
  eventTitle?: string;
  hasLiveStream?: boolean;
  hlsManifestUrl?: string | null;
  streamFee?: number;
  currencySymbol?: string;
  currencyAbbreviation?: string;
  requiresPayment?: boolean;
}

export async function validateStreamToken(
  eventId: string,
  inviteToken: string
): Promise<ApiResponse<ValidateStreamTokenResponse>> {
  return apiClient.post<ValidateStreamTokenResponse>(
    API_ENDPOINTS.PUBLIC.STREAM_VALIDATE_TOKEN(eventId),
    { inviteToken },
    { skipAuth: true, retries: 0 }
  );
}

// --- Stream Access (invite token flow) ---

export interface StreamAccessResponse {
  whepUrl: string;
  eventTitle?: string;
}

export async function requestStreamAccess(
  eventId: string,
  inviteToken: string,
  viewerUsername: string
): Promise<ApiResponse<StreamAccessResponse>> {
  return apiClient.post<StreamAccessResponse>(
    API_ENDPOINTS.PUBLIC.STREAM_ACCESS(eventId),
    { inviteToken, viewerUsername },
    { skipAuth: true, retries: 0 }
  );
}

// --- Stream Purchase Access (entry fee flow) ---

export interface PurchaseStreamAccessResponse {
  paymentUrl?: string;
  refid?: string;
  hlsManifestUrl?: string;
}

// --- Group Stream Access ---

export interface GroupAccessResponse {
  inviteCode: string;
  eventId: string;
  maxViewers: number;
  currentViewers: number;
  expiresAt: string;
  paymentRefId: string;
  purchaserEmail: string;
}

export interface RedeemGroupCodeResponse {
  accessToken: string;
  hlsManifestUrl: string;
  eventTitle: string;
  viewerUsername: string;
  remainingSlots: number;
}

export interface GroupCodeStatusResponse {
  inviteCode: string;
  maxViewers: number;
  currentViewers: number;
  expiresAt: string;
  isExpired: boolean;
  viewers: Array<{ username: string; joinedAt: string }>;
}

export async function generateGroupAccess(
  eventId: string,
  data: { paymentRefId: string; viewerCount: number; purchaserEmail: string }
): Promise<ApiResponse<GroupAccessResponse>> {
  return apiClient.post<GroupAccessResponse>(
    API_ENDPOINTS.PUBLIC.STREAM_GROUP_ACCESS(eventId),
    data,
    { skipAuth: true, retries: 0 }
  );
}

export async function redeemGroupCode(
  eventId: string,
  data: { inviteCode: string; viewerUsername: string }
): Promise<ApiResponse<RedeemGroupCodeResponse>> {
  return apiClient.post<RedeemGroupCodeResponse>(
    API_ENDPOINTS.PUBLIC.STREAM_REDEEM_GROUP_CODE(eventId),
    data,
    { skipAuth: true, retries: 0 }
  );
}

export async function getGroupCodeStatus(
  eventId: string,
  inviteCode: string
): Promise<ApiResponse<GroupCodeStatusResponse>> {
  return apiClient.get<GroupCodeStatusResponse>(
    API_ENDPOINTS.PUBLIC.STREAM_GROUP_CODE_STATUS(eventId, inviteCode),
    { skipAuth: true }
  );
}

// --- Device Access Control ---

export async function checkDeviceAccess(
  eventId: string,
  deviceId: string
): Promise<ApiResponse<{ action: number; message: string }>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  return apiClient.post(
    API_ENDPOINTS.PUBLIC.STREAM_DEVICE_CHECK(eventId),
    { deviceId },
    { retries: 1 }
  );
}

export async function sendHeartbeat(
  eventId: string,
  deviceId: string
): Promise<ApiResponse<{ action: number; message: string }>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }
  return apiClient.post(
    API_ENDPOINTS.PUBLIC.STREAM_HEARTBEAT(eventId),
    { deviceId },
    { retries: 0 }
  );
}

export async function purchaseStreamAccess(
  eventId: string,
  data: {
    paymentMethod: string;
    phoneNumber: string;
    viewerUsername: string;
    currencyId?: string;
  }
): Promise<ApiResponse<PurchaseStreamAccessResponse>> {
  return apiClient.post<PurchaseStreamAccessResponse>(
    API_ENDPOINTS.PUBLIC.STREAM_PURCHASE_ACCESS(eventId),
    data,
    { skipAuth: true, retries: 0 }
  );
}
