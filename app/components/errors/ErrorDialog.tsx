'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from './colors';
import type { ActionId } from '@/lib/errorSystem/catalogue';
import type { Presentation } from '@/lib/errorSystem/presentError';
import { closeSheet, useErrorState } from '@/lib/errorSystem/store';

const ICON = { danger: 'bi-exclamation-circle', warning: 'bi-exclamation-triangle', info: 'bi-info-circle' } as const;

/**
 * A centred dialog for a failure that needs a decision: a payment that did not go through, a permission that is blocked,
 * a step that cannot be undone. It says what happened, reassures about what did not (the message carries "You weren't
 * charged."), and offers clear choices: the first action is the filled one, the rest are quieter, and the last is always
 * a plain way out. Focus moves to the first action when it opens and returns to where it was when it closes; Escape and
 * a click outside close it; Tab stays inside.
 */
export function ErrorDialog({ presentation, onAction, onClose }: { presentation: Presentation; onAction: (id: ActionId) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const root = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [primary, ...rest] = presentation.actions;
  const quiet = rest.filter((a) => a.id !== 'dismiss');
  const tint = presentation.tone === 'danger' ? colors.statusError : presentation.tone === 'warning' ? colors.statusWarning : colors.statusInfo;

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();
    return () => before?.focus?.();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !root.current) return;
    const items = Array.from(root.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const quietStyle: React.CSSProperties = { minHeight: 44, borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, background: 'transparent', color: colors.textPrimary, fontWeight: 600, cursor: 'pointer' };

  return (
    <div onMouseDown={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 2100, background: colors.bgOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        ref={root}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-message"
        onKeyDown={onKeyDown}
        style={{ width: '100%', maxWidth: 420, background: colors.bgModal, color: colors.textPrimary, borderRadius: 20, boxShadow: colors.shadowXl, padding: 24, textAlign: 'center', display: 'grid', gap: 12 }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 16, margin: '0 auto', display: 'grid', placeItems: 'center', border: `1px solid ${tint}`, color: tint, fontSize: '1.5rem' }}>
          <i className={`bi ${ICON[presentation.tone]}`} aria-hidden="true" />
        </div>
        <h2 id="error-dialog-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{presentation.title}</h2>
        <p id="error-dialog-message" style={{ margin: 0, color: colors.textSecondary, fontSize: '0.92rem', lineHeight: 1.5 }}>{presentation.message}</p>
        {presentation.supportCode ? <div style={{ color: colors.textTertiary, fontSize: '0.78rem' }}>Support code {presentation.supportCode}</div> : null}
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {primary ? (
            <button ref={primaryRef} type="button" onClick={() => onAction(primary.id)} style={{ minHeight: 44, borderRadius: 12, border: 'none', background: colors.brandPrimary, color: colors.textInverse, fontWeight: 700, cursor: 'pointer' }}>
              {primary.label}
            </button>
          ) : null}
          {quiet.map((a) => (
            <button key={a.id} type="button" onClick={() => onAction(a.id)} style={quietStyle}>{a.label}</button>
          ))}
          <button type="button" onClick={onClose} style={{ ...quietStyle, border: 'none', color: colors.textTertiary }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/** The dialog the store holds, mounted once at the root. */
export function ErrorDialogHost() {
  const { sheet } = useErrorState();
  if (!sheet) return null;
  return (
    <ErrorDialog
      presentation={sheet.presentation}
      onClose={closeSheet}
      onAction={(id) => {
        closeSheet();
        sheet.onAction(id);
      }}
    />
  );
}
