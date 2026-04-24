/**
 * Get Photographer Booked Dates API
 * GET /api/remote/public/photographers/{id}/booked-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export type BookedDateReason = 'preparation' | 'event' | 'delivery';

export interface BookedDate {
  date: string;                 // "YYYY-MM-DD" — the blocked calendar day
  isFullDay: boolean;
  reason: BookedDateReason;     // why this day is blocked
  bookingId: string;            // source booking id
  eventDate: string;            // "YYYY-MM-DD" — event date of the source booking
  startTime?: { hour: number; minute: number } | null;
  endTime?: { hour: number; minute: number } | null;
  deliveryDaysTotal?: number;   // present only when reason === 'delivery'
  deliveryDayIndex?: number;    // 1..deliveryDaysTotal, only when reason === 'delivery'
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
