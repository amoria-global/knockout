/**
 * Set New Password API
 * POST /api/remote/auth/set-new-password
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

export interface SetNewPasswordRequest {
  email: string;
  code: string; // Verification code from forgot-password email (not in Swagger but required by backend)
  password: string; // Backend requires both 'password'
  newPassword: string; // and 'newPassword' fields
  confirmPassword: string; // Password confirmation
}

export interface SetNewPasswordResponse {
  message: string;
  action: number; // Backend returns action: 0 (failure) or 1 (success)
}

/**
 * Set New Password
 */
export async function setNewPassword(data: SetNewPasswordRequest) {
  const response = await apiRequest<SetNewPasswordResponse>(
    `${API_ENDPOINTS.AUTH}/set-new-password`,
    {
      method: 'POST',
      body: data,
    }
  );

  return response;
}
