'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { resendOtp } from '@/lib/APIs/auth/resend-otp/route';
import { useToast } from '@/lib/notifications/ToastProvider';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function VerifyOtpContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: showSuccess, error: showError, warning: showWarning, isOnline } = useToast();

  // Get query params and validate they're not "undefined" strings
  const applicantIdFromQuery = searchParams.get('applicantId');
  const emailFromQuery = searchParams.get('email');

  const [applicantId, setApplicantId] = useState(applicantIdFromQuery && applicantIdFromQuery !== 'undefined' ? applicantIdFromQuery : '');
  const [email, setEmail] = useState(emailFromQuery && emailFromQuery !== 'undefined' ? emailFromQuery : '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create refs for each input box
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update state when query params change
  useEffect(() => {
    if (applicantIdFromQuery && applicantIdFromQuery !== 'undefined') {
      setApplicantId(applicantIdFromQuery);
    }
    if (emailFromQuery && emailFromQuery !== 'undefined') {
      setEmail(emailFromQuery);
    }
  }, [applicantIdFromQuery, emailFromQuery]);

  // Show error if no applicantId
  useEffect(() => {
    if (!applicantId) {
      setError('Invalid verification link. Please sign up again.');
    }
  }, [applicantId]);

  const isDisabled = otp.some(digit => digit === '') || !applicantId;

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, move to previous box
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
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
      const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(newOtp);

      // Focus on the next empty box or last box
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    if (!isDisabled) {
      setLoading(true);
      const otpCode = otp.join('');

      try {
        // Use customerId as expected by backend
        const response = await verifyOtp({ customerId: applicantId, otp: parseInt(otpCode, 10) });

        if (response.success) {
          setSuccess(true);
          showSuccess('Email verified successfully!');
          // Redirect to login or dashboard after 2 seconds
          setTimeout(() => {
            router.push('/user/auth/login');
          }, 2000);
        } else {
          const errorMessage = response.error || 'Invalid OTP. Please try again.';
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

  const handleResendOtp = async () => {
    setError('');
    setOtp(['', '', '', '', '', '']);

    // Check online status
    if (!isOnline) {
      showWarning('You are offline. Please check your internet connection.');
      return;
    }

    try {
      // Debug: Log the request
      console.log('[ResendOTP] Sending request with customerId:', applicantId);

      const response = await resendOtp({ customerId: applicantId });

      // Debug: Log full response
      console.log('[ResendOTP] Full API response:', JSON.stringify(response, null, 2));

      if (response.success) {
        showSuccess('Verification code sent successfully!');
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

  if (success) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
        <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
          <div style={{width: '100%', maxWidth: '420px', padding: window.innerWidth < 640 ? '24px 20px' : '32px 36px'}}>
            {/* Success Icon */}
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: window.innerWidth < 640 ? '16px' : '16px'}}>
              <div style={{ width: window.innerWidth < 640 ? '50px' : '56px', height: window.innerWidth < 640 ? '50px' : '56px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-check-circle" style={{ fontSize: window.innerWidth < 640 ? '24px' : '26px', color: '#ffffff' }}></i>
              </div>
            </div>

            <h1 style={{ fontSize: window.innerWidth < 640 ? '20px' : '22px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: '6px', letterSpacing: '0.3px' }}>Email Verified Successfully!</h1>
            <p style={{ fontSize: window.innerWidth < 640 ? '14px' : '14px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: window.innerWidth < 640 ? '20px' : '20px', lineHeight: '1.4', opacity: '0.7' }}>
              Your email has been successfully verified. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        <div style={{width: '100%', maxWidth: '420px', padding: window.innerWidth < 640 ? '12px 18px 24px 18px' : '40px 36px', margin: '0 auto'}}>
          {/* Envelope Icon */}
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: window.innerWidth < 640 ? '12px' : '20px'}}>
            <div style={{ width: window.innerWidth < 640 ? '48px' : '60px', height: window.innerWidth < 640 ? '48px' : '60px', borderRadius: '50%', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-envelope-check" style={{ fontSize: window.innerWidth < 640 ? '22px' : '28px', color: '#ffffff' }}></i>
            </div>
          </div>

          {/* Title and Description */}
          <h1 style={{ fontSize: window.innerWidth < 640 ? '18px' : '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: window.innerWidth < 640 ? '5px' : '8px', letterSpacing: '0.3px' }}>
            Verify Your Email
          </h1>

          <p style={{ fontSize: window.innerWidth < 640 ? '12px' : '15px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: window.innerWidth < 640 ? '16px' : '24px', lineHeight: '1.4', opacity: '0.7' }}>
            We've sent a 6-digit verification code to {email}. Please enter it below.
          </p>

          {/* Error Message */}
          {error && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: window.innerWidth < 640 ? '8px' : '12px', marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              </div>
            </div>

            {/* OTP Input - Individual Boxes */}
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
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
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
              disabled={isDisabled || loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: window.innerWidth < 640 ? '15px' : '14px',
                borderRadius: window.innerWidth < 640 ? '10px' : '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
                cursor: (isDisabled || loading) ? 'not-allowed' : 'pointer',
                backgroundColor: (isDisabled || loading) ? '#d1d5db' : '#083A85',
                color: (isDisabled || loading) ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: window.innerWidth < 640 ? '10px' : '16px'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            {/* Resend Code Link */}
            <div style={{ textAlign: 'center', marginBottom: window.innerWidth < 640 ? '10px' : '16px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || !applicantId}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: window.innerWidth < 640 ? '11px' : '13px',
                  fontWeight: '600',
                  color: '#000000',
                  opacity: (loading || !applicantId) ? '0.4' : '0.7',
                  cursor: (loading || !applicantId) ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Didn't receive the code? Resend
              </button>
            </div>

            {/* Divider */}
            <div style={{borderTop: window.innerWidth < 640 ? '1.5px solid #9a9a9cff' : '2px solid #9a9a9cff', marginBottom: window.innerWidth < 640 ? '10px' : '14px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: window.innerWidth < 640 ? '11px' : '14px', fontWeight: '500', color: '#000000', marginBottom: window.innerWidth < 640 ? '4px' : '6px', opacity: '0.7' }}>
                Already verified?
              </p>
              <Link href="/user/auth/login" style={{fontSize: window.innerWidth < 640 ? '12px' : '14px', color: '#083A85', textDecoration: 'none', fontWeight: '510'}}>
                Sign in to your account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function VerifyOtpPage(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#083A85'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            <i className="bi bi-hourglass-split"></i>
          </div>
          <p style={{
            fontSize: '18px',
            fontWeight: '600'
          }}>Loading...</p>
        </div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}

export { VerifyOtpPage };
