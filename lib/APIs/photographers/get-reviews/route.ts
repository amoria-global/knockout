/**
 * Get Photographer Reviews API
 * GET /api/remote/public/photographers/list/:id/reviews
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

export interface PhotographerReview {
  id: string;
  bookingId: string;
  photographerId: string;
  clientId: string;
  clientName: string;
  clientImage?: string;
  rating: number;
  comment: string;
  images?: string[];
  eventType: string;
  eventDate: string;
  createdAt: string;
}

export interface GetReviewsResponse {
  reviews: PhotographerReview[];
  total: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Get Photographer Reviews
 * Uses enhanced API client with automatic retry and error handling
 */
export async function getPhotographerReviews(
  photographerId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<GetReviewsResponse>> {
  const response = await apiClient.get<GetReviewsResponse>(
    `${API_ENDPOINTS.PUBLIC.PHOTOGRAPHERS_LIST}/${photographerId}/reviews?page=${page}&limit=${limit}`,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
