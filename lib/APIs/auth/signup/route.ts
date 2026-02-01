/**
 * User Signup API
 * POST /api/remote/auth/signup
 *
 * Enhanced with new API client featuring:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Rate limiting protection
 * - Production-safe logging
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerType: string; // Backend expects 'customerType', not 'userType'
  password: string;
}

export interface SignupResponse {
  action: number;
  message: string;
  // Backend may return different ID field names depending on endpoint version
  applicant_id?: string;
  applicantId?: string;
  customerId?: string;
  customer_id?: string;
  expr?: string;
}

/**
 * User Signup
 * Uses enhanced API client with automatic retry and error handling
 */
export async function signup(data: SignupRequest): Promise<ApiResponse<SignupResponse>> {
  const response = await apiClient.post<SignupResponse>(
    API_ENDPOINTS.AUTH.SIGNUP,
    data,
    {
      skipAuth: true, // Signup doesn't need existing auth token
      retries: 2, // Limit retries for auth
    }
  );

  return response;
}
