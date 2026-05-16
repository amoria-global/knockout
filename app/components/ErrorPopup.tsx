'use client';

/**
 * ErrorPopup - Premium brand-consistent modal popup for errors, warnings, info & success.
 *
 * Replaces inline error banners with an attention-grabbing centered modal that matches
 * Connekyt's brand language (Pragati Narrow font, brand-blue #083A85, glassmorphism,
 * smooth animations). Severity changes the icon, ring color and accent.
 *
 * IMPORTANT: This component is rendered through a React Portal directly to
 * `document.body`, so it escapes any transformed ancestor (which would otherwise
 * pin `position: fixed` inside that ancestor instead of the viewport). Styles are
 * applied INLINE for the same reason - styled-jsx scoping does not always reach
 * portaled DOM in Next.js, which causes button/text styles to silently drop.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PopupSeverity = 'error' | 'warning' | 'info' | 'success';

export interface PopupAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string; // bootstrap icon class e.g. 'bi-arrow-right'
}

export interface ErrorPopupProps {
  open: boolean;
  onClose: () => void;
  severity?: PopupSeverity;
  title?: string;
  message: string;
  hint?: string;
  primaryAction?: PopupAction;
  secondaryAction?: PopupAction;
  showClose?: boolean;
  dismissOnBackdrop?: boolean;
  dismissOnEsc?: boolean;
  icon?: string;
}

const SEVERITY_CONFIG: Record<PopupSeverity, {
  icon: string;
  ringColor: string;
  ringGlow: string;
  iconBg: string;
  iconColor: string;
  accent: string;
  accentSoft: string;
}> = {
  error: {
    icon: 'bi-exclamation-octagon-fill',
    ringColor: 'rgba(239,68,68,0.4)',
    ringGlow: 'rgba(239,68,68,0.18)',
    iconBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    iconColor: '#fff',
    accent: '#dc2626',
    accentSoft: 'rgba(239,68,68,0.08)',
  },
  warning: {
    icon: 'bi-exclamation-triangle-fill',
    ringColor: 'rgba(245,158,11,0.4)',
    ringGlow: 'rgba(245,158,11,0.18)',
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    iconColor: '#fff',
    accent: '#d97706',
    accentSoft: 'rgba(245,158,11,0.08)',
  },
  info: {
    icon: 'bi-info-circle-fill',
    ringColor: 'rgba(8,58,133,0.4)',
    ringGlow: 'rgba(8,58,133,0.18)',
    iconBg: 'linear-gradient(135deg, #3B82F6 0%, #083A85 100%)',
    iconColor: '#fff',
    accent: '#083A85',
    accentSoft: 'rgba(8,58,133,0.08)',
  },
  success: {
    icon: 'bi-check-circle-fill',
    ringColor: 'rgba(16,185,129,0.4)',
    ringGlow: 'rgba(16,185,129,0.18)',
    iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    iconColor: '#fff',
    accent: '#059669',
    accentSoft: 'rgba(16,185,129,0.08)',
  },
};

// One-time global stylesheet injection for the few rules that *can't* be inline:
// keyframes and `:hover` / `:active` pseudo-states. We attach it to <head> the
// first time the popup mounts and never remove it.
const STYLE_TAG_ID = 'ep-popup-global-styles';
const ensureGlobalStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_TAG_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_TAG_ID;
  tag.textContent = `
    @keyframes epOverlayIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes epCardIn {
      from { opacity: 0; transform: translateY(12px) scale(0.94); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes epPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); opacity: 0.7; }
    }
    @keyframes epIconBob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    .ep-close:hover {
      background: #f1f5f9 !important;
      color: #0f172a !important;
      border-color: rgba(15, 23, 42, 0.16) !important;
      transform: rotate(90deg);
    }
    .ep-btn:hover { transform: translateY(-1px); filter: brightness(1.04); }
    .ep-btn:active { transform: translateY(0); }
    .ep-btn-secondary:hover { background: #e2e8f0 !important; border-color: rgba(15, 23, 42, 0.16) !important; }
    @media (max-width: 480px) {
      .ep-card-inner { padding: 24px 18px 20px !important; border-radius: 18px !important; }
      .ep-actions { flex-direction: column !important; }
      .ep-btn { width: 100% !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ep-overlay, .ep-card-inner, .ep-icon-ring, .ep-icon-disc-i { animation: none !important; }
    }
  `;
  document.head.appendChild(tag);
};

export default function ErrorPopup({
  open,
  onClose,
  severity = 'error',
  title,
  message,
  hint,
  primaryAction,
  secondaryAction,
  showClose = true,
  dismissOnBackdrop = true,
  dismissOnEsc = true,
  icon,
}: ErrorPopupProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const cfg = SEVERITY_CONFIG[severity];

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    ensureGlobalStyles();
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { cardRef.current?.focus(); }, 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || !dismissOnEsc) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissOnEsc, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || !mounted) return null;

  const fallbackTitle = title || (
    severity === 'error' ? 'Something went wrong' :
    severity === 'warning' ? 'Heads up' :
    severity === 'success' ? 'All set' :
    'Just so you know'
  );

  const renderAction = (action: PopupAction, isPrimary: boolean) => {
    const variant = action.variant ?? (isPrimary ? 'primary' : 'secondary');
    const isPrimaryStyle = variant === 'primary';
    const isGhost = variant === 'ghost';

    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '12px 20px',
      minHeight: 44,
      borderRadius: 12,
      fontFamily: 'inherit',
      fontSize: 14.5,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'transform 180ms ease, filter 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      border: '1px solid transparent',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    };

    let variantStyle: React.CSSProperties = {};
    let extraClass = '';
    if (isPrimaryStyle) {
      variantStyle = {
        background: cfg.iconBg,
        color: '#fff',
        boxShadow: `0 6px 18px -6px ${cfg.ringGlow}`,
      };
    } else if (isGhost) {
      variantStyle = {
        background: 'transparent',
        color: cfg.accent,
      };
    } else {
      variantStyle = {
        background: '#f1f5f9',
        color: '#0f172a',
        borderColor: 'rgba(15, 23, 42, 0.08)',
      };
      extraClass = 'ep-btn-secondary';
    }

    return (
      <button
        type="button"
        className={`ep-btn ${extraClass}`}
        onClick={() => { action.onClick(); }}
        style={{ ...base, ...variantStyle }}
      >
        {action.icon && (
          <i
            className={`bi ${action.icon}`}
            aria-hidden="true"
            style={{ fontSize: 14, lineHeight: 1, display: 'inline-flex' }}
          />
        )}
        <span>{action.label}</span>
      </button>
    );
  };

  const popupNode = (
    <div
      className="ep-overlay"
      role="presentation"
      onClick={(e) => {
        if (!dismissOnBackdrop) return;
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10000,
        background: 'rgba(8, 16, 36, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'Pragati Narrow', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        animation: 'epOverlayIn 200ms ease-out',
      }}
    >
      <div
        ref={cardRef}
        className="ep-card-inner"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ep-title"
        aria-describedby="ep-message"
        tabIndex={-1}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: 22,
          padding: '28px 24px 24px',
          textAlign: 'center',
          boxShadow:
            '0 30px 80px -20px rgba(8, 16, 36, 0.45), 0 8px 24px -8px rgba(8, 16, 36, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
          outline: 'none',
          overflow: 'hidden',
          animation: 'epCardIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Decorative top gradient line */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: cfg.iconBg,
            opacity: 0.95,
          }}
        />

        {/* Close button */}
        {showClose && (
          <button
            type="button"
            className="ep-close"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              background: 'rgba(248, 250, 252, 0.9)',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              transition: 'all 180ms ease',
              padding: 0,
              zIndex: 2,
            }}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        )}

        {/* Icon with ring */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            width: 88,
            height: 88,
            margin: '6px auto 18px',
          }}
        >
          <span
            className="ep-icon-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: cfg.ringGlow,
              animation: 'epPulse 2.4s ease-in-out infinite',
            }}
          />
          <span
            className="ep-icon-ring"
            style={{
              position: 'absolute',
              top: -10,
              left: -10,
              right: -10,
              bottom: -10,
              borderRadius: '50%',
              background: 'transparent',
              border: `1px solid ${cfg.ringColor}`,
              animation: 'epPulse 2.4s ease-in-out infinite',
              animationDelay: '1.2s',
              opacity: 0.6,
            }}
          />
          <span
            style={{
              position: 'relative',
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: cfg.iconBg,
              color: cfg.iconColor,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              boxShadow: `0 12px 24px -6px ${cfg.ringGlow}, 0 0 0 6px rgba(255, 255, 255, 0.95) inset, 0 0 0 7px ${cfg.ringColor}`,
            }}
          >
            <i
              className={`bi ${icon || cfg.icon} ep-icon-disc-i`}
              style={{
                lineHeight: 1,
                animation: 'epIconBob 2s ease-in-out infinite',
              }}
            />
          </span>
        </div>

        {/* Content */}
        <h3
          id="ep-title"
          style={{
            margin: '0 0 8px',
            fontSize: 22,
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {fallbackTitle}
        </h3>
        <p
          id="ep-message"
          style={{
            margin: 0,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: 15,
            color: '#475569',
            lineHeight: 1.55,
            maxWidth: 360,
          }}
        >
          {message}
        </p>
        {hint && (
          <p
            style={{
              margin: '12px auto 0',
              padding: '10px 14px',
              fontSize: 12.5,
              color: '#64748b',
              background: cfg.accentSoft,
              borderRadius: 10,
              lineHeight: 1.5,
              maxWidth: 360,
            }}
          >
            {hint}
          </p>
        )}

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div
            className="ep-actions"
            style={{
              marginTop: 22,
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {secondaryAction && renderAction(secondaryAction, false)}
            {primaryAction && renderAction(primaryAction, true)}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(popupNode, document.body);
}
