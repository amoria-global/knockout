'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/lib/APIs/auth/forgot-password/route';
import { useToast } from '@/lib/notifications/ToastProvider';

export default function ForgotPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo, isOnline } = useToast();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verification'>('email'); // Track current step

  // Create refs for each input box
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmailDisabled = !email;
  const isCodeDisabled = verificationCode.some(digit => digit === '');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    if (!isEmailDisabled) {
      setLoading(true);

      try {
        const response = await forgotPassword({ email });

        if (response.success) {
          // Move to verification code step
          setStep('verification');
          showSuccess('Verification code sent to your email!');
          showInfo('Check your inbox for the 6-digit code.');
          // Focus on first input box after switching to verification step
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        } else {
          const errorMessage = response.error || 'Failed to send verification code. Please try again.';
          setError(errorMessage);
          showError(errorMessage);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isCodeDisabled) {
      const code = verificationCode.join('');
      // Navigate to reset password page with email and code (set-new-password endpoint expects 'code')
      router.push(`/user/auth/resetpswd?email=${encodeURIComponent(email)}&code=${code}`);
      console.log('Verification code entered:', code);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow single digit numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!verificationCode[index] && index > 0) {
        // If current box is empty, move to previous box
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newCode = [...verificationCode];
        newCode[index] = '';
        setVerificationCode(newCode);
      }
    }
    // Handle left arrow
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle right arrow
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData) {
      const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setVerificationCode(newCode);

      // Focus on the next empty box or last box
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleResendCode = async () => {
    setError('');
    setVerificationCode(['', '', '', '', '', '']);

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    try {
      // Call forgot-password again to resend the code
      const response = await forgotPassword({ email });

      if (response.success) {
        showSuccess('Verification code resent successfully!');
      } else {
        const errorMessage = response.error || 'Failed to resend code. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    }

    // Focus on first input box
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        <div style={{width: '100%',maxWidth: '420px',padding: window.innerWidth < 640 ? '12px 18px 24px 18px' : '40px 36px', margin: '0 auto'}}>
        {/* Key Icon */}
        <div style={{display: 'flex',justifyContent: 'center',marginBottom: window.innerWidth < 640 ? '12px' : '20px'}}>
          <div style={{ width: window.innerWidth < 640 ? '48px' : '60px', height: window.innerWidth < 640 ? '48px' : '60px', borderRadius: '50%', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`bi ${step === 'email' ? 'bi-key' : 'bi-envelope'}`} style={{ fontSize: window.innerWidth < 640 ? '22px' : '28px', color: '#ffffff' }}></i>
          </div>
        </div>

        {/* Title and Description */}
        <h1 style={{ fontSize: window.innerWidth < 640 ? '18px' : '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: window.innerWidth < 640 ? '5px' : '8px', letterSpacing: '0.3px' }}>
          {step === 'email' ? 'Forgot Password?' : 'Verify Your Email'}
        </h1>

        <p style={{ fontSize: window.innerWidth < 640 ? '12px' : '15px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: window.innerWidth < 640 ? '16px' : '24px', lineHeight: '1.4', opacity: '0.7' }}>
          {step === 'email'
            ? ' Enter your email address and we\'ll send you a verification code to reset your password.'
            : `We've sent a 6-digit verification code to ${email}. Please enter it below.`
          }
        </p>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: window.innerWidth < 640 ? '8px' : '12px', marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
            <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '13px', color: '#991b1b', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            {/* Email Input */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '12px' : '18px' }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: window.innerWidth < 640 ? '12px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px' }}>Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: window.innerWidth < 640 ? '10px 12px' : '10px 14px',
                  fontSize: window.innerWidth < 640 ? '15px' : '14px',
                  fontWeight: '400',
                  border: '1.5px solid #d1d5db',
                  borderRadius: window.innerWidth < 640 ? '10px' : '12px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  backgroundColor: '#ffffff',
                  color: '#000000'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isEmailDisabled || loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: window.innerWidth < 640 ? '15px' : '14px',
                borderRadius: window.innerWidth < 640 ? '10px' : '12px',
                fontWeight: '500',
                transition: 'all 0.3s',
                cursor: (isEmailDisabled || loading) ? 'not-allowed' : 'pointer',
                backgroundColor: (isEmailDisabled || loading) ? '#d1d5db' : '#083A85',
                color: (isEmailDisabled || loading) ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: window.innerWidth < 640 ? '10px' : '16px'
              }}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>

            {/* Back to Sign In Link */}
            <div style={{ textAlign: 'center', marginBottom: window.innerWidth < 640 ? '10px' : '18px' }}>
              <Link href="/user/auth/login" style={{ fontSize: window.innerWidth < 640 ? '12px' : '14px', fontWeight: '500', color: '#000000', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: '0.7' }}>
                <span>←</span> Back to Sign In
              </Link>
            </div>

            {/* Divider */}
            <div style={{borderTop: window.innerWidth < 640 ? '1.5px solid #9a9a9cff' : '2px solid #9a9a9cff',marginBottom: window.innerWidth < 640 ? '10px' : '16px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px', opacity: '0.7' }}>
                Remember your password?
              </p>
              <Link href="/user/auth/login" style={{fontSize: window.innerWidth < 640 ? '12px' : '14px',color: '#083A85',textDecoration: 'none', fontWeight: '510'}}>
                Try signing in again
              </Link>
            </div>
          </form>
        )}

        {/* Verification Code Step */}
        {step === 'verification' && (
          <form onSubmit={handleVerificationSubmit}>
            {/* Show email (read-only) */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <label style={{ display: 'block', fontSize: window.innerWidth < 640 ? '12px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px' }}>Email Address</label>
              <div style={{
                width: '100%',
                padding: window.innerWidth < 640 ? '10px 12px' : '10px 14px',
                fontSize: window.innerWidth < 640 ? '14px' : '15px',
                fontWeight: '700',
                border: '1.5px solid #d1d5db',
                borderRadius: window.innerWidth < 640 ? '10px' : '12px',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#083A85',
                    fontSize: window.innerWidth < 640 ? '12px' : '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Change
                </button>
              </div>
            </div>

            {/* Verification Code Input - Individual Boxes */}
            <div style={{ marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <label style={{ display: 'block', fontSize: window.innerWidth < 640 ? '12px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px' }}>
                Verification Code
              </label>
              <div style={{
                display: 'flex',
                gap: window.innerWidth < 640 ? '4px' : '6px',
                justifyContent: 'center',
                marginTop: window.innerWidth < 640 ? '8px' : '10px'
              }}>
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    style={{
                      width: window.innerWidth < 640 ? '40px' : '45px',
                      height: window.innerWidth < 640 ? '40px' : '45px',
                      fontSize: window.innerWidth < 640 ? '16px' : '18px',
                      fontWeight: '500',
                      textAlign: 'center',
                      border: '1.5px solid #d1d5db',
                      borderRadius: window.innerWidth < 640 ? '8px' : '10px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#083A85';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCodeDisabled}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: window.innerWidth < 640 ? '15px' : '14px',
                borderRadius: window.innerWidth < 640 ? '10px' : '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
                cursor: isCodeDisabled ? 'not-allowed' : 'pointer',
                backgroundColor: isCodeDisabled ? '#d1d5db' : '#083A85',
                color: isCodeDisabled ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: window.innerWidth < 640 ? '10px' : '16px'
              }}
            >
              Verify Code
            </button>

            {/* Resend Code Link */}
            <div style={{ textAlign: 'center', marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <button
                type="button"
                onClick={handleResendCode}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: window.innerWidth < 640 ? '11px' : '13px',
                  fontWeight: '600',
                  color: '#000000',
                  opacity: '0.7',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Didn't receive the code? Resend
              </button>
            </div>

            {/* Divider */}
            <div style={{borderTop: window.innerWidth < 640 ? '1.5px solid #9a9a9cff' : '2px solid #9a9a9cff',marginBottom: window.innerWidth < 640 ? '10px' : '14px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px', opacity: '0.7' }}>
                Remember your password?
              </p>
              <Link href="/user/auth/login" style={{fontSize: window.innerWidth < 640 ? '12px' : '14px',color: '#083A85',textDecoration: 'none', fontWeight: '510'}}>
                Try signing in again
              </Link>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
export { ForgotPasswordPage };
