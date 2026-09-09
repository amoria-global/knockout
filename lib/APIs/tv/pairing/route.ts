/**
 * Smart TV pairing API
 * POST /api/remote/tv/pairing/confirm
 *
 * The TV shows a 6-character code on screen. A signed-in user claims that code
 * here, and the backend mints the TV its OWN session rather than copying this
 * one. Nothing about the caller's token travels to the television, which is why
 * disconnecting the TV later does not sign this browser out.
 *
 * The web only ever confirms. `initiate` and `status` belong to the TV, and
 * `status` additionally requires a device secret the TV never displays, so a
 * browser could not complete a token handoff even if it asked for one.
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { ApiResponse } from '@/lib/api/types';

/**
 * Characters a pairing code can contain.
 *
 * Mirrors CODE_ALPHABET in the backend's TvPairingService. 0/O and 1/I are
 * excluded because someone is reading this off a television from across a
 * room, where those pairs are indistinguishable. Validating against the same
 * set here means an obvious typo is caught before it costs a round trip, and
 * `O` typed for `0` is rejected rather than silently sent.
 */
export const PAIRING_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const PAIRING_CODE_LENGTH = 6;

/**
 * Normalises what someone typed into what the backend will accept.
 *
 * Uppercases (the backend compares case-sensitively and uppercases on its own
 * side, but doing it here keeps the field showing exactly what will be sent),
 * and drops anything outside the alphabet so a pasted code with spaces or
 * dashes still works.
 */
export function normalizePairingCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter((c) => PAIRING_CODE_ALPHABET.includes(c))
    .join('')
    .slice(0, PAIRING_CODE_LENGTH);
}

export function isCompletePairingCode(code: string): boolean {
  return normalizePairingCode(code).length === PAIRING_CODE_LENGTH;
}

export interface ConfirmTvPairingResult {
  message?: string;
}

/**
 * Claims a pairing code for the signed-in account.
 *
 * `deviceLabel` is what the user will see later in their list of paired TVs, so
 * a name they would recognise beats a serial number. The backend defaults it to
 * "Smart TV" when blank.
 *
 * Errors worth distinguishing for the caller:
 *   404 - no such code (mistyped, or the TV generated a new one)
 *   410 - the code expired or was already used
 * Both are recoverable by getting a fresh code off the TV, which is what the UI
 * should say rather than reporting a generic failure.
 */
export async function confirmTvPairing(
  pairingCode: string,
  deviceLabel?: string,
): Promise<ApiResponse<ConfirmTvPairingResult>> {
  const code = normalizePairingCode(pairingCode);

  if (code.length !== PAIRING_CODE_LENGTH) {
    return {
      success: false,
      error: `Enter the ${PAIRING_CODE_LENGTH}-character code shown on your TV.`,
    };
  }

  return apiClient.post<ConfirmTvPairingResult>(
    API_ENDPOINTS.TV.PAIRING_CONFIRM,
    { pairingCode: code, deviceLabel: deviceLabel?.trim() || undefined },
    // Confirming is not idempotent: the first call moves the pairing to ACTIVE
    // and a retry would come back 410 "already used", which would report a
    // failure for a pairing that actually succeeded.
    { retries: 0 },
  );
}
