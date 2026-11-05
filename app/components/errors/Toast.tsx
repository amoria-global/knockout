'use client';

import React, { useEffect } from 'react';
import { useTheme } from './colors';
import { dismissToast, useErrorState, type ToastItem } from '@/lib/errorSystem/store';

/** Milliseconds a toast stays before it leaves by itself. */
export const TOAST_MS = 5000;

const ICON = { danger: 'bi-exclamation-circle', warning: 'bi-exclamation-triangle', info: 'bi-info-circle' } as const;

/**
 * Short, non-blocking problems with an optional Retry. Top right of the window. One shows at a time and the rest wait;
 * it leaves after 5 s or on the close button, and is announced politely to screen readers. Hovering or focusing it
 * keeps it on screen so a person can read it and reach Retry.
 */
export function ToastHost() {
  const { toasts } = useErrorState();
  const current = toasts[0];
  if (!current) return null;
  return <ToastView key={current.id} toast={current} />;
}

function ToastView({ toast }: { toast: ToastItem }) {
  const { colors } = useTheme();
  const [paused, setPaused] = React.useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismissToast(toast.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [paused, toast.id]);

  const tint = toast.tone === 'danger' ? colors.statusError : toast.tone === 'warning' ? colors.statusWarning : colors.statusInfo;
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 2000, maxWidth: 'min(420px, calc(100vw - 32px))' }}>
      <div
        role="alert"
        aria-live="polite"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, background: colors.bgCard, color: colors.textPrimary, border: `1px solid ${tint}`, borderRadius: 12, boxShadow: colors.shadowLg, padding: '10px 8px 10px 14px', minHeight: 48, animation: 'connektToastIn 180ms ease-out' }}
      >
        <i className={`bi ${ICON[toast.tone]}`} aria-hidden="true" style={{ color: tint, fontSize: '1.1rem' }} />
        <span style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.4, fontWeight: 500 }}>{toast.message}</span>
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            onClick={() => {
              dismissToast(toast.id);
              toast.onAction?.();
            }}
            style={{ minHeight: 44, minWidth: 44, padding: '0 10px', background: 'transparent', border: 'none', color: colors.textLink, fontWeight: 700, cursor: 'pointer' }}
          >
            {toast.actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => dismissToast(toast.id)}
          style={{ width: 44, height: 44, background: 'transparent', border: 'none', color: colors.textTertiary, cursor: 'pointer', fontSize: '1.1rem' }}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>
      <style>{'@keyframes connektToastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){[role=alert]{animation:none!important}}'}</style>
    </div>
  );
}
