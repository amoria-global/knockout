'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import AmoriaKNavbar from '../../../components/navbar';

const VideoMessageRecorder = dynamic(() => import('../../../components/VideoMessageRecorder'), { ssr: false });
import ErrorPopup, { type PopupSeverity } from '../../../components/ErrorPopup';
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
 * Break ms-duration into { days, hours, minutes, seconds } for countdown boxes.
 */
function getCountdownParts(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

/**
 * Format price for display
 */
function formatPrice(price?: number, currencyAbbr?: string): string {
  if (!price || price <= 0) return 'Free';
  return `${price.toLocaleString()} ${currencyAbbr || 'RWF'}`;
}

/**
 * Convert a 2-letter ISO country code (e.g. "RW") to its full name
 * (e.g. "Rwanda") using the browser's built-in Intl.DisplayNames API.
 * If the value is already a full name or the API isn't available,
 * it's returned unchanged.
 */
function formatCountryName(value?: string): string {
  if (!value) return '';
  // If it doesn't look like a 2-3 letter code, assume it's already a name.
  const trimmed = value.trim();
  if (trimmed.length > 3) return trimmed;
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const formatter = new Intl.DisplayNames(['en'], { type: 'region' });
      return formatter.of(trimmed.toUpperCase()) || trimmed;
    }
  } catch { /* fall through */ }
  return trimmed;
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

  // Geo-restriction check
  const [geoCheck, setGeoCheck] = useState<{
    allowed: boolean;
    userCity?: string;
    userCountry?: string;
  } | null>(null);
  const [geoOverlayDismissed, setGeoOverlayDismissed] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com').replace(/\/$/, '');
    fetch(`${baseUrl}/api/remote/events/${eventId}/geo-check`)
      .then(res => {
        if (!res.ok) throw new Error('Geo check failed');
        return res.json();
      })
      .then(result => {
        setGeoCheck({
          allowed: result.allowed,
          userCity: result.userCity,
          userCountry: result.userCountry,
        });
      })
      .catch(() => {
        setGeoCheck({ allowed: true }); // Fail-open
      });
  }, [eventId]);

  // Tick every second to drive the 6h-window countdown badge
  useEffect(() => {
    const start = getEventStartDate(selectedEvent?.eventDate, selectedEvent?.startTime);
    if (!start) { setMsUntilStart(null); return; }
    const tick = () => setMsUntilStart(start.getTime() - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [selectedEvent?.eventDate, selectedEvent?.startTime]);

  const showCountdown = msUntilStart !== null && msUntilStart > 0;

  // ── Reservation-success modal ────────────────────────────────────
  // Shown when the user lands on this page with `?reserved=1` after
  // completing payment for an upcoming event. Strips the param after
  // dismissal so refresh / back doesn't re-trigger the modal.
  const reservedFlag = searchParams.get('reserved');
  const groupFlag = searchParams.get('group');
  const [showReservedModal, setShowReservedModal] = useState(false);
  useEffect(() => {
    if (reservedFlag === '1') {
      setShowReservedModal(true);
    }
  }, [reservedFlag]);
  const dismissReservedModal = useCallback(() => {
    setShowReservedModal(false);
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('reserved');
      url.searchParams.delete('group');
      window.history.replaceState({}, '', url.toString());
    } catch { /* silent */ }
  }, []);

  // ── Cinematic page state ─────────────────────────────────────────
  // Hero scroll progress drives the parallax + sticky title bar fade-in
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;
    const ro = new ResizeObserver(() => {
      setHeroHeight(heroRef.current?.offsetHeight || 0);
    });
    ro.observe(heroRef.current);
    setHeroHeight(heroRef.current.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Bookmark - same key as /user/events list page
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    if (!selectedEvent?.id || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('connekyt:savedEvents');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setIsSaved(arr.includes(selectedEvent.id));
    } catch { /* silent */ }
  }, [selectedEvent?.id]);
  const toggleSaved = useCallback(() => {
    if (!selectedEvent?.id || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('connekyt:savedEvents');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = arr.includes(selectedEvent.id)
        ? arr.filter(x => x !== selectedEvent.id)
        : [...arr, selectedEvent.id];
      localStorage.setItem('connekyt:savedEvents', JSON.stringify(next));
      setIsSaved(next.includes(selectedEvent.id));
    } catch { /* silent */ }
  }, [selectedEvent?.id]);

  // Description expand/collapse
  const [descExpanded, setDescExpanded] = useState(false);

  // Native share fallback to clipboard
  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const title = selectedEvent?.title || 'Event on Connekyt';
    const text = `Check out "${title}" on Connekyt`;
    const nav = window.navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title, text, url }); return; } catch { /* user cancelled */ }
    }
    try {
      await window.navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch { /* silent */ }
  }, [selectedEvent?.title]);

  const scrollToTickets = useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = ticketRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  // ── Live-now auto-join (paid attendee returning to a live event) ──
  // When a paid spot-reserver lands on the page AFTER the event has gone
  // live, surface a celebratory ribbon with a 5-second auto-join countdown
  // they can cancel. Once they cancel, the ribbon stays as a quiet
  // "Join now" reminder without re-triggering the timer.
  const [autoJoinSeconds, setAutoJoinSeconds] = useState<number | null>(null);
  const [autoJoinDismissed, setAutoJoinDismissed] = useState(false);
  const [showLiveRibbon, setShowLiveRibbon] = useState(false);

  // Detect "paid attendee + event live" once selectedEvent loads.
  // We compute live-ness + ownership inline because the outer-scope
  // derivations (isLive, hasPurchasedAccess) are declared after the early
  // returns and aren't in scope at this hook position.
  useEffect(() => {
    if (!selectedEvent || typeof window === 'undefined') return;
    const rawStatus = (selectedEvent.eventStatus || '').toUpperCase();
    const streamEnded = (selectedEvent as Record<string, unknown>).streamStatus === 'ended';
    const liveNow = rawStatus === 'ONGOING' && !streamEnded;
    if (!liveNow) {
      setShowLiveRibbon(false);
      setAutoJoinSeconds(null);
      return;
    }
    if (!selectedEvent.hasPurchasedAccess) return;
    const id = selectedEvent.id;
    let hasLocalProof = false;
    try {
      hasLocalProof =
        !!localStorage.getItem(`anonymousViewer_${id}`)
        || !!localStorage.getItem(`groupCode_${id}`)
        || !!localStorage.getItem(`connekyt:purchased_${id}`);
    } catch { /* silent */ }
    if (!hasLocalProof) return;
    setShowLiveRibbon(true);
    if (!autoJoinDismissed) {
      setAutoJoinSeconds(5);
    }
  }, [selectedEvent, autoJoinDismissed]);

  // Tick the auto-join countdown - when it hits 0, redirect to the stream.
  useEffect(() => {
    if (autoJoinSeconds === null || autoJoinDismissed) return;
    if (autoJoinSeconds <= 0) {
      if (selectedEvent?.id && typeof window !== 'undefined') {
        window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`;
      }
      return;
    }
    const t = window.setTimeout(
      () => setAutoJoinSeconds((s) => (s === null ? null : s - 1)),
      1000
    );
    return () => window.clearTimeout(t);
  }, [autoJoinSeconds, autoJoinDismissed, selectedEvent?.id]);

  const cancelAutoJoin = useCallback(() => {
    setAutoJoinDismissed(true);
    setAutoJoinSeconds(null);
  }, []);

  const joinLiveNow = useCallback(() => {
    if (!selectedEvent?.id || typeof window === 'undefined') return;
    window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`;
  }, [selectedEvent?.id]);

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
  // Group invite code - auto-fill from URL param (from email link)
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

  // Global error popup - replaces inline error banners across the page
  const [errorPopup, setErrorPopup] = useState<{
    open: boolean;
    severity: PopupSeverity;
    title?: string;
    message: string;
    hint?: string;
    primaryAction?: { label: string; onClick: () => void; icon?: string };
    secondaryAction?: { label: string; onClick: () => void; icon?: string };
  }>({ open: false, severity: 'error', message: '' });
  const closeErrorPopup = useCallback(() => setErrorPopup(p => ({ ...p, open: false })), []);

  // Group invite code - lightweight identity modal (same pattern as paid viewer)
  const [showGroupAuth, setShowGroupAuth] = useState(false);
  const [gaName, setGaName] = useState('');
  const [gaEmail, setGaEmail] = useState('');
  const [gaPhone, setGaPhone] = useState('');
  const [gaLoading, setGaLoading] = useState(false);
  const [gaError, setGaError] = useState<string | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState('');
  const [gaEmailRestricted, setGaEmailRestricted] = useState(false);

  // Buyer's group code (fetched from backend)
  const [savedGroupCode, setSavedGroupCode] = useState<{
    code: string;
    viewerCount?: number;
    usedSlots?: number;
    remainingSlots?: number;
    expiresAt?: string;
    emailRestricted?: boolean;
    invitedViewers?: Array<{ email: string; name?: string | null; status: string }>;
  } | null>(null);
  const [showGroupCodeView, setShowGroupCodeView] = useState(false);
  const [groupCodeCopied, setGroupCodeCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Pre-event wishes - text + video reactions before event goes live
  const [wishName, setWishName] = useState('');
  const [wishEmail, setWishEmail] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [wishLoading, setWishLoading] = useState(false);
  const [wishError, setWishError] = useState<string | null>(null);
  const [wishSuccess, setWishSuccess] = useState<string | null>(null);
  const [showWishVideoRecorder, setShowWishVideoRecorder] = useState(false);

  // Restore cached wish identity from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem('eventWishIdentity');
      if (cached) {
        const d = JSON.parse(cached);
        if (d.name) setWishName(d.name);
        if (d.email) setWishEmail(d.email);
      }
    } catch {}
  }, []);

  const cacheWishIdentity = (name: string, email: string) => {
    try { localStorage.setItem('eventWishIdentity', JSON.stringify({ name, email })); } catch {}
  };

  const handleSendTextWish = async () => {
    const name = wishName.trim();
    const email = wishEmail.trim();
    const message = wishMessage.trim();
    if (!name) { setWishError('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setWishError('Please enter a valid email.'); return; }
    if (!message) { setWishError('Please write your message.'); return; }
    if (!selectedEvent?.id) return;
    setWishLoading(true);
    setWishError(null);
    setWishSuccess(null);
    try {
      const fp = await getDeviceId();
      const base = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
      const res = await fetch(`${base}/api/remote/public/events/${selectedEvent.id}/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, deviceFingerprint: fp }),
      });
      const data = await res.json();
      if (data.action === 1) {
        setWishSuccess('Your wish was sent to the event organizer!');
        setWishMessage('');
        cacheWishIdentity(name, email);
        setTimeout(() => setWishSuccess(null), 5000);
      } else {
        const msg = data.message || '';
        if (msg.includes('only allowed before')) setWishError('The event is now live. Please join the stream to send messages.');
        else if (msg.includes('rate') || msg.includes('limit')) setWishError('You\u2019re sending wishes too quickly. Please wait a moment.');
        else if (msg.includes('restricted') || msg.includes('blocked')) setWishError('Your message contains restricted content (emails, phone numbers, or links).');
        else setWishError(msg || 'Could not send your wish. Please try again.');
      }
    } catch {
      setWishError('Connection error. Please try again.');
    } finally {
      setWishLoading(false);
    }
  };

  const handleSendVideoWish = async (videoBlob: Blob) => {
    const name = wishName.trim();
    const email = wishEmail.trim();
    if (!name) { setWishError('Please enter your name first.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setWishError('Please enter a valid email first.'); return; }
    if (!selectedEvent?.id) return;
    setWishLoading(true);
    setWishError(null);
    setWishSuccess(null);
    try {
      const fp = await getDeviceId();
      const base = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
      const videoFile = new File([videoBlob], `wish-${Date.now()}.webm`, { type: videoBlob.type || 'video/webm' });
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('video', videoFile);
      formData.append('deviceFingerprint', fp);
      if (wishMessage.trim()) formData.append('message', wishMessage.trim());
      const res = await fetch(`${base}/api/remote/public/events/${selectedEvent.id}/wishes/video`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.action === 1) {
        setWishSuccess('Your video wish was sent to the event organizer!');
        setWishMessage('');
        setShowWishVideoRecorder(false);
        cacheWishIdentity(name, email);
        setTimeout(() => setWishSuccess(null), 5000);
      } else {
        const msg = data.message || '';
        if (msg.includes('only allowed before')) setWishError('The event is now live. Please join the stream to send messages.');
        else if (msg.includes('rate') || msg.includes('limit')) setWishError('You\u2019re sending wishes too quickly. Please wait a moment.');
        else if (msg.includes('size') || msg.includes('large')) setWishError('Video is too large. Maximum size is 10 MB.');
        else setWishError(msg || 'Could not send your video wish. Please try again.');
      }
    } catch {
      setWishError('Connection error. Please try again.');
    } finally {
      setWishLoading(false);
    }
  };

  const handleViewerAuth = async () => {
    const name = vaName.trim();
    const email = vaEmail.trim();
    const phone = vaPhone.trim();
    if (!name) { setVaError('Please enter your name.'); return; }
    if (!email && !phone) { setVaError('Please enter the email or phone you used to purchase.'); return; }
    if (geoCheck && geoCheck.allowed === false) {
      setShowViewerAuth(false);
      setGeoOverlayDismissed(false);
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* silent */ }
      return;
    }
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
        setShowViewerAuth(false);
        setErrorPopup({
          open: true,
          severity: 'error',
          title: 'Verification failed',
          message: res.error || 'We couldn’t verify your access right now. Please try again in a moment.',
          primaryAction: {
            label: 'Try again',
            icon: 'bi-arrow-clockwise',
            onClick: () => {
              closeErrorPopup();
              setVaError(null);
              setShowViewerAuth(true);
            },
          },
        });
        return;
      }
      const resData = res.data as Record<string, unknown> | undefined;
      const status = resData?.status as string;
      const viewerId = resData?.viewerId as string;

      if (status === 'ACCESS_GRANTED' || status === 'DEVICE_CONFLICT' || status === 'DEVICE_MISMATCH') {
        // Viewer recognized - store viewerId and go to live-stream
        if (viewerId) {
          localStorage.setItem(`anonymousViewer_${selectedEvent!.id}`, viewerId);
          localStorage.setItem(`anonymousViewerName_${selectedEvent!.id}`, name);
        }
        window.location.href = `/user/events/live-stream?eventId=${selectedEvent!.id}&from=payment${viewerId ? `&viewerId=${viewerId}` : ''}`;
      } else {
        // REQUIRES_PAYMENT - not found as a paid viewer. Close inline modal & show popup.
        setShowViewerAuth(false);
        setErrorPopup({
          open: true,
          severity: 'error',
          title: 'No payment found',
          message: 'We couldn’t find a payment matching this email or phone. Please double-check the exact details you used when purchasing.',
          hint: 'Tip: try the alternate contact (email vs. phone) you may have used at checkout.',
          primaryAction: {
            label: 'Try again',
            icon: 'bi-arrow-clockwise',
            onClick: () => {
              closeErrorPopup();
              setVaError(null);
              setShowViewerAuth(true);
            },
          },
          secondaryAction: {
            label: 'Buy access',
            icon: 'bi-ticket-perforated',
            onClick: () => {
              closeErrorPopup();
              // Scroll to the tickets section using the page's existing helper
              // (which targets ticketRef with proper navbar offset).
              scrollToTickets();
            },
          },
        });
      }
    } catch {
      setShowViewerAuth(false);
      setErrorPopup({
        open: true,
        severity: 'warning',
        title: 'Connection error',
        message: 'We couldn’t reach the server. Please check your internet connection and try again.',
        primaryAction: {
          label: 'Try again',
          icon: 'bi-arrow-clockwise',
          onClick: () => {
            closeErrorPopup();
            setVaError(null);
            setShowViewerAuth(true);
          },
        },
      });
    } finally {
      setVaLoading(false);
    }
  };

  // Fetch buyer's group code from backend (persistent, works across devices)
  const fetchGroupCode = async () => {
    if (!selectedEvent?.id) return;
    // Need a viewerId - check localStorage (set during payment or viewer auth)
    const viewerId = localStorage.getItem(`anonymousViewer_${selectedEvent.id}`);
    if (!viewerId) return;
    try {
      const fp = await getDeviceId();
      const base = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
      const res = await fetch(`${base}/api/remote/public/streams/${selectedEvent.id}/group-access/my-code?viewerId=${encodeURIComponent(viewerId)}&deviceFingerprint=${encodeURIComponent(fp)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.action === 1 && json.data?.code) {
          setSavedGroupCode({
            code: json.data.code,
            viewerCount: json.data.viewerCount,
            usedSlots: json.data.usedSlots,
            remainingSlots: json.data.remainingSlots,
            expiresAt: json.data.expiresAt,
            emailRestricted: json.data.emailRestricted,
            invitedViewers: json.data.invitedViewers,
          });
        }
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (selectedEvent?.id && selectedEvent?.hasPurchasedAccess) {
      fetchGroupCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id, selectedEvent?.hasPurchasedAccess]);

  // Listen for session expiry - show login modal instead of redirecting
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
              window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(pendingGroupCode)}`;
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
            window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`;
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
        // Pass the device fingerprint so the backend can correctly resolve
        // anonymous viewer purchase status (otherwise hasPurchasedAccess can
        // come back stale/incorrect for unauthenticated visitors).
        const fp = await getDeviceId().catch(() => undefined);
        const response = await getPublicEventById(eventId, fp);
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

  // Loading state - silent. The page renders its own dark backdrop while the
  // event fetch resolves; no spinner or "Loading…" text per design request.
  if (isLoading) {
    return (
      <>
        <AmoriaKNavbar />
        <div
          aria-busy="true"
          aria-label="Loading event"
          style={{
            minHeight: '100vh',
            background: 'radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.18) 0%, rgba(8,58,133,0) 60%), linear-gradient(180deg, #07080d 0%, #0c0e15 60%, #11141d 100%)',
          }}
        />
      </>
    );
  }

  // Error state
  if (loadError || !selectedEvent) {
    return (
      <>
        <AmoriaKNavbar />
        <div
          style={{
            minHeight: '100vh',
            background: 'radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.18) 0%, rgba(8,58,133,0) 60%), linear-gradient(180deg, #07080d 0%, #0c0e15 60%, #11141d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Pragati Narrow', system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.45)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#fca5a5', fontSize: 28 }}>
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f4f6fb', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              {loadError || 'Event not found'}
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 20px', lineHeight: 1.5 }}>
              The event may have been removed, or the link may be incorrect.
            </p>
            <button
              onClick={() => window.history.back()}
              style={{ padding: '12px 28px', background: '#083A85', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 36px -10px rgba(8,58,133,0.55)', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <i className="bi bi-chevron-left"></i> Go back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Handle group code submission - validate then open lightweight identity modal
  const handleGroupCodeSubmit = async () => {
    if (!groupCode.trim()) { setGroupCodeError('Please enter a group invite code'); return; }
    if (blockedByGeo()) return;
    setGroupCodeError('');
    setGroupCodeLoading(true);
    try {
      const chatBase = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
      const validateRes = await fetch(`${chatBase}/api/remote/public/streams/${selectedEvent?.id}/validate-group-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: groupCode.trim() }),
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
      // Code valid - open lightweight identity modal (same as paid viewer flow)
      const restricted = validateData.data?.emailRestricted === true;
      const authorizedEmail = validateData.data?.authorizedEmail || '';
      setPendingInviteCode(groupCode.trim());
      setGaEmailRestricted(restricted);
      setGaEmail(authorizedEmail); // Pre-fill if backend provides the invited email
      setGaError(null);
      setShowGroupAuth(true);
    } catch { setGroupCodeError('Connection error. Please try again.'); }
    finally { setGroupCodeLoading(false); }
  };

  // Handle group viewer identity submission
  const handleGroupViewerAuth = async () => {
    const name = gaName.trim();
    const email = gaEmail.trim();
    const phone = gaPhone.trim();
    if (!name) { setGaError('Please enter your name.'); return; }
    if (!email) { setGaError(gaEmailRestricted ? 'Please enter the email you were invited on.' : 'Please enter your email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setGaError('Please enter a valid email address.'); return; }
    setGaLoading(true);
    setGaError(null);
    try {
      const fp = await getDeviceId();
      const chatBase = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
      const res = await fetch(`${chatBase}/api/remote/public/streams/${selectedEvent!.id}/identify-group-viewer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: pendingInviteCode, name, email, phone, deviceFingerprint: fp }),
      });
      const data = await res.json();
      if (data.action === 1 && data.status === 'ACCESS_GRANTED') {
        const viewerId = data.viewerId as string;
        if (viewerId) {
          localStorage.setItem(`anonymousViewer_${selectedEvent!.id}`, viewerId);
          localStorage.setItem(`anonymousViewerName_${selectedEvent!.id}`, name);
        }
        setShowGroupAuth(false);
        window.location.href = `/user/events/live-stream?eventId=${selectedEvent!.id}&from=payment${viewerId ? `&viewerId=${viewerId}` : ''}`;
      } else {
        const msg = data.message || '';
        if (msg.includes('different email')) {
          setGaError('This code was shared with a different email address. Please enter the email you were invited on.');
        } else if (msg.includes('viewer limit')) {
          setGaError('This group code has reached its viewer limit.');
        } else if (msg.includes('expired') || msg.includes('Invalid')) {
          setGaError('This group code is invalid or expired.');
        } else {
          setGaError(msg || 'Could not verify your access. Please try again.');
        }
      }
    } catch {
      setGaError('Connection error. Please try again.');
    } finally {
      setGaLoading(false);
    }
  };

  // Navigate to purchase page - no auth required (anonymous viewer flow handles it)
  // Send group invite email
  const handleInviteEmail = async () => {
    const email = inviteEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Please enter a valid email address.');
      return;
    }
    if (!selectedEvent?.id) return;
    const viewerId = localStorage.getItem(`anonymousViewer_${selectedEvent.id}`);
    if (!viewerId) { setInviteError('Session not found. Please reload.'); return; }
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const fp = await getDeviceId();
      const base = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
      const res = await fetch(`${base}/api/remote/public/streams/${selectedEvent.id}/group-access/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId, deviceFingerprint: fp, email }),
      });
      const data = await res.json();
      if (data.action === 1) {
        setInviteSuccess(`Invitation sent to ${email}`);
        setInviteEmail('');
        // Refresh group code data to update slots/invitedViewers
        fetchGroupCode();
      } else {
        setInviteError(data.message || 'Failed to send invitation.');
      }
    } catch {
      setInviteError('Connection error. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Geo-gate helper - if the user's location is restricted AND the event
  // is still upcoming, re-surface the restriction overlay (even if they
  // previously dismissed it) and return true so the calling action can bail
  // out early. Returns false when the user is allowed OR the event is no
  // longer in an upcoming state (live / completed / cancelled events bypass
  // the geo-block since pre-event purchase windows have closed).
  const blockedByGeo = (): boolean => {
    if (!geoCheck || geoCheck.allowed !== false) return false;
    // Only enforce on upcoming events - pre-event purchase / reservation flow.
    const rawStatusInner = (selectedEvent?.eventStatus || '').toUpperCase();
    const streamEndedInner = (selectedEvent as Record<string, unknown> | null)?.streamStatus === 'ended';
    const isUpcomingInner = !!selectedEvent
      && rawStatusInner !== 'ONGOING'
      && rawStatusInner !== 'COMPLETED'
      && rawStatusInner !== 'CANCELLED'
      && !streamEndedInner;
    if (!isUpcomingInner) return false;
    setGeoOverlayDismissed(false);
    // Scroll to top so the overlay is centered on the viewport
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* silent */ }
    return true;
  };

  const handlePurchaseAccess = (joinUrl: string) => {
    if (blockedByGeo()) return;
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
              window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(pendingGroupCode)}`;
              return;
            } else {
              setGroupCodeError(redeemData.message || 'Failed to redeem group code.');
            }
          } catch { setGroupCodeError('Failed to redeem group code.'); }
          setPendingGroupCode('');
          return;
        }
        // Check if viewer already paid - redirect to stream instead of join-package
        if (selectedEvent?.id) {
          const eventCheck = await getPublicEventById(selectedEvent.id);
          if (eventCheck.success && eventCheck.data?.hasPurchasedAccess) {
            window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`;
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
        // OTP verify only confirms email - token comes from login. Auto-login with signup credentials.
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
                window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(pendingGroupCode)}`;
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
              window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`;
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
  // Defensive ownership check - require PER-EVENT local proof of purchase.
  // The backend's hasPurchasedAccess flag alone isn't trusted because it can
  // come back stale/misconfigured (e.g. a cached "true" for an authenticated
  // user who never actually paid for THIS event). Being merely logged in is
  // not enough - purchase is per-event and must be locally verifiable.
  // Local proof keys (any one of these confirms ownership):
  //   • anonymousViewer_{id}     - set after successful anonymous payment
  //   • groupCode_{id}            - set after successful group payment
  //   • connekyt:purchased_{id}   - set after authenticated individual payment
  const hasPurchasedAccess = (() => {
    if (!selectedEvent.hasPurchasedAccess) return false;
    if (typeof window === 'undefined') return false;
    try {
      const id = selectedEvent.id;
      const hasAnonViewer = !!localStorage.getItem(`anonymousViewer_${id}`);
      const hasGroupCode = !!localStorage.getItem(`groupCode_${id}`);
      const hasAuthedPurchase = !!localStorage.getItem(`connekyt:purchased_${id}`);
      return hasAnonViewer || hasGroupCode || hasAuthedPurchase;
    } catch {
      return false;
    }
  })();
  const tags = getTagsArray(selectedEvent);
  const photographerName = getPhotographerName(selectedEvent);

  return (
    <>
      <AmoriaKNavbar />

      {/* ── GEO-RESTRICTION OVERLAY (cinematic) ── */}
      {/* Only show the geo-restriction overlay for UPCOMING events.
          Live / completed / cancelled events bypass the restriction since
          the pre-event purchase window has closed. */}
      {geoCheck && !geoCheck.allowed && !geoOverlayDismissed && isUpcoming && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(7, 8, 13, 0.78)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 24,
            fontFamily: "'Pragati Narrow', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(20,22,30,0.96) 0%, rgba(11,14,21,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 22,
              padding: 'clamp(28px, 5vw, 40px) clamp(22px, 4vw, 36px)',
              maxWidth: 440, width: '100%',
              textAlign: 'center',
              boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(31,107,255,0.08)',
              position: 'relative',
              color: '#f4f6fb',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setGeoOverlayDismissed(true)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#9ca3af', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 160ms ease, color 160ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9ca3af'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Icon */}
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(239,68,68,0.14)',
                border: '1px solid rgba(239,68,68,0.45)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: 'clamp(20px, 3.4vw, 24px)',
                fontWeight: 800,
                color: '#f4f6fb',
                margin: '0 0 10px',
                letterSpacing: '-0.015em',
              }}
            >
              Not available in your region
            </h2>

            <p
              style={{
                fontSize: 14,
                color: '#b8bdca',
                lineHeight: 1.6,
                margin: '0 auto 18px',
                maxWidth: 340,
              }}
            >
              The organizer has restricted access from your current location. You can still browse the event, but booking and payments are unavailable.
            </p>

            {/* Detected location pill */}
            {geoCheck.userCountry && (
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 999,
                  marginBottom: 22,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontSize: 13, color: '#b8bdca' }}>
                  Your location:{' '}
                  <strong style={{ color: '#f4f6fb', fontWeight: 700 }}>
                    {(() => {
                      const country = formatCountryName(geoCheck.userCountry);
                      const hasRealCity = geoCheck.userCity && geoCheck.userCity !== 'Unknown';
                      return hasRealCity ? `${geoCheck.userCity}, ${country}` : country;
                    })()}
                  </strong>
                </span>
              </div>
            )}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0 16px' }} />

            <p style={{ fontSize: 12.5, color: '#7d8294', lineHeight: 1.5, margin: 0 }}>
              If you believe this is an error, please contact the event organizer.
            </p>
          </div>
        </div>
      )}

      {/* ── CINEMATIC PAGE ── */}
      {(() => {
        // Derived UI helpers (computed inline so we can use scrollY/heroHeight from outer scope)
        const stickyT = Math.min(1, Math.max(0, (scrollY - heroHeight * 0.55) / Math.max(160, heroHeight * 0.25)));
        const heroParallax = Math.min(scrollY * 0.32, heroHeight * 0.6);
        const heroFade = Math.max(0, 1 - scrollY / Math.max(360, heroHeight * 0.85));

        const statusLabel: string = isLive ? tStatus('live')
          : isCompleted ? tStatus('completed')
          : isCancelled ? tStatus('cancelled')
          : tStatus('upcoming');
        const statusKey: 'live' | 'ended' | 'cancelled' | 'upcoming' =
          isLive ? 'live' : isCompleted ? 'ended' : isCancelled ? 'cancelled' : 'upcoming';
        const statusIcon: string = isLive ? 'bi-camera-video-fill'
          : isCompleted ? 'bi-check-circle-fill'
          : isCancelled ? 'bi-x-circle-fill'
          : 'bi-broadcast';

        type CTA = { label: string; sub?: string; icon: string; onClick: () => void; tone: 'live' | 'reserve' | 'owned' | 'ended' | 'cancelled' };
        const primaryCTA: CTA | null = (() => {
          if (isCancelled) return { label: 'Event cancelled', icon: 'bi-x-circle', onClick: () => {}, tone: 'cancelled' };
          if (isCompleted) return { label: 'Event ended', icon: 'bi-archive', onClick: () => {}, tone: 'ended' };
          if (isLive) {
            if (!isPaid) return { label: 'Watch live', icon: 'bi-play-circle-fill', onClick: () => { if (blockedByGeo()) return; window.location.href = `/user/events/join-event?id=${selectedEvent.id}`; }, tone: 'live' };
            if (hasPurchasedAccess) return { label: 'Start watching', icon: 'bi-play-circle-fill', onClick: () => { if (blockedByGeo()) return; window.location.href = `/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`; }, tone: 'live' };
            return { label: 'Buy access', sub: `${(selectedEvent.price || 0).toLocaleString()} ${selectedEvent.streamFeeCurrencyAbbreviation || 'RWF'}`, icon: 'bi-ticket-perforated-fill', onClick: () => handlePurchaseAccess(`/user/events/join-package?id=${selectedEvent.id}`), tone: 'live' };
          }
          if (isUpcoming) {
            if (!isPaid) return { label: 'Get notified', icon: 'bi-bell-fill', onClick: () => toggleSaved(), tone: 'reserve' };
            if (hasPurchasedAccess) return { label: 'Access reserved', icon: 'bi-check-circle-fill', onClick: () => {}, tone: 'owned' };
            return { label: 'Reserve your spot', sub: `${(selectedEvent.price || 0).toLocaleString()} ${selectedEvent.streamFeeCurrencyAbbreviation || 'RWF'}`, icon: 'bi-ticket-perforated-fill', onClick: () => handlePurchaseAccess(`/user/events/join-package?id=${selectedEvent.id}`), tone: 'reserve' };
          }
          return null;
        })();

        // Paid attendee on a live event = "Start watching" CTA gets the
        // strong join-pulse treatment (extra outer ring ripple) so it's
        // unmistakably the action they came back for.
        const isJoinNowState = isLive && hasPurchasedAccess && isPaid;

        const renderPrimaryCTA = (size: 'lg' | 'md' = 'lg', extraClass: string = '') => {
          if (!primaryCTA) return null;
          const ariaDisabled = primaryCTA.tone === 'ended' || primaryCTA.tone === 'cancelled' || primaryCTA.tone === 'owned';
          const pulseClass = isJoinNowState && primaryCTA.tone === 'live' ? ' ve-btn--joinpulse' : '';
          return (
            <button
              type="button"
              className={`ve-btn ve-btn--${primaryCTA.tone} ve-btn--${size}${pulseClass} ${extraClass}`}
              onClick={primaryCTA.onClick}
              disabled={ariaDisabled}
            >
              <i className={`bi ${primaryCTA.icon}`} aria-hidden="true" />
              <span className="ve-btn-label">{primaryCTA.label}</span>
              {primaryCTA.sub && <span className="ve-btn-sub">{primaryCTA.sub}</span>}
            </button>
          );
        };

        return (
          <>
            {/* Sticky title rail - fades in past hero */}
            <div
              className={`ve-sticky ${stickyT > 0.05 ? 'is-on' : ''}`}
              style={{ opacity: stickyT, pointerEvents: stickyT > 0.4 ? 'auto' : 'none', transform: `translateY(${(1 - stickyT) * -24}px)` }}
              aria-hidden={stickyT < 0.4}
            >
              <div className="ve-sticky-inner">
                <button className="ve-sticky-back" onClick={() => window.history.back()} aria-label="Go back">
                  <i className="bi bi-chevron-left" aria-hidden="true" />
                </button>
                <div className="ve-sticky-poster" style={{ backgroundImage: `url("${eventImage}")` }} aria-hidden="true" />
                <div className="ve-sticky-info">
                  <strong className="ve-sticky-title">{selectedEvent.title}</strong>
                  <small className="ve-sticky-meta">
                    <span className={`ve-sticky-dot ve-sticky-dot--${statusKey}`} aria-hidden="true" />
                    {statusLabel} · {formatDate(selectedEvent.eventDate)}
                  </small>
                </div>
                {/* Verify-access shortcut in the sticky ribbon - always shown
                    beside the primary CTA (same as the hero) so users who
                    scrolled past can recover prior access without scrolling
                    back up. */}
                <button
                  type="button"
                  className="ve-btn ve-btn--verify ve-btn--md ve-sticky-verify"
                  onClick={() => { setVaError(null); setShowViewerAuth(true); }}
                  aria-label="Already paid? Verify access"
                >
                  <i className="bi bi-shield-fill-check" aria-hidden="true" />
                  <span className="ve-btn-label">Already paid?</span>
                </button>
                {primaryCTA && renderPrimaryCTA('md', 've-sticky-cta')}
              </div>
            </div>

            <main className="ve-page">
              {/* HERO */}
              <section className="ve-hero" ref={heroRef} style={{ ['--hero-img' as string]: `url("${eventImage}")` }}>
                <div className="ve-hero-bg" style={{ backgroundImage: `url("${eventImage}")`, transform: `translate3d(0, ${heroParallax}px, 0) scale(${1 + Math.min(scrollY * 0.0003, 0.08)})` }} aria-hidden="true" />
                <div className="ve-hero-veil" aria-hidden="true" />
                <div className="ve-hero-veil-side" aria-hidden="true" />
                <div className="ve-hero-grain" aria-hidden="true" />
                <div className="ve-hero-fade" aria-hidden="true" />

                {/* Top action rail */}
                <div className="ve-hero-top">
                  <button className="ve-glass-btn" onClick={() => window.history.back()} aria-label="Go back">
                    <i className="bi bi-chevron-left" aria-hidden="true" />
                  </button>
                  <div className="ve-hero-top-spacer" />
                  <button className={`ve-glass-btn ${shareCopied ? 'is-confirmed' : ''}`} onClick={handleShare} aria-label="Share event">
                    <i className={shareCopied ? 'bi bi-check-lg' : 'bi bi-share'} aria-hidden="true" />
                  </button>
                  <button
                    className={`ve-glass-btn ${isSaved ? 'is-saved' : ''}`}
                    onClick={toggleSaved}
                    aria-label={isSaved ? 'Remove from saved' : 'Save event'}
                    aria-pressed={isSaved}
                  >
                    <i className={isSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'} aria-hidden="true" />
                  </button>
                </div>

                {/* Top-center floating countdown banner - visually anchors
                    upcoming events above the hero. Positioned just below the
                    navbar so it stays clearly readable over any backdrop. */}
                {isUpcoming && showCountdown && msUntilStart !== null && (() => {
                  const { days, hours, minutes, seconds } = getCountdownParts(msUntilStart);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  return (
                    <div className="ve-hero-countdown" role="timer" aria-live="polite" aria-atomic="true">
                      <span className="ve-hero-countdown-eyebrow">
                        <i className="bi bi-hourglass-split" aria-hidden="true" />
                        Starts in
                      </span>
                      <div className="ve-hero-countdown-grid">
                        {days > 0 && (
                          <div className="ve-hero-countdown-cell">
                            <strong>{pad(days)}</strong>
                            <span>day{days === 1 ? '' : 's'}</span>
                          </div>
                        )}
                        <div className="ve-hero-countdown-cell">
                          <strong>{pad(hours)}</strong>
                          <span>hr</span>
                        </div>
                        <div className="ve-hero-countdown-cell">
                          <strong>{pad(minutes)}</strong>
                          <span>min</span>
                        </div>
                        <div className="ve-hero-countdown-cell">
                          <strong>{pad(seconds)}</strong>
                          <span>sec</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Hero body */}
                <div className="ve-hero-body" style={{ opacity: 0.35 + heroFade * 0.65, transform: `translateY(${(1 - heroFade) * 24}px)` }}>
                  <div className="ve-hero-chips">
                    <span className={`ve-status-pill ve-status-pill--${statusKey}`}>
                      {isLive && <span className="ve-pulse" aria-hidden="true" />}
                      <i className={`bi ${statusIcon}`} aria-hidden="true" />
                      {isLive ? 'Happening now' : statusLabel}
                    </span>
                    <span className="ve-eyebrow-cat">{getCategoryName(selectedEvent)}</span>
                  </div>

                  <h1 className="ve-hero-title">{selectedEvent.title}</h1>

                  {selectedEvent.description && (
                    <p className="ve-hero-tagline">
                      {selectedEvent.description.length > 180
                        ? `${selectedEvent.description.slice(0, 180)}…`
                        : selectedEvent.description}
                    </p>
                  )}

                  <div className="ve-hero-quick">
                    <span><i className="bi bi-calendar-event" aria-hidden="true" /> {formatDate(selectedEvent.eventDate)}</span>
                    <span className="ve-hero-quick-sep" aria-hidden="true">·</span>
                    <span><i className="bi bi-clock" aria-hidden="true" /> {formatTimeRange(selectedEvent.startTime, selectedEvent.endTime)}</span>
                    <span className="ve-hero-quick-sep" aria-hidden="true">·</span>
                    <span><i className="bi bi-geo-alt" aria-hidden="true" /> {selectedEvent.location || 'TBD'}</span>
                    {selectedEvent.maxGuests && selectedEvent.maxGuests > 0 && (
                      <>
                        <span className="ve-hero-quick-sep" aria-hidden="true">·</span>
                        <span><i className="bi bi-people" aria-hidden="true" /> {selectedEvent.maxGuests.toLocaleString()} {t('people')}</span>
                      </>
                    )}
                  </div>

                  <div className="ve-hero-cta-row">
                    {primaryCTA && renderPrimaryCTA('lg')}
                    {/* Always pair the primary CTA with the verify-access
                        button (replaces the old More-info button) so anyone
                        who already paid can recover access from the same row. */}
                    <button
                      type="button"
                      className="ve-btn ve-btn--verify ve-btn--lg"
                      onClick={() => { setVaError(null); setShowViewerAuth(true); }}
                    >
                      <i className="bi bi-shield-fill-check" aria-hidden="true" />
                      <span className="ve-btn-label">Already paid? Verify access</span>
                    </button>
                  </div>

                  {/* Group invite-code redemption surfaced right next to the
                      primary CTAs so a viewer who was sent a shared code can
                      redeem from the hero without scrolling to the ticket
                      card. Matches the same condition as the duplicate that
                      used to live inside the aside (paid + live + not yet
                      purchased). */}
                  {isPaid && !hasPurchasedAccess && isLive && (
                    <div className="ve-hero-group">
                      <div className="ve-hero-group-h">
                        <i className="bi bi-ticket-detailed" aria-hidden="true" />
                        Have a group invite code?
                      </div>
                      <div className="ve-hero-group-row">
                        <input
                          type="text"
                          value={groupCode}
                          onChange={e => { setGroupCode(e.target.value); setGroupCodeError(''); }}
                          onKeyDown={e => { if (e.key === 'Enter' && groupCode.trim()) handleGroupCodeSubmit(); }}
                          placeholder="Enter code"
                          className={`ve-input ${groupCodeError ? 'is-error' : ''}`}
                          aria-label="Group invite code"
                        />
                        <button
                          type="button"
                          onClick={handleGroupCodeSubmit}
                          disabled={groupCodeLoading || !groupCode.trim()}
                          className="ve-btn ve-btn--reserve ve-btn--md"
                        >
                          {groupCodeLoading ? '…' : 'Redeem'}
                        </button>
                      </div>
                      {groupCodeError && <span className="ve-msg ve-msg--err">{groupCodeError}</span>}
                    </div>
                  )}
                </div>

              </section>

              {/* ── LIVE-NOW RIBBON for paid attendees ──
                  Surfaces between the hero and the body when the event is
                  live AND the viewer has access. Carries the celebratory
                  "you're in" message + a countdown auto-redirect (which
                  the viewer can cancel) + a manual "Join now" CTA. After
                  cancellation the ribbon stays as a quiet reminder. */}
              {showLiveRibbon && hasPurchasedAccess && (
                <div className={`ve-livenow ${autoJoinDismissed ? 'is-dismissed' : ''}`} role="region" aria-label="Live event ready to join">
                  <div className="ve-livenow-inner">
                    <div className="ve-livenow-pulse" aria-hidden="true">
                      <span className="ve-livenow-dot" />
                      <span className="ve-livenow-ring" />
                      <span className="ve-livenow-ring ve-livenow-ring--2" />
                    </div>
                    <div className="ve-livenow-text">
                      <strong className="ve-livenow-headline">
                        <span className="ve-livenow-tag">LIVE NOW</span>
                        <span>The event is happening. You&apos;re in!</span>
                      </strong>
                      {autoJoinSeconds !== null && !autoJoinDismissed ? (
                        <small className="ve-livenow-sub">
                          Joining the stream in <strong className="ve-livenow-counter">{autoJoinSeconds}s</strong>…
                        </small>
                      ) : (
                        <small className="ve-livenow-sub">
                          Tap <strong>Join now</strong> when you&apos;re ready. Your access is confirmed.
                        </small>
                      )}
                    </div>
                    <div className="ve-livenow-actions">
                      {autoJoinSeconds !== null && !autoJoinDismissed && (
                        <button
                          type="button"
                          className="ve-livenow-cancel"
                          onClick={cancelAutoJoin}
                          aria-label="Stay on this page and cancel auto-join"
                        >
                          Stay on page
                        </button>
                      )}
                      <button
                        type="button"
                        className="ve-livenow-cta"
                        onClick={joinLiveNow}
                        aria-label="Join the live stream now"
                      >
                        <i className="bi bi-broadcast" aria-hidden="true" />
                        Join now
                        <i className="bi bi-arrow-right" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BODY */}
              <div className="ve-body">
                <div className="ve-body-grid">
                  <div className="ve-main-col">
                    <article className="ve-card">
                      <header className="ve-card-head">
                        <span className="ve-card-tag" aria-hidden="true" />
                        <h2 className="ve-card-h">About this event</h2>
                      </header>
                      <div className={`ve-about ${descExpanded ? 'is-open' : ''}`}>
                        {selectedEvent.description ? (
                          <p className="ve-about-text">{selectedEvent.description}</p>
                        ) : (
                          <p className="ve-about-text ve-about-text--placeholder">No description provided yet. Check back soon.</p>
                        )}
                        {selectedEvent.description && selectedEvent.description.length > 320 && (
                          <button type="button" className="ve-readmore" onClick={() => setDescExpanded(v => !v)}>
                            {descExpanded ? 'Show less' : 'Read more'}
                            <i className={descExpanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      {tags.length > 0 && (
                        <div className="ve-tags">
                          {tags.slice(0, 8).map((tag, i) => (
                            <span key={i} className="ve-tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </article>

                    <div className="ve-highlights">
                      <div className="ve-highlight">
                        <span className="ve-highlight-ico"><i className="bi bi-broadcast-pin" aria-hidden="true" /></span>
                        <strong>HD live stream</strong>
                        <small>Watch in full quality from any device, anywhere in the world.</small>
                      </div>
                      <div className="ve-highlight">
                        <span className="ve-highlight-ico"><i className="bi bi-people-fill" aria-hidden="true" /></span>
                        <strong>Watch as a group</strong>
                        <small>One ticket, multiple viewers. Share a single invite code with friends and family.</small>
                      </div>
                      <div className="ve-highlight">
                        <span className="ve-highlight-ico"><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /></span>
                        <strong>48-hour replay</strong>
                        <small>Re-watch the full event for two days after it ends, no extra charge.</small>
                      </div>
                    </div>

                    <article className="ve-card">
                      <header className="ve-card-head">
                        <span className="ve-card-tag" aria-hidden="true" />
                        <h2 className="ve-card-h">Hosts &amp; crew</h2>
                      </header>
                      <div className="ve-hosts-grid">
                        <div className="ve-host">
                          <div className="ve-host-av ve-host-av--organizer">
                            <i className="bi bi-mic-fill" aria-hidden="true" />
                          </div>
                          <div className="ve-host-info">
                            <span className="ve-host-role">{t('organizedBy')}</span>
                            <strong>{selectedEvent.eventOrganizer || 'TBD'}</strong>
                            <small>Event organizer</small>
                          </div>
                        </div>
                        {photographerName && (
                          <div className="ve-host">
                            <div className="ve-host-av">
                              {selectedEvent.photographer?.profilePicture
                                ? <img src={selectedEvent.photographer.profilePicture} alt={photographerName} />
                                : <i className="bi bi-camera-fill" aria-hidden="true" />}
                            </div>
                            <div className="ve-host-info">
                              <span className="ve-host-role">Photographer</span>
                              <strong>{photographerName}</strong>
                              <small>Capturing the moment</small>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>

                    {/* Wishes */}
                    {isUpcoming && (
                      <article className="ve-card ve-wishes" id="wishes">
                        <header className="ve-card-head ve-wishes-head">
                          <span className="ve-card-tag" aria-hidden="true" />
                          <div>
                            <h2 className="ve-card-h">
                              <i className="bi bi-chat-heart-fill ve-wishes-ico" aria-hidden="true" />
                              Send a wish to the organizer
                            </h2>
                            <p className="ve-wishes-sub">Your message, typed or recorded, will appear on screen during the event.</p>
                          </div>
                        </header>
                        <div className="ve-wishes-grid">
                          <input
                            type="text"
                            value={wishName}
                            onChange={(e) => { setWishName(e.target.value); setWishError(null); }}
                            placeholder="Your name"
                            disabled={wishLoading}
                            className="ve-input"
                          />
                          <input
                            type="email"
                            value={wishEmail}
                            onChange={(e) => { setWishEmail(e.target.value); setWishError(null); }}
                            placeholder="Email"
                            disabled={wishLoading}
                            className="ve-input"
                          />
                        </div>
                        <textarea
                          value={wishMessage}
                          onChange={(e) => { setWishMessage(e.target.value); setWishError(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && wishMessage.trim()) handleSendTextWish(); }}
                          placeholder="Write your message…  (Ctrl/⌘ + Enter to send)"
                          disabled={wishLoading}
                          rows={3}
                          className="ve-input ve-textarea"
                        />
                        <div className="ve-wishes-actions">
                          <button
                            type="button"
                            onClick={() => {
                              if (!wishName.trim() || !wishEmail.trim()) {
                                setWishError('Please enter your name and email first.');
                                return;
                              }
                              setWishError(null);
                              setShowWishVideoRecorder(true);
                            }}
                            disabled={wishLoading}
                            className="ve-btn ve-btn--ghost ve-btn--md"
                          >
                            <i className="bi bi-camera-video-fill" aria-hidden="true" />
                            <span className="ve-btn-label">Record video</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSendTextWish}
                            disabled={wishLoading || !wishMessage.trim()}
                            className="ve-btn ve-btn--reserve ve-btn--md"
                          >
                            <i className="bi bi-send-fill" aria-hidden="true" />
                            <span className="ve-btn-label">{wishLoading ? 'Sending…' : 'Send wish'}</span>
                          </button>
                        </div>
                        {wishError && (
                          <p className="ve-msg ve-msg--err">
                            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />{wishError}
                          </p>
                        )}
                        {wishSuccess && (
                          <p className="ve-msg ve-msg--ok">
                            <i className="bi bi-check-circle-fill" aria-hidden="true" />{wishSuccess}
                          </p>
                        )}
                      </article>
                    )}
                  </div>

                  {/* Sticky sidebar */}
                  <aside className="ve-side" ref={ticketRef}>
                    <div className="ve-ticket">
                      <div className="ve-ticket-status-row">
                        <span className={`ve-ticket-status ve-ticket-status--${statusKey}`}>
                          {isLive && <span className="ve-pulse" aria-hidden="true" />}
                          <i className={`bi ${statusIcon}`} aria-hidden="true" />
                          {statusLabel}
                        </span>
                        {hasPurchasedAccess && (
                          <span className="ve-ticket-owned">
                            <i className="bi bi-patch-check-fill" aria-hidden="true" />
                            Access owned
                          </span>
                        )}
                      </div>

                      {/* Live countdown card - show big days/hrs/min/sec for upcoming */}
                      {isUpcoming && showCountdown && msUntilStart !== null && (() => {
                        const { days, hours, minutes, seconds } = getCountdownParts(msUntilStart);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        return (
                          <div className="ve-countdown-card">
                            <small>Starts in</small>
                            <div className="ve-countdown-grid">
                              {days > 0 && (
                                <div className="ve-countdown-cell">
                                  <strong>{pad(days)}</strong>
                                  <span>day{days === 1 ? '' : 's'}</span>
                                </div>
                              )}
                              <div className="ve-countdown-cell">
                                <strong>{pad(hours)}</strong>
                                <span>hr</span>
                              </div>
                              <div className="ve-countdown-cell">
                                <strong>{pad(minutes)}</strong>
                                <span>min</span>
                              </div>
                              <div className="ve-countdown-cell">
                                <strong>{pad(seconds)}</strong>
                                <span>sec</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {isPaid && (
                        <div className={`ve-ticket-price ${isCompleted || isCancelled ? 'is-dim' : ''}`}>
                          <small>{hasPurchasedAccess ? 'Your access' : isCompleted ? 'Sales closed' : isCancelled ? 'Event cancelled' : 'From'}</small>
                          <div className="ve-ticket-price-row">
                            <span className="ve-ticket-price-num">{(selectedEvent.price || 0).toLocaleString()}</span>
                            <span className="ve-ticket-price-cur">{selectedEvent.streamFeeCurrencyAbbreviation || 'RWF'}</span>
                          </div>
                        </div>
                      )}

                      {!isPaid && (
                        <div className="ve-ticket-price ve-ticket-price--free">
                          <span className="ve-ticket-price-free">Free entry</span>
                          <small>No purchase required</small>
                        </div>
                      )}

                      <div className="ve-ticket-meta">
                        <div className="ve-ticket-row">
                          <i className="bi bi-calendar-event" aria-hidden="true" />
                          <div>
                            <span>Date</span>
                            <strong>{formatDate(selectedEvent.eventDate)}</strong>
                          </div>
                        </div>
                        <div className="ve-ticket-row">
                          <i className="bi bi-clock" aria-hidden="true" />
                          <div>
                            <span>Time</span>
                            <strong>{formatTimeRange(selectedEvent.startTime, selectedEvent.endTime)}</strong>
                          </div>
                        </div>
                        <div className="ve-ticket-row">
                          <i className="bi bi-geo-alt" aria-hidden="true" />
                          <div>
                            <span>Venue</span>
                            <strong>{selectedEvent.location || 'TBD'}</strong>
                          </div>
                        </div>
                        <div className="ve-ticket-row">
                          <i className="bi bi-people" aria-hidden="true" />
                          <div>
                            <span>Capacity</span>
                            <strong>{selectedEvent.maxGuests && selectedEvent.maxGuests > 0 ? `${selectedEvent.maxGuests.toLocaleString()} ${t('people')}` : 'Unlimited'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="ve-ticket-cta">
                        {primaryCTA && renderPrimaryCTA('lg', 've-btn--block')}

                        {/* PROMINENT verify-access CTA - visible for paid UPCOMING & LIVE
                            events when the user hasn't purchased yet. Equal weight to the
                            primary "Buy Access" so users with prior payment can recover
                            their access from the same surface. */}
                        {isPaid && !hasPurchasedAccess && (isUpcoming || isLive) && (
                          <button
                            type="button"
                            className="ve-btn ve-btn--verify ve-btn--lg ve-btn--block"
                            onClick={() => { setVaError(null); setShowViewerAuth(true); }}
                          >
                            <i className="bi bi-shield-fill-check" aria-hidden="true" />
                            <span className="ve-btn-label">Already paid? Verify access</span>
                          </button>
                        )}

                        {(isLive || isUpcoming) && hasPurchasedAccess && savedGroupCode && (
                          <button
                            type="button"
                            className="ve-btn ve-btn--ghost ve-btn--md ve-btn--block"
                            onClick={() => { setGroupCodeCopied(false); setShowGroupCodeView(true); }}
                          >
                            <i className="bi bi-people-fill" aria-hidden="true" />
                            <span className="ve-btn-label">Share group code</span>
                          </button>
                        )}
                      </div>

                      <div className="ve-ticket-trust">
                        <span><i className="bi bi-shield-check" aria-hidden="true" /> Secure</span>
                        <span><i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refundable</span>
                        <span><i className="bi bi-headset" aria-hidden="true" /> 24/7 support</span>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>

              <footer className="ve-foot">
                <p>© {new Date().getFullYear()} Connekyt · Stream what matters.</p>
              </footer>
            </main>

            {/* Mobile bottom dock */}
            {primaryCTA && (
              <div className="ve-dock" role="region" aria-label="Event actions">
                {isPaid && !hasPurchasedAccess && primaryCTA.tone !== 'ended' && primaryCTA.tone !== 'cancelled' && (
                  <div className="ve-dock-price">
                    <small>From</small>
                    <strong>{(selectedEvent.price || 0).toLocaleString()} <span>{selectedEvent.streamFeeCurrencyAbbreviation || 'RWF'}</span></strong>
                  </div>
                )}
                <div className="ve-dock-cta-wrap">
                  {renderPrimaryCTA('md', 've-btn--block')}
                </div>
              </div>
            )}

            {/* Share-copied toast */}
            {shareCopied && (
              <div className="ve-toast" role="status">
                <i className="bi bi-check-circle-fill" aria-hidden="true" />
                Link copied. Share it anywhere.
              </div>
            )}

            {/* Scoped cinematic styles */}
            <style jsx global>{`
              :root {
                --ve-bg: #07080d;
                --ve-bg-2: #0c0e15;
                --ve-bg-3: #11141d;
                --ve-card: rgba(255,255,255,0.045);
                --ve-line: rgba(255,255,255,0.07);
                --ve-line-strong: rgba(255,255,255,0.14);
                --ve-text: #f4f6fb;
                --ve-text-soft: #b8bdca;
                --ve-text-mute: #7d8294;
                --ve-brand: #083A85;
                --ve-brand-2: #1f6bff;
                --ve-brand-soft: rgba(8,58,133,0.14);
                --ve-live: #10b981;
                --ve-amber: #f59e0b;
                --ve-red: #ef4444;
              }

              body { background: var(--ve-bg); }
              .ve-page {
                font-family: 'Pragati Narrow', system-ui, -apple-system, 'Segoe UI', sans-serif;
                color: var(--ve-text);
                background:
                  radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.18) 0%, rgba(8,58,133,0) 60%),
                  linear-gradient(180deg, var(--ve-bg) 0%, var(--ve-bg-2) 60%, var(--ve-bg-3) 100%);
                min-height: 100vh;
                padding-bottom: 140px;
              }
              @media (min-width: 769px) { .ve-page { padding-bottom: 80px; } }

              /* Sticky title rail */
              .ve-sticky {
                position: fixed;
                top: 64px; left: 0; right: 0;
                z-index: 40;
                transition: opacity 220ms ease, transform 220ms ease;
              }
              .ve-sticky-inner {
                max-width: 1240px;
                margin: 12px auto 0;
                background: rgba(7,8,13,0.78);
                backdrop-filter: blur(20px) saturate(160%);
                -webkit-backdrop-filter: blur(20px) saturate(160%);
                border: 1px solid var(--ve-line-strong);
                border-radius: 16px;
                padding: 8px 10px 8px 8px;
                display: flex; align-items: center; gap: 12px;
                box-shadow: 0 16px 50px rgba(0,0,0,0.55);
              }
              .ve-sticky-back { width: 40px; height: 40px; border-radius: 12px; flex: none; background: rgba(255,255,255,0.06); border: 1px solid var(--ve-line); color: var(--ve-text); font-size: 16px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 160ms ease; }
              .ve-sticky-back:hover { background: rgba(255,255,255,0.10); }
              .ve-sticky-poster { width: 48px; height: 48px; flex: none; border-radius: 10px; background: #1a1d28 50% 50% / cover no-repeat; border: 1px solid var(--ve-line); }
              .ve-sticky-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
              .ve-sticky-title { font-size: 15px; font-weight: 800; color: var(--ve-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
              .ve-sticky-meta { font-size: 12px; color: var(--ve-text-mute); display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .ve-sticky-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--ve-text-mute); flex: none; }
              .ve-sticky-dot--live { background: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.40); }
              .ve-sticky-dot--upcoming { background: var(--ve-brand-2); }
              .ve-sticky-dot--ended { background: var(--ve-red); box-shadow: 0 0 0 3px rgba(239,68,68,0.25); }
              .ve-sticky-dot--cancelled { background: var(--ve-red); }
              /* Both action buttons must hold their own width. ve-btn--verify
                 sets overflow:hidden for the animated gradient border, so any
                 flex-shrink against them clips the label mid-character (saw
                 "Already p…"). flex:none keeps the label intact and lets the
                 .ve-sticky-info column truncate first instead. */
              .ve-sticky-verify, .ve-sticky-cta { flex: none; }
              @media (max-width: 720px) {
                .ve-sticky-inner { margin: 8px 12px 0; padding: 6px 8px 6px 6px; gap: 10px; }
                .ve-sticky-poster { width: 40px; height: 40px; }
                .ve-sticky-title { font-size: 14px; }
                .ve-sticky-meta { font-size: 11px; }
              }
              /* On narrow viewports the row gets crowded: drop the poster and
                 collapse verify-access to icon-only so the primary CTA + back
                 + title still have room to breathe. */
              @media (max-width: 560px) {
                .ve-sticky-poster { display: none; }
                .ve-sticky-verify { padding: 11px 12px; }
                .ve-sticky-verify .ve-btn-label { display: none; }
              }

              /* Hero */
              .ve-hero {
                position: relative;
                min-height: clamp(560px, calc(100vh - 64px), 820px);
                display: flex; flex-direction: column;
                overflow: hidden;
                isolation: isolate;
              }
              .ve-hero-bg { position: absolute; inset: -10% 0 0; background-size: cover; background-position: center; will-change: transform; z-index: 0; }
              .ve-hero-veil {
                position: absolute; inset: 0; z-index: 1;
                background: linear-gradient(180deg, rgba(7,8,13,0.55) 0%, rgba(7,8,13,0.15) 22%, rgba(7,8,13,0.20) 50%, rgba(7,8,13,0.85) 88%, var(--ve-bg) 100%);
              }
              .ve-hero-veil-side {
                position: absolute; inset: 0; z-index: 2;
                background:
                  radial-gradient(120% 80% at 0% 100%, rgba(8,58,133,0.55) 0%, rgba(8,58,133,0) 55%),
                  radial-gradient(80% 60% at 100% 0%, rgba(31,107,255,0.18) 0%, rgba(0,0,0,0) 60%);
                mix-blend-mode: screen;
              }
              .ve-hero-grain {
                position: absolute; inset: 0; z-index: 3; pointer-events: none;
                opacity: 0.18;
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
                mix-blend-mode: overlay;
              }
              .ve-hero-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 30%; background: linear-gradient(180deg, rgba(7,8,13,0) 0%, var(--ve-bg) 92%); z-index: 4; pointer-events: none; }

              .ve-hero-top { position: relative; z-index: 6; display: flex; align-items: center; gap: 10px; padding: clamp(20px, 2.5vh, 32px) clamp(20px, 4vw, 48px) 0; }
              .ve-hero-top-spacer { flex: 1; }
              .ve-glass-btn { width: 44px; height: 44px; border-radius: 14px; background: rgba(7,8,13,0.55); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%); border: 1px solid var(--ve-line-strong); color: var(--ve-text); font-size: 17px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 160ms ease, transform 160ms ease; }
              .ve-glass-btn:hover { background: rgba(7,8,13,0.78); transform: translateY(-1px); }
              .ve-glass-btn.is-saved { color: var(--ve-amber); border-color: rgba(245,158,11,0.55); background: rgba(245,158,11,0.10); }
              .ve-glass-btn.is-confirmed { color: var(--ve-live); border-color: rgba(16,185,129,0.55); background: rgba(16,185,129,0.10); }

              .ve-hero-body { position: relative; z-index: 6; margin-top: auto; padding: 0 clamp(20px, 4vw, 48px) clamp(32px, 4vh, 44px); max-width: 1240px; width: 100%; align-self: center; will-change: opacity, transform; }
              .ve-hero-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: clamp(12px, 1.5vw, 16px); }
              .ve-status-pill { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase; background: rgba(7,8,13,0.78); backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%); border: 1px solid rgba(255,255,255,0.22); color: #ffffff; box-shadow: 0 4px 16px -4px rgba(0,0,0,0.55); }
              .ve-status-pill--live { background: linear-gradient(135deg, rgba(239,68,68,0.92) 0%, rgba(220,38,38,0.92) 100%); border-color: rgba(255,255,255,0.30); color: #ffffff; box-shadow: 0 6px 18px -4px rgba(220,38,38,0.55); }
              .ve-status-pill--upcoming { background: rgba(31,107,255,0.55); border-color: rgba(255,255,255,0.30); color: #ffffff; }
              .ve-status-pill--ended { background: rgba(239,68,68,0.78); border-color: rgba(255,255,255,0.28); color: #ffffff; }
              .ve-status-pill--cancelled { background: rgba(239,68,68,0.78); border-color: rgba(255,255,255,0.28); color: #ffffff; }
              .ve-pulse { width: 8px; height: 8px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 0 rgba(255,255,255,0.7); animation: vePulse 1.6s ease-out infinite; flex: none; }
              @keyframes vePulse { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); } 70% { box-shadow: 0 0 0 8px rgba(255,255,255,0); } 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); } }
              /* Used by Google login button + the auth modal loading spinners */
              @keyframes authSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              .ve-countdown { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 999px; background: rgba(245,158,11,0.13); border: 1px solid rgba(245,158,11,0.55); color: #fbbf77; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; font-variant-numeric: tabular-nums; }

              /* ── Top-center floating countdown banner ─────────────────
                 Sits just below the navbar, horizontally centered. Visible
                 above the entire hero. Amber gradient + cell grid for
                 clarity. */
              .ve-hero-countdown {
                position: absolute;
                top: clamp(24px, 3vh, 36px);
                left: 50%;
                transform: translateX(-50%);
                z-index: 7;
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 12px 20px 14px;
                border-radius: 18px;
                background: linear-gradient(180deg, rgba(245,158,11,0.30) 0%, rgba(245,158,11,0.18) 100%);
                border: 1px solid rgba(245,158,11,0.65);
                backdrop-filter: blur(18px) saturate(160%);
                -webkit-backdrop-filter: blur(18px) saturate(160%);
                box-shadow:
                  0 12px 32px -8px rgba(245,158,11,0.45),
                  0 4px 14px rgba(0,0,0,0.45),
                  inset 0 1px 0 rgba(255,255,255,0.18);
                max-width: calc(100% - 24px);
              }
              .ve-hero-countdown-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: #fde68a;
              }
              .ve-hero-countdown-eyebrow i { font-size: 12px; color: #fbbf24; }
              .ve-hero-countdown-grid {
                display: grid;
                grid-auto-flow: column;
                grid-auto-columns: minmax(58px, 1fr);
                gap: 8px;
              }
              .ve-hero-countdown-cell {
                display: flex; flex-direction: column; align-items: center;
                padding: 8px 6px 6px;
                background: rgba(7,8,13,0.62);
                border: 1px solid rgba(245,158,11,0.40);
                border-radius: 12px;
                min-width: 56px;
              }
              .ve-hero-countdown-cell strong {
                font-size: clamp(22px, 2.4vw, 28px);
                font-weight: 900;
                color: #ffffff;
                line-height: 1;
                letter-spacing: -0.025em;
                font-variant-numeric: tabular-nums;
                text-shadow: 0 2px 12px rgba(245,158,11,0.45);
              }
              .ve-hero-countdown-cell span {
                font-size: 9.5px;
                color: #fbbf77;
                text-transform: uppercase;
                letter-spacing: 0.10em;
                font-weight: 800;
                margin-top: 4px;
              }
              /* Mobile - drop the banner BELOW the top action rail (back +
                 share + save buttons at top: 76-88px, height ~44px) so they
                 don't share the same horizontal lane and overlap. */
              @media (max-width: 700px) {
                .ve-hero-countdown {
                  padding: 10px 14px 12px;
                  gap: 6px;
                  top: clamp(80px, 10vh, 100px);
                }
                .ve-hero-countdown-grid { grid-auto-columns: minmax(48px, 1fr); gap: 6px; }
                .ve-hero-countdown-cell { padding: 6px 4px 4px; min-width: 46px; }
                .ve-hero-countdown-cell strong { font-size: 20px; }
                .ve-hero-countdown-cell span { font-size: 9px; }
                .ve-hero-countdown-eyebrow { font-size: 10px; letter-spacing: 0.12em; }
              }
              .ve-eyebrow-cat { display: inline-flex; align-items: center; padding: 7px 14px; border-radius: 999px; background: rgba(7,8,13,0.78); backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%); border: 1px solid rgba(255,255,255,0.22); color: #ffffff; font-size: 12px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase; box-shadow: 0 4px 16px -4px rgba(0,0,0,0.55); }
              .ve-hero-title { font-size: clamp(34px, 5.5vw, 64px); font-weight: 800; line-height: 1.04; letter-spacing: -0.025em; margin: 0 0 12px; color: #fff; max-width: min(900px, 90%); text-shadow: 0 8px 40px rgba(0,0,0,0.55); }
              .ve-hero-tagline { font-size: clamp(14px, 1.4vw, 17px); line-height: 1.5; color: var(--ve-text-soft); margin: 0 0 16px; max-width: 720px; }
              .ve-hero-quick { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; color: var(--ve-text-soft); font-size: 14px; margin-bottom: 20px; }
              .ve-hero-quick > span { display: inline-flex; align-items: center; gap: 7px; }
              .ve-hero-quick i { color: var(--ve-brand-2); font-size: 15px; }
              .ve-hero-quick-sep { color: var(--ve-text-mute); }
              .ve-hero-cta-row { display: flex; flex-wrap: wrap; gap: 12px; }
              /* Hero-level group invite-code panel (promoted from the ticket
                 aside). Sits directly under the Buy/Verify CTA row so a
                 viewer who arrived with a shared code can redeem without
                 hunting the page. Glassmorphism amber-tinted card mirrors
                 the ticket card aesthetic. */
              .ve-hero-group {
                display: flex; flex-direction: column; gap: 10px;
                margin-top: 14px;
                padding: 12px 14px;
                max-width: 540px;
                background: rgba(7,8,13,0.55);
                backdrop-filter: blur(14px) saturate(160%);
                -webkit-backdrop-filter: blur(14px) saturate(160%);
                border: 1px dashed rgba(245,158,11,0.45);
                border-radius: 14px;
                box-shadow: 0 8px 22px -10px rgba(0,0,0,0.55);
              }
              .ve-hero-group-h {
                display: flex; align-items: center; gap: 8px;
                font-size: 12px; font-weight: 800; letter-spacing: 0.06em;
                text-transform: uppercase; color: #FDE68A;
              }
              .ve-hero-group-h i { color: var(--ve-amber); font-size: 14px; }
              .ve-hero-group-row { display: flex; gap: 8px; }
              .ve-hero-group-row .ve-input { flex: 1; min-width: 0; }
              @media (max-width: 560px) {
                .ve-hero-group { max-width: 100%; }
              }
              /* On phones the hero compresses enough that the body's status
                 pills can ride up against the top action rail (back / share /
                 bookmark). Add a guaranteed gap via min-height on the body
                 spacer so the rail can never collide with HAPPENING NOW. */
              @media (max-width: 700px) { .ve-hero { min-height: 88vh; } .ve-hero-top { padding-top: 28px; padding-bottom: 12px; } .ve-hero-body { padding-top: 80px; padding-bottom: 110px; } }

              /* Buttons */
              .ve-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; font-family: inherit; font-weight: 700; letter-spacing: 0.01em; border-radius: 14px; border: 1px solid transparent; cursor: pointer; transition: transform 140ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease; white-space: nowrap; }
              .ve-btn:disabled { cursor: not-allowed; }
              .ve-btn-label { font-weight: 700; }
              .ve-btn-sub { font-size: 15px; opacity: 0.95; font-weight: 800; padding-left: 9px; border-left: 1.5px solid rgba(255,255,255,0.35); letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
              .ve-btn--lg { padding: 15px 26px; font-size: 15px; }
              .ve-btn--md { padding: 11px 18px; font-size: 13.5px; }
              .ve-btn--block { width: 100%; }
              .ve-btn--live { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; border-color: rgba(255,255,255,0.18); box-shadow: 0 12px 36px -10px rgba(220,38,38,0.55), inset 0 1px 0 rgba(255,255,255,0.18); position: relative; }
              .ve-btn--live:hover:not(:disabled) { transform: translateY(-1.5px); box-shadow: 0 18px 40px -8px rgba(220,38,38,0.65); background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); }

              /* Strong "join now" pulse for paid attendees on a live event -
                 expanding ring outward + intensified base glow so the CTA
                 grabs attention without overwhelming the page. */
              .ve-btn--joinpulse { animation: veJoinPulse 1.4s ease-out infinite; }
              @keyframes veJoinPulse {
                0%, 100% {
                  box-shadow:
                    0 12px 36px -10px rgba(220,38,38,0.65),
                    inset 0 1px 0 rgba(255,255,255,0.20),
                    0 0 0 0 rgba(220,38,38,0.55);
                }
                50% {
                  box-shadow:
                    0 14px 40px -8px rgba(220,38,38,0.75),
                    inset 0 1px 0 rgba(255,255,255,0.22),
                    0 0 0 10px rgba(220,38,38,0);
                }
              }
              .ve-btn--joinpulse:hover:not(:disabled) { animation-play-state: paused; }
              .ve-btn--reserve { background: #083A85; color: #fff; border-color: rgba(255,255,255,0.18); box-shadow: 0 12px 36px -10px rgba(8,58,133,0.65), inset 0 1px 0 rgba(255,255,255,0.18); }
              .ve-btn--reserve:hover:not(:disabled) { background: #062d6b; transform: translateY(-1.5px); box-shadow: 0 18px 40px -8px rgba(8,58,133,0.75), inset 0 1px 0 rgba(255,255,255,0.18); }
              /* Verify-access CTA - equal-weight secondary action paired with the primary CTA.
                 Glassmorphism brand-blue card with strong border + halo glow so it reads as a
                 first-class option, not a buried link. */
              .ve-btn--verify {
                background: linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(8,58,133,0.18) 50%, rgba(184,58,182,0.14) 100%);
                color: #ECFDF5;
                border-color: rgba(16,185,129,0.55);
                box-shadow: 0 10px 32px -10px rgba(16,185,129,0.40),
                            0 4px 10px -2px rgba(8,58,133,0.30),
                            inset 0 1px 0 rgba(255,255,255,0.10);
                position: relative;
                overflow: hidden;
              }
              .ve-btn--verify::before {
                content: '';
                position: absolute; inset: -1px;
                border-radius: inherit;
                padding: 1px;
                background: linear-gradient(120deg, rgba(110,231,183,0), rgba(110,231,183,0.55), rgba(125,211,252,0.45), rgba(110,231,183,0));
                -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                -webkit-mask-composite: xor; mask-composite: exclude;
                opacity: 0; transition: opacity 0.4s ease;
                pointer-events: none;
              }
              .ve-btn--verify:hover:not(:disabled) {
                transform: translateY(-2px);
                background: linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(8,58,133,0.28) 50%, rgba(184,58,182,0.22) 100%);
                border-color: rgba(110,231,183,0.85);
                box-shadow: 0 18px 40px -10px rgba(16,185,129,0.55),
                            0 6px 14px -2px rgba(8,58,133,0.45),
                            inset 0 1px 0 rgba(255,255,255,0.18);
                color: #fff;
              }
              .ve-btn--verify:hover:not(:disabled)::before { opacity: 1; }
              .ve-btn--verify i { color: #6EE7B7; filter: drop-shadow(0 0 6px rgba(110,231,183,0.55)); }
              .ve-btn--owned { background: rgba(16,185,129,0.14); color: #6ee7b7; border-color: rgba(16,185,129,0.45); }
              .ve-btn--ended { background: rgba(239,68,68,0.14); color: #fca5a5; border-color: rgba(239,68,68,0.45); }
              .ve-btn--cancelled { background: rgba(239,68,68,0.14); color: #fecaca; border-color: rgba(239,68,68,0.45); }
              .ve-btn--ghost { background: rgba(255,255,255,0.04); color: var(--ve-text); border-color: var(--ve-line-strong); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
              .ve-btn--ghost:hover:not(:disabled) { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.30); transform: translateY(-1px); }

              /* ── Live-now ribbon (paid attendee, event currently live) ──
                 Sits between the hero and the body grid. Pulsing red dot
                 left, headline + countdown text middle, action buttons
                 right. Visually unmistakable - the "moment of payoff". */
              .ve-livenow {
                max-width: 1240px;
                margin: 0 auto;
                padding: 0 clamp(20px, 4vw, 48px);
                margin-top: -8px;
                animation: veLivenowSlide 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
              }
              @keyframes veLivenowSlide {
                from { opacity: 0; transform: translateY(-12px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              .ve-livenow-inner {
                display: flex; align-items: center; gap: clamp(12px, 2vw, 18px);
                padding: clamp(14px, 1.8vw, 18px) clamp(16px, 2.2vw, 22px);
                border-radius: 18px;
                background:
                  linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(220,38,38,0.10) 100%);
                border: 1px solid rgba(220,38,38,0.55);
                backdrop-filter: blur(14px) saturate(160%);
                -webkit-backdrop-filter: blur(14px) saturate(160%);
                box-shadow:
                  0 16px 40px -10px rgba(220,38,38,0.45),
                  inset 0 1px 0 rgba(255,255,255,0.10);
                color: #fff;
              }
              .ve-livenow.is-dismissed .ve-livenow-inner {
                /* Quieter look once cancelled - still red but less assertive */
                background:
                  linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.05) 100%);
                box-shadow:
                  0 8px 22px -8px rgba(220,38,38,0.30),
                  inset 0 1px 0 rgba(255,255,255,0.08);
              }
              /* Pulsing dot + 2 expanding rings */
              .ve-livenow-pulse {
                position: relative;
                width: 32px; height: 32px;
                flex: none;
                display: inline-flex; align-items: center; justify-content: center;
              }
              .ve-livenow-dot {
                position: relative;
                z-index: 2;
                width: 12px; height: 12px;
                border-radius: 50%;
                background: #fff;
                box-shadow: 0 0 0 0 rgba(255,255,255,0.85);
                animation: veLivenowDot 1.4s ease-in-out infinite;
              }
              .ve-livenow-ring {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background: rgba(239,68,68,0.55);
                opacity: 0;
                animation: veLivenowRing 1.6s ease-out infinite;
              }
              .ve-livenow-ring--2 { animation-delay: 0.6s; }
              @keyframes veLivenowDot {
                0%, 100% { transform: scale(1); }
                50%      { transform: scale(1.18); }
              }
              @keyframes veLivenowRing {
                0%   { transform: scale(0.4); opacity: 0.6; }
                70%  { transform: scale(2.2); opacity: 0; }
                100% { transform: scale(2.4); opacity: 0; }
              }
              /* Text block */
              .ve-livenow-text {
                flex: 1; min-width: 0;
                display: flex; flex-direction: column; gap: 2px;
              }
              .ve-livenow-headline {
                display: flex; align-items: center; gap: 10px;
                font-size: clamp(14px, 1.6vw, 17px);
                font-weight: 800;
                color: #ffffff;
                letter-spacing: -0.005em;
                line-height: 1.25;
              }
              .ve-livenow-tag {
                display: inline-flex; align-items: center;
                padding: 3px 9px;
                border-radius: 6px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                font-size: 10.5px;
                font-weight: 900;
                letter-spacing: 0.10em;
                color: #fff;
                text-shadow: 0 1px 1px rgba(0,0,0,0.30);
                border: 1px solid rgba(255,255,255,0.20);
                box-shadow: 0 4px 10px -2px rgba(220,38,38,0.55);
                flex: none;
              }
              .ve-livenow-sub {
                font-size: 12.5px;
                color: rgba(255,255,255,0.78);
                line-height: 1.4;
              }
              .ve-livenow-counter {
                font-weight: 900;
                color: #fca5a5;
                font-variant-numeric: tabular-nums;
                letter-spacing: -0.01em;
                padding: 0 1px;
                font-size: 14px;
              }
              /* Action buttons */
              .ve-livenow-actions {
                display: flex; gap: 8px;
                flex: none;
              }
              .ve-livenow-cancel {
                display: inline-flex; align-items: center;
                padding: 10px 16px;
                border-radius: 12px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.20);
                color: var(--ve-text);
                font-family: inherit;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: background 160ms ease, border-color 160ms ease;
              }
              .ve-livenow-cancel:hover {
                background: rgba(255,255,255,0.12);
                border-color: rgba(255,255,255,0.34);
              }
              .ve-livenow-cta {
                display: inline-flex; align-items: center; gap: 7px;
                padding: 11px 20px;
                border-radius: 12px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border: 1px solid rgba(255,255,255,0.20);
                color: #ffffff;
                font-family: inherit;
                font-size: 13.5px;
                font-weight: 800;
                letter-spacing: 0.02em;
                cursor: pointer;
                box-shadow:
                  0 12px 28px -8px rgba(220,38,38,0.65),
                  inset 0 1px 0 rgba(255,255,255,0.20);
                animation: veJoinPulse 1.4s ease-out infinite;
                transition: background 160ms ease, transform 160ms ease;
              }
              .ve-livenow-cta:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                animation-play-state: paused;
                transform: translateY(-1.5px);
              }
              .ve-livenow-cta i { font-size: 13px; }
              @media (max-width: 700px) {
                .ve-livenow { margin-top: -4px; padding: 0 clamp(14px, 4vw, 24px); }
                .ve-livenow-inner {
                  flex-wrap: wrap;
                  padding: 12px 14px;
                  gap: 12px;
                }
                .ve-livenow-text { flex-basis: calc(100% - 44px); }
                .ve-livenow-headline { font-size: 13.5px; }
                .ve-livenow-tag { font-size: 9.5px; padding: 2px 7px; }
                .ve-livenow-sub { font-size: 11.5px; }
                .ve-livenow-actions {
                  width: 100%;
                  justify-content: flex-end;
                }
                .ve-livenow-cancel, .ve-livenow-cta {
                  padding: 9px 14px;
                  font-size: 12.5px;
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .ve-livenow { animation: none; }
                .ve-livenow-dot, .ve-livenow-ring, .ve-livenow-cta { animation: none; }
                .ve-btn--joinpulse { animation: none; }
              }

              /* Body grid + cards */
              .ve-body { max-width: 1240px; margin: 0 auto; padding: clamp(32px, 6vw, 64px) clamp(20px, 4vw, 48px); }
              .ve-body-grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: clamp(20px, 3vw, 40px); align-items: flex-start; }
              @media (max-width: 1024px) { .ve-body-grid { grid-template-columns: 1fr; } }
              .ve-main-col { display: flex; flex-direction: column; gap: clamp(18px, 2.5vw, 26px); min-width: 0; }
              .ve-card { background: linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.025) 100%); border: 1px solid var(--ve-line); border-radius: 22px; padding: clamp(20px, 3vw, 28px); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); position: relative; overflow: hidden; }
              .ve-card::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(80% 60% at 0% 0%, rgba(31,107,255,0.06) 0%, rgba(0,0,0,0) 50%); }
              .ve-card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
              .ve-card-tag { width: 4px; height: 22px; border-radius: 2px; background: linear-gradient(180deg, var(--ve-brand-2) 0%, var(--ve-brand) 100%); flex: none; }
              .ve-card-h { font-size: clamp(20px, 2.4vw, 24px); font-weight: 800; color: var(--ve-text); margin: 0; letter-spacing: -0.01em; }
              .ve-card-h .bi { margin-right: 6px; color: var(--ve-brand-2); }
              .ve-about-text { font-size: 16px; line-height: 1.7; color: var(--ve-text-soft); margin: 0; white-space: pre-line; }
              .ve-about-text--placeholder { color: var(--ve-text-mute); font-style: italic; }
              .ve-about:not(.is-open) .ve-about-text { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
              .ve-readmore { margin-top: 12px; background: transparent; border: none; color: var(--ve-brand-2); font-weight: 700; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 0; }
              .ve-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
              .ve-tag { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.05); border: 1px solid var(--ve-line); color: var(--ve-text-soft); font-size: 12.5px; font-weight: 600; }
              .ve-tag:hover { background: var(--ve-brand-soft); color: #9bbcff; border-color: rgba(31,107,255,0.4); }

              /* Highlights */
              .ve-highlights { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
              .ve-highlight { background: linear-gradient(180deg, rgba(31,107,255,0.06) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid var(--ve-line); border-radius: 18px; padding: 18px 18px 16px; display: flex; flex-direction: column; gap: 8px; }
              .ve-highlight-ico { width: 38px; height: 38px; border-radius: 12px; background: rgba(31,107,255,0.16); color: #9bbcff; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 4px; }
              .ve-highlight strong { font-size: 15px; font-weight: 800; color: var(--ve-text); }
              .ve-highlight small { font-size: 13px; color: var(--ve-text-mute); line-height: 1.5; }

              /* Hosts */
              .ve-hosts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
              .ve-host { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 16px; background: rgba(255,255,255,0.025); border: 1px solid var(--ve-line); }
              .ve-host-av { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, rgba(31,107,255,0.25), rgba(8,58,133,0.5)); border: 2px solid rgba(31,107,255,0.55); display: flex; align-items: center; justify-content: center; color: #93c5fd; font-size: 22px; flex: none; overflow: hidden; }
              .ve-host-av img { width: 100%; height: 100%; object-fit: cover; display: block; }
              .ve-host-av--organizer { background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(180,83,9,0.5)); border-color: rgba(245,158,11,0.55); color: #fbbf77; }
              .ve-host-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
              .ve-host-info .ve-host-role { font-size: 11px; color: var(--ve-text-mute); text-transform: uppercase; letter-spacing: 0.10em; font-weight: 700; }
              .ve-host-info strong { font-size: 16px; font-weight: 800; color: var(--ve-text); }
              .ve-host-info small { font-size: 12.5px; color: var(--ve-text-mute); }

              /* Wishes */
              .ve-wishes { background: linear-gradient(180deg, rgba(31,107,255,0.06) 0%, rgba(255,255,255,0.025) 100%); }
              .ve-wishes-head { align-items: flex-start; }
              .ve-wishes-ico { color: #f87171; }
              .ve-wishes-sub { margin: 4px 0 0; color: var(--ve-text-mute); font-size: 13px; }
              .ve-wishes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
              @media (max-width: 540px) { .ve-wishes-grid { grid-template-columns: 1fr; } }
              .ve-wishes-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
              .ve-wishes-actions .ve-btn { flex: 1; min-width: 140px; }

              /* Inputs */
              .ve-input { width: 100%; padding: 12px 14px; background: rgba(7,8,13,0.55); border: 1px solid var(--ve-line-strong); border-radius: 12px; color: var(--ve-text); font-family: inherit; font-size: 14px; outline: none; transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease; box-sizing: border-box; }
              .ve-input::placeholder { color: var(--ve-text-mute); }
              .ve-input:focus { border-color: var(--ve-brand-2); background: rgba(7,8,13,0.85); box-shadow: 0 0 0 4px rgba(31,107,255,0.18); }
              .ve-input.is-error { border-color: rgba(239,68,68,0.6); box-shadow: 0 0 0 4px rgba(239,68,68,0.15); }
              .ve-textarea { resize: vertical; min-height: 84px; line-height: 1.55; }
              .ve-msg { margin: 8px 0 0; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
              .ve-msg--err { color: #fca5a5; }
              .ve-msg--ok { color: #6ee7b7; }

              /* Ticket */
              .ve-side { position: sticky; top: 90px; align-self: flex-start; }
              @media (max-width: 1024px) { .ve-side { position: static; } }
              .ve-ticket { background: linear-gradient(180deg, rgba(31,107,255,0.10) 0%, rgba(255,255,255,0.04) 80%); border: 1px solid var(--ve-line-strong); border-radius: 22px; padding: 22px; backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); box-shadow: 0 24px 60px -12px rgba(0,0,0,0.55); display: flex; flex-direction: column; gap: 16px; }
              .ve-ticket-status-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
              .ve-ticket-status { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase; }
              .ve-ticket-status--live { background: rgba(220,38,38,0.20); color: #fca5a5; border: 1px solid rgba(220,38,38,0.55); }
              .ve-ticket-status--upcoming { background: rgba(31,107,255,0.18); color: #93c5fd; border: 1px solid rgba(31,107,255,0.5); }
              .ve-ticket-status--ended { background: rgba(239,68,68,0.16); color: #fca5a5; border: 1px solid rgba(239,68,68,0.5); }
              .ve-ticket-status--cancelled { background: rgba(239,68,68,0.16); color: #fecaca; border: 1px solid rgba(239,68,68,0.45); }
              .ve-ticket-owned { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #6ee7b7; }
              .ve-ticket-owned i { font-size: 14px; }

              /* Countdown card (sidebar) */
              .ve-countdown-card { padding: 14px 16px; border-radius: 16px; background: rgba(245,158,11,0.10); border: 1px solid rgba(245,158,11,0.45); display: flex; flex-direction: column; gap: 10px; }
              .ve-countdown-card small { font-size: 11px; text-transform: uppercase; letter-spacing: 0.10em; color: #fbbf77; font-weight: 800; }
              .ve-countdown-grid { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 8px; }
              .ve-countdown-cell { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; background: rgba(7,8,13,0.55); border: 1px solid rgba(245,158,11,0.30); border-radius: 10px; }
              .ve-countdown-cell strong { font-size: 22px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
              .ve-countdown-cell span { font-size: 10px; color: #fbbf77; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-top: 4px; }

              .ve-ticket-price { padding: 14px 16px; border-radius: 16px; background: rgba(7,8,13,0.55); border: 1px solid var(--ve-line-strong); display: flex; flex-direction: column; gap: 6px; }
              .ve-ticket-price small { font-size: 11px; text-transform: uppercase; letter-spacing: 0.10em; color: var(--ve-text-mute); font-weight: 700; }
              .ve-ticket-price-row { display: flex; align-items: baseline; gap: 8px; }
              .ve-ticket-price-num { font-size: clamp(42px, 4.2vw, 52px); font-weight: 900; color: var(--ve-text); line-height: 1; letter-spacing: -0.025em; font-variant-numeric: tabular-nums; }
              .ve-ticket-price-cur { font-size: 18px; font-weight: 800; color: var(--ve-text-mute); letter-spacing: 0.06em; }
              .ve-ticket-price.is-dim { position: relative; background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.42); }
              .ve-ticket-price.is-dim small { color: rgba(252, 165, 165, 0.85); }
              .ve-ticket-price.is-dim .ve-ticket-price-num { color: rgba(252, 165, 165, 0.65); text-decoration: line-through; text-decoration-thickness: 3px; text-decoration-color: rgba(239, 68, 68, 0.7); }
              .ve-ticket-price.is-dim .ve-ticket-price-cur { color: rgba(252, 165, 165, 0.55); }
              .ve-ticket-price.is-dim::after {
                content: ''; position: absolute; top: 10px; right: 12px;
                width: 30px; height: 30px; border-radius: 50%;
                background: rgba(239, 68, 68, 0.15);
                border: 1.5px solid rgba(239, 68, 68, 0.65);
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 16 16' fill='none' stroke='%23fca5a5' stroke-width='1.8' stroke-linecap='round'><circle cx='8' cy='8' r='6.5'/><line x1='3.5' y1='12.5' x2='12.5' y2='3.5'/></svg>");
                background-repeat: no-repeat; background-position: center;
                box-shadow: 0 4px 10px -2px rgba(239, 68, 68, 0.4);
              }
              .ve-ticket-price--free { background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.45); }
              .ve-ticket-price-free { font-size: 22px; font-weight: 800; color: #6ee7b7; }
              .ve-ticket-price--free small { color: rgba(110,231,183,0.7); }

              .ve-ticket-meta { display: flex; flex-direction: column; gap: 12px; padding: 4px 2px; }
              .ve-ticket-row { display: flex; align-items: flex-start; gap: 12px; }
              .ve-ticket-row > i { font-size: 16px; color: var(--ve-brand-2); margin-top: 2px; flex: none; }
              .ve-ticket-row > div { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
              .ve-ticket-row > div span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.10em; color: var(--ve-text-mute); font-weight: 700; }
              .ve-ticket-row > div strong { font-size: 14.5px; font-weight: 700; color: var(--ve-text); }

              .ve-ticket-cta { display: flex; flex-direction: column; gap: 10px; }
              .ve-ticket-trust { display: flex; flex-wrap: wrap; gap: 12px 16px; padding-top: 8px; border-top: 1px solid var(--ve-line); font-size: 12px; color: var(--ve-text-mute); }
              .ve-ticket-trust span { display: inline-flex; align-items: center; gap: 5px; }
              .ve-ticket-trust i { color: var(--ve-live); font-size: 13px; }

              /* Footer */
              .ve-foot { text-align: center; padding: 20px; font-size: 12px; color: var(--ve-text-mute); }

              /* Mobile dock */
              .ve-dock { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(7,8,13,0) 0%, rgba(7,8,13,0.85) 30%, rgba(7,8,13,0.96) 100%); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); border-top: 1px solid var(--ve-line-strong); display: flex; align-items: center; gap: 10px; }
              .ve-dock-price { display: flex; flex-direction: column; gap: 0; padding-left: 4px; flex: none; }
              .ve-dock-price small { font-size: 10px; text-transform: uppercase; letter-spacing: 0.10em; color: var(--ve-text-mute); font-weight: 700; }
              .ve-dock-price strong { font-size: 22px; font-weight: 900; color: var(--ve-text); letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
              .ve-dock-price strong span { font-size: 12px; font-weight: 800; color: var(--ve-text-mute); margin-left: 4px; letter-spacing: 0.04em; }
              .ve-dock-cta-wrap { flex: 1; }
              @media (min-width: 769px) { .ve-dock { display: none; } }

              /* Toast */
              .ve-toast { position: fixed; bottom: 88px; left: 50%; transform: translateX(-50%); z-index: 1200; padding: 12px 18px; border-radius: 999px; background: rgba(16,185,129,0.94); color: #fff; font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 12px 32px -10px rgba(16,185,129,0.55); animation: veToastIn 220ms ease-out; }
              @media (min-width: 769px) { .ve-toast { bottom: 28px; } }
              @keyframes veToastIn { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }

              /* Reduced motion */
              @media (prefers-reduced-motion: reduce) {
                .ve-hero-bg { transform: none !important; }
                .ve-pulse, .ve-toast { animation: none !important; }
                .ve-btn:hover:not(:disabled) { transform: none; }
              }
              .ve-btn:focus-visible, .ve-glass-btn:focus-visible, .ve-input:focus-visible, .ve-readmore:focus-visible {
                outline: 2px solid var(--ve-brand-2); outline-offset: 3px;
              }
            `}</style>
          </>
        );
      })()}

      {/* ── RESERVATION-SUCCESS MODAL ──
          Triggered after the user completes payment on an upcoming event
          and is redirected back here with ?reserved=1. Confirms the spot
          is reserved + reassures the user they'll be ready when the event
          goes live. Dismissed via the close button or the "Got it" CTA. */}
      {showReservedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ve-reserved-title"
          onMouseDown={(e) => { if (e.target === e.currentTarget) dismissReservedModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1300,
            background: 'rgba(7,8,13,0.78)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            fontFamily: "'Pragati Narrow', system-ui, sans-serif",
            animation: 'veReservedFade 220ms ease-out',
          }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, rgba(20,22,30,0.96) 0%, rgba(11,14,21,0.98) 100%)',
              border: '1px solid rgba(16,185,129,0.45)',
              borderRadius: 24,
              padding: 'clamp(28px, 5vw, 40px) clamp(24px, 4vw, 36px)',
              maxWidth: 460, width: '100%',
              textAlign: 'center',
              boxShadow:
                '0 32px 80px rgba(0,0,0,0.65),' +
                '0 0 0 1px rgba(16,185,129,0.10),' +
                '0 0 60px -10px rgba(16,185,129,0.30)',
              position: 'relative',
              color: '#f4f6fb',
              animation: 'veReservedPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <button
              type="button"
              onClick={dismissReservedModal}
              aria-label="Close"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#9ca3af', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 160ms ease, color 160ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9ca3af'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Animated emerald check icon */}
            <div
              style={{
                width: 84, height: 84, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.28) 0%, rgba(5,150,105,0.18) 100%)',
                border: '2px solid rgba(16,185,129,0.65)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
                boxShadow: '0 12px 28px -6px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.10)',
                animation: 'veReservedCheck 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms backwards',
              }}
              aria-hidden="true"
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2
              id="ve-reserved-title"
              style={{
                fontSize: 'clamp(22px, 3.6vw, 26px)',
                fontWeight: 800,
                color: '#f4f6fb',
                margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}
            >
              {groupFlag === '1' ? 'Group access reserved!' : 'Your spot is reserved!'}
            </h2>

            <p style={{ fontSize: 14.5, color: '#b8bdca', lineHeight: 1.6, margin: '0 auto 18px', maxWidth: 360 }}>
              Payment confirmed for <strong style={{ color: '#f4f6fb', fontWeight: 700 }}>{selectedEvent.title}</strong>.
              You&apos;ll be able to join the live stream as soon as the event begins on{' '}
              <strong style={{ color: '#f4f6fb', fontWeight: 700 }}>{formatDate(selectedEvent.eventDate)}</strong>
              {selectedEvent.startTime && (
                <> at <strong style={{ color: '#f4f6fb', fontWeight: 700 }}>{formatTimeRange(selectedEvent.startTime, selectedEvent.endTime)}</strong></>
              )}.
            </p>

            {/* Event metadata pills */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.45)', color: '#6ee7b7', fontSize: 12, fontWeight: 700 }}>
                <i className="bi bi-patch-check-fill"></i> Access owned
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(31,107,255,0.14)', border: '1px solid rgba(31,107,255,0.45)', color: '#93c5fd', fontSize: 12, fontWeight: 700 }}>
                <i className="bi bi-calendar-event"></i> {formatDate(selectedEvent.eventDate)}
              </span>
            </div>

            {/* Email-notification promise - emerald accent so it reads as
                a guaranteed positive next-step, not just a tip. */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.40)',
                marginBottom: 18,
                textAlign: 'left',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flex: 'none',
                  width: 28, height: 28,
                  borderRadius: 8,
                  background: 'rgba(16,185,129,0.22)',
                  border: '1px solid rgba(16,185,129,0.45)',
                  color: '#6ee7b7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                <i className="bi bi-envelope-paper-fill" />
              </span>
              <div style={{ fontSize: 12.5, color: '#d1f7e3', lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>You&apos;ll get an email the moment this event goes live.</strong>
                {' '}
                <span style={{ color: '#b8bdca' }}>
                  Your access is already confirmed. Just open the email and you&apos;ll go straight to the stream.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissReservedModal}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#083A85',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 12,
                fontSize: 14.5,
                fontWeight: 800,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 12px 36px -10px rgba(8,58,133,0.65), inset 0 1px 0 rgba(255,255,255,0.18)',
                transition: 'background 160ms ease, transform 140ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#062d6b'; e.currentTarget.style.transform = 'translateY(-1.5px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#083A85'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
              Got it
            </button>
          </div>
          <style jsx global>{`
            @keyframes veReservedFade {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes veReservedPop {
              from { opacity: 0; transform: translateY(20px) scale(0.94); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes veReservedCheck {
              from { opacity: 0; transform: scale(0.4) rotate(-30deg); }
              to { opacity: 1; transform: scale(1) rotate(0); }
            }
          `}</style>
        </div>
      )}

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
              borderRadius: 20, padding: 'clamp(28px, 5vw, 40px)',
              maxWidth: 480, width: '100%',
              border: '1px solid rgba(8,58,133,0.06)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            {/* Close */}
            <button
              onClick={() => { if (!vaLoading) setShowViewerAuth(false); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(8,58,133,0.04)', border: 'none', color: '#6b7280', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.04)'; }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Icon circle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(8,58,133,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-person-check-fill" style={{ fontSize: 24, color: '#083A85' }}></i>
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#083A85', margin: '0 0 4px', textAlign: 'center', fontFamily: "'Pragati Narrow', sans-serif" }}>Your Details</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 22px', textAlign: 'center' }}>
              Quick info to verify your stream access
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                <i className="bi bi-person" style={{ marginRight: 6, color: '#083A85' }}></i>
                Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={vaName}
                onChange={(e) => setVaName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleViewerAuth()}
                placeholder="Your full name"
                disabled={vaLoading}
                style={{ width: '100%', padding: '12px 14px', background: '#f9fafb', border: '1.5px solid rgba(8,58,133,0.15)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.background = '#fff'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.15)'; e.currentTarget.style.background = '#f9fafb'; }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  <i className="bi bi-envelope" style={{ marginRight: 6, color: '#083A85' }}></i>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={vaEmail}
                  onChange={(e) => setVaEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewerAuth()}
                  placeholder="your@email.com"
                  disabled={vaLoading}
                  style={{ width: '100%', padding: '12px 14px', background: '#f9fafb', border: '1.5px solid rgba(8,58,133,0.15)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.background = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.15)'; e.currentTarget.style.background = '#f9fafb'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  <i className="bi bi-phone" style={{ marginRight: 6, color: '#083A85' }}></i>
                  Phone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={vaPhone}
                  onChange={(e) => setVaPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  onKeyDown={(e) => e.key === 'Enter' && handleViewerAuth()}
                  placeholder="078XXXXXXX"
                  disabled={vaLoading}
                  style={{ width: '100%', padding: '12px 14px', background: '#f9fafb', border: '1.5px solid rgba(8,58,133,0.15)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.background = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.15)'; e.currentTarget.style.background = '#f9fafb'; }}
                />
              </div>
            </div>

            {vaError && (
              <div style={{ padding: '10px 12px', marginBottom: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }}></i>
                {vaError}
              </div>
            )}

            <button
              onClick={handleViewerAuth}
              disabled={vaLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: vaLoading ? '#e5e7eb' : '#083A85',
                border: 'none',
                color: vaLoading ? '#9ca3af' : '#fff',
                fontSize: 15, fontWeight: 700,
                cursor: vaLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!vaLoading) e.currentTarget.style.background = '#062d6b'; }}
              onMouseLeave={e => { if (!vaLoading) e.currentTarget.style.background = '#083A85'; }}
            >
              {vaLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#9ca3af', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} />
                  Verifying…
                </>
              ) : (
                'Continue'
              )}
            </button>

            <p style={{ fontSize: 11, color: '#6b7280', margin: '14px 0 0', textAlign: 'center' }}>
              <i className="bi bi-lock-fill" style={{ marginRight: 4 }}></i>
              No account needed. Your details are only used for this event.
            </p>
          </div>
        </div>
      )}

      {/* ── Group Code View Modal (for buyers) ── */}
      {showGroupCodeView && savedGroupCode && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: 16,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowGroupCodeView(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)',
              borderRadius: 20, padding: 'clamp(24px, 5vw, 36px)',
              maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto',
              border: '1px solid rgba(245,158,11,0.2)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              position: 'relative', textAlign: 'center',
            }}
          >
            <button
              onClick={() => { setShowGroupCodeView(false); setInviteError(null); setInviteSuccess(null); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="bi bi-people-fill" style={{ fontSize: 22, color: '#f59e0b' }}></i>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Your Group Access Code</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 16px' }}>Share this code or invite viewers by email below.</p>

            {/* Code display */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your Invite Code</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: 5, color: '#fff', fontFamily: 'monospace' }}>{savedGroupCode.code}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(savedGroupCode.code); setGroupCodeCopied(true); setTimeout(() => setGroupCodeCopied(false), 2000); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: groupCodeCopied ? '#10b981' : '#9ca3af', fontSize: 15, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                  title="Copy code"
                >
                  <i className={groupCodeCopied ? 'bi bi-clipboard-check-fill' : 'bi bi-clipboard'}></i>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
              {savedGroupCode.viewerCount != null && (
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Allowed</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{savedGroupCode.viewerCount}</div>
                </div>
              )}
              {savedGroupCode.remainingSlots != null && (
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Remaining</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: (savedGroupCode.remainingSlots) > 0 ? '#10b981' : '#ef4444' }}>{savedGroupCode.remainingSlots}</div>
                </div>
              )}
              {savedGroupCode.expiresAt && (
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Expires</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{new Date(savedGroupCode.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )}
            </div>

            {/* Invite by email - only if slots remaining */}
            {(savedGroupCode.remainingSlots == null || savedGroupCode.remainingSlots > 0) && (
              <div style={{ textAlign: 'left', marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Invite a viewer by email</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); setInviteSuccess(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleInviteEmail()}
                    placeholder="Enter their email"
                    disabled={inviteLoading}
                    style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#03969c'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  />
                  <button
                    onClick={handleInviteEmail}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    style={{
                      padding: '10px 16px', borderRadius: 10, border: 'none',
                      background: inviteLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: inviteLoading || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inviteLoading ? '...' : 'Send'}
                  </button>
                </div>
                {inviteError && <p style={{ color: '#fca5a5', fontSize: 12, margin: '6px 0 0' }}>{inviteError}</p>}
                {inviteSuccess && <p style={{ color: '#10b981', fontSize: 12, margin: '6px 0 0' }}>{inviteSuccess}</p>}
              </div>
            )}

            {/* Invited viewers list */}
            {savedGroupCode.invitedViewers && savedGroupCode.invitedViewers.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Invited Viewers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {savedGroupCode.invitedViewers.map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <i className={v.status === 'JOINED' ? 'bi bi-check-circle-fill' : 'bi bi-hourglass-split'} style={{ color: v.status === 'JOINED' ? '#10b981' : '#f59e0b', fontSize: 14, flexShrink: 0 }}></i>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#efeff1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name || v.email}</div>
                        {v.name && <div style={{ fontSize: 11, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.email}</div>}
                      </div>
                      <span style={{ fontSize: 11, color: v.status === 'JOINED' ? '#10b981' : '#f59e0b', fontWeight: 600, flexShrink: 0 }}>{v.status === 'JOINED' ? 'Joined' : 'Invited'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(savedGroupCode.remainingSlots != null && savedGroupCode.remainingSlots === 0) && (
              <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 14px' }}>All invite slots have been used.</p>
            )}

            <button
              onClick={() => { setShowGroupCodeView(false); setInviteError(null); setInviteSuccess(null); }}
              style={{ padding: '11px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#9ca3af', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Group Invite - Viewer Identity Modal ── */}
      {showGroupAuth && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: 16,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !gaLoading) setShowGroupAuth(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)',
              borderRadius: 20, padding: 'clamp(24px, 5vw, 36px)',
              maxWidth: 460, width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(3,150,156,0.15)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => { if (!gaLoading) setShowGroupAuth(false); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <i className="bi bi-people-fill" style={{ fontSize: 22, color: '#03969c' }}></i>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Group Invite Access</h2>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 20px' }}>
              {gaEmailRestricted
                ? 'Enter your name and the email this invite was sent to. We\u2019ll verify your access and take you to the stream.'
                : 'Enter your details to join with your group invite code.'}
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Full Name</label>
              <input
                type="text" value={gaName} onChange={(e) => setGaName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGroupViewerAuth()}
                placeholder="Your name" disabled={gaLoading}
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#03969c'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: gaEmailRestricted ? '#f59e0b' : '#d1d5db', marginBottom: 6 }}>
                {gaEmailRestricted ? 'Email (must match your invite)' : 'Email'}
              </label>
              <input
                type="email" value={gaEmail} onChange={(e) => setGaEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGroupViewerAuth()}
                placeholder={gaEmailRestricted ? 'Enter the email you were invited on' : 'Your email'}
                disabled={gaLoading}
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${gaEmailRestricted ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#03969c'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = gaEmailRestricted ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)'; }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>Phone Number <span style={{ color: '#6b7280', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="tel" value={gaPhone}
                onChange={(e) => setGaPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                onKeyDown={(e) => e.key === 'Enter' && handleGroupViewerAuth()}
                placeholder="Your phone number" disabled={gaLoading}
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#03969c'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              />
            </div>

            {gaError && (
              <div style={{ padding: '10px 12px', marginBottom: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, color: '#fca5a5', fontSize: 13 }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }}></i>
                {gaError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => { if (!gaLoading) setShowGroupAuth(false); }}
                disabled={gaLoading}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#9ca3af', fontSize: 14, fontWeight: 500, cursor: gaLoading ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleGroupViewerAuth}
                disabled={gaLoading}
                style={{ flex: 2, padding: '12px', borderRadius: 12, background: gaLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: gaLoading ? 'not-allowed' : 'pointer' }}
              >
                {gaLoading ? 'Verifying…' : 'Join Stream'}
              </button>
            </div>
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

            {/* Tab switcher - only on login/signup step */}
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
                  <i className="bi bi-envelope-check-fill" style={{ color: '#5b9bff', fontSize: 16, flexShrink: 0 }}></i>
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


      {/* ── Video Wish Recorder Modal ── */}
      {showWishVideoRecorder && (
        <VideoMessageRecorder
          onClose={() => setShowWishVideoRecorder(false)}
          onSend={handleSendVideoWish}
        />
      )}

      {/* ── Global Error / Notice Popup ── */}
      <ErrorPopup
        open={errorPopup.open}
        onClose={closeErrorPopup}
        severity={errorPopup.severity}
        title={errorPopup.title}
        message={errorPopup.message}
        hint={errorPopup.hint}
        primaryAction={errorPopup.primaryAction}
        secondaryAction={errorPopup.secondaryAction}
      />
    </>
  );
}

// Suspense fallback - silent placeholder, no spinner per design request.
function LoadingFallback() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading event"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.18) 0%, rgba(8,58,133,0) 60%), linear-gradient(180deg, #07080d 0%, #0c0e15 60%, #11141d 100%)',
      }}
    />
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
