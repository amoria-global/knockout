/**
 * Newsletter API
 * POST /api/remote/public/newsletter/subscribe
 * GET  /api/remote/public/newsletter/unsubscribe
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface NewsletterSubscribeRequest {
  email: string;
}

export interface NewsletterSubscribeResponse {
  id: string;
  email: string;
  status: string;
  isActive: boolean;
  unsubscribeToken: string;
  createdAt: string;
}

export interface NewsletterUnsubscribeResponse {
  message: string;
}

/**
 * Subscribe to newsletter
 */
export async function newsletterSubscribe(
  data: NewsletterSubscribeRequest
): Promise<ApiResponse<NewsletterSubscribeResponse>> {
  return apiClient.post<NewsletterSubscribeResponse>(
    API_ENDPOINTS.PUBLIC.NEWSLETTER_SUBSCRIBE,
    data,
    { skipAuth: true, retries: 2 }
  );
}

/**
 * Unsubscribe from newsletter using token
 */
export async function newsletterUnsubscribe(
  token: string
): Promise<ApiResponse<NewsletterUnsubscribeResponse>> {
  const queryParams = new URLSearchParams({ token });
  return apiClient.get<NewsletterUnsubscribeResponse>(
    `${API_ENDPOINTS.PUBLIC.NEWSLETTER_UNSUBSCRIBE}?${queryParams}`,
    { skipAuth: true, retries: 1 }
  );
}
