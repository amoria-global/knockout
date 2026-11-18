'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { parseReferralCode } from '@/lib/referral/parseCode';
import { validateReferralCode, type ReferralProblem } from '@/lib/APIs/referral/route';

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'ok'; name: string }
  | { kind: 'bad'; problem: ReferralProblem | 'ERROR' | 'TOO_MANY' | 'FORMAT' };

const PROBLEM_KEY: Record<string, string> = {
  INVALID: 'invalid', FORMAT: 'invalid', QA_MISMATCH: 'invalid', NOT_A_PHOTOGRAPHER: 'invalid',
  NOT_ELIGIBLE: 'notEligible', LIMIT_REACHED: 'limit', SELF: 'self', MUTUAL: 'mutual',
  ALREADY_REFERRED: 'already', TOO_MANY: 'tooMany', ERROR: 'error',
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

/**
 * Optional "Referral code or link" field for photographer sign-up. Accepts a bare code or a full link,
 * validates on the server as the user types (debounced) and never blocks sign-up: an invalid code can
 * be removed, and a failed check just lets the user continue.
 */
export default function ReferralCodeField({ value, onChange, disabled, inputStyle, labelStyle }: Props): React.JSX.Element {
  const t = useTranslations('referral.field');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const seq = useRef(0);

  useEffect(() => {
    const raw = value.trim();
    if (!raw) { setState({ kind: 'idle' }); return; }
    const code = parseReferralCode(raw);
    if (!code) { setState({ kind: 'bad', problem: 'FORMAT' }); return; }
    setState({ kind: 'checking' });
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const res = await validateReferralCode(code);
        if (mine !== seq.current) return;
        if (res.success && res.data?.valid) {
          setState({ kind: 'ok', name: res.data.referrerName || '' });
        } else if (res.statusCode === 429) {
          setState({ kind: 'bad', problem: 'TOO_MANY' });
        } else if (res.success && res.data) {
          setState({ kind: 'bad', problem: res.data.problem || 'INVALID' });
        } else {
          setState({ kind: 'bad', problem: 'ERROR' });
        }
      } catch {
        if (mine === seq.current) setState({ kind: 'bad', problem: 'ERROR' });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [value]);

  const message =
    state.kind === 'checking' ? t('checking')
    : state.kind === 'ok' ? t('applied', { name: state.name })
    : state.kind === 'bad' ? t(PROBLEM_KEY[state.problem] || 'invalid')
    : null;
  const color = state.kind === 'ok' ? '#047857' : state.kind === 'bad' ? '#b91c1c' : '#475569';

  return (
    <div>
      <label htmlFor="referralCode" style={labelStyle}>{t('label')}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="auth-input"
          id="referralCode"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('placeholder')}
          aria-describedby="referralCodeStatus"
          style={{ ...inputStyle, paddingRight: value ? 84 : undefined }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 4px' }}
          >
            {t('remove')}
          </button>
        )}
      </div>
      <p id="referralCodeStatus" role="status" aria-live="polite" style={{ fontSize: 12, marginTop: 4, minHeight: 16, color }}>
        {message}
      </p>
      <Link href="/referral-program" target="_blank" style={{ fontSize: 12, color: '#083A85', textDecoration: 'underline' }}>
        {t('policy')}
      </Link>
    </div>
  );
}
