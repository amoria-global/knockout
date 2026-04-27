import { useState, useEffect } from 'react';

interface GeoCheckResult {
  allowed: boolean;
  mode?: string;
  userCity?: string;
  userCountry?: string;
  allowedCountries?: string[];
  blockedCountries?: string[];
  allowedCities?: string[];
  blockedCities?: string[];
  allowedPaymentMethods?: string[];
  blockReason?: string;
}

export const useEventGeoCheck = (eventId: string | null, cityName?: string) => {
  const [geoStatus, setGeoStatus] = useState<GeoCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const checkGeoAccess = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/remote/events/${eventId}/geo-check${cityName ? `?cityName=${encodeURIComponent(cityName)}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Geo check failed');
        }

        const result: GeoCheckResult = await response.json();
        setGeoStatus(result);
      } catch (err) {
        console.error('Geo check failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fail-open: Allow access if geo-check fails
        setGeoStatus({ allowed: true });
      } finally {
        setLoading(false);
      }
    };

    checkGeoAccess();
  }, [eventId, cityName]);

  return { geoStatus, loading, error };
};
