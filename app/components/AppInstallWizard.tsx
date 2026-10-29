'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { detectMobilePlatform, type MobilePlatform } from '@/lib/qr/eventQr';
import {
  DISMISS_KEY,
  PENDING_INSTALL_KEY,
  SESSION_DISMISS_KEY,
  appDeepLinkFor,
  destinationFor,
  dismissUntil,
  isPendingInstall,
  isQrVisit,
  shouldShowWizard,
  storeUrlFor,
} from '@/lib/appInstall/appInstall';
import { getAppTarget, subscribeAppTarget } from '@/lib/appInstall/target';
import { saveDeferredLink } from '@/lib/appInstall/deferredLink';

/**
 * The "get the app" wizard. A phone that opens a shared link or a scanned QR code is offered the Connekyt app first,
 * with the web as the alternative:
 *   welcome   what the app adds, one tap to the store, "I already have it", "continue on the web"
 *   checking  looking for the app on this phone
 *   missing   the app did not open: the store button again
 *   returned  the visitor came back after opening the store: "Open in the app"
 * A web page cannot tell whether an app is installed, so "I already have it" fires the app link and watches whether
 * the page was handed over (hidden or blurred) within a moment. Desktop browsers, installed web apps and the pages
 * outside the share routes never see it (see lib/appInstall/appInstall.ts).
 */

const PROBE_MS = 1600;
const NAVY = '#083A85';
const PINK = '#F20C8F';

type Phase = 'closed' | 'welcome' | 'checking' | 'missing' | 'returned';

const BENEFITS: { icon: string; title: string; body: string }[] = [
  { icon: 'bi-person-bounding-box', title: 'Find your photos in seconds', body: 'One selfie filters the whole gallery down to you.' },
  { icon: 'bi-broadcast', title: 'Live events, no lag', body: 'Watch, chat and send gifts in a smoother stream.' },
  { icon: 'bi-bell-fill', title: 'Never miss a moment', body: 'Instant alerts when photos and streams go live.' },
];

function readNumber(storage: Storage | null, key: string): number | null {
  try {
    const v = Number(storage?.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | null, key: string, value: string): void {
  try { storage?.setItem(key, value); } catch { /* private mode: the wizard just asks again */ }
}

function safeRemove(storage: Storage | null, key: string): void {
  try { storage?.removeItem(key); } catch { /* ignore */ }
}

export default function AppInstallWizard(): React.JSX.Element | null {
  const pathname = usePathname() || '/';
  const search = useSearchParams();
  const target = useSyncExternalStore(subscribeAppTarget, getAppTarget, () => null);
  const [platform, setPlatform] = useState<MobilePlatform>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const primaryRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  const fromQr = isQrVisit(search);
  const searchKey = search.toString();

  // Decide whether to open, once the platform and the page are known.
  useEffect(() => {
    const p = detectMobilePlatform();
    setPlatform(p);
    const now = Date.now();
    const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const local = typeof window !== 'undefined' ? window.localStorage : null;
    const session = typeof window !== 'undefined' ? window.sessionStorage : null;
    const show = shouldShowWizard({
      platform: p,
      pathname,
      search: new URLSearchParams(searchKey),
      now,
      dismissedUntil: readNumber(local, DISMISS_KEY),
      dismissedThisSession: !!session?.getItem(SESSION_DISMISS_KEY),
      standalone: !!standalone,
    });
    if (!show) { setPhase('closed'); return; }
    setPhase(isPendingInstall(readNumber(local, PENDING_INSTALL_KEY), now) ? 'returned' : 'welcome');
  }, [pathname, searchKey]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  const continueOnWeb = useCallback(() => {
    clearTimer();
    if (fromQr) safeSet(window.sessionStorage, SESSION_DISMISS_KEY, '1');
    else safeSet(window.localStorage, DISMISS_KEY, String(dismissUntil(Date.now())));
    setPhase('closed');
  }, [clearTimer, fromQr]);

  // Going to the store: remember where the visitor was headed (the installed app reads it back and carries them there
  // after sign-up) and that they went, so coming back offers "Open in the app" instead of the pitch again.
  const goToStore = useCallback(async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!platform) return;
    safeSet(window.localStorage, PENDING_INSTALL_KEY, String(Date.now()));
    const code = await saveDeferredLink(destinationFor(pathname, new URLSearchParams(searchKey), target), platform);
    window.location.href = storeUrlFor(platform, fromQr, code);
  }, [platform, pathname, searchKey, target, fromQr]);

  const openApp = useCallback(() => {
    setPhase('checking');
    let handedOver = false;
    const mark = () => { handedOver = true; };
    const onVisibility = () => { if (document.visibilityState === 'hidden') handedOver = true; };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', mark);
    window.addEventListener('blur', mark);
    clearTimer();
    timerRef.current = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', mark);
      window.removeEventListener('blur', mark);
      if (handedOver) {
        safeRemove(window.localStorage, PENDING_INSTALL_KEY);
        setPhase('closed');
      } else {
        setPhase('missing');
      }
    }, PROBE_MS);
    window.location.href = appDeepLinkFor(pathname, new URLSearchParams(searchKey), target);
  }, [clearTimer, pathname, searchKey, target]);

  // Keyboard and focus: the sheet is a dialog, Escape means "continue on the web".
  useEffect(() => {
    if (phase === 'closed') return;
    primaryRef.current?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') continueOnWeb(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = original; document.removeEventListener('keydown', onKey); };
  }, [phase, continueOnWeb]);

  if (phase === 'closed' || !platform) return null;

  const store = storeUrlFor(platform, fromQr);
  const storeName = platform === 'ios' ? 'App Store' : 'Google Play';
  const title =
    phase === 'missing' ? 'We could not open the app'
      : phase === 'returned' ? 'Installed it? Open the app'
        : phase === 'checking' ? 'Looking for the app...'
          : 'Get the Connekyt app';
  const lead =
    phase === 'missing' ? 'It does not look installed on this phone yet. Download it, then open this link again.'
      : phase === 'returned' ? 'Open this page in the app to carry on where you left off.'
        : phase === 'checking' ? 'One moment.'
          : fromQr ? 'You scanned a Connekyt code. The app is the best way to take part, and it is free.'
            : 'You opened a Connekyt link. The app is faster, easier and free.';

  return (
    <div
      role="presentation"
      onClick={continueOnWeb}
      style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(5,8,18,0.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-wizard-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, background: '#fff', color: '#0f172a', position: 'relative', overflow: 'hidden',
          borderRadius: '24px 24px 0 0', padding: '28px 22px calc(20px + env(safe-area-inset-bottom))',
          boxShadow: '0 -16px 48px rgba(8,58,133,0.28)', maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${NAVY} 0%, #0F4FB6 45%, ${PINK} 100%)` }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${NAVY} 0%, #0F4FB6 60%, ${PINK} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 900, boxShadow: '0 4px 14px rgba(8,58,133,0.3)', flexShrink: 0 }}>C</div>
          <div style={{ minWidth: 0 }}>
            <h2 id="app-wizard-title" style={{ fontSize: 21, fontWeight: 800, margin: 0, color: NAVY, lineHeight: 1.2 }}>{title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.45, color: '#475569', margin: '4px 0 0' }}>{lead}</p>
          </div>
        </div>

        {phase === 'welcome' && (
          <ul style={{ listStyle: 'none', margin: '14px 0 18px', padding: 0, display: 'grid', gap: 10 }}>
            {BENEFITS.map((b) => (
              <li key={b.title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(8,58,133,0.08)', color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${b.icon}`} />
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.35 }}>
                  <strong style={{ display: 'block', color: '#0f172a' }}>{b.title}</strong>
                  <span style={{ color: '#64748b' }}>{b.body}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {phase === 'returned' ? (
          <button type="button" ref={(el) => { primaryRef.current = el; }} onClick={openApp} style={primaryStyle}>Open in the app</button>
        ) : phase === 'checking' ? (
          <button type="button" disabled style={{ ...primaryStyle, opacity: 0.7, cursor: 'wait' }}>Opening...</button>
        ) : (
          <a href={store} ref={(el) => { primaryRef.current = el; }} onClick={goToStore} rel="noopener" style={primaryStyle}>
            <i className={`bi ${platform === 'ios' ? 'bi-apple' : 'bi-google-play'}`} aria-hidden="true" style={{ marginRight: 8 }} />
            {phase === 'missing' ? `Download from ${storeName}` : `Get the app on ${storeName}`}
          </a>
        )}

        {phase !== 'checking' && (
          <button type="button" onClick={phase === 'returned' ? () => { void goToStore(); } : openApp} style={secondaryStyle}>
            {phase === 'returned' ? `Not installed? Open ${storeName}` : phase === 'missing' ? 'I installed it, open the app' : 'I already have the app'}
          </button>
        )}

        <button type="button" onClick={continueOnWeb} style={linkStyle}>Continue on the web</button>
      </div>
    </div>
  );
}

const primaryStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', boxSizing: 'border-box',
  padding: '14px 18px', borderRadius: 14, border: 'none', cursor: 'pointer', minHeight: 52,
  background: `linear-gradient(135deg, ${NAVY} 0%, #0F4FB6 100%)`, color: '#fff', fontSize: 16, fontWeight: 700,
  textDecoration: 'none', boxShadow: '0 6px 18px rgba(8,58,133,0.3)',
};

const secondaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 10, padding: '12px 18px', borderRadius: 14, minHeight: 46,
  background: 'transparent', color: NAVY, border: '1px solid rgba(8,58,133,0.25)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const linkStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6, padding: '12px 18px', minHeight: 44,
  background: 'transparent', color: '#64748b', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
};
