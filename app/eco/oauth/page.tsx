'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';

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

const SHELL: React.CSSProperties = { minHeight: '70vh', background: '#f8fafc', padding: '110px 1rem 4rem' };
const CARD: React.CSSProperties = {
  maxWidth: 460, margin: '0 auto', padding: '2rem',
  border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff',
  boxShadow: '0 10px 40px rgba(8,58,133,0.08)', fontFamily: 'inherit',
};

function Consent() {
  const sp = useSearchParams();
  const [view, setView] = useState<'loading' | 'consent' | 'error' | 'info' | 'redirecting'>('loading');
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
      // No OAuth request present → this page was opened directly. Show a
      // friendly explanation, not a scary error.
      if (!sp.get('client_id') || !sp.get('response_type')) { setView('info'); return; }
      const q = params();
      const { status, body } = await api(`api/v1/oauth/authorize?${q.toString()}`);
      if (status === 401) {
        const here = `/eco/oauth?${q.toString()}`;
        window.location.href = `/user/auth/login?redirect=${encodeURIComponent(here)}`;
        return;
      }
      if (status >= 400) { setErr(body?.error_description || body?.error || 'Authorization failed'); setView('error'); return; }
      if (body.action === 'redirect') { setView('redirecting'); window.location.href = body.location; return; }
      if (body.action === 'consent') {
        setClientName(body.client_name || 'An application');
        setScopes(Array.isArray(body.scopes) ? body.scopes : []);
        setView('consent');
      } else { setErr('Unexpected response'); setView('error'); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (approved: boolean) => {
    setBusy(true);
    const payload: Record<string, string | boolean> = { approved };
    PARAM_KEYS.forEach(k => { const v = sp.get(k); if (v) payload[k] = v; });
    const { status, body } = await api('api/v1/oauth/authorize/consent', {
      method: 'POST', body: JSON.stringify(payload),
    });
    if (status >= 400) { setErr(body?.error_description || 'Consent failed'); setView('error'); setBusy(false); return; }
    if (body.location) { setView('redirecting'); window.location.href = body.location; }
  };

  let inner: React.ReactNode;
  if (view === 'loading' || view === 'redirecting') {
    inner = <div style={CARD}>{view === 'redirecting' ? 'Redirecting…' : 'Loading…'}</div>;
  } else if (view === 'info') {
    inner = <div style={CARD}>
      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#083A85' }}>Continue with Connekyt</div>
      <p style={{ color: '#6b7280', fontSize: '.9rem', marginTop: '.75rem' }}>
        This is the Connekyt authorization screen. It opens automatically when an
        app you’re connecting sends you here to approve access to your account.
      </p>
      <a href="/eco/developers" style={{ color: '#F20C8F', fontWeight: 600, fontSize: '.9rem' }}>
        Build an app → developer console
      </a>
    </div>;
  } else if (view === 'error') {
    inner = <div style={CARD}>
      <h2 style={{ color: '#DC2626', fontSize: '1.05rem', marginTop: 0 }}>Authorization error</h2>
      <p style={{ color: '#6b7280', fontSize: '.9rem' }}>{err}</p>
    </div>;
  } else {
    inner = <div style={CARD}>
      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#083A85' }}>Connekyt</div>
      <h2 style={{ fontSize: '1.05rem', margin: '1rem 0 .25rem' }}>
        <strong>{clientName}</strong> wants to access your Connekyt account
      </h2>
      <p style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: '1rem' }}>It will be able to:</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
        {scopes.map(s => (
          <li key={s} style={{ padding: '.5rem .75rem', background: '#f9fafb',
            borderRadius: 8, marginBottom: 6, fontSize: '.88rem' }}>✓ {SCOPE_LABEL[s] || s}</li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 12 }}>
        <button disabled={busy} onClick={() => decide(false)} style={{
          flex: 1, padding: '.7rem', borderRadius: 10, border: '1px solid #d1d5db',
          background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Deny</button>
        <button disabled={busy} onClick={() => decide(true)} style={{
          flex: 1, padding: '.7rem', borderRadius: 10, border: 'none', color: '#fff',
          background: 'linear-gradient(135deg,#083A85,#F20C8F)', cursor: 'pointer', fontWeight: 700 }}>
          {busy ? 'Please wait…' : 'Allow'}</button>
      </div>
    </div>;
  }

  return (
    <>
      <Navbar />
      <main style={SHELL}>{inner}</main>
      <Footer />
    </>
  );
}

export default function EcoOAuthPage() {
  return (
    <Suspense fallback={
      <><Navbar /><main style={SHELL}><div style={CARD}>Loading…</div></main><Footer /></>
    }>
      <Consent />
    </Suspense>
  );
}
