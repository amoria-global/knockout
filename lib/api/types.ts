/**
 * API Types and Interfaces
 * Core type definitions for the enhanced API client
 */

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request priority levels for queue management
export type RequestPriority = 'high' | 'normal' | 'low';

/**
 * Request configuration options
 */
export interface RequestOptions {
  /** HTTP method */
  method: HttpMethod;
  /** API endpoint path (without base URL) */
  endpoint: string;
  /** Request body (will be JSON stringified for non-FormData) */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Request priority for queue (default: 'normal') */
  priority?: RequestPriority;
  /** Enable request deduplication for GET requests (default: true for GET) */
  deduplicate?: boolean;
  /** External AbortSignal for request cancellation */
  signal?: AbortSignal;
  /** Skip authentication header */
  skipAuth?: boolean;
  /** Custom request ID for tracing */
  requestId?: string;
}

/**
 * Standardized API response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Success or info message from server */
  message?: string;
  /** Error message if request failed */
  error?: string;
  /** Validation errors by field */
  errors?: Record<string, string[]>;
  /** HTTP status code */
  statusCode?: number;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Backend response format (from Amoria Connect API)
 */
export interface BackendResponse<T = unknown> {
  /** Action result: 0 = failure, 1 = success */
  action?: number;
  /** Response message */
  message?: string;
  /** Response data */
  data?: T;
  /** Error details */
  error?: string;
  /** Validation errors */
  errors?: Record<string, string[]>;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (
  options: RequestOptions
) => RequestOptions | Promise<RequestOptions>;

/**
 * Response interceptor function type
 */
export type ResponseInterceptor<T = unknown> = (
  response: ApiResponse<T>,
  options: RequestOptions
) => ApiResponse<T> | Promise<ApiResponse<T>>;

/**
 * Error interceptor function type
 */
export type ErrorInterceptor = (
  error: Error,
  options: RequestOptions
) => void | Promise<void>;

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds */
  baseDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** HTTP status codes that should trigger retry */
  retryableStatuses: number[];
  /** Custom condition to determine if error is retryable */
  retryCondition?: (error: Error, statusCode?: number) => boolean;
}

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default timeout in milliseconds */
  timeout: number;
  /** Default retry configuration */
  retry: RetryConfig;
  /** Rate limit configuration */
  rateLimit: RateLimitConfig;
  /** Enable debug logging (development only) */
  debug: boolean;
}

/**
 * Queued request item
 */
export interface QueuedRequest {
  /** Unique request identifier */
  id: string;
  /** Request options */
  options: RequestOptions;
  /** Request priority */
  priority: RequestPriority;
  /** Promise resolve function */
  resolve: (value: ApiResponse) => void;
  /** Promise reject function */
  reject: (error: Error) => void;
  /** Timestamp when request was queued */
  timestamp: number;
}

// ============================================
// Authentication Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  action: number;
  message: string;
  otpVerified?: boolean;
  accountLocked?: boolean;
  applicantId?: string;
  token?: string;
  user?: UserData;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerType: string;
  password: string;
}

export interface VerifyOtpRequest {
  customerId: string; // UUID
  otp: number;
}

export interface SetNewPasswordRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  profileImage?: string;
}

// ============================================
// Photographer Types
// ============================================

export interface PhotographerListParams {
  page?: number;
  size?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
}

export interface PhotographerCategory {
  id: string;
  name: string;
  description?: string;
}

export interface City {
  id: string;
  name: string;
  country?: string;
}
