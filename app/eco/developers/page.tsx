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

const SHELL: React.CSSProperties = { minHeight: '70vh', background: '#f8fafc', padding: '110px 1rem 4rem' };
const WRAP: React.CSSProperties = { maxWidth: 720, margin: '0 auto', fontFamily: 'inherit' };
const CARD: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem', marginBottom: 12, background: '#fff' };
const BTN: React.CSSProperties = { padding: '.5rem .85rem', borderRadius: 8, border: 'none', color: '#fff', background: '#083A85', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, marginRight: 8 };

export default function EcoDevelopersPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [authed, setAuthed] = useState(true);
  const [name, setName] = useState('');
  const [secretOnce, setSecretOnce] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { status, body } = await api('api/v1/eco/apps');
    if (status === 401) { setAuthed(false); return; }
    setAuthed(true);
    setApps(Array.isArray(body?.data) ? body.data : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createApp = async () => {
    if (!name.trim()) return;
    const { status, body } = await api('api/v1/eco/apps', { method: 'POST', body: JSON.stringify({ name }) });
    if (status >= 400) { setMsg(body?.error_description || 'Failed'); return; }
    setName(''); setMsg(''); load();
  };
  const createClient = async (id: string) => {
    const redirect = prompt('Redirect URI (exact match)', 'https://example.com/callback');
    if (!redirect) return;
    const { status, body } = await api(`api/v1/eco/apps/${id}/oauth-client`, {
      method: 'POST', body: JSON.stringify({ redirect_uris: [redirect], scopes: 'openid profile email wallet.read' }),
    });
    if (status >= 400) { setMsg(body?.error_description || 'Failed'); return; }
    setSecretOnce(body); load();
  };
  const createKey = async (id: string) => {
    const { status, body } = await api('api/v1/eco/keys', { method: 'POST', body: JSON.stringify({ app_id: id, name: 'default' }) });
    if (status >= 400) { setMsg(body?.error_description || 'Failed'); return; }
    setSecretOnce(body);
  };

  return (
    <>
      <Navbar />
      <main style={SHELL}>
        <div style={WRAP}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#083A85' }}>Developer Apps</h1>
          <p style={{ color: '#6b7280', fontSize: '.9rem' }}>
            Register apps, get OAuth credentials and API keys. <a href="/eco/docs" style={{ color: '#F20C8F', fontWeight: 600 }}>Docs →</a>
          </p>

          {!authed ? (
            <div style={CARD}>Please <a href="/user/auth/login?redirect=/eco/developers" style={{ color: '#F20C8F', fontWeight: 600 }}>sign in</a> to manage developer apps.</div>
          ) : (
            <>
              <div style={{ ...CARD, display: 'flex', gap: 8 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="New app name"
                  style={{ flex: 1, padding: '.5rem .7rem', border: '1px solid #d1d5db', borderRadius: 8 }} />
                <button style={BTN} onClick={createApp}>Create app</button>
              </div>
              {msg && <p style={{ color: '#DC2626', fontSize: '.85rem' }}>{msg}</p>}

              {secretOnce && (
                <div style={{ ...CARD, background: '#FFFBEB', border: '1px solid #FCD34D' }}>
                  <strong style={{ fontSize: '.85rem' }}>Copy now — secrets are shown only once:</strong>
                  <pre style={{ fontSize: '.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(secretOnce, null, 2)}
                  </pre>
                  <button style={{ ...BTN, background: '#6b7280' }} onClick={() => setSecretOnce(null)}>Dismiss</button>
                </div>
              )}

              {apps.length === 0 && <p style={{ color: '#6b7280' }}>No apps yet.</p>}
              {apps.map(a => (
                <div key={a.id} style={CARD}>
                  <div style={{ fontWeight: 700 }}>{a.name} <span style={{ fontSize: '.7rem', color: '#6b7280' }}>({a.status})</span></div>
                  <div style={{ fontSize: '.75rem', color: '#6b7280', margin: '.25rem 0 .6rem' }}>
                    OAuth client: {a.oauth_client_id ? 'configured' : 'not created'}
                  </div>
                  <button style={BTN} onClick={() => createClient(a.id)}>Create OAuth client</button>
                  <button style={BTN} onClick={() => createKey(a.id)}>Create API key</button>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
