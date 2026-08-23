'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { setNewPassword } from '@/lib/APIs/auth/set-new-password/route';
import { getDashboardUrlWithToken } from '@/lib/utils/dashboard-url';
import { getAuthToken, getRefreshToken } from '@/lib/api/client';

/**
 * Forced first-login password change.
 *
 * Reached only when knockout's /user/auth/login flow detects
 * `mustChangePassword=true` in the login response (set by the backend
 * for any Customer with isPasswordChanged=false. i.e. team members
 * who signed in with the temp password from their invitation email).
 *
 * Skips the dashboard hand-off entirely until the new password lands,
 * so the user never sees a flash of UI they can't fully use.
 *
 * POSTs to /api/remote/auth/set-new-password. same endpoint the
 * forgot-password / reset flow uses. The endpoint doesn't actually
 * read the `code` field server-side for this path, but the request
 * shape still includes it because the API helper requires it.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = (params?.get('email') || '').trim().toLowerCase();
  const customerType = params?.get('customerType') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the user lands here without an email param (refresh / direct
  // URL) they have no session context to change a password against,
  // so send them back to login.
  useEffect(() => {
    if (!email) router.replace('/user/auth/login');
  }, [email, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Same rule the server enforces (letter + digit + symbol), so the
    // screen cannot promise less than the backend requires.
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@!#$%^&*=+]).{8,}$/.test(password || '')) {
      setError('Use at least 8 characters, including a letter, a number and one of @!#$%^&*=+');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      // No reset code here: this is the forced first change, and the proof
      // is the session the user just signed in with. `authenticated` makes
      // the helper actually send it — the backend resolves the account from
      // that session and will not touch any other.
      const resp = await setNewPassword(
        { email, password, newPassword: password, confirmPassword: confirm },
        { authenticated: true },
      );
      // Backend convention: { action: 1, message } on success.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = resp.data;
      if (!resp.success || data?.action === 0) {
        throw new Error(data?.message || resp.error || 'Password change failed');
      }
      // Done. hand off to the dashboard. The HttpOnly session cookie
      // set by login is scoped to .connekyt.com so it travels.
      const token = getAuthToken() ?? undefined;
      const refresh = getRefreshToken() ?? undefined;
      const dest = getDashboardUrlWithToken(customerType, token, refresh);
      window.location.href = dest || '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#fafafa',
    }}>
      <section style={{
        maxWidth: 440, width: '100%', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 14, padding: '32px 28px',
        boxShadow: '0 12px 30px -12px rgba(0,0,0,0.10)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(242,12,143,0.10)', color: '#F20C8F',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 14,
        }} aria-hidden>
          <i className="bi bi-shield-lock" />
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>
          Set a new password
        </h1>
        <p style={{ margin: '8px 0 18px', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>
          You signed in with a temporary password from your invitation email.
          Choose your own password to continue.
        </p>

        <form onSubmit={onSubmit} autoComplete="off">
          <label style={lbl}>Email
            <input type="email" value={email} disabled style={{ ...inp, background: '#f3f4f6', color: '#6b7280' }} />
          </label>
          <label style={lbl}>New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              minLength={8}
              autoComplete="new-password"
              style={inp}
              placeholder="8+ chars, a letter, a number and a symbol"
            />
          </label>
          <label style={lbl}>Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={inp}
              placeholder="Type it again"
            />
          </label>

          {error && (
            <div style={{
              padding: 10, marginTop: 8, borderRadius: 6,
              background: '#fef2f2', color: '#991b1b', fontSize: 13, border: '1px solid #fecaca',
            }}>{error}</div>
          )}

          <button type="submit" disabled={busy} style={{
            marginTop: 16, width: '100%',
            padding: '11px 16px', fontSize: 14, fontWeight: 700, borderRadius: 8,
            background: '#F20C8F', color: '#fff', border: 'none',
            cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.65 : 1,
          }}>
            {busy ? 'Saving…' : 'Save and continue'}
          </button>

          <p style={{ marginTop: 14, fontSize: 12.5, color: '#9ca3af', textAlign: 'center' }}>
            Wrong account? <Link href="/user/auth/login" style={{ color: '#F20C8F' }}>Sign in as someone else</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151',
  marginTop: 12,
};
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8,
  border: '1px solid #e5e7eb', outline: 'none', marginTop: 4,
};
