/**
 * Public Stream Ads API
 * GET /api/remote/public/events/{eventId}/ads — get ads for a live stream
 * GET /api/remote/public/events/{eventId}/ads/trigger — poll for manual triggers
 * POST /api/remote/public/events/{eventId}/ads/{adId}/click — record ad click
 */

import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { StreamAd } from '@/app/components/StreamAdBanners';

export interface StreamAdSchedule {
  intervalSeconds: number;
  startAfterSeconds: number;
  enabled: boolean;
}

export interface StreamAdsResponse {
  ads: StreamAd[];
  schedule: StreamAdSchedule;
}

export interface StreamAdTriggerResponse {
  trigger: {
    id: string;
    adId: string;
    triggeredAt: string;
  } | null;
}

/**
 * Fetch ads assigned to an event (public, no auth)
 */
export async function getStreamAds(eventId: string): Promise<ApiResponse<StreamAdsResponse>> {
  return apiClient.get<StreamAdsResponse>(
    `/api/remote/public/events/${eventId}/banners`,
    { skipAuth: true, retries: 1 }
  );
}

/**
 * Poll for manual ad triggers (public, no auth)
 */
export async function pollAdTrigger(eventId: string): Promise<ApiResponse<StreamAdTriggerResponse>> {
  return apiClient.get<StreamAdTriggerResponse>(
    `/api/remote/public/events/${eventId}/banners/trigger`,
    { skipAuth: true, retries: 0 }
  );
}

/**
 * Record an ad click (public, no auth)
 */
export async function recordAdClick(eventId: string, adId: string, viewerId?: string): Promise<ApiResponse<void>> {
  return apiClient.post<void>(
    `/api/remote/public/events/${eventId}/banners/${adId}/click`,
    { viewerId: viewerId || null },
    { skipAuth: true, retries: 0 }
  );
}
