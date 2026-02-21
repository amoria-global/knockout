/**
 * Donations API (Authenticated)
 * POST /api/remote/donations
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface CreateDonationRequest {
  amount: string;
  currencyId: string;
  message?: string;
  paymentMethod?: string;
  eventId?: string;
}

export interface DonationResponse {
  id: string;
  amount: number;
  currencyId: string;
  donorId: string;
  message: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

/**
 * Create a donation (requires authentication)
 * Uses query parameters as per backend API
 */
export async function createDonation(data: CreateDonationRequest): Promise<ApiResponse<DonationResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  const queryParams = new URLSearchParams();
  queryParams.append('amount', data.amount);
  queryParams.append('currencyId', data.currencyId);
  if (data.message) queryParams.append('message', data.message);
  if (data.paymentMethod) queryParams.append('paymentMethod', data.paymentMethod);
  if (data.eventId) queryParams.append('eventId', data.eventId);

  return apiClient.post<DonationResponse>(
    `${API_ENDPOINTS.DONATIONS.CREATE}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}
