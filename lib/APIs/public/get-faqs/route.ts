/**
 * Get FAQs API
 * GET /api/remote/public/faqs
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority?: string;
  helpful?: number;
  lastUpdated?: string;
  tags?: string[];
}

export type GetFAQsResponse = FAQ[];

/**
 * Get all FAQs (public, no auth required)
 */
export async function getFAQs(): Promise<ApiResponse<GetFAQsResponse>> {
  return apiClient.get<GetFAQsResponse>(
    API_ENDPOINTS.PUBLIC.FAQS,
    { skipAuth: true, retries: 2 }
  );
}
