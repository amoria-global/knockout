/**
 * Send to TV from the web: list the signed-in account's paired TVs and ask one of them to open an event.
 *
 * Backed by GET /api/remote/customer/tv-devices and POST /api/remote/customer/tv-devices/{id}/cast (TvCastController),
 * the same calls the phone app makes. The TV picks the request up on its next check, within a couple of seconds, and runs
 * its own access checks, so nothing about this browser's session travels to the television.
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

export interface TvDevice {
  id: string;
  deviceLabel: string;
  pairedAt: string;
  lastSeenAt?: string | null;
}

/** A TV that checked in this recently is treated as on and listening. The TV checks every couple of seconds while open. */
export const TV_ONLINE_WINDOW_MS = 2 * 60 * 1000;

/** Where the last TV used is remembered, per browser, so the next send can be one tap. */
export const LAST_TV_KEY = 'connekyt:lastTvId';

export function isTvOnline(device: Pick<TvDevice, 'lastSeenAt'>, now = Date.now()): boolean {
  if (!device.lastSeenAt) return false;
  const seen = Date.parse(device.lastSeenAt);
  return Number.isFinite(seen) && now - seen <= TV_ONLINE_WINDOW_MS;
}

/**
 * The TV a one-tap send should go to: the only TV, or the one used last time if it is still paired. With several TVs and
 * no remembered choice there is no default, and the viewer picks.
 */
export function pickDefaultTv(devices: TvDevice[], lastId: string | null | undefined): TvDevice | null {
  if (devices.length === 1) return devices[0];
  if (lastId) return devices.find((d) => d.id === lastId) ?? null;
  return null;
}

export async function listTvDevices(): Promise<ApiResponse<TvDevice[]>> {
  return apiClient.get<TvDevice[]>(API_ENDPOINTS.TV.DEVICES);
}

/**
 * Asks the TV to open the event. Not retried: a second send is harmless but would hide a real error behind a success.
 * The backend answers 400 for a TV that is no longer connected or an event that has ended, 404 for an unknown TV and 429
 * when sending too often; its message says which, so it is shown as is.
 */
export async function sendEventToTv(deviceId: string, eventId: string): Promise<ApiResponse<unknown>> {
  return apiClient.post(API_ENDPOINTS.TV.CAST(deviceId), { eventId }, { retries: 0 });
}
