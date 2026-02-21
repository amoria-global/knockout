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
 * Banner notification data
 */
export interface BannerNotification {
  message: string;
  color: string;
  visible: boolean;
}

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
  banner: BannerNotification;
  showBanner: (message: string, color: string, duration?: number) => void;
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
  const [banner, setBanner] = useState<BannerNotification>({ message: '', color: '', visible: false });

  const showBanner = useCallback((message: string, color: string, duration = 4000) => {
    setBanner({ message, color, visible: true });
    setTimeout(() => {
      setBanner(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

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

    let wasOffline = false;

    const unsubscribe = offlineDetector.subscribe(online => {
      setIsOnline(online);

      if (showOfflineNotification) {
        if (!online) {
          wasOffline = true;
        } else if (wasOffline) {
          // Only show reconnected banner after an actual offline→online transition
          showBanner('You are back online!', '#027a59');
          wasOffline = false;
        }
      }
    });

    return () => {
      unsubscribe();
      offlineDetector.destroy();
    };
  }, [showOfflineNotification, showBanner]);

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
      banner,
      showBanner,
    }),
    [toasts, isOnline, banner, showBanner]
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
