/**
 * Retry Utility
 * Exponential backoff retry logic for failed requests
 */

import type { RetryConfig } from '../types';
import { logger } from '../logger';
import { isTimeoutError, isAbortError } from './timeout';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff and jitter
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add jitter (random variation) to prevent thundering herd
  const jitter = Math.random() * 0.3 * exponentialDelay;

  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error or status code is retryable
 * @param error - Error that occurred
 * @param statusCode - HTTP status code (if available)
 * @param config - Retry configuration
 * @returns Whether the request should be retried
 */
export function isRetryable(
  error: Error,
  statusCode: number | undefined,
  config: RetryConfig
): boolean {
  // Don't retry aborted requests (user cancelled)
  if (isAbortError(error) && !isTimeoutError(error)) {
    return false;
  }

  // Timeout errors are retryable
  if (isTimeoutError(error)) {
    return true;
  }

  // Check custom retry condition first
  if (config.retryCondition) {
    return config.retryCondition(error, statusCode);
  }

  // Network errors (TypeError from fetch) are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Check if status code is in retryable list
  if (statusCode && config.retryableStatuses.includes(statusCode)) {
    return true;
  }

  return false;
}

/**
 * Retry context for tracking retry state
 */
export interface RetryContext {
  /** Current attempt number (0-indexed) */
  attempt: number;
  /** Total attempts made */
  totalAttempts: number;
  /** Last error encountered */
  lastError?: Error;
  /** Last status code received */
  lastStatusCode?: number;
  /** Total time spent retrying */
  totalRetryTime: number;
}

/**
 * Execute a function with retry logic
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @param requestId - Request ID for logging
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: (context: RetryContext) => Promise<T>,
  config: Partial<RetryConfig> = {},
  requestId: string = 'unknown'
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const context: RetryContext = {
    attempt: 0,
    totalAttempts: 0,
    totalRetryTime: 0,
  };

  while (true) {
    try {
      const result = await fn(context);
      return result;
    } catch (error) {
      context.lastError = error instanceof Error ? error : new Error(String(error));
      context.totalAttempts++;

      // Extract status code if available
      if (error && typeof error === 'object' && 'statusCode' in error) {
        context.lastStatusCode = (error as { statusCode: number }).statusCode;
      }

      // Check if we should retry
      const shouldRetry =
        context.attempt < finalConfig.maxRetries &&
        isRetryable(context.lastError, context.lastStatusCode, finalConfig);

      if (!shouldRetry) {
        throw context.lastError;
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(
        context.attempt,
        finalConfig.baseDelay,
        finalConfig.maxDelay
      );

      logger.retry(
        context.attempt + 1,
        finalConfig.maxRetries,
        Math.round(delay),
        requestId
      );

      await sleep(delay);

      context.totalRetryTime += delay;
      context.attempt++;
    }
  }
}

/**
 * Create a retry wrapper for a specific configuration
 * @param config - Retry configuration
 * @returns Retry wrapper function
 */
export function createRetryWrapper(config: Partial<RetryConfig> = {}) {
  return <T>(fn: (context: RetryContext) => Promise<T>, requestId?: string) =>
    withRetry(fn, config, requestId);
}

/**
 * No-retry wrapper for requests that shouldn't be retried
 */
export async function withoutRetry<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}
