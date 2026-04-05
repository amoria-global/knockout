/**
 * Anonymous Viewer APIs
 * Endpoints for unauthenticated stream viewer access (no login/signup required)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// --- Types ---

export interface AnonymousViewerRegistration {
  name: string;
  email: string;
  phone: string;
  deviceFingerprint: string;
}

export interface RegisterResponse {
  action: number;
  status: 'ACCESS_GRANTED' | 'REQUIRES_PAYMENT' | 'DEVICE_CONFLICT';
  viewerId: string;
  name?: string;
  whepUrl?: string;
}

export interface ConfirmPaymentResponse {
  action: number;
  message: string;
  whepUrl: string;
  eventTitle: string;
}

export interface DeviceCheckResponse {
  action: number;
  status?: string;
  message: string;
}

export interface HeartbeatResponse {
  action: number;
  message: string;
}

export interface AccessStatusResponse {
  action: number;
  hasAccess: boolean;
  viewerId?: string;
  name?: string;
  whepUrl?: string;
}

export interface AnonymousViewerCountResponse {
  action: number;
  data: { viewerCount: number };
}

// --- API Functions ---

export async function registerAnonymousViewer(
  eventId: string,
  data: AnonymousViewerRegistration
): Promise<ApiResponse<RegisterResponse>> {
  return apiClient.post<RegisterResponse>(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_REGISTER(eventId),
    data,
    { skipAuth: true, retries: 0 }
  );
}

export async function confirmAnonymousPayment(
  eventId: string,
  viewerId: string,
  refid: string
): Promise<ApiResponse<ConfirmPaymentResponse>> {
  return apiClient.post<ConfirmPaymentResponse>(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_CONFIRM_PAYMENT(eventId),
    { viewerId, refid },
    { skipAuth: true, retries: 0 }
  );
}

export async function anonymousDeviceCheck(
  eventId: string,
  viewerId: string,
  deviceFingerprint: string
): Promise<ApiResponse<DeviceCheckResponse>> {
  return apiClient.post<DeviceCheckResponse>(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_DEVICE_CHECK(eventId),
    { viewerId, deviceFingerprint },
    { skipAuth: true, retries: 1 }
  );
}

export async function anonymousHeartbeat(
  eventId: string,
  viewerId: string,
  deviceFingerprint: string
): Promise<ApiResponse<HeartbeatResponse>> {
  return apiClient.post<HeartbeatResponse>(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_HEARTBEAT(eventId),
    { viewerId, deviceFingerprint },
    { skipAuth: true, retries: 0 }
  );
}

export async function deactivateAnonymousSession(
  eventId: string,
  deviceFingerprint: string
): Promise<ApiResponse<{ action: number; message: string }>> {
  return apiClient.post(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_DEACTIVATE(eventId),
    { deviceFingerprint },
    { skipAuth: true, retries: 0 }
  );
}

export async function switchAnonymousDevice(
  eventId: string,
  viewerId: string,
  newDeviceFingerprint: string
): Promise<ApiResponse<{ action: number; message: string; whepUrl?: string }>> {
  return apiClient.post(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_SWITCH_DEVICE(eventId),
    { viewerId, newDeviceFingerprint },
    { skipAuth: true, retries: 0 }
  );
}

export async function checkAnonymousAccessStatus(
  eventId: string,
  fingerprint: string,
  viewerId?: string
): Promise<ApiResponse<AccessStatusResponse>> {
  const viewerParam = viewerId ? `&viewerId=${encodeURIComponent(viewerId)}` : '';
  return apiClient.get<AccessStatusResponse>(
    `${API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_ACCESS_STATUS(eventId)}?fingerprint=${encodeURIComponent(fingerprint)}${viewerParam}`,
    { skipAuth: true, retries: 1 }
  );
}

// --- Anonymous Viewer Interaction APIs ---

export async function sendAnonymousChatMessage(
  eventId: string,
  viewerId: string,
  content: string,
  deviceFingerprint: string
): Promise<ApiResponse<{ action: number; message: string }>> {
  return apiClient.post(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_CHAT(eventId),
    { viewerId, content, deviceFingerprint },
    { skipAuth: true, retries: 0 }
  );
}

export async function sendAnonymousVideoChat(
  eventId: string,
  viewerId: string,
  video: File,
  deviceFingerprint: string
): Promise<ApiResponse<{ action: number; message: string }>> {
  const formData = new FormData();
  formData.append('viewerId', viewerId);
  formData.append('deviceFingerprint', deviceFingerprint);
  formData.append('video', video);
  return apiClient.post(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_CHAT_VIDEO(eventId),
    formData,
    { skipAuth: true, retries: 0 }
  );
}

export async function rateStreamAnonymous(
  eventId: string,
  viewerId: string,
  rating: number,
  comment?: string,
  deviceFingerprint?: string
): Promise<ApiResponse<{ action: number; message: string }>> {
  return apiClient.post(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_RATE(eventId),
    { viewerId, rating, comment, deviceFingerprint },
    { skipAuth: true, retries: 0 }
  );
}

export async function getAnonymousViewerCount(
  eventId: string
): Promise<ApiResponse<AnonymousViewerCountResponse>> {
  return apiClient.get<AnonymousViewerCountResponse>(
    API_ENDPOINTS.PUBLIC.ANONYMOUS_VIEWER_COUNT(eventId),
    { skipAuth: true, retries: 1 }
  );
}
