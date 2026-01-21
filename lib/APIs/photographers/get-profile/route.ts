/**
 * Get Photographer Profile API
 * GET /api/remote/public/photographers/list/:id
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
import type { Photographer } from '../get-photographers/route';

/**
 * Get Photographer Profile
 * Uses enhanced API client with automatic retry and error handling
 */
export async function getPhotographerProfile(photographerId: string): Promise<ApiResponse<Photographer>> {
  const response = await apiClient.get<Photographer>(
    `${API_ENDPOINTS.PUBLIC.PHOTOGRAPHERS_LIST}/${photographerId}`,
    {
      skipAuth: true,
      retries: 2,
    }
  );

  return response;
}
