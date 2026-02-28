'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { useToast } from '@/lib/notifications/ToastProvider';

/**
 * Expire a cookie by name across common paths
 */
function expireCookie(name: string) {
  const paths = ['/', '/user', '/user/auth'];
  paths.forEach(path => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  });
}

export default function LogoutPage() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const { showBanner } = useToast();

  useEffect(() => {
    // Clear auth context + localStorage (authToken, refreshToken, authUser)
    if (isAuthenticated) {
      logout();
    }

    // Also expire dashboard-set cookies
    expireCookie('authToken');
    expireCookie('refreshToken');
    expireCookie('userRole');

    // Show red logout banner
    showBanner('You have been logged out successfully.', '#DC2626');

    // Redirect to the page the user was on before login, or fallback to home
    const savedRedirect = localStorage.getItem('authRedirectUrl');
    localStorage.removeItem('authRedirectUrl');
    router.replace(savedRedirect || '/');
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: '#666',
      fontSize: '0.95rem',
    }}>
      Logging out…
    </div>
  );
}
