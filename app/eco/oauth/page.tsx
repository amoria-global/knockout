'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';

const PARAM_KEYS = ['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method'];

function authToken(): string { try { return localStorage.getItem('authToken') || ''; } catch { return ''; } }
async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/proxy/${path}`, {
    ...init, credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}`, ...(init?.headers || {}) },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const SCOPE: Record<string, { icon: string; label: string }> = {
  openid: { icon: 'bi-person-badge', label: 'Confirm your identity' },
  profile: { icon: 'bi-person', label: 'Your name' },
  email: { icon: 'bi-envelope', label: 'Your email address' },
  'wallet.read': { icon: 'bi-wallet2', label: 'View your wallet balance' },
  'wallet.write': { icon: 'bi-cash-coin', label: 'Move funds in your wallet' },
  'transactions.read': { icon: 'bi-list-ul', label: 'View your transactions' },
  'payments.create': { icon: 'bi-credit-card', label: 'Create payments on your behalf' },
  'payouts.create': { icon: 'bi-bank', label: 'Request payouts on your behalf' },
  'organizations.read': { icon: 'bi-building', label: 'View your organization data' },
  'organizations.write': { icon: 'bi-building-gear', label: 'Manage your organization data' },
};

const card: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 22, background: '#fff', boxShadow: '0 12px 50px rgba(8,58,133,.12)', overflow: 'hidden' };
const head: React.CSSProperties = { background: 'linear-gradient(120deg,#083A85,#F20C8F)', color: '#fff', padding: '18px 26px', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="eco">
        <div className="eco-narrow"><div style={card}>{children}</div></div>
      </main>
      <Footer />
    </>
  );
}
const Head = () => <div style={head}><i className="bi bi-hexagon-fill" /> Connekyt</div>;

function Consent() {
  const sp = useSearchParams();
  const [view, setView] = useState<'loading' | 'consent' | 'error' | 'info' | 'redirecting'>('loading');
  const [clientName, setClientName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const qs = () => { const q = new URLSearchParams(); PARAM_KEYS.forEach(k => { const v = sp.get(k); if (v) q.set(k, v); }); return q; };

  useEffect(() => {
    (async () => {
      if (!sp.get('client_id') || !sp.get('response_type')) { setView('info'); return; }
      const q = qs();
      const { status, body } = await api(`api/v1/oauth/authorize?${q.toString()}`);
      if (status === 401) { window.location.href = `/user/auth/login?redirect=${encodeURIComponent(`/eco/oauth?${q.toString()}`)}`; return; }
      if (status >= 400) { setErr(body?.error_description || body?.error || 'Authorization failed'); setView('error'); return; }
      if (body.action === 'redirect') { setView('redirecting'); window.location.href = body.location; return; }
      if (body.action === 'consent') { setClientName(body.client_name || 'An application'); setScopes(Array.isArray(body.scopes) ? body.scopes : []); setView('consent'); }
      else { setErr('Unexpected response'); setView('error'); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (approved: boolean) => {
    setBusy(true);
    const payload: Record<string, string | boolean> = { approved };
    PARAM_KEYS.forEach(k => { const v = sp.get(k); if (v) payload[k] = v; });
    const { status, body } = await api('api/v1/oauth/authorize/consent', { method: 'POST', body: JSON.stringify(payload) });
    if (status >= 400) { setErr(body?.error_description || 'Consent failed'); setView('error'); setBusy(false); return; }
    if (body.location) { setView('redirecting'); window.location.href = body.location; }
  };

  if (view === 'loading' || view === 'redirecting')
    return <Shell><Head /><div style={{ padding: '40px 26px', textAlign: 'center', color: '#64748b' }}>
      <i className="bi bi-arrow-repeat" style={{ marginRight: 6 }} />{view === 'redirecting' ? 'Redirecting…' : 'Loading…'}</div></Shell>;

  if (view === 'info')
    return <Shell><Head /><div style={{ padding: '26px' }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Continue with Connekyt</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>This is the Connekyt authorization screen. It opens automatically when an app you’re connecting sends you here to approve access.</p>
      <a className="eco-link" href="/eco/developers" style={{ display: 'inline-block', marginTop: 14 }}><i className="bi bi-grid-1x2" /> Build an app</a>
    </div></Shell>;

  if (view === 'error')
    return <Shell><Head /><div style={{ padding: '30px 26px', textAlign: 'center' }}>
      <i className="bi bi-exclamation-octagon-fill" style={{ fontSize: 30, color: '#ef4444' }} />
      <h1 style={{ fontSize: 18, fontWeight: 800, margin: '12px 0 4px' }}>Authorization error</h1>
      <p style={{ color: '#64748b', fontSize: 14 }}>{err}</p></div></Shell>;

  return (
    <Shell><Head />
      <div style={{ padding: '24px 26px' }}>
        <h1 style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.35, margin: 0 }}>
          <span style={{ color: '#083A85' }}>{clientName}</span> wants to access your Connekyt account
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: '6px 0 14px' }}>It will be able to:</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scopes.map(s => { const m = SCOPE[s] || { icon: 'bi-dot', label: s };
            return <li key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#334155' }}>
              <i className={`bi ${m.icon}`} style={{ color: '#083A85' }} /> {m.label}</li>;
          })}
        </ul>
        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
          <button className="eco-btn ghost" disabled={busy} onClick={() => decide(false)} style={{ flex: 1, color: '#475569', borderColor: '#d1d5db' }}>Deny</button>
          <button className="eco-btn grad" disabled={busy} onClick={() => decide(true)} style={{ flex: 1 }}>{busy ? 'Please wait…' : 'Allow'}</button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 14 }}>You can revoke access anytime from your Connekyt account.</p>
      </div>
    </Shell>
  );
}

export default function EcoOAuthPage() {
  return <Suspense fallback={<Shell><Head /><div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div></Shell>}><Consent /></Suspense>;
}
