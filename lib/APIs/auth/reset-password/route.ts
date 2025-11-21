/**
 * Reset Password API
 * POST /api/remote/auth/reset-password
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

export interface ResetPasswordRequest {
  email: string;
  token: string; // Backend expects 'token', not 'code'
  password: string; // Backend expects 'password', not 'newPassword'
  confirmPassword: string; // Backend requires confirmPassword
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
  action?: number;
}

/**
 * Reset Password (with token)
 */
export async function resetPassword(data: ResetPasswordRequest) {
  // Backend expects query parameters, not body
  const queryParams = new URLSearchParams({
    email: data.email,
    token: data.token,
    password: data.password,
    confirmPassword: data.confirmPassword,
  });

  const response = await apiRequest<ResetPasswordResponse>(
    `${API_ENDPOINTS.AUTH}/reset-password?${queryParams}`,
    {
      method: 'POST',
    }
  );

  return response;
}
