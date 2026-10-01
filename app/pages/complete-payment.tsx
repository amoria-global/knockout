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

type Step = 'loading' | 'invalid' | 'expired' | 'error' | 'form' | 'initiating' | 'pending' | 'success';

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
        onFailure: () => {
          setPayError('Payment was declined or timed out. Please check your balance and try again.');
          setStep('form');
        },
        onError: (msg) => {
          setPayError(msg || 'Something went wrong while checking your payment.');
          setStep('form');
        },
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
    try {
      const res = await fetch(`${BACKEND_BASE}/api/remote/public/payments/handoff/${ref}/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isCard ? {} : { phone: phoneVal?.digits ?? '', telecomProvider: method.provider }),
          paymentMethod: isCard ? 'CARD' : 'MOBILE_MONEY',
        }),
      });
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
      <main style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: 100, paddingBottom: 60 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
          <div style={{
            background: '#fff', borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
            padding: 32, textAlign: 'center',
          }}>
            {step === 'loading' && (
              <div style={{ padding: '24px 0' }}>
                <div style={{
                  width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%',
                  border: '3px solid #e5e7eb', borderTopColor: '#083A85', animation: 'cp-spin 0.8s linear infinite',
                }} />
                <p style={{ fontSize: 14, color: '#4b5563', fontWeight: 600 }}>Loading your payment…</p>
                <style>{'@keyframes cp-spin { to { transform: rotate(360deg); } }'}</style>
              </div>
            )}

            {step === 'invalid' && (
              <StateBlock
                tone="error"
                icon="bi-exclamation-triangle"
                title="Link not valid"
                body="This payment link is invalid."
              />
            )}

            {step === 'expired' && (
              <StateBlock
                tone="warning"
                icon="bi-clock-history"
                title="Link expired"
                body="This payment link has expired. Please start again from the app."
              />
            )}

            {step === 'error' && (
              <StateBlock
                tone="error"
                icon="bi-exclamation-triangle"
                title="Something went wrong"
                body={loadError || 'Could not load this payment. Please try again.'}
              />
            )}

            {step === 'success' && (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: '#dcfce7',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <i className="bi bi-check2" style={{ fontSize: 32, color: '#15803d' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                  Payment received
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#4b5563', lineHeight: 1.55 }}>
                  Thanks for your payment{handoff?.eventTitle ? <> for <strong>{handoff.eventTitle}</strong></> : null}.
                  You can return to the app.
                </p>
              </>
            )}

            {step === 'pending' && (
              <>
                <div style={{
                  width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%',
                  border: '3px solid #e5e7eb', borderTopColor: '#F20C8F', animation: 'cp-spin 0.8s linear infinite',
                }} />
                <style>{'@keyframes cp-spin { to { transform: rotate(360deg); } }'}</style>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                  Waiting for your payment…
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>
                  {isCard
                    ? 'Finish paying in the card page we just opened. This page updates automatically once the payment goes through.'
                    : 'A payment prompt has been sent to your phone. Approve it and this page will update automatically.'}
                </p>
                {isCard && paymentUrl && (
                  <button
                    onClick={() => window.open(paymentUrl, '_blank')}
                    style={{
                      marginTop: 16, padding: '10px 18px', borderRadius: 10,
                      background: '#fff', color: '#083A85', border: '1.5px solid #083A85',
                      fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                    }}
                  >
                    Re-open the card payment page
                  </button>
                )}
              </>
            )}

            {(step === 'form' || step === 'initiating') && handoff && (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <i className="bi bi-credit-card-2-front-fill" style={{ fontSize: 26, color: '#fff' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                  Complete your payment
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
                  Finish the payment you started in the app. No login needed.
                </p>

                <div style={{
                  marginTop: 20, padding: 16, background: '#f9fafb',
                  border: '1px solid #f0f2f5', borderRadius: 12, textAlign: 'left',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {typeLabel}
                  </div>
                  {handoff.eventTitle && (
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                      {handoff.eventTitle}
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: '#4b5563', marginTop: 8 }}>
                    Amount due:{' '}
                    <strong style={{ fontSize: 22, color: '#0f172a' }}>{amountLabel}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                    Pay with
                  </div>
                  <PaymentMethodChooser
                    tone="light"
                    accent="#083A85"
                    selectedId={selectedMethod}
                    disabled={step === 'initiating'}
                    onSelect={(id) => { setSelectedMethod(id as MethodTile['id']); setPayError(null); }}
                    methods={PAYMENT_METHODS}
                  />

                  {selectedMethod && !isCard && (
                    <label style={{ display: 'block', marginTop: 14 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                        Mobile money number
                      </span>
                      <InternationalPhoneInput
                        onChange={setPhoneVal}
                        disabled={step === 'initiating'}
                        ariaLabel="Mobile money number"
                      />
                    </label>
                  )}
                </div>

                {payError && (
                  <div style={{
                    marginTop: 14, padding: 10, background: '#fef2f2', color: '#991b1b',
                    border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, textAlign: 'left',
                  }}>{payError}</div>
                )}

                <button
                  onClick={startPay}
                  disabled={!canPay || step === 'initiating'}
                  style={{
                    marginTop: 18, width: '100%',
                    padding: '12px 18px', borderRadius: 10,
                    background: !canPay || step === 'initiating'
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: '#fff', border: 'none', fontWeight: 700, fontSize: 14.5,
                    cursor: !canPay || step === 'initiating' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {step === 'initiating' ? 'Connecting…' : `Pay ${amountLabel}`}
                </button>

                <p style={{ marginTop: 12, fontSize: 11.5, color: '#9ca3af' }}>
                  Powered by Connekyt · Secure mobile money + card payments
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const TONE_COLORS: Record<string, { bg: string; fg: string }> = {
  error: { bg: '#fef2f2', fg: '#991b1b' },
  warning: { bg: '#fffbeb', fg: '#92400e' },
};

function StateBlock({ tone, icon, title, body }: { tone: 'error' | 'warning'; icon: string; title: string; body: string }) {
  const colors = TONE_COLORS[tone];
  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: colors.bg, margin: '0 auto 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: colors.fg,
      }}>
        <i className={`bi ${icon}`} />
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
      <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#6b7280', lineHeight: 1.55 }}>{body}</p>
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
