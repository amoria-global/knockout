/**
 * Create Event API
 * POST /api/remote/customer/events/book
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface CreateEventRequest {
  title: string;
  /** Required by the server when an event is created: whether viewers may invite others to send wishes. */
  allowWishInvites?: boolean;
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
    event?: { id: string; title: string; status: string; [key: string]: unknown };
    booking?: { id: string; [key: string]: unknown };
    declarationId?: string;
    paymentAmount?: number;
    currencyAbbreviation?: string;
    currencyId?: string;
    id?: string;
    title?: string;
    status?: string;
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
