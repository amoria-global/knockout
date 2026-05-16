/**
 * Email-availability Pre-check API
 *
 * POST /api/remote/auth/check-email
 *
 * Returns whether an email is already registered WITHOUT creating anything.
 * Used to gate the photographer onboarding wizard: the email is entered on
 * the signup form but the real signup() call is deferred to the wizard's
 * last (6th) step - so we check it here first and refuse to open the wizard
 * for an email the backend would reject six steps later.
 *
 * Always resolves (HTTP 200). action === 1 → available;
 * action === 0 → taken (message is the same copy signup would show).
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface CheckEmailResponse {
  action: number;
  message: string;
}

export async function checkEmail(
  email: string
): Promise<ApiResponse<CheckEmailResponse>> {
  return apiClient.post<CheckEmailResponse>(
    API_ENDPOINTS.AUTH.CHECK_EMAIL,
    { email },
    { skipAuth: true, retries: 1 }
  );
}
