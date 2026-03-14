/**
 * Get Public Events List API Route
 * Fetches list of public events from the backend with pagination
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

/**
 * Public Event data returned from the API
 */
/**
 * Photographer nested object from the API
 */
export interface EventPhotographer {
  id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  address?: string;
  coverPicture?: string;
}

/**
 * Creator nested object from the API
 */
export interface EventCreator {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  customerType?: string;
}

/**
 * Event category object from the API
 */
export interface EventCategory {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface PublicEvent {
  id: string;
  title: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  eventOrganizer?: string;
  eventTags?: string;
  eventPhoto?: string;
  eventCategory?: EventCategory | null;
  price?: number;
  eventStatus?: string;
  completionStatus?: string;
  bookingStatus?: string;
  maxGuests?: number;
  photographer?: EventPhotographer;
  creator?: EventCreator;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  streamFee?: number | null;
  streamFeeCurrencySymbol?: string | null;
  streamFeeCurrencyAbbreviation?: string | null;
  hasLiveStream?: boolean | null;
  streamType?: 'entry_fee' | 'invite_token' | null;
  hasInviteCode?: boolean | null;
  liveInputId?: string | null;
  hlsManifestUrl?: string | null;
  eventPriceId?: string | null;
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
  category?: string;   // exact category name e.g. "Birthday"
  location?: string;   // district/city name
  status?: string;     // UPCOMING | ONGOING | COMPLETED
  dateRange?: string;  // today | tomorrow | this-week | this-month | next-month
  search?: string;     // keyword search
}

/**
 * Fetch a single public event by ID
 */
export async function getPublicEventById(
  id: string
): Promise<ApiResponse<PublicEvent>> {
  const endpoint = API_ENDPOINTS.PUBLIC.EVENT_BY_ID(id);
  return apiClient.get<PublicEvent>(endpoint, { skipAuth: !isAuthenticated(), retries: 2 });
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
  if (params?.category)  queryParams.append('category', params.category);
  if (params?.location)  queryParams.append('location', params.location);
  if (params?.status)    queryParams.append('status', params.status);
  if (params?.dateRange) queryParams.append('dateRange', params.dateRange);
  if (params?.search)    queryParams.append('search', params.search);

  const endpoint = `${API_ENDPOINTS.PUBLIC.EVENTS_LIST}?${queryParams.toString()}`;

  const response = await apiClient.get<PaginatedEvents>(endpoint, {
    skipAuth: true,
    retries: 2,
  });

  return response;
}

