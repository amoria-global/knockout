/**
 * API Configuration
 * Centralized configuration for the API client
 */

import type { ApiClientConfig, RetryConfig, RateLimitConfig } from './types';

/**
 * Get the API base URL from environment or default
 */
function getBaseUrl(): string {
  // In production (Vercel), use the proxy to avoid mixed content
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy/';
  }

  // In development or server-side, use direct URL
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101/';

  // Ensure URL ends with slash for consistent path joining
  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryCondition: (error, statusCode) => {
    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    // Retry on specific status codes
    if (statusCode && DEFAULT_RETRY_CONFIG.retryableStatuses.includes(statusCode)) {
      return true;
    }
    return false;
  },
};

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
};

/**
 * Rate limit configuration for sensitive endpoints (auth)
 */
export const AUTH_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60000, // 1 minute
};

/**
 * API Client Configuration
 */
export const API_CONFIG: ApiClientConfig = {
  baseUrl: getBaseUrl(),
  timeout: 30000, // 30 seconds
  retry: DEFAULT_RETRY_CONFIG,
  rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * API Endpoint paths (aligned with Swagger documentation)
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/remote/auth/login',
    SIGNUP: '/api/remote/auth/signup',
    VERIFY_OTP: '/api/remote/auth/verify-otp',
    RESEND_OTP: '/api/remote/auth/resend-otp',
    FORGOT_PASSWORD: '/api/remote/auth/forgot-password',
    RESET_PASSWORD: '/api/remote/auth/reset-password',
    SET_NEW_PASSWORD: '/api/remote/auth/set-new-password',
    VALIDATE_TOKEN: '/api/remote/auth/validate-token',
    REFRESH_TOKEN: '/api/remote/auth/api/v1/remote/refresh-token',
  },

  // Public endpoints
  PUBLIC: {
    PHOTOGRAPHERS_LIST: '/api/remote/public/photographers/list',
    PHOTOGRAPHER_CATEGORIES: '/api/remote/photographer-categories',
    CITIES: '/api/remote/cities',
  },

  // Protected photographer endpoints
  PHOTOGRAPHER: {
    UPDATE_PROFILE_PICTURE: '/api/remote/photographer/update-profile-picture',
    UPDATE_COVER_PHOTO: '/api/remote/photographer/update-cover-photo',
    UPDATE_IMPORTANT_DETAILS: '/api/remote/photographer/update-important-details',
    ADD_AVAILABILITY: '/api/remote/photographer/add-availability',
    ADD_EQUIPMENT: '/api/remote/photographer/add-equipment',
    ADD_EDUCATION: '/api/remote/photographer/add-education-level',
    ADD_SKILLS: '/api/remote/photographer/add-professional-skills',
    ADD_PORTFOLIO: '/api/remote/photographer/add-project-portfolio',
    ADD_CERTIFICATION: '/api/remote/photographer/add-trainting-certification',
    PROFILE_SUMMARY: '/api/remote/photographer/profile-summary',
    PACKAGES: '/api/remote/photographer/packages',
    PACKAGE_BY_ID: (id: string) => `/api/remote/photographer/packages/${id}`,
  },

  // Customer endpoints
  CUSTOMER: {
    EVENTS_BOOK: '/api/remote/customer/events/book',
  },

  // Legacy endpoint paths (for backward compatibility)
  LEGACY: {
    AUTH: '/api/remote/auth',
    USER: '/api/remote/user',
    PHOTOGRAPHERS: '/api/remote/photographers',
    EVENTS: '/api/remote/events',
    BOOKINGS: '/api/remote/bookings',
    MESSAGES: '/api/remote/messages',
    CONTACT: '/api/remote/contact',
  },
} as const;

/**
 * HTTP Status codes with semantic meaning
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Request timeout presets
 */
export const TIMEOUT_PRESETS = {
  SHORT: 10000,   // 10 seconds - quick operations
  DEFAULT: 30000, // 30 seconds - standard operations
  LONG: 60000,    // 60 seconds - file uploads
  EXTENDED: 120000, // 2 minutes - large operations
} as const;
