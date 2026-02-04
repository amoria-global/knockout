'use client';

import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import React from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  if (!GOOGLE_CLIENT_ID) {
    // If no client ID, just render children without Google OAuth
    console.warn('Google OAuth Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
    return <>{children}</>;
  }

  return (
    <GoogleProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleProvider>
  );
}
