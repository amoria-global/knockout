/**
 * Public Donations API
 * POST /api/remote/public/donations
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface PublicDonationRequest {
  amount: string;
  currencyId: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  paymentMethod?: string;
  eventId?: string;
}

export interface PublicDonationResponse {
  id: string;
  amount: number;
  currencyId: string;
  donorName: string;
  donorEmail: string;
  message: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

/**
 * Submit a public donation (no auth required)
 * Uses query parameters as per backend API
 */
export async function createPublicDonation(data: PublicDonationRequest): Promise<ApiResponse<PublicDonationResponse>> {
  const queryParams = new URLSearchParams();
  queryParams.append('amount', data.amount);
  queryParams.append('currencyId', data.currencyId);
  if (data.donorName) queryParams.append('donorName', data.donorName);
  if (data.donorEmail) queryParams.append('donorEmail', data.donorEmail);
  if (data.message) queryParams.append('message', data.message);
  if (data.paymentMethod) queryParams.append('paymentMethod', data.paymentMethod);
  if (data.eventId) queryParams.append('eventId', data.eventId);

  return apiClient.post<PublicDonationResponse>(
    `${API_ENDPOINTS.PUBLIC.DONATIONS}?${queryParams.toString()}`,
    undefined,
    { skipAuth: true, retries: 1 }
  );
}
