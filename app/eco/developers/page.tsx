'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';

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

type App = { id: string; name: string; oauth_client_id?: string | null; status: string };

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50">
      <i className={`bi ${done ? 'bi-check2 text-green-600' : 'bi-clipboard'} mr-1`} />{done ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function EcoDevelopersPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [authed, setAuthed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [secret, setSecret] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { status, body } = await api('api/v1/eco/apps');
    setLoading(false);
    if (status === 401) { setAuthed(false); return; }
    setAuthed(true);
    setApps(Array.isArray(body?.data) ? body.data : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createApp = async () => {
    if (!name.trim()) return;
    const { status, body } = await api('api/v1/eco/apps', { method: 'POST', body: JSON.stringify({ name }) });
    if (status >= 400) return setMsg(body?.error_description || 'Failed to create app');
    setName(''); setMsg(''); load();
  };
  const createClient = async (id: string) => {
    const r = prompt('Redirect URI (exact match the app will use)', 'https://example.com/callback');
    if (!r) return;
    const { status, body } = await api(`api/v1/eco/apps/${id}/oauth-client`, {
      method: 'POST', body: JSON.stringify({ redirect_uris: [r], scopes: 'openid profile email wallet.read' }) });
    if (status >= 400) return setMsg(body?.error_description || 'Failed');
    setSecret(body); load();
  };
  const createKey = async (id: string) => {
    const { status, body } = await api('api/v1/eco/keys', { method: 'POST', body: JSON.stringify({ app_id: id, name: 'default' }) });
    if (status >= 400) return setMsg(body?.error_description || 'Failed');
    setSecret(body);
  };

  const withClient = apps.filter(a => a.oauth_client_id).length;

  return (
    <>
      <Navbar />
      <main className="min-h-[78vh] bg-gradient-to-b from-slate-50 to-white px-4 pt-24 pb-20 md:pt-28">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#083A85] md:text-3xl">Developer Console</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your apps, OAuth credentials &amp; API keys. <a href="/eco/docs" className="font-semibold text-[#F20C8F]">Read the docs →</a>
              </p>
            </div>
          </div>

          {!authed ? (
            <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <i className="bi bi-lock text-3xl text-[#083A85]" />
              <p className="mt-3 text-gray-600">Sign in to manage developer apps.</p>
              <a href="/user/auth/login?redirect=/eco/developers"
                 className="mt-4 inline-block rounded-xl bg-gradient-to-r from-[#083A85] to-[#F20C8F] px-6 py-2.5 text-sm font-bold text-white">
                Sign in
              </a>
            </div>
          ) : (
            <>
              {/* Stat tiles */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { i: 'bi-grid-1x2', l: 'Apps', v: apps.length },
                  { i: 'bi-shield-lock', l: 'OAuth clients', v: withClient },
                  { i: 'bi-key', l: 'OAuth2 + OIDC', v: 'RS256' },
                ].map(s => (
                  <div key={s.l} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <i className={`bi ${s.i} text-[#F20C8F]`} />
                    <div className="mt-2 text-xl font-extrabold text-[#083A85]">{s.v}</div>
                    <div className="text-xs text-gray-500">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Create app */}
              <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="New app name"
                  onKeyDown={e => e.key === 'Enter' && createApp()}
                  className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#083A85]" />
                <button onClick={createApp}
                  className="rounded-xl bg-[#083A85] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
                  <i className="bi bi-plus-lg mr-1" />Create app
                </button>
              </div>
              {msg && <p className="mt-2 text-sm text-red-600"><i className="bi bi-exclamation-circle mr-1" />{msg}</p>}

              {/* One-time secret panel */}
              {secret && (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-amber-900"><i className="bi bi-key-fill mr-1" />Copy now — shown only once</strong>
                    <button onClick={() => setSecret(null)} className="text-xs font-semibold text-amber-700">Dismiss</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {Object.entries(secret).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-[11px] uppercase tracking-wide text-gray-400">{k}</div>
                          <div className="truncate font-mono text-xs text-gray-800">{String(v)}</div>
                        </div>
                        <Copy text={String(v)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apps */}
              <div className="mt-6 space-y-3">
                {loading && <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-400">Loading…</div>}
                {!loading && apps.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                    <i className="bi bi-rocket-takeoff text-3xl text-[#083A85]" />
                    <p className="mt-3 text-sm text-gray-500">No apps yet — create your first one above.</p>
                  </div>
                )}
                {apps.map(a => (
                  <div key={a.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-gray-900">{a.name}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                          OAuth client: {a.oauth_client_id ? <span className="text-[#083A85]">configured</span> : 'not created'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => createClient(a.id)}
                          className="rounded-lg border border-[#083A85] px-3 py-1.5 text-xs font-semibold text-[#083A85] transition hover:bg-[#083A85] hover:text-white">
                          <i className="bi bi-shield-lock mr-1" />OAuth client
                        </button>
                        <button onClick={() => createKey(a.id)}
                          className="rounded-lg border border-[#F20C8F] px-3 py-1.5 text-xs font-semibold text-[#F20C8F] transition hover:bg-[#F20C8F] hover:text-white">
                          <i className="bi bi-key mr-1" />API key
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
