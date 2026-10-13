'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { pollXentriPayStatus } from '@/lib/APIs/payments/xentripay';
import InternationalPhoneInput, { type PhoneValue } from '../components/phone/InternationalPhoneInput';
import { PaymentMethodChooser } from '@/app/components/payments/PaymentMethodChooser';

/**
 * Sessionless payment receiver. The mobile app hands a buyer off here with a
 * one-time token when a payment has to finish in a browser:
 *
 *   /user/complete-payment?ref={token}
 *
 * Query params:
 *   ref - handoff token (UUID) minted by the backend for one pending payment
 *
 * Flow (everything below is PUBLIC — no login, no Authorization header):
 *   1. GET  /api/remote/public/payments/handoff/{ref}
 *        -> { action:1, data:{ type, amount, currency, currencySymbol,
 *             eventTitle, expiresAt, declarationStatus? } }
 *        404 = link invalid, 410 = link expired.
 *   2. Buyer picks MTN / Airtel (phone required) or card, then
 *      POST /api/remote/public/payments/handoff/{ref}/initiate
 *        -> { action:1, data:{ refid, tid, paymentUrl } }
 *      Card returns a paymentUrl we open in a new tab.
 *   3. Poll the existing public status endpoint
 *      GET /api/remote/public/payments/xentripay/status/{refid}
 *      (via pollXentriPayStatus with usePublic=true) until SUCCESS/FAILED.
 *   4. Success -> confirmation, buyer returns to the app. Failure -> the
 *      token allows retries until expiry, so we send them back to the form.
 */

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL
    || 'https://backend.connekyt.com').replace(/\/$/, '');

// 'unconfirmed': a timeout or status error after initiation. The charge may
// have landed, so this step never shows the Pay button (docs/PAYMENTS.md
// rule 2). Only an explicit gateway FAILED or a backend refusal returns the
// buyer to the form.
type Step = 'loading' | 'invalid' | 'expired' | 'error' | 'form' | 'initiating' | 'pending' | 'unconfirmed' | 'success';

interface HandoffData {
  type: string; // 'BOOKING_DECLARATION' | 'ARCHIVE'
  amount: number;
  currency: string;
  currencySymbol: string;
  eventTitle?: string;
  expiresAt?: string;
  declarationStatus?: string;
}

const TYPE_LABELS: Record<string, string> = {
  BOOKING_DECLARATION: 'Booking payment',
  ARCHIVE: 'Album archive unlock',
};

interface MethodTile {
  id: 'mtn' | 'airtel' | 'card';
  name: string;
  image: string;
  provider: string; // value sent to the backend ("MTN", "AIRTEL", "CARD")
}

const PAYMENT_METHODS: MethodTile[] = [
  { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png', provider: 'MTN' },
  { id: 'airtel', name: 'Airtel Money', image: '/airtel.png', provider: 'AIRTEL' },
  { id: 'card', name: 'VISA & Master Card', image: '/cards.png', provider: 'CARD' },
];

function CompletePaymentContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';

  const [step, setStep] = useState<Step>('loading');
  const [handoff, setHandoff] = useState<HandoffData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<MethodTile['id'] | null>(null);
  const [phoneVal, setPhoneVal] = useState<PhoneValue | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const stopPollingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ref) {
      setStep('invalid');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/remote/public/payments/handoff/${ref}`);
        if (cancelled) return;
        if (res.status === 404) { setStep('invalid'); return; }
        if (res.status === 410) { setStep('expired'); return; }
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.action !== 1 || !j?.data) {
          setLoadError(j?.message || `HTTP ${res.status}`);
          setStep('error');
          return;
        }
        setHandoff(j.data as HandoffData);
        setStep('form');
      } catch {
        if (cancelled) return;
        setLoadError('Could not reach the payment server. Please check your connection and try again.');
        setStep('error');
      }
    })();
    return () => { cancelled = true; };
  }, [ref]);

  // Stop any in-flight status polling when the page unmounts
  useEffect(() => () => { stopPollingRef.current?.(); }, []);

  const isCard = selectedMethod === 'card';
  const canPay = !!selectedMethod && (isCard || !!phoneVal?.isValid);

  const startPolling = (refid: string, card: boolean) => {
    stopPollingRef.current?.();
    stopPollingRef.current = pollXentriPayStatus(
      refid,
      {
        onSuccess: () => setStep('success'),
        // Explicit gateway FAILED past the card grace window: nothing was
        // charged, so the form (and its Pay button) is safe.
        onFailure: () => {
          setPayError('The provider reported this payment as failed. You were not charged.');
          setStep('form');
        },
        // Timeout or status error: the charge may have landed.
        onError: () => setStep('unconfirmed'),
      },
      2000,
      150,
      true, // public status endpoint — this page has no session
      // Card sessions report FAILED before the buyer even types their card
      // number - keep polling through those early FAILEDs (see
      // pollXentriPayStatus docs / XentriPayModal which uses the same value).
      card ? 180_000 : 0
    );
  };

  const startPay = async () => {
    if (!canPay || !handoff) return;
    const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
    if (!method) return;

    // Open the card tab synchronously (inside the click handler) - mobile
    // browsers block window.open() after an await because the user-gesture
    // chain is broken. Navigate it to the gateway URL once initiate responds.
    const cardWindow: Window | null = isCard ? window.open('about:blank', '_blank') : null;

    setPayError(null);
    setStep('initiating');
    // True once the backend has answered. A refusal it sends back is definite
    // (nothing charged); no answer at all means the POST may have reached the
    // gateway, so the outcome is unknown (docs/PAYMENTS.md rule 3).
    let answered = false;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/remote/public/payments/handoff/${ref}/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isCard ? {} : { phone: phoneVal?.digits ?? '', telecomProvider: method.provider }),
          paymentMethod: isCard ? 'CARD' : 'MOBILE_MONEY',
        }),
      });
      answered = true;
      if (res.status === 404) { cardWindow?.close(); setStep('invalid'); return; }
      if (res.status === 410) { cardWindow?.close(); setStep('expired'); return; }
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.action !== 1 || !j?.data?.refid) {
        throw new Error(j?.message || `HTTP ${res.status}`);
      }
      const url: string | undefined = j.data.paymentUrl;
      if (url) {
        setPaymentUrl(url);
        if (cardWindow) {
          cardWindow.location.href = url;
        } else {
          window.open(url, '_blank');
        }
      } else {
        cardWindow?.close();
      }
      setStep('pending');
      startPolling(j.data.refid, isCard);
    } catch (e) {
      if (!answered) {
        // Leave the card tab open: if the session was created, the buyer
        // may be paying in it right now.
        setStep('unconfirmed');
        return;
      }
      cardWindow?.close();
      setPayError(e instanceof Error ? e.message : 'Could not initiate payment');
      setStep('form');
    }
  };

  const typeLabel = handoff ? (TYPE_LABELS[handoff.type] || 'Payment') : '';
  const amountLabel = handoff
    ? `${handoff.currencySymbol}${handoff.amount.toLocaleString(undefined, {
        maximumFractionDigits: handoff.currency === 'RWF' ? 0 : 2,
      })} ${handoff.currency}`
    : '';

  return (
    <>
      <Navbar />
      <main className="cp-main">
        <style>{`
          .cp-main {
            min-height: 100vh;
            background: linear-gradient(180deg, #f0f4f9 0%, #f8fafc 100%);
            padding-top: clamp(84px, 12vw, 110px);
            padding-bottom: 60px;
            font-family: 'Pragati Narrow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .cp-wrap {
            max-width: 540px;
            margin: 0 auto;
            padding: 0 16px;
          }
          .cp-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 20px 50px -12px rgba(8, 28, 60, 0.12), 0 0 0 1px rgba(8, 58, 133, 0.06);
            padding: clamp(22px, 5vw, 36px);
            text-align: center;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(8, 58, 133, 0.08);
          }
          .cp-brand-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #083A85 0%, #F20C8F 60%, #03969C 100%);
          }
          .cp-badge-secure {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 999px;
            background: rgba(8, 58, 133, 0.06);
            color: #083A85;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 14px;
          }
          .cp-receipt {
            margin-top: 20px;
            padding: 18px 20px;
            background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%);
            border: 1px solid #dbeafe;
            border-radius: 16px;
            text-align: left;
            box-shadow: 0 4px 12px rgba(8, 58, 133, 0.03);
          }
          .cp-escrow {
            display: flex;
            gap: 9px;
            align-items: flex-start;
            margin-top: 14px;
            padding: 10px 12px;
            background: rgba(3, 150, 156, 0.06);
            border: 1px solid rgba(3, 150, 156, 0.2);
            border-radius: 10px;
            font-size: 12px;
            line-height: 1.45;
            color: #334155;
          }
          .cp-btn-primary {
            margin-top: 22px;
            width: 100%;
            min-height: 48px;
            padding: 13px 20px;
            border-radius: 12px;
            border: none;
            color: #ffffff;
            font-size: 15.5px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
            box-shadow: 0 10px 24px -8px rgba(242, 12, 143, 0.5);
            font-family: inherit;
          }
          .cp-btn-primary:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 28px -8px rgba(242, 12, 143, 0.65);
          }
          .cp-btn-primary:disabled {
            background: #94a3b8 !important;
            box-shadow: none !important;
            cursor: not-allowed;
            opacity: 0.7;
          }
          @keyframes cp-spin { to { transform: rotate(360deg); } }
          @media (max-width: 600px) {
            .cp-wrap { padding: 0 12px; }
            .cp-card { padding: 22px 16px; border-radius: 20px; }
            .cp-receipt { padding: 14px 14px; }
          }
        `}</style>

        <div className="cp-wrap">
          <div className="cp-card">
            <div className="cp-brand-bar" aria-hidden="true" />

            {step === 'loading' && (
              <div style={{ padding: '40px 0' }}>
                <div style={{
                  width: 52, height: 52, margin: '0 auto 18px', borderRadius: '50%',
                  border: '3.5px solid #e2e8f0', borderTopColor: '#083A85',
                  animation: 'cp-spin 0.8s linear infinite',
                }} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                  Loading your payment details…
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
                  Retrieving secure session
                </p>
              </div>
            )}

            {step === 'invalid' && (
              <StateBlock
                tone="error"
                icon="bi-exclamation-triangle-fill"
                title="Invalid Payment Link"
                body="This payment link is invalid or could not be found. Please request a fresh payment link from the app."
              />
            )}

            {step === 'expired' && (
              <StateBlock
                tone="warning"
                icon="bi-clock-history"
                title="Payment Link Expired"
                body="For your security, this payment link has timed out. Please initiate payment again from your booking in the app."
              />
            )}

            {step === 'error' && (
              <StateBlock
                tone="error"
                icon="bi-x-circle-fill"
                title="Unable to Load Payment"
                body={loadError || 'Could not load this payment session. Please check your connection and try again.'}
              />
            )}

            {step === 'success' && (
              <div style={{ padding: '16px 0 8px' }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%', background: '#dcfce7',
                  border: '2px solid #86efac',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <i className="bi bi-check-lg" style={{ fontSize: 36, color: '#15803d' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                  Payment Received!
                </h2>
                <p style={{ margin: '10px 0 0', fontSize: 14.5, color: '#475569', lineHeight: 1.6 }}>
                  Thank you! Your payment{handoff?.eventTitle ? <> for <strong>{handoff.eventTitle}</strong></> : null} has been successfully verified.
                </p>
                <div style={{
                  marginTop: 20, padding: '12px 16px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 12, display: 'inline-block',
                  fontSize: 13, color: '#475569',
                }}>
                  <i className="bi bi-shield-check" style={{ color: '#15803d', marginRight: 6 }}></i>
                  Your booking is now confirmed. You can return safely to the app.
                </div>
              </div>
            )}

            {step === 'pending' && (
              <div style={{ padding: '20px 0 8px' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 18px', borderRadius: '50%',
                  border: '3.5px solid #fce7f3', borderTopColor: '#F20C8F',
                  animation: 'cp-spin 0.8s linear infinite',
                }} />
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                  Waiting for Confirmation…
                </h2>
                <p style={{ margin: '10px auto 0', maxWidth: 380, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                  {isCard
                    ? 'Please finish paying in the secure card tab. This page will update automatically once verified.'
                    : 'A mobile money authorization prompt has been sent to your phone. Approve it to finalize your booking.'}
                </p>
                {isCard && paymentUrl && (
                  <button
                    onClick={() => window.open(paymentUrl, '_blank')}
                    style={{
                      marginTop: 18, padding: '10px 20px', borderRadius: 10,
                      background: '#ffffff', color: '#083A85', border: '1.5px solid #083A85',
                      fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(8, 58, 133, 0.08)',
                    }}
                  >
                    <i className="bi bi-box-arrow-up-right" style={{ marginRight: 6 }}></i>
                    Re-open card checkout page
                  </button>
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 22, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                  <i className="bi bi-arrow-repeat" style={{ animation: 'cp-spin 2s linear infinite' }}></i> Watching for confirmation…
                </div>
              </div>
            )}

            {step === 'unconfirmed' && (
              <div style={{ padding: '20px 0 8px' }}>
                <div style={{
                  width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', background: '#fef3c7',
                  border: '2px solid #fcd34d',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span aria-hidden="true" style={{ fontSize: 28, fontWeight: 800, color: '#b45309' }}>?</span>
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                  Still unconfirmed
                </h2>
                <p style={{ margin: '10px auto 0', maxWidth: 380, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  We couldn&apos;t confirm this payment in time. If you approved it, the money may already have left your account, so please don&apos;t pay again yet.
                </p>
                <div style={{
                  margin: '18px auto 0', maxWidth: 380, padding: '12px 16px', textAlign: 'left',
                  background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
                  fontSize: 13, color: '#78350f', lineHeight: 1.65,
                }}>
                  1. Check your phone for the payment receipt SMS.<br />
                  2. Return to the app in a few minutes. A confirmed payment shows your booking as paid.<br />
                  If neither happens, contact support before paying again.
                </div>
              </div>
            )}

            {(step === 'form' || step === 'initiating') && handoff && (
              <>
                <div className="cp-badge-secure">
                  <i className="bi bi-shield-lock-fill" style={{ color: '#083A85' }}></i>
                  Connekyt Secure Checkout
                </div>

                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                  boxShadow: '0 8px 20px -4px rgba(8, 58, 133, 0.35)',
                }}>
                  <i className="bi bi-credit-card-2-front-fill" style={{ fontSize: 24, color: '#fff' }} />
                </div>

                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Complete Your Booking Payment
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
                  Confirm your payment securely. No password or login required.
                </p>

                {/* Receipt card */}
                <div className="cp-receipt">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#083A85',
                      background: '#dbeafe', padding: '3px 9px', borderRadius: 999,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {typeLabel}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                      <i className="bi bi-lock-fill" style={{ marginRight: 3, color: '#059669' }}></i> Verified Session
                    </span>
                  </div>

                  {handoff.eventTitle && (
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginTop: 10, lineHeight: 1.3 }}>
                      {handoff.eventTitle}
                    </div>
                  )}

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Total Amount Due:</span>
                    <strong style={{ fontSize: 24, fontWeight: 800, color: '#083A85', letterSpacing: '-0.02em' }}>
                      {amountLabel}
                    </strong>
                  </div>

                  <div className="cp-escrow">
                    <i className="bi bi-shield-check" style={{ color: '#03969c', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i>
                    <span>
                      <strong style={{ color: '#0f172a' }}>Escrow Protected:</strong> Funds are held safely by Connekyt and released only after your event is fulfilled.
                    </span>
                  </div>
                </div>

                {/* Payment method selection */}
                <div style={{ marginTop: 22, textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                    Select Payment Method
                  </label>
                  <PaymentMethodChooser
                    tone="light"
                    accent="#083A85"
                    selectedId={selectedMethod}
                    disabled={step === 'initiating'}
                    onSelect={(id) => { setSelectedMethod(id as MethodTile['id']); setPayError(null); }}
                    methods={PAYMENT_METHODS}
                  />

                  {selectedMethod && !isCard && (
                    <label style={{ display: 'block', marginTop: 16 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                        Mobile Money Number
                      </span>
                      <InternationalPhoneInput
                        onChange={setPhoneVal}
                        disabled={step === 'initiating'}
                        ariaLabel="Mobile money number"
                      />
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
                        An authorization prompt will be sent directly to this phone.
                      </p>
                    </label>
                  )}
                </div>

                {payError && (
                  <div style={{
                    marginTop: 16, padding: '12px 14px', background: '#fef2f2', color: '#991b1b',
                    border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 16, color: '#dc2626', flexShrink: 0 }}></i>
                    <span>{payError}</span>
                  </div>
                )}

                <button
                  className="cp-btn-primary"
                  onClick={startPay}
                  disabled={!canPay || step === 'initiating'}
                  style={{
                    background: !canPay || step === 'initiating'
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  }}
                >
                  {step === 'initiating' ? (
                    <>
                      <span style={{
                        width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        animation: 'cp-spin 0.8s linear infinite',
                      }} />
                      Connecting to gateway…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock-fill" style={{ fontSize: 14 }}></i>
                      Pay {amountLabel}
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  256-bit Encrypted · Powered by Connekyt Payments
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const TONE_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  error: { bg: '#fef2f2', fg: '#991b1b', border: '#fecaca' },
  warning: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
};

function StateBlock({ tone, icon, title, body }: { tone: 'error' | 'warning'; icon: string; title: string; body: string }) {
  const colors = TONE_COLORS[tone];
  return (
    <div style={{ padding: '24px 8px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: colors.bg,
        border: `1.5px solid ${colors.border}`, margin: '0 auto 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: colors.fg,
      }}>
        <i className={`bi ${icon}`} />
      </div>
      <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
      <p style={{ margin: '8px auto 0', maxWidth: 360, fontSize: 14, color: '#64748b', lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

export default function CompletePaymentPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f9fafb' }} />}>
      <CompletePaymentContent />
    </Suspense>
  );
}
