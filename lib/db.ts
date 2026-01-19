/**
 * Database/API Client Configuration
 * Central configuration for all API calls to the backend server
 *
 * NOTE: This file maintains backward compatibility with existing code.
 * New code should import from '@/lib/api/client' directly for full features.
 */

// Re-export from new API client for backward compatibility
import {
  apiClient,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
} from './api/client';
import { API_CONFIG, API_ENDPOINTS as NEW_API_ENDPOINTS } from './api/config';
import { logger } from './api/logger';
import type { ApiResponse as NewApiResponse, HttpMethod } from './api/types';

// Export the base URL for backward compatibility
export const BASE_URL = API_CONFIG.baseUrl;

// Legacy API endpoints (for backward compatibility with existing code)
export const API_ENDPOINTS = {
  AUTH: '/api/remote/auth',
  USER: '/api/remote/user',
  PHOTOGRAPHERS: '/api/remote/photographers',
  EVENTS: '/api/remote/events',
  BOOKINGS: '/api/remote/bookings',
  MESSAGES: '/api/remote/messages',
  CONTACT: '/api/remote/contact',
} as const;

// Export new structured endpoints for new code
export { NEW_API_ENDPOINTS };

/**
 * HTTP Client Configuration (legacy interface)
 */
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: unknown;
  token?: string;
}

/**
 * Standard API Response wrapper (legacy interface)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Make HTTP request to backend
 * This function now uses the enhanced API client internally
 *
 * @param endpoint - API endpoint path
 * @param config - Request configuration
 * @returns Promise with API response
 *
 * @deprecated Use apiClient from '@/lib/api/client' directly for new code
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  config: RequestConfig
): Promise<ApiResponse<T>> {
  // Log deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('apiRequest() is deprecated. Use apiClient from @/lib/api/client', {
      endpoint,
      method: config.method,
    });
  }

  // Use the new API client with backward-compatible options
  const response = await apiClient.request<T>({
    method: config.method as HttpMethod,
    endpoint,
    body: config.body,
    headers: config.headers as Record<string, string>,
    // If token is explicitly provided, use it; otherwise let the client handle auth
    skipAuth: config.token === undefined ? false : true,
  });

  // If a token was explicitly provided, we need to make another request with it
  // This handles the legacy pattern where token was passed explicitly
  if (config.token) {
    const responseWithToken = await apiClient.request<T>({
      method: config.method as HttpMethod,
      endpoint,
      body: config.body,
      headers: {
        ...config.headers as Record<string, string>,
        Authorization: `Bearer ${config.token}`,
      },
      skipAuth: true,
    });

    return {
      success: responseWithToken.success,
      data: responseWithToken.data,
      message: responseWithToken.message,
      error: responseWithToken.error,
      errors: responseWithToken.errors,
    };
  }

  // Convert new response format to legacy format
  return {
    success: response.success,
    data: response.data,
    message: response.message,
    error: response.error,
    errors: response.errors,
  };
}

// Re-export auth utilities
export { getAuthToken, setAuthToken, removeAuthToken, isAuthenticated };

// Export the new API client for gradual migration
export { apiClient };

// Export types from new system for gradual adoption
export type { NewApiResponse, HttpMethod };
