/**
 * Get Photographer Booked Dates API
 * GET /api/remote/public/photographers/{id}/booked-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface BookedDate {
  date: string;
  isFullDay: boolean;
  startTime: { hour: number; minute: number } | null;
  endTime: { hour: number; minute: number } | null;
}

export interface GetBookedDatesRequest {
  photographerId: string;
  from: string; // "YYYY-MM-DD"
  to: string;   // "YYYY-MM-DD"
}

/**
 * Fetch booked dates for a photographer within a date range
 */
export async function getBookedDates(
  params: GetBookedDatesRequest
): Promise<ApiResponse<BookedDate[]>> {
  const queryParams = new URLSearchParams();
  queryParams.append('from', params.from);
  queryParams.append('to', params.to);

  const endpoint = `${API_ENDPOINTS.PUBLIC.PHOTOGRAPHER_BOOKED_DATES(params.photographerId)}?${queryParams.toString()}`;

  const response = await apiClient.get<BookedDate[]>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  // Handle wrapped { action, data } response format
  if (response.success && response.data) {
    const raw = response.data as unknown as Record<string, unknown>;
    if (raw?.data && Array.isArray(raw.data)) {
      response.data = raw.data as BookedDate[];
    }
  }

  return response;
}
