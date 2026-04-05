/**
 * XentriPay Payment API
 * Handles payment initiation and status checking via XentriPay gateway
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// ==================== Types ====================

export interface XentriPayInitiateRequest {
  declarationId?: string;
  eventId?: string;
  phone?: string;
  telecomProvider?: string; // 'MTN' | 'AIRTEL'
  paymentMethod: string;   // 'MOBILE_MONEY' | 'CARD'
  redirectUrl?: string;
}

export interface XentriPayDonationRequest {
  donationId: string;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
}

export interface XentriPayPhotoPurchaseRequest {
  eventId: string;
  amount: number;
  currencyId: string;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
}

export interface XentriPayAlbumPurchaseRequest {
  albumId: string;
  buyerId: string;
  photoIds: string[];
  amount: number;
  currencyId: string;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
}

// Backend returns 409 with this shape when some photoIds are already owned
export interface AlreadyPurchasedError {
  alreadyPurchased: string[];
  message?: string;
}

export interface XentriPayTipRequest {
  eventId: string;
  amount: number;
  currencyId: string;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
}

export interface XentriPayStreamingRequest {
  eventId: string;
  amount: number;
  currencyId: string;
  donationAmount?: number;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
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
 * Initiate donation payment via XentriPay (public, no auth required)
 */
export async function initiateXentriPayDonation(
  data: XentriPayDonationRequest
): Promise<ApiResponse<XentriPayResponse>> {
  return apiClient.post<XentriPayResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE_DONATION,
    data,
    { skipAuth: true, retries: 1 }
  );
}

/**
 * Initiate photo purchase payment via XentriPay
 */
export async function initiateXentriPayPhotoPurchase(
  data: XentriPayPhotoPurchaseRequest
): Promise<ApiResponse<XentriPayResponse>> {
  return apiClient.post<XentriPayResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE_PHOTO_PURCHASE,
    data,
    { skipAuth: true, retries: 1 }
  );
}

/**
 * Initiate album (paid photo) purchase via XentriPay (public, no auth required)
 */
export async function initiateXentriPayAlbumPurchase(
  data: XentriPayAlbumPurchaseRequest
): Promise<ApiResponse<XentriPayResponse>> {
  return apiClient.post<XentriPayResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE_ALBUM_PURCHASE,
    data,
    { skipAuth: true, retries: 1 }
  );
}

/**
 * Record a successful album purchase (public, no auth required)
 * Triggers photographer earnings, receipt email, and marks photos as purchased.
 * Pass buyerId to late-bind the purchase to a persistent buyer identity.
 */
export async function recordAlbumPurchase(
  refid: string,
  buyerId?: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.post<{ message: string }>(
    API_ENDPOINTS.PAYMENTS.RECORD_ALBUM_PURCHASE,
    buyerId ? { refid, buyerId } : { refid },
    { skipAuth: true, retries: 1 }
  );
}

/**
 * Initiate streaming payment for anonymous viewers (public, no auth required)
 */
export async function initiateAnonymousStreamingPayment(
  eventId: string,
  data: {
    viewerId: string;
    phone?: string;
    telecomProvider?: string;
    paymentMethod: string;
    redirectUrl?: string;
  }
): Promise<ApiResponse<XentriPayResponse>> {
  return apiClient.post<XentriPayResponse>(
    `/api/remote/public/anonymous-viewer/${eventId}/initiate-payment`,
    data,
    { skipAuth: true, retries: 1 }
  );
}

/**
 * Check anonymous viewer payment status (public, no auth required)
 */
export async function checkAnonymousPaymentStatus(
  eventId: string,
  body: { viewerId: string; refid: string }
): Promise<ApiResponse<XentriPayStatusResponse>> {
  return apiClient.post<XentriPayStatusResponse>(
    `/api/remote/public/anonymous-viewer/${eventId}/payment-status`,
    body,
    { skipAuth: true, retries: 1 }
  );
}

/**
 * Check payment status by reference ID
 */
export async function checkXentriPayStatus(
  refid: string,
  usePublic: boolean = false
): Promise<ApiResponse<XentriPayStatusResponse>> {
  if (usePublic) {
    return apiClient.get<XentriPayStatusResponse>(
      API_ENDPOINTS.PAYMENTS.XENTRIPAY_PUBLIC_STATUS(refid),
      { skipAuth: true, retries: 1 }
    );
  }

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
  maxAttempts: number = 60, // 5 minutes at 5s intervals
  usePublic: boolean = false
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;

    try {
      const response = await checkXentriPayStatus(refid, usePublic);

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
