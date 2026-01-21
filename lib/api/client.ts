/**
 * Enhanced API Client
 * Professional HTTP client with timeout, retry, rate limiting, and interceptors
 */

import type {
  RequestOptions,
  ApiResponse,
  BackendResponse,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  HttpMethod,
} from './types';
import { API_CONFIG, HTTP_STATUS } from './config';
import { logger } from './logger';
import { createTimeoutController, combineAbortSignals, isTimeoutError, isAbortError } from './utils/timeout';
import { withRetry } from './utils/retry';
import { getRateLimiterForEndpoint, isRateLimitError } from './utils/rate-limiter';

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Token storage key
 */
const AUTH_TOKEN_KEY = 'authToken';

/**
 * Get authentication token from storage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Set authentication token in storage
 */
function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Remove authentication token from storage
 */
function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * API Client class with interceptors and advanced features
 */
class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private pendingRequests: Map<string, Promise<ApiResponse>> = new Map();

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Run request through interceptors
   */
  private async runRequestInterceptors(options: RequestOptions): Promise<RequestOptions> {
    let result = options;
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Run response through interceptors
   */
  private async runResponseInterceptors<T>(
    response: ApiResponse<T>,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    let result = response;
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result, options) as ApiResponse<T>;
    }
    return result;
  }

  /**
   * Run error through interceptors
   */
  private async runErrorInterceptors(error: Error, options: RequestOptions): Promise<void> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error, options);
    }
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    const base = API_CONFIG.baseUrl.replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  /**
   * Build request headers
   */
  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if not skipped
    if (!options.skipAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Generate deduplication key for request
   */
  private getDeduplicationKey(options: RequestOptions): string {
    return `${options.method}:${options.endpoint}:${JSON.stringify(options.body || {})}`;
  }

  /**
   * Extract error message from various backend response formats
   */
  private extractErrorMessage(data: Record<string, unknown>): string {
    // Try multiple possible error message fields (ordered by priority)
    const errorFields = ['message', 'error', 'errorMessage', 'msg', 'description', 'detail', 'reason'];

    for (const field of errorFields) {
      const value = data[field];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    // Check nested error object
    if (data.error && typeof data.error === 'object') {
      const errorObj = data.error as Record<string, unknown>;
      for (const field of errorFields) {
        const value = errorObj[field];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }

    // Check errors array
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (typeof firstError === 'string') {
        return firstError;
      }
      if (typeof firstError === 'object' && firstError) {
        const errorItem = firstError as Record<string, unknown>;
        if (typeof errorItem.message === 'string') return errorItem.message;
        if (typeof errorItem.msg === 'string') return errorItem.msg;
      }
    }

    return 'Operation failed';
  }

  /**
   * Parse backend response into standardized format
   */
  private parseResponse<T>(
    data: BackendResponse<T>,
    statusCode: number,
    requestId: string
  ): ApiResponse<T> {
    // Check backend action field (0 = failure, 1 = success)
    if (typeof data.action === 'number' && data.action === 0) {
      return {
        success: false,
        error: this.extractErrorMessage(data as unknown as Record<string, unknown>),
        data: data.data,
        statusCode,
        requestId,
      };
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : (data as unknown as T),
      message: data.message,
      statusCode,
      requestId,
    };
  }

  /**
   * Execute HTTP request
   */
  private async executeRequest<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const requestId = options.requestId || generateRequestId();
    const timeout = options.timeout || API_CONFIG.timeout;
    const url = this.buildUrl(options.endpoint);
    const headers = this.buildHeaders(options);

    // Create timeout controller
    const { controller: timeoutController, cleanup } = createTimeoutController(
      timeout,
      options.endpoint,
      requestId
    );

    // Combine with external signal if provided
    const combinedController = options.signal
      ? combineAbortSignals(timeoutController.signal, options.signal)
      : timeoutController;

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
      signal: combinedController.signal,
      mode: 'cors',
      credentials: 'omit',
    };

    // Add body for non-GET requests
    if (options.body && options.method !== 'GET') {
      if (options.body instanceof FormData) {
        // Remove Content-Type for FormData (browser sets it with boundary)
        delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
        fetchOptions.body = options.body;
      } else {
        fetchOptions.body = JSON.stringify(options.body);
      }
    }

    const startTime = Date.now();
    logger.request(options.method, options.endpoint, requestId);

    try {
      const response = await fetch(url, fetchOptions);
      const duration = Date.now() - startTime;

      logger.response(options.method, options.endpoint, response.status, duration, requestId);

      // Parse response body
      let data: BackendResponse<T>;
      try {
        data = await response.json();
      } catch {
        // Non-JSON response
        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
            requestId,
          };
        }
        return {
          success: true,
          data: undefined,
          statusCode: response.status,
          requestId,
        };
      }

      // Handle HTTP errors
      if (!response.ok) {
        const errorMessage = this.extractErrorMessage(data as unknown as Record<string, unknown>);
        return {
          success: false,
          error: errorMessage !== 'Operation failed' ? errorMessage : `HTTP ${response.status}: ${response.statusText}`,
          errors: data.errors,
          statusCode: response.status,
          requestId,
        };
      }

      return this.parseResponse<T>(data, response.status, requestId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Handle specific error types
      if (isTimeoutError(err)) {
        return {
          success: false,
          error: `Request timed out after ${timeout}ms. Please try again.`,
          statusCode: HTTP_STATUS.TIMEOUT,
          requestId,
        };
      }

      if (isAbortError(err)) {
        return {
          success: false,
          error: 'Request was cancelled.',
          requestId,
        };
      }

      // Network errors
      if (err instanceof TypeError) {
        return {
          success: false,
          error: 'Unable to connect to server. Please check your internet connection.',
          requestId,
        };
      }

      logger.apiError(options.method, options.endpoint, err, requestId);

      return {
        success: false,
        error: err.message || 'An unexpected error occurred.',
        requestId,
      };
    } finally {
      cleanup();
    }
  }

  /**
   * Make an API request with all features enabled
   */
  async request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
    const requestId = options.requestId || generateRequestId();
    const optionsWithId = { ...options, requestId };

    try {
      // Run request interceptors
      const processedOptions = await this.runRequestInterceptors(optionsWithId);

      // Check rate limit
      const rateLimiter = getRateLimiterForEndpoint(processedOptions.endpoint);
      rateLimiter.checkOrThrow(processedOptions.endpoint);

      // Handle request deduplication for GET requests
      const shouldDeduplicate =
        processedOptions.deduplicate !== false && processedOptions.method === 'GET';

      if (shouldDeduplicate) {
        const key = this.getDeduplicationKey(processedOptions);
        const pending = this.pendingRequests.get(key);

        if (pending) {
          logger.debug(`Deduplicating request: ${processedOptions.endpoint}`, { requestId });
          return pending as Promise<ApiResponse<T>>;
        }
      }

      // Create request promise with retry
      const requestPromise = withRetry<ApiResponse<T>>(
        async () => {
          const response = await this.executeRequest<T>(processedOptions);

          // Throw error for retry mechanism if request failed with retryable status
          if (!response.success && response.statusCode) {
            const error = new Error(response.error) as Error & { statusCode: number };
            error.statusCode = response.statusCode;
            throw error;
          }

          return response;
        },
        {
          ...API_CONFIG.retry,
          maxRetries: processedOptions.retries ?? API_CONFIG.retry.maxRetries,
        },
        requestId
      ).catch(async (error): Promise<ApiResponse<T>> => {
        // If retry exhausted, return error response
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Request failed after retries',
          requestId,
        };
      });

      // Store for deduplication
      if (shouldDeduplicate) {
        const key = this.getDeduplicationKey(processedOptions);
        this.pendingRequests.set(key, requestPromise as Promise<ApiResponse>);
        requestPromise.finally(() => {
          this.pendingRequests.delete(key);
        });
      }

      // Execute and run response interceptors
      const response = await requestPromise;
      return await this.runResponseInterceptors(response, processedOptions);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Handle rate limit errors specially
      if (isRateLimitError(err)) {
        return {
          success: false,
          error: err.message,
          statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
          requestId,
        };
      }

      // Run error interceptors
      await this.runErrorInterceptors(err, optionsWithId);

      return {
        success: false,
        error: err.message || 'An unexpected error occurred.',
        requestId,
      };
    }
  }

  /**
   * Convenience method for GET requests
   */
  get<T = unknown>(endpoint: string, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', endpoint, ...options });
  }

  /**
   * Convenience method for POST requests
   */
  post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Partial<RequestOptions>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', endpoint, body, ...options });
  }

  /**
   * Convenience method for PUT requests
   */
  put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Partial<RequestOptions>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', endpoint, body, ...options });
  }

  /**
   * Convenience method for PATCH requests
   */
  patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Partial<RequestOptions>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', endpoint, body, ...options });
  }

  /**
   * Convenience method for DELETE requests
   */
  delete<T = unknown>(
    endpoint: string,
    options?: Partial<RequestOptions>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', endpoint, ...options });
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient();

/**
 * Export auth token utilities for backward compatibility
 */
export { getAuthToken, setAuthToken, removeAuthToken, isAuthenticated };

/**
 * Export client class for custom instances
 */
export { ApiClient };

export default apiClient;
