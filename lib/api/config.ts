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
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com/';

  // Ensure URL ends with slash for consistent path joining
  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * Default retry configuration.
 *
 * Sized so a normal backend deploy (Spring Boot cold-start is ~15–25s) is
 * absorbed by the retry loop and users don't see a 502 surface. With baseDelay
 * 1s, maxDelay 15s and maxRetries=5, the backoff schedule is roughly
 * 1s → 2s → 4s → 8s → 15s  (capped) = up to ~30s total, matching the worst
 * case. The first attempt almost always succeeds; real errors fail fast on
 * attempt #1 and hit the client error path without the full wait.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 15000, // 15 seconds (last attempt)
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
    VALIDATE_PASSWORD: '/api/remote/auth/validate-password',
    CHECK_EMAIL: '/api/remote/auth/check-email',
    REFRESH_TOKEN: '/api/remote/auth/refresh-token',
    // Ordinary sign-out ends this device's session only (CONN-AUTH-7). The
    // old target, now LOGOUT_EVERYWHERE, ends every session on every device
    // and used to run on every "Log out" click, so signing out of the web
    // silently signed out the phone and the TV a few hours later.
    LOGOUT: '/api/remote/auth/logout-device',
    LOGOUT_EVERYWHERE: '/api/remote/auth/logout',
    GOOGLE: '/api/remote/auth/google',
    APPLE: '/api/remote/auth/apple',
    VERIFY_TOTP: '/api/remote/auth/verify-totp',
  },

  // Public endpoints
  PUBLIC: {
    DIRECT_BOOKING_MAP: '/api/remote/direct-booking/map',
    PHOTOGRAPHERS_LIST: '/api/remote/public/photographers/list',
    PHOTOGRAPHER_BY_ID: (id: string) => `/api/remote/public/photographers/list/${id}`,
    PHOTOGRAPHER_REVIEWS: (id: string) => `/api/remote/public/photographers/${id}/reviews`,
    SUBMIT_REVIEW: '/api/remote/photographer-reviews',
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
    FAQS: '/api/remote/public/faqs',
    ALBUM_BY_CODE: '/api/remote/public/albums',
    PHOTOGRAPHER_BOOKED_DATES: (id: string) => `/api/remote/public/photographers/${id}/booked-dates`,
    DONATION_TIERS: '/api/remote/public/donation-tiers',
    // TikTok-style live-gift catalog: [{code,name,emoji,amountUsd,tier,bigAnimation}]
    GIFT_CATALOG: '/api/remote/public/gift-catalog',
    CURRENCY_RATES: '/api/remote/public/currencies/rates',
    EVENT_BY_ID: (id: string) => `/api/remote/public/events/${id}`,
    FACE_SEARCH: '/api/remote/public/face-search',
    IDENTIFY_BUYER: (albumId: string) => `/api/remote/public/albums/${albumId}/identify-buyer`,
    UNLOCK_ALBUM_PHOTOS: (albumId: string) => `/api/remote/public/albums/${albumId}/unlock-photos`,
    FREE_ALBUM_GET: (code: string) => `/api/remote/public/albums/free/${code}`,
    FREE_ALBUM_REQUEST_ACCESS: '/api/remote/public/albums/free/request-access',
    FREE_ALBUM_VERIFY_ACCESS: '/api/remote/public/albums/free/verify-access',
    EVENT_VIEWERS: (eventId: string) => `/api/remote/public/events/${eventId}/viewers`,
    STREAM_VALIDATE_TOKEN: (eventId: string) => `/api/remote/public/events/${eventId}/stream/validate-token`,
    STREAM_ACCESS: (eventId: string) => `/api/remote/public/streams/${eventId}/access`,
    STREAM_GROUP_ACCESS: (eventId: string) => `/api/remote/public/streams/${eventId}/group-access`,
    STREAM_REDEEM_GROUP_CODE: (eventId: string) => `/api/remote/public/streams/${eventId}/redeem-group-code`,
    STREAM_GROUP_CODE_STATUS: (eventId: string, code: string) => `/api/remote/public/streams/${eventId}/group-code-status/${code}`,
    STREAM_PURCHASE_ACCESS: (eventId: string) => `/api/remote/public/streams/${eventId}/purchase-access`,
    STREAM_DEVICE_CHECK: (eventId: string) => `/api/remote/public/streams/${eventId}/device-check`,
    STREAM_HEARTBEAT: (eventId: string) => `/api/remote/public/streams/${eventId}/heartbeat`,

    // Anonymous viewer endpoints
    ANONYMOUS_VIEWER_REGISTER: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/register`,
    ANONYMOUS_VIEWER_CONFIRM_PAYMENT: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/confirm-payment`,
    ANONYMOUS_VIEWER_DEVICE_CHECK: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/device-check`,
    ANONYMOUS_VIEWER_HEARTBEAT: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/heartbeat`,
    ANONYMOUS_VIEWER_DEACTIVATE: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/deactivate`,
    ANONYMOUS_VIEWER_SWITCH_DEVICE: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/switch-device`,
    ANONYMOUS_VIEWER_ACCESS_STATUS: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/access-status`,
    ANONYMOUS_VIEWER_RESOLVE_BY_FINGERPRINT: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/resolve-by-fingerprint`,
    ANONYMOUS_VIEWER_COUNT: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/viewer-count`,
    ANONYMOUS_VIEWER_CHAT: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/chat`,
    ANONYMOUS_VIEWER_CHAT_VIDEO: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/chat/video`,
    ANONYMOUS_VIEWER_RATE: (eventId: string) => `/api/remote/public/anonymous-viewer/${eventId}/rate`,
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
    RECORD_PHOTO_PURCHASE: '/api/remote/payments/record-photo-purchase',
    XENTRIPAY_INITIATE: '/api/remote/payments/xentripay/initiate',
    XENTRIPAY_INITIATE_TIP: '/api/remote/payments/xentripay/initiate-tip',
    XENTRIPAY_INITIATE_STREAMING: '/api/remote/payments/xentripay/initiate-streaming',
    // Live gift (catalog giftCode or free-form amount) for authenticated viewers
    XENTRIPAY_INITIATE_GIFT: '/api/remote/payments/xentripay/initiate-gift',
    XENTRIPAY_INITIATE_DONATION: '/api/remote/public/payments/xentripay/initiate-donation',
    XENTRIPAY_INITIATE_PHOTO_PURCHASE: '/api/remote/payments/xentripay/initiate-photo-purchase',
    XENTRIPAY_INITIATE_ALBUM_PURCHASE: '/api/remote/public/payments/xentripay/initiate-album-purchase',
    // Cross-photographer purchase: a face-scan can match photos across N paid
    // albums. Frontend groups by albumId and posts one item per gallery; one
    // XentriPay collection covers the total. Each photographer gets the
    // correct slice of revenue (one AlbumPurchase row per gallery).
    XENTRIPAY_INITIATE_MULTI_ALBUM_PURCHASE: '/api/remote/public/payments/xentripay/initiate-multi-album-purchase',
    RECORD_ALBUM_PURCHASE: '/api/remote/public/payments/record-album-purchase',
    XENTRIPAY_STATUS: (refid: string) => `/api/remote/payments/xentripay/status/${refid}`,
    XENTRIPAY_PUBLIC_STATUS: (refid: string) => `/api/remote/public/payments/xentripay/status/${refid}`,

    // Multi-country payment-options endpoints. Drive the dynamic
    // PaymentMethodPicker — replaces the hardcoded MTN/Airtel/Card
    // grids. /country = IP-detect the caller's ISO-2; /options = list
    // operators + currency for a given country; /options/all = full
    // catalog for the country picker UI.
    PAYMENT_COUNTRY: '/api/remote/public/payments/country',
    PAYMENT_OPTIONS: (country: string) => `/api/remote/public/payments/options?country=${encodeURIComponent(country)}`,
    PAYMENT_OPTIONS_ALL: '/api/remote/public/payments/options/all',
    ALBUM_PHOTO_DOWNLOAD: (albumId: string, photoId: string, token: { refid?: string; buyerId?: string }) => {
      // Send every proof we hold. This used to prefer buyerId and silently
      // DROP the refid - so the download straight after checkout discarded
      // the one token guaranteed to match the purchase row, and leaned on a
      // localStorage buyerId that may belong to an older session. The
      // backend accepts both params and checks refid first.
      const parts: string[] = [];
      if (token.refid) parts.push(`refid=${encodeURIComponent(token.refid)}`);
      if (token.buyerId) parts.push(`buyerId=${encodeURIComponent(token.buyerId)}`);
      return `/api/remote/public/albums/${albumId}/photo/${photoId}/download?${parts.join('&')}`;
    },
  },

  // Customer endpoints
  CUSTOMER: {
    EVENTS_BOOK: '/api/remote/customer/events/book',
    EVENTS_JOIN: '/api/remote/customer/events/join',
    MY_PHOTOS: '/api/remote/customer/events/my-photos',
    VALIDATE_INVITE_CODE: '/api/remote/customer/events/validate-invite-code',
    FACIAL_RECOGNITION: '/api/remote/customer/events/facial-recognition',
  },

  // Smart TV pairing. The TV shows a 6-character code; a signed-in user claims
  // it here and the backend mints the TV its OWN session rather than copying
  // this one, which is why unpairing a TV does not sign the browser out.
  //
  // CONFIRM is the only one the web needs. initiate and status belong to the TV
  // itself, and status additionally requires a device secret the TV never
  // displays, so a browser cannot complete a token handoff even if it asked.
  TV: {
    PAIRING_CONFIRM: '/api/remote/tv/pairing/confirm',
    DEVICES: '/api/remote/customer/tv-devices',
    DEVICE_BY_ID: (id: string) => `/api/remote/customer/tv-devices/${id}`,
  },

  // Stream endpoints (coordinator streams)
  STREAMS: {
    CHATS: (streamId: string) => `/api/remote/coordinator/streams/${streamId}/chats`,
    CHAT_VIDEO: (streamId: string) => `/api/remote/coordinator/streams/${streamId}/chats/video`,
    VIEWERS: (streamId: string) => `/api/remote/coordinator/streams/${streamId}/viewers`,
    PARTICIPANTS: (streamId: string) => `/api/remote/coordinator/streams/${streamId}/participants`,
    URL: (streamId: string) => `/api/remote/coordinator/streams/${streamId}/url`,
    REPORTS: (streamId: string) => `/api/remote/streams/${streamId}/reports`,
    RATINGS: (streamId: string) => `/api/remote/streams/${streamId}/ratings`,
    BLOCK: (streamId: string) => `/api/remote/streams/${streamId}/block`,
    VIDEO: (eventId: string) => `/api/remote/coordinator/streams/${eventId}/video`,
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
    CUSTOM_PACKAGE_REQUEST: '/api/remote/chat/custom-package-request',
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
