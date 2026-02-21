/**
 * Google Authentication API
 * POST /api/remote/auth/google
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

export interface GoogleAuthRequest {
  email: string;
  firstName: string;
  lastName: string;
  customerType: string; // Allowed: "Photographer", "Coordinator", "Client"
}

export interface GoogleAuthResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  otpVerified?: boolean;
  accountLocked?: boolean;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
  customerType?: string;
  profilePicture?: string | null;
  coverPicture?: string | null;
  token?: string;
  refreshToken?: string;
  token_expiry?: string;
  refreshToken_expiry?: string;
}

/**
 * Google Authentication
 * Uses enhanced API client with automatic retry and error handling
 * Backend expects query parameters, not request body
 */
export async function googleAuth(data: GoogleAuthRequest): Promise<ApiResponse<GoogleAuthResponse>> {
  const queryParams = new URLSearchParams({
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    customerType: data.customerType,
  });

  const response = await apiClient.post<GoogleAuthResponse>(
    `${API_ENDPOINTS.AUTH.GOOGLE}?${queryParams}`,
    undefined,
    {
      skipAuth: true, // Google auth doesn't need existing auth token
      retries: 2,
    }
  );

  // Store token on successful authentication
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
