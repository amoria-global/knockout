/**
 * Password Pre-check API
 *
 * POST /api/remote/auth/validate-password
 *
 * Runs the backend's PasswordPolicyService rules (length / char-class /
 * HaveIBeenPwned breach corpus) WITHOUT creating an account. Used to gate
 * the photographer onboarding wizard: the password is entered on the signup
 * form, but the real signup() call is deferred to the wizard's last step -
 * so we check it here first and refuse to open the wizard with a password
 * the backend would reject six steps later.
 *
 * Always resolves (HTTP 200). action === 1 means the password is fine;
 * action === 0 carries the same human-readable reason signup would show
 * (e.g. "This password has appeared in a known data breach…").
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface ValidatePasswordResponse {
  action: number;
  message: string;
}

export async function validatePassword(
  password: string
): Promise<ApiResponse<ValidatePasswordResponse>> {
  return apiClient.post<ValidatePasswordResponse>(
    API_ENDPOINTS.AUTH.VALIDATE_PASSWORD,
    { password },
    { skipAuth: true, retries: 1 }
  );
}
