/**
 * Create Booking API
 * POST /api/remote/bookings
 */

import { apiRequest, API_ENDPOINTS, getAuthToken } from '../../../db';

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
 * Create Booking
 */
export async function createBooking(data: CreateBookingRequest) {
  const token = getAuthToken();

  if (!token) {
    return {
      success: false,
      error: 'Authentication required to create bookings',
    };
  }

  const response = await apiRequest<CreateBookingResponse>(
    API_ENDPOINTS.BOOKINGS,
    {
      method: 'POST',
      body: data,
      token,
    }
  );

  return response;
}
