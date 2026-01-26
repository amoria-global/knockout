/**
 * User Login API
 * POST /api/remote/auth/login
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
  // User data fields (from actual login response)
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  token_expiry?: string;
  // Status fields
  otpVerified?: boolean | string; // Indicates if email is verified (backend may send boolean or string)
  accountLocked?: boolean | string; // Indicates if account is locked
  otpExpiry?: string; // OTP expiry timestamp (when OTP is resent)
  // Backend may return different ID field names
  applicantId?: string | null;
  applicant_id?: string | null;
  customerId?: string | null;
  customer_id?: string | null;
  token?: string; // JWT token (only on successful login)
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    profileImage?: string;
  };
}

/**
 * User Login
 * Uses enhanced API client with automatic retry and error handling
 */
export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    data,
    {
      skipAuth: true, // Login doesn't need existing auth token
      retries: 2, // Limit retries for auth to prevent lockouts
    }
  );

  // Store token on successful login
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
