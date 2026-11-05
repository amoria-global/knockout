'use client';

import React from 'react';
import { useTheme } from './colors';
import { clearBanner, useErrorState, type BannerTone } from '@/lib/errorSystem/store';

const ICON: Record<BannerTone, string> = { warning: 'bi-wifi-off', info: 'bi-info-circle', success: 'bi-check-circle' };

/**
 * A state that stays until it changes: offline, a degraded service, an account notice, and the green "back online"
 * that replaces them. Amber warns, blue informs, green says recovered. It never auto-dismisses; the close button only
 * appears when the state does not block anything.
 */
export function Banner({ tone, title, message, actionLabel, onAction, onDismiss }: {
  tone: BannerTone;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  const { colors } = useTheme();
  const fg = tone === 'warning' ? colors.statusWarning : tone === 'success' ? colors.statusSuccess : colors.statusInfo;
  const bg = tone === 'warning' ? colors.statusWarningBg : tone === 'success' ? colors.statusSuccessBg : colors.statusInfoBg;
  return (
    <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border: `1px solid ${fg}`, borderRadius: 12, padding: '10px 8px 10px 14px', minHeight: 48 }}>
      <i className={`bi ${ICON[tone]}`} aria-hidden="true" style={{ color: fg, fontSize: '1.1rem' }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: colors.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
        {message ? <div style={{ color: colors.textSecondary, fontSize: '0.82rem', lineHeight: 1.4 }}>{message}</div> : null}
      </div>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} style={{ minHeight: 44, minWidth: 44, padding: '0 10px', background: 'transparent', border: 'none', color: colors.textLink, fontWeight: 700, cursor: 'pointer' }}>
          {actionLabel}
        </button>
      ) : null}
      {onDismiss ? (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} style={{ width: 44, height: 44, background: 'transparent', border: 'none', color: colors.textTertiary, cursor: 'pointer' }}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/** Banners requested through the store, stacked where the screen places this. */
export function BannerHost() {
  const { banners } = useErrorState();
  if (!banners.length) return null;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {banners.map((b) => (
        <Banner key={b.key} tone={b.tone} title={b.title} message={b.message} actionLabel={b.actionLabel} onAction={b.onAction} onDismiss={b.dismissible ? () => clearBanner(b.key) : undefined} />
      ))}
    </div>
  );
}
