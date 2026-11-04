/**
 * Second sign-in step
 * POST /api/remote/auth/verify-totp         authenticator code
 * POST /api/remote/auth/2fa/email/verify    email code
 * POST /api/remote/auth/2fa/email/send      email a code
 *
 * The contract is the backend's docs/TWO_FACTOR.md. The server decides whether a code is right, how
 * many tries are left and when a new code may be asked for; this file only carries the answers.
 * Clients send the signed `challengeId` from the login answer; the bare `customerId` is accepted by
 * the server only until 2026-12-04 and only for installed apps that cannot send a challenge.
 */

import { apiClient, setAuthToken, setRefreshToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export type TwoFactorMethod = 'TOTP' | 'EMAIL';

export interface VerifyTotpRequest {
  /** Signed challenge from the login answer. Preferred. */
  challengeId?: string;
  /** Legacy form, kept only so an old link still works until the server's cutoff. */
  customerId?: string;
  code: string;
}

export interface VerifyTotpResponse {
  action: number;
  message: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  customerId?: string;
  customerType?: string;
  profilePicture?: string | null;
  coverPicture?: string | null;
  token?: string;
  refreshToken?: string;
  token_expiry?: string;
  refreshToken_expiry?: string;
  /** Present on a refused check. */
  errorCode?: string;
  attemptsLeft?: number;
  retryAfterSeconds?: number;
  expiresAt?: string;
}

function body(data: VerifyTotpRequest): VerifyTotpRequest {
  return data.challengeId ? { challengeId: data.challengeId, code: data.code } : { customerId: data.customerId, code: data.code };
}

async function finish(response: ApiResponse<VerifyTotpResponse>): Promise<ApiResponse<VerifyTotpResponse>> {
  // Store tokens on a successful verification
  if (response.success && response.data?.token) setAuthToken(response.data.token);
  if (response.success && response.data?.refreshToken) setRefreshToken(response.data.refreshToken);
  return response;
}

/** Verify an authenticator (TOTP) code. */
export async function verifyTotp(data: VerifyTotpRequest): Promise<ApiResponse<VerifyTotpResponse>> {
  return finish(await apiClient.post<VerifyTotpResponse>(API_ENDPOINTS.AUTH.VERIFY_TOTP, body(data), { skipAuth: true, retries: 1 }));
}

/** Verify the email code for a live sign-in challenge. */
export async function verifyEmailCode(data: VerifyTotpRequest): Promise<ApiResponse<VerifyTotpResponse>> {
  return finish(await apiClient.post<VerifyTotpResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL_2FA, body(data), { skipAuth: true, retries: 0 }));
}

/** Ask the server to email a sign-in code. No retries: a retry would spend one of the 3 sends. */
export async function sendEmailCode(challengeId: string): Promise<ApiResponse<unknown>> {
  return apiClient.post<unknown>(API_ENDPOINTS.AUTH.SEND_EMAIL_2FA, { challengeId }, { skipAuth: true, retries: 0 });
}
