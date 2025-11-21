/**
 * Get All Photographers API
 * GET /api/remote/photographers
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

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
 */
export async function getPhotographers(params?: GetPhotographersRequest) {
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
    ? `${API_ENDPOINTS.PHOTOGRAPHERS}?${queryString}`
    : API_ENDPOINTS.PHOTOGRAPHERS;

  const response = await apiRequest<GetPhotographersResponse>(endpoint, {
    method: 'GET',
  });

  return response;
}
