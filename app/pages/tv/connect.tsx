'use client';

/**
 * "Connect a TV" — claim the code a Smart TV is showing.
 *
 * The TV displays a six-character code and polls the backend waiting for
 * someone to claim it. The mobile app does this by scanning the TV's QR with
 * the camera; a browser cannot point a camera at the screen it is on, so here
 * the code is typed.
 *
 * Nothing about this browser's session travels to the television. Claiming the
 * code tells the server "that TV is mine", and the server mints the TV its OWN
 * session. That is why signing out here does not sign out the TV, and why
 * disconnecting the TV does not sign out this browser.
 *
 * Typing a code is only safe because of CONN-TV-1: the code alone no longer
 * unlocks anything. The TV also holds a device secret it never displays, and
 * the backend hands tokens only to a caller presenting it. Before that fix, a
 * manual-entry form like this one would have been an invitation to anybody who
 * had photographed a TV screen.
 *
 * The design problem this screen solves: someone is reading six characters off
 * a television several feet away and retyping them here. Hence the large
 * monospaced boxes, the automatic focus advance, whole-code paste, and the
 * silent correction of O/0 and I/1 confusion.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  confirmTvPairing,
  normalizePairingCode,
  PAIRING_CODE_LENGTH,
} from '@/lib/APIs/tv/pairing/route';

const NAVY = '#083A85';
const PINK = '#F20C8F';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ConnectTvPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Pairing binds a TV to an ACCOUNT, so there has to be one. Send them to
  // login with a redirect back here rather than showing a form that cannot work.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/user/auth/login?redirect=${encodeURIComponent('/user/connect-tv')}`);
    }
  }, [isLoading, isAuthenticated, router]);

  const chars = useMemo(
    () => code.padEnd(PAIRING_CODE_LENGTH, ' ').slice(0, PAIRING_CODE_LENGTH).split(''),
    [code],
  );
  const complete = code.length === PAIRING_CODE_LENGTH;

  const setAt = useCallback(
    (index: number, raw: string) => {
      const typed = normalizePairingCode(raw);
      if (!typed) return;

      // A multi-character value is a paste or an autofill: spread it from this
      // box onward instead of keeping only the first character.
      if (typed.length > 1) {
        const next = normalizePairingCode(code.slice(0, index) + typed);
        setCode(next);
        inputs.current[Math.min(next.length, PAIRING_CODE_LENGTH - 1)]?.focus();
        return;
      }

      const arr = code.padEnd(PAIRING_CODE_LENGTH, ' ').split('');
      arr[index] = typed;
      setCode(arr.join('').replace(/\s+$/, '').slice(0, PAIRING_CODE_LENGTH));
      if (index < PAIRING_CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
      if (status === 'error') setStatus('idle');
    },
    [code, status],
  );

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = code.padEnd(PAIRING_CODE_LENGTH, ' ').split('');
      if (!arr[index]?.trim() && index > 0) {
        arr[index - 1] = ' ';
        setCode(arr.join('').replace(/\s+$/, ''));
        inputs.current[index - 1]?.focus();
        return;
      }
      arr[index] = ' ';
      setCode(arr.join('').replace(/\s+$/, ''));
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < PAIRING_CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || status === 'submitting') return;

    setStatus('submitting');
    setMessage('');

    const res = await confirmTvPairing(code, label);

    if (res.success) {
      setStatus('success');
      return;
    }

    setStatus('error');
    // The backend distinguishes these and the difference is actionable: a
    // wrong code means check what you typed, an expired one means the TV has
    // already moved on and is showing a different code. A single "failed"
    // would leave the user re-entering the same stale code.
    const raw = (res.error || '').toLowerCase();
    if (raw.includes('expired') || raw.includes('already been used')) {
      setMessage('That code is no longer valid. Your TV shows a new one every few minutes, so use the one on screen now.');
    } else if (raw.includes('invalid') || raw.includes('not found')) {
      setMessage('We could not find that code. Check the characters on your TV and try again.');
    } else {
      setMessage(res.error || 'Could not connect to that TV. Please try again.');
    }
  };

  const reset = () => {
    setCode('');
    setLabel('');
    setStatus('idle');
    setMessage('');
    inputs.current[0]?.focus();
  };

  // Auth is still resolving, or we are on our way to login. Render the shell so
  // the page does not flash a form the user is about to be redirected away from.
  if (isLoading || !isAuthenticated) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 15 }}>
          Loading…
        </div>
      </Shell>
    );
  }

  if (status === 'success') {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div aria-hidden style={successMark}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
            Your TV is connected
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: '0 0 8px' }}>
            {label.trim() ? `"${label.trim()}"` : 'Your TV'} is signed in to your account. It has its
            own session, so signing out here will not sign out the TV.
          </p>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 26px' }}>
            You can disconnect it any time from your account settings.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => router.push('/user/photographers')} style={primaryBtn}>
              Done
            </button>
            <button type="button" onClick={reset} style={ghostBtn}>
              Connect another
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header style={{ marginBottom: 28 }}>
        <span style={pill}>Smart TV</span>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '14px 0 8px', letterSpacing: '-0.02em' }}>
          Connect a TV
        </h1>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          Open Connekyt on your TV and choose <strong style={{ color: '#334155' }}>Sign in</strong>.
          Enter the six characters shown there.
        </p>
      </header>

      <form onSubmit={submit}>
        <label htmlFor="tv-code-0" style={labelStyle}>Code from your TV</label>
        <div
          style={{ display: 'flex', gap: 10, marginBottom: 10 }}
          onPaste={(e) => {
            e.preventDefault();
            const next = normalizePairingCode(e.clipboardData.getData('text'));
            setCode(next);
            inputs.current[Math.min(next.length, PAIRING_CODE_LENGTH - 1)]?.focus();
          }}
        >
          {Array.from({ length: PAIRING_CODE_LENGTH }).map((_, i) => {
            const ch = chars[i]?.trim() ?? '';
            return (
              <input
                key={i}
                id={`tv-code-${i}`}
                ref={(el) => { inputs.current[i] = el; }}
                value={ch}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={PAIRING_CODE_LENGTH}
                aria-label={`Character ${i + 1} of ${PAIRING_CODE_LENGTH}`}
                aria-invalid={status === 'error'}
                disabled={status === 'submitting'}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 62,
                  textAlign: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  color: '#0f172a',
                  border: `2px solid ${status === 'error' ? '#ef4444' : ch ? NAVY : '#e2e8f0'}`,
                  borderRadius: 14,
                  background: status === 'submitting' ? '#f8fafc' : '#fff',
                  outline: 'none',
                  transition: 'border-color .15s, box-shadow .15s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 4px ${NAVY}1a`; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              />
            );
          })}
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 22px', lineHeight: 1.5 }}>
          Letters and numbers only. Codes never contain O or I, so if a character
          looks like one it is a zero or a one.
        </p>

        <label htmlFor="tv-label" style={labelStyle}>
          Name this TV <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          id="tv-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Living room TV"
          maxLength={40}
          disabled={status === 'submitting'}
          style={{
            width: '100%',
            height: 50,
            padding: '0 16px',
            fontSize: 15,
            color: '#0f172a',
            border: '2px solid #e2e8f0',
            borderRadius: 12,
            background: '#fff',
            outline: 'none',
            marginBottom: 6,
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = NAVY; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
        />
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px' }}>
          Helps you tell it apart later if you connect more than one.
        </p>

        {status === 'error' && (
          <div role="alert" style={alertStyle}>{message}</div>
        )}

        <button
          type="submit"
          disabled={!complete || status === 'submitting'}
          style={{
            ...primaryBtn,
            width: '100%',
            height: 52,
            fontSize: 16,
            opacity: complete && status !== 'submitting' ? 1 : 0.45,
            cursor: complete && status !== 'submitting' ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'submitting' ? 'Connecting…' : 'Connect TV'}
        </button>
      </form>

      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '22px 0 0', textAlign: 'center' }}>
        Your TV gets its own sign-in. Disconnecting it later will not sign you
        out here, and signing out here will not sign out the TV.
      </p>
    </Shell>
  );
}

/* ---- presentation ---- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#fff',
          borderRadius: 22,
          padding: 'clamp(24px, 5vw, 38px)',
          boxShadow: '0 1px 3px rgba(15,23,42,.06), 0 12px 34px rgba(15,23,42,.08)',
          border: '1px solid #e2e8f0',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const pill: React.CSSProperties = {
  display: 'inline-block',
  padding: '5px 12px',
  borderRadius: 999,
  background: `${PINK}14`,
  color: PINK,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: '#334155',
  marginBottom: 10,
};

const primaryBtn: React.CSSProperties = {
  padding: '13px 22px',
  borderRadius: 999,
  border: 'none',
  background: `linear-gradient(90deg, ${NAVY} 0%, #0a4da3 100%)`,
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  padding: '13px 22px',
  borderRadius: 999,
  border: '2px solid #e2e8f0',
  background: '#fff',
  color: '#334155',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

const alertStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  marginBottom: 18,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  fontSize: 14,
  lineHeight: 1.5,
};

const successMark: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  margin: '0 auto 20px',
  background: 'rgba(16,185,129,0.12)',
  color: '#059669',
  display: 'grid',
  placeItems: 'center',
  fontSize: 30,
};
