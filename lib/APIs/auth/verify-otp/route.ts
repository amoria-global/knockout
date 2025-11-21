/**
 * Verify OTP (Email Confirmation) API
 * POST /api/remote/auth/verify-otp
 */

import { apiRequest, API_ENDPOINTS, setAuthToken } from '../../../db';

export interface VerifyOtpRequest {
  applicantId: string; // Backend expects applicantId (UUID), not email
  otp: number; // Backend expects otp as a number, not string
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Verify OTP (Email Confirmation)
 */
export async function verifyOtp(data: VerifyOtpRequest) {
  const response = await apiRequest<VerifyOtpResponse>(
    `${API_ENDPOINTS.AUTH}/verify-otp`,
    {
      method: 'POST',
      body: data,
    }
  );

  // If verification successful and token provided, store it
  if (response.success && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}
