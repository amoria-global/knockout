/**
 * Timeout Utility
 * AbortController wrapper for request timeout handling
 */

import { logger } from '../logger';

/**
 * Timeout controller result
 */
export interface TimeoutController {
  /** AbortController for the request */
  controller: AbortController;
  /** Timeout ID for cleanup */
  timeoutId: ReturnType<typeof setTimeout>;
  /** Cleanup function to clear timeout */
  cleanup: () => void;
  /** Check if timeout has occurred */
  isTimedOut: () => boolean;
}

/**
 * Timeout error class for specific timeout handling
 */
export class TimeoutError extends Error {
  public readonly timeoutMs: number;
  public readonly endpoint: string;

  constructor(message: string, timeoutMs: number, endpoint: string) {
    super(message);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    this.endpoint = endpoint;
  }
}

/**
 * Create a timeout controller for fetch requests
 * @param timeoutMs - Timeout duration in milliseconds
 * @param endpoint - API endpoint (for logging)
 * @param requestId - Request ID (for logging)
 * @returns TimeoutController object
 */
export function createTimeoutController(
  timeoutMs: number,
  endpoint: string,
  requestId: string
): TimeoutController {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    logger.timeout('REQUEST', endpoint, timeoutMs, requestId);
    controller.abort(new TimeoutError(
      `Request timeout after ${timeoutMs}ms`,
      timeoutMs,
      endpoint
    ));
  }, timeoutMs);

  const cleanup = () => {
    clearTimeout(timeoutId);
  };

  const isTimedOut = () => timedOut;

  return {
    controller,
    timeoutId,
    cleanup,
    isTimedOut,
  };
}

/**
 * Combine multiple AbortSignals into one
 * Useful when you have both timeout and external cancellation
 * @param signals - Array of AbortSignals to combine
 * @returns Combined AbortController
 */
export function combineAbortSignals(
  ...signals: (AbortSignal | undefined)[]
): AbortController {
  const controller = new AbortController();

  for (const signal of signals) {
    if (!signal) continue;

    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }

    signal.addEventListener('abort', () => {
      controller.abort(signal.reason);
    }, { once: true });
  }

  return controller;
}

/**
 * Execute a promise with timeout
 * @param promise - Promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param endpoint - Endpoint for error context
 * @returns Promise result or throws TimeoutError
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  endpoint: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(
        `Operation timed out after ${timeoutMs}ms`,
        timeoutMs,
        endpoint
      ));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Check if an error is an abort error (from AbortController)
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message.includes('abort'))
  );
}
