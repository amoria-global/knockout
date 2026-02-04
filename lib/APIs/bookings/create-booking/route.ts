/**
 * Create Booking API
 * POST /api/remote/bookings
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  photographerId: string;
  photographerName: string;
  photographerImage?: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  currency: string;
  eventDetails: {
    eventType: string;
    eventDate: string;
    eventTime: string;
    duration: string;
    location: {
      address: string;
      city: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    guestCount?: number;
    specialRequirements?: string;
  };
  status:
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  photographerId: string;
  packageId: string;
  eventDetails: {
    eventType: string;
    eventDate: string;
    eventTime: string;
    duration: string;
    location: {
      address: string;
      city: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    guestCount?: number;
    specialRequirements?: string;
  };
  addons?: {
    name: string;
    price: number;
    quantity: number;
  }[];
  notes?: string;
}

export interface CreateBookingResponse {
  booking: Booking;
  paymentUrl?: string;
  message: string;
}

/**
 * Create Booking (Legacy)
 * Uses enhanced API client with automatic retry and error handling
 * Requires authentication
 */
export async function createBooking(data: CreateBookingRequest): Promise<ApiResponse<CreateBookingResponse>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required to create bookings',
    };
  }

  const response = await apiClient.post<CreateBookingResponse>(
    API_ENDPOINTS.LEGACY.BOOKINGS,
    data,
    {
      retries: 1, // Less retries for write operations
    }
  );

  return response;
}

/**
 * Event Booking Request for customer/events/book endpoint
 */
export interface EventBookingRequest {
  photographerId: string;
  packageId: string;
  eventDate: string;
  eventTime: string;
  eventType: string;
  location: string;
  guestCount?: number;
  notes?: string;
}

/**
 * Event Booking Response
 */
export interface EventBookingResponse {
  id: string;
  status: string;
  message: string;
  booking?: Booking;
}

/**
 * Create Event Booking
 * POST /api/remote/customer/events/book
 * Requires authentication and client user type
 */
export async function createEventBooking(
  data: EventBookingRequest,
  clientId: string
): Promise<ApiResponse<EventBookingResponse>> {
  if (!isAuthenticated()) {
    return {
      success: false,
      error: 'Authentication required to create bookings',
    };
  }

  // Validate that client is not booking themselves
  if (clientId === data.photographerId) {
    return {
      success: false,
      error: 'You cannot book yourself',
    };
  }

  const response = await apiClient.post<EventBookingResponse>(
    API_ENDPOINTS.CUSTOMER.EVENTS_BOOK,
    data,
    {
      retries: 1,
    }
  );

  return response;
}
