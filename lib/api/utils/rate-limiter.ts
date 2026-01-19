/**
 * Rate Limiter Utility
 * Frontend request throttling to prevent overwhelming the server
 */

import type { RateLimitConfig } from '../types';
import { logger } from '../logger';

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends Error {
  public readonly retryAfter: number;
  public readonly endpoint: string;

  constructor(message: string, retryAfter: number, endpoint: string) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.endpoint = endpoint;
  }
}

/**
 * Rate limiter instance for tracking requests
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Check if a request can be made
   * @param key - Unique key for the rate limit bucket (e.g., endpoint)
   * @returns Whether the request is allowed
   */
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    const recent = timestamps.filter(ts => now - ts < this.windowMs);

    if (recent.length >= this.maxRequests) {
      return false;
    }

    // Update timestamps
    recent.push(now);
    this.requests.set(key, recent);

    return true;
  }

  /**
   * Record a request (use when canMakeRequest returns true)
   * @param key - Unique key for the rate limit bucket
   */
  recordRequest(key: string): void {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    timestamps.push(now);
    this.requests.set(key, timestamps);
  }

  /**
   * Get remaining requests in the current window
   * @param key - Unique key for the rate limit bucket
   * @returns Number of remaining requests
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const recent = timestamps.filter(ts => now - ts < this.windowMs);
    return Math.max(0, this.maxRequests - recent.length);
  }

  /**
   * Get time until rate limit resets
   * @param key - Unique key for the rate limit bucket
   * @returns Milliseconds until reset, or 0 if not limited
   */
  getResetTime(key: string): number {
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length === 0) return 0;

    const now = Date.now();
    const oldestInWindow = timestamps.find(ts => now - ts < this.windowMs);

    if (!oldestInWindow) return 0;

    return Math.max(0, this.windowMs - (now - oldestInWindow));
  }

  /**
   * Check request and throw if rate limited
   * @param key - Unique key for the rate limit bucket
   * @throws RateLimitError if rate limit exceeded
   */
  checkOrThrow(key: string): void {
    if (!this.canMakeRequest(key)) {
      const retryAfter = this.getResetTime(key);
      logger.rateLimit(key, 0);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
        retryAfter,
        key
      );
    }

    // Log warning when approaching limit
    const remaining = this.getRemainingRequests(key);
    if (remaining <= 5 && remaining > 0) {
      logger.rateLimit(key, remaining);
    }
  }

  /**
   * Clear rate limit data for a key
   * @param key - Unique key to clear
   */
  clear(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
  }
}

/**
 * Default rate limiter for general API requests
 */
export const generalRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60000, // 1 minute
});

/**
 * Rate limiter for file upload endpoints
 */
export const uploadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
});

/**
 * Get appropriate rate limiter for an endpoint
 * @param endpoint - API endpoint path
 * @returns Appropriate RateLimiter instance
 */
export function getRateLimiterForEndpoint(endpoint: string): RateLimiter {
  if (endpoint.includes('/auth/')) {
    return authRateLimiter;
  }

  if (
    endpoint.includes('upload') ||
    endpoint.includes('profile-picture') ||
    endpoint.includes('cover-photo')
  ) {
    return uploadRateLimiter;
  }

  return generalRateLimiter;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}
