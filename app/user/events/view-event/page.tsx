'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Mobile-responsive styles - AGGRESSIVE MOBILE OPTIMIZATION
const responsiveStyles = `
  /* iPhone specific fixes */
  @supports (padding: max(0px)) {
    .ve-cta-bar {
      padding-left: max(0px, env(safe-area-inset-left)) !important;
      padding-right: max(0px, env(safe-area-inset-right)) !important;
    }
  }

  @media (max-width: 768px) {
    .ve-cta-bar {
      max-width: 100% !important;
      padding: 0 8px !important;
      gap: 4px !important;
      -webkit-text-size-adjust: 100% !important;
    }

    .live-stream-button {
      font-size: 12px !important;
      padding: 8px 10px !important;
      min-height: 36px !important;
      gap: 4px !important;
      -webkit-font-smoothing: antialiased !important;
    }

    .ve-cta-bar button {
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .ve-cta-bar input {
      font-size: 12px !important;
      min-height: 36px !important;
      -webkit-font-smoothing: antialiased !important;
    }

    .ve-cta-grid {
      gap: 4px !important;
      row-gap: 4px !important;
    }
  }

  @media (max-width: 600px) {
    .ve-cta-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 480px) {
    .ve-cta-bar {
      max-width: 100% !important;
      gap: 3px !important;
      padding: 0 6px !important;
      -webkit-text-size-adjust: 100% !important;
    }

    .live-stream-button {
      font-size: 10px !important;
      padding: 5px 7px !important;
      min-height: 32px !important;
      gap: 3px !important;
      -webkit-font-smoothing: antialiased !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .live-stream-button i {
      font-size: 11px !important;
      flex-shrink: 0 !important;
    }

    .ve-cta-bar button {
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
    }

    .ve-cta-bar input {
      font-size: 10px !important;
      min-height: 32px !important;
      padding: 5px 7px 5px 26px !important;
      -webkit-font-smoothing: antialiased !important;
    }

    .ve-cta-grid {
      grid-template-columns: 1fr !important;
      gap: 3px !important;
      row-gap: 3px !important;
    }
  }

  @media (max-width: 420px) {
    .ve-cta-bar {
      padding: 0 5px !important;
      gap: 2px !important;
    }

    .live-stream-button {
      font-size: 9px !important;
      padding: 4px 6px !important;
      min-height: 30px !important;
      gap: 2px !important;
    }

    .live-stream-button i {
      font-size: 10px !important;
    }

    .ve-cta-bar input {
      font-size: 9px !important;
      min-height: 30px !important;
      padding: 4px 6px 4px 24px !important;
    }

    .ve-cta-grid {
      gap: 2px !important;
      row-gap: 2px !important;
    }
  }

  @media (max-width: 380px) {
    .ve-cta-bar {
      padding: 0 4px !important;
      gap: 2px !important;
    }

    .live-stream-button {
      font-size: 8px !important;
      padding: 3px 5px !important;
      min-height: 28px !important;
      gap: 2px !important;
      letter-spacing: -0.5px !important;
    }

    .live-stream-button i {
      font-size: 9px !important;
    }

    .ve-cta-bar input {
      font-size: 8px !important;
      min-height: 28px !important;
      padding: 3px 5px 3px 22px !important;
    }

    .ve-cta-grid {
      gap: 1px !important;
      row-gap: 1px !important;
    }
  }
`;
import AmoriaKNavbar from '../../../components/navbar';
import { useTranslations } from 'next-intl';
import { useGoogleLogin } from '@react-oauth/google';
import { getPublicEventById, type PublicEvent } from '@/lib/APIs/public';
import { isAuthenticated } from '@/lib/api/client';
import { registerAnonymousViewer } from '@/lib/APIs/streams/anonymous-viewer';
import { getDeviceId } from '@/lib/fingerprint';
import { login } from '@/lib/APIs/auth/login/route';
import { signup } from '@/lib/APIs/auth/signup/route';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { googleAuth } from '@/lib/APIs/auth/google/route';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/** Isolated component so useGoogleLogin only runs inside GoogleOAuthProvider context.
 *  Loading state is driven entirely by the parent via `loading` prop so the parent's
 *  finally block can always re-enable the button after success or failure. */
function GoogleAuthButton({ onSuccess, onError, loading, label }: {
  onSuccess: (tokenResponse: { access_token: string }) => void;
  onError: () => void;
  loading: boolean;
  label: string;
}) {
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => { onSuccess(tokenResponse); },
    onError: () => { onError(); },
  });

  return (
    <button
      type="button"
      onClick={() => { if (!loading) googleLogin(); }}
      disabled={loading}
      style={{ width: '100%', padding: '11px', background: '#fff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 10, color: '#374151', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1 }}
    >
      {loading ? (
        <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#374151', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} />
      ) : (
        <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
      )}
      {loading ? 'Connecting…' : label}
    </button>
  );
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80';

/**
 * Format eventDate string to readable format
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  try {
    // Parse as local date to avoid timezone shift (e.g. "2026-03-13" → "March 13, 2026")
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format time strings (startTime/endTime) to readable range
 */
function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return 'TBD';
  const format = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };
  const start = format(startTime);
  return endTime ? `${start} - ${format(endTime)}` : start;
}

/**
 * Combine eventDate ("YYYY-MM-DD") + startTime ("HH:MM") into a local Date,
 * or return null if inputs are missing/invalid.
 */
function getEventStartDate(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/**
 * Format a ms-duration as "HHh MMm SSs" padded.
 */
function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

/**
 * Format price for display
 */
function formatPrice(price?: number): string {
  if (!price || price <= 0) return 'Free';
  return `${price.toLocaleString()} RWF`;
}

/**
 * Get category display name
 */
function getCategoryName(event: PublicEvent): string {
  return event.eventCategory?.name || event.eventTags?.split(',')[0]?.trim() || 'Event';
}

/**
 * Get tags array from comma-separated eventTags string
 */
function getTagsArray(event: PublicEvent): string[] {
  if (!event.eventTags) return [];
  return event.eventTags.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * Get photographer display name
 */
function getPhotographerName(event: PublicEvent): string | null {
  if (!event.photographer) return null;
  const { firstName, lastName } = event.photographer;
  return [firstName, lastName].filter(Boolean).join(' ') || null;
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ViewEventContent(): React.JSX.Element {
  const t = useTranslations('events.viewEvent');
  const tStatus = useTranslations('events.status');
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id') || searchParams.get('eventId');

  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msUntilStart, setMsUntilStart] = useState<number | null>(null);

  // Tick every second to drive the 6h-window countdown badge
  useEffect(() => {
    const start = getEventStartDate(selectedEvent?.eventDate, selectedEvent?.startTime);
    if (!start) { setMsUntilStart(null); return; }
    const tick = () => setMsUntilStart(start.getTime() - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [selectedEvent?.eventDate, selectedEvent?.startTime]);

  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const showCountdown = msUntilStart !== null && msUntilStart > 0 && msUntilStart <= SIX_HOURS_MS;

  // Viewer auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'otp'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // Signup fields
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  // OTP step
  const [otpCustomerId, setOtpCustomerId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  // Pending destination after auth
  const [pendingJoinUrl, setPendingJoinUrl] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  // Group invite code — auto-fill from URL param (from email link)
  const [groupCode, setGroupCode] = useState(searchParams.get('groupCode') || '');
  const [groupCodeError, setGroupCodeError] = useState('');
  const [groupCodeLoading, setGroupCodeLoading] = useState(false);
  const [pendingGroupCode, setPendingGroupCode] = useState('');

  // "Already paid?" viewer re-auth modal
  const [showViewerAuth, setShowViewerAuth] = useState(false);
  const [vaName, setVaName] = useState('');
  const [vaEmail, setVaEmail] = useState('');
  const [vaPhone, setVaPhone] = useState('');
  const [vaLoading, setVaLoading] = useState(false);
  const [vaError, setVaError] = useState<string | null>(null);

  const handleViewerAuth = async () => {
    const name = vaName.trim();
    const email = vaEmail.trim();
    const phone = vaPhone.trim();
    if (!name) { setVaError('Please enter your name.'); return; }
    if (!email && !phone) { setVaError('Please enter the email or phone you used to purchase.'); return; }
    setVaLoading(true);
    setVaError(null);
    try {
      const fp = await getDeviceId();
      const res = await registerAnonymousViewer(selectedEvent!.id, {
        name,
        email: email || `placeholder-${Date.now()}@noemail.local`,
        phone: phone || '0000000000',
        deviceFingerprint: fp,
      });
      if (!res.success) {
        setVaError(res.error || 'Could not verify. Please try again.');
        return;
      }
      const resData = res.data as Record<string, unknown> | undefined;
      const status = resData?.status as string;
      const viewerId = resData?.viewerId as string;

      if (status === 'ACCESS_GRANTED' || status === 'DEVICE_CONFLICT' || status === 'DEVICE_MISMATCH') {
        // Viewer recognized — store viewerId and go to live-stream
        if (viewerId) {
          localStorage.setItem(`anonymousViewer_${selectedEvent!.id}`, viewerId);
          localStorage.setItem(`anonymousViewerName_${selectedEvent!.id}`, name);
        }
        window.location.href = `/user/events/live-stream?eventId=${selectedEvent!.id}&paid=true${viewerId ? `&viewerId=${viewerId}` : ''}`;
      } else {
        // REQUIRES_PAYMENT — not found as a paid viewer
        setVaError('No payment found for this email or phone. Please double-check the details you used when purchasing, or purchase the new access.');
      }
    } catch {
      setVaError('Connection error. Please try again.');
    } finally {
      setVaLoading(false);
    }
  };

  // Listen for session expiry — show login modal instead of redirecting
  useEffect(() => {
    const handleSessionExpired = (e: Event) => {
      e.preventDefault();
      setAuthStep('login');
      setAuthError('Your session has expired. Please log in again.');
      setShowAuthModal(true);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoading(true); // set before async work; finally always resets it
    setAuthError('');
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      if (!userInfoRes.ok) throw new Error('Failed to fetch Google user info');
      const userInfo = await userInfoRes.json();
      const res = await googleAuth({
        email: userInfo.email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        customerType: 'Viewer',
      });
      if (res.success && res.data?.token) {
        const gd = res.data;
        localStorage.setItem('authUser', JSON.stringify({
          id: gd.customerId || '',
          firstName: gd.firstName || userInfo.given_name || '',
          lastName: gd.lastName || userInfo.family_name || '',
          email: gd.email || userInfo.email,
          customerType: gd.customerType || 'Viewer',
          profilePicture: (gd as unknown as Record<string, unknown>).profilePicture as string || userInfo.picture || '',
        }));
        setShowAuthModal(false);
        // If there's a pending group code, redeem it after Google auth
        if (pendingGroupCode && selectedEvent?.id) {
          try {
            const redeemRes = await fetch(`/api/proxy/api/remote/public/streams/${selectedEvent.id}/redeem-group-code`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gd.token}` },
              body: JSON.stringify({ inviteCode: pendingGroupCode, viewerUsername: gd.email || userInfo.email }),
            });
            const redeemData = await redeemRes.json();
            if (redeemData.action === 1 || redeemData.message?.toLowerCase().includes('access granted')) {
              setPendingGroupCode('');
              window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&paid=true&inviteToken=${encodeURIComponent(pendingGroupCode)}`;
              return;
            } else {
              setGroupCodeError(redeemData.message || 'Failed to redeem group code.');
            }
          } catch { setGroupCodeError('Failed to redeem group code.'); }
          setPendingGroupCode('');
          return;
        }
        if (selectedEvent?.id) {
          const eventCheck = await getPublicEventById(selectedEvent.id);
          if (eventCheck.success && eventCheck.data?.hasPurchasedAccess) {
            window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&paid=true`;
            return;
          }
        }
        window.location.href = pendingJoinUrl;
      } else {
        setAuthError(res.data?.message || res.error || 'Could not sign in with Google. Please try another method.');
      }
    } catch {
      setAuthError('Unable to connect to Google. Please check your internet connection.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    setAuthError('Google sign-in was cancelled. You can try again or use email instead.');
  };

  // Fetch event from API
  useEffect(() => {
    if (!eventId) {
      setLoadError('No event ID provided');
      setIsLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const response = await getPublicEventById(eventId);
        if (response.success && response.data) {
          setSelectedEvent(response.data);
        } else {
          setLoadError(response.error || 'This event could not be found. It may have been removed.');
        }
      } catch {
        setLoadError('Unable to load event details. Please check your internet connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  // Auto-trigger group code flow when arriving from email link (?groupCode=XXX)
  const groupCodeFromUrl = searchParams.get('groupCode');
  const [autoGroupCodeTriggered, setAutoGroupCodeTriggered] = useState(false);
  useEffect(() => {
    if (groupCodeFromUrl && selectedEvent && !isLoading && !autoGroupCodeTriggered) {
      setAutoGroupCodeTriggered(true);
      // Small delay to ensure UI is rendered
      setTimeout(() => handleGroupCodeSubmit(), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupCodeFromUrl, selectedEvent, isLoading, autoGroupCodeTriggered]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <AmoriaKNavbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#052047' }}>
          <div style={{ textAlign: 'center', color: '#083A85' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <i className="bi bi-hourglass-split"></i>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#efeff1' }}>{t('loadingEventDetails')}</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (loadError || !selectedEvent) {
    return (
      <>
        <AmoriaKNavbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#052047' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <i className="bi bi-exclamation-circle"></i>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>{loadError || 'Event not found'}</p>
            <button
              onClick={() => window.history.back()}
              style={{
                marginTop: '16px',
                padding: '12px 32px',
                backgroundColor: '#083A85',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Handle group code submission
  const handleGroupCodeSubmit = async () => {
    if (!groupCode.trim()) { setGroupCodeError('Please enter a group invite code'); return; }
    setGroupCodeError('');
    setGroupCodeLoading(true);
    try {
      // Validate code first (no slot consumed, no auth required)
      // Pass email if authenticated to check email restrictions
      const user = isAuthenticated() ? JSON.parse(localStorage.getItem('authUser') || '{}') : {};
      const validateBody: Record<string, string> = { inviteCode: groupCode.trim() };
      if (user.email) validateBody.email = user.email;
      const validateRes = await fetch(`/api/proxy/api/remote/public/streams/${selectedEvent?.id}/validate-group-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validateBody),
      });
      const validateData = await validateRes.json();
      if (validateData.action !== 1) {
        const msg = validateData.message || '';
        if (msg.includes('not shared with')) setGroupCodeError('This code was not shared with your email address.');
        else if (msg.includes('viewer limit')) setGroupCodeError(msg);
        else if (msg.includes('expired')) setGroupCodeError('This group code has expired.');
        else if (msg.includes('Invalid')) setGroupCodeError('Invalid group invite code.');
        else setGroupCodeError(msg || 'Invalid code.');
        setGroupCodeLoading(false);
        return;
      }
      // Code is valid — now redeem or prompt login
      const isEmailRestricted = validateData.data?.emailRestricted === true;
      if (isAuthenticated()) {
        const user = JSON.parse(localStorage.getItem('authUser') || '{}');
        const res = await fetch(`/api/proxy/api/remote/public/streams/${selectedEvent?.id}/redeem-group-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {}) },
          body: JSON.stringify({ inviteCode: groupCode.trim(), viewerUsername: user.email || '' }),
        });
        const data = await res.json();
        if (data.action === 1 || data.message?.toLowerCase().includes('access granted')) {
          window.location.href = `/user/events/live-stream?eventId=${selectedEvent?.id}&paid=true&inviteToken=${encodeURIComponent(groupCode.trim())}`;
        } else {
          setGroupCodeError(data.message || 'Failed to redeem code.');
        }
      } else {
        // Valid code, not logged in — save code, show appropriate auth form
        setPendingGroupCode(groupCode.trim());
        const authorizedEmail = validateData.data?.authorizedEmail || '';
        const accountExists = validateData.data?.accountExists;
        if (authorizedEmail) {
          // Pre-fill the email from the invited address
          if (accountExists === false) {
            // No account — show signup with email pre-filled
            setSignupEmail(authorizedEmail);
            setAuthStep('signup');
          } else {
            // Has account or unknown — show login with email pre-filled
            setLoginEmail(authorizedEmail);
            setAuthStep('login');
          }
        } else {
          setAuthStep('login');
        }
        setAuthError(isEmailRestricted ? 'This code is restricted to invited emails only. Please sign in with the email this code was sent to.' : '');
        setShowAuthModal(true);
      }
    } catch { setGroupCodeError('Connection error. Please try again.'); }
    finally { setGroupCodeLoading(false); }
  };

  // Navigate to purchase page — no auth required (anonymous viewer flow handles it)
  const handlePurchaseAccess = (joinUrl: string) => {
    window.location.href = joinUrl;
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) { setAuthError('Please enter your email and password.'); return; }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      if (res.success && res.data?.token) {
        // Store user data so AuthProvider can restore the session
        const d = res.data;
        localStorage.setItem('authUser', JSON.stringify({
          id: d.customerId || '',
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || loginEmail,
          customerType: d.customerType || 'Viewer',
          profilePicture: (d as unknown as Record<string, unknown>).profilePicture as string || '',
        }));
        setShowAuthModal(false);
        // If there's a pending group code, redeem it after login
        if (pendingGroupCode && selectedEvent?.id) {
          try {
            const redeemRes = await fetch(`/api/proxy/api/remote/public/streams/${selectedEvent.id}/redeem-group-code`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d.token}` },
              body: JSON.stringify({ inviteCode: pendingGroupCode, viewerUsername: d.email || loginEmail }),
            });
            const redeemData = await redeemRes.json();
            if (redeemData.action === 1 || redeemData.message?.toLowerCase().includes('access granted')) {
              setPendingGroupCode('');
              window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&paid=true&inviteToken=${encodeURIComponent(pendingGroupCode)}`;
              return;
            } else {
              setGroupCodeError(redeemData.message || 'Failed to redeem group code.');
            }
          } catch { setGroupCodeError('Failed to redeem group code.'); }
          setPendingGroupCode('');
          return;
        }
        // Check if viewer already paid — redirect to stream instead of join-package
        if (selectedEvent?.id) {
          const eventCheck = await getPublicEventById(selectedEvent.id);
          if (eventCheck.success && eventCheck.data?.hasPurchasedAccess) {
            window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&paid=true`;
            return;
          }
        }
        window.location.href = pendingJoinUrl;
      } else {
        setAuthError(res.data?.message || res.error || 'Incorrect email or password. Please try again.');
      }
    } catch {
      setAuthError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupFirstName || !signupLastName || !signupEmail || !signupPhone || !signupPassword) {
      setAuthError('Please fill in all required fields.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await signup({
        firstName: signupFirstName,
        lastName: signupLastName,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword,
        customerType: 'Viewer',
      });
      if (res.success && res.data) {
        const customerId = res.data.customerId || res.data.customer_id || res.data.applicantId || res.data.applicant_id || '';
        setOtpCustomerId(customerId);
        setAuthStep('otp');
        setAuthError('');
      } else {
        setAuthError(res.data?.message || res.error || 'Could not create your account. The email may already be registered.');
      }
    } catch {
      setAuthError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) { setAuthError('Please enter the 4-digit verification code sent to your email.'); return; }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await verifyOtp({ customerId: otpCustomerId, otp: parseInt(otpValue, 10) });
      if (res.success && res.data?.action === 1) {
        // OTP verify only confirms email — token comes from login. Auto-login with signup credentials.
        const loginRes = await login({ email: signupEmail, password: signupPassword });
        if (loginRes.success && loginRes.data?.token) {
          const ld = loginRes.data;
          localStorage.setItem('authUser', JSON.stringify({
            id: ld.customerId || '',
            firstName: ld.firstName || signupFirstName || '',
            lastName: ld.lastName || signupLastName || '',
            email: ld.email || signupEmail,
            customerType: ld.customerType || 'Viewer',
            profilePicture: (ld as unknown as Record<string, unknown>).profilePicture as string || '',
          }));
          setShowAuthModal(false);
          // If there's a pending group code, redeem it after OTP verify
          if (pendingGroupCode && selectedEvent?.id) {
            try {
              const redeemRes = await fetch(`/api/proxy/api/remote/public/streams/${selectedEvent.id}/redeem-group-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ld.token}` },
                body: JSON.stringify({ inviteCode: pendingGroupCode, viewerUsername: ld.email || signupEmail }),
              });
              const redeemData = await redeemRes.json();
              if (redeemData.action === 1 || redeemData.message?.toLowerCase().includes('access granted')) {
                setPendingGroupCode('');
                window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&paid=true&inviteToken=${encodeURIComponent(pendingGroupCode)}`;
                return;
              } else {
                setGroupCodeError(redeemData.message || 'Failed to redeem group code.');
              }
            } catch { setGroupCodeError('Failed to redeem group code.'); }
            setPendingGroupCode('');
            return;
          }
          if (selectedEvent?.id) {
            const eventCheck = await getPublicEventById(selectedEvent.id);
            if (eventCheck.success && eventCheck.data?.hasPurchasedAccess) {
              window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&paid=true`;
              return;
            }
          }
          window.location.href = pendingJoinUrl;
        } else {
          setAuthError(loginRes.data?.message || loginRes.error || 'Email verified successfully! Please switch to the Log In tab to sign in.');
        }
      } else {
        setAuthError(res.data?.message || res.error || 'The verification code is incorrect or has expired. Please check your email and try again.');
      }
    } catch {
      setAuthError('Unable to verify. Please check your internet connection and try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const eventImage = selectedEvent.eventPhoto || PLACEHOLDER_IMAGE;
  const rawStatus = (selectedEvent.eventStatus || '').toUpperCase();
  const streamEnded = (selectedEvent as Record<string, unknown>).streamStatus === 'ended';
  const isLive = rawStatus === 'ONGOING' && !streamEnded;
  const isCompleted = rawStatus === 'COMPLETED' || streamEnded;
  const isCancelled = rawStatus === 'CANCELLED';
  const isUpcoming = !isLive && !isCompleted && !isCancelled; // PUBLISHED or UPCOMING
  const streamFee = selectedEvent.streamFee || 0;
  const isPaid = streamFee > 0 || (selectedEvent.price || 0) > 0;
  const hasPurchasedAccess = !!selectedEvent.hasPurchasedAccess;
  const tags = getTagsArray(selectedEvent);
  const photographerName = getPhotographerName(selectedEvent);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
      <AmoriaKNavbar />
      {/* ── FULL-VIEWPORT CINEMA SHELL ── */}
      <div className="ve-cinema" style={{ position: 'relative', height: 'calc(100dvh - 64px)', overflow: 'hidden', backgroundColor: '#052047' }}>

        {/* Background image — fills right */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${eventImage})`, backgroundSize: 'cover', backgroundPosition: 'center right' }} />

        {/* Left-to-right cinematic gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(5,32,71,0.88) 25%, rgba(5,32,71,0.7) 45%, rgba(5,32,71,0.35) 65%, rgba(5,32,71,0.05) 100%)' }} />
        {/* Top/bottom vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,32,71,0.4) 0%, transparent 18%, transparent 75%, rgba(5,32,71,0.5) 100%)' }} />

        {/* ── Status badge — top-right ── */}
        {isLive ? (
          <div className="live-badge" style={{ position: 'absolute', top: 24, right: 28, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: 'rgba(22,163,74,0.95)', backdropFilter: 'blur(10px)', border: '2px solid #22c55e', borderRadius: 25, color: '#fff', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(22,163,74,0.4)' }}>
            <i className="bi bi-camera-video-fill live-badge-icon" style={{ fontSize: 16 }}></i>
            {tStatus('live')}
          </div>
        ) : isCompleted ? (
          <div style={{ position: 'absolute', top: 24, right: 28, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: 'rgba(55,65,81,0.95)', backdropFilter: 'blur(10px)', border: '2px solid #6b7280', borderRadius: 25, color: '#fff', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(107,114,128,0.4)' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 16 }}></i>
            {tStatus('completed')}
          </div>
        ) : isCancelled ? (
          <div style={{ position: 'absolute', top: 24, right: 28, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: 'rgba(8,58,133,0.95)', backdropFilter: 'blur(10px)', border: '2px solid #0a4da3', borderRadius: 25, color: '#fff', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(8,58,133,0.4)' }}>
            <i className="bi bi-x-circle-fill" style={{ fontSize: 16 }}></i>
            {tStatus('cancelled')}
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 24, right: 28, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: 'rgba(8,58,133,0.95)', backdropFilter: 'blur(10px)', border: '2px solid #103E83', borderRadius: 25, color: '#fff', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(8,58,133,0.4)' }}>
            <i className="bi bi-broadcast" style={{ fontSize: 16 }}></i>
            {tStatus('upcoming')}
          </div>
        )}

        {/* ── Price badge — bottom-right ── */}
        {isPaid && (
          <div className="ve-price-box" style={{ position: 'absolute', bottom: 28, right: 28, zIndex: 30, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 24px', textAlign: 'center', backdropFilter: 'blur(10px)', pointerEvents: 'none' }}>
            {isCompleted ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <i className="bi bi-x-lg" style={{ fontSize: 48, color: 'rgba(255,255,255,0.25)', fontWeight: 900 }}></i>
              </div>
            ) : hasPurchasedAccess ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <i className="bi bi-check-circle-fill" style={{ fontSize: 36, color: 'rgba(255,255,255,0.4)' }}></i>
              </div>
            ) : null}
            <div style={{ fontSize: 26, fontWeight: 800, color: isCompleted ? 'rgba(255,255,255,0.4)' : '#fff', lineHeight: 1 }}>{(selectedEvent.price || 0).toLocaleString()} RWF</div>
            <div style={{ fontSize: 12, color: isCompleted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isCompleted ? 'Event ended' : hasPurchasedAccess ? 'Spot reserved' : 'Stream Access Fee'}</div>
          </div>
        )}

        {/* ── LEFT CONTENT PANEL ── */}
        <div className="ve-left-panel" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '68%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(60px, 7vh, 70px) clamp(20px, 4vw, 48px) clamp(16px, 2vh, 24px)', zIndex: 10 }}>

          {/* Back button — in flow, not overlapping */}
          <div style={{ marginBottom: 6 }}>
            <button
              onClick={() => window.history.back()}
              aria-label="Go back"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, padding: 0, backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 20, color: '#fff', fontSize: 16, cursor: 'pointer', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </div>

          {/* Category + meta top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {getCategoryName(selectedEvent)}
            </span>
            <span style={{ color: '#4b5563', fontSize: 16 }}>•</span>
            <span style={{ color: '#9ca3af', fontSize: 16 }}>{formatDate(selectedEvent.eventDate)}</span>
            {isPaid && <>
              <span style={{ color: '#4b5563', fontSize: 16 }}>•</span>
              <span style={{ color: '#93c5fd', fontSize: 16, fontWeight: 700 }}>{formatPrice(selectedEvent.price)}</span>
            </>}
          </div>

          {/* Countdown badge — only when event starts within 6 hours */}
          {showCountdown && msUntilStart !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '10px 18px', marginBottom: 16,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 999, color: '#93c5fd',
              fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
              alignSelf: 'flex-start',
            }}>
              <i className="bi bi-hourglass-split" style={{ color: '#93c5fd' }}></i>
              <span>Starts in {formatCountdown(msUntilStart)}</span>
            </div>
          )}

          {/* Title */}
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-0.03em', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            {selectedEvent.title}
          </h1>

          {/* Description — clamped to 3 lines */}
          {selectedEvent.description && (
            <p style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', color: '#a1a1aa', lineHeight: 1.6, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', maxWidth: '90%' }}>
              {selectedEvent.description}
            </p>
          )}

          {/* Info row: location · time · attendees */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap', color: '#9ca3af', fontSize: 14 }}>
            <i className="bi bi-geo-alt-fill" style={{ color: '#93c5fd', fontSize: 16 }}></i>
            <span>{selectedEvent.location || 'TBD'}</span>
            <span style={{ color: '#4b5563' }}>•</span>
            <i className="bi bi-clock-fill" style={{ color: '#93c5fd', fontSize: 16 }}></i>
            <span>{formatTimeRange(selectedEvent.startTime, selectedEvent.endTime)}</span>
            <span style={{ color: '#4b5563' }}>•</span>
            <i className="bi bi-people-fill" style={{ color: '#93c5fd', fontSize: 16 }}></i>
            <span>{selectedEvent.maxGuests && selectedEvent.maxGuests > 0 ? `${selectedEvent.maxGuests.toLocaleString()} ${t('people')}` : 'Unlimited'}</span>
          </div>

          {/* Organizer row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: photographerName ? 6 : 10, color: '#9ca3af', fontSize: 14 }}>
            <i className="bi bi-person-badge-fill" style={{ color: '#93c5fd', fontSize: 17 }}></i>
            <span>{t('organizedBy')}</span>
            <span style={{ color: '#efeff1', fontWeight: 700 }}>{selectedEvent.eventOrganizer || 'TBD'}</span>
          </div>

          {/* Photographer row */}
          {photographerName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color: '#9ca3af', fontSize: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(8,58,133,0.15)', border: '1.5px solid rgba(8,58,133,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {selectedEvent.photographer?.profilePicture
                  ? <img src={selectedEvent.photographer.profilePicture} alt={photographerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <i className="bi bi-camera-fill" style={{ color: '#93c5fd', fontSize: 20 }}></i>
                }
              </div>
              <span>Photographer</span>
              <span style={{ color: '#efeff1', fontWeight: 700 }}>{photographerName}</span>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, fontSize: 13, color: '#d1d5db', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.2s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.2)'; e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.borderColor = 'rgba(8,58,133,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  <i className="bi bi-hash" style={{ fontSize: 14 }}></i>{tag}
                </span>
              ))}
            </div>
          )}

          {/* ── CTA ── */}
          <div className="ve-cta-bar" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4, maxWidth: 'clamp(240px, 94vw, 400px)' }}>
          {isLive ? (
            isPaid && hasPurchasedAccess ? (
              // Paid event, already purchased — go straight to watch
              <button
                className="live-stream-button"
                onClick={() => { window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&paid=true`; }}
                style={{ padding: 'clamp(5px, 1.2vw, 10px) clamp(8px, 1.8vw, 36px)', backgroundColor: '#16a34a', color: '#fff', border: '2px solid #22c55e', borderRadius: 8, fontSize: 'clamp(9px, 1.2vw, 14px)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.2s', textTransform: 'uppercase', minHeight: 30 }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#15803d'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#16a34a'; }}
              >
                <i className="bi bi-play-circle-fill live-badge-icon" style={{ fontSize: 16 }}></i>
                Start Watching
              </button>
            ) : isPaid ? (
              <>
                {/* 2x2 grid: Purchase | Already paid?  /  Input | Redeem */}
                <div className="ve-cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, rowGap: 12, width: '100%', paddingBottom: 2 }}>
                  <button
                    className="live-stream-button"
                    onClick={() => handlePurchaseAccess(`/user/events/join-package?id=${selectedEvent.id}`)}
                    style={{ padding: 'clamp(5px, 1.2vw, 8px) clamp(6px, 1.5vw, 14px)', backgroundColor: '#16a34a', color: '#fff', border: '2px solid #22c55e', borderRadius: 8, fontSize: 'clamp(9px, 1vw, 13px)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.2s', textTransform: 'uppercase', whiteSpace: 'nowrap', minHeight: 30, width: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#15803d'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#16a34a'; }}
                  >
                    <i className="bi bi-ticket-perforated-fill live-badge-icon" style={{ fontSize: 15 }}></i>
                    Purchase Access
                  </button>
                  <button
                    onClick={() => { setVaError(null); setShowViewerAuth(true); }}
                    style={{ padding: 'clamp(5px, 1.2vw, 8px) clamp(6px, 1.5vw, 14px)', background: 'transparent', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#d1d5db', fontSize: 'clamp(9px, 1vw, 13px)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.2s', whiteSpace: 'nowrap', minHeight: 30, width: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#d1d5db'; }}
                  >
                    <i className="bi bi-person-check-fill" style={{ fontSize: 14 }}></i>
                    Already paid?
                  </button>
                  <div style={{ position: 'relative' }}>
                    <i className="bi bi-people-fill" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 14, pointerEvents: 'none' }}></i>
                    <input
                      type="text"
                      placeholder="Enter Group Code Here"
                      value={groupCode}
                      onChange={e => { setGroupCode(e.target.value); setGroupCodeError(''); }}
                      style={{ width: '100%', padding: 'clamp(5px, 1.2vw, 8px) clamp(6px, 1.5vw, 12px) clamp(5px, 1.2vw, 8px) clamp(22px, 2.5vw, 30px)', borderRadius: 8, border: groupCodeError ? '1.5px solid #ef4444' : '1.5px dashed rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 'clamp(9px, 1vw, 13px)', outline: 'none', letterSpacing: '0.3px', minHeight: 30 }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderStyle = 'solid'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = groupCodeError ? '#ef4444' : 'rgba(255,255,255,0.25)'; e.currentTarget.style.borderStyle = groupCodeError ? 'solid' : 'dashed'; }}
                    />
                  </div>
                  <button
                    onClick={handleGroupCodeSubmit}
                    disabled={groupCodeLoading || !groupCode.trim()}
                    className={groupCode.trim() ? 'live-stream-button' : ''}
                    style={{ padding: 'clamp(5px, 1.2vw, 8px) clamp(6px, 1.5vw, 14px)', borderRadius: 8, border: groupCode.trim() ? '2px solid #22c55e' : '1.5px solid rgba(255,255,255,0.15)', background: groupCode.trim() ? '#16a34a' : 'rgba(255,255,255,0.04)', color: groupCode.trim() ? '#fff' : 'rgba(255,255,255,0.25)', fontSize: 'clamp(9px, 1vw, 13px)', fontWeight: 600, cursor: groupCode.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', whiteSpace: 'nowrap', minHeight: 30, width: '100%' }}
                  >
                    {groupCodeLoading ? '...' : 'Continue'}
                  </button>
                </div>
                {groupCodeError && (
                  <p style={{ color: '#ef4444', fontSize: 12, margin: '0', textAlign: 'left' }}>{groupCodeError}</p>
                )}
              </>
            ) : (
              // Free event — no auth needed, enter stream invite token
              <button
                className="live-stream-button"
                onClick={() => { window.location.href = `/user/events/join-event?id=${selectedEvent.id}`; }}
                style={{ padding: 'clamp(5px, 1.2vw, 10px) clamp(8px, 1.8vw, 36px)', backgroundColor: '#083A85', color: '#fff', border: '2px solid #0a4da3', borderRadius: 8, fontSize: 'clamp(9px, 1.2vw, 14px)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.2s', textTransform: 'uppercase', minHeight: 30 }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#062d6b'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#083A85'; }}
              >
                <i className="bi bi-play-circle-fill live-badge-icon" style={{ fontSize: 16 }}></i>
                Watch Live
              </button>
            )
          ) : isUpcoming && isPaid ? (
            hasPurchasedAccess ? (
              // Upcoming paid event, already pre-purchased
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '12px 36px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#0a4da3', border: '2px solid rgba(16, 185, 129, 0.4)', borderRadius: 10, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: 16 }}></i>
                  Access Reserved — We&apos;ll notify you when it&apos;s live
                </div>
              </div>
            ) : (
              // Upcoming paid event, not purchased — allow pre-purchase
              <>
              <button
                onClick={() => handlePurchaseAccess(`/user/events/join-package?id=${selectedEvent.id}`)}
                style={{ padding: 'clamp(5px, 1.2vw, 10px) clamp(8px, 1.8vw, 36px)', backgroundColor: '#083A85', color: '#fff', border: '2px solid #3b82f6', borderRadius: 8, fontSize: 'clamp(9px, 1.2vw, 14px)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'background 0.2s', textTransform: 'uppercase', minHeight: 30, width: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#062d6b'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#083A85'; }}
              >
                <i className="bi bi-ticket-perforated-fill" style={{ fontSize: 16 }}></i>
                Reserve Your Spot
              </button>
              <button
                onClick={() => { setVaError(null); setShowViewerAuth(true); }}
                style={{ padding: 'clamp(5px, 1.2vw, 10px) clamp(8px, 1.5vw, 20px)', background: 'transparent', border: '2.5px solid rgba(255,255,255,0.35)', borderRadius: 8, color: '#d1d5db', fontSize: 'clamp(9px, 1vw, 13px)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.2s', minHeight: 30, width: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#d1d5db'; }}
              >
                <i className="bi bi-person-check-fill" style={{ fontSize: 13 }}></i>
                Already paid? Verify here
              </button>
              </>
            )
          ) : null}
          </div>
        </div>
      </div>

      {/* ── VIEWER AUTH MODAL ── */}
      {/* ── Already Paid? Viewer Re-Auth Modal ── */}
      {showViewerAuth && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(8,58,133,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: 16,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !vaLoading) setShowViewerAuth(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 20, padding: 'clamp(24px, 5vw, 36px)',
              maxWidth: 460, width: '100%',
              border: '1px solid rgba(8,58,133,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
              position: 'relative',
            }}
          >
            {/* Close */}
            <button
              onClick={() => { if (!vaLoading) setShowViewerAuth(false); }}
              style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Header with icon */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(8,58,133,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className="bi bi-shield-check" style={{ fontSize: 24, color: '#083A85' }}></i>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: "'Pragati Narrow', sans-serif" }}>Verify Your Purchase</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Enter the details you used when purchasing to access the stream
              </p>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
                  <i className="bi bi-person" style={{ fontSize: 13 }}></i> Full Name
                </label>
                <input
                  type="text"
                  value={vaName}
                  onChange={(e) => setVaName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewerAuth()}
                  placeholder="Your name"
                  disabled={vaLoading}
                  style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid rgba(8,58,133,0.1)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,58,133,0.08)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
                    <i className="bi bi-envelope" style={{ fontSize: 12 }}></i> Email
                  </label>
                  <input
                    type="email"
                    value={vaEmail}
                    onChange={(e) => setVaEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleViewerAuth()}
                    placeholder="your@email.com"
                    disabled={vaLoading}
                    style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid rgba(8,58,133,0.1)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,58,133,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>
                    <i className="bi bi-phone" style={{ fontSize: 12 }}></i> Phone
                  </label>
                  <input
                    type="tel"
                    value={vaPhone}
                    onChange={(e) => setVaPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    onKeyDown={(e) => e.key === 'Enter' && handleViewerAuth()}
                    placeholder="07XXXXXXXX"
                    disabled={vaLoading}
                    style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid rgba(8,58,133,0.1)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,58,133,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <p style={{ fontSize: 11, color: '#94a3b8', margin: '-4px 0 0', textAlign: 'center' }}>
                <i className="bi bi-info-circle" style={{ marginRight: 4 }}></i>
                Enter email, phone, or both — we match on either
              </p>
            </div>

            {vaError && (
              <div style={{ padding: '10px 14px', marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-exclamation-circle-fill" style={{ flexShrink: 0 }}></i>
                {vaError}
              </div>
            )}

            <button
              onClick={handleViewerAuth}
              disabled={vaLoading}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, marginTop: 16,
                background: vaLoading ? '#d1d5db' : 'linear-gradient(135deg, #083A85, #0a4da3)',
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: vaLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: vaLoading ? 'none' : '0 4px 12px rgba(8,58,133,0.25)',
              }}
            >
              {vaLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} />
                  Verifying…
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check" style={{ fontSize: 16 }}></i>
                  Verify &amp; Watch
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2vw, 16px)', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 'min(600px, 95vw)', background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'clamp(14px, 2vw, 20px)', padding: 'clamp(20px, 3vw, 28px) clamp(18px, 3vw, 32px)', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(8,58,133,0.15)', position: 'relative', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Close button */}
            <button onClick={() => setShowAuthModal(false)} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}>
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #103E83)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className={authStep === 'otp' ? 'bi bi-shield-check' : 'bi bi-lock-fill'} style={{ fontSize: 22, color: '#fff' }}></i>
              </div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                {authStep === 'otp' ? 'Verify Your Email' : 'Sign in to Purchase Access'}
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
                {authStep === 'otp' ? 'Enter the code sent to your email' : 'Your account keeps your access safe across sessions'}
              </p>
            </div>

            {/* Tab switcher — only on login/signup step */}
            {authStep !== 'otp' && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
                {(['login', 'signup'] as const).map(tab => (
                  <button key={tab} onClick={() => { setAuthStep(tab); setAuthError(''); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', background: authStep === tab ? 'linear-gradient(135deg, #083A85, #103E83)' : 'transparent', color: authStep === tab ? '#fff' : '#6b7280' }}>
                    {tab === 'login' ? 'Log In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            )}

            {/* Error */}
            {authError && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: 14, marginTop: 1, flexShrink: 0 }}></i>
                <span style={{ color: '#fca5a5', fontSize: 13 }}>{authError}</span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {authStep === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input type="email" value={loginEmail} onChange={e => { if (!pendingGroupCode) setLoginEmail(e.target.value); }} readOnly={!!pendingGroupCode} placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '11px 14px', background: pendingGroupCode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: pendingGroupCode ? '#9ca3af' : '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: pendingGroupCode ? 'not-allowed' : 'text' }} onFocus={e => { if (!pendingGroupCode) e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleLogin} disabled={authLoading || googleLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #083A85, #103E83)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} /> Signing in…</> : <><i className="bi bi-box-arrow-in-right"></i> Log In & Continue</>}
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ color: '#6b7280', fontSize: 12 }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <GoogleAuthButton
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      loading={googleLoading || authLoading}
                      label="Continue with Google"
                    />
                  </>
                )}
              </div>
            )}

            {/* ── SIGNUP FORM ── */}
            {authStep === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="ve-name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>First Name</label>
                    <input type="text" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} placeholder="John" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Last Name</label>
                    <input type="text" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} placeholder="Doe" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input type="email" value={signupEmail} onChange={e => { if (!pendingGroupCode) setSignupEmail(e.target.value); }} readOnly={!!pendingGroupCode} placeholder="your@email.com" style={{ width: '100%', padding: '11px 14px', background: pendingGroupCode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: pendingGroupCode ? '#9ca3af' : '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: pendingGroupCode ? 'not-allowed' : 'text' }} onFocus={e => { if (!pendingGroupCode) e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone</label>
                  <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value.replace(/[^0-9+]/g, ''))} placeholder="+250 700 000 000" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                  <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Min. 8 characters" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleSignup} disabled={authLoading || googleLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #083A85, #103E83)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} /> Creating account…</> : <><i className="bi bi-person-plus-fill"></i> Create Account</>}
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ color: '#6b7280', fontSize: 12 }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <GoogleAuthButton
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      loading={googleLoading || authLoading}
                      label="Sign up with Google"
                    />
                  </>
                )}
              </div>
            )}

            {/* ── OTP FORM ── */}
            {authStep === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'rgba(8,58,133,0.15)', border: '1px solid rgba(8,58,133,0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <i className="bi bi-envelope-check-fill" style={{ color: '#93c5fd', fontSize: 16, flexShrink: 0 }}></i>
                  <span style={{ color: '#a1a1aa', fontSize: 13 }}>A 6-digit code was sent to <strong style={{ color: '#fff' }}>{signupEmail}</strong></span>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Verification Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))} placeholder="000000" onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '0.35em', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleVerifyOtp} disabled={authLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #083A85, #103E83)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} /> Verifying…</> : <><i className="bi bi-shield-check"></i> Verify & Continue</>}
                </button>
                <button onClick={() => { setAuthStep('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textAlign: 'center', padding: '4px 0' }}>
                  Already have an account? Log in
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CSS Animations + Responsive */}
      <style jsx>{`
        @keyframes authSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Desktop: center CTA across full viewport by breaking out of left panel */
        @media (min-width: 769px) {
          .ve-cta-bar {
            position: relative;
            left: calc((100vw * 0.5) - 50%);
            transform: translateX(-50%);
            margin-left: 50%;
          }
        }

        @media (max-width: 768px) {
          .ve-cinema {
            height: auto !important;
            min-height: 100dvh;
            overflow: visible !important;
          }
          .ve-left-panel {
            position: relative !important;
            width: 100% !important;
            padding: 70px 16px 24px !important;
          }
          .ve-price-box {
            position: relative !important;
            bottom: auto !important;
            right: auto !important;
            margin: 12px 16px 0 !important;
            display: inline-block !important;
          }
          .ve-left-panel h1 {
            font-size: 24px !important;
            margin-bottom: 6px !important;
          }
          .ve-cta-bar {
            max-width: 100% !important;
          }
          .ve-name-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .ve-left-panel {
            padding: 60px 12px 16px !important;
          }
          .ve-left-panel h1 {
            font-size: 20px !important;
            margin-bottom: 4px !important;
          }
          .ve-cta-bar {
            gap: 6px !important;
            margin-top: 6px !important;
          }
          .ve-cta-bar button, .ve-cta-bar input {
            padding: 8px 10px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
          }
          .ve-price-box {
            margin: 8px 12px 0 !important;
            padding: 8px 16px !important;
          }
          .ve-price-box div:first-child {
            font-size: 18px !important;
          }
        }
      `}</style>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sound-wave-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
          40% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0),
                        0 0 15px rgba(16, 185, 129, 0.7);
          }
          80% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes button-glow-pulse {
          0% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.3),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          40% {
            box-shadow: 0 6px 20px rgba(3, 145, 48, 0.5),
                        0 0 0 10px rgba(16, 185, 129, 0),
                        0 0 0 20px rgba(16, 185, 129, 0);
          }
          80% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.4),
                        0 0 0 10px rgba(16, 185, 129, 0),
                        0 0 0 20px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.3),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes border-twinkle {
          0%, 100% {
            border-color: #22c55e;
            filter: brightness(1);
          }
          50% {
            border-color: #4ade80;
            filter: brightness(1.2);
          }
        }

        @keyframes purchase-glow-pulse {
          0% {
            box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3),
                        0 0 0 0 rgba(34, 197, 94, 0.7),
                        0 0 0 0 rgba(34, 197, 94, 0.5);
          }
          40% {
            box-shadow: 0 6px 20px rgba(22, 163, 74, 0.5),
                        0 0 0 10px rgba(34, 197, 94, 0),
                        0 0 0 20px rgba(34, 197, 94, 0);
          }
          80% {
            box-shadow: 0 4px 15px rgba(22, 163, 74, 0.4),
                        0 0 0 10px rgba(34, 197, 94, 0),
                        0 0 0 20px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3),
                        0 0 0 0 rgba(34, 197, 94, 0.7),
                        0 0 0 0 rgba(34, 197, 94, 0.5);
          }
        }

        @keyframes purchase-border-twinkle {
          0%, 100% {
            border-color: #22c55e;
            filter: brightness(1);
          }
          50% {
            border-color: #4ade80;
            filter: brightness(1.2);
          }
        }

        .live-badge {
          animation: sound-wave-pulse 0.9s ease-out infinite;
        }

        .live-stream-button {
          animation: button-glow-pulse 1.2s ease-in-out infinite,
                     border-twinkle 1.2s ease-in-out infinite;
        }

        .purchase-access-button {
          animation: purchase-glow-pulse 1.2s ease-in-out infinite,
                     purchase-border-twinkle 1.2s ease-in-out infinite;
        }

        .live-badge-icon {
          animation: icon-pulse 1s ease-in-out infinite;
          display: inline-block;
        }

        @keyframes icon-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
        }

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #052047;
        }

        ::-webkit-scrollbar-thumb {
          background: #083A85;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #027a7f;
        }

        .left-scroll::-webkit-scrollbar,
        .right-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .left-scroll::-webkit-scrollbar-track,
        .right-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .left-scroll::-webkit-scrollbar-thumb,
        .right-scroll::-webkit-scrollbar-thumb {
          background: rgba(3, 150, 156, 0.3);
          border-radius: 4px;
        }
        .left-scroll::-webkit-scrollbar-thumb:hover,
        .right-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(3, 150, 156, 0.6);
        }

        button:focus-visible,
        a:focus-visible {
          outline: 3px solid #083A85;
          outline-offset: 2px;
        }

        ::selection {
          background-color: #083A85;
          color: white;
        }
      `}</style>
    </>
  );
}

// Loading component
function LoadingFallback() {
  const t = useTranslations('events.viewEvent');
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#052047'
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
          fontWeight: '600',
          color: '#efeff1'
        }}>{t('loadingEventDetails')}</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ViewEventPage(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ViewEventContent />
    </Suspense>
  );
}
