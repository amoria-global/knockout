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
    REFRESH_TOKEN: '/api/remote/auth/refresh-token',
    LOGOUT: '/api/remote/auth/logout',
    GOOGLE: '/api/remote/auth/google',
  },

  // Public endpoints
  PUBLIC: {
    PHOTOGRAPHERS_LIST: '/api/remote/public/photographers/list',
    PHOTOGRAPHER_BY_ID: (id: string) => `/api/remote/public/photographers/list/${id}`,
    PHOTOGRAPHER_REVIEWS: (id: string) => `/api/remote/public/photographers/${id}/reviews`,
    PHOTOGRAPHER_CATEGORIES: '/api/remote/photographer-categories',
    CITIES: '/api/remote/cities',
    CURRENCIES: '/api/remote/public/currencies',
    CONTACT_US: '/api/remote/public/contact-us',
    NEWSLETTER_SUBSCRIBE: '/api/remote/public/newsletter/subscribe',
    NEWSLETTER_UNSUBSCRIBE: '/api/remote/public/newsletter/unsubscribe',
    PHOTOGRAPHER_PACKAGES: (id: string) => `/api/remote/public/photographers/${id}/packages`,
    EVENTS_LIST: '/api/remote/public/events/list',
    DONATIONS: '/api/remote/public/donations',
    EVENT_TYPES: '/api/remote/public/event-types',
    PACKAGE_EXTRAS: (photographerId: string, packageId: string) => `/api/remote/public/photographers/${photographerId}/packages/${packageId}/extras`,
    FAQS: '/api/remote/public/faqs',
  },

  // Protected photographer endpoints
  PHOTOGRAPHER: {
    PROFILE_SUMMARY: '/api/remote/photographer/profile-summary',
    PACKAGES: '/api/remote/photographer/packages',
    PACKAGE_BY_ID: (id: string) => `/api/remote/photographer/packages/${id}`,
    UPDATE_PROFILE_PICTURE: '/api/remote/photographer/update-profile-picture',
    UPDATE_COVER_PHOTO: '/api/remote/photographer/update-cover-photo',
    UPDATE_IMPORTANT_DETAILS: '/api/remote/photographer/update-important-details',
    ADD_EQUIPMENT: '/api/remote/photographer/equipment',
    UPDATE_EQUIPMENT: (id: string) => `/api/remote/photographer/equipment/${id}`,
    DELETE_EQUIPMENT: (id: string) => `/api/remote/photographer/equipment/${id}`,
    ADD_SKILL: '/api/remote/photographer/skills',
    UPDATE_SKILL: (id: string) => `/api/remote/photographer/skills/${id}`,
    DELETE_SKILL: (id: string) => `/api/remote/photographer/skills/${id}`,
    ADD_AVAILABILITY: '/api/remote/photographer/availability',
    UPDATE_AVAILABILITY: (id: string) => `/api/remote/photographer/availability/${id}`,
    DELETE_AVAILABILITY: (id: string) => `/api/remote/photographer/availability/${id}`,
    ADD_EDUCATION: '/api/remote/photographer/education',
    UPDATE_EDUCATION: (id: string) => `/api/remote/photographer/education/${id}`,
    DELETE_EDUCATION: (id: string) => `/api/remote/photographer/education/${id}`,
    ADD_CERTIFICATION: '/api/remote/photographer/certification',
    UPDATE_CERTIFICATION: (id: string) => `/api/remote/photographer/certification/${id}`,
    ADD_PROJECT: '/api/remote/photographer/projects',
    UPDATE_PROJECT: (id: string) => `/api/remote/photographer/projects/${id}`,
    DELETE_PROJECT: (id: string) => `/api/remote/photographer/projects/${id}`,
    SUBMIT_PROFILE: '/api/remote/photographer/submit-profile',
  },

  // Payment endpoints
  PAYMENTS: {
    RECORD_TIP: '/api/remote/payments/record-tip',
    RECORD_STREAMING_PAYMENT: '/api/remote/payments/record-streaming-payment',
  },

  // Customer endpoints
  CUSTOMER: {
    EVENTS_BOOK: '/api/remote/customer/events/book',
    EVENTS_JOIN: '/api/remote/customer/events/join',
    MY_PHOTOS: '/api/remote/customer/events/my-photos',
    VALIDATE_INVITE_CODE: '/api/remote/customer/events/validate-invite-code',
    FACIAL_RECOGNITION_MATCH: '/api/remote/customer/events/facial-recognition-match',
  },

  // Stream endpoints
  STREAMS: {
    CHATS: (eventId: string) => `/api/remote/coordinator/streams/${eventId}/chats`,
    CHAT_VIDEO: (eventId: string) => `/api/remote/coordinator/streams/${eventId}/chats/video`,
    VIEWERS: (eventId: string) => `/api/remote/coordinator/streams/${eventId}/viewers`,
    PARTICIPANTS: (eventId: string) => `/api/remote/coordinator/streams/${eventId}/participants`,
    URL: (eventId: string) => `/api/remote/coordinator/streams/${eventId}/url`,
    REPORTS: (eventId: string) => `/api/remote/streams/${eventId}/reports`,
    RATINGS: (eventId: string) => `/api/remote/streams/${eventId}/ratings`,
    BLOCK: (eventId: string) => `/api/remote/streams/${eventId}/block`,
  },

  // Chat/messaging endpoints
  CHAT: {
    CONVERSATIONS: '/api/remote/chat/conversations',
    MESSAGES: (id: string) => `/api/remote/chat/messages/${id}`,
    SEND: '/api/remote/chat/send',
    UPDATE_MESSAGE: (id: string) => `/api/remote/chat/messages/${id}`,
    DELETE_MESSAGE: (id: string) => `/api/remote/chat/messages/${id}`,
    MARK_READ: (id: string) => `/api/remote/chat/messages/${id}/read`,
    UNREAD_COUNT: '/api/remote/chat/unread-count',
  },

  // Legacy endpoint paths (for backward compatibility)
  LEGACY: {
    EVENTS: '/api/remote/events',
    BOOKINGS: '/api/remote/bookings',
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
