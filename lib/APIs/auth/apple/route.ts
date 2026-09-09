/**
 * Apple Authentication API
 * POST /api/remote/auth/apple  (alias of the canonical /api/v1/auth/apple)
 *
 * Unlike /auth/google, the credential travels in a JSON body: the identity
 * token is a bearer credential and must not land in access logs as a query
 * string. The backend verifies it against Apple's JWKS (signature, issuer,
 * audience, expiry, nonce) and answers with the same flat session shape as
 * /auth/login and /auth/google.
 */

import { apiClient, setAuthToken } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';
import type { GoogleAuthResponse } from '@/lib/APIs/auth/google/route';

export interface AppleAuthRequest {
  identityToken: string;
  /** Raw nonce; the backend hashes it and compares with the token's claim. */
  nonce: string;
  appleUserId?: string | null;
  /** First authorisation only; null afterwards. */
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Applied only when an account is created. Allowed: Photographer, Coordinator, Client. */
  customerType: string;
  /**
   * false on the sign-in screen: no role is known there, so an unknown Apple
   * ID is not registered; the response carries action 3 + needsRole instead.
   */
  createIfMissing: boolean;
}

/** Same fields as Google, plus `action 3` / `needsRole` for an unknown Apple ID in sign-in mode. */
export interface AppleAuthResponse extends GoogleAuthResponse {
  needsRole?: boolean;
}

export async function appleAuth(data: AppleAuthRequest): Promise<ApiResponse<AppleAuthResponse>> {
  const response = await apiClient.post<AppleAuthResponse>(API_ENDPOINTS.AUTH.APPLE, data, {
    skipAuth: true, // establishing the session; there is no token yet
    retries: 1,
  });

  // Store token on successful authentication (skip if 2FA pending)
  if (response.success && response.data?.token && !response.data?.twoFactorRequired) {
    setAuthToken(response.data.token);
  }

  return response;
}
