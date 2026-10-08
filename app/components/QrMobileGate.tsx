'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  QR_SOURCE_PARAM,
  QR_SOURCE_VALUE,
  PLAY_STORE_URL,
  APP_STORE_URL,
  appDeepLink,
  detectMobilePlatform,
  type MobilePlatform,
} from '@/lib/qr/eventQr';

/**
 * Wraps the public event page. When the page was opened from a printed or
 * shared event QR (?src=qr) on a phone or tablet, every button and link on it
 * first asks whether the Connekyt app is installed:
 *   - installed: the app opens on this event, where the viewer enters their
 *     details and continues with full permissions
 *   - not installed: the viewer is told to download the app first
 * Desktop browsers, and visits that did not come from a QR, are untouched.
 *
 * Detection is a custom-scheme probe. If the page is hidden or loses focus
 * soon after we fire connekt://, the OS handed over to the app. If not, the
 * app is treated as missing.
 */

const PROBE_MS = 1600;
const BRAND_NAVY = '#083A85';
const BRAND_PINK = '#F20C8F';

type Phase = 'closed' | 'prompt' | 'checking' | 'missing';

const INTERACTIVE = 'a[href], button, summary, [role="button"], [role="link"], [role="tab"], input[type="submit"], input[type="button"], label[for]';

export default function QrMobileGate({
  eventId,
  children,
}: {
  eventId?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const searchParams = useSearchParams();
  const id = eventId || searchParams.get('id') || searchParams.get('eventId') || '';
  const fromQr = searchParams.get(QR_SOURCE_PARAM) === QR_SOURCE_VALUE;

  const [platform, setPlatform] = useState<MobilePlatform>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const wrapRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gated = fromQr && !!id && platform !== null;

  useEffect(() => {
    setPlatform(detectMobilePlatform());
  }, []);

  // Intercept every click on the page content before React or the browser acts on it.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !gated) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || !target.closest) return;
      if (!target.closest(INTERACTIVE)) return;
      e.preventDefault();
      e.stopPropagation();
      setPhase((p) => (p === 'closed' ? 'prompt' : p));
    };
    el.addEventListener('click', onClick, true);
    return () => el.removeEventListener('click', onClick, true);
  }, [gated]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const close = useCallback(() => {
    clearTimer();
    setPhase('closed');
  }, [clearTimer]);

  const openApp = useCallback(() => {
    if (!id) return;
    setPhase('checking');
    let handedOver = false;
    const onHandover = () => {
      if (document.visibilityState === 'hidden') handedOver = true;
    };
    const onBlur = () => {
      handedOver = true;
    };
    document.addEventListener('visibilitychange', onHandover);
    window.addEventListener('pagehide', onBlur);
    window.addEventListener('blur', onBlur);
    clearTimer();
    timerRef.current = setTimeout(() => {
      document.removeEventListener('visibilitychange', onHandover);
      window.removeEventListener('pagehide', onBlur);
      window.removeEventListener('blur', onBlur);
      setPhase(handedOver ? 'prompt' : 'missing');
    }, PROBE_MS);
    window.location.href = appDeepLink(id);
  }, [id, clearTimer]);

  useEffect(() => {
    if (phase === 'closed') return;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, close]);

  return (
    <>
      <div ref={wrapRef} style={{ display: 'contents' }}>
        {children}
      </div>
      {gated && phase !== 'closed' && (
        <div
          role="presentation"
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'rgba(5,8,18,0.72)', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-gate-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, background: '#fff', color: '#0f172a',
              borderRadius: '20px 20px 0 0', padding: '28px 24px calc(24px + env(safe-area-inset-bottom))',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.35)',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 16,
                background: `linear-gradient(135deg, ${BRAND_NAVY}, ${BRAND_PINK})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 22, fontWeight: 800,
              }}
            >
              C
            </div>

            {phase === 'missing' ? (
              <>
                <h2 id="qr-gate-title" style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
                  Get the Connekyt app first
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.5, color: '#475569', margin: '0 0 20px' }}>
                  This event is joined through the Connekyt app. Download it, then scan the QR code again to enter your details and continue.
                </p>
                <a
                  href={platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL}
                  ref={primaryRef as unknown as React.Ref<HTMLAnchorElement>}
                  style={primaryStyle}
                >
                  {platform === 'ios' ? 'Download on the App Store' : 'Download on Google Play'}
                </a>
                <button type="button" onClick={openApp} style={secondaryStyle}>
                  I have installed it, open the app
                </button>
              </>
            ) : (
              <>
                <h2 id="qr-gate-title" style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
                  Continue in the Connekyt app
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.5, color: '#475569', margin: '0 0 20px' }}>
                  {phase === 'checking'
                    ? 'Looking for the Connekyt app on your phone...'
                    : 'To take part in this event you will enter your details in the app, and you will land straight back on this event.'}
                </p>
                <button
                  type="button"
                  ref={primaryRef}
                  onClick={openApp}
                  disabled={phase === 'checking'}
                  style={{ ...primaryStyle, border: 'none', cursor: phase === 'checking' ? 'wait' : 'pointer', opacity: phase === 'checking' ? 0.7 : 1 }}
                >
                  {phase === 'checking' ? 'Opening...' : 'Open in the app'}
                </button>
                <button type="button" onClick={close} style={secondaryStyle}>
                  Not now
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const primaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center',
  padding: '14px 18px', borderRadius: 12, background: '#083A85', color: '#fff',
  fontSize: 16, fontWeight: 700, textDecoration: 'none', minHeight: 48,
};

const secondaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 10, padding: '12px 18px', borderRadius: 12,
  background: 'transparent', color: '#083A85', border: '1px solid #cbd5e1',
  fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 48,
};
