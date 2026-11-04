/**
 * Shared helpers for one-time codes. The contract is the backend's docs/TWO_FACTOR.md.
 *
 * The server decides whether a code is right, how many tries are left and when a new code may be
 * asked for. Nothing here validates a code; it only carries the server's numbers to the screen.
 */

export const OTP_LENGTH = 6;

/** Digits only, cut to six. Spaces and dashes in a pasted code are dropped. */
export function cleanOtp(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export type CodeErrorCode =
  | 'WRONG_CODE'
  | 'CODE_ALREADY_USED'
  | 'LOCKED'
  | 'RATE_LIMITED'
  | 'EXPIRED'
  | 'SESSION_EXPIRED'
  | 'RESEND_TOO_SOON'
  | 'UNKNOWN';

const KNOWN: CodeErrorCode[] = [
  'WRONG_CODE', 'CODE_ALREADY_USED', 'LOCKED', 'RATE_LIMITED', 'EXPIRED', 'SESSION_EXPIRED', 'RESEND_TOO_SOON',
];

/** A refused code check or send, with the server's numbers. */
export type CodeRefusal = {
  message: string;
  errorCode: CodeErrorCode;
  attemptsLeft?: number;
  retryAfterSeconds?: number;
  expiresAt?: string;
};

type RefusalBody = {
  message?: string;
  errorCode?: string;
  attemptsLeft?: number;
  retryAfterSeconds?: number;
  expiresAt?: string;
};

export function refusalFrom(body: RefusalBody | null | undefined, fallback: string): CodeRefusal {
  const b = body ?? {};
  return {
    message: b.message || fallback,
    errorCode: KNOWN.find((k) => k === b.errorCode) ?? 'UNKNOWN',
    attemptsLeft: typeof b.attemptsLeft === 'number' ? b.attemptsLeft : undefined,
    retryAfterSeconds: typeof b.retryAfterSeconds === 'number' ? b.retryAfterSeconds : undefined,
    expiresAt: b.expiresAt,
  };
}

/** What a send answers: the server's clock and when the next send is allowed. */
export type CodeSent = {
  maskedEmail?: string;
  expiresAt: string;
  resendAvailableAt: string;
  serverTime: string;
};

/** Reads a send answer, or the refusal when the server said no or left out a timer. */
export function sentFrom(body: (RefusalBody & { action?: number; data?: Partial<CodeSent> }) | null | undefined, fallback: string):
  { sent: CodeSent } | { refused: CodeRefusal } {
  const d = body?.data;
  if (body?.action === 1 && d?.expiresAt && d.resendAvailableAt && d.serverTime) {
    return { sent: { maskedEmail: d.maskedEmail, expiresAt: d.expiresAt, resendAvailableAt: d.resendAvailableAt, serverTime: d.serverTime } };
  }
  return { refused: refusalFrom(body, fallback) };
}

/**
 * Epoch ms at which `target` happens on THIS device's clock, correcting for the gap between the
 * server's clock (`serverTime`, read when the answer arrived at `receivedAtMs`) and the device's.
 */
export function localDeadline(target: string, serverTime: string, receivedAtMs: number): number {
  const skew = Date.parse(serverTime) - receivedAtMs;
  return Date.parse(target) - (Number.isFinite(skew) ? skew : 0);
}

/** Whole seconds until `deadlineMs`, never below zero. */
export function secondsLeft(deadlineMs: number | null, nowMs = Date.now()): number {
  if (deadlineMs == null) return 0;
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

/** 90 -> "1:30", 5 -> "0:05". */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "ABCDEFGHIJKLMNOP" -> "ABCD EFGH IJKL MNOP". */
export function groupKey(secret: string): string {
  return secret.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
}

/** "3 attempts left", or nothing when the server did not say. */
export function attemptsText(left: number | undefined): string | undefined {
  if (left == null) return undefined;
  return `${left} ${left === 1 ? 'attempt' : 'attempts'} left`;
}

/** The line shown while a lock holds. */
export function lockText(seconds: number): string {
  return `Too many wrong codes. Try again in ${formatCountdown(seconds)}.`;
}

/**
 * Whole seconds until a resend is allowed, from a send answer's `resendAvailableAt` and `serverTime`.
 * Falls back to the server's 180 second gap when an older answer carries neither.
 */
export function serverWait(d: { resendAvailableAt?: string; serverTime?: string } | null | undefined, nowMs = Date.now()): number {
  if (!d?.resendAvailableAt || !d.serverTime) return 180;
  return secondsLeft(localDeadline(d.resendAvailableAt, d.serverTime, nowMs), nowMs);
}

/** Reads the landing API client's answer to a send (`success` plus unwrapped `data`, or the refusal body). */
export function sentFromResponse(
  r: { success: boolean; data?: unknown; error?: string },
  fallback: string,
): { sent: CodeSent } | { refused: CodeRefusal } {
  const d = (r.data ?? {}) as Partial<CodeSent> & RefusalBody;
  if (r.success && d.expiresAt && d.resendAvailableAt && d.serverTime) {
    return { sent: { maskedEmail: d.maskedEmail, expiresAt: d.expiresAt, resendAvailableAt: d.resendAvailableAt, serverTime: d.serverTime } };
  }
  return { refused: refusalFrom({ ...d, message: d.message || r.error }, fallback) };
}
