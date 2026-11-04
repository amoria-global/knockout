/**
 * Verify OTP (Email Confirmation) API
 * POST /api/remote/auth/verify-otp
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient, setAuthToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface VerifyOtpRequest {
  customerId: string; // Backend expects customerId (UUID)
  /** The 6-digit code as typed. A number is still accepted (older call sites) and padded back to 6 digits. */
  otp: string | number;
}

export interface VerifyOtpResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
  token?: string;
  customerId?: string;
  customerType?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  // Profile-completion gate (shown right after verification).
  profileCompletionPercentage?: number;
  missingItems?: string[];
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Verify OTP (Email Confirmation)
 * Uses enhanced API client with automatic retry and error handling
 */
export async function verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<VerifyOtpResponse>> {
  const response = await apiClient.post<VerifyOtpResponse>(
    API_ENDPOINTS.AUTH.VERIFY_OTP,
    // A string, never a number: a code can start with 0, which a number drops (012345 becomes 12345).
    { customerId: data.customerId, otp: typeof data.otp === 'number' ? String(data.otp).padStart(6, '0') : data.otp },
    {
      skipAuth: true,
      // No retries: a repeat would spend one of the 3 tries the server allows.
      retries: 0,
    }
  );

  // If verification successful and token provided, store it
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
