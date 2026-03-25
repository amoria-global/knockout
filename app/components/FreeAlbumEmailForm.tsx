'use client';

import React, { useState } from 'react';

interface FreeAlbumEmailFormProps {
  accessCode: string;
  onSubmit: (email: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

const FreeAlbumEmailForm: React.FC<FreeAlbumEmailFormProps> = ({
  accessCode,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      await onSubmit(email.trim().toLowerCase());
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send verification code');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Your Photo Album
          </h2>
          <p className="text-gray-600">
            Enter your email address to receive a verification code
          </p>
        </div>

        {/* Access Code Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 font-medium mb-1">Access Code:</p>
          <p className="text-2xl font-bold text-blue-900 tracking-wider text-center">
            {accessCode}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={isLoading}
              required
            />
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error || localError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
              isLoading
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
                Sending code...
              </span>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            ✓ All photos are <span className="font-semibold">FREE</span> to download
            <br />
            ✓ No payment required
          </p>
        </div>
      </div>
    </div>
  );
};

export default FreeAlbumEmailForm;
