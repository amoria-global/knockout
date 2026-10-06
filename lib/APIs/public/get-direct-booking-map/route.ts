/**
 * Direct Booking Map API Route
 * Matches backend DirectBookingMapController (commit 1957e777).
 * Endpoint: GET /api/remote/direct-booking/map
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface ClientLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  message?: string;
  detectedFrom?: string;
  isCurrentLocation?: boolean;
  currentLocation?: boolean;
}

export interface DirectBookingPackageItem {
  packageId: string;
  name: string;
  price: number;
  currency: string;
  durationHours?: number;
  deliveryDays?: number;
  features?: string[];
}

export interface NearbyPhotographerMapItem {
  photographerId: string;
  fullName: string;
  businessName?: string;
  profilePicture?: string;
  coverImage?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceFormatted: string;
  city?: string;
  country?: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  startingPrice: number;
  currency: string;
  directBookingEnabled: boolean;
  packages: DirectBookingPackageItem[];
}

export interface DirectBookingMapData {
  clientLocation: ClientLocation;
  radiusKm: number;
  totalNearby?: number;
  totalFound?: number;
  photographers: NearbyPhotographerMapItem[];
}

export interface GetDirectBookingMapParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  specialty?: string;
  eventDate?: string;
  search?: string;
}

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Fetch nearby photographers eligible for direct booking on the interactive map.
 */
export async function getDirectBookingMap(
  params?: GetDirectBookingMapParams
): Promise<ApiResponse<DirectBookingMapData>> {
  const queryParams = new URLSearchParams();

  if (typeof params?.lat === 'number') queryParams.append('lat', params.lat.toString());
  if (typeof params?.lng === 'number') queryParams.append('lng', params.lng.toString());
  if (typeof params?.radiusKm === 'number') queryParams.append('radiusKm', params.radiusKm.toString());
  if (params?.specialty && params.specialty !== 'all' && params.specialty !== 'All Categories') {
    queryParams.append('specialty', params.specialty);
  }
  if (params?.eventDate) queryParams.append('eventDate', params.eventDate);
  if (params?.search?.trim()) queryParams.append('search', params.search.trim());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${API_ENDPOINTS.PUBLIC.DIRECT_BOOKING_MAP}?${queryString}`
    : API_ENDPOINTS.PUBLIC.DIRECT_BOOKING_MAP;

  return apiClient.get<DirectBookingMapData>(endpoint, {
    skipAuth: true,
    retries: 2,
  });
}
