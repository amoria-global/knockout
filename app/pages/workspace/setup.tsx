'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptWithToken, completeSetup, previewSetup, type SetupPreview } from '@/lib/APIs/auth/workspace/route';
import { getAuthToken } from '@/lib/api/client';
import { useAuth } from '@/app/providers/AuthProvider';
import { dashboardWorkspaceUrl, setupLinkPath, workspaceDestination } from '@/lib/utils/workspace-entry';

/**
 * First visit from the "Set up your access" email: "<Owner> invited you to their workspace", the email (fixed, not
 * editable), a password and its confirmation, then "Open workspace". No name, phone, role or profile fields: opening the
 * link proved the email, so nothing else is asked. A login that already exists signs in with its own password instead
 * and the workspace is added to it.
 */

const NAVY = '#083A85';
const PINK = '#F20C8F';
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@!#$%^&*=+]).{8,}$/;

type Stage = 'checking' | 'invalid' | 'form' | 'existing';

/** A rough 0-4 score for the hint under the password. The server decides what is accepted. */
function strength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[@!#$%^&*=+]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#94a3b8', '#dc2626', '#d97706', '#2563eb', '#059669'];
  return { score, label: pw ? labels[score] : '', color: colors[score] };
}

export default function WorkspaceSetup(): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const { login: loginUser } = useAuth();
  const invitationId = params.get('invite') || '';
  const token = params.get('t') || '';

  const [stage, setStage] = useState<Stage>('checking');
  const [preview, setPreview] = useState<SetupPreview | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!invitationId || !token) {
      setStage('invalid');
      return;
    }
    (async () => {
      try {
        const res = await previewSetup(invitationId, token);
        if (cancelled) return;
        const data = res.data;
        if (!res.success || !data?.found || !data.open) {
          setStage('invalid');
          return;
        }
        setPreview(data);
        setStage(data.account === 'existing' ? 'existing' : 'form');
      } catch {
        if (!cancelled) setStage('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invitationId, token]);

  const meter = useMemo(() => strength(password), [password]);
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = PASSWORD_RULE.test(password) && password === confirm && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const res = await completeSetup({ invitationId, token, password, confirmPassword: confirm });
      const data = res.data;
      if (!res.success || !data?.token) {
        if (data?.errorCode === 'EXISTING_ACCOUNT') {
          setStage('existing');
        } else if (data?.errorCode === 'LINK_INVALID') {
          setStage('invalid');
        } else {
          setError(res.error || data?.message || 'Something went wrong. Please try again.');
        }
        return;
      }
      loginUser(
        {
          id: data.customerId ? String(data.customerId) : '',
          firstName: '',
          lastName: '',
          email: data.email || preview?.email || '',
          phone: '',
          customerId: data.customerId ? String(data.customerId) : '',
          customerType: 'Collaborator',
        },
        data.token,
      );
      const dest = workspaceDestination(data.workspaces);
      if (dest.startsWith('http')) window.location.href = dest;
      else router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // An existing login: signed in already, it joins; otherwise it signs in first and comes back to this link.
  const joinWithExistingLogin = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await acceptWithToken(invitationId, token);
      if (res.success && res.data?.workspaceId) {
        window.location.href = dashboardWorkspaceUrl(res.data.workspaceId);
        return;
      }
      setError(res.error || 'This link does not match the account you are signed in with. Sign in with the invited email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const signInFirst = () => {
    const back = `${window.location.origin}${setupLinkPath(invitationId, token)}`;
    router.push(`/user/auth/login?returnUrl=${encodeURIComponent(back)}`);
  };

  const signedIn = typeof window !== 'undefined' && !!getAuthToken();

  const shellOuter = 'min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6';
  const card = 'w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-8 sm:px-9';

  if (stage === 'checking') {
    return (
      <div className={shellOuter}>
        <div className={card} role="status" aria-live="polite" style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: NAVY, margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 14, color: '#475569' }}>Checking your invitation…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (stage === 'invalid') {
    return (
      <div className={shellOuter}>
        <div className={card} style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="bi bi-exclamation-triangle" style={{ fontSize: 26, color: '#dc2626' }} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>This link is no longer valid</h1>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 22 }}>
            Invitation links work once and expire after 7 days. Ask the person who invited you to send a new one.
            If you already set a password, sign in instead.
          </p>
          <Link href="/user/auth/login" style={{ display: 'block', padding: '12px 18px', borderRadius: 9999, background: NAVY, color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (stage === 'existing') {
    return (
      <div className={shellOuter}>
        <div className={card}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: PINK, textTransform: 'uppercase', marginBottom: 6 }}>Workspace invitation</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
            {preview?.ownerName ? `${preview.ownerName} invited you to their workspace` : 'You were invited to a workspace'}
          </h1>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 18 }}>
            <strong>{preview?.email}</strong> already has a Connekyt account, so there is nothing to set up. Sign in with your
            existing password and the workspace is added next to your own.
          </p>
          {error && <p role="alert" style={{ fontSize: 13, color: '#b91c1c', marginBottom: 12 }}>{error}</p>}
          {signedIn ? (
            <button type="button" onClick={joinWithExistingLogin} disabled={busy} style={primaryButton(busy)}>
              {busy ? 'Adding…' : 'Add this workspace'}
            </button>
          ) : (
            <button type="button" onClick={signInFirst} style={primaryButton(false)}>Sign in to add this workspace</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={shellOuter}>
      <form className={card} onSubmit={submit} noValidate>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: PINK, textTransform: 'uppercase', marginBottom: 6 }}>Set up your access</p>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 18 }}>
          {preview?.ownerName ? `${preview.ownerName} invited you to their workspace` : 'You were invited to a workspace'}
        </h1>

        <label htmlFor="ws-email" style={labelStyle}>Email</label>
        <input id="ws-email" type="email" value={preview?.email || ''} readOnly aria-readonly="true" style={{ ...inputStyle, background: '#f1f5f9', color: '#475569' }} />

        <label htmlFor="ws-password" style={labelStyle}>Password</label>
        <div style={{ position: 'relative' }}>
          <input
            id="ws-password" type={show ? 'text' : 'password'} value={password} autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} aria-describedby="ws-hint"
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} style={eyeStyle}>
            <i className={show ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true" />
          </button>
        </div>
        <div id="ws-hint" style={{ margin: '6px 0 14px' }}>
          <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= meter.score ? meter.color : '#e2e8f0' }} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: password ? meter.color : '#64748b', marginTop: 6 }}>
            {password ? meter.label + '. ' : ''}At least 8 characters, with a letter, a number and one of @!#$%^&*=+
          </p>
        </div>

        <label htmlFor="ws-confirm" style={labelStyle}>Confirm password</label>
        <input id="ws-confirm" type={show ? 'text' : 'password'} value={confirm} autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} style={inputStyle} aria-invalid={mismatch} />
        {mismatch && <p role="alert" style={{ fontSize: 12, color: '#b91c1c', marginTop: 6 }}>The two passwords do not match.</p>}

        {error && <p role="alert" style={{ fontSize: 13, color: '#b91c1c', marginTop: 14 }}>{error}</p>}

        <button type="submit" disabled={!canSubmit} style={{ ...primaryButton(!canSubmit), marginTop: 20 }}>
          {busy ? 'Opening…' : 'Open workspace'}
        </button>
        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 14 }}>
          Next time, sign in on the normal login page with this email and your password.
        </p>
        {/* On a phone with the Connekyt app, the same setup can happen there. */}
        <a href={`connekt://workspace-setup?invite=${encodeURIComponent(invitationId)}&t=${encodeURIComponent(token)}`}
          style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>
          Open in the Connekyt app
        </a>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '14px 0 6px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 15, outline: 'none', boxSizing: 'border-box' };
const eyeStyle: React.CSSProperties = { position: 'absolute', right: 10, top: 10, width: 32, height: 32, border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' };
function primaryButton(disabled: boolean): React.CSSProperties {
  return { width: '100%', padding: '13px 18px', borderRadius: 9999, border: 'none', background: disabled ? '#94a3b8' : NAVY, color: '#fff', fontWeight: 600, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer' };
}
