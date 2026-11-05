'use client';

import React, { useState } from 'react';
import { useTheme } from './colors';
import type { ActionId } from '@/lib/errorSystem/catalogue';
import type { Presentation } from '@/lib/errorSystem/presentError';

/**
 * For a failure that leaves the page with nothing to show: the server is down, or the whole load failed. Plain
 * message, "Try again" as the filled action, "Go to Home" as the way out, and a short support code people can copy and
 * read out. Use it only then; anything smaller is a Toast, a Banner or a dialog.
 */
export function FullScreenError({ presentation, onAction }: { presentation: Presentation; onAction: (id: ActionId) => void }) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const [retry, ...rest] = presentation.actions;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(presentation.supportCode ?? '');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div role="alert" aria-live="assertive" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, display: 'grid', placeItems: 'center', background: colors.statusErrorBg, color: colors.statusError, fontSize: '2rem' }}>
          <i className="bi bi-cloud-slash" aria-hidden="true" />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary }}>{presentation.title}</h1>
        <p style={{ margin: 0, color: colors.textSecondary, lineHeight: 1.55 }}>{presentation.message}</p>
        <div style={{ display: 'grid', gap: 8, width: '100%', marginTop: 8 }}>
          {retry ? (
            <button type="button" onClick={() => onAction(retry.id)} style={{ minHeight: 44, borderRadius: 12, border: 'none', background: colors.brandPrimary, color: colors.textInverse, fontWeight: 700, cursor: 'pointer' }}>
              {retry.label}
            </button>
          ) : null}
          {rest.map((a) => (
            <button key={a.id} type="button" onClick={() => onAction(a.id)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, background: 'transparent', color: colors.textPrimary, fontWeight: 600, cursor: 'pointer' }}>
              {a.label}
            </button>
          ))}
        </div>
        {presentation.supportCode ? (
          <button type="button" onClick={copy} aria-label={`Support code ${presentation.supportCode}. Copy`} style={{ minHeight: 44, background: 'transparent', border: 'none', color: colors.textTertiary, fontSize: '0.8rem', cursor: 'pointer' }}>
            Support code {presentation.supportCode} · <span style={{ color: colors.textLink, fontWeight: 700 }}>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
