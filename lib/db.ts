/**
 * Database/API Client Configuration
 * Central configuration for all API calls to the backend server
 */

// Backend server URL
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://64.23.239.148';

// Log configuration in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    BASE_URL,
    environment: process.env.NODE_ENV,
  });
}

// API endpoints base paths
export const API_ENDPOINTS = {
  AUTH: '/api/remote/auth',
  USER: '/api/remote/user',
  PHOTOGRAPHERS: '/api/remote/photographers',
  EVENTS: '/api/remote/events',
  BOOKINGS: '/api/remote/bookings',
  MESSAGES: '/api/remote/messages',
  CONTACT: '/api/remote/contact',
} as const;

/**
 * HTTP Client Configuration
 */
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: any;
  token?: string;
}

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Make HTTP request to backend
 * @param endpoint - API endpoint path
 * @param config - Request configuration
 * @returns Promise with API response
 */
export async function apiRequest<T = any>(
  endpoint: string,
  config: RequestConfig
): Promise<ApiResponse<T>> {
  try {
    const url = `${BASE_URL}${endpoint}`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers as Record<string, string>),
    };

    // Add authorization token if provided
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    // Build request options
    const options: RequestInit = {
      method: config.method,
      headers,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Changed from 'include' - cookies not needed for token-based auth
    };

    // Add body for non-GET requests
    if (config.body && config.method !== 'GET') {
      options.body = JSON.stringify(config.body);
    }

    // Make the request
    console.log(`🔵 API Request: ${config.method} ${url}`);
    const response = await fetch(url, options);
    console.log(`🟢 API Response: ${response.status} ${response.statusText}`);

    // Try to parse response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      // If response is not JSON, return a generic error
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      // If response is OK but not JSON, return success with no data
      return {
        success: true,
        data: undefined,
      };
    }

    // Handle HTTP errors
    if (!response.ok) {
      console.error('❌ API Error Response:', data);
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
        errors: data.errors,
      };
    }

    console.log('✅ API Success:', data);

    // Check if backend indicates failure with action field
    if (typeof data.action === 'number' && data.action === 0) {
      return {
        success: false,
        error: data.message || 'Operation failed',
        data: data,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ API Request Error:', {
      endpoint,
      method: config.method,
      error,
      errorType: error instanceof TypeError ? 'Network/CORS Error' : 'Unknown Error',
    });

    // Provide more specific error messages
    let errorMessage = 'Network error occurred';

    if (error instanceof TypeError) {
      errorMessage = 'Failed to connect to server. Please check:\n' +
        '1. Backend server is running\n' +
        '2. CORS is configured correctly\n' +
        '3. Network connection is stable';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get authentication token from storage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Set authentication token in storage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
}

/**
 * Remove authentication token from storage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
