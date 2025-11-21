/**
 * Submit Contact Form API
 * POST /api/remote/contact
 */

import { apiRequest, API_ENDPOINTS } from '../../../db';

export interface ContactFormRequest {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  subject?: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

/**
 * Submit Contact Form
 */
export async function submitContactForm(data: ContactFormRequest) {
  const response = await apiRequest<ContactFormResponse>(
    `${API_ENDPOINTS.CONTACT}`,
    {
      method: 'POST',
      body: data,
    }
  );

  return response;
}
