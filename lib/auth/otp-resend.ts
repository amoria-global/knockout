/**
 * Shared rules for the inline email-verification steps (booking wizard,
 * live stream, view event).
 *
 * Why this exists: those three flows had an OTP step with no way to ask for
 * another code, and their login forms treated an unverified account as a
 * plain error. The backend answers that login with action 0, otpVerified
 * false and a customerId, and it has ALREADY emailed a fresh code by then.
 * Showing "OTP not verified. A new OTP has been sent." as a red error with no
 * code box left the user holding a code they had nowhere to type. Delivery
 * itself was proven fine on production; the dead end was here.
 */
import { resendOtp } from '@/lib/APIs/auth/resend-otp/route';
import type { ApiResponse } from '@/lib/api/types';

/** Each resend replaces the previous code, so do not let users fire them rapidly. */
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

type LoginLike = {
  otpVerified?: boolean | string | null;
  customerId?: string | null;
  accountLocked?: boolean | string | null;
} | null | undefined;

/**
 * The customerId to verify when a login response means "this account exists,
 * the password was right, but the email is not verified yet". Null otherwise,
 * including for locked accounts, which must never be routed around.
 */
export function unverifiedLoginCustomerId(data: LoginLike): string | null {
  if (!data) return null;
  if (data.accountLocked === true || data.accountLocked === 'true') return null;
  const unverified = data.otpVerified === false || data.otpVerified === 'false';
  if (!unverified || !data.customerId) return null;
  return String(data.customerId);
}

export type ResendResult = { ok: boolean; message: string };

type ResendFn = (req: { customerId: string }) => Promise<ApiResponse<{ message?: string }>>;

/**
 * Ask the backend for a new code. `success` from the API client already
 * reflects the envelope's `action`, so an HTTP 200 carrying action 0 is a
 * failure here too.
 */
export async function requestOtpResend(
  customerId: string,
  send: ResendFn = resendOtp,
): Promise<ResendResult> {
  if (!customerId) {
    return { ok: false, message: 'We could not find your sign-up. Please log in again to get a new code.' };
  }
  try {
    const res = await send({ customerId });
    if (res.success) {
      return { ok: true, message: 'A new code is on its way. Use the newest code, earlier ones no longer work.' };
    }
    return {
      ok: false,
      message: res.data?.message || res.error || 'We could not resend the code. Please try again.',
    };
  } catch {
    return { ok: false, message: 'Unable to connect. Please check your internet connection and try again.' };
  }
}

/** Whole seconds left before another resend is allowed. */
export function resendSecondsLeft(sentAtMs: number | null, nowMs: number): number {
  if (sentAtMs === null) return 0;
  const left = OTP_RESEND_COOLDOWN_SECONDS - Math.floor((nowMs - sentAtMs) / 1000);
  return left > 0 ? left : 0;
}
