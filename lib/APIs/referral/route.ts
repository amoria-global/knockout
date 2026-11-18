/**
 * Referral program: public code validation used by the sign-up field.
 * GET /api/remote/public/referral/validate?code=
 * The server answers action 1 with data.valid true or false (and data.problem), and only ever
 * returns the referrer's display name.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export type ReferralProblem =
  | 'INVALID' | 'NOT_ELIGIBLE' | 'LIMIT_REACHED' | 'SELF' | 'MUTUAL'
  | 'ALREADY_REFERRED' | 'QA_MISMATCH' | 'NOT_A_PHOTOGRAPHER';

export interface ReferralValidation {
  valid: boolean;
  referrerName?: string;
  code?: string;
  problem?: ReferralProblem;
}

export async function validateReferralCode(code: string): Promise<ApiResponse<ReferralValidation>> {
  return apiClient.get<ReferralValidation>(
    `/api/remote/public/referral/validate?code=${encodeURIComponent(code)}`,
    { skipAuth: true, retries: 0 },
  );
}
