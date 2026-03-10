/**
 * XentriPay Payment API
 * Handles payment initiation and status checking via XentriPay gateway
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// ==================== Types ====================

export interface XentriPayInitiateRequest {
  declarationId: string;
  phone: string;
  telecomProvider: string; // 'MTN' | 'AIRTEL'
  paymentMethod: string;   // 'MOBILE_MONEY' | 'CARD'
}

export interface XentriPayTipRequest {
  eventId: string;
  amount: number;
  currencyId: string;
  phone: string;
  telecomProvider: string;
}

export interface XentriPayStreamingRequest {
  eventId: string;
  amount: number;
  currencyId: string;
  phone: string;
  telecomProvider: string;
}

export interface XentriPayResponse {
  refid: string;
  tid: string;
  paymentUrl?: string;
  status: string;
  message: string;
}

export interface XentriPayStatusResponse {
  refid: string;
  status: string; // 'PENDING' | 'SUCCESS' | 'FAILED'
  declarationStatus?: string;
  amount?: number;
  paidAmount?: number;
}

// ==================== API Functions ====================

/**
 * Initiate payment for an existing payment declaration (booking)
 */
export async function initiateXentriPayment(
  data: XentriPayInitiateRequest
): Promise<ApiResponse<XentriPayResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  return apiClient.post<XentriPayResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE,
    data,
    { retries: 1 }
  );
}

/**
 * Initiate tip payment via XentriPay
 */
export async function initiateXentriPayTip(
  data: XentriPayTipRequest
): Promise<ApiResponse<XentriPayResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  return apiClient.post<XentriPayResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE_TIP,
    data,
    { retries: 1 }
  );
}

/**
 * Initiate streaming/donation payment via XentriPay
 */
export async function initiateXentriPayStreaming(
  data: XentriPayStreamingRequest
): Promise<ApiResponse<XentriPayResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  return apiClient.post<XentriPayResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE_STREAMING,
    data,
    { retries: 1 }
  );
}

/**
 * Check payment status by reference ID
 */
export async function checkXentriPayStatus(
  refid: string
): Promise<ApiResponse<XentriPayStatusResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  return apiClient.get<XentriPayStatusResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_STATUS(refid),
    { retries: 1 }
  );
}

/**
 * Poll payment status until it settles (SUCCESS or FAILED)
 * Returns a cleanup function to stop polling
 */
export function pollXentriPayStatus(
  refid: string,
  callbacks: {
    onSuccess: (data: XentriPayStatusResponse) => void;
    onFailure: (data: XentriPayStatusResponse) => void;
    onError: (error: string) => void;
  },
  intervalMs: number = 5000,
  maxAttempts: number = 60 // 5 minutes at 5s intervals
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;

    try {
      const response = await checkXentriPayStatus(refid);

      if (stopped) return;

      if (!response.success) {
        if (attempts >= maxAttempts) {
          callbacks.onError('Payment status check timed out. Please check your payment history.');
          return;
        }
        setTimeout(poll, intervalMs);
        return;
      }

      const status = response.data?.status;

      if (status === 'SUCCESS') {
        callbacks.onSuccess(response.data!);
        return;
      }

      if (status === 'FAILED') {
        callbacks.onFailure(response.data!);
        return;
      }

      // Still pending - continue polling
      if (attempts >= maxAttempts) {
        callbacks.onError('Payment is taking longer than expected. Please check your payment history.');
        return;
      }

      setTimeout(poll, intervalMs);
    } catch {
      if (stopped) return;
      if (attempts >= maxAttempts) {
        callbacks.onError('Unable to check payment status. Please try again later.');
        return;
      }
      setTimeout(poll, intervalMs);
    }
  };

  // Start polling after initial delay
  setTimeout(poll, intervalMs);

  // Return cleanup function
  return () => {
    stopped = true;
  };
}
