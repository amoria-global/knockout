'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const PARAM_KEYS = [
  'response_type', 'client_id', 'redirect_uri', 'scope', 'state',
  'nonce', 'code_challenge', 'code_challenge_method',
];

function authToken(): string {
  try { return localStorage.getItem('authToken') || ''; } catch { return ''; }
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/proxy/${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken()}`,
      ...(init?.headers || {}),
    },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const SCOPE_LABEL: Record<string, string> = {
  openid: 'Confirm your identity',
  profile: 'Your name',
  email: 'Your email address',
  'wallet.read': 'View your wallet balance',
  'wallet.write': 'Move funds in your wallet',
  'transactions.read': 'View your transactions',
  'payments.create': 'Create payments on your behalf',
  'payouts.create': 'Request payouts on your behalf',
  'organizations.read': 'View your organization data',
  'organizations.write': 'Manage your organization data',
};

function Consent() {
  const sp = useSearchParams();
  const [state, setState] = useState<'loading' | 'consent' | 'error' | 'redirecting'>('loading');
  const [clientName, setClientName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const params = () => {
    const q = new URLSearchParams();
    PARAM_KEYS.forEach(k => { const v = sp.get(k); if (v) q.set(k, v); });
    return q;
  };

  useEffect(() => {
    (async () => {
      const q = params();
      const { status, body } = await api(`api/v1/oauth/authorize?${q.toString()}`);
      if (status === 401) {
        const here = `/eco/oauth?${q.toString()}`;
        window.location.href = `/user/auth/login?redirect=${encodeURIComponent(here)}`;
        return;
      }
      if (status >= 400) { setErr(body?.error_description || body?.error || 'Authorization failed'); setState('error'); return; }
      if (body.action === 'redirect') { setState('redirecting'); window.location.href = body.location; return; }
      if (body.action === 'consent') {
        setClientName(body.client_name || 'An application');
        setScopes(Array.isArray(body.scopes) ? body.scopes : []);
        setState('consent');
      } else { setErr('Unexpected response'); setState('error'); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (approved: boolean) => {
    setBusy(true);
    const spv = sp;
    const payload: Record<string, string | boolean> = { approved };
    PARAM_KEYS.forEach(k => { const v = spv.get(k); if (v) payload[k] = v; });
    const { status, body } = await api('api/v1/oauth/authorize/consent', {
      method: 'POST', body: JSON.stringify(payload),
    });
    if (status >= 400) { setErr(body?.error_description || 'Consent failed'); setState('error'); setBusy(false); return; }
    if (body.location) { setState('redirecting'); window.location.href = body.location; }
  };

  const box: React.CSSProperties = {
    maxWidth: 440, margin: '8vh auto', padding: '2rem',
    border: '1px solid #e5e7eb', borderRadius: 16, fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
  };

  if (state === 'loading' || state === 'redirecting')
    return <div style={box}>{state === 'redirecting' ? 'Redirecting…' : 'Loading…'}</div>;

  if (state === 'error')
    return <div style={box}>
      <h2 style={{ color: '#DC2626', fontSize: '1.1rem' }}>Authorization error</h2>
      <p style={{ color: '#6b7280', fontSize: '.9rem' }}>{err}</p>
    </div>;

  return (
    <div style={box}>
      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#083A85' }}>Connekyt</div>
      <h2 style={{ fontSize: '1.05rem', margin: '1rem 0 .25rem' }}>
        <strong>{clientName}</strong> wants to access your Connekyt account
      </h2>
      <p style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: '1rem' }}>
        It will be able to:
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
        {scopes.map(s => (
          <li key={s} style={{ padding: '.5rem .75rem', background: '#f9fafb',
            borderRadius: 8, marginBottom: 6, fontSize: '.88rem' }}>
            ✓ {SCOPE_LABEL[s] || s}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 12 }}>
        <button disabled={busy} onClick={() => decide(false)} style={{
          flex: 1, padding: '.7rem', borderRadius: 10, border: '1px solid #d1d5db',
          background: '#fff', cursor: 'pointer', fontWeight: 600,
        }}>Deny</button>
        <button disabled={busy} onClick={() => decide(true)} style={{
          flex: 1, padding: '.7rem', borderRadius: 10, border: 'none', color: '#fff',
          background: 'linear-gradient(135deg,#083A85,#F20C8F)', cursor: 'pointer', fontWeight: 700,
        }}>{busy ? 'Please wait…' : 'Allow'}</button>
      </div>
    </div>
  );
}

export default function EcoOAuthPage() {
  return <Suspense fallback={<div style={{ padding: '8vh', textAlign: 'center' }}>Loading…</div>}>
    <Consent />
  </Suspense>;
}
