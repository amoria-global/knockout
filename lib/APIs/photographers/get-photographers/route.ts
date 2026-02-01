/**
 * Get All Photographers API
 * GET /api/remote/public/photographers/list
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

export interface Photographer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  coverImage?: string;
  bio?: string;
  specializations: string[];
  experience: number;
  location: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  reviewCount: number;
  completedBookings: number;
  verified: boolean;
  responseTime?: string;
  responseRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetPhotographersRequest {
  page?: number;
  limit?: number;
  size?: number; // Backend uses 'size' for pagination
  search?: string;
  specialization?: string;
  city?: string;
  country?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  experience?: number;
  verified?: boolean;
  available?: boolean;
  sortBy?: 'rating' | 'price' | 'experience' | 'reviews';
  sortOrder?: 'asc' | 'desc';
}

export interface GetPhotographersResponse {
  photographers: Photographer[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    specializations: string[];
    cities: string[];
    countries: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

/**
 * Get All Photographers (with filters)
 * Uses enhanced API client with automatic retry and error handling
 */
export async function getPhotographers(params?: GetPhotographersRequest): Promise<ApiResponse<GetPhotographersResponse>> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.PUBLIC.PHOTOGRAPHERS_LIST}?${queryString}`
    : API_ENDPOINTS.PUBLIC.PHOTOGRAPHERS_LIST;

  const response = await apiClient.get<GetPhotographersResponse>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  return response;
}
