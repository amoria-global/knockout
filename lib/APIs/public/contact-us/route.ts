/**
 * Contact Us API
 * POST /api/remote/public/contact-us
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface ContactUsRequest {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ContactUsResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

/**
 * Submit a contact us message
 */
export async function contactUs(data: ContactUsRequest): Promise<ApiResponse<ContactUsResponse>> {
  return apiClient.post<ContactUsResponse>(
    API_ENDPOINTS.PUBLIC.CONTACT_US,
    data,
    { skipAuth: true, retries: 2 }
  );
}
