/**
 * Error Types and Categories
 * Centralized error classification for user-friendly handling
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found',
  FORBIDDEN = 'forbidden',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * API Error class with rich metadata
 */
export class ApiError extends Error {
  public readonly category: ErrorCategory;
  public readonly statusCode?: number;
  public readonly originalError?: Error;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    message: string,
    category: ErrorCategory,
    options?: {
      statusCode?: number;
      originalError?: Error;
      context?: Record<string, unknown>;
      requestId?: string;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.category = category;
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;
    this.context = options?.context;
    this.requestId = options?.requestId;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Get severity based on category
   */
  get severity(): ErrorSeverity {
    switch (this.category) {
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.AUTH:
      case ErrorCategory.FORBIDDEN:
        return ErrorSeverity.HIGH;
      case ErrorCategory.SERVER:
        return ErrorSeverity.HIGH;
      case ErrorCategory.VALIDATION:
      case ErrorCategory.CLIENT:
        return ErrorSeverity.LOW;
      case ErrorCategory.RATE_LIMIT:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.NOT_FOUND:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Check if error is recoverable (user can retry)
   */
  get isRecoverable(): boolean {
    return [
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.SERVER,
    ].includes(this.category);
  }

  /**
   * Check if error requires re-authentication
   */
  get requiresAuth(): boolean {
    return this.category === ErrorCategory.AUTH;
  }

  /**
   * Serialize error for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      statusCode: this.statusCode,
      severity: this.severity,
      isRecoverable: this.isRecoverable,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      context: this.context,
    };
  }
}

/**
 * Network error (connection issues)
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Unable to connect to server', options?: {
    originalError?: Error;
    requestId?: string;
  }) {
    super(message, ErrorCategory.NETWORK, options);
    this.name = 'NetworkError';
  }
}

/**
 * Authentication error (401, invalid token)
 */
export class AuthError extends ApiError {
  constructor(message: string = 'Authentication required', options?: {
    statusCode?: number;
    requestId?: string;
  }) {
    super(message, ErrorCategory.AUTH, { ...options, statusCode: options?.statusCode || 401 });
    this.name = 'AuthError';
  }
}

/**
 * Validation error (400, 422 - invalid input)
 */
export class ValidationError extends ApiError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string = 'Validation failed', options?: {
    fieldErrors?: Record<string, string[]>;
    statusCode?: number;
    requestId?: string;
  }) {
    super(message, ErrorCategory.VALIDATION, {
      ...options,
      statusCode: options?.statusCode || 422,
      context: options?.fieldErrors ? { fieldErrors: options.fieldErrors } : undefined,
    });
    this.name = 'ValidationError';
    this.fieldErrors = options?.fieldErrors;
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(field: string): string | undefined {
    return this.fieldErrors?.[field]?.[0];
  }

  /**
   * Get all field error messages
   */
  getAllFieldErrors(): Record<string, string> {
    if (!this.fieldErrors) return {};

    const result: Record<string, string> = {};
    for (const [field, errors] of Object.entries(this.fieldErrors)) {
      if (errors.length > 0) {
        result[field] = errors[0];
      }
    }
    return result;
  }
}

/**
 * Server error (500+)
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Server error occurred', options?: {
    statusCode?: number;
    requestId?: string;
  }) {
    super(message, ErrorCategory.SERVER, { ...options, statusCode: options?.statusCode || 500 });
    this.name = 'ServerError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', options?: {
    requestId?: string;
  }) {
    super(message, ErrorCategory.NOT_FOUND, { ...options, statusCode: 404 });
    this.name = 'NotFoundError';
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied', options?: {
    requestId?: string;
  }) {
    super(message, ErrorCategory.FORBIDDEN, { ...options, statusCode: 403 });
    this.name = 'ForbiddenError';
  }
}

/**
 * Classify error from API response
 */
export function classifyError(
  error: string | Error,
  statusCode?: number,
  fieldErrors?: Record<string, string[]>,
  requestId?: string
): ApiError {
  const message = typeof error === 'string' ? error : error.message;
  const originalError = error instanceof Error ? error : undefined;

  // Classify by status code
  if (statusCode) {
    switch (statusCode) {
      case 400:
      case 422:
        return new ValidationError(message, { fieldErrors, statusCode, requestId });
      case 401:
        return new AuthError(message, { statusCode, requestId });
      case 403:
        return new ForbiddenError(message, { requestId });
      case 404:
        return new NotFoundError(message, { requestId });
      case 408:
        return new ApiError(message, ErrorCategory.TIMEOUT, { statusCode, requestId });
      case 429:
        return new ApiError(message, ErrorCategory.RATE_LIMIT, { statusCode, requestId });
      default:
        if (statusCode >= 500) {
          return new ServerError(message, { statusCode, requestId });
        }
    }
  }

  // Classify by error type
  if (originalError) {
    if (originalError instanceof TypeError && originalError.message.includes('fetch')) {
      return new NetworkError(message, { originalError, requestId });
    }
  }

  // Classify by message content
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('network') || lowerMessage.includes('connect')) {
    return new NetworkError(message, { originalError, requestId });
  }
  if (lowerMessage.includes('timeout')) {
    return new ApiError(message, ErrorCategory.TIMEOUT, { requestId });
  }
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
    return new AuthError(message, { requestId });
  }
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission')) {
    return new ForbiddenError(message, { requestId });
  }

  // Default to unknown
  return new ApiError(message, ErrorCategory.UNKNOWN, {
    originalError,
    statusCode,
    requestId
  });
}

/**
 * Type guards
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}
