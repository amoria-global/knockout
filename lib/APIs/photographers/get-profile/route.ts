/**
 * Get Photographer Profile API
 * GET /api/remote/photographers/:id
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';
import type { Photographer } from '../get-photographers/route';

/**
 * Get Photographer Profile
 */
export async function getPhotographerProfile(photographerId: string) {
  const response = await apiRequest<Photographer>(
    `${API_ENDPOINTS.PHOTOGRAPHERS}/${photographerId}`,
    {
      method: 'GET',
    }
  );

  return response;
}
