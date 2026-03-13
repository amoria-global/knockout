'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  initiateXentriPayTip,
  initiateXentriPayStreaming,
  initiateXentriPayment,
  initiateXentriPayDonation,
  initiateXentriPayPhotoPurchase,
  pollXentriPayStatus,
  type XentriPayResponse,
  type XentriPayStatusResponse,
} from '@/lib/APIs/payments/xentripay';

// ==================== Types ====================

export type PaymentType = 'booking' | 'tip' | 'streaming' | 'donation' | 'photo_purchase';

export interface XentriPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (refid: string) => void;
  onError?: (error: string) => void;
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
  amount,
  currencyCode,
  currencyId,
  paymentType,
  title,
  subtitle,
  declarationId,
  eventId,
  donationId,
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

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Validate payment details
  const isValid = useCallback(() => {
    if (!selectedMethod) return false;
    return phone.length >= 10;
  }, [selectedMethod, phone]);

  // Start payment status polling
  const startPolling = useCallback((paymentRefid: string) => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
    }

    const usePublicStatus = paymentType === 'donation';
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
          setError('Payment was not completed. Please try again.');
        },
        onError: (errorMsg: string) => {
          setError(errorMsg);
          setStep('failed');
        },
      },
      5000,
      60,
      usePublicStatus
    );
  }, [onSuccess, paymentType]);

  // Handle payment initiation
  const handlePay = async () => {
    if (!isValid()) return;

    setLoading(true);
    setError(null);

    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return;

    const paymentMethodType = selectedMethod === 'card' ? 'CARD' : 'MOBILE_MONEY';
    const redirectUrl = selectedMethod === 'card' ? window.location.href : undefined;

    try {
      let response: { success: boolean; data?: XentriPayResponse; error?: string };

      if (paymentType === 'booking' && (declarationId || eventId)) {
        response = await initiateXentriPayment({
          declarationId,
          eventId,
          phone,
          telecomProvider: method.provider,
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else if (paymentType === 'tip' && eventId) {
        response = await initiateXentriPayTip({
          eventId,
          amount,
          currencyId,
          phone,
          telecomProvider: method.provider,
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else if (paymentType === 'streaming' && eventId) {
        response = await initiateXentriPayStreaming({
          eventId,
          amount,
          currencyId,
          phone,
          telecomProvider: method.provider,
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
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
          phone,
          telecomProvider: method.provider,
          paymentMethod: paymentMethodType,
          redirectUrl,
        });
      } else {
        throw new Error('Invalid payment configuration');
      }

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to initiate payment');
      }

      const data = response.data;
      setRefid(data.refid);

      // For card payments, open payment URL
      if (selectedMethod === 'card' && data.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
        window.open(data.paymentUrl, '_blank');
      }

      setStep('processing');
      startPolling(data.refid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
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
    : 'Make Payment';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val) + ' ' + currencyCode;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
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
          backgroundColor: '#fff',
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 40px)',
          paddingTop: 'clamp(50px, 8vw, 60px)',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
              background: '#f5f5f5',
              border: 'none',
              color: '#666',
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
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
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
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: 'clamp(20px, 5vw, 26px)',
                fontWeight: 700,
                color: '#083A85',
                marginBottom: '8px',
                marginTop: 0,
              }}>
                {title || defaultTitle}
              </h2>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                {subtitle || (
                  <>Amount: <strong style={{ color: '#083A85' }}>{formatAmount(amount)}</strong></>
                )}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#333',
                marginBottom: '12px',
              }}>Select Payment Method</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      backgroundColor: selectedMethod === method.id ? 'rgba(8, 58, 133, 0.08)' : '#f8f9fa',
                      border: '2px solid',
                      borderColor: selectedMethod === method.id ? '#083A85' : '#e0e0e0',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: '100%',
                      textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e0e0e0',
                    }}>
                      <img src={method.image} alt={method.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ color: '#333', fontSize: '15px', fontWeight: 500 }}>{method.name}</span>
                    {selectedMethod === method.id && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#083A85" style={{ marginLeft: 'auto' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Input - shown for all methods */}
            {selectedMethod && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px',
                }}>Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={selectedMethod === 'mtn' ? 'e.g., 078XXXXXXX' : selectedMethod === 'airtel' ? 'e.g., 073XXXXXXX' : 'e.g., 078XXXXXXX'}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    color: '#333',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box' as const,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: '6px', marginBottom: 0 }}>
                  {selectedMethod === 'card'
                    ? 'Required for payment verification'
                    : 'You will receive a payment prompt on this number'}
                </p>
              </div>
            )}

            {/* Card info note */}
            {selectedMethod === 'card' && (
              <div style={{
                marginBottom: '24px',
                padding: '14px 16px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
              }}>
                <p style={{ fontSize: '14px', color: '#1E40AF', margin: 0 }}>
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
                border: '1px solid #EF4444',
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
                padding: '16px 24px',
                background: (!isValid() || loading)
                  ? '#e0e0e0'
                  : 'linear-gradient(135deg, #083A85 0%, #0d4a9e 100%)',
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
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Pay {formatAmount(amount)}
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
                <p style={{ fontSize: '15px', color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
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
              <p style={{ fontSize: '15px', color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
                A payment prompt has been sent to your phone.
                Please check your phone and confirm the payment.
              </p>
            )}

            <p style={{ fontSize: '13px', color: '#999' }}>
              Waiting for confirmation... This may take a moment.
            </p>

            {/* Cancel button */}
            <button
              onClick={handleClose}
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                backgroundColor: 'transparent',
                border: '1px solid #ccc',
                borderRadius: '10px',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
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
            <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>
              Your payment of <strong>{formatAmount(amount)}</strong> has been completed.
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
            <p style={{ fontSize: '15px', color: '#666', marginBottom: '24px' }}>
              {error || 'The payment could not be completed. Please try again.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleRetry}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0d4a9e 100%)',
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
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#666',
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
