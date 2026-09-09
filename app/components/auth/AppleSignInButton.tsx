'use client';

import React, { useState } from 'react';
import {
  appleConfigured,
  isAppleSignInCancelled,
  requestAppleCredential,
  type AppleWebCredential,
} from '@/lib/auth/apple-js';

type Props = {
  label: string;
  busyLabel?: string;
  disabled?: boolean;
  /** Receives the Apple credential; the caller decides what to POST and where to go next. */
  onCredential: (credential: AppleWebCredential) => Promise<void> | void;
  onError: (message: string) => void;
};

/**
 * "Login / Sign up with Apple" for the web.
 *
 * Renders NOTHING until NEXT_PUBLIC_APPLE_CLIENT_ID (the Apple Services ID) is
 * set, which is the contract `lib/auth/apple-js.ts` already documents. It used
 * to render always and explain the missing Services ID on click, which is fine
 * on a developer's machine and wrong in front of a buyer: an environment that
 * has not been given the ID would show a working-looking "Login with Apple"
 * button whose only behaviour is an error naming one of our env vars.
 *
 * An auth option the site cannot honour should not be offered at all.
 *
 * Styled to sit beside the Google buttons (same height, radius and flex) while
 * following Apple's button guidelines: Apple logo, black button, white text.
 */
export default function AppleSignInButton({
  label,
  busyLabel = 'Signing in...',
  disabled = false,
  onCredential,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const inactive = disabled || loading;

  const run = async () => {
    setLoading(true);
    try {
      const credential = await requestAppleCredential();
      await onCredential(credential);
    } catch (err) {
      if (!isAppleSignInCancelled(err)) {
        onError(err instanceof Error ? err.message : 'Apple sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Hooks above run unconditionally; only the output is withheld.
  if (!appleConfigured) return null;

  return (
    <button
      type="button"
      onClick={run}
      disabled={inactive}
      aria-label={label}
      style={{
        flex: '1',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        borderRadius: '10px',
        border: '1.5px solid #000000',
        backgroundColor: '#000000',
        color: '#ffffff',
        cursor: inactive ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s',
        opacity: inactive ? 0.7 : 1,
      }}
      onMouseEnter={(e) => { if (!inactive) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {loading ? (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="#4b5563" strokeWidth="3" fill="none" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{busyLabel}</span>
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
            />
          </svg>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{label}</span>
        </>
      )}
    </button>
  );
}
