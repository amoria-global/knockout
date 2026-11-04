'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCollaboratorWorkspaces, type CollaboratorWorkspaces } from '@/lib/APIs/auth/workspace/route';
import { dashboardWorkspaceUrl } from '@/lib/utils/workspace-entry';

/**
 * The workspace picker. Shown after sign-in when a login belongs to more than one workspace. A login with a business of
 * its own also gets "My business". Opening one hands its id to the dashboard, which checks the membership on every call.
 */

const NAVY = '#083A85';
const PINK = '#F20C8F';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: CollaboratorWorkspaces };

export default function WorkspaceChoose(): React.JSX.Element {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCollaboratorWorkspaces();
        if (cancelled) return;
        if (res.success && res.data) {
          const data = res.data;
          // Nothing to choose between: go straight in.
          if (!data.myBusiness && data.workspaces.length === 1) {
            window.location.href = dashboardWorkspaceUrl(data.workspaces[0].workspaceId);
            return;
          }
          setState({ kind: 'ready', data });
        } else {
          setState({ kind: 'error', message: res.error || 'Your session has ended. Please sign in again.' });
        }
      } catch {
        if (!cancelled) setState({ kind: 'error', message: 'We could not load your workspaces. Check your connection and try again.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const open = (workspaceId: string | null) => {
    const base = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com';
    window.location.href = workspaceId ? dashboardWorkspaceUrl(workspaceId) : `${base}/user/photographer/events?workspace=personal`;
  };

  const shell = 'min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6';
  const card = 'w-full max-w-md bg-white rounded-2xl shadow-xl px-6 py-8 sm:px-9';

  if (state.kind === 'loading') {
    return (
      <div className={shell}>
        <div className={card} role="status" aria-live="polite" style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: NAVY, margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 14, color: '#475569' }}>Loading your workspaces…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className={shell}>
        <div className={card} style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Could not open your workspaces</h1>
          <p role="alert" style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>{state.message}</p>
          <Link href="/user/auth/login" style={{ display: 'block', padding: '12px 18px', borderRadius: 9999, background: NAVY, color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const { workspaces, myBusiness } = state.data;
  return (
    <div className={shell}>
      <div className={card}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: PINK, textTransform: 'uppercase', marginBottom: 6 }}>Workspaces</p>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 18 }}>Where do you want to work?</h1>

        {workspaces.length === 0 && !myBusiness && (
          <p style={{ fontSize: 14, color: '#475569' }}>You do not belong to any workspace yet. Ask the owner to invite you again.</p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {myBusiness && (
            <li>
              <button type="button" onClick={() => open(null)} style={rowStyle}>
                <span style={{ ...badge, background: NAVY }}><i className="bi bi-briefcase" aria-hidden="true" /></span>
                <span style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 15, color: '#0f172a' }}>My business</strong>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Your own account</span>
                </span>
              </button>
            </li>
          )}
          {workspaces.map((w) => (
            <li key={w.workspaceId}>
              <button type="button" onClick={() => open(w.workspaceId)} style={rowStyle}>
                <span style={{ ...badge, background: PINK }}>{(w.owner.name || '?').trim().charAt(0).toUpperCase()}</span>
                <span style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 15, color: '#0f172a' }}>{w.owner.name}&apos;s workspace</strong>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Workspace collaborator</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14,
  border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer',
};
const badge: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0,
};
