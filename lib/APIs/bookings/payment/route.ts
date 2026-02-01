/**
 * Process Payment API
 * POST /api/remote/bookings/:id/payment
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

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  saveCard?: boolean;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  message: string;
}

/**
 * Process Payment
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function processPayment(data: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required',
    };
  }

  const { bookingId, ...paymentData } = data;

  const response = await apiClient.post<PaymentResponse>(
    `${API_ENDPOINTS.LEGACY.BOOKINGS}/${bookingId}/payment`,
    paymentData,
    {
      retries: 1, // Less retries for payment operations
    }
  );

  return response;
}
