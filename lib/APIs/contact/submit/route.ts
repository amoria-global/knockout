/**
 * Submit Contact Form API
 * POST /api/remote/contact
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface ContactFormRequest {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  subject?: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

/**
 * Submit Contact Form
 * Uses enhanced API client with automatic retry and error handling
 */
export async function submitContactForm(data: ContactFormRequest): Promise<ApiResponse<ContactFormResponse>> {
  const response = await apiClient.post<ContactFormResponse>(
    API_ENDPOINTS.LEGACY.CONTACT,
    data,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
