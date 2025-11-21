/**
 * Forgot Password API
 * POST /api/remote/auth/forgot-password
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  action: number; // 0 = failure, 1 = success
  message: string;
}

/**
 * Forgot Password (Request Reset)
 */
export async function forgotPassword(data: ForgotPasswordRequest) {
  // Backend expects query parameters, not body
  const queryParams = new URLSearchParams({ email: data.email });

  const response = await apiRequest<ForgotPasswordResponse>(
    `${API_ENDPOINTS.AUTH}/forgot-password?${queryParams}`,
    {
      method: 'POST',
    }
  );

  return response;
}
