'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import { CopyBtn } from '../_copy';

function authToken(): string { try { return localStorage.getItem('authToken') || ''; } catch { return ''; } }
async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/proxy/${path}`, {
    ...init, credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}`, ...(init?.headers || {}) },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
type App = { id: string; name: string; oauth_client_id?: string | null; status: string };

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
    const r = prompt('Redirect URI the app will use (exact match)', 'https://example.com/callback');
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
      <main className="eco">
        <div className="eco-wrap">
          <h1 className="eco-h1">Developer Console</h1>
          <p className="eco-sub">Manage your apps, OAuth credentials &amp; API keys. <a className="eco-link" href="/eco/docs">Read the docs →</a></p>

          {!authed ? (
            <div className="eco-empty" style={{ marginTop: 24 }}>
              <i className="bi bi-lock i" />
              <p style={{ margin: '12px 0' }}>Sign in to manage developer apps.</p>
              <a className="eco-btn grad" href="/user/auth/login?redirect=/eco/developers">Sign in</a>
            </div>
          ) : (
            <>
              <div className="eco-grid eco-stats">
                {[['bi-grid-1x2', 'Apps', String(apps.length)], ['bi-shield-lock', 'OAuth clients', String(withClient)], ['bi-key', 'OAuth2 + OIDC', 'RS256']].map(([i, l, v]) => (
                  <div key={l} className="eco-card eco-stat">
                    <i className={`bi ${i} i`} />
                    <div className="v">{v}</div><div className="l">{l}</div>
                  </div>
                ))}
              </div>

              <div className="eco-card eco-row" style={{ marginTop: 16 }}>
                <input className="eco-input" value={name} placeholder="New app name"
                  onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createApp()} />
                <button className="eco-btn" onClick={createApp}><i className="bi bi-plus-lg" /> Create app</button>
              </div>
              {msg && <p style={{ color: '#dc2626', fontSize: 14, marginTop: 8 }}><i className="bi bi-exclamation-circle" /> {msg}</p>}

              {secret && (
                <div className="eco-note" style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 14, color: '#92400e' }}><i className="bi bi-key-fill" /> Copy now, shown only once</strong>
                    <button onClick={() => setSecret(null)} style={{ background: 'none', border: 0, color: '#b45309', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {Object.entries(secret).map(([k, v]) => (
                      <div key={k} className="eco-secret">
                        <div style={{ minWidth: 0 }}><div className="k">{k}</div><div className="v">{String(v)}</div></div>
                        <CopyBtn text={String(v)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                {loading && <div className="eco-empty">Loading…</div>}
                {!loading && apps.length === 0 && (
                  <div className="eco-empty"><i className="bi bi-rocket-takeoff i" /><p style={{ marginTop: 12 }}>No apps yet, create your first one above.</p></div>
                )}
                {apps.map(a => (
                  <div key={a.id} className="eco-card">
                    <div className="eco-row" style={{ justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          <span className={`eco-badge ${a.status === 'ACTIVE' ? 'ok' : 'mut'}`}>{a.status}</span>
                          <span style={{ marginLeft: 8 }}>OAuth client: {a.oauth_client_id ? <b style={{ color: '#083A85' }}>configured</b> : 'not created'}</span>
                        </div>
                      </div>
                      <div className="eco-row">
                        <button className="eco-btn ghost sm" onClick={() => createClient(a.id)}><i className="bi bi-shield-lock" /> OAuth client</button>
                        <button className="eco-btn ghost pink sm" onClick={() => createKey(a.id)}><i className="bi bi-key" /> API key</button>
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
