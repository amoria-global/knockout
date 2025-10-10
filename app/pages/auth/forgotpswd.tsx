'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'verification'>('email'); // Track current step

  // Create refs for each input box
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmailDisabled = !email;
  const isCodeDisabled = verificationCode.some(digit => digit === '');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmailDisabled) {
      // Move to verification code step
      setStep('verification');
      console.log('Verification code would be sent to:', email);
      // Focus on first input box after switching to verification step
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isCodeDisabled) {
      const code = verificationCode.join('');
      // Navigate to reset password page with email and code
      router.push(`/all/resetpswd?email=${encodeURIComponent(email)}&code=${code}`);
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

  const handleResendCode = () => {
    setVerificationCode(['', '', '', '', '', '']);
    console.log('Resend verification code to:', email);
    alert('Verification code resent successfully!');
    // Focus on first input box
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-4 py-4 sm:p-4">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
        <div style={{width: '100%',maxWidth: '420px',padding: '40px 36px'}}>
        {/* Key Icon */}
        <div style={{display: 'flex',justifyContent: 'center',marginBottom: '20px'}}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`bi ${step === 'email' ? 'bi-key' : 'bi-envelope'}`} style={{ fontSize: '28px', color: '#ffffff' }}></i>
          </div>
        </div>

        {/* Title and Description */}
        <h1 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: '8px', letterSpacing: '0.3px' }}>
          {step === 'email' ? 'Forgot Password?' : 'Verify Your Email'}
        </h1>

        <p style={{ fontSize: '13px', fontWeight: '400', color: '#000000', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4', opacity: '0.7' }}>
          {step === 'email'
            ? ' Enter your email address and we\'ll send you a verification code to reset your password.'
            : `We've sent a 6-digit verification code to ${email}. Please enter it below.`
          }
        </p>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            {/* Email Input */}
            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  fontWeight: '400',
                  border: '1.5px solid #d1d5db',
                  borderRadius: '12px',
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
              disabled={isEmailDisabled}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                borderRadius: '12px',
                fontWeight: '500',
                transition: 'all 0.3s',
                cursor: isEmailDisabled ? 'not-allowed' : 'pointer',
                backgroundColor: isEmailDisabled ? '#d1d5db' : '#083A85',
                color: isEmailDisabled ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: '16px'
              }}
            >
              Send Verification Code
            </button>

            {/* Back to Sign In Link */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <Link href="/all/login" style={{ fontSize: '13px', fontWeight: '400', color: '#000000', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: '0.7' }}>
                <span>←</span> Back to Sign In
              </Link>
            </div>

            {/* Divider */}
            <div style={{borderTop: '2px solid #9a9a9cff',marginBottom: '16px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: '400', color: '#000000', marginBottom: '6px', opacity: '0.7' }}>
                Remember your password?
              </p>
              <Link href="/all/login" style={{fontSize: '13px',color: '#083A85',textDecoration: 'none',fontWeight: '500'}}>
                Try signing in again
              </Link>
            </div>
          </form>
        )}

        {/* Verification Code Step */}
        {step === 'verification' && (
          <form onSubmit={handleVerificationSubmit}>
            {/* Show email (read-only) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>Email Address</label>
              <div style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '400',
                border: '1.5px solid #d1d5db',
                borderRadius: '12px',
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
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Change
                </button>
              </div>
            </div>

            {/* Verification Code Input - Individual Boxes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                Verification Code
              </label>
              <div style={{
                display: 'flex',
                gap: '6px',
                justifyContent: 'center',
                marginTop: '10px'
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
                      width: '45px',
                      height: '45px',
                      fontSize: '18px',
                      fontWeight: '500',
                      textAlign: 'center',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '10px',
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
                fontSize: '14px',
                borderRadius: '12px',
                fontWeight: '500',
                transition: 'all 0.3s',
                cursor: isCodeDisabled ? 'not-allowed' : 'pointer',
                backgroundColor: isCodeDisabled ? '#d1d5db' : '#083A85',
                color: isCodeDisabled ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: '16px'
              }}
            >
              Verify Code
            </button>

            {/* Resend Code Link */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleResendCode}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '400',
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
            <div style={{borderTop: '2px solid #9a9a9cff',marginBottom: '14px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', fontWeight: '400', color: '#000000', marginBottom: '6px', opacity: '0.7' }}>
                Remember your password?
              </p>
              <Link href="/all/login" style={{fontSize: '12px',color: '#083A85',textDecoration: 'none',fontWeight: '500'}}>
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
