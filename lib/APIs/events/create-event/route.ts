/**
 * Create Event API
 * POST /api/remote/customer/events/book
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface CreateEventRequest {
  title: string;
  description?: string;
  eventType?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  photographerId?: string;
  guestCount?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface CreateEventResponse {
  action: number;
  message: string;
  data?: {
    id: string;
    title: string;
    status: string;
  };
}

/**
 * Create/book a new event
 */
export async function createEvent(data: CreateEventRequest): Promise<ApiResponse<CreateEventResponse>> {
  return apiClient.post<CreateEventResponse>(
    API_ENDPOINTS.CUSTOMER.EVENTS_BOOK,
    data,
    { retries: 2 }
  );
}
