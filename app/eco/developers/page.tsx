'use client';

import { useEffect, useState, useCallback } from 'react';

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
    const { status, body } = await api('api/v1/eco/keys', {
      method: 'POST', body: JSON.stringify({ app_id: id, name: 'default' }),
    });
    if (status >= 400) { setMsg(body?.error_description || 'Failed'); return; }
    setSecretOnce(body);
  };

  const wrap: React.CSSProperties = { maxWidth: 720, margin: '4vh auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' };
  const card: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem', marginBottom: 12 };
  const btn: React.CSSProperties = { padding: '.45rem .8rem', borderRadius: 8, border: 'none', color: '#fff', background: '#083A85', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, marginRight: 8 };

  if (!authed) return <div style={wrap}><h1>Developers</h1><p>Please <a href="/user/auth/login?redirect=/eco/developers">sign in</a> to manage developer apps.</p></div>;

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#083A85' }}>Developer Apps</h1>
      <p style={{ color: '#6b7280', fontSize: '.9rem' }}>Register apps, get OAuth credentials and API keys. <a href="/eco/docs">Docs →</a></p>

      <div style={{ ...card, display: 'flex', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New app name"
          style={{ flex: 1, padding: '.5rem .7rem', border: '1px solid #d1d5db', borderRadius: 8 }} />
        <button style={btn} onClick={createApp}>Create app</button>
      </div>
      {msg && <p style={{ color: '#DC2626', fontSize: '.85rem' }}>{msg}</p>}

      {secretOnce && (
        <div style={{ ...card, background: '#FFFBEB', border: '1px solid #FCD34D' }}>
          <strong style={{ fontSize: '.85rem' }}>Copy these now — secrets are shown only once:</strong>
          <pre style={{ fontSize: '.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(secretOnce, null, 2)}
          </pre>
          <button style={{ ...btn, background: '#6b7280' }} onClick={() => setSecretOnce(null)}>Dismiss</button>
        </div>
      )}

      {apps.length === 0 && <p style={{ color: '#6b7280' }}>No apps yet.</p>}
      {apps.map(a => (
        <div key={a.id} style={card}>
          <div style={{ fontWeight: 700 }}>{a.name} <span style={{ fontSize: '.7rem', color: '#6b7280' }}>({a.status})</span></div>
          <div style={{ fontSize: '.75rem', color: '#6b7280', margin: '.25rem 0 .6rem' }}>
            client_id: {a.oauth_client_id ? 'configured' : 'not created'}
          </div>
          <button style={btn} onClick={() => createClient(a.id)}>Create OAuth client</button>
          <button style={btn} onClick={() => createKey(a.id)}>Create API key</button>
        </div>
      ))}
    </div>
  );
}
