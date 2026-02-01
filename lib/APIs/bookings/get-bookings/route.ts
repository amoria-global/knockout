/**
 * Get Bookings API
 * GET /api/remote/bookings
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { Booking } from '../create-booking/route';

export interface GetBookingsRequest {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  userType?: 'client' | 'photographer';
}

export interface GetBookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
  stats?: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    totalRevenue?: number;
  };
}

/**
 * Get All Bookings (with filters)
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function getBookings(params?: GetBookingsRequest): Promise<ApiResponse<GetBookingsResponse>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required',
    };
  }

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
    ? `${API_ENDPOINTS.LEGACY.BOOKINGS}?${queryString}`
    : API_ENDPOINTS.LEGACY.BOOKINGS;

  const response = await apiClient.get<GetBookingsResponse>(endpoint, {
    retries: 2,
  });

  return response;
}
