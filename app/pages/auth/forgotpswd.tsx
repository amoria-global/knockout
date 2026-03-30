'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/APIs/auth/forgot-password/route';
import { useToast } from '@/lib/notifications/ToastProvider';

export default function ForgotPasswordPage(): React.JSX.Element {
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isDisabled = !email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isOnline) { showWarning('You are offline.'); return; }
    if (!isDisabled) {
      setLoading(true);
      try {
        const response = await forgotPassword({ email });
        if (response.success) {
          setSent(true);
          showSuccess('Reset link sent! Check your email.');
        } else {
          const msg = response.error || 'Failed to send reset link.';
          setError(msg); showError(msg);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An error occurred.';
        setError(msg); showError(msg);
      } finally { setLoading(false); }
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await forgotPassword({ email });
      if (response.success) showSuccess('Reset link resent!');
      else { const msg = response.error || 'Failed to resend.'; showError(msg); }
    } catch { showError('Failed to resend.'); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: isMobile ? '11px 14px' : '10px 14px',
    fontSize: isMobile ? '16px' : '15px', border: '1px solid #e2e8f0',
    borderRadius: '10px', outline: 'none', transition: 'all 0.2s',
    backgroundColor: '#eef2f9', minHeight: isMobile ? '44px' : '42px',
    boxSizing: 'border-box', color: '#1e293b'
  };

  return (
    <>
      <style>{`
        .fp-input:focus { border-color: #083A85 !important; box-shadow: 0 0 0 3px rgba(8,58,133,0.1) !important; background-color: #fff !important; }
        .fp-input:hover:not(:focus) { border-color: #cbd5e1 !important; }
        .fp-input::placeholder { color: #94a3b8; }
        @media screen and (max-width: 767px) {
          input[type="text"], input[type="email"] { font-size: 16px !important; }
        }
      `}</style>

      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f1f5f9', padding: isMobile ? '1rem' : '2rem'
      }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          backgroundColor: '#fff', borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          padding: isMobile ? '1.5rem 1.25rem' : '2rem 2.5rem'
        }}>
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #083A85 0%, #0d4ea8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(8,58,133,0.3)'
            }}>
              <i className={`bi ${sent ? 'bi-envelope-check' : 'bi-key'}`} style={{ fontSize: '20px', color: '#fff' }} />
            </div>
          </div>

          {!sent ? (
            /* ── Enter Email ── */
            <>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', textAlign: 'center', color: '#000', marginBottom: '2px' }}>
                Forgot Password?
              </h1>
              <p style={{ fontSize: isMobile ? '12px' : '13px', color: '#6b7280', textAlign: 'center', marginBottom: '16px', marginTop: 0, lineHeight: 1.5 }}>
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label htmlFor="fpEmail" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
                    </div>
                    <input className="fp-input" type="email" id="fpEmail" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" style={{ ...inputStyle, paddingLeft: '42px' }} />
                  </div>
                </div>

                <button type="submit" disabled={isDisabled || loading} style={{
                  width: '100%', padding: isMobile ? '12px' : '11px', fontSize: '15px',
                  borderRadius: '10px', fontWeight: '600', transition: 'all 0.3s',
                  cursor: (isDisabled || loading) ? 'not-allowed' : 'pointer',
                  backgroundColor: (isDisabled || loading) ? '#94a3b8' : '#083A85',
                  color: '#fff', border: 'none', letterSpacing: '0.5px',
                  minHeight: isMobile ? '48px' : undefined, marginBottom: '12px'
                }}
                  onMouseEnter={e => { if (!isDisabled && !loading) e.currentTarget.style.backgroundColor = '#052559'; }}
                  onMouseLeave={e => { if (!isDisabled && !loading) e.currentTarget.style.backgroundColor = '#083A85'; }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <Link href="/user/auth/login" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            /* ── Email Sent Confirmation ── */
            <>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', textAlign: 'center', color: '#000', marginBottom: '2px' }}>
                Check Your Email
              </h1>
              <p style={{ fontSize: isMobile ? '12px' : '13px', color: '#6b7280', textAlign: 'center', marginBottom: '16px', marginTop: 0, lineHeight: 1.5 }}>
                We&apos;ve sent a password reset link to <strong style={{ color: '#1e293b' }}>{email}</strong>. Click the link in the email to reset your password.
              </p>

              {/* Email icon illustration */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>Reset link sent successfully</span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginBottom: '14px', lineHeight: 1.5 }}>
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>

              <button onClick={handleResend} disabled={loading} style={{
                width: '100%', padding: isMobile ? '12px' : '11px', fontSize: '15px',
                borderRadius: '10px', fontWeight: '600', transition: 'all 0.3s',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: '#fff', color: '#083A85',
                border: '2px solid #083A85', letterSpacing: '0.5px',
                minHeight: isMobile ? '48px' : undefined, marginBottom: '12px'
              }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundColor = '#083A85'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#083A85'; } }}
              >
                {loading ? 'Resending...' : 'Resend Reset Link'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link href="/user/auth/login" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
