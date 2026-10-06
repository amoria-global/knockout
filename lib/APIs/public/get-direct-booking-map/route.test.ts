import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDirectBookingMap, calculateHaversineDistanceKm } from './route';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('Direct Booking Map API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateHaversineDistanceKm', () => {
    it('calculates distance between coordinate points accurately', () => {
      // Kigali center (-1.9441, 30.0619) to near Kigali Convention Centre (-1.9536, 30.0936) ~ 3.67 km
      const distance = calculateHaversineDistanceKm(-1.9441, 30.0619, -1.9536, 30.0936);
      expect(distance).toBeGreaterThan(3);
      expect(distance).toBeLessThan(4.5);
    });

    it('returns 0 for identical coordinates', () => {
      const distance = calculateHaversineDistanceKm(-1.9441, 30.0619, -1.9441, 30.0619);
      expect(distance).toBe(0);
    });
  });

  describe('getDirectBookingMap', () => {
    it('calls the direct booking map endpoint with formatted query parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          clientLocation: {
            latitude: -1.9441,
            longitude: 30.0619,
            city: 'Kigali',
            country: 'Rwanda',
            message: 'You are here',
            isCurrentLocation: true,
          },
          radiusKm: 25,
          totalNearby: 1,
          photographers: [
            {
              photographerId: 'p-1',
              fullName: 'Jean Mutabazi',
              latitude: -1.945,
              longitude: 30.063,
              distanceKm: 0.16,
              distanceFormatted: '0.2 km away',
              specialties: ['WEDDING'],
              rating: 4.9,
              reviewCount: 40,
              verified: true,
              startingPrice: 150000,
              currency: 'RWF',
              directBookingEnabled: true,
              packages: [],
            },
          ],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

      const res = await getDirectBookingMap({
        lat: -1.9441,
        lng: 30.0619,
        radiusKm: 25,
        specialty: 'WEDDING',
        eventDate: '2026-11-20',
        search: 'Jean',
      });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      const [calledUrl, options] = vi.mocked(apiClient.get).mock.calls[0];

      expect(calledUrl).toContain(API_ENDPOINTS.PUBLIC.DIRECT_BOOKING_MAP);
      expect(calledUrl).toContain('lat=-1.9441');
      expect(calledUrl).toContain('lng=30.0619');
      expect(calledUrl).toContain('radiusKm=25');
      expect(calledUrl).toContain('specialty=WEDDING');
      expect(calledUrl).toContain('eventDate=2026-11-20');
      expect(calledUrl).toContain('search=Jean');
      expect(options).toEqual({ skipAuth: true, retries: 2 });

      expect(res.data?.clientLocation.message).toBe('You are here');
      expect(res.data?.photographers).toHaveLength(1);
    });

    it('works without optional parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          clientLocation: {
            latitude: -1.9441,
            longitude: 30.0619,
            message: 'You are here',
          },
          radiusKm: 25,
          photographers: [],
        },
      } as any);

      await getDirectBookingMap();

      expect(apiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.PUBLIC.DIRECT_BOOKING_MAP,
        { skipAuth: true, retries: 2 }
      );
    });
  });
});
