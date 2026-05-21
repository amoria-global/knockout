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

import { apiClient, setAuthToken, setRefreshToken } from '@/lib/api/client';
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
  userType?: string;
  customerType?: string;
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
  twoFactorRequired?: boolean; // True when TOTP verification is needed (action=2)
  twoFactorSetupRequired?: boolean; // True when 2FA setup is mandatory (balance > 0, action=1)
  token?: string; // JWT token (success login, OR minted pre-OTP for the completion gate)
  refreshToken?: string; // Refresh token UUID (only on successful login)
  // Photographer profile-completion gate. Non-photographers read 100 / [].
  profileCompletionPercentage?: number;
  missingItems?: string[];
  // Forced first-login password change. Set true by the backend when the
  // Customer.isPasswordChanged is false (i.e. an invited team member who
  // just signed in with the temp password from their invitation email).
  // Knockout's login handler routes these users to /user/auth/change-password
  // BEFORE the dashboard hand-off so they never see a flash of UI they
  // can't fully use.
  mustChangePassword?: boolean;
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

  // Store tokens on successful login (skip if 2FA verification is pending)
  if (response.success && response.data?.token && !response.data?.twoFactorRequired) {
    setAuthToken(response.data.token);
  }
  if (response.success && response.data?.refreshToken && !response.data?.twoFactorRequired) {
    setRefreshToken(response.data.refreshToken);
  }

  return response;
}
