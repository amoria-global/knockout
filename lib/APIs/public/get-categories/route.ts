/**
 * Get Photographer Categories API
 * GET /api/remote/photographer-categories
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

export interface PhotographerCategory {
  id: string;
  name: string;
  specialties: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  formattedCreatedAt: string;
}

// Backend response wraps categories in 'data' array
export type GetCategoriesResponse = PhotographerCategory[];

/**
 * Get All Photographer Categories
 * Uses enhanced API client with automatic retry and error handling
 */
export async function getCategories(): Promise<ApiResponse<GetCategoriesResponse>> {
  const response = await apiClient.get<GetCategoriesResponse>(
    API_ENDPOINTS.PUBLIC.PHOTOGRAPHER_CATEGORIES,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}

/**
 * Get Category by ID
 */
export async function getCategoryById(id: string): Promise<ApiResponse<PhotographerCategory>> {
  const response = await apiClient.get<PhotographerCategory>(
    `${API_ENDPOINTS.PUBLIC.PHOTOGRAPHER_CATEGORIES}/${id}`,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
