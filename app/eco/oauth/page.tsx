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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[78vh] items-start justify-center bg-gradient-to-b from-slate-50 to-white px-4 pt-28 pb-20">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-[0_10px_50px_rgba(8,58,133,0.10)]">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
const Brand = () => (
  <div className="rounded-t-3xl bg-gradient-to-r from-[#083A85] to-[#F20C8F] px-7 py-5 text-white">
    <div className="flex items-center gap-2 text-lg font-extrabold">
      <i className="bi bi-hexagon-fill" /> Connekyt
    </div>
  </div>
);

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
    const { status, body } = await api('api/v1/oauth/authorize/consent', { method: 'POST', body: JSON.stringify(payload) });
    if (status >= 400) { setErr(body?.error_description || 'Consent failed'); setView('error'); setBusy(false); return; }
    if (body.location) { setView('redirecting'); window.location.href = body.location; }
  };

  if (view === 'loading' || view === 'redirecting')
    return <Shell><Brand /><div className="px-7 py-10 text-center text-gray-500">
      <i className="bi bi-arrow-repeat mr-2 animate-spin" />{view === 'redirecting' ? 'Redirecting…' : 'Loading…'}
    </div></Shell>;

  if (view === 'info')
    return <Shell><Brand /><div className="px-7 py-8">
      <h1 className="text-lg font-bold text-gray-900">Continue with Connekyt</h1>
      <p className="mt-2 text-sm text-gray-600">This is the Connekyt authorization screen. It opens automatically when an app you’re connecting sends you here to approve access.</p>
      <a href="/eco/developers" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#F20C8F]">
        <i className="bi bi-grid-1x2" /> Build an app
      </a>
    </div></Shell>;

  if (view === 'error')
    return <Shell><Brand /><div className="px-7 py-8 text-center">
      <i className="bi bi-exclamation-octagon-fill text-3xl text-red-500" />
      <h1 className="mt-3 text-lg font-bold text-gray-900">Authorization error</h1>
      <p className="mt-1 text-sm text-gray-600">{err}</p>
    </div></Shell>;

  return (
    <Shell>
      <Brand />
      <div className="px-7 py-7">
        <h1 className="text-[17px] font-bold leading-snug text-gray-900">
          <span className="text-[#083A85]">{clientName}</span> wants to access your Connekyt account
        </h1>
        <p className="mt-1 text-sm text-gray-500">It will be able to:</p>
        <ul className="mt-4 space-y-2">
          {scopes.map(s => {
            const m = SCOPE[s] || { icon: 'bi-dot', label: s };
            return (
              <li key={s} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-gray-700">
                <i className={`bi ${m.icon} text-[#083A85]`} /> {m.label}
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex gap-3">
          <button disabled={busy} onClick={() => decide(false)}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
            Deny
          </button>
          <button disabled={busy} onClick={() => decide(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#083A85] to-[#F20C8F] py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
            {busy ? 'Please wait…' : 'Allow'}
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-gray-400">
          You can revoke access anytime from your Connekyt account.
        </p>
      </div>
    </Shell>
  );
}

export default function EcoOAuthPage() {
  return (
    <Suspense fallback={<Shell><Brand /><div className="px-7 py-10 text-center text-gray-500">Loading…</div></Shell>}>
      <Consent />
    </Suspense>
  );
}
