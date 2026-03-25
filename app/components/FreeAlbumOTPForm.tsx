'use client';

import React, { useState, useRef, useEffect } from 'react';

interface FreeAlbumOTPFormProps {
  email: string;
  accessCode: string;
  onSubmit: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
  otpExpiry?: string;
}

const FreeAlbumOTPForm: React.FC<FreeAlbumOTPFormProps> = ({
  email,
  accessCode,
  onSubmit,
  onResend,
  isLoading = false,
  error,
  otpExpiry,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Calculate time remaining until OTP expiry
  useEffect(() => {
    if (!otpExpiry) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(otpExpiry).getTime();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiry]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only the last digit
    setOtp(newOtp);
    setLocalError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);
    setLocalError('');

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if all 6 digits are filled
    if (pastedData.length === 6) {
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    setLocalError('');

    if (code.length !== 6) {
      setLocalError('Please enter the complete 6-digit code');
      return;
    }

    try {
      await onSubmit(code);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Invalid verification code');
    }
  };

  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    setLocalError('');
    try {
      await onResend();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to resend code');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Enter Verification Code
          </h2>
          <p className="text-gray-600">
            We sent a 6-digit code to
          </p>
          <p className="text-blue-600 font-medium mt-1">{email}</p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Timer */}
          {timeRemaining > 0 ? (
            <p className="text-center text-sm text-gray-600">
              Code expires in <span className="font-semibold text-red-600">{formatTime(timeRemaining)}</span>
            </p>
          ) : (
            <p className="text-center text-sm text-red-600 font-medium">
              Code has expired
            </p>
          )}
        </div>

        {/* Error Message */}
        {(error || localError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error || localError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || otp.some((d) => !d)}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition mb-4 ${
            isLoading || otp.some((d) => !d)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify & Access Album'
          )}
        </button>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={isLoading || timeRemaining > 240} // Can resend after 1 minute
            className={`text-sm font-medium ${
              isLoading || timeRemaining > 240
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            Resend Code
          </button>
        </div>

        {/* Access Code Reminder */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 text-center">
            Access Code: <span className="font-semibold">{accessCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FreeAlbumOTPForm;
