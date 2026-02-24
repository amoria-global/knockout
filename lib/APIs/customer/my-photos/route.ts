/**
 * My Photos API
 * GET /api/remote/customer/events/my-photos
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface MyPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  eventId?: string;
  eventTitle?: string;
  photographerId?: string;
  photographerName?: string;
  createdAt?: string;
  alt?: string;
}

export interface GetMyPhotosResponse {
  action: number;
  message: string;
  data: MyPhoto[];
}

export interface GetMyPhotosParams {
  eventId?: string;
  page?: number;
  size?: number;
}

/**
 * Get photos for the authenticated user
 */
export async function getMyPhotos(params?: GetMyPhotosParams): Promise<ApiResponse<GetMyPhotosResponse>> {
  const queryParams = new URLSearchParams();

  if (params?.eventId) queryParams.append('eventId', params.eventId);
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.CUSTOMER.MY_PHOTOS}?${queryString}`
    : API_ENDPOINTS.CUSTOMER.MY_PHOTOS;

  return apiClient.get<GetMyPhotosResponse>(endpoint, { retries: 2 });
}
