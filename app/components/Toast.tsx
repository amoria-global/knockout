'use client';

/**
 * Toast UI Component
 * Modern, clean toast notification design
 */

import React, { useEffect, useState } from 'react';
import { useToasts, useToast } from '@/lib/notifications/ToastProvider';
import type { Toast as ToastType, ToastType as ToastVariant } from '@/lib/notifications/toast';

/**
 * Toast icon components by type - Clean minimal icons
 */
const ToastIcons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

/**
 * Toast configurations by type
 */
const toastConfig: Record<ToastVariant, {
  bg: string;
  iconBg: string;
  iconColor: string;
  border: string;
  progress: string;
}> = {
  success: {
    bg: 'bg-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-l-green-500',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-l-red-500',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-l-amber-500',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-l-blue-500',
    progress: 'bg-blue-500',
  },
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

  const config = toastConfig[toast.type];

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
        ${config.bg}
        border border-gray-200 border-l-4 ${config.border}
        rounded-lg shadow-lg
        transform transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 w-8 h-8 rounded-full
              flex items-center justify-center
              ${config.iconBg} ${config.iconColor}
            `}
          >
            {ToastIcons[toast.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {toast.title && (
              <p className="font-semibold text-sm text-gray-900">{toast.title}</p>
            )}
            <p className={`text-sm text-gray-600 ${toast.title ? 'mt-0.5' : ''} leading-relaxed`}>
              {toast.message}
            </p>

            {/* Action button */}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  handleDismiss();
                }}
                className={`mt-2 text-sm font-medium ${config.iconColor} hover:underline`}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          {toast.dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
          <div
            className={`h-full transition-all duration-100 ease-linear ${config.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
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
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none sm:bottom-6 sm:right-6"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto animate-in slide-in-from-right-full duration-200">
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
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium shadow-md"
    >
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656M12 12h.01" />
        </svg>
        You are offline. Some features may not work.
      </span>
    </div>
  );
}

export default ToastContainer;
