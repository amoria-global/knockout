/**
 * FAQs API
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
  priority: number;
  helpfulCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface GetFAQsResponse {
  action: number;
  message: string;
  data: FAQ[];
}

/**
 * Get all active FAQs, optionally filtered by category
 */
export async function getFAQs(category?: string): Promise<ApiResponse<GetFAQsResponse>> {
  const queryParams = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiClient.get<GetFAQsResponse>(
    `${API_ENDPOINTS.PUBLIC.FAQS}${queryParams}`,
    { retries: 2 }
  );
}
