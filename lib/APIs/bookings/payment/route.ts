/**
 * Process Payment API
 * POST /api/remote/bookings/:id/payment
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';

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
 */
export async function processPayment(data: PaymentRequest) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required',
    };
  }

  const { bookingId, ...paymentData } = data;

  const response = await apiRequest<PaymentResponse>(
    `${API_ENDPOINTS.BOOKINGS}/${bookingId}/payment`,
    {
      method: 'POST',
      body: paymentData,
      token,
    }
  );

  return response;
}
