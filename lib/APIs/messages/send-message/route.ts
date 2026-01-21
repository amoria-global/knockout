/**
 * Send Message API
 * POST /api/remote/messages
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS, TIMEOUT_PRESETS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  recipientId: string;
  recipientName: string;
  recipientImage?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'booking_request' | 'system';
  attachments?: {
    type: string;
    url: string;
    name: string;
    size: number;
  }[];
  metadata?: {
    bookingId?: string;
    eventId?: string;
  };
  isRead: boolean;
  readAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  recipientId?: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'booking_request';
  attachments?: File[];
  metadata?: {
    bookingId?: string;
    eventId?: string;
  };
}

export interface SendMessageResponse {
  message: Message;
  conversationId: string;
}

/**
 * Send Message
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function sendMessage(data: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required',
    };
  }

  // If attachments are present, use FormData
  if (data.attachments && data.attachments.length > 0) {
    const formData = new FormData();

    if (data.conversationId) {
      formData.append('conversationId', data.conversationId);
    }
    if (data.recipientId) {
      formData.append('recipientId', data.recipientId);
    }
    formData.append('content', data.content);
    formData.append('type', data.type || 'text');

    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    data.attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await apiClient.post<SendMessageResponse>(
      API_ENDPOINTS.LEGACY.MESSAGES,
      formData,
      {
        retries: 1,
        timeout: TIMEOUT_PRESETS.LONG, // Longer timeout for file uploads
      }
    );

    return response;
  }

  // Otherwise use JSON
  const response = await apiClient.post<SendMessageResponse>(
    API_ENDPOINTS.LEGACY.MESSAGES,
    data,
    {
      retries: 1,
    }
  );

  return response;
}
