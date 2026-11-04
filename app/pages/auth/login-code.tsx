'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OtpInput from '@/app/components/OtpInput';
import { sendLoginCode, verifyLoginCode } from '@/lib/APIs/auth/workspace/route';
import { useAuth } from '@/app/providers/AuthProvider';
import { workspaceDestination } from '@/lib/utils/workspace-entry';
import { buildTotpUrl } from '@/lib/utils/two-factor-url';

/**
 * "Email me a code instead": a collaborator signs in with a six-digit code sent to their email rather than a password.
 * The answer to "send" is the same whether or not the address can use this, so it never says who has an account. A
 * second factor, if the login has one, still follows (the code page for it is the ordinary sign-in code page).
 */

const NAVY = '#083A85';
const PINK = '#F20C8F';

export default function LoginCode(): React.JSX.Element {
  const router = useRouter();
  const { login: loginUser } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await sendLoginCode(email.trim().toLowerCase());
      if (!res.success) {
        setError(res.error || 'Please try again in a few minutes.');
        return;
      }
      setStep('code');
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    if (busy || value.length < 6) return;
    setBusy(true);
    setError('');
    try {
      const res = await verifyLoginCode(email.trim().toLowerCase(), value);
      const data = res.data;
      if (res.success && data?.twoFactorRequired && data?.customerId) {
        router.push(buildTotpUrl(data));
        return;
      }
      if (!res.success || !data?.token) {
        setError(res.error || 'That code did not work.');
        setShake((n) => n + 1);
        setCode('');
        return;
      }
      loginUser(
        {
          id: data.customerId ? String(data.customerId) : '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || email.trim(),
          phone: data.phone || '',
          customerId: data.customerId ? String(data.customerId) : '',
          customerType: data.customerType || 'Collaborator',
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-8 sm:px-9">
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: PINK, textTransform: 'uppercase', marginBottom: 6 }}>Sign in</p>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
          {step === 'email' ? 'Email me a code' : 'Enter your code'}
        </h1>

        {step === 'email' ? (
          <form onSubmit={send} noValidate>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
              We will send a six-digit code to your email. It expires in 5 minutes.
            </p>
            <label htmlFor="lc-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Email</label>
            <input
              id="lc-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: 15, boxSizing: 'border-box' }}
            />
            {error && <p role="alert" style={{ fontSize: 13, color: '#b91c1c', marginTop: 12 }}>{error}</p>}
            <button type="submit" disabled={busy || !email.trim()} style={buttonStyle(busy || !email.trim())}>
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
              If <strong>{email}</strong> can sign in with a code, we sent one. Check your inbox.
            </p>
            <OtpInput value={code} onChange={setCode} onComplete={verify} error={error} busy={busy} shakeKey={shake} accent={NAVY} id="lc-code" />
            <button type="button" onClick={() => send()} disabled={cooldown > 0 || busy} style={{ ...linkButton, opacity: cooldown > 0 ? 0.5 : 1 }}>
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
            </button>
          </div>
        )}

        <Link href="/user/auth/login" style={{ display: 'block', textAlign: 'center', marginTop: 18, fontSize: 14, color: NAVY, fontWeight: 600, textDecoration: 'none' }}>
          Use my password instead
        </Link>
      </div>
    </div>
  );
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return { width: '100%', marginTop: 18, padding: '13px 18px', borderRadius: 9999, border: 'none', background: disabled ? '#94a3b8' : NAVY, color: '#fff', fontWeight: 600, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer' };
}
const linkButton: React.CSSProperties = { display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: NAVY, fontWeight: 600, fontSize: 14, cursor: 'pointer' };
