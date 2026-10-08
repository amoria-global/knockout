/**
 * Get Photographer Booked Dates API
 * GET /api/remote/public/photographers/{id}/booked-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// Post capacity-rework there is exactly one block reason: the photographer
// is fully booked for that day (client bookings hit their per-day capacity)
// or they manually marked the date unavailable. The legacy
// preparation/event/delivery split is gone. Optional legacy fields are kept
// so any cached client code keeps deserialising; the backend no longer
// sends them.
// With includePartial the backend also returns days that have bookings but
// can take more: isFullDay false, reason 'partial', bookedCount and capacity.
export type BookedDateReason = 'booked' | 'partial';

export interface BookedDate {
  date: string;                 // "YYYY-MM-DD" - the blocked calendar day
  isFullDay: boolean;           // false only for partly booked days (includePartial)
  reason: BookedDateReason;     // 'booked' (full) or 'partial'
  bookedCount?: number;         // partial days: bookings so far
  capacity?: number;            // partial days: the photographer's daily cap
  bookingId?: string;           // no longer sent
  eventDate: string;            // "YYYY-MM-DD" - mirrors `date`
  startTime?: { hour: number; minute: number } | null;
  endTime?: { hour: number; minute: number } | null;
  deliveryDaysTotal?: number;
  deliveryDayIndex?: number;
}

export interface GetBookedDatesRequest {
  photographerId: string;
  from: string; // "YYYY-MM-DD"
  to: string;   // "YYYY-MM-DD"
  /** Also return partly booked days. Leave off where every entry must mean unavailable. */
  includePartial?: boolean;
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
  if (params.includePartial) queryParams.append('includePartial', 'true');

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
