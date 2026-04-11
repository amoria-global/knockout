'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  initiateXentriPayTip,
  initiateXentriPayStreaming,
  initiateXentriPayment,
  initiateXentriPayDonation,
  initiateXentriPayPhotoPurchase,
  initiateXentriPayAlbumPurchase,
  initiateAnonymousStreamingPayment,
  checkAnonymousPaymentStatus,
  pollXentriPayStatus,
  type XentriPayResponse,
  type XentriPayStatusResponse,
} from '@/lib/APIs/payments/xentripay';

// ==================== Types ====================

export type PaymentType = 'booking' | 'tip' | 'streaming' | 'donation' | 'photo_purchase' | 'album_purchase';

export interface XentriPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (refid: string) => void;
  onError?: (error: string) => void;
  // Fires when initiate-album-purchase returns 409 for photos the buyer already owns
  onAlreadyPurchased?: (photoIds: string[]) => void;
  amount: number;
  currencyCode: string;
  currencyId: string;
  paymentType: PaymentType;
  title?: string;
  subtitle?: string;
  // For booking payments - use existing declaration or eventId
  declarationId?: string;
  // For tip/streaming/photo_purchase - need event context
  eventId?: string;
  // For donation payments
  donationId?: string;
  // For streaming payments — optional donation amount added on top of gift
  donationAmount?: number;
  // Anonymous viewer ID — triggers public payment flow (no auth required)
  viewerId?: string;
  // For album_purchase — paid face-search photos
  albumId?: string;
  photoIds?: string[];
  buyerId?: string;
  // Dark theme to match viewer auth modal
  darkMode?: boolean;
}

type PaymentStep = 'method' | 'processing' | 'success' | 'failed';

// ==================== Payment Methods ====================

const paymentMethods = [
  { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png', provider: 'MTN' },
  { id: 'airtel', name: 'Airtel Money', image: '/airtel.png', provider: 'AIRTEL' },
  { id: 'card', name: 'VISA & Master Card', image: '/cards.png', provider: 'CARD' },
];

// ==================== Component ====================

const XentriPayModal: React.FC<XentriPayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  onAlreadyPurchased,
  amount,
  currencyCode,
  currencyId,
  paymentType,
  title,
  subtitle,
  declarationId,
  eventId,
  donationId,
  viewerId,
  albumId,
  photoIds,
  buyerId,
  donationAmount = 0,
  darkMode = false,
}) => {
  // State
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refid, setRefid] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedMethod(null);
      setPhone('');
      setLoading(false);
      setError(null);
      setRefid(null);
      setPaymentUrl(null);
    }
    return () => {
      if (stopPollingRef.current) {
        stopPollingRef.current();
        stopPollingRef.current = null;
      }
    };
  }, [isOpen]);

  // Close modal when session expires so auth modal can take over
  useEffect(() => {
    if (!isOpen) return;
    const handleSessionExpired = () => {
      handleClose();
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while preserving scroll position
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Validate payment details
  const isValid = useCallback(() => {
    if (!selectedMethod) return false;
    if (selectedMethod === 'card') return true;
    return phone.length >= 10;
  }, [selectedMethod, phone]);

  // Start payment status polling
  const startPolling = useCallback((paymentRefid: string) => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
    }

    // Anonymous viewer: use public payment-status endpoint
    if (viewerId && eventId) {
      let attempts = 0;
      let stopped = false;
      const poll = async () => {
        if (stopped) return;
        attempts++;
        try {
          const res = await checkAnonymousPaymentStatus(eventId, { viewerId, refid: paymentRefid });
          if (stopped) return;
          if (res.success && res.data) {
            if (res.data.status === 'SUCCESS') { setStep('success'); setTimeout(() => onSuccess(paymentRefid), 2000); return; }
            if (res.data.status === 'FAILED') { setStep('failed'); setError('Payment was declined or timed out. Please check your balance and try again.'); return; }
          }
          if (attempts >= 60) { setError('Payment is taking longer than expected. Please check your payment history.'); setStep('failed'); return; }
          setTimeout(poll, 5000);
        } catch {
          if (stopped) return;
          if (attempts >= 60) { setError('Unable to check payment status. Please try again later.'); setStep('failed'); return; }
          setTimeout(poll, 5000);
        }
      };
      setTimeout(poll, 5000);
      stopPollingRef.current = () => { stopped = true; };
      return;
    }

    const usePublicStatus = paymentType === 'donation' || paymentType === 'album_purchase';
    stopPollingRef.current = pollXentriPayStatus(
      paymentRefid,
      {
        onSuccess: (_data: XentriPayStatusResponse) => {
          setStep('success');
          setTimeout(() => {
            onSuccess(paymentRefid);
          }, 2000);
        },
        onFailure: (_data: XentriPayStatusResponse) => {
          setStep('failed');
          setError('Payment was declined or timed out. Please check your balance and try again.');
        },
        onError: (errorMsg: string) => {
          setError(errorMsg || 'Something went wrong while processing your payment.');
          setStep('failed');
        },
      },
      5000,
      60,
      usePublicStatus
    );
  }, [onSuccess, paymentType, viewerId, eventId]);

  // Handle payment initiation
  const handlePay = async () => {
    if (!isValid()) return;

    setLoading(true);
    setError(null);

    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return;

    const isCard = selectedMethod === 'card';
    const paymentMethodType = isCard ? 'CARD' : 'MOBILE_MONEY';
    // Use production URL for http (localhost), keep current URL for https (production)
    const currentUrl = window.location.href;
    const redirectUrl = isCard
      ? (currentUrl.startsWith('http://') ? 'https://connekyt.com' : currentUrl)
      : undefined;

    try {
      let response: { success: boolean; data?: XentriPayResponse; error?: string };

      if (paymentType === 'booking' && (declarationId || eventId)) {
        response = await initiateXentriPayment({
          declarationId,
          eventId,
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else if (paymentType === 'tip' && eventId) {
        response = await initiateXentriPayTip({
          eventId,
          amount,
          currencyId,
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else if (paymentType === 'streaming' && eventId) {
        if (viewerId) {
          // Anonymous viewer — use public endpoint (no auth)
          response = await initiateAnonymousStreamingPayment(eventId, {
            viewerId,
            ...(isCard ? {} : { phone, telecomProvider: method.provider }),
            paymentMethod: paymentMethodType,
            redirectUrl,
          });
        } else {
          response = await initiateXentriPayStreaming({
            eventId,
            amount,
            currencyId,
            ...(hasDonation ? { donationAmount } : {}),
            ...(isCard ? {} : { phone, telecomProvider: method.provider }),
            paymentMethod: paymentMethodType,
            redirectUrl,
          });
        }
      } else if (paymentType === 'donation' && donationId) {
        response = await initiateXentriPayDonation({
          donationId,
          phone,
          telecomProvider: method.provider,
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else if (paymentType === 'photo_purchase' && eventId) {
        response = await initiateXentriPayPhotoPurchase({
          eventId,
          amount,
          currencyId,
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else if (paymentType === 'album_purchase' && albumId && photoIds && photoIds.length > 0 && buyerId) {
        response = await initiateXentriPayAlbumPurchase({
          albumId,
          buyerId,
          photoIds,
          amount,
          currencyId,
          ...(isCard ? {} : { phone, telecomProvider: method.provider }),
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else {
        throw new Error('Invalid payment configuration');
      }

      if (!response.success || !response.data) {
        // 409: backend says some photos are already owned by this buyer
        const raw = response.data as unknown as { alreadyPurchased?: string[] } | undefined;
        if (paymentType === 'album_purchase' && raw?.alreadyPurchased?.length) {
          onAlreadyPurchased?.(raw.alreadyPurchased);
          return;
        }
        throw new Error(response.error || 'Failed to initiate payment');
      }

      const data = response.data as XentriPayResponse;
      setRefid(data.refid);

      // For card payments, open payment URL
      if (selectedMethod === 'card' && data.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
        window.open(data.paymentUrl, '_blank');
      }

      setStep('processing');
      startPolling(data.refid);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const lower = raw.toLowerCase();
      let msg: string;
      if (lower.includes('network') || lower.includes('fetch')) {
        msg = 'Unable to connect. Please check your internet connection and try again.';
      } else if (lower.includes('failed to initiate') || lower.includes('initiate payment')) {
        msg = 'Payment could not be initiated. Please verify your phone number matches the selected payment method (MTN or Airtel) and try again.';
      } else {
        msg = raw || 'Could not initiate payment. Please try again or choose a different payment method.';
      }
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setStep('method');
    setError(null);
    setRefid(null);
    setPaymentUrl(null);
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
  };

  // Handle close
  const handleClose = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  const defaultTitle = paymentType === 'donation' ? 'Complete Your Donation'
    : paymentType === 'tip' ? 'Send Tip'
    : paymentType === 'streaming' ? 'Send Gift'
    : paymentType === 'booking' ? 'Complete Payment'
    : paymentType === 'album_purchase' ? 'Buy Photos'
    : 'Make Payment';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val) + ' ' + currencyCode;
  };

  const totalAmount = amount + (donationAmount || 0);
  const hasDonation = (donationAmount || 0) > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(8,58,133,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && step !== 'processing') {
          handleClose();
        }
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: 'clamp(20px, 4vw, 32px)',
          paddingTop: 'clamp(20px, 4vw, 32px)',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          border: '1px solid rgba(8,58,133,0.06)',
          position: 'relative',
          margin: 'auto',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close button - hidden during processing */}
        {step !== 'processing' && (
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 'clamp(12px, 3vw, 20px)',
              right: 'clamp(12px, 3vw, 20px)',
              background: 'rgba(8,58,133,0.04)',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '10px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* ==================== STEP: Select Method ==================== */}
        {step === 'method' && (
          <>
            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{
                fontSize: 'clamp(18px, 4vw, 22px)',
                fontWeight: 800,
                color: '#083A85',
                marginBottom: '4px',
                marginTop: 0,
                fontFamily: "'Pragati Narrow', sans-serif",
              }}>
                {title || defaultTitle}
              </h2>
              {subtitle ? (
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{subtitle}</p>
              ) : hasDonation ? (
                <div style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Gift:</span>
                    <strong style={{ color: '#0f172a' }}>{formatAmount(amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Donation:</span>
                    <strong style={{ color: '#0a4da3' }}>{formatAmount(donationAmount!)}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(8,58,133,0.08)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>Total:</span>
                    <strong style={{ color: '#083A85' }}>{formatAmount(totalAmount)}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Amount: <strong style={{ color: '#083A85' }}>{formatAmount(amount)}</strong>
                </p>
              )}
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                marginBottom: '10px',
                letterSpacing: '0.5px',
              }}>Select Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {paymentMethods.map((method) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 8px',
                        backgroundColor: isSelected ? 'rgba(8, 58, 133, 0.06)' : '#fff',
                        border: isSelected ? '2px solid #083A85' : '1.5px solid rgba(8,58,133,0.1)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.25)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; }}
                    >
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-check" style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}></i>
                        </div>
                      )}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(8,58,133,0.08)',
                      }}>
                        <img src={method.image} alt={method.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ color: isSelected ? '#083A85' : '#374151', fontSize: '11px', fontWeight: isSelected ? 700 : 500, textAlign: 'center', lineHeight: 1.2 }}>{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Phone Input - shown for mobile money, and always for donations */}
            {selectedMethod && selectedMethod !== 'card' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: '6px',
                }}><i className="bi bi-phone" style={{ fontSize: 12 }}></i> Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={selectedMethod === 'mtn' ? '078XXXXXXX' : '073XXXXXXX'}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid rgba(8,58,133,0.1)',
                    borderRadius: '10px',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box' as const,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', marginBottom: 0 }}>
                  You will receive a payment prompt on this number
                </p>
              </div>
            )}

            {/* Card info note */}
            {selectedMethod === 'card' && (
              <div style={{
                marginBottom: '16px',
                padding: '12px 14px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
              }}>
                <p style={{ fontSize: '14px', color: '#083A85', margin: 0 }}>
                  You will be redirected to a secure payment page to enter your card details.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                color: '#EF4444',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={!isValid() || loading}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: (!isValid() || loading)
                  ? ('#d1d5db')
                  : ('linear-gradient(135deg, #083A85, #0a4da3)'),
                border: 'none',
                borderRadius: '14px',
                color: (!isValid() || loading) ? '#999' : '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: (!isValid() || loading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {selectedMethod === 'card' ? (
                      <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>
                    ) : (
                      <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>
                    )}
                  </svg>
                  {selectedMethod === 'card' ? `Proceed to Pay ${formatAmount(totalAmount)}` : `Pay ${formatAmount(totalAmount)}`}
                </>
              )}
            </button>
          </>
        )}

        {/* ==================== STEP: Processing ==================== */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {/* Spinner */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              border: '4px solid #e0e0e0',
              borderTopColor: '#083A85',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />

            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#083A85', marginBottom: '12px' }}>
              {selectedMethod === 'card' ? 'Complete Payment' : 'Payment Initiated'}
            </h3>

            {selectedMethod === 'card' ? (
              <>
                <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                  A secure payment page has been opened in a new tab.
                  Please complete the payment there.
                </p>
                {paymentUrl && (
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#083A85',
                      color: '#fff',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '16px',
                    }}
                  >
                    Open Payment Page
                  </a>
                )}
              </>
            ) : (
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
                A payment prompt has been sent to your phone.
                Please check your phone and confirm the payment.
              </p>
            )}

            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Waiting for confirmation... This may take a moment.
            </p>

            <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '12px', lineHeight: 1.5 }}>
              {"Didn't receive the SMS? Check that your mobile money balance covers the payment amount."}
            </p>
          </div>
        )}

        {/* ==================== STEP: Success ==================== */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {/* Checkmark */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              backgroundColor: '#F0FDF4',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#16A34A', marginBottom: '8px' }}>
              Payment Successful!
            </h3>
            <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
              Your payment of <strong>{formatAmount(totalAmount)}</strong> has been completed.
            </p>
          </div>
        )}

        {/* ==================== STEP: Failed ==================== */}
        {step === 'failed' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {/* X mark */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              backgroundColor: '#FEF2F2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#EF4444', marginBottom: '8px' }}>
              Payment Failed
            </h3>
            <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px' }}>
              {error || 'The payment could not be completed. Please try again.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleRetry}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #083A85, #0a4da3)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'rgba(8,58,133,0.04)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#6b7280',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default XentriPayModal;
