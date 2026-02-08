/**
 * Get Public Events List API Route
 * Fetches list of public events from the backend with pagination
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

/**
 * Public Event data returned from the API
 */
export interface PublicEvent {
  id: string;
  title: string;
  description?: string;
  eventType?: string;
  category?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  eventOrganizer?: string;
  eventVisibility?: string;
  eventTags?: string;
  coverImage?: string;
  bannerImage?: string;
  price?: number;
  status?: string;
  customerId?: string;
  photographerId?: string;
  photographerName?: string;
  guestCount?: number;
  maxGuests?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * Paginated response structure from backend
 */
export interface PaginatedEvents {
  content: PublicEvent[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      direction: string;
      property: string;
      ignoreCase: boolean;
      nullHandling: string;
      ascending: boolean;
      descending: boolean;
    }[];
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    direction: string;
    property: string;
    ignoreCase: boolean;
    nullHandling: string;
    ascending: boolean;
    descending: boolean;
  }[];
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

/**
 * Request parameters for fetching public events
 */
export interface GetPublicEventsRequest {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Fetch list of public events with optional pagination
 */
export async function getPublicEvents(
  params?: GetPublicEventsRequest
): Promise<ApiResponse<PaginatedEvents>> {
  const queryParams = new URLSearchParams();

  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  const sortColumn = params?.sortColumn ?? 'createdAt';
  const sortDirection = params?.sortDirection ?? 'desc';

  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  queryParams.append('sortColumn', sortColumn);
  queryParams.append('sortDirection', sortDirection);

  const endpoint = `${API_ENDPOINTS.PUBLIC.EVENTS_LIST}?${queryParams.toString()}`;

  const response = await apiClient.get<PaginatedEvents>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  return response;
}
