'use client';

/**
 * Toast UI Component
 * Visual toast notification display
 */

import React, { useEffect, useState } from 'react';
import { useToasts, useToast } from '@/lib/notifications/ToastProvider';
import type { Toast as ToastType, ToastType as ToastVariant } from '@/lib/notifications/toast';

/**
 * Toast icon components by type
 */
const ToastIcons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

/**
 * Toast color styles by type
 */
const toastStyles: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles: Record<ToastVariant, string> = {
  success: 'text-green-500 bg-green-100',
  error: 'text-red-500 bg-red-100',
  warning: 'text-yellow-500 bg-yellow-100',
  info: 'text-blue-500 bg-blue-100',
};

/**
 * Individual toast item component
 */
interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Handle exit animation
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  };

  // Progress bar for auto-dismiss toasts
  useEffect(() => {
    const duration = toast.duration;
    if (!duration || duration <= 0) return;

    const startTime = toast.createdAt;
    const endTime = startTime + duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;
      setProgress(newProgress);

      if (newProgress <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.createdAt, toast.duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative overflow-hidden
        w-full max-w-sm
        border rounded-lg shadow-lg
        transform transition-all duration-200 ease-out
        ${toastStyles[toast.type]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 w-8 h-8 rounded-full
              flex items-center justify-center
              ${iconStyles[toast.type]}
            `}
          >
            {ToastIcons[toast.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="font-semibold text-sm">{toast.title}</p>
            )}
            <p className="text-sm mt-0.5 opacity-90">{toast.message}</p>

            {/* Action button */}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  handleDismiss();
                }}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          {toast.dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Dismiss notification"
            >
              <svg
                className="w-4 h-4 opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}

/**
 * Toast container component
 * Renders all active toasts
 */
export function ToastContainer() {
  const toasts = useToasts();
  const { dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

/**
 * Offline banner component
 */
export function OfflineBanner() {
  const { isOnline } = useToast();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 text-center py-2 px-4 text-sm font-medium"
    >
      <span className="inline-flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656M12 12h.01"
          />
        </svg>
        You are offline. Some features may not work.
      </span>
    </div>
  );
}

export default ToastContainer;
