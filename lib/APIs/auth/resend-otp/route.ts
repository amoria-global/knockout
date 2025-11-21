/**
 * Resend OTP API
 * POST /api/remote/auth/resend-otp
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

export interface ResendOtpRequest {
  applicantId: string; // Backend expects applicantId (UUID), not email
}

export interface ResendOtpResponse {
  action: number; // 0 = failure, 1 = success
  expr: string; // Timestamp
  message: string;
  applicant_id: string; // Backend uses snake_case
}

/**
 * Resend OTP
 */
export async function resendOtp(data: ResendOtpRequest) {
  // Backend expects query parameters, not body
  const queryParams = new URLSearchParams({ applicantId: data.applicantId });

  const response = await apiRequest<ResendOtpResponse>(
    `${API_ENDPOINTS.AUTH}/resend-otp?${queryParams}`,
    {
      method: 'POST',
    }
  );

  return response;
}
