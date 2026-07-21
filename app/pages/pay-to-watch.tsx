'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getPublicEventById, type PublicEvent, getCurrencies, type Currency as APICurrency } from '@/lib/APIs/public';
import {
  registerAnonymousViewer,
  confirmAnonymousPayment,
  resolveAnonymousViewerByFingerprint,
  checkAnonymousAccessStatus,
} from '@/lib/APIs/streams/anonymous-viewer';
import XentriPayModal from '../components/XentriPayModal';

/**
 * Lands the buyer here after scanning the QR code a smart-TV shows when it
 * tries to open a paid event it doesn't have access to yet (see smartTv's
 * player.tsx PayGatePanel). The TV never collects payment details itself —
 * it just displays this link, generated with its own persisted device id.
 *
 * Query params:
 *   eventId  - the paid event/stream (required)
 *   device   - the *TV's* persisted anonymous-viewer device id, generated
 *              once by smartTv and never derived from this browser
 *              (required — access is granted to whichever device this
 *              string identifies, not to the phone completing the payment)
 *
 * Flow (mirrors the anonymous-viewer path knockout's own join-package page
 * uses for guests, just keyed to the TV's device id instead of this
 * browser's):
 *   1. Collect name/email/phone (backend requires them to register a
 *      viewer identity even though the buyer never creates an account).
 *   2. registerAnonymousViewer(eventId, {..., deviceFingerprint: device})
 *      -> ACCESS_GRANTED (nothing to pay) | REQUIRES_PAYMENT | DEVICE_CONFLICT
 *   3. REQUIRES_PAYMENT -> open XentriPayModal (mobile money / card).
 *   4. On success -> confirmAnonymousPayment ties the paid access to the
 *      TV's device id. The TV is polling checkAnonymousAccessStatus with
 *      that same id and unlocks playback on its own once this flips.
 *
 * Never linked from any nav/menu; not indexed (see the page.tsx metadata).
 * The only way here is scanning the TV's QR code.
 */

type Step = 'loading' | 'invalid' | 'identity' | 'checking' | 'granted' | 'conflict' | 'success' | 'error';

function PayToWatchContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '';
  const device = searchParams.get('device') || '';

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [currencies, setCurrencies] = useState<APICurrency[]>([]);
  const [step, setStep] = useState<Step>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!eventId || !device) {
      setStep('invalid');
      return;
    }
    let cancelled = false;
    (async () => {
      const [eventRes, currencyRes] = await Promise.all([
        getPublicEventById(eventId),
        getCurrencies(),
      ]);
      if (cancelled) return;
      if (!eventRes.success || !eventRes.data) {
        setStep('invalid');
        return;
      }
      setEvent(eventRes.data);
      if (currencyRes.success && currencyRes.data) setCurrencies(currencyRes.data);

      // Re-scanning the TV's QR after already paying shouldn't re-ask for
      // name/email/phone - this device's fingerprint alone is enough to
      // recognize a completed purchase and skip straight to "granted".
      const resolveRes = await resolveAnonymousViewerByFingerprint(eventId, device);
      if (cancelled) return;
      const existingViewerId = resolveRes.success ? resolveRes.data?.viewerId : null;
      if (existingViewerId) {
        const statusRes = await checkAnonymousAccessStatus(eventId, device, existingViewerId);
        if (cancelled) return;
        if (statusRes.success && statusRes.data?.hasAccess) {
          setViewerId(existingViewerId);
          setStep('granted');
          return;
        }
      }

      setStep('identity');
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, device]);

  const currencyLabel = event?.streamFeeCurrencyAbbreviation || 'RWF';
  const currencyId =
    currencies.find((c) => c.code === currencyLabel)?.id ||
    currencies.find((c) => c.code === 'RWF')?.id ||
    '';
  const amount = event?.streamFee || 0;

  const submitIdentity = async () => {
    if (!event) return;
    if (!name.trim()) { setFieldError('Name is required'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setFieldError('Please enter a valid email address'); return; }
    if (!phone.trim()) { setFieldError('Phone number is required'); return; }
    setFieldError('');
    setSubmitting(true);
    setStep('checking');
    try {
      const res = await registerAnonymousViewer(event.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        deviceFingerprint: device,
      });
      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Registration failed. Please try again.');
        setStep('error');
        return;
      }
      const status = res.data.status;
      if (res.data.viewerId) setViewerId(res.data.viewerId);
      if (status === 'ACCESS_GRANTED') {
        setStep('granted');
      } else if (status === 'DEVICE_CONFLICT') {
        setStep('conflict');
      } else {
        setStep('identity');
        setShowPayment(true);
      }
    } catch {
      setErrorMessage('Connection error. Please try again.');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (refid: string) => {
    setShowPayment(false);
    if (!event || !viewerId) return;
    try {
      await confirmAnonymousPayment(event.id, viewerId, refid);
    } catch {
      try {
        await confirmAnonymousPayment(event.id, viewerId, refid);
      } catch { /* backend can reconcile via payment ref later */ }
    }
    setStep('success');
  };

  const posterUrl = event?.eventPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80';
  const isLive = (event?.eventStatus || '').toUpperCase() === 'ONGOING';

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6fb', paddingTop: 48, paddingBottom: 60, fontFamily: "'Pragati Narrow', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          background: '#fff', borderRadius: 24, boxShadow: '0 24px 60px -20px rgba(8,58,133,0.25)',
          overflow: 'hidden', border: '1px solid rgba(8,58,133,0.06)',
        }}>
          {event && (
            <div style={{
              height: 160, position: 'relative',
              backgroundImage: `linear-gradient(160deg, rgba(8,58,133,0.85), rgba(242,12,143,0.55)), url("${encodeURI(posterUrl)}")`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
              <div style={{ position: 'absolute', left: 20, bottom: 16, right: 20, color: '#fff' }}>
                {isLive && (
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.9 }}>
                    LIVE NOW
                  </div>
                )}
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, lineHeight: 1.2 }}>{event.title}</div>
              </div>
            </div>
          )}

          <div style={{ padding: 28 }}>
            {step === 'loading' && <CenteredSpinner text="Loading…" />}

            {step === 'invalid' && (
              <StateBlock
                tone="error"
                icon="bi-exclamation-triangle"
                title="This link isn't valid"
                body="Please scan the QR code shown on your TV again."
              />
            )}

            {step === 'error' && (
              <StateBlock
                tone="error"
                icon="bi-exclamation-triangle"
                title="Something went wrong"
                body={errorMessage}
              />
            )}

            {step === 'checking' && <CenteredSpinner text="Checking your access…" />}

            {step === 'conflict' && (
              <StateBlock
                tone="warning"
                icon="bi-shield-exclamation"
                title="Already active elsewhere"
                body="This TV is already linked to a stream session on another device. Contact support if this looks wrong."
              />
            )}

            {step === 'granted' && (
              <StateBlock
                tone="success"
                icon="bi-tv"
                title="You already have access"
                body="No payment needed — your TV should already be playing this stream."
              />
            )}

            {step === 'success' && (
              <StateBlock
                tone="success"
                icon="bi-check2"
                title="Payment received"
                body="Look back at your TV — it will start playing automatically in a few seconds."
              />
            )}

            {step === 'identity' && event && (
              <>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Who&apos;s watching?</h1>
                <p style={{ margin: '6px 0 20px', fontSize: 13.5, color: '#6b7280', lineHeight: 1.5 }}>
                  We just need a few details before paying — your receipt goes here, and this ties access to the TV you scanned this from.
                </p>

                {amount > 0 && (
                  <div style={{
                    marginBottom: 18, padding: 16, background: '#f9fafb', border: '1px solid #f0f2f5',
                    borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  }}>
                    <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Stream access</span>
                    <strong style={{ fontSize: 22, color: '#0f172a' }}>{amount.toLocaleString()} {currencyLabel}</strong>
                  </div>
                )}

                <Field label="Full name" placeholder="Jane Uwase" value={name} onChange={setName} />
                <Field label="Email address" placeholder="jane@example.com" type="email" value={email} onChange={setEmail} />
                <Field label="Phone number" placeholder="+250 78 123 4567" type="tel" value={phone} onChange={setPhone} />

                {fieldError && <ErrorText>{fieldError}</ErrorText>}

                <button
                  onClick={submitIdentity}
                  disabled={submitting}
                  style={{
                    width: '100%', marginTop: 6, padding: '13px 18px', borderRadius: 12, border: 'none',
                    background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: '#fff', fontWeight: 800, fontSize: 14.5, cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 10px 24px -8px rgba(8,58,133,0.5)',
                  }}
                >
                  {submitting ? 'Please wait…' : 'Continue to payment'}
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: '#9ca3af', marginTop: 16 }}>
          Powered by Connekyt · Secure mobile money + card payments
        </p>
      </div>

      {event && (
        <XentriPayModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          amount={amount}
          currencyCode={currencyLabel}
          currencyId={currencyId}
          paymentType="streaming"
          eventId={event.id}
          viewerId={viewerId || undefined}
          viewerEmail={email}
          title={`Stream Access · ${event.title}`}
          subtitle={`${amount.toLocaleString()} ${currencyLabel}`}
          darkMode
          skipEventGeoCheck={isLive}
        />
      )}
    </main>
  );
}

function Field({ label, placeholder, type = 'text', value, onChange }: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb',
          fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 14, padding: 10, background: '#fef2f2', color: '#991b1b',
      border: '1px solid #fecaca', borderRadius: 8, fontSize: 13,
    }}>
      {children}
    </div>
  );
}

function CenteredSpinner({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{
        width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%',
        border: '3px solid #e5e7eb', borderTopColor: '#083A85', animation: 'ptw-spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 14, color: '#4b5563', fontWeight: 600 }}>{text}</p>
      <style>{'@keyframes ptw-spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

const TONE_COLORS: Record<string, { bg: string; fg: string }> = {
  error: { bg: '#fef2f2', fg: '#991b1b' },
  warning: { bg: '#fffbeb', fg: '#92400e' },
  success: { bg: '#dcfce7', fg: '#15803d' },
};

function StateBlock({ tone, icon, title, body }: { tone: 'error' | 'warning' | 'success'; icon: string; title: string; body: string }) {
  const colors = TONE_COLORS[tone];
  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: colors.bg, margin: '0 auto 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: colors.fg,
      }}>
        <i className={`bi ${icon}`} />
      </div>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{title}</h1>
      <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#6b7280', lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

export default function PayToWatchPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f6fb' }} />}>
      <PayToWatchContent />
    </Suspense>
  );
}
