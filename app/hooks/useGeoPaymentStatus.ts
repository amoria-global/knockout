'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface GeoPaymentStatus {
  allowed: boolean;
  blocked?: boolean;
  country?: string;
  countryCode?: string;
  disableMobileMoney?: boolean;
  disableCards?: boolean;
  message?: string;
  reason?: string;
  warning?: string;
  loading: boolean;
  error?: string;
}

/**
 * Hook to check if payments are allowed from the user's current location
 * Calls backend API to determine geo-restrictions
 */
export function useGeoPaymentStatus(): GeoPaymentStatus {
  const [status, setStatus] = useState<GeoPaymentStatus>({
    allowed: true, // Default to allowed (fail-open)
    loading: true,
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await apiClient.get<any>(
          '/api/remote/geo/payment-status',
          { skipAuth: true } // Public endpoint
        );

        if (response.success && response.data) {
          const data = response.data;

          setStatus({
            allowed: data.allowed !== false, // Default to true if not explicitly false
            blocked: data.blocked === true,
            country: data.country,
            countryCode: data.countryCode,
            disableMobileMoney: data.disableMobileMoney === true,
            disableCards: data.disableCards === true,
            message: data.message,
            reason: data.reason,
            warning: data.warning,
            loading: false,
          });
        } else {
          // API call succeeded but returned error - fail open
          console.warn('Geo status check returned error, allowing payments');
          setStatus({
            allowed: true,
            loading: false,
            warning: 'Could not verify location',
          });
        }
      } catch (error) {
        // Network error or API down - fail open to avoid breaking payments
        console.error('Geo status check failed:', error);
        setStatus({
          allowed: true,
          loading: false,
          error: 'Could not verify location',
        });
      }
    }

    checkStatus();
  }, []); // Run once on mount

  return status;
}
