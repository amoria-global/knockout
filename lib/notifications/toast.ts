/**
 * Toast Notification Manager
 * Centralized toast notification system
 */

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification data
 */
export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast type for styling */
  type: ToastType;
  /** Title/heading */
  title?: string;
  /** Main message content */
  message: string;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Whether toast can be dismissed */
  dismissible?: boolean;
  /** Timestamp when toast was created */
  createdAt: number;
}

/**
 * Toast creation options
 */
export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

/**
 * Toast listener function type
 */
export type ToastListener = (toasts: Toast[]) => void;

/**
 * Generate unique ID for toasts
 */
function generateId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Default durations by toast type
 */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

/**
 * Toast Manager singleton class
 */
class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private maxToasts: number = 5;

  /**
   * Subscribe to toast changes
   * @returns Unsubscribe function
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);

    // Immediately send current state
    listener([...this.toasts]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of toast changes
   */
  private notify(): void {
    const currentToasts = [...this.toasts];
    this.listeners.forEach(listener => {
      try {
        listener(currentToasts);
      } catch (error) {
        console.error('Error in toast listener:', error);
      }
    });
  }

  /**
   * Add a new toast notification
   */
  private add(type: ToastType, message: string, options: ToastOptions = {}): string {
    const id = generateId();
    const duration = options.duration ?? DEFAULT_DURATIONS[type];

    const toast: Toast = {
      id,
      type,
      message,
      title: options.title,
      duration,
      action: options.action,
      dismissible: options.dismissible ?? true,
      createdAt: Date.now(),
    };

    // Remove oldest if at max
    if (this.toasts.length >= this.maxToasts) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    this.toasts.push(toast);
    this.notify();

    // Set auto-dismiss timeout
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timeouts.set(id, timeoutId);
    }

    return id;
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id: string): void {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    // Clear timeout if exists
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }

    this.toasts.splice(index, 1);
    this.notify();
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    // Clear all timeouts
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();

    this.toasts = [];
    this.notify();
  }

  /**
   * Show a success toast
   */
  success(message: string, options?: ToastOptions): string {
    return this.add('success', message, {
      title: 'Success',
      ...options,
    });
  }

  /**
   * Show an error toast
   */
  error(message: string, options?: ToastOptions): string {
    return this.add('error', message, {
      title: 'Error',
      ...options,
    });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, options?: ToastOptions): string {
    return this.add('warning', message, {
      title: 'Warning',
      ...options,
    });
  }

  /**
   * Show an info toast
   */
  info(message: string, options?: ToastOptions): string {
    return this.add('info', message, {
      title: 'Info',
      ...options,
    });
  }

  /**
   * Show toast with custom type
   */
  show(type: ToastType, message: string, options?: ToastOptions): string {
    return this.add(type, message, options);
  }

  /**
   * Show a loading toast that can be updated
   */
  loading(message: string): {
    id: string;
    success: (msg: string) => void;
    error: (msg: string) => void;
    dismiss: () => void;
  } {
    const id = this.add('info', message, {
      title: 'Loading...',
      duration: 0, // No auto-dismiss
      dismissible: false,
    });

    return {
      id,
      success: (msg: string) => {
        this.dismiss(id);
        this.success(msg);
      },
      error: (msg: string) => {
        this.dismiss(id);
        this.error(msg);
      },
      dismiss: () => this.dismiss(id),
    };
  }

  /**
   * Promise-based toast for async operations
   */
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ): Promise<T> {
    const loadingToast = this.loading(messages.loading);

    try {
      const result = await promise;
      const successMessage =
        typeof messages.success === 'function'
          ? messages.success(result)
          : messages.success;
      loadingToast.success(successMessage);
      return result;
    } catch (error) {
      const errorMessage =
        typeof messages.error === 'function'
          ? messages.error(error as Error)
          : messages.error;
      loadingToast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Get current toasts (read-only)
   */
  getToasts(): readonly Toast[] {
    return [...this.toasts];
  }

  /**
   * Set maximum number of visible toasts
   */
  setMaxToasts(max: number): void {
    this.maxToasts = max;
  }
}

/**
 * Singleton toast manager instance
 */
export const toast = new ToastManager();

/**
 * Export manager class for custom instances
 */
export { ToastManager };

export default toast;
