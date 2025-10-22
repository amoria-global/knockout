'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ResetPasswordContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';
  const codeFromQuery = searchParams.get('code') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isDisabled = !newPassword || !confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isDisabled) {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Validate password strength (at least 8 characters)
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      // Log the password reset data (for frontend only)
      console.log('Password reset data:', {
        email: emailFromQuery,
        verificationCode: codeFromQuery,
        newPassword: newPassword,
      });

      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/user/auth/login');
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-4 py-4 sm:p-4">
        <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center">
          <div style={{width: '100%',maxWidth: '420px',padding: '40px 36px'}}>
            {/* Success Icon */}
            <div style={{display: 'flex',justifyContent: 'center',marginBottom: '20px'}}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-check-circle" style={{ fontSize: '28px', color: '#ffffff' }}></i>
              </div>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: '8px', letterSpacing: '0.3px' }}>Password Reset Successful!</h1>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4', opacity: '0.7' }}>
              Your password has been successfully reset. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center px-4 py-4 sm:p-4">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        <div style={{width: '100%',maxWidth: '420px',padding: '40px 36px', margin: '0 auto'}}>
          {/* Lock and Key Icon */}
          <div style={{display: 'flex',justifyContent: 'center',marginBottom: '20px'}}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <i className="bi bi-lock" style={{ fontSize: '24px', color: '#ffffff', position: 'absolute', left: '12px' }}></i>
              <i className="bi bi-key" style={{ fontSize: '24px', color: '#ffffff', position: 'absolute', right: '12px' }}></i>
            </div>
          </div>

          {/* Title and Description */}
          <h1 style={{ fontSize: '24px', fontWeight: '600', textAlign: 'center', color: '#000000', marginBottom: '8px', letterSpacing: '0.3px' }}>Create New Password</h1>

          <p style={{ fontSize: '15px', fontWeight: '500', color: '#000000', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4', opacity: '0.7' }}>
            Your identity has been verified. Please create a new secure password for your account.
          </p>

          {/* Error Message */}
          {error && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit}>
            {/* New Password Input */}
            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="newPassword" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    fontSize: '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    fontSize: '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div style={{ marginBottom: '18px', padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Password must contain: <span style={{ fontWeight: '500' }}>At least 8 characters</span>
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isDisabled}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                borderRadius: '12px',
                fontWeight: '500',
                transition: 'all 0.3s',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundColor: isDisabled ? '#d1d5db' : '#083A85',
                color: isDisabled ? '#9ca3af' : '#ffffff',
                border: 'none',
                marginBottom: '16px'
              }}
            >
              Reset Password
            </button>

            {/* Back to Sign In Link */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <Link href="/user/auth/login" style={{ fontSize: '14px', fontWeight: '500', color: '#000000', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: '0.7' }}>
                <span>←</span> Back to Sign In
              </Link>
            </div>

            {/* Divider */}
            <div style={{borderTop: '2px solid #9a9a9cff',marginBottom: '16px'}}></div>

            {/* Bottom Links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px', opacity: '0.7' }}>Need help?</p>
              <Link href="/user/help-center" style={{fontSize: '14px',color: '#083A85',textDecoration: 'none', fontWeight: '510'}}>Contact Support</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ResetPasswordPage(): React.JSX.Element {
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
      <ResetPasswordContent />
    </Suspense>
  );
}

export { ResetPasswordPage };
