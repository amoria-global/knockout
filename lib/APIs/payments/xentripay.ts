/**
 * XentriPay Payment API
 * Handles payment initiation and status checking via XentriPay gateway
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

// ==================== Types ====================

/**
 * `country` (ISO-2, e.g. "RW", "KE") is optional on every request.
 * When omitted the backend falls back to IP geo + then "RW", which
 * preserves pre-multi-country behavior. When present the router uses
 * it to pick the right gateway (PawaPay for non-RW, XentriPay backup
 * for RW only).
 */

export interface XentriPayInitiateRequest {
  declarationId?: string;
  eventId?: string;
  donationAmount?: number;
  phone?: string;
  telecomProvider?: string; // 'MTN' | 'AIRTEL' | 'MPESA' | …
  paymentMethod: string;   // 'MOBILE_MONEY' | 'CARD'
  redirectUrl?: string;
  country?: string;
}

export interface XentriPayDonationRequest {
  donationId: string;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
  country?: string;
}

export interface XentriPayPhotoPurchaseRequest {
  eventId: string;
  amount: number;
  currencyId: string;
  donationAmount?: number;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
  country?: string;
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
  donationAmount?: number;
  country?: string;
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
  donationAmount?: number;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
  country?: string;
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
  country?: string;
}

/**
 * TikTok-style live gift. Send `giftCode` (catalog gift, server derives the
 * exact USD amount from gift_types) OR a free-form `amount` + `currencyId`.
 * `currencyId` should still accompany giftCode when a donationAmount rides
 * along, so the backend knows what currency the donation is denominated in.
 */
export interface XentriPayGiftRequest {
  eventId: string;
  giftCode?: string;
  amount?: number;
  currencyId?: string;
  message?: string;
  donationAmount?: number;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
  country?: string;
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
 * Initiate a live gift payment (authenticated viewer). Catalog gifts send
 * giftCode and the backend charges the exact catalog USD amount.
 */
export async function initiateXentriPayGift(
  data: XentriPayGiftRequest
): Promise<ApiResponse<XentriPayResponse>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required' };
  }

  return apiClient.post<XentriPayResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE_GIFT,
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
 *
 * Backend now returns an `unlockCode` the buyer can use to re-download
 * these photos later from any device without re-entering details.
 */
export interface RecordAlbumPurchaseResponse {
  refid?: string;
  status?: string;
  photographerEarning?: number | string;
  platformFee?: number | string;
  unlockCode?: string;
}

export async function recordAlbumPurchase(
  refid: string,
  buyerId?: string
): Promise<ApiResponse<RecordAlbumPurchaseResponse>> {
  return apiClient.post<RecordAlbumPurchaseResponse>(
    API_ENDPOINTS.PAYMENTS.RECORD_ALBUM_PURCHASE,
    buyerId ? { refid, buyerId } : { refid },
    { skipAuth: true, retries: 1 }
  );
}

/**
 * One slice of a multi-album purchase: photos from a single gallery, with
 * the FE-computed amount + currency for that slice. The buyer pays one
 * combined total via XentriPay; the backend persists N AlbumPurchase rows
 * sharing one refid (one per gallery) so each photographer gets the
 * correct revenue split. Use this when a face-scan match spans multiple
 * photographers' albums; for single-album buys, prefer the existing
 * initiate-album-purchase endpoint.
 */
export interface MultiAlbumPurchaseItem {
  albumId: string;
  photoIds: string[];
  amount: number;
  currencyId: string;
}

export interface InitiateMultiAlbumResponse {
  refid: string;
  paymentUrl?: string;
  totalAmountRwf: number;
  itemCount: number;
}

export async function initiateMultiAlbumPurchase(
  data: {
    items: MultiAlbumPurchaseItem[];
    buyerId?: string;
    phone: string;
    telecomProvider?: string;
    paymentMethod: 'MOBILE_MONEY' | 'CARD';
    viewerEmail?: string;
    redirectUrl?: string;
    // Combined-with-purchase donation. Backend charges the gateway
    // for items.total + donationAmount and splits 100% of the
    // donation to the platform Donation table at finalisation —
    // never mixed into any photographer's 70/30 payout.
    donationAmount?: number;
    donationCurrency?: string;
    country?: string;
  }
): Promise<ApiResponse<InitiateMultiAlbumResponse>> {
  return apiClient.post<InitiateMultiAlbumResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_INITIATE_MULTI_ALBUM_PURCHASE,
    data,
    { skipAuth: true, retries: 0 }
  );
}

/**
 * Initiate streaming payment for anonymous viewers (public, no auth required)
 */
export async function initiateAnonymousStreamingPayment(
  eventId: string,
  data: {
    viewerId: string;
    amount: number;
    currencyId: string;
    donationAmount?: number;
    /**
     * Number of viewers being purchased for. When > 1 the backend
     * server-side computes streamFee × viewerCount × (1 − groupDiscount/100)
     * - the FE-passed `amount` is informational only.
     */
    viewerCount?: number;
    phone?: string;
    telecomProvider?: string;
    paymentMethod: string;
    redirectUrl?: string;
    country?: string;
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

  // Reading a payment's status is not privileged, and the caller may be an
  // anonymous buyer who has already been charged. Refusing here used to make
  // the poller spin until it timed out and then report a successful payment
  // as failed. Fall through to the public endpoint instead, which resolves
  // the same refid, so a missing token can never strand a paid buyer.
  if (!isAuthenticated()) {
    return apiClient.get<XentriPayStatusResponse>(
      API_ENDPOINTS.PAYMENTS.XENTRIPAY_PUBLIC_STATUS(refid),
      { skipAuth: true, retries: 1 }
    );
  }

  return apiClient.get<XentriPayStatusResponse>(
    API_ENDPOINTS.PAYMENTS.XENTRIPAY_STATUS(refid),
    { retries: 1 }
  );
}

/**
 * Poll payment status until it settles (SUCCESS or FAILED)
 * Returns a cleanup function to stop polling.
 *
 * `gracePeriodMs`: ignore FAILED responses received before this much wall
 * time has elapsed. Card payments need this — XentriPay returns FAILED on
 * a freshly-created card session that the user hasn't finished paying yet,
 * which used to flip the modal to "Payment Failed" before the user could
 * even type their card number. With a grace period we keep polling through
 * those early FAILEDs and only honor them after the user has had time to
 * actually go through the gateway page. SUCCESS is always honored
 * immediately.
 */
export function pollXentriPayStatus(
  refid: string,
  callbacks: {
    onSuccess: (data: XentriPayStatusResponse) => void;
    onFailure: (data: XentriPayStatusResponse) => void;
    onError: (error: string) => void;
  },
  intervalMs: number = 2000,
  maxAttempts: number = 150, // ~5 minutes at 2s intervals
  usePublic: boolean = false,
  gracePeriodMs: number = 0
): () => void {
  let attempts = 0;
  let stopped = false;
  const startedAt = Date.now();

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
        // Inside the grace window, treat FAILED as "still pending" — the
        // gateway often reports FAILED on a freshly-created card session.
        if (Date.now() - startedAt < gracePeriodMs) {
          if (attempts >= maxAttempts) {
            callbacks.onError('Payment is taking longer than expected. Please check your payment history.');
            return;
          }
          setTimeout(poll, intervalMs);
          return;
        }
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
