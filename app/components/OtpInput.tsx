'use client';

import React, { useEffect, useRef } from 'react';
import { cleanOtp, OTP_LENGTH } from '@/lib/otp';

/**
 * One real input drawn as six boxes.
 *
 * It is a single field underneath so the browser and password managers treat it as one code
 * (`autocomplete="one-time-code"`, `inputmode="numeric"`), paste works as one action, and a screen
 * reader finds one control. The boxes are a picture of its value.
 *
 *   - digits only; spaces and dashes in a pasted code are dropped
 *   - `onComplete` fires once per code, when the sixth digit lands
 *   - `busy` locks the field while the server checks, so a second submit cannot start
 *   - `shakeKey` runs the wrong-code shake; the field is then handed back focused
 *   - the code is never validated here; the server decides
 */
type Props = {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  label?: string;
  error?: string;
  /** Neutral line under the boxes, such as "2 attempts left". */
  hint?: string;
  disabled?: boolean;
  busy?: boolean;
  success?: boolean;
  /** Change this number to run the wrong-code shake. */
  shakeKey?: number;
  autoFocus?: boolean;
  id?: string;
  /** Focus ring and filled-box colour. */
  accent?: string;
  colors?: { border: string; bg: string; text: string; muted: string };
};

const DEFAULT_COLORS = { border: '#CBD5E1', bg: '#FFFFFF', text: '#0F172A', muted: '#64748B' };

export default function OtpInput({
  value,
  onChange,
  onComplete,
  label,
  error,
  hint,
  disabled = false,
  busy = false,
  success = false,
  shakeKey = 0,
  autoFocus = true,
  id = 'otp-input',
  accent = '#083A85',
  colors = DEFAULT_COLORS,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const lastCompleted = useRef('');
  const shakeEl = useRef<HTMLDivElement>(null);
  const locked = disabled || busy || success;

  // A cleared field is a fresh attempt: allow the next full code to submit.
  useEffect(() => {
    if (value.length < OTP_LENGTH) lastCompleted.current = '';
  }, [value]);

  // Wrong code: shake, then hand the field back focused.
  useEffect(() => {
    if (!shakeKey) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      shakeEl.current?.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }],
        { duration: 280, easing: 'ease-out' },
      );
    }
    input.current?.focus();
  }, [shakeKey]);

  const apply = (raw: string) => {
    if (locked) return;
    const next = cleanOtp(raw);
    onChange(next);
    if (next.length === OTP_LENGTH && lastCompleted.current !== next) {
      lastCompleted.current = next;
      onComplete?.(next);
    }
  };

  const active = value.length < OTP_LENGTH ? value.length : OTP_LENGTH - 1;
  const ringColor = error ? '#DC2626' : success ? '#16A34A' : accent;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {label ? (
        <label htmlFor={id} style={{ fontSize: '0.88rem', fontWeight: 600, color: colors.text }}>
          {label}
        </label>
      ) : null}

      <div ref={shakeEl} style={{ position: 'relative', opacity: busy ? 0.6 : 1 }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} aria-hidden="true">
          {Array.from({ length: OTP_LENGTH }).map((_, i) => {
            const char = value[i] ?? '';
            const focused = !locked && i === active;
            return (
              <div
                key={i}
                style={{
                  flex: '1 1 0',
                  maxWidth: 48,
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: colors.text,
                  background: colors.bg,
                  border: `${focused ? 2 : 1}px solid ${error || success || focused || char ? ringColor : colors.border}`,
                  transition: 'border-color 0.15s',
                }}
              >
                {char}
              </div>
            );
          })}
        </div>

        {/* The real control: transparent and stretched over the boxes, so a click anywhere lands on it. */}
        <input
          ref={input}
          id={id}
          value={value}
          onChange={(e) => apply(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            apply(e.clipboardData.getData('text'));
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          pattern="[0-9]*"
          maxLength={OTP_LENGTH + 4}
          autoFocus={autoFocus}
          disabled={locked}
          aria-label={label ?? 'Verification code'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: locked ? 'default' : 'text',
            fontSize: 16,
          }}
        />
      </div>

      {error ? (
        <div id={`${id}-error`} role="alert" aria-live="assertive" style={{ fontSize: '0.82rem', color: '#DC2626', textAlign: 'center' }}>
          {error}
        </div>
      ) : null}
      {hint ? (
        <div id={`${id}-hint`} aria-live="polite" style={{ fontSize: '0.82rem', color: colors.muted, textAlign: 'center' }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
