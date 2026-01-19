'use client';

/**
 * Toast Provider Component
 * React context provider for toast notifications
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { toast as toastManager, Toast, ToastOptions, ToastType } from './toast';
import { offlineDetector } from '../network/offline-detector';

/**
 * Toast context value type
 */
interface ToastContextValue {
  toasts: Toast[];
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  show: (type: ToastType, message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  loading: (message: string) => {
    id: string;
    success: (msg: string) => void;
    error: (msg: string) => void;
    dismiss: () => void;
  };
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => Promise<T>;
  isOnline: boolean;
}

/**
 * Toast context
 */
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast provider props
 */
interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum visible toasts */
  maxToasts?: number;
  /** Show offline notification */
  showOfflineNotification?: boolean;
}

/**
 * Toast Provider Component
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  showOfflineNotification = true,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineToastId, setOfflineToastId] = useState<string | null>(null);

  // Set max toasts
  useEffect(() => {
    toastManager.setMaxToasts(maxToasts);
  }, [maxToasts]);

  // Subscribe to toast changes
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  // Initialize offline detector and subscribe to network changes
  useEffect(() => {
    offlineDetector.init();

    const unsubscribe = offlineDetector.subscribe(online => {
      setIsOnline(online);

      if (showOfflineNotification) {
        if (!online) {
          // Show persistent offline notification
          const id = toastManager.warning(
            'You are offline. Some features may be unavailable.',
            {
              title: 'No Internet Connection',
              duration: 0, // Don't auto-dismiss
              dismissible: false,
            }
          );
          setOfflineToastId(id);
        } else {
          // Dismiss offline notification and show reconnected
          if (offlineToastId) {
            toastManager.dismiss(offlineToastId);
            setOfflineToastId(null);
          }
          toastManager.success('You are back online!', {
            title: 'Connected',
            duration: 3000,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      offlineDetector.destroy();
    };
  }, [showOfflineNotification, offlineToastId]);

  // Memoized context value
  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toasts,
      success: toastManager.success.bind(toastManager),
      error: toastManager.error.bind(toastManager),
      warning: toastManager.warning.bind(toastManager),
      info: toastManager.info.bind(toastManager),
      show: toastManager.show.bind(toastManager),
      dismiss: toastManager.dismiss.bind(toastManager),
      dismissAll: toastManager.dismissAll.bind(toastManager),
      loading: toastManager.loading.bind(toastManager),
      promise: toastManager.promise.bind(toastManager),
      isOnline,
    }),
    [toasts, isOnline]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

/**
 * Hook to get current toasts
 */
export function useToasts(): Toast[] {
  const { toasts } = useToast();
  return toasts;
}

/**
 * Hook to check online status
 */
export function useOnlineStatus(): boolean {
  const { isOnline } = useToast();
  return isOnline;
}

export default ToastProvider;
