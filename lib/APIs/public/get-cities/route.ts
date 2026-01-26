/**
 * Get Cities API
 * GET /api/remote/cities
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

export interface City {
  id: string;
  name: string;
  country?: string;
  countryCode?: string;
  state?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  formattedCreatedAt?: string;
}

export interface GetCitiesRequest {
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Backend response wraps cities in 'data' array
export type GetCitiesResponse = City[];

/**
 * Get All Cities
 * Uses enhanced API client with automatic retry and error handling
 */
export async function getCities(params?: GetCitiesRequest): Promise<ApiResponse<GetCitiesResponse>> {
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
    ? `${API_ENDPOINTS.PUBLIC.CITIES}?${queryString}`
    : API_ENDPOINTS.PUBLIC.CITIES;

  const response = await apiClient.get<GetCitiesResponse>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  return response;
}

/**
 * Get City by ID
 */
export async function getCityById(id: string): Promise<ApiResponse<City>> {
  const response = await apiClient.get<City>(
    `${API_ENDPOINTS.PUBLIC.CITIES}/${id}`,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}

/**
 * Get Cities by Country
 */
export async function getCitiesByCountry(country: string): Promise<ApiResponse<GetCitiesResponse>> {
  return getCities({ country });
}
