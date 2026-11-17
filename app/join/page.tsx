'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { parseReferralCode } from '@/lib/referral/parseCode';

const DASHBOARD = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com';

/**
 * connekyt.com/join?ref=CODE. A signed-in photographer goes to their dashboard settings with the code
 * prefilled in "Add a referral code". Everyone else lands on the photographer sign-up with the code filled in.
 */
function JoinRedirect(): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const code = parseReferralCode(params.get('ref')) || '';
    const q = code ? `&ref=${encodeURIComponent(code)}` : '';
    if (user?.customerType && user.customerType.toLowerCase() === 'photographer') {
      window.location.replace(`${DASHBOARD}/user/photographer/settings?addReferral=1${q}`);
      return;
    }
    router.replace(`/user/auth/signup?userType=Photographer${q}`);
  }, [isLoading, user, params, router]);

  return <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#475569' }} aria-busy="true">…</main>;
}

export default function JoinPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <JoinRedirect />
    </Suspense>
  );
}
