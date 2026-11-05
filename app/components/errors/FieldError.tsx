'use client';

import React from 'react';
import { useTheme } from './colors';

/**
 * The message next to an input that has a problem. The field keeps what the person typed; this says what is wrong and
 * how to fix it. Icon plus text, never colour alone, and announced politely as it appears.
 *
 * Link it to the input: give the input `aria-invalid` and `aria-describedby={id}` (see `invalidFieldProps`).
 */
export function FieldError({ message, id }: { message?: string | null; id: string }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <div id={id} role="alert" aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 6, color: colors.statusError, fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 500 }}>
      <i className="bi bi-exclamation-circle" aria-hidden="true" style={{ marginTop: 2 }} />
      <span>{message}</span>
    </div>
  );
}

/** Props for the input a FieldError describes. */
export function invalidFieldProps(id: string, message?: string | null) {
  return message ? ({ 'aria-invalid': true, 'aria-describedby': id } as const) : ({ 'aria-invalid': false } as const);
}

/** The red outline for an input with a problem. Spread after the input's normal style. */
export function invalidFieldStyle(errorColor: string): React.CSSProperties {
  return { borderColor: errorColor, boxShadow: `0 0 0 1px ${errorColor}` };
}
