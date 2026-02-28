/**
 * Validate Invite Code API
 * POST /api/remote/customer/events/validate-invite-code
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface ValidateInviteCodeResponse {
  valid: boolean;
  eventId?: string;
  eventTitle?: string;
}

/**
 * Validate an invite code for finding photos
 */
export async function validateInviteCode(
  inviteCode: string
): Promise<ApiResponse<ValidateInviteCodeResponse>> {
  return apiClient.post<ValidateInviteCodeResponse>(
    API_ENDPOINTS.CUSTOMER.VALIDATE_INVITE_CODE,
    { inviteCode },
    { retries: 1 }
  );
}
