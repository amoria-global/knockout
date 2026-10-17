/**
 * "Get notified" for an upcoming event.
 *
 * Signed in:  POST/DELETE/GET /api/remote/customer/events/{id}/reminder
 *             (told by in-app notification and push)
 * Guest:      POST/DELETE/GET /api/remote/public/events/{id}/reminder with an email
 *             (told by one email)
 *
 * The envelope is { action: 1 | 0, message, data: { subscribed } }. apiClient turns
 * action 0 into success: false, so a refusal (ended event, bad email) never looks like a yes.
 */

import { apiClient, isAuthenticated } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface ReminderState {
  subscribed: boolean;
}

function path(eventId: string, signedIn: boolean): string {
  return signedIn
    ? `/api/remote/customer/events/${eventId}/reminder`
    : `/api/remote/public/events/${eventId}/reminder`;
}

/** Whether this person is already waiting for the event. Guests are looked up by email. */
export async function getEventReminder(eventId: string, email?: string): Promise<ApiResponse<ReminderState>> {
  const signedIn = isAuthenticated();
  if (!signedIn && !email) return { success: true, data: { subscribed: false } };
  const query = signedIn ? '' : `?email=${encodeURIComponent(email ?? '')}`;
  return apiClient.get<ReminderState>(`${path(eventId, signedIn)}${query}`, { skipAuth: !signedIn });
}

export async function setEventReminder(eventId: string, email?: string): Promise<ApiResponse<ReminderState>> {
  const signedIn = isAuthenticated();
  return apiClient.post<ReminderState>(
    path(eventId, signedIn),
    signedIn ? undefined : { email },
    { skipAuth: !signedIn },
  );
}

export async function clearEventReminder(eventId: string, email?: string): Promise<ApiResponse<ReminderState>> {
  const signedIn = isAuthenticated();
  const query = signedIn ? '' : `?email=${encodeURIComponent(email ?? '')}`;
  return apiClient.delete<ReminderState>(`${path(eventId, signedIn)}${query}`, { skipAuth: !signedIn });
}
