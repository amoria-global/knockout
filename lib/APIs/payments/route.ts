/**
 * Payments API
 * POST /api/remote/payments/{declarationId}/pay
 * POST /api/remote/payments/record-tip
 * POST /api/remote/payments/record-streaming-payment
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// --- Pay Declaration ---

export interface PayDeclarationResponse {
  message: string;
}

/**
 * Pay for a declaration
 * Requires authentication
 */
export async function payDeclaration(declarationId: string): Promise<ApiResponse<PayDeclarationResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  return apiClient.post<PayDeclarationResponse>(
    API_ENDPOINTS.PAYMENTS.PAY(declarationId),
    undefined,
    { retries: 1 }
  );
}

// --- Record Tip ---

export interface RecordTipRequest {
  amount: string;
  currencyId?: string;
  remarks?: string;
}

export interface RecordTipResponse {
  message: string;
}

/**
 * Record a tip/donation payment
 * Uses query parameters as per backend API
 * Requires authentication
 */
export async function recordTip(data: RecordTipRequest): Promise<ApiResponse<RecordTipResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  const queryParams = new URLSearchParams();
  queryParams.append('amount', data.amount);
  if (data.currencyId) queryParams.append('currencyId', data.currencyId);
  if (data.remarks) queryParams.append('remarks', data.remarks);

  return apiClient.post<RecordTipResponse>(
    `${API_ENDPOINTS.PAYMENTS.RECORD_TIP}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}

// --- Record Streaming Payment ---

export interface RecordStreamingPaymentRequest {
  eventId: string;
  amount: string;
  currencyId?: string;
  remarks?: string;
}

export interface RecordStreamingPaymentResponse {
  message: string;
}

/**
 * Record a streaming gift payment
 * Uses query parameters as per backend API
 * Requires authentication
 */
export async function recordStreamingPayment(data: RecordStreamingPaymentRequest): Promise<ApiResponse<RecordStreamingPaymentResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  const queryParams = new URLSearchParams();
  queryParams.append('eventId', data.eventId);
  queryParams.append('amount', data.amount);
  if (data.currencyId) queryParams.append('currencyId', data.currencyId);
  if (data.remarks) queryParams.append('remarks', data.remarks);

  return apiClient.post<RecordStreamingPaymentResponse>(
    `${API_ENDPOINTS.PAYMENTS.RECORD_STREAMING_PAYMENT}?${queryParams.toString()}`,
    undefined,
    { retries: 1 }
  );
}
