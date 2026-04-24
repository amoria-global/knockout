/**
 * Production-Safe Logger
 * Replaces console.log with environment-aware logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if debug logging is explicitly enabled
 */
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_API === 'true';

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, context } = entry;
  const prefix = getLogPrefix(level);

  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }

  return `${prefix} ${message}`;
}

/**
 * Get log prefix with emoji for visual distinction
 */
function getLogPrefix(level: LogLevel): string {
  const prefixes: Record<LogLevel, string> = {
    debug: '[DEBUG]',
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  };
  return prefixes[level];
}

/**
 * Determine if a log should be output based on level and environment
 */
function shouldLog(level: LogLevel): boolean {
  // Always log errors
  if (level === 'error') return true;

  // Always log warnings
  if (level === 'warn') return true;

  // In production, only log warnings and errors (already handled above)
  if (!isDevelopment && !isDebugEnabled) {
    return false;
  }

  // In development or with debug enabled, log everything
  return true;
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
  };
}

/**
 * Output log to console (development) or external service (production)
 */
function outputLog(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const formatted = formatLogEntry(entry);

  switch (entry.level) {
    case 'debug':
      if (isDevelopment || isDebugEnabled) {
        console.debug(formatted);
      }
      break;
    case 'info':
      if (isDevelopment || isDebugEnabled) {
        console.info(formatted);
      }
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      if (entry.error) {
        console.error(entry.error);
      }
      // In production, you could send to an error tracking service here
      // Example: sendToErrorTracking(entry);
      break;
  }
}

/**
 * Logger interface for API operations
 */
export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    const entry = createLogEntry('debug', message, context);
    outputLog(entry);
  },

  /**
   * Info level logging - development and when debug enabled
   */
  info(message: string, context?: LogContext): void {
    const entry = createLogEntry('info', message, context);
    outputLog(entry);
  },

  /**
   * Warning level logging - always in development, selective in production
   */
  warn(message: string, context?: LogContext): void {
    const entry = createLogEntry('warn', message, context);
    outputLog(entry);
  },

  /**
   * Error level logging - always logged
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const entry = createLogEntry('error', message, context, error);
    outputLog(entry);
  },

  /**
   * Log API request start
   */
  request(method: string, endpoint: string, requestId: string): void {
    this.debug(`API Request: ${method} ${endpoint}`, {
      method,
      endpoint,
      requestId,
    });
  },

  /**
   * Log API response.
   *
   * Level policy (matters in production — `warn` always prints, `debug` does not):
   *   - 2xx/3xx                           → debug   (routine success)
   *   - 401 / 403                         → debug   (not authenticated / not authorized —
   *                                                  expected at public surfaces before sign-in)
   *   - 404                               → debug   (routine "not found" for optional resources)
   *   - 408, 500, 502, 503, 504           → debug   (transient infrastructure failures the client
   *                                                  already retries via withRetry with exponential
   *                                                  backoff — logging each failed attempt as warn
   *                                                  spammed the console with a red wall during
   *                                                  backend restarts/deploys. If the retry chain
   *                                                  truly exhausts, the app surfaces its own error
   *                                                  UI; the developer doesn't need console noise
   *                                                  for every 502 that self-heals in 2s.)
   *   - 429                               → warn    (rate-limit hits are actionable)
   *   - Other 4xx (400, 405, 409, 422...) → warn    (business/validation errors the dev should see)
   */
  response(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    requestId: string
  ): void {
    const isExpectedAuthOrMissing =
      statusCode === 401 || statusCode === 403 || statusCode === 404;
    const isRetryableInfraBlip =
      statusCode === 408 ||
      statusCode === 500 ||
      statusCode === 502 ||
      statusCode === 503 ||
      statusCode === 504;
    const level: LogLevel =
      !isExpectedAuthOrMissing && !isRetryableInfraBlip && statusCode >= 400
        ? 'warn'
        : 'debug';
    const message = `API Response: ${method} ${endpoint} - ${statusCode}`;
    const context = { method, endpoint, statusCode, duration, requestId };

    if (level === 'warn') {
      this.warn(message, context);
    } else {
      this.debug(message, context);
    }
  },

  /**
   * Log API error
   */
  apiError(
    method: string,
    endpoint: string,
    error: Error,
    requestId: string
  ): void {
    this.error(`API Error: ${method} ${endpoint}`, error, {
      method,
      endpoint,
      requestId,
    });
  },

  /**
   * Log retry attempt
   */
  retry(attempt: number, maxRetries: number, delay: number, requestId: string): void {
    this.debug(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, {
      requestId,
    });
  },

  /**
   * Log rate limit hit
   */
  rateLimit(endpoint: string, remainingRequests: number): void {
    this.warn(`Rate limit approaching for ${endpoint}`, {
      endpoint,
      remainingRequests,
    });
  },

  /**
   * Log timeout
   */
  timeout(method: string, endpoint: string, timeoutMs: number, requestId: string): void {
    this.warn(`Request timeout: ${method} ${endpoint} after ${timeoutMs}ms`, {
      method,
      endpoint,
      duration: timeoutMs,
      requestId,
    });
  },

  /**
   * Log network status change
   */
  networkStatus(online: boolean): void {
    if (online) {
      this.info('Network connection restored');
    } else {
      this.warn('Network connection lost');
    }
  },
};

export default logger;
