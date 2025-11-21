/**
 * Get Bookings API
 * GET /api/remote/bookings
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';
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
 */
export async function getBookings(params?: GetBookingsRequest) {
  const token = getAuthToken();

  if (!token) {
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
    ? `${API_ENDPOINTS.BOOKINGS}?${queryString}`
    : API_ENDPOINTS.BOOKINGS;

  const response = await apiRequest<GetBookingsResponse>(endpoint, {
    method: 'GET',
    token,
  });

  return response;
}
