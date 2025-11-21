/**
 * Send Message API
 * POST /api/remote/messages
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';

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
 */
export async function sendMessage(data: SendMessageRequest) {
  const token = getAuthToken();

  if (!token) {
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

    data.attachments.forEach((file, index) => {
      formData.append(`attachments`, file);
    });

    const response = await apiRequest<SendMessageResponse>(
      API_ENDPOINTS.MESSAGES,
      {
        method: 'POST',
        body: formData,
        token,
        headers: {
          // Let browser set Content-Type for FormData
        },
      }
    );

    return response;
  }

  // Otherwise use JSON
  const response = await apiRequest<SendMessageResponse>(
    API_ENDPOINTS.MESSAGES,
    {
      method: 'POST',
      body: data,
      token,
    }
  );

  return response;
}
