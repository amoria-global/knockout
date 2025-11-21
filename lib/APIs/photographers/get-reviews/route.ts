/**
 * Get Photographer Reviews API
 * GET /api/remote/photographers/:id/reviews
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

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
 */
export async function getPhotographerReviews(
  photographerId: string,
  page: number = 1,
  limit: number = 10
) {
  const response = await apiRequest<GetReviewsResponse>(
    `${API_ENDPOINTS.PHOTOGRAPHERS}/${photographerId}/reviews?page=${page}&limit=${limit}`,
    {
      method: 'GET',
    }
  );

  return response;
}
