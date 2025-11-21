/**
 * User Signup API
 * POST /api/remote/auth/signup
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerType: string; // Backend expects 'customerType', not 'userType'
  password: string;
}

export interface SignupResponse {
  action: number;
  message: string;
  applicant_id: string; // Backend uses snake_case, not camelCase
  expr?: string;
}

/**
 * User Signup
 */
export async function signup(data: SignupRequest) {
  const response = await apiRequest<SignupResponse>(
    `${API_ENDPOINTS.AUTH}/signup`,
    {
      method: 'POST',
      body: data,
    }
  );

  return response;
}
