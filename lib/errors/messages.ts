/**
 * User-Friendly Error Messages
 * i18n-ready error message mappings
 */

import { ErrorCategory } from './types';

/**
 * Error message configuration
 */
export interface ErrorMessage {
  /** Short title for the error */
  title: string;
  /** Detailed user-friendly description */
  description: string;
  /** Suggested action for the user */
  action?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
}

/**
 * Default error messages by category
 */
export const ERROR_MESSAGES: Record<ErrorCategory, ErrorMessage> = {
  [ErrorCategory.NETWORK]: {
    title: 'Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection.',
    action: 'Check your connection and try again.',
    showRetry: true,
  },
  [ErrorCategory.AUTH]: {
    title: 'Session Expired',
    description: 'Your session has expired. Please log in again to continue.',
    action: 'Log in to continue.',
    showRetry: false,
  },
  [ErrorCategory.VALIDATION]: {
    title: 'Invalid Input',
    description: 'Please check your input and correct any errors.',
    action: 'Review the highlighted fields.',
    showRetry: false,
  },
  [ErrorCategory.SERVER]: {
    title: 'Server Error',
    description: 'Something went wrong on our end. Our team has been notified.',
    action: 'Please try again later.',
    showRetry: true,
  },
  [ErrorCategory.CLIENT]: {
    title: 'Request Error',
    description: 'There was a problem with your request.',
    action: 'Please refresh the page and try again.',
    showRetry: true,
  },
  [ErrorCategory.TIMEOUT]: {
    title: 'Request Timeout',
    description: 'The request took too long to complete. This might be due to a slow connection.',
    action: 'Please try again.',
    showRetry: true,
  },
  [ErrorCategory.RATE_LIMIT]: {
    title: 'Too Many Requests',
    description: 'You\'ve made too many requests. Please wait a moment before trying again.',
    action: 'Wait a few seconds and try again.',
    showRetry: true,
  },
  [ErrorCategory.NOT_FOUND]: {
    title: 'Not Found',
    description: 'The requested resource could not be found.',
    action: 'Check the URL or go back.',
    showRetry: false,
  },
  [ErrorCategory.FORBIDDEN]: {
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource.',
    action: 'Contact support if you believe this is an error.',
    showRetry: false,
  },
  [ErrorCategory.UNKNOWN]: {
    title: 'Unexpected Error',
    description: 'An unexpected error occurred. Please try again.',
    action: 'Refresh the page and try again.',
    showRetry: true,
  },
};

/**
 * HTTP status code specific messages
 */
export const HTTP_STATUS_MESSAGES: Record<number, ErrorMessage> = {
  400: {
    title: 'Bad Request',
    description: 'The server could not understand your request. Please check your input.',
    showRetry: false,
  },
  401: {
    title: 'Authentication Required',
    description: 'Please log in to access this resource.',
    action: 'Log in to continue.',
    showRetry: false,
  },
  403: {
    title: 'Access Denied',
    description: 'You don\'t have permission to perform this action.',
    showRetry: false,
  },
  404: {
    title: 'Not Found',
    description: 'The requested page or resource doesn\'t exist.',
    showRetry: false,
  },
  408: {
    title: 'Request Timeout',
    description: 'The server took too long to respond.',
    action: 'Please try again.',
    showRetry: true,
  },
  409: {
    title: 'Conflict',
    description: 'This action conflicts with the current state of the resource.',
    showRetry: false,
  },
  422: {
    title: 'Validation Error',
    description: 'The submitted data is invalid. Please check and correct your input.',
    showRetry: false,
  },
  429: {
    title: 'Rate Limit Exceeded',
    description: 'Too many requests. Please slow down and try again shortly.',
    action: 'Wait a moment before retrying.',
    showRetry: true,
  },
  500: {
    title: 'Server Error',
    description: 'An internal server error occurred. Our team has been notified.',
    action: 'Please try again later.',
    showRetry: true,
  },
  502: {
    title: 'Bad Gateway',
    description: 'The server received an invalid response. Please try again.',
    showRetry: true,
  },
  503: {
    title: 'Service Unavailable',
    description: 'The service is temporarily unavailable. Please try again shortly.',
    action: 'The service should be back soon.',
    showRetry: true,
  },
  504: {
    title: 'Gateway Timeout',
    description: 'The server didn\'t respond in time. Please try again.',
    showRetry: true,
  },
};

/**
 * Context-specific error messages for common operations
 */
export const OPERATION_ERROR_MESSAGES: Record<string, Record<ErrorCategory, string>> = {
  login: {
    [ErrorCategory.AUTH]: 'Invalid email or password. Please check your credentials.',
    [ErrorCategory.NETWORK]: 'Unable to connect. Please check your internet connection.',
    [ErrorCategory.SERVER]: 'Login service is temporarily unavailable.',
    [ErrorCategory.RATE_LIMIT]: 'Too many login attempts. Please wait before trying again.',
    [ErrorCategory.VALIDATION]: 'Please enter a valid email and password.',
    [ErrorCategory.TIMEOUT]: 'Login request timed out. Please try again.',
    [ErrorCategory.CLIENT]: 'An error occurred during login.',
    [ErrorCategory.NOT_FOUND]: 'Account not found.',
    [ErrorCategory.FORBIDDEN]: 'Your account has been suspended.',
    [ErrorCategory.UNKNOWN]: 'An error occurred during login.',
  },
  signup: {
    [ErrorCategory.AUTH]: 'Registration failed. Please try again.',
    [ErrorCategory.NETWORK]: 'Unable to connect. Please check your internet connection.',
    [ErrorCategory.SERVER]: 'Registration service is temporarily unavailable.',
    [ErrorCategory.RATE_LIMIT]: 'Too many registration attempts. Please wait.',
    [ErrorCategory.VALIDATION]: 'Please check your registration details.',
    [ErrorCategory.TIMEOUT]: 'Registration timed out. Please try again.',
    [ErrorCategory.CLIENT]: 'An error occurred during registration.',
    [ErrorCategory.NOT_FOUND]: 'Registration service not available.',
    [ErrorCategory.FORBIDDEN]: 'Registration is not allowed.',
    [ErrorCategory.UNKNOWN]: 'An error occurred during registration.',
  },
  booking: {
    [ErrorCategory.AUTH]: 'Please log in to make a booking.',
    [ErrorCategory.NETWORK]: 'Unable to connect. Your booking was not saved.',
    [ErrorCategory.SERVER]: 'Booking service is temporarily unavailable.',
    [ErrorCategory.RATE_LIMIT]: 'Please wait before making another booking.',
    [ErrorCategory.VALIDATION]: 'Please check your booking details.',
    [ErrorCategory.TIMEOUT]: 'Booking request timed out. Please try again.',
    [ErrorCategory.CLIENT]: 'An error occurred while processing your booking.',
    [ErrorCategory.NOT_FOUND]: 'The selected photographer or time slot is no longer available.',
    [ErrorCategory.FORBIDDEN]: 'You cannot make this booking.',
    [ErrorCategory.UNKNOWN]: 'An error occurred while processing your booking.',
  },
  upload: {
    [ErrorCategory.AUTH]: 'Please log in to upload files.',
    [ErrorCategory.NETWORK]: 'Upload failed due to connection issues.',
    [ErrorCategory.SERVER]: 'Upload service is temporarily unavailable.',
    [ErrorCategory.RATE_LIMIT]: 'Too many uploads. Please wait.',
    [ErrorCategory.VALIDATION]: 'Invalid file type or size.',
    [ErrorCategory.TIMEOUT]: 'Upload timed out. Try a smaller file or better connection.',
    [ErrorCategory.CLIENT]: 'An error occurred during upload.',
    [ErrorCategory.NOT_FOUND]: 'Upload destination not found.',
    [ErrorCategory.FORBIDDEN]: 'You don\'t have permission to upload here.',
    [ErrorCategory.UNKNOWN]: 'An error occurred during upload.',
  },
};

/**
 * Get error message for a category
 */
export function getErrorMessage(category: ErrorCategory): ErrorMessage {
  return ERROR_MESSAGES[category] || ERROR_MESSAGES[ErrorCategory.UNKNOWN];
}

/**
 * Get error message for HTTP status code
 */
export function getStatusMessage(statusCode: number): ErrorMessage | undefined {
  return HTTP_STATUS_MESSAGES[statusCode];
}

/**
 * Get context-specific error message
 */
export function getOperationErrorMessage(
  operation: string,
  category: ErrorCategory
): string {
  const operationMessages = OPERATION_ERROR_MESSAGES[operation];
  if (operationMessages && operationMessages[category]) {
    return operationMessages[category];
  }
  return ERROR_MESSAGES[category]?.description || 'An error occurred.';
}

/**
 * Format validation errors into a single message
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  const messages: string[] = [];

  for (const [field, fieldErrors] of Object.entries(errors)) {
    if (fieldErrors.length > 0) {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
      messages.push(`${fieldName}: ${fieldErrors[0]}`);
    }
  }

  if (messages.length === 0) {
    return 'Please check your input.';
  }

  if (messages.length === 1) {
    return messages[0];
  }

  return `Please correct the following:\n${messages.map(m => `- ${m}`).join('\n')}`;
}

/**
 * Get short error message (for toasts)
 */
export function getShortErrorMessage(
  category: ErrorCategory,
  statusCode?: number
): string {
  // Try status code first
  if (statusCode && HTTP_STATUS_MESSAGES[statusCode]) {
    return HTTP_STATUS_MESSAGES[statusCode].title;
  }

  // Fall back to category
  return ERROR_MESSAGES[category]?.title || 'Error';
}

/**
 * Check if error message suggests user should retry
 */
export function shouldSuggestRetry(category: ErrorCategory): boolean {
  return ERROR_MESSAGES[category]?.showRetry ?? false;
}
