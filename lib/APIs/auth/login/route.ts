/**
 * User Login API
 * POST /api/remote/auth/login
 */

import { apiRequest, API_ENDPOINTS, setAuthToken } from '../../../db';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
  otpVerified: boolean; // Indicates if email is verified
  accountLocked: boolean; // Indicates if account is locked
  applicantId: string | null; // User ID (null on failure)
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
 */
export async function login(data: LoginRequest) {
  const response = await apiRequest<LoginResponse>(
    `${API_ENDPOINTS.AUTH}/login`,
    {
      method: 'POST',
      body: data,
    }
  );

  // Store token on successful login
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
