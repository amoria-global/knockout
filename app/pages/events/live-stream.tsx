"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { WHEPClient } from '@/lib/streaming/WHEPClient';
import { getCurrencies, type Currency as APICurrency } from '@/lib/APIs/public';
import { recordTip, recordStreamingPayment } from '@/lib/APIs/payments/route';
import { initiateXentriPayStreaming, pollXentriPayStatus, type XentriPayStatusResponse } from '@/lib/APIs/payments/xentripay';
import { getPublicEventById } from '@/lib/APIs/public/get-events/route';
import { useAuth } from '../../providers/AuthProvider';
import { login } from '@/lib/APIs/auth/login/route';
import { signup } from '@/lib/APIs/auth/signup/route';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { googleAuth } from '@/lib/APIs/auth/google/route';
import { useGoogleLogin } from '@react-oauth/google';
import { getStreamChats, type StreamChatMessage } from '@/lib/APIs/streams/chat/route';
import { sendStreamChat, sendStreamVideoChat, getStreamViewerCount, getPublicViewerCount, requestStreamAccess, checkDeviceAccess, sendHeartbeat, reportStreamIssue, blockUserInStream } from '@/lib/APIs/streams/route';
import { getDeviceId } from '@/lib/fingerprint';
import { checkAnonymousAccessStatus, anonymousDeviceCheck, anonymousHeartbeat, deactivateAnonymousSession, getAnonymousViewerCount, registerAnonymousViewer, switchAnonymousDevice, sendAnonymousChatMessage, sendAnonymousVideoChat } from '@/lib/APIs/streams/anonymous-viewer';
import ViewerInfoModal from '../../components/ViewerInfoModal';
import type { ViewerInfoData } from '../../components/ViewerInfoModal';
import DeviceSwitchModal from '../../components/DeviceSwitchModal';
import DonationPromptModal from '../../components/DonationPromptModal';
import AppreciationModal from '../../components/AppreciationModal';
import { initiateAnonymousStreamingPayment, checkAnonymousPaymentStatus } from '@/lib/APIs/payments/xentripay';
import { contactUs } from '@/lib/APIs/public/contact-us/route';
import { apiClient } from '@/lib/api/client';
import { StreamAdManager, type StreamAd } from '@/app/components/StreamAdBanners';
import { getStreamAds, pollAdTrigger, recordAdClick } from '@/lib/APIs/public/get-stream-ads/route';
import { API_ENDPOINTS } from '@/lib/api/config';
import Hls from 'hls.js';
import '@/app/styles/live-stream-player.css';
import { PlayIcon, PauseIcon, VolumeHighIcon, VolumeLowIcon, VolumeOffIcon, FullscreenEnterIcon, FullscreenExitIcon, PipEnterIcon, SpinnerIcon, EmojiIcon, PeopleIcon, GearIcon } from '@/app/components/player-icons';

// Dynamically import VideoMessageRecorder to avoid SSR issues
const VideoMessageRecorder = dynamic(() => import('../../components/VideoMessageRecorder'), { ssr: false });

// Default user avatar SVG (grey silhouette on light background)
const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%234a4a4a'/%3E%3Ccircle cx='75' cy='56' r='30' fill='%23888'/%3E%3Cellipse cx='75' cy='138' rx='48' ry='42' fill='%23888'/%3E%3C/svg%3E";

// Event/Stream interface
interface EventStream {
  id: string;
  title: string;
  photographer: string;
  photographerId: string;
  photographerAvatar?: string;
  category: string;
  videoSrc: string;
  streamId: string;
  viewers: number;
  startTime: string;
  messages: Message[];
  whepUrl?: string;
  hlsManifestUrl?: string;
  eventStatus?: string;
  streamType?: 'entry_fee' | 'invite_token' | null;
  streamFee?: number | null;
  streamFeeCurrencySymbol?: string | null;
  streamFeeCurrencyAbbreviation?: string | null;
  hasInviteCode?: boolean | null;
  hasPurchasedAccess?: boolean;
  eventDate?: string;
  eventStartTime?: string;
}

interface Message {
  id: number | string;
  sender: string;
  senderId?: string; // backend customer UUID for blocking
  text: string;
  time: string;
  delivered: boolean;
  avatar: string;
  videoUrl?: string;
  apiMessageId?: string; // tracks the backend ID for deduplication
  // Raw ISO timestamp preserved from the backend so we can filter out
  // pre-event "wish" messages that were sent while the event was still
  // upcoming (those are private to the host and shouldn't appear in chat).
  createdAt?: string;
  replyTo?: {
    id: number | string;
    sender: string;
  };
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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
      onClick={() => googleLogin()}
      disabled={loading}
      style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      {loading ? 'Connecting...' : label}
    </button>
  );
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

// Helper to read eventId from URL (runs at module level for initial state)
function getInitialEventId(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('eventId') || params.get('id') || '';
  }
  return '';
}

// Main App Component
const App = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, login: authLogin, user } = useAuth();
  const initialId = searchParams.get('eventId') || searchParams.get('id') || getInitialEventId();

  // State for multiple events (up to 3)
  const [events, setEvents] = useState<EventStream[]>([
    {
      id: initialId,
      title: "Loading...",
      photographer: "",
      photographerId: "",
      viewers: 0,
      category: "",
      videoSrc: "",
      streamId: initialId,
      whepUrl: undefined,
      startTime: "",
      messages: [],
    }
  ]);

  // Main focused event (index in events array)
  const [mainEventIndex, setMainEventIndex] = useState(0);
  const mainEvent = events[mainEventIndex];

  // Live countdown for "coming soon" overlay — ticks only while event is ≤6h away
  const [msUntilStart, setMsUntilStart] = useState<number | null>(null);
  useEffect(() => {
    const start = getEventStartDate(mainEvent?.eventDate, mainEvent?.eventStartTime);
    if (!start) { setMsUntilStart(null); return; }
    const tick = () => setMsUntilStart(start.getTime() - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [mainEvent?.eventDate, mainEvent?.eventStartTime]);
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const evStatusUpper = (mainEvent?.eventStatus || '').toUpperCase();
  const showCountdown =
    msUntilStart !== null &&
    msUntilStart > 0 &&
    msUntilStart <= SIX_HOURS_MS &&
    evStatusUpper !== 'ONGOING' &&
    evStatusUpper !== 'COMPLETED';

  // Blocked users (local only)
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  // Dynamic participants derived from chat messages
  const [participants, setParticipants] = useState<{ id: number; name: string; status: string; avatar: string }[]>([]);

  // ── Stream access gate ──
  // entry_fee streams: require payment before watching
  // invite_token streams: require invite token before watching
  const [streamAccessGranted, setStreamAccessGranted] = useState(false);
  const [accessCheckLoading, setAccessCheckLoading] = useState(false);
  const [showInviteTokenModal, setShowInviteTokenModal] = useState(false);
  const [inviteTokenInput, setInviteTokenInput] = useState('');
  const [inviteTokenError, setInviteTokenError] = useState('');
  const [inviteTokenLoading, setInviteTokenLoading] = useState(false);
  const [viewerUsername, setViewerUsername] = useState('');

  // ── Anonymous viewer state ──
  const [anonymousViewerId, setAnonymousViewerId] = useState<string | null>(null);
  const [isAnonymousViewer, setIsAnonymousViewer] = useState(false);
  const [anonymousViewerName, setAnonymousViewerName] = useState('');

  // ── Welcome splash ──
  // Replaces the generic preloader with a cinematic "you're in" message
  // for viewers redirected here. Dismisses on a timer (default 2.6s) or on
  // user interaction. The splash also hides early when the video element
  // signals it's ready to play, so users with fast streams skip it.
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(true);
  const [welcomeSplashFadingOut, setWelcomeSplashFadingOut] = useState(false);
  const dismissWelcomeSplash = useCallback(() => {
    setWelcomeSplashFadingOut(true);
    window.setTimeout(() => setShowWelcomeSplash(false), 320);
  }, []);
  useEffect(() => {
    if (!showWelcomeSplash) return;
    // Auto-dismiss after 2.6s — long enough to read "Welcome, you're in!"
    // but short enough not to delay the actual stream meaningfully.
    const t = window.setTimeout(() => {
      setWelcomeSplashFadingOut(true);
      window.setTimeout(() => setShowWelcomeSplash(false), 320);
    }, 2600);
    return () => window.clearTimeout(t);
  }, [showWelcomeSplash]);
  const [showViewerInfoModal, setShowViewerInfoModal] = useState(false);
  const [viewerInfoLoading, setViewerInfoLoading] = useState(false);
  const [viewerInfoError, setViewerInfoError] = useState('');
  const [showDeviceSwitchModal, setShowDeviceSwitchModal] = useState(false);
  const [deviceSwitchLoading, setDeviceSwitchLoading] = useState(false);

  // Check if user already rated this event — uses new backend endpoint
  useEffect(() => {
    if (!mainEvent?.id) return;
    const checkRating = async () => {
      try {
        const viewerParam = anonymousViewerId ? `?viewerId=${anonymousViewerId}` : '';
        const res = await fetch(`/api/remote/public/streams/${mainEvent.id}/rating${viewerParam}`);
        const result = await res.json();
        if (result?.data?.userRating) {
          setUserHasRated(true);
          setRating(result.data.userRating);
          if (result.data.userRatingComment) setRatingComment(result.data.userRatingComment);
        } else {
          setUserHasRated(false);
        }
      } catch {
        setUserHasRated(false);
      }
    };
    checkRating();
  }, [mainEvent?.id, anonymousViewerId]);

  // ── Viewer auth modal state ──
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'otp'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [otpCustomerId, setOtpCustomerId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Interaction capability — true when user can chat, rate, gift, etc.
  const canInteract = isAuthenticated || (isAnonymousViewer && !!anonymousViewerId);

  // Open auth modal instead of redirecting
  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setAuthStep('login');
      setAuthError('');
      setShowAuthModal(true);
    }
  };

  // Require interaction capability — shows ViewerInfoModal for unregistered anonymous viewers
  const requireInteraction = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else if (isAnonymousViewer && anonymousViewerId) {
      action();
    } else {
      setViewerInfoError('');
      setShowViewerInfoModal(true);
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

  // Restore anonymous viewer session from localStorage on mount.
  // Also pre-set accessCheckLoading so the "Stream is starting" overlay doesn't flash
  // while the access-status check (in the gate effect) is pending.
  useEffect(() => {
    if (!isAuthenticated && mainEvent?.id && mainEvent.id !== '') {
      const savedId = localStorage.getItem(`anonymousViewer_${mainEvent.id}`);
      const savedName = localStorage.getItem(`anonymousViewerName_${mainEvent.id}`);
      if (savedId && !anonymousViewerId) {
        setAnonymousViewerId(savedId);
        setIsAnonymousViewer(true);
        setAccessCheckLoading(true); // Will be cleared by the gate effect
        if (savedName) setAnonymousViewerName(savedName);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainEvent?.id, isAuthenticated]);

  const handleAuthLogin = async () => {
    if (!loginEmail || !loginPassword) { setAuthError('Please fill in all fields'); return; }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      if (res.success && res.data?.token) {
        const d = res.data;
        await authLogin({
          id: d.id || d.customerId || '',
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || loginEmail,
          phone: d.phone || '',
          customerId: d.customerId || '',
          customerType: d.customerType || 'Viewer',
        }, d.token!);
        setShowAuthModal(false);
        // Reload to refetch event with auth — backend returns whepUrl + hasPurchasedAccess for paid viewers
        window.location.reload();
      } else {
        setAuthError(res.data?.message || res.error || 'Incorrect email or password. Please try again.');
      }
    } catch {
      setAuthError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSignup = async () => {
    if (!signupFirstName || !signupLastName || !signupEmail || !signupPhone || !signupPassword) {
      setAuthError('Please fill in all fields');
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
        const customerId = res.data.customerId || '';
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

  const handleAuthVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) { setAuthError('Please enter the 4-digit verification code sent to your email.'); return; }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await verifyOtp({ customerId: otpCustomerId, otp: parseInt(otpValue, 10) });
      if (res.success && res.data?.action === 1) {
        const loginRes = await login({ email: signupEmail, password: signupPassword });
        if (loginRes.success && loginRes.data?.token) {
          const d = loginRes.data;
          await authLogin({
            id: d.id || d.customerId || '',
            firstName: d.firstName || signupFirstName,
            lastName: d.lastName || signupLastName,
            email: d.email || signupEmail,
            phone: d.phone || signupPhone,
            customerId: d.customerId || '',
            customerType: d.customerType || 'Viewer',
          }, d.token!);
          setShowAuthModal(false);
          window.location.reload();
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

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoading(true);
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
        const d = res.data;
        await authLogin({
          id: d.id || d.customerId || '',
          firstName: d.firstName || userInfo.given_name || '',
          lastName: d.lastName || userInfo.family_name || '',
          email: d.email || userInfo.email || '',
          phone: d.phone || '',
          customerId: d.customerId || d.id || '',
          customerType: d.customerType || 'Viewer',
        }, d.token!);
        setShowAuthModal(false);
        window.location.reload();
      } else {
        setAuthError(res.data?.message || res.error || 'Could not sign in with Google. Please try another method.');
      }
    } catch {
      setAuthError('Unable to connect to Google. Please check your internet connection and try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    setAuthError('Google sign-in was cancelled. You can try again or use email instead.');
  };

  // Handle anonymous viewer registration via ViewerInfoModal
  const handleViewerInfoSubmit = async (data: ViewerInfoData) => {
    if (!mainEvent?.id) return;
    setViewerInfoLoading(true);
    setViewerInfoError('');
    try {
      const fingerprint = await getDeviceId();
      const res = await registerAnonymousViewer(mainEvent.id, {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        deviceFingerprint: fingerprint,
      });
      if (!res.success) {
        // Backend handles existing-email cases via ACCESS_GRANTED / DEVICE_CONFLICT / REQUIRES_PAYMENT
        // status branches below — any !success here is a real error (network, server, validation).
        setViewerInfoError(res.error || 'Registration failed');
        return;
      }
      const resData = res.data as Record<string, unknown> | undefined;
      const status = resData?.status as string;
      const viewerId = resData?.viewerId as string;
      if (viewerId) {
        setAnonymousViewerId(viewerId);
        setIsAnonymousViewer(true);
        setAnonymousViewerName(data.name);
        localStorage.setItem(`anonymousViewer_${mainEvent.id}`, viewerId);
        localStorage.setItem(`anonymousViewerName_${mainEvent.id}`, data.name);
      }
      if (status === 'ACCESS_GRANTED') {
        setShowViewerInfoModal(false);
        const whepUrl = resData?.whepUrl as string;
        if (whepUrl) {
          setEvents(prev => [{ ...prev[0], whepUrl }, ...prev.slice(1)]);
          setStreamAccessGranted(true);
        }
      } else if (status === 'DEVICE_CONFLICT' || status === 'DEVICE_MISMATCH') {
        setShowViewerInfoModal(false);
        setShowDeviceSwitchModal(true);
      } else if (status === 'REQUIRES_PAYMENT') {
        setShowViewerInfoModal(false);
        // Payment gate overlay will handle this
      }
    } catch {
      setViewerInfoError('Connection error. Please try again.');
    } finally {
      setViewerInfoLoading(false);
    }
  };

  // Handle device switch confirmation for anonymous viewers
  const handleDeviceSwitchConfirm = async () => {
    if (!mainEvent?.id || !anonymousViewerId) return;
    setDeviceSwitchLoading(true);
    try {
      const fingerprint = await getDeviceId();
      const res = await switchAnonymousDevice(mainEvent.id, anonymousViewerId, fingerprint);
      if (res.success) {
        setShowDeviceSwitchModal(false);
        const whepUrl = (res.data as Record<string, unknown>)?.whepUrl as string;
        if (whepUrl) {
          setEvents(prev => [{ ...prev[0], whepUrl }, ...prev.slice(1)]);
          setStreamAccessGranted(true);
        }
      } else {
        setShowDeviceSwitchModal(false);
        setViewerInfoError(res.error || 'Could not switch device.');
        setShowViewerInfoModal(true);
      }
    } catch {
      setShowDeviceSwitchModal(false);
      setViewerInfoError('Connection error.');
      setShowViewerInfoModal(true);
    } finally {
      setDeviceSwitchLoading(false);
    }
  };

  // Load real event metadata from API on mount if eventId is in URL
  useEffect(() => {
    const eventId = searchParams.get('eventId') || searchParams.get('id');
    if (!eventId) return;

    const loadEventDetails = async () => {
      try {
        // Pass fingerprint for anonymous viewer access check when not authenticated
        let fingerprint: string | undefined;
        if (!isAuthenticated) {
          try { fingerprint = await getDeviceId(); } catch { /* ignore */ }
        }
        const response = await getPublicEventById(eventId, fingerprint);
        if (response.success && response.data) {
          const ev = response.data as Record<string, unknown>;
          setEvents(prev => [{
            ...prev[0],
            id: eventId,
            title: (ev.title as string) || prev[0].title,
            photographer: (ev.photographerName as string) || prev[0].photographer,
            photographerId: (ev.photographerId as string) || prev[0].photographerId,
            photographerAvatar: ((ev.photographer as Record<string, unknown>)?.profilePicture as string) || undefined,
            category: (ev.eventType as string) || (ev.category as string) || prev[0].category,
            // Preserve existing whepUrl if backend returns null (entry_fee gate)
            whepUrl: (ev.whepUrl as string) || prev[0].whepUrl || undefined,
            hlsManifestUrl: (ev.hlsManifestUrl as string) || prev[0].hlsManifestUrl || undefined,
            streamId: eventId || (ev.liveInputId as string) || prev[0].streamId,
            eventStatus: (ev.eventStatus as string) || undefined,
            streamType: (ev.streamType as 'entry_fee' | 'invite_token') ?? null,
            streamFee: (ev.streamFee as number) ?? null,
            streamFeeCurrencySymbol: (ev.streamFeeCurrencySymbol as string) ?? null,
            streamFeeCurrencyAbbreviation: (ev.streamFeeCurrencyAbbreviation as string) ?? null,
            hasInviteCode: (ev.hasInviteCode as boolean) ?? null,
            hasPurchasedAccess: (ev.hasPurchasedAccess as boolean) ?? undefined,
            eventDate: (ev.eventDate as string) ?? undefined,
            eventStartTime: (ev.startTime as string) ?? undefined,
          }, ...prev.slice(1)]);
        }
      } catch {
        // Keep default event data
      }
    };
    loadEventDetails();
  }, [searchParams, isAuthenticated]);


  // Stream access gate — determine flow based on streamType
  // Access is ALWAYS verified from the database (whepUrl / checkAnonymousAccessStatus).
  // The `from=payment` param only triggers a retry to handle post-payment race conditions.
  useEffect(() => {
    if (!mainEvent?.id || mainEvent.title === 'Loading...') return;

    const type = getStreamType(mainEvent);
    const fromPayment = searchParams.get('from') === 'payment';
    const urlToken = searchParams.get('inviteToken');
    const urlViewerId = searchParams.get('viewerId');

    if (type === 'entry_fee') {
      // Backend guards whepUrl for entry_fee streams:
      // authenticated + paid → whepUrl is populated
      // unauthenticated or unpaid → whepUrl is null
      if (isAuthenticated) {
        if (mainEvent.whepUrl) {
          setStreamAccessGranted(true);
        } else if (fromPayment) {
          // Just completed payment — backend may not have processed yet, retry after 2s
          setAccessCheckLoading(true);
          setTimeout(async () => {
            try {
              const retryRes = await getPublicEventById(mainEvent.id);
              if (retryRes.success && retryRes.data) {
                const retryWhep = (retryRes.data as Record<string, unknown>)?.whepUrl as string;
                if (retryWhep) {
                  setEvents(prev => [{ ...prev[0], whepUrl: retryWhep }, ...prev.slice(1)]);
                  setStreamAccessGranted(true);
                }
              }
            } catch { /* silent */ }
            setAccessCheckLoading(false);
          }, 2000);
        }
      } else {
        // Anonymous viewer — check access via DB (fingerprint + viewerId)
        const viewerId = urlViewerId || localStorage.getItem(`anonymousViewer_${mainEvent.id}`);
        if (viewerId) {
          setAnonymousViewerId(viewerId);
          setIsAnonymousViewer(true);
          setAccessCheckLoading(true);
          (async () => {
            try {
              const fingerprint = await getDeviceId();
              const res = await checkAnonymousAccessStatus(mainEvent.id, fingerprint, viewerId);
              const resData = res.data as Record<string, unknown> | undefined;
              if (res.success && resData?.hasAccess) {
                const whepUrl = resData?.whepUrl as string;
                if (whepUrl) {
                  setEvents(prev => [{ ...prev[0], whepUrl }, ...prev.slice(1)]);
                }
                const resName = resData?.name as string;
                if (resName) {
                  setAnonymousViewerName(resName);
                  localStorage.setItem(`anonymousViewerName_${mainEvent.id}`, resName);
                }
                setStreamAccessGranted(true);
                setAccessCheckLoading(false);
              } else if (resData?.reason === 'DEVICE_MISMATCH') {
                const resName = resData?.name as string;
                if (resName) {
                  setAnonymousViewerName(resName);
                  localStorage.setItem(`anonymousViewerName_${mainEvent.id}`, resName);
                }
                setShowDeviceSwitchModal(true);
                setAccessCheckLoading(false);
              } else if (fromPayment) {
                // Just completed payment — backend may not have processed yet, retry after 2s
                setTimeout(async () => {
                  try {
                    const fp = await getDeviceId();
                    const retryRes = await checkAnonymousAccessStatus(mainEvent.id, fp, viewerId);
                    const retryData = retryRes.data as Record<string, unknown> | undefined;
                    if (retryRes.success && retryData?.hasAccess) {
                      const retryWhepUrl = retryData?.whepUrl as string;
                      if (retryWhepUrl) {
                        setEvents(prev => [{ ...prev[0], whepUrl: retryWhepUrl }, ...prev.slice(1)]);
                      }
                      const retryName = retryData?.name as string;
                      if (retryName) {
                        setAnonymousViewerName(retryName);
                        localStorage.setItem(`anonymousViewerName_${mainEvent.id}`, retryName);
                      }
                      setStreamAccessGranted(true);
                    } else if (retryData?.reason === 'DEVICE_MISMATCH') {
                      const retryName = retryData?.name as string;
                      if (retryName) {
                        setAnonymousViewerName(retryName);
                        localStorage.setItem(`anonymousViewerName_${mainEvent.id}`, retryName);
                      }
                      setShowDeviceSwitchModal(true);
                    }
                  } catch { /* silent */ }
                  setAccessCheckLoading(false);
                }, 2000);
              } else {
                setAccessCheckLoading(false);
              }
            } catch {
              setAccessCheckLoading(false);
            }
          })();
        } else if (fromPayment) {
          // Came from payment but no viewerId — show modal to re-identify
          setViewerInfoError('');
          setShowViewerInfoModal(true);
        }
      }
      // Otherwise, "Purchase Access" overlay will show
    } else if (type === 'invite_token') {
      // Check URL token first, then localStorage for previously validated token
      const savedToken = localStorage.getItem(`streamToken_${mainEvent.id}`);
      const token = urlToken || savedToken;

      if (token) {
        setInviteTokenInput(token);
        (async () => {
          const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Viewer';
          setInviteTokenLoading(true);
          try {
            const res = await requestStreamAccess(mainEvent.id!, token, username || 'Viewer');
            if (res.success && res.data?.whepUrl) {
              // Persist token so viewer doesn't need to re-enter on return
              localStorage.setItem(`streamToken_${mainEvent.id}`, token);
              setEvents(prev => [{
                ...prev[0],
                whepUrl: res.data!.whepUrl,
              }, ...prev.slice(1)]);
              setStreamAccessGranted(true);
            } else {
              // Token invalid — clear saved token and prompt
              localStorage.removeItem(`streamToken_${mainEvent.id}`);
              if (savedToken && !urlToken) {
                // Saved token expired — don't show error, just prompt fresh
                setShowInviteTokenModal(true);
              } else {
                setInviteTokenError(res.error || 'Invalid invite token. Please try again.');
                setShowInviteTokenModal(true);
              }
            }
          } catch {
            setShowInviteTokenModal(true);
          } finally {
            setInviteTokenLoading(false);
          }
        })();
      } else {
        // No token anywhere — show token input overlay
        setShowInviteTokenModal(true);
      }
    } else {
      // No stream type or unknown — open access
      setStreamAccessGranted(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainEvent?.id, mainEvent?.streamType, mainEvent?.streamFee, mainEvent?.hasInviteCode, mainEvent?.title, mainEvent?.whepUrl, isAuthenticated]);

  // Handle invite token submission (username auto-filled from auth profile)
  const handleInviteTokenSubmit = async () => {
    if (!inviteTokenInput.trim() || !mainEvent?.id) return;
    const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : viewerUsername.trim();
    setInviteTokenLoading(true);
    setInviteTokenError('');
    try {
      const res = await requestStreamAccess(mainEvent.id, inviteTokenInput.trim(), username || 'Viewer');
      if (res.success && res.data?.whepUrl) {
        // Persist so viewer doesn't need to re-enter on return
        localStorage.setItem(`streamToken_${mainEvent.id}`, inviteTokenInput.trim());
        setEvents(prev => [{
          ...prev[0],
          whepUrl: res.data!.whepUrl,
        }, ...prev.slice(1)]);
        setStreamAccessGranted(true);
        setShowInviteTokenModal(false);
      } else {
        setInviteTokenError(res.error || 'Invalid invite token. Please try again.');
      }
    } catch {
      setInviteTokenError('Unable to validate token. Please check your connection and try again.');
    } finally {
      setInviteTokenLoading(false);
    }
  };

  // Stream status overlay — tracks ONGOING→PUBLISHED (paused) / ONGOING→COMPLETED (ended)
  const [streamOverlay, setStreamOverlay] = useState<'live' | 'paused' | 'ended' | 'scheduled' | null>(null);

  // Poll event status every 15s — detects status transitions
  useEffect(() => {
    const eventId = searchParams.get('eventId') || searchParams.get('id');
    if (!eventId) return;

    const pollEventStatus = async () => {
      try {
        // Pass fingerprint for anonymous viewer identification
        let fingerprint: string | undefined;
        if (!isAuthenticated) {
          try { fingerprint = await getDeviceId(); } catch { /* ignore */ }
        }
        const response = await getPublicEventById(eventId, fingerprint);
        if (response.success && response.data) {
          const ev = response.data as Record<string, unknown>;
          const newStatus = ((ev.eventStatus as string) || '').toUpperCase();
          const newWhepUrl = (ev.whepUrl as string) || undefined;
          const newHlsUrl = (ev.hlsManifestUrl as string) || undefined;

          setEvents(prev => {
            const current = prev[0];
            const oldStatus = (current.eventStatus || '').toUpperCase();

            // Detect status transitions
            if (oldStatus === 'ONGOING' && newStatus === 'PUBLISHED') {
              setStreamOverlay('paused'); // Photographer stopped — will resume
            } else if (oldStatus === 'ONGOING' && newStatus === 'COMPLETED') {
              setStreamOverlay('ended');
            } else if (newStatus === 'ONGOING') {
              setStreamOverlay('live'); // Stream is live (or resumed)
            } else if (newStatus === 'PUBLISHED') {
              setStreamOverlay('scheduled');
            }

            // CRITICAL: Never overwrite a valid whepUrl with null.
            // The public endpoint nulls whepUrl for entry_fee events when the
            // viewer isn't identified. If we already have a whepUrl (from
            // /access-status or /register), keep it.
            const resolvedWhepUrl = newWhepUrl || current.whepUrl;
            const resolvedHlsUrl = newHlsUrl || current.hlsManifestUrl;

            // Only update if something relevant changed
            if (current.eventStatus === (ev.eventStatus as string) && current.whepUrl === resolvedWhepUrl) return prev;
            return [{
              ...current,
              eventStatus: (ev.eventStatus as string) || undefined,
              whepUrl: resolvedWhepUrl,
              hlsManifestUrl: resolvedHlsUrl,
            }, ...prev.slice(1)];
          });
        }
      } catch {
        // Silent fail for polling
      }
    };

    // Set initial overlay based on current status
    const currentStatus = (mainEvent?.eventStatus || '').toUpperCase();
    if (currentStatus === 'ONGOING') setStreamOverlay('live');
    else if (currentStatus === 'COMPLETED') setStreamOverlay('ended');
    else if (currentStatus === 'PUBLISHED') setStreamOverlay('scheduled');

    const interval = setInterval(pollEventStatus, 15000);
    return () => clearInterval(interval);
  }, [searchParams]);

  // Poll viewer count every 15s (public endpoint — no auth required)
  useEffect(() => {
    const eventId = searchParams.get('eventId') || searchParams.get('id');
    if (!eventId) return;
    if (mainEvent?.eventStatus !== 'ONGOING') return;

    const pollViewerCount = async () => {
      try {
        const res = await getPublicViewerCount(eventId);
        if (res.success && res.data) {
          const count = (res.data as any).viewerCount ?? (res.data as any).data?.viewerCount ?? 0;
          setEvents(prev => {
            if (prev[0]?.viewers === count) return prev;
            return [{ ...prev[0], viewers: count }, ...prev.slice(1)];
          });
        }
      } catch {
        // Silent fail
      }
    };

    pollViewerCount();
    const interval = setInterval(pollViewerCount, 500);
    return () => clearInterval(interval);
  }, [searchParams, mainEvent?.eventStatus]);

  // Device access check + heartbeat every 30 seconds
  useEffect(() => {
    const eventId = searchParams.get('eventId') || searchParams.get('id');
    if (!eventId || !isAuthenticated) return;
    const currentStatus = (mainEvent?.eventStatus || '').toUpperCase();
    if (currentStatus !== 'ONGOING') return;

    let heartbeatInterval: ReturnType<typeof setInterval>;
    let cancelled = false;

    const initDeviceSession = async () => {
      try {
        const deviceId = await getDeviceId();
        const res = await checkDeviceAccess(eventId, deviceId);
        if (cancelled) return;
        const resData = res.data as Record<string, unknown> | undefined;
        if (!res.success || resData?.action === 0) {
          const msg = (resData?.message as string) || res.error || 'Access denied from this device';
          setDeviceError(msg);
          return;
        }
        setDeviceError(null);
        // Start heartbeat every 30 seconds
        heartbeatInterval = setInterval(async () => {
          if (cancelled) return;
          try {
            const hbRes = await sendHeartbeat(eventId, deviceId);
            const hbData = hbRes.data as Record<string, unknown> | undefined;
            if (!hbRes.success || hbData?.action === 0) {
              setDeviceError((hbData?.message as string) || 'Session expired');
              clearInterval(heartbeatInterval);
            }
          } catch { /* silent */ }
        }, 30000);
      } catch {
        // Silent fail — don't block viewing on fingerprint errors
      }
    };

    initDeviceSession();
    return () => {
      cancelled = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAuthenticated, mainEvent?.eventStatus]);

  // Anonymous viewer: device check + heartbeat every 30s + deactivate on page unload
  useEffect(() => {
    const eventId = searchParams.get('eventId') || searchParams.get('id');
    if (!eventId || isAuthenticated || !isAnonymousViewer || !anonymousViewerId) return;
    const currentStatus = (mainEvent?.eventStatus || '').toUpperCase();
    if (currentStatus !== 'ONGOING') return;

    let heartbeatInterval: ReturnType<typeof setInterval>;
    let cancelled = false;
    let deviceFingerprint = '';

    const initAnonSession = async () => {
      try {
        deviceFingerprint = await getDeviceId();
        const res = await anonymousDeviceCheck(eventId, anonymousViewerId, deviceFingerprint);
        if (cancelled) return;
        const resData = res.data as Record<string, unknown> | undefined;
        if (!res.success || resData?.action === 0) {
          const msg = (resData?.message as string) || res.error || 'Access denied from this device';
          setDeviceError(msg);
          return;
        }
        setDeviceError(null);
        // Heartbeat every 30 seconds
        heartbeatInterval = setInterval(async () => {
          if (cancelled) return;
          try {
            const hbRes = await anonymousHeartbeat(eventId, anonymousViewerId, deviceFingerprint);
            const hbData = hbRes.data as Record<string, unknown> | undefined;
            if (!hbRes.success || hbData?.action === 0) {
              setDeviceError((hbData?.message as string) || 'Session expired');
              clearInterval(heartbeatInterval);
            }
          } catch { /* silent */ }
        }, 30000);
      } catch { /* silent */ }
    };

    // Deactivate session on page unload
    const handleBeforeUnload = () => {
      if (deviceFingerprint && eventId) {
        const url = `${window.location.origin}/api/proxy/api/remote/public/anonymous-viewer/${eventId}/deactivate`;
        const body = JSON.stringify({ deviceFingerprint });
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      }
    };

    initAnonSession();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAuthenticated, isAnonymousViewer, anonymousViewerId, mainEvent?.eventStatus]);

  // Poll stream chat messages every 2 seconds
  // Authenticated users use coordinator endpoint; anonymous viewers use public endpoint
  useEffect(() => {
    if (!mainEvent?.streamId) return;
    // Need either authentication or anonymous viewer status to poll chat
    if (!isAuthenticated && !isAnonymousViewer) return;

    const pollChat = async () => {
      try {
        let chatMessages: Array<Record<string, unknown>> = [];

        if (isAuthenticated) {
          // Authenticated: use coordinator endpoint via apiClient
          const response = await getStreamChats(mainEvent.streamId, 0, 500);
          if (response.success && response.data) {
            const rawData = response.data as unknown;
            chatMessages = Array.isArray(rawData)
              ? rawData
              : (rawData as Record<string, unknown>)?.data
                ? ((rawData as Record<string, unknown>).data as Array<Record<string, unknown>>)
                : [];
          }
        } else {
          // Anonymous viewer: use public endpoint directly (no auth needed)
          const chatBase = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
            ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
          const res = await fetch(`${chatBase}/api/remote/public/events/${mainEvent.id}/chats?page=0&size=500`);
          if (res.ok) {
            const json = await res.json();
            chatMessages = Array.isArray(json?.data) ? json.data : [];
          }
        }

        if (chatMessages.length > 0) {
          // Filter out already-seen API messages and blocked users
          const newApiMessages = chatMessages.filter(m => {
            const id = String(m.id);
            const sender = (m.viewerUsername || m.sender || '') as string;
            return !seenApiMessageIds.current.has(id) && !blockedUsers.has(sender);
          });

          if (newApiMessages.length > 0) {
            // Mark these API IDs as seen
            newApiMessages.forEach(m => seenApiMessageIds.current.add(String(m.id)));

            setEvents(prev => {
              const updated = [...prev];
              const currentMessages = [...updated[mainEventIndex].messages];

              const convertedMessages: Message[] = newApiMessages.map(m => {
                const sender = (m.viewerUsername || m.sender || 'Unknown') as string;
                const msgText = (m.message || m.content || '') as string;
                // Capture the raw ISO timestamp from the backend so we can
                // filter pre-event wish messages out of the live chat.
                const rawCreatedAt = (m.createdAt || m.timestamp || m.created_at || '') as string;
                // Use backend's pre-formatted time, fall back to parsing timestamp
                const timeStr = m.time
                  ? String(m.time)
                  : rawCreatedAt
                    ? new Date(rawCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                return {
                  id: String(m.id),
                  apiMessageId: String(m.id),
                  sender,
                  senderId: m.senderId ? String(m.senderId) : undefined,
                  text: msgText,
                  time: timeStr,
                  delivered: true,
                  avatar: (m.viewerAvatar || m.avatar || '') as string || DEFAULT_USER_AVATAR,
                  videoUrl: (m.videoUrl as string) || undefined,
                  createdAt: rawCreatedAt || undefined,
                };
              });

              // Remove optimistic messages that now have a matching API message.
              // Check !m.apiMessageId (locally created) instead of !m.delivered,
              // because the send callback marks optimistic msgs as delivered before the poll runs.
              const apiTexts = new Set(newApiMessages.map(m => String(m.message || m.content || '')));
              const merged = currentMessages.filter(m => {
                if (!m.apiMessageId && apiTexts.has(m.text)) return false;
                return true;
              });

              updated[mainEventIndex] = {
                ...updated[mainEventIndex],
                messages: [...merged, ...convertedMessages],
              };
              return updated;
            });
          }

          // Update participants from all senders
          const senderMap = new Map<string, string>();
          chatMessages.forEach(m => {
            const sender = (m.viewerUsername || m.sender || 'Unknown') as string;
            if (!senderMap.has(sender)) {
              senderMap.set(sender, ((m.viewerAvatar || m.avatar || '') as string) || DEFAULT_USER_AVATAR);
            }
          });
          setParticipants(
            Array.from(senderMap.entries()).map(([name, avatar], idx) => ({
              id: idx + 1,
              name,
              status: 'active',
              avatar,
            }))
          );
        }
      } catch {
        // Silent fail for polling
      }
    };

    // Initial fetch
    pollChat();
    const interval = setInterval(pollChat, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainEvent?.streamId, mainEvent?.id, mainEventIndex, blockedUsers, isAuthenticated, isAnonymousViewer]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    // Only auto-scroll if user is near the bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [mainEvent?.messages?.length]);

  // ── Fetch stream ads + poll for manual triggers ──
  // Ads load independently — viewer is already on the stream page
  useEffect(() => {
    if (!mainEvent?.id || mainEvent.title === 'Loading...') return;
    let cancelled = false;

    // Fetch ads for this event
    getStreamAds(mainEvent.id).then(res => {
      console.log('[ADS] Fetch response:', JSON.stringify({ success: res.success, hasData: !!res.data }));
      if (cancelled || !res.success || !res.data) {
        console.log('[ADS] Skipped - cancelled:', cancelled, 'success:', res.success, 'data:', !!res.data);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      const ads = d.ads || d.data?.ads || [];
      const schedule = d.schedule || d.data?.schedule || {};
      console.log('[ADS] Parsed:', ads.length, 'ads, enabled:', schedule.enabled, 'interval:', schedule.intervalSeconds);
      if (ads.length > 0) {
        setStreamAds(ads);
        setAdScheduleInterval(schedule.intervalSeconds || 300);
        setAdsEnabled(schedule.enabled !== false);
        console.log('[ADS] State set - ads:', ads.length, 'interval:', schedule.intervalSeconds, 'enabled:', schedule.enabled);
      }
    }).catch(err => { console.log('[ADS] Fetch error:', err); });

    // Poll for manual triggers every 5s
    const pollInterval = setInterval(async () => {
      if (cancelled) return;
      try {
        const res = await pollAdTrigger(mainEvent.id);
        if (res.success && res.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = res.data as any;
          const trigger = d.trigger || d.data?.trigger;
          if (trigger?.adId) {
            const ad = streamAds.find(a => a.id === trigger.adId);
            if (ad) {
              // Force show this ad by temporarily prepending it
              setStreamAds(prev => [ad, ...prev.filter(a => a.id !== ad.id)]);
            }
          }
        }
      } catch { /* silent */ }
    }, 5000);

    return () => { cancelled = true; clearInterval(pollInterval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainEvent?.id, streamAccessGranted]);

  // Initialize WHEP (WebRTC) player — sub-second latency playback, with HLS fallback
  useEffect(() => {
    const whepUrl = mainEvent?.whepUrl;
    const hlsUrl = mainEvent?.hlsManifestUrl;
    const eventId = mainEvent?.id;
    if (!eventId || (!whepUrl && !hlsUrl)) {
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let hlsInstance: Hls | null = null;

    const initPlayer = (attempt = 0) => {
      if (cancelled) return;
      const videoEl = videoRefs.current[eventId];
      if (!videoEl) {
        if (attempt < 10) {
          retryTimer = setTimeout(() => initPlayer(attempt + 1), 200);
        }
        return;
      }

      // Destroy existing WHEP instance
      const existing = whepInstancesRef.current[eventId];
      if (existing) {
        existing.destroy();
        whepInstancesRef.current[eventId] = null;
      }

      // Set volume from saved preference
      const savedVol = volumeRef.current[eventId] ?? getSavedVolume();
      videoEl.volume = savedVol / 100;
      volumeRef.current[eventId] = savedVol;
      // Start muted for autoplay policy — will unmute immediately after play succeeds
      videoEl.muted = true;

      if (whepUrl) {
        // Primary: Connect via WHEP (WebRTC) for sub-second latency
        const whepClient = new WHEPClient(whepUrl, videoEl);
        whepInstancesRef.current[eventId] = whepClient;
      } else if (hlsUrl && Hls.isSupported()) {
        // Fallback: HLS playback (~10s latency)
        console.log('[StreamPlayer] WHEP unavailable, falling back to HLS:', hlsUrl);
        hlsInstance = new Hls({ liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 5 });
        hlsInstance.loadSource(hlsUrl);
        hlsInstance.attachMedia(videoEl);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().catch(() => {});
        });
      } else if (hlsUrl && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        videoEl.src = hlsUrl;
        videoEl.play().catch(() => {});
      }

      // Autoplay when stream attaches — start muted, then unmute immediately
      videoEl.onloadedmetadata = () => {
        if (cancelled) return;
        videoEl.play().then(() => {
          if (cancelled) return;
          // Unmute now that play succeeded — the user navigated here intentionally
          videoEl.muted = false;
          setPlaybackState(prev => ({
            ...prev,
            [eventId]: {
              ...prev[eventId],
              isPlaying: true,
              isMuted: false,
              volume: savedVol,
            }
          }));
        }).catch(() => {
          // Autoplay with sound blocked — stay muted, let user unmute manually
          setPlaybackState(prev => ({
            ...prev,
            [eventId]: {
              ...prev[eventId],
              isPlaying: false,
              isMuted: true,
              volume: savedVol,
            }
          }));
        });
      };
    };

    initPlayer();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      const whepInstance = whepInstancesRef.current[eventId];
      if (whepInstance) {
        whepInstance.destroy();
        whepInstancesRef.current[eventId] = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainEvent?.whepUrl, mainEvent?.hlsManifestUrl, mainEvent?.id]);

  // Swap animation state
  const [isSwapping, setIsSwapping] = useState(false);
  const [swappingFromIndex, setSwappingFromIndex] = useState<number | null>(null);
  const [swappingToIndex, setSwappingToIndex] = useState<number | null>(null);

  // State for the new message input
  const [newMessage, setNewMessage] = useState("");
  // Load saved volume from localStorage or default to 100
  const getSavedVolume = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('livestream-volume');
      return saved ? parseInt(saved, 10) : 100;
    }
    return 100;
  };

  // State for video playback - per event
  const [playbackState, setPlaybackState] = useState<{ [key: string]: { isPlaying: boolean; isMuted: boolean; progress: number; volume: number } }>({
    [initialId]: { isPlaying: false, isMuted: false, progress: 0, volume: getSavedVolume() }
  });

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  // Refs for the video elements - one per event
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  // HLS.js instances - one per event
  const whepInstancesRef = useRef<{ [key: string]: WHEPClient | null }>({});
  // Stable ref callback for main video — only stores element, no side effects
  const mainVideoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    const id = events[mainEventIndex]?.id;
    if (!id) return;
    if (el) {
      videoRefs.current[id] = el;
      // DEBUG: Intercept muted changes to trace who sets them
      if (!(el as any).__mutedIntercepted) {
        (el as any).__mutedIntercepted = true;
        let _muted = el.muted;
        Object.defineProperty(el, 'muted', {
          get() { return _muted; },
          set(val: boolean) {
            if (val !== _muted) {
              console.trace();
            }
            _muted = val;
            // Apply to the real property via the prototype
            (Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted')?.set as ((v: boolean) => void) | undefined)?.call(el, val);
          },
          configurable: true,
        });
      }
    } else {
      delete videoRefs.current[id];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events[mainEventIndex]?.id]);
  // Ref to always have latest playback state in enforcement loop
  const playbackStateRef = useRef(playbackState);
  // Direct volume storage ref - bypasses React state for immediate access
  const volumeRef = useRef<{ [key: string]: number }>({ [initialId]: getSavedVolume() });

  // Update ref whenever playback state changes
  useEffect(() => {
    playbackStateRef.current = playbackState;
  }, [playbackState]);

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    const mainEventId = events[mainEventIndex]?.id;
    if (mainEventId && playbackState[mainEventId]) {
      const volume = playbackState[mainEventId].volume;
      if (typeof window !== 'undefined') {
        localStorage.setItem('livestream-volume', volume.toString());
      }
    }
  }, [playbackState, mainEventIndex, events]);

  // State for modals
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [newEventId, setNewEventId] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Settings state
  const [showSettings, setShowSettings] = useState(false);

  // ── Ad system state ──
  const [streamAds, setStreamAds] = useState<StreamAd[]>([]);
  const [adScheduleInterval, setAdScheduleInterval] = useState(300);
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [showReportIssues, setShowReportIssues] = useState(false);
  const [lowLatencyMode, setLowLatencyMode] = useState(true);
  // Device access state
  const [deviceError, setDeviceError] = useState<string | null>(null);
  // Live edge tracking
  const [isBehindLive, setIsBehindLive] = useState(false);
  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [userHasRated, setUserHasRated] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  // Emoji reactions state
  const [activeReactions, setActiveReactions] = useState<Array<{ id: number; emoji: string; timestamp: number }>>([]);
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  // Copy state
  const [isCopied, setIsCopied] = useState(false);
  const [showVideoMessageRecorder, setShowVideoMessageRecorder] = useState(false);
  // Message actions state
  const [openMessageMenu, setOpenMessageMenu] = useState<number | string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number | string; sender: string; text: string } | null>(null);
  // Video controls visibility state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Chat auto-scroll and deduplication
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const seenApiMessageIds = useRef<Set<string>>(new Set());
  // Mobile chat visibility state
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Gift modal state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTargetEvent, setGiftTargetEvent] = useState<EventStream | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  // Donation prompt modal state
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);
  const [includeDonation, setIncludeDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  // Drives the standalone DonationPromptModal that pops over the gift modal
  // when the user clicks "Send Gift". Replaces the old inline donation toggle.
  const [showGiftDonationOverlay, setShowGiftDonationOverlay] = useState(false);
  // Drives the celebratory AppreciationModal shown after a gift OR a donation
  // payment completes successfully. Type switches the visual theme.
  const [appreciation, setAppreciation] = useState<{
    open: boolean;
    type: 'gift' | 'donation';
    amount: number;
    currency: string;
    recipient?: string;
  }>({ open: false, type: 'gift', amount: 0, currency: 'RWF' });
  // Payment details state
  const [paymentPhone, setPaymentPhone] = useState("");
  // API currencies & gift/donation loading state
  const [streamCurrencies, setStreamCurrencies] = useState<APICurrency[]>([]);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  // Gift payment inline state (replaces XentriPayModal)
  const [giftStep, setGiftStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [giftPaymentUrl, setGiftPaymentUrl] = useState<string | null>(null);
  const stopGiftPollingRef = useRef<(() => void) | null>(null);

  // Fetch currencies on mount
  useEffect(() => {
    getCurrencies()
      .then(res => {
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setStreamCurrencies(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Prevent accidental page reload while gift modal is open
  useEffect(() => {
    if (!showGiftModal) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showGiftModal]);

  // Stream type detection using explicit streamType field from API
  // Fallback to heuristic if API doesn't return streamType yet
  const getStreamType = (event: EventStream): 'entry_fee' | 'invite_token' | null =>
    event.streamType || (event.streamFee && event.streamFee > 0 ? 'entry_fee' : event.hasInviteCode ? 'invite_token' : null);

  const isEntryFeeStream = (event: EventStream) => getStreamType(event) === 'entry_fee';
  const isInviteTokenStream = (event: EventStream) => getStreamType(event) === 'invite_token';

  // All live streams are giftable — both paid (entry_fee) and free (invite_token) events
  const isEventGiftable = (_event: EventStream) => true;

  // Check if current main event is giftable (for backward compatibility)
  const isGiftableEvent = isEventGiftable(mainEvent);

  // Open gift modal for a specific event - donation section included by default
  const openGiftModal = (event: EventStream) => {
    setGiftTargetEvent(event);
    setIncludeDonation(true);
    setDonationAmount("");
    setShowGiftModal(true);
  };

  // Handle donation prompt responses
  const handleDonationPromptYes = () => {
    setShowDonationPrompt(false);
    setIncludeDonation(true);
    setShowGiftModal(true);
  };

  const handleDonationPromptNo = () => {
    setShowDonationPrompt(false);
    setIncludeDonation(false);
    setDonationAmount("");
    setShowGiftModal(true);
  };

  // Payment methods
  const paymentMethods = [
    { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png' },
    { id: 'airtel', name: 'Airtel Money', image: '/airtel.png' },
    { id: 'card', name: 'VISA & Master Card', image: '/cards.png' }
  ];

  // Helper to reset all gift modal state (also clears donation from merged flow)
  const resetGiftModal = () => {
    setShowGiftModal(false);
    setGiftTargetEvent(null);
    setSelectedPaymentMethod(null);
    setGiftAmount("");
    setGiftMessage("");
    setPaymentPhone("");
    setIncludeDonation(false);
    setDonationAmount("");
    setGiftStep('form');
    setGiftPaymentUrl(null);
    setGiftError(null);
    if (stopGiftPollingRef.current) {
      stopGiftPollingRef.current();
      stopGiftPollingRef.current = null;
    }
  };

  // Validate payment details based on selected method
  const isPaymentDetailsValid = () => {
    if (!selectedPaymentMethod || !giftAmount) return false;

    switch (selectedPaymentMethod) {
      case 'mtn':
      case 'airtel':
        return paymentPhone.length >= 10;
      case 'card':
        return true;
      default:
        return false;
    }
  };

  // Handle sending gift - call API directly, no XentriPayModal
  const handleSendGift = async (donationOverride?: number) => {
    if (!canInteract) {
      requireInteraction(() => {});
      return;
    }
    if (!giftAmount || parseInt(giftAmount) <= 0) {
      alert('Please enter a gift amount');
      return;
    }

    setGiftLoading(true);
    setGiftError(null);

    const targetEvent = giftTargetEvent || mainEvent;
    const isCard = selectedPaymentMethod === 'card';
    const providerMap: Record<string, string> = { mtn: 'MTN', airtel: 'AIRTEL' };
    const paymentMethodType = isCard ? 'CARD' : 'MOBILE_MONEY';

    // Resolve currency — use event's currency, default to RWF
    const abbr = mainEvent?.streamFeeCurrencyAbbreviation;
    const matchedCurrency = abbr ? streamCurrencies.find(c => c.code === abbr) : null;
    const currencyId = matchedCurrency?.id
      || streamCurrencies.find(c => c.code === 'RWF')?.id
      || (streamCurrencies.length > 0 ? streamCurrencies[0].id : '');

    // Donation: prefer the explicit override (from DonationPromptModal),
    // fall back to the state-driven value for any legacy callers.
    const donAmt = donationOverride !== undefined ? donationOverride : (parseInt(donationAmount) || 0);
    const redirectUrl = isCard
      ? (window.location.href.startsWith('http://') ? 'https://connekyt.com' : window.location.href)
      : undefined;

    try {
      let response;

      if (isAuthenticated) {
        // Authenticated user — use standard streaming payment
        response = await initiateXentriPayStreaming({
          eventId: targetEvent.id,
          amount: parseInt(giftAmount),
          currencyId,
          ...(donAmt > 0 ? { donationAmount: donAmt } : {}),
          ...(isCard ? {} : { phone: paymentPhone, telecomProvider: providerMap[selectedPaymentMethod!] }),
          paymentMethod: paymentMethodType,
          ...(isCard ? { redirectUrl } : {}),
        });
      } else if (isAnonymousViewer && anonymousViewerId) {
        // Anonymous viewer — use public gift endpoint (works for both entry_fee and invite_token)
        const fingerprint = await getDeviceId();
        const chatBase = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
          ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
        const giftRes = await fetch(`${chatBase}/api/remote/public/anonymous-viewer/${targetEvent.id}/gift`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewerId: anonymousViewerId,
            deviceFingerprint: fingerprint,
            amount: parseInt(giftAmount),
            currencyId,
            ...(isCard ? {} : { phone: paymentPhone, telecomProvider: providerMap[selectedPaymentMethod!] }),
            paymentMethod: paymentMethodType,
            ...(isCard ? { redirectUrl } : {}),
            ...(giftMessage.trim() ? { giftMessage: giftMessage.trim() } : {}),
          }),
        });
        if (giftRes.ok) {
          const json = await giftRes.json();
          response = { success: json.action === 1, data: json.data, error: json.message };
        } else {
          const json = await giftRes.json().catch(() => ({}));
          response = { success: false, error: json.message || 'Failed to initiate gift payment' };
        }
      }

      if (!response?.success || !response?.data) {
        throw new Error(response?.error || 'Failed to initiate payment');
      }

      const data = response.data;

      // For card payments, open redirect URL
      if (isCard && data.paymentUrl) {
        setGiftPaymentUrl(data.paymentUrl);
        window.open(data.paymentUrl, '_blank');
      }

      setGiftStep('processing');

      // Start polling for payment status (usePublic=true for anonymous viewers)
      const usePublicPolling = !isAuthenticated;
      stopGiftPollingRef.current = pollXentriPayStatus(
        data.refid,
        {
          onSuccess: (_data: XentriPayStatusResponse) => {
            // Capture gift + donation totals BEFORE resetting modal state
            const sentGift = parseInt(giftAmount) || 0;
            const sentDonation = donAmt;
            const sentCurrency = mainEvent?.streamFeeCurrencyAbbreviation || 'RWF';
            const sentRecipient = targetEvent.photographer || mainEvent?.photographer;

            setGiftStep('success');
            // Close the gift modal quickly, then show the appreciation overlay
            setTimeout(() => {
              resetGiftModal();
              // Show GIFT appreciation first
              setAppreciation({
                open: true,
                type: 'gift',
                amount: sentGift,
                currency: sentCurrency,
                recipient: sentRecipient,
              });
              // If a donation was added, queue the donation appreciation right
              // after the gift appreciation closes
              if (sentDonation > 0) {
                const flipDelayMs = 8200;
                window.setTimeout(() => {
                  setAppreciation({
                    open: true,
                    type: 'donation',
                    amount: sentDonation,
                    currency: sentCurrency,
                  });
                }, flipDelayMs);
              }
            }, 800);
          },
          onFailure: (_data: XentriPayStatusResponse) => {
            setGiftStep('failed');
            setGiftError('Payment was declined or timed out. Please try again.');
          },
          onError: (errorMsg: string) => {
            setGiftStep('failed');
            setGiftError(errorMsg || 'Something went wrong while processing your payment.');
          },
        },
        2000,
        150,
        usePublicPolling
      );
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const lower = raw.toLowerCase();
      let msg: string;
      if (lower.includes('minimum amount')) {
        msg = `The minimum gift amount is 100 ${mainEvent?.streamFeeCurrencyAbbreviation || 'RWF'}. Please enter a higher amount.`;
      } else if (lower.includes('maximum amount') || lower.includes('exceeds')) {
        msg = 'The gift amount exceeds the allowed limit. Please enter a smaller amount.';
      } else if (lower.includes('insufficient') || lower.includes('balance')) {
        msg = 'Insufficient balance. Please check your account and try again.';
      } else if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) {
        msg = 'Unable to connect. Please check your internet connection and try again.';
      } else if (lower.includes('device') || lower.includes('fingerprint')) {
        msg = 'Device verification failed. Please refresh the page and try again.';
      } else if (lower.includes('viewer not found') || lower.includes('not found')) {
        msg = 'Your session has expired. Please refresh the page and try again.';
      } else {
        msg = 'Could not initiate payment. Please try again or choose a different payment method.';
      }
      setGiftError(msg);
      setGiftStep('failed');
    } finally {
      setGiftLoading(false);
    }
  };

  // Get current time
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Recording timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Enforce video states - mute mini-players and manage main player pause state
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Skip enforcement during swaps to prevent conflicts
      if (isSwapping) return;

      // Use ref to get latest playback state without closure issues
      const currentPlaybackState = playbackStateRef.current;

      events.forEach((event, idx) => {
        const video = videoRefs.current[event.id];
        if (!video) return;

        const state = currentPlaybackState[event.id];

        if (idx !== mainEventIndex) {
          // Mini-player: ALWAYS muted, volume at 0, and ALWAYS playing
          if (!video.muted) {
            video.muted = true;
          }
          if (video.volume !== 0) {
            video.volume = 0;
          }
          // Keep mini-players playing at all times
          if (video.paused) {
            video.play().catch(() => {});
          }
        } else {
          // Main player: Only enforce volume and pause state — never touch muted
          if (state) {
            const savedVolume = volumeRef.current[event.id] ?? state.volume ?? 100;
            const targetVolume = savedVolume / 100;
            if (Math.abs(video.volume - targetVolume) > 0.01) {
              video.volume = targetVolume;
            }

            // Only enforce pause — don't auto-play, let togglePlay handle that
            if (!state.isPlaying && !video.paused) {
              video.pause();
            }
          }
        }
      });
    }, 200); // Check more frequently (every 200ms) to catch resets quickly

    return () => clearInterval(intervalId);
  }, [mainEventIndex, events.length, isSwapping]); // Don't include playbackState to avoid re-creating interval

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!canInteract) {
      requireInteraction(() => {});
      return;
    }
    if (newMessage.trim()) {
      const messageText = replyingTo
        ? `@${replyingTo.sender} ${newMessage}`
        : newMessage;

      const tempId = Date.now();
      // Use viewer's real name for display — anonymousViewerName for paid viewers, user profile for JWT-authenticated
      const senderName = anonymousViewerName
        || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '')
        || 'You';
      const newMsg: Message = {
        id: tempId,
        sender: senderName,
        text: messageText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        delivered: false,
        avatar: isAuthenticated ? (user?.profilePicture || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR,
        replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender } : undefined
      };

      // Optimistic update
      setEvents(prev => {
        const updated = [...prev];
        updated[mainEventIndex] = {
          ...updated[mainEventIndex],
          messages: [...updated[mainEventIndex].messages, newMsg],
        };
        return updated;
      });
      setNewMessage("");
      setReplyingTo(null);

      // Send to API — branch on auth type
      // Paid entry_fee viewers (have viewerId) use public endpoint; others use coordinator endpoint
      try {
        let success = false;
        if (anonymousViewerId) {
          // Paid viewer — use public chat endpoint (no JWT needed)
          const fingerprint = await getDeviceId();
          const chatBase = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
            ? '/api/proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com');
          const res = await fetch(
            `${chatBase}/api/remote/public/events/${mainEvent.id}/chats`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ viewerId: anonymousViewerId, message: messageText, deviceFingerprint: fingerprint }),
            }
          );
          if (res.ok) {
            const json = await res.json();
            success = json.action === 1;
          }
        } else if (isAuthenticated) {
          // JWT-authenticated viewer (free/invite_token events)
          const response = await sendStreamChat(mainEvent.streamId, messageText);
          success = !!response.success;
        }
        if (success) {
          // Mark as delivered
          setEvents(prev => {
            const updated = [...prev];
            updated[mainEventIndex] = {
              ...updated[mainEventIndex],
              messages: updated[mainEventIndex].messages.map(m =>
                m.id === tempId ? { ...m, delivered: true } : m
              ),
            };
            return updated;
          });
        }
      } catch {
        // Message stays as undelivered — no removal
      }
    }
  };

  // Handle sending a video message
  const handleSendVideoMessage = async (videoBlob: Blob) => {
    const eventId = events[mainEventIndex]?.id;
    if (!eventId) return;

    // Show optimistic local message while uploading
    const videoUrl = URL.createObjectURL(videoBlob);
    const tempId = Date.now();
    const updatedEvents = [...events];
    updatedEvents[mainEventIndex].messages = [
      ...updatedEvents[mainEventIndex].messages,
      {
        id: tempId,
        sender: "You",
        text: "[Video Message - Sending...]",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        delivered: false,
        avatar: isAuthenticated ? (user?.profilePicture || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR,
        videoUrl
      },
    ];
    setEvents(updatedEvents);

    try {
      const videoFile = new File([videoBlob], `video-message-${Date.now()}.webm`, { type: videoBlob.type || 'video/webm' });
      let success = false;

      if (isAuthenticated) {
        const res = await sendStreamVideoChat(eventId, videoFile);
        success = !!res.success;
      } else if (isAnonymousViewer && anonymousViewerId) {
        const fingerprint = await getDeviceId();
        const res = await sendAnonymousVideoChat(eventId, anonymousViewerId, videoFile, fingerprint);
        success = !!res.success;
      }

      if (success) {
        // Update the optimistic message to show as delivered
        setEvents(prev => {
          const updated = [...prev];
          updated[mainEventIndex].messages = updated[mainEventIndex].messages.map(msg =>
            msg.id === tempId ? { ...msg, text: "[Video Message]", delivered: true } : msg
          );
          return updated;
        });
      } else {
        // Mark as failed
        setEvents(prev => {
          const updated = [...prev];
          updated[mainEventIndex].messages = updated[mainEventIndex].messages.map(msg =>
            msg.id === tempId ? { ...msg, text: "[Video Message - Failed to send]" } : msg
          );
          return updated;
        });
      }
    } catch {
      setEvents(prev => {
        const updated = [...prev];
        updated[mainEventIndex].messages = updated[mainEventIndex].messages.map(msg =>
          msg.id === tempId ? { ...msg, text: "[Video Message - Failed to send]" } : msg
        );
        return updated;
      });
    }
  };

  // Handle delete message
  const handleDeleteMessage = (messageId: number | string) => {
    const updatedEvents = [...events];
    updatedEvents[mainEventIndex].messages = updatedEvents[mainEventIndex].messages.filter(
      msg => msg.id !== messageId
    );
    setEvents(updatedEvents);
    setOpenMessageMenu(null);
  };

  // Handle edit message
  const handleEditMessage = (messageId: number | string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingMessageText(currentText);
    setOpenMessageMenu(null);
  };

  // Handle save edited message
  const handleSaveEditedMessage = (messageId: number | string) => {
    if (editingMessageText.trim()) {
      const updatedEvents = [...events];
      const messageIndex = updatedEvents[mainEventIndex].messages.findIndex(
        msg => msg.id === messageId
      );
      if (messageIndex !== -1) {
        updatedEvents[mainEventIndex].messages[messageIndex].text = editingMessageText.trim();
        setEvents(updatedEvents);
      }
    }
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  // Handle block user
  const handleBlockUser = (sender: string, senderId?: string) => {
    // Block user locally and filter their messages from the chat
    setBlockedUsers(prev => new Set(prev).add(sender));
    setEvents(prev => {
      const updated = [...prev];
      updated[mainEventIndex] = {
        ...updated[mainEventIndex],
        messages: updated[mainEventIndex].messages.filter(m => m.sender !== sender),
      };
      return updated;
    });
    setOpenMessageMenu(null);

    // Also block on the backend if authenticated and we have a user ID
    if (isAuthenticated && senderId && mainEvent?.id) {
      blockUserInStream(mainEvent.id, senderId).catch(() => { /* local block still applies */ });
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (messageId: number | string, sender: string, text: string) => {
    setReplyingTo({ id: messageId, sender, text });
    setOpenMessageMenu(null);
    // Focus on the message input
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="Send a message"]') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Toggle video play/pause - ONLY for main player
  const togglePlay = (eventId: string) => {
    const video = videoRefs.current[eventId];
    if (video) {
      const currentState = playbackState[eventId];
      const willBePlaying = !currentState?.isPlaying;

      // If video is still muted from autoplay fallback, unmute on user-initiated play
      if (willBePlaying && video.muted) {
        video.muted = false;
        setPlaybackState(prev => ({
          ...prev,
          [eventId]: { ...prev[eventId], isPlaying: true, isMuted: false }
        }));
        playbackStateRef.current = {
          ...playbackStateRef.current,
          [eventId]: { ...playbackStateRef.current[eventId], isPlaying: true, isMuted: false }
        };
        video.play().catch(() => {});
        return;
      }

      setPlaybackState(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], isPlaying: willBePlaying }
      }));
      playbackStateRef.current = {
        ...playbackStateRef.current,
        [eventId]: { ...playbackStateRef.current[eventId], isPlaying: willBePlaying }
      };

      if (willBePlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  };

  // Toggle video mute - ONLY for main player
  const toggleMute = (eventId: string) => {
    const video = videoRefs.current[eventId];
    if (video) {
      // Only allow mute toggle on main player
      const mainEventId = events[mainEventIndex]?.id;
      if (eventId !== mainEventId) return;

      const currentState = playbackState[eventId];
      const newMutedState = !currentState?.isMuted;
      video.muted = newMutedState;

      // Update ref immediately so togglePlay reads correct value
      playbackStateRef.current = {
        ...playbackStateRef.current,
        [eventId]: { ...playbackStateRef.current[eventId], isMuted: newMutedState }
      };

      setPlaybackState(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], isMuted: newMutedState }
      }));
    }
  };

  // Handle volume change
  const handleVolumeChange = (eventId: string, newVolume: number) => {
    const video = videoRefs.current[eventId];
    if (video) {
      // STEP 1: Store in direct volume ref FIRST - this is the source of truth
      volumeRef.current[eventId] = newVolume;

      // STEP 2: Set video element volume immediately
      video.volume = newVolume / 100;

      // STEP 3: Update the playbackStateRef (before state) - for enforcement loop
      const updatedEventState = {
        ...playbackStateRef.current[eventId],
        volume: newVolume,
        isMuted: newVolume === 0
      };
      playbackStateRef.current = {
        ...playbackStateRef.current,
        [eventId]: updatedEventState
      };

      // STEP 4: Update React state (async) - for UI
      setPlaybackState(prev => {
        const newState = {
          ...prev,
          [eventId]: {
            ...prev[eventId],
            volume: newVolume,
            isMuted: newVolume === 0
          }
        };
        return newState;
      });

      // STEP 5: Sync mute with volume — volume > 0 means unmute, volume = 0 means mute
      video.muted = newVolume === 0;

    }
  };

  // Update video progress bar
  const handleTimeUpdate = (eventId: string) => {
    const video = videoRefs.current[eventId];
    if (video) {
      const progress = (video.currentTime / video.duration) * 100;
      setPlaybackState(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], progress }
      }));
      // Track if viewer is behind the live edge (main player only)
      if (eventId === mainEvent?.id) {
        if (video.duration && isFinite(video.duration)) {
          // HLS/buffered source — compare currentTime to duration
          setIsBehindLive(video.duration - video.currentTime > 5);
        }
        // For WebRTC (duration=Infinity), isBehindLive is managed by stall detection below
      }
    }
  };

  // Jump to live edge — reconnect WHEP for WebRTC, seek for HLS
  const jumpToLive = () => {
    const video = videoRefs.current[mainEvent.id];
    if (!video) return;

    const isWebRTC = video.srcObject instanceof MediaStream;
    if (isWebRTC && mainEvent.whepUrl) {
      // Reconnect WHEP client for a fresh live connection
      const existing = whepInstancesRef.current[mainEvent.id];
      if (existing) {
        existing.destroy();
        whepInstancesRef.current[mainEvent.id] = null;
      }
      const whepClient = new WHEPClient(mainEvent.whepUrl, video);
      whepInstancesRef.current[mainEvent.id] = whepClient;
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
    } else if (video.duration && isFinite(video.duration)) {
      video.currentTime = video.duration;
    }
    setIsBehindLive(false);
  };

  // WebRTC stall detection — detect when viewer falls behind live edge
  // For WebRTC, video.duration is Infinity so we track frame progress instead
  const lastFrameTimeRef = useRef<number>(0);
  useEffect(() => {
    const video = videoRefs.current[mainEvent?.id];
    if (!video || !mainEvent?.whepUrl) return;
    const isWebRTC = video.srcObject instanceof MediaStream;
    if (!isWebRTC) return;

    const checkStall = setInterval(() => {
      if (video.paused) {
        setIsBehindLive(true);
        return;
      }
      // If currentTime hasn't advanced in 3s, stream is stalled
      if (video.currentTime === lastFrameTimeRef.current && lastFrameTimeRef.current > 0) {
        setIsBehindLive(true);
      } else {
        setIsBehindLive(false);
      }
      lastFrameTimeRef.current = video.currentTime;
    }, 3000);

    return () => clearInterval(checkStall);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainEvent?.id, mainEvent?.whepUrl]);

  // Effect to add listeners for main video
  useEffect(() => {
    const video = videoRefs.current[mainEvent.id];
    if (video) {
        const handleUpdate = () => handleTimeUpdate(mainEvent.id);

        const handlePlay = () => {
          // Sync isPlaying + read actual muted from DOM so icon matches reality
          const mainVid = videoRefs.current[mainEvent.id];
          const actualMuted = mainVid ? mainVid.muted : true;
          setPlaybackState(prev => {
            const updated = { ...prev };
            events.forEach(event => {
              if (event.id === mainEvent.id) {
                updated[event.id] = { ...prev[event.id], isPlaying: true, isMuted: actualMuted };
              } else {
                updated[event.id] = { ...prev[event.id], isPlaying: true };
              }
            });
            return updated;
          });
          playbackStateRef.current = {
            ...playbackStateRef.current,
            [mainEvent.id]: { ...playbackStateRef.current[mainEvent.id], isPlaying: true, isMuted: actualMuted }
          };
        };

        const handlePause = () => {
          // Only update isPlaying — never touch isMuted or volume
          setPlaybackState(prev => {
            const updated = { ...prev };
            events.forEach(event => {
              updated[event.id] = { ...prev[event.id], isPlaying: false };
            });
            return updated;
          });

          // Actually pause all video elements
          events.forEach(event => {
            const v = videoRefs.current[event.id];
            if (v && !v.paused) {
              v.pause();
            }
          });
        };

        video.addEventListener('timeupdate', handleUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleUpdate);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }
  }, [mainEvent.id, events]);

  // Sync video elements when main event ID changes only (not on every state change)
  useEffect(() => {
    // Skip sync during swaps - the swap function handles it
    if (isSwapping) return;

    // Use a ref to track if we've already applied state to prevent loops
    let isApplying = false;

    const syncVideos = () => {
      if (isApplying || isSwapping) return;
      isApplying = true;

      const mainVideo = videoRefs.current[mainEvent.id];
      const mainState = playbackState[mainEvent.id];

      // Apply state to main video — only play/pause and volume, never muted
      if (mainVideo && mainState) {
        mainVideo.volume = (mainState.volume ?? 100) / 100;

        if (mainState.isPlaying && mainVideo.paused) {
          mainVideo.play().catch(() => {});
        } else if (!mainState.isPlaying && !mainVideo.paused) {
          mainVideo.pause();
        }
      }

      // Sync ALL videos (not just mini-players)
      events.forEach((event, idx) => {
        const video = videoRefs.current[event.id];
        if (!video) return;

        const state = playbackState[event.id];

        if (idx !== mainEventIndex) {
          // Mini-player: ALWAYS muted with zero volume and ALWAYS playing
          video.muted = true;
          video.volume = 0;
          // Keep mini-players playing
          if (video.paused) {
            video.play().catch(() => {});
          }
        } else {
          // Main player: Only enforce play/pause — never touch muted
          if (state) {
            if (!state.isPlaying && !video.paused) {
              video.pause();
            } else if (state.isPlaying && video.paused) {
              video.play().catch(() => {});
            }
          }
        }
      });

      isApplying = false;
    };

    syncVideos();
    const timeoutId = setTimeout(syncVideos, 150);
    // Also check after a longer delay to catch late-mounting videos
    const timeoutId2 = setTimeout(syncVideos, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [mainEvent.id, isSwapping]); // Depend on isSwapping to skip during swaps

  // Handle adding new event
  const handleAddEvent = () => {
    if (newEventId.trim() && events.length < 3) {
      const newEvent: EventStream = {
        id: `event-${Date.now()}`,
        title: "New Event Live Stream",
        photographer: "Guest Photographer",
        photographerId: "",
        viewers: 1250,
        category: "Live Events",
        videoSrc: events.length === 1 ? "/live-stream-2.mp4" : "/bako.mp4",
        streamId: newEventId.trim(),
        startTime: "Just started",
        messages: []
      };

      // Use saved volume from localStorage or current main volume
      const savedVolume = getSavedVolume();
      const currentMainVolume = playbackState[events[mainEventIndex].id]?.volume ?? savedVolume;

      setEvents(prev => [...prev, newEvent]);
      setPlaybackState(prev => ({
        ...prev,
        [newEvent.id]: { isPlaying: true, isMuted: false, progress: 0, volume: currentMainVolume }
      }));

      // Switch to the new event as main
      setMainEventIndex(events.length);

      setShowAddEventModal(false);
      setNewEventId("");

      // Mute the current main (will become mini) with zero volume
      setTimeout(() => {
        const currentMainVideo = videoRefs.current[events[mainEventIndex].id];
        if (currentMainVideo) {
          currentMainVideo.muted = true;
          currentMainVideo.volume = 0;
        }
      }, 100);
    }
  };

  // Switch main event with animation - COMPLETELY REFACTORED
  const switchToMainEvent = (index: number) => {
    if (index !== mainEventIndex && !isSwapping) {
      setIsSwapping(true);
      setSwappingFromIndex(mainEventIndex);
      setSwappingToIndex(index);

      const newMainEventId = events[index].id;
      const oldMainEventId = events[mainEventIndex].id;

      // Get current states
      const oldMainState = playbackState[oldMainEventId] || { volume: 100, isPlaying: true, isMuted: false };
      const newMainState = playbackState[newMainEventId] || { volume: 100, isPlaying: true, isMuted: true };

      // Save the volume we want to apply to new main (keep the current main's volume setting)
      const targetVolume = oldMainState.volume ?? 100;

      // CRITICAL: Save current playback positions (currentTime) BEFORE any manipulation
      const savedPositions: { [key: string]: number } = {};
      events.forEach((event) => {
        const video = videoRefs.current[event.id];
        if (video) {
          savedPositions[event.id] = video.currentTime;
        }
      });

      // IMMEDIATELY pause, mute ALL videos and set volume to 0 to prevent audio overlap during animation
      events.forEach((event) => {
        const video = videoRefs.current[event.id];
        if (video) {
          video.pause();
          video.muted = true;
          video.volume = 0;
        }
      });

      // Wait for animation to complete before switching
      setTimeout(() => {
        // Switch the main event index
        setMainEventIndex(index);
        setNewMessage("");

        // Update states - DO THIS ONCE, not multiple times
        const newStates: { [key: string]: any } = {};

        // New main player state
        newStates[newMainEventId] = {
          volume: targetVolume,
          isMuted: false,
          isPlaying: true,
          progress: newMainState.progress || 0
        };

        // Old main (now mini) state - always playing
        newStates[oldMainEventId] = {
          volume: 0,
          isMuted: true,
          isPlaying: true, // Mini-players always play
          progress: oldMainState.progress || 0
        };

        // Update state ONCE
        setPlaybackState(prev => ({
          ...prev,
          ...newStates
        }));

        // Apply to DOM after state update
        setTimeout(() => {
          // First, get fresh references to ALL video elements
          const allVideoRefs = Object.keys(videoRefs.current);

          // CRITICAL: Pause and mute ALL videos first to prevent any ghost playback
          allVideoRefs.forEach(eventId => {
            const video = videoRefs.current[eventId];
            if (video) {
              video.pause();
              video.muted = true;
              video.volume = 0;
            }
          });

          // Small delay to ensure all videos are stopped
          setTimeout(() => {
            // NOW configure the new main player - UNMUTE, set proper volume, and RESTORE position
            const freshNewMainVideo = videoRefs.current[newMainEventId];
            if (freshNewMainVideo) {
              // Restore the playback position from before the swap
              if (savedPositions[newMainEventId] !== undefined) {
                freshNewMainVideo.currentTime = savedPositions[newMainEventId];
              }
              freshNewMainVideo.muted = false;
              freshNewMainVideo.volume = targetVolume / 100;
              freshNewMainVideo.play().catch(() => {});
            }

            // Ensure all mini-players (including old main) stay muted with zero volume and PLAYING
            events.forEach((event, idx) => {
              if (idx !== index) {
                const video = videoRefs.current[event.id];
                if (video) {
                  // Restore the playback position for mini-players too
                  if (savedPositions[event.id] !== undefined) {
                    video.currentTime = savedPositions[event.id];
                  }
                  video.muted = true;
                  video.volume = 0;
                  // Mini-players ALWAYS play
                  if (video.paused) {
                    video.play().catch(() => {});
                  }
                }
              }
            });
          }, 30);
        }, 20);

        // Reset animation state
        setTimeout(() => {
          setIsSwapping(false);
          setSwappingFromIndex(null);
          setSwappingToIndex(null);
        }, 80);
      }, 500); // Animation duration - matches CSS animation
    }
  };

  // Handle leaving/removing an event
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  // Cinematic goodbye splash shown after the user confirms leaving.
  // Plays for ~2.4s, then the existing leave logic runs (history.back or
  // event removal). Pure UI state — no backend interaction.
  const [showGoodbyeSplash, setShowGoodbyeSplash] = useState(false);

  const confirmLeaveStream = () => {
    setShowLeaveConfirmModal(false);

    // Capture the leave action so we run it AFTER the splash plays.
    const performLeave = () => {
      if (events.length === 1) {
        // Last event — go back. The destination page replaces this one,
        // so the splash naturally disappears with the navigation.
        window.history.back();
      } else {
        // Remove the current main event from the list and let the
        // viewer continue watching the remaining ones.
        const updatedEvents = events.filter((_, idx) => idx !== mainEventIndex);
        setEvents(updatedEvents);
        setPlaybackState(prev => {
          const newState = { ...prev };
          delete newState[mainEvent.id];
          return newState;
        });
        setMainEventIndex(0);
        // We're staying on the page — hide the splash so the UI returns.
        setShowGoodbyeSplash(false);
      }
    };

    setShowGoodbyeSplash(true);
    window.setTimeout(performLeave, 2400);
  };

  const handleLeaveStream = () => {
    setShowLeaveConfirmModal(true);
  };

  // Handle mouse movement on video player - show controls
  const handleMouseMove = () => {
    setShowControls(true);

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Check if any modal or menu is open
    const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;

    // Only auto-hide if no modals/menus are open (YouTube-like behavior)
    if (!hasOpenModal) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // 3 seconds like YouTube
    }
  };

  // Handle mouse leaving video player
  const handleMouseLeave = () => {
    // Clear timeout when mouse leaves
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Check if any modal or menu is open
    const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;

    // Only hide controls if no modals/menus are open and not in fullscreen
    if (!hasOpenModal && !isFullscreen) {
      setShowControls(false);
    }
  };

  // Handle touch on video player (for mobile devices) - same logic as mouse
  const handleTouch = () => {
    setShowControls(true);

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Check if any modal or menu is open
    const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;

    // Only auto-hide if no modals/menus are open (YouTube-like behavior)
    if (!hasOpenModal) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // 3 seconds like YouTube
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle emoji reaction
  const handleEmojiReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji: emoji,
      timestamp: Date.now()
    };

    setActiveReactions(prev => [...prev, newReaction]);

    // Remove reaction after animation (3 seconds)
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  };

  // Emoji list
  const emojiList = [
    { emoji: "🔥", name: "fire" },
    { emoji: "😂", name: "laughing" },
    { emoji: "❤️", name: "heart" },
    { emoji: "👍", name: "thumbs up" },
    { emoji: "👏", name: "clapping" },
    { emoji: "😍", name: "love" },
    { emoji: "🎉", name: "party" },
    { emoji: "😮", name: "wow" },
  ];

  // Participants are now populated from stream chat messages (see polling useEffect above)

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle copy stream ID
  const handleCopyStreamId = async () => {
    try {
      await navigator.clipboard.writeText(mainEvent.streamId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy stream ID:', err);
    }
  };

  // Toggle fullscreen — iOS only supports fullscreen on <video> directly
  const toggleFullscreen = () => {
    const video = videoRefs.current[mainEvent.id];
    const videoContainer = video?.parentElement;
    if (!videoContainer) return;

    if (!isFullscreen) {
      // Enter fullscreen — try container first, fall back to video element (iOS)
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if ((videoContainer as any).webkitRequestFullscreen) {
        (videoContainer as any).webkitRequestFullscreen();
      } else if ((videoContainer as any).mozRequestFullScreen) {
        (videoContainer as any).mozRequestFullScreen();
      } else if ((videoContainer as any).msRequestFullscreen) {
        (videoContainer as any).msRequestFullscreen();
      } else if (video && (video as any).webkitEnterFullscreen) {
        // iOS Safari — only supports fullscreen on <video> element
        (video as any).webkitEnterFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      } else if (video && (video as any).webkitExitFullscreen) {
        (video as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      // Show controls when entering/exiting fullscreen
      setShowControls(true);

      // If entering fullscreen and no modals are open, start auto-hide timer
      if (isCurrentlyFullscreen) {
        const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;
        if (!hasOpenModal) {
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }
    };

    // iOS video fullscreen events
    const video = videoRefs.current[mainEvent?.id];
    const handleiOSFullscreen = () => {
      const presenting = (video as any)?.webkitDisplayingFullscreen;
      setIsFullscreen(!!presenting);
      setShowControls(true);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    if (video) {
      video.addEventListener('webkitbeginfullscreen', handleiOSFullscreen);
      video.addEventListener('webkitendfullscreen', handleiOSFullscreen);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', handleiOSFullscreen);
        video.removeEventListener('webkitendfullscreen', handleiOSFullscreen);
      }
    };
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-menu') && !target.closest('.settings-button')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const mainState = playbackState[mainEvent.id];
      const mainVideo = videoRefs.current[mainEvent.id];

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay(mainEvent.id);
          break;
        case 'm':
          e.preventDefault();
          toggleMute(mainEvent.id);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(mainEvent.id, Math.min((mainState?.volume || 100) + 10, 100));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(mainEvent.id, Math.max((mainState?.volume || 100) - 10, 0));
          break;
        case 'arrowleft':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.max(mainVideo.currentTime - 5, 0);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.min(
              mainVideo.currentTime + 5,
              mainVideo.duration
            );
          }
          break;
        case 'j':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.max(mainVideo.currentTime - 10, 0);
          }
          break;
        case 'l':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.min(
              mainVideo.currentTime + 10,
              mainVideo.duration
            );
          }
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          if (mainVideo && mainVideo.duration) {
            const percentage = parseInt(e.key) / 10;
            mainVideo.currentTime = mainVideo.duration * percentage;
          }
          break;
        case 'home':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = 0;
          }
          break;
        case 'end':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = mainVideo.duration;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [playbackState, mainEvent.id, isFullscreen]);

  // Low-latency toggle — WebRTC is always sub-second, no toggle needed
  const handleLowLatencyToggle = () => {
    setLowLatencyMode(!lowLatencyMode);
  };

  // Handle report issue — sends via stream interaction API
  const handleReportIssue = async (issueType: string) => {
    setShowSettings(false);
    setShowReportIssues(false);

    try {
      if (isAuthenticated && mainEvent.id) {
        await reportStreamIssue(mainEvent.id, issueType);
      }
    } catch {
      // Silent fail — best-effort report
    }
  };

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMessageMenu !== null) {
        setOpenMessageMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMessageMenu]);

  // Handle video seek
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRefs.current[mainEvent.id];
    if (!video) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * video.duration;

    video.currentTime = newTime;
    setPlaybackState(prev => ({
      ...prev,
      [mainEvent.id]: { ...prev[mainEvent.id], progress: pos * 100 }
    }));
  };

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (rating === 0 || userHasRated || ratingSubmitting) return;
    if (!canInteract) {
      requireInteraction(() => {});
      return;
    }

    setRatingSubmitting(true);
    try {
      // Use new unified endpoint — backend resolves identity via JWT, viewerId, or IP
      const body: { rating: number; comment?: string; viewerId?: string } = { rating };
      if (ratingComment) body.comment = ratingComment;
      if (anonymousViewerId) body.viewerId = anonymousViewerId;

      const res = await fetch(`/api/remote/public/streams/${mainEvent.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (result?.data?.userRating) {
        setRating(result.data.userRating);
        if (result.data.userRatingComment) setRatingComment(result.data.userRatingComment);
      }

      setUserHasRated(true);
      setRatingSuccess(true);

      // Show success briefly then close
      setTimeout(() => {
        setShowRatingModal(false);
        setRatingSuccess(false);
      }, 1500);
    } catch {
      // On error, close modal but don't mark as rated (allow retry)
      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Start/Stop Recording
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const video = videoRefs.current[mainEvent.id];
        if (!video) {
          alert('Video element not found');
          return;
        }

        const videoStream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();

        if (!videoStream) {
          alert('Unable to capture video stream. Your browser may not support this feature.');
          return;
        }

        const recorder = new MediaRecorder(videoStream, {
          mimeType: 'video/webm;codecs=vp9'
        });

        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            setRecordedChunks([...chunks]);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `livestream-recording-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setRecordedChunks([]);
        };

        recorder.start(1000);
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. This feature may not be supported in your browser.');
      }
    } else {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        setIsRecording(false);
        setMediaRecorder(null);
      }
    }
  };

  // Get main state with proper defaults using nullish coalescing for individual properties
  const mainState = playbackState[mainEvent.id]
    ? playbackState[mainEvent.id]
    : { isPlaying: false, isMuted: false, progress: 0, volume: 100 };



  // Main component render
  return (
    <>
      {/* ── WELCOME SPLASH ──
          Cinematic "you're in" message that replaces the preloader for
          users redirected from view-event after payment. Auto-dismisses
          after 2.6 s OR on tap; fades out smoothly. The blurred event
          poster behind the message ties the visual back to view-event so
          it feels like a continuation, not a new page. */}
      {showWelcomeSplash && (
        <div
          className={`ls-welcome ${welcomeSplashFadingOut ? 'is-leaving' : ''}`}
          role="status"
          aria-live="polite"
          onClick={dismissWelcomeSplash}
        >
          <div className="ls-welcome-veil" aria-hidden="true" />
          <div className="ls-welcome-grain" aria-hidden="true" />
          <div className="ls-welcome-content">
            {/* Animated check icon */}
            <div className="ls-welcome-check" aria-hidden="true">
              <svg viewBox="0 0 52 52" width="64" height="64">
                <circle className="ls-welcome-check-circle" cx="26" cy="26" r="24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" />
                <path className="ls-welcome-check-tick" d="M14 27 l8 8 l16-16" fill="none" stroke="#6ee7b7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Status pill */}
            <span className="ls-welcome-tag">
              <span className="ls-welcome-pulse" aria-hidden="true" />
              LIVE STREAM READY
            </span>

            <h1 className="ls-welcome-title">You&apos;re in!</h1>
            <p className="ls-welcome-sub">
              {mainEvent?.title && mainEvent.title !== 'Loading...'
                ? <>Connecting you to <strong>{mainEvent.title}</strong>…</>
                : <>Connecting you to the live stream…</>}
            </p>

            <div className="ls-welcome-progress" aria-hidden="true">
              <span />
            </div>

            <button
              type="button"
              className="ls-welcome-skip"
              onClick={(e) => { e.stopPropagation(); dismissWelcomeSplash(); }}
              aria-label="Skip welcome and go to stream"
            >
              Skip <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          GOODBYE SPLASH — appears for ~2.4s after the user confirms leaving.
          Cinematic farewell with a heartbeat icon, message, and progress
          bar. Mirrors the welcome splash visual language so the entry/exit
          experiences feel like bookends. */}
      {showGoodbyeSplash && (
        <div className="ls-goodbye" role="dialog" aria-live="polite" aria-label="Leaving stream">
          <div className="ls-goodbye-veil" aria-hidden="true" />
          <div className="ls-goodbye-grain" aria-hidden="true" />
          <div className="ls-goodbye-content">
            <div className="ls-goodbye-icon" aria-hidden="true">
              <span className="ls-goodbye-icon-ring" />
              <span className="ls-goodbye-icon-ring ls-goodbye-icon-ring--2" />
              <i className="bi bi-heart-fill" />
            </div>
            <span className="ls-goodbye-tag">
              <span className="ls-goodbye-pulse" aria-hidden="true" />
              SEE YOU SOON
            </span>
            <h1 className="ls-goodbye-title">Thanks for watching!</h1>
            <p className="ls-goodbye-sub">
              Hope you enjoyed{' '}
              <strong>{mainEvent?.title || 'the stream'}</strong>.
              <br />
              We&apos;ll save your spot for the next one.
            </p>
            <div className="ls-goodbye-progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Welcome splash styles ─────────────────────────────────── */
        .ls-welcome {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background:
            radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.30) 0%, rgba(8,58,133,0) 60%),
            linear-gradient(180deg, #07080d 0%, #0c0e15 60%, #11141d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Pragati Narrow', system-ui, -apple-system, 'Segoe UI', sans-serif;
          color: #f4f6fb;
          overflow: hidden;
          cursor: pointer;
          animation: ls-welcome-in 320ms ease-out;
        }
        .ls-welcome.is-leaving { animation: ls-welcome-out 320ms ease-in forwards; }
        @keyframes ls-welcome-in {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ls-welcome-out {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.06); }
        }
        .ls-welcome-veil {
          position: absolute; inset: 0; z-index: 1;
          background:
            radial-gradient(90% 70% at 50% 50%, rgba(7,8,13,0.55) 0%, rgba(7,8,13,0.92) 100%),
            radial-gradient(70% 50% at 50% 100%, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0) 60%),
            radial-gradient(60% 40% at 50% 0%, rgba(31,107,255,0.22) 0%, rgba(31,107,255,0) 60%);
        }
        .ls-welcome-grain {
          position: absolute; inset: 0; z-index: 2;
          opacity: 0.16;
          mix-blend-mode: overlay;
          pointer-events: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
        }
        .ls-welcome-content {
          position: relative; z-index: 3;
          text-align: center;
          max-width: 460px;
          width: 100%;
        }
        /* Animated check inside an emerald glass disc */
        .ls-welcome-check {
          width: 100px; height: 100px;
          border-radius: 50%;
          background: rgba(16,185,129,0.10);
          border: 2px solid rgba(16,185,129,0.45);
          display: inline-flex; align-items: center; justify-content: center;
          margin-bottom: 22px;
          box-shadow:
            0 18px 50px -8px rgba(16,185,129,0.45),
            0 0 0 6px rgba(16,185,129,0.05),
            inset 0 1px 0 rgba(255,255,255,0.10);
          animation: ls-welcome-check-pop 540ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms backwards;
        }
        @keyframes ls-welcome-check-pop {
          from { opacity: 0; transform: scale(0.5) rotate(-20deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        /* SVG check stroke draw-on animation */
        .ls-welcome-check-circle {
          stroke-dasharray: 151;
          stroke-dashoffset: 151;
          animation: ls-welcome-circle-draw 700ms ease-out 280ms forwards;
        }
        .ls-welcome-check-tick {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: ls-welcome-tick-draw 380ms ease-out 720ms forwards;
        }
        @keyframes ls-welcome-circle-draw { to { stroke-dashoffset: 0; } }
        @keyframes ls-welcome-tick-draw   { to { stroke-dashoffset: 0; } }

        .ls-welcome-tag {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          margin-bottom: 14px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(239,68,68,0.92) 0%, rgba(220,38,38,0.92) 100%);
          color: #fff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.22);
          box-shadow: 0 10px 24px -6px rgba(220,38,38,0.55), inset 0 1px 0 rgba(255,255,255,0.20);
          text-shadow: 0 1px 2px rgba(0,0,0,0.30);
          animation: ls-welcome-tag-fade 600ms ease-out 1100ms backwards;
        }
        @keyframes ls-welcome-tag-fade {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ls-welcome-pulse {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
          animation: ls-welcome-pulse 1.4s ease-out infinite;
        }
        @keyframes ls-welcome-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .ls-welcome-title {
          font-size: clamp(36px, 6vw, 56px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.025em;
          margin: 0 0 10px;
          color: #ffffff;
          text-shadow: 0 8px 36px rgba(0,0,0,0.55);
          animation: ls-welcome-title-fade 600ms ease-out 1200ms backwards;
        }
        @keyframes ls-welcome-title-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ls-welcome-sub {
          font-size: clamp(14px, 1.6vw, 17px);
          color: #b8bdca;
          line-height: 1.5;
          margin: 0 auto 26px;
          max-width: 380px;
          animation: ls-welcome-title-fade 600ms ease-out 1320ms backwards;
        }
        .ls-welcome-sub strong { color: #f4f6fb; font-weight: 700; }

        /* Indeterminate progress bar — slides a brand-blue chunk across */
        .ls-welcome-progress {
          width: 200px;
          height: 4px;
          margin: 0 auto;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
          position: relative;
        }
        .ls-welcome-progress span {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          width: 50%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(31,107,255,0) 0%, #1f6bff 30%, #1f6bff 70%, rgba(31,107,255,0) 100%);
          animation: ls-welcome-progress 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes ls-welcome-progress {
          0%   { left: -50%; }
          100% { left: 100%; }
        }

        .ls-welcome-skip {
          position: absolute;
          top: max(16px, env(safe-area-inset-top, 0px));
          right: 16px;
          z-index: 4;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.18);
          color: #b8bdca;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }
        .ls-welcome-skip:hover {
          background: rgba(255,255,255,0.12);
          color: #ffffff;
          border-color: rgba(255,255,255,0.34);
        }
        .ls-welcome-skip i { font-size: 12px; }

        @media (max-width: 540px) {
          .ls-welcome-check { width: 84px; height: 84px; margin-bottom: 18px; }
          .ls-welcome-check svg { width: 52px; height: 52px; }
          .ls-welcome-title { font-size: 34px; }
          .ls-welcome-sub { font-size: 14px; max-width: 320px; }
          .ls-welcome-progress { width: 160px; }
          .ls-welcome-skip { font-size: 11.5px; padding: 7px 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ls-welcome,
          .ls-welcome-check,
          .ls-welcome-check-circle,
          .ls-welcome-check-tick,
          .ls-welcome-tag,
          .ls-welcome-pulse,
          .ls-welcome-title,
          .ls-welcome-sub,
          .ls-welcome-progress span {
            animation: none !important;
          }
          .ls-welcome-check-circle, .ls-welcome-check-tick { stroke-dashoffset: 0; }
        }

        /* ── Goodbye splash styles ─────────────────────────────────── */
        .ls-goodbye {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background:
            radial-gradient(80% 60% at 50% 0%, rgba(8, 58, 133, 0.30) 0%, rgba(8, 58, 133, 0) 60%),
            radial-gradient(60% 50% at 50% 100%, rgba(220, 38, 38, 0.12) 0%, rgba(220, 38, 38, 0) 60%),
            linear-gradient(180deg, #04050a 0%, #0a0d18 50%, #04050a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f4f6fb;
          padding: 24px;
          isolation: isolate;
          animation: ls-goodbye-in 320ms ease-out;
        }
        @keyframes ls-goodbye-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        .ls-goodbye-veil {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 35%, rgba(31, 107, 255, 0.10) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
        }
        .ls-goodbye-grain {
          position: absolute;
          inset: 0;
          opacity: 0.10;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>");
          pointer-events: none;
          z-index: 0;
        }
        .ls-goodbye-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 460px;
        }
        .ls-goodbye-icon {
          position: relative;
          width: 96px;
          height: 96px;
          margin: 0 auto 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, rgba(252, 165, 165, 0.40) 0%, rgba(220, 38, 38, 0.30) 50%, rgba(8, 58, 133, 0.25) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.20),
            0 18px 38px -8px rgba(220, 38, 38, 0.55),
            0 0 0 1px rgba(252, 165, 165, 0.30);
          animation: ls-goodbye-icon-pop 540ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms backwards;
        }
        @keyframes ls-goodbye-icon-pop {
          0%   { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .ls-goodbye-icon i {
          font-size: 38px;
          color: #ffffff;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.55));
          animation: ls-goodbye-heartbeat 1.2s ease-in-out infinite;
        }
        @keyframes ls-goodbye-heartbeat {
          0%, 100% { transform: scale(1); }
          25%      { transform: scale(1.18); }
          50%      { transform: scale(1.00); }
          75%      { transform: scale(1.10); }
        }
        .ls-goodbye-icon-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(252, 165, 165, 0.55);
          animation: ls-goodbye-ring 2.2s ease-out infinite;
        }
        .ls-goodbye-icon-ring--2 { animation-delay: 1.1s; }
        @keyframes ls-goodbye-ring {
          0%   { transform: scale(0.85); opacity: 0.85; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .ls-goodbye-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 12px;
          border-radius: 999px;
          background: rgba(8, 58, 133, 0.32);
          border: 1px solid rgba(96, 165, 250, 0.45);
          color: #93c5fd;
          font-family: 'Pragati Narrow', sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 14px;
          animation: ls-goodbye-fade 600ms ease-out 360ms backwards;
        }
        @keyframes ls-goodbye-fade {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .ls-goodbye-pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #60a5fa;
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.85);
          animation: ls-goodbye-pulse 1.4s ease-out infinite;
        }
        @keyframes ls-goodbye-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.30; }
        }
        .ls-goodbye-title {
          margin: 0 0 10px;
          font-family: 'Pragati Narrow', sans-serif;
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #ffffff;
          text-shadow: 0 4px 24px rgba(31, 107, 255, 0.45);
          animation: ls-goodbye-fade 600ms ease-out 480ms backwards;
        }
        .ls-goodbye-sub {
          margin: 0 auto;
          max-width: 420px;
          font-size: 14.5px;
          color: rgba(244, 246, 251, 0.72);
          line-height: 1.6;
          animation: ls-goodbye-fade 600ms ease-out 600ms backwards;
        }
        .ls-goodbye-sub strong {
          color: #ffffff;
          font-weight: 700;
        }
        .ls-goodbye-progress {
          width: 200px;
          height: 3px;
          margin: 22px auto 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.10);
          overflow: hidden;
          position: relative;
        }
        .ls-goodbye-progress span {
          display: block;
          height: 100%;
          width: 100%;
          background: linear-gradient(90deg, #1f6bff 0%, #60a5fa 50%, #ef4444 100%);
          transform-origin: left center;
          animation: ls-goodbye-progress 2.4s linear forwards;
        }
        @keyframes ls-goodbye-progress {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @media (max-width: 540px) {
          .ls-goodbye-icon { width: 80px; height: 80px; margin-bottom: 18px; }
          .ls-goodbye-icon i { font-size: 32px; }
          .ls-goodbye-title { font-size: clamp(24px, 7vw, 30px); }
          .ls-goodbye-sub { font-size: 13px; max-width: 320px; }
          .ls-goodbye-progress { width: 160px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ls-goodbye,
          .ls-goodbye-icon,
          .ls-goodbye-icon i,
          .ls-goodbye-icon-ring,
          .ls-goodbye-tag,
          .ls-goodbye-pulse,
          .ls-goodbye-title,
          .ls-goodbye-sub,
          .ls-goodbye-progress span {
            animation: none !important;
          }
          .ls-goodbye-progress span { transform: scaleX(1); }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SPOTLIGHT CINEMA — Live-stream theater redesign
          ═══════════════════════════════════════════════════════════════════════════
          Design vision: the page is a private theater. The video is the STAGE,
          spotlit by ambient brand-blue lighting that breathes overhead. Everything
          else (chat, info bar, controls, reactions, mini players) floats around the
          stage as glass surfaces — backdrop-filtered, brand-blue rim-lit, with
          subtle inner gleams. Heavy use of layered radial lighting + film grain +
          micro-animations to make the page feel ALIVE without being noisy.

            • Theater backdrop:  midnight gradient + dual blue/red spotlights + grain
            • Stage halo:        pulsing blue spotlight behind the video
            • Floating chrome:   glass surfaces with rim glow + inner gleam
            • Live label:        pulsing red wave with rotating shimmer
            • Action chrome:     pill controls with brand-blue ring on hover
            • Theater curtains:  subtle wipe-in animations on first paint
            • Reduced motion:    everything calms down respectfully
          ═══════════════════════════════════════════════════════════════════════════ */}
      <style jsx global>{`
        /* ─── Design tokens (scoped) ─────────────────────────────────────── */
        body { background: #04050a; }

        /* ─── Theater backdrop ───────────────────────────────────────────────
           Midnight base + 3 spotlights:
             ① massive cool brand-blue spotlight from top-center
             ② warm crimson rim-light at bottom (the "audience side")
             ③ deep navy wash from the left (depth illusion)
           The grain layer adds tactile film-stock texture so the glass surfaces
           have something to refract. */
        .main-container {
          background:
            radial-gradient(ellipse 130% 70% at 50% -8%, rgba(31, 107, 255, 0.36) 0%, rgba(31, 107, 255, 0) 55%),
            radial-gradient(ellipse 110% 55% at 50% 108%, rgba(220, 38, 38, 0.20) 0%, rgba(220, 38, 38, 0) 60%),
            radial-gradient(ellipse 75% 60% at -5% 50%, rgba(8, 58, 133, 0.28) 0%, rgba(8, 58, 133, 0) 65%),
            radial-gradient(ellipse 75% 60% at 105% 50%, rgba(8, 58, 133, 0.18) 0%, rgba(8, 58, 133, 0) 65%),
            linear-gradient(180deg, #04050a 0%, #070b18 35%, #050810 70%, #04050a 100%) !important;
          font-family: 'Pragati Narrow', system-ui, -apple-system, 'Segoe UI', sans-serif !important;
          position: relative;
          color: #f4f6fb;
        }
        /* Film grain — fixed so it doesn't move on scroll. Mix-blend overlay
           makes it whisper into the glass surfaces below. */
        .main-container::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.085;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>");
        }
        /* Overhead spotlight removed — was lightening the video area too much.
           The page now relies purely on the static edge gradients above. */
        .layout-wrapper { position: relative; z-index: 1; }

        /* Theater-curtain wipe — runs once on first mount */
        .layout-wrapper {
          animation: ls-curtain-rise 800ms cubic-bezier(0.22, 1, 0.36, 1) 80ms backwards;
        }
        @keyframes ls-curtain-rise {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .main-container ::selection {
          background: rgba(31, 107, 255, 0.55);
          color: #ffffff;
        }

        /* ─── Video section (the stage) ────────────────────────────────── */
        .video-section {
          background: transparent !important;
          padding-left: clamp(16px, 2vw, 36px) !important;
          padding-top: clamp(18px, 2.4vw, 28px) !important;
          padding-right: clamp(12px, 1.6vw, 22px) !important;
          padding-bottom: clamp(14px, 2vw, 22px) !important;
          position: relative;
        }
        /* Stage halo removed — was lightening the area above the player. */

        /* ─── The Stage: video player container ─────────────────────────── */
        .video-player-container {
          border-radius: 22px !important;
          position: relative !important;
          overflow: hidden !important;
          /* Pure dark stage. Outer shadow is just depth (no brand-blue
             bleed). 1px hairline border defines the edge cleanly. */
          box-shadow:
            0 28px 64px -22px rgba(0, 0, 0, 0.92),
            0 0 0 1px rgba(255, 255, 255, 0.06) !important;
          transition: box-shadow 320ms ease, transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          z-index: 1 !important;
        }
        .video-player-container:hover {
          transform: translateY(-1px) !important;
          box-shadow:
            0 36px 80px -20px rgba(0, 0, 0, 0.95),
            0 0 0 1px rgba(96, 165, 250, 0.20) !important;
        }
        /* Conic rim removed — the previous brand-blue rotating halo lit up
           the player edge. Plain hairline border (in box-shadow above) keeps
           the player feeling like a real screen, not a glowing toy. */
        .video-player-container::after { display: none !important; }
        /* Top-edge gleam removed — was lightening the inside of the player.
           The video stage now stays pure black throughout. */
        .video-player-container::before { display: none !important; }

        /* ─── Chat: theater audience panel ──────────────────────────────── */
        .chat-section {
          background:
            linear-gradient(180deg, rgba(10, 13, 22, 0.72) 0%, rgba(5, 7, 14, 0.82) 100%) !important;
          backdrop-filter: blur(34px) saturate(190%);
          -webkit-backdrop-filter: blur(34px) saturate(190%);
          border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow:
            inset 1px 0 0 rgba(255, 255, 255, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            -24px 0 60px -20px rgba(0, 0, 0, 0.65) !important;
          position: relative;
        }
        /* Top-edge horizontal gleam (polished glass)*/
        .chat-section::before {
          content: '';
          position: absolute;
          top: 0; left: 16px; right: 16px;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(96, 165, 250, 0.45) 50%, rgba(255, 255, 255, 0) 100%);
          pointer-events: none;
          z-index: 2;
        }
        /* Diagonal brand-blue ambient sweep, subtle */
        .chat-section::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 140% 50% at 100% 0%, rgba(31, 107, 255, 0.10) 0%, rgba(31, 107, 255, 0) 55%);
          pointer-events: none;
          z-index: 0;
        }
        .chat-section > * { position: relative; z-index: 1; }

        /* Sticky chat header */
        .chat-section > div:first-child {
          background:
            linear-gradient(180deg, rgba(18, 22, 32, 0.98) 0%, rgba(12, 15, 23, 0.92) 100%) !important;
          backdrop-filter: blur(22px) !important;
          -webkit-backdrop-filter: blur(22px) !important;
          border-bottom: 1px solid rgba(96, 165, 250, 0.16) !important;
          box-shadow: 0 6px 18px -8px rgba(0, 0, 0, 0.55) !important;
        }
        .chat-section h3 {
          font-family: 'Pragati Narrow', sans-serif !important;
          letter-spacing: 0.10em !important;
          text-transform: uppercase !important;
        }

        /* Chat input — frosted floor */
        .chat-section input[type="text"],
        .chat-section textarea {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 12px !important;
          color: #f4f6fb !important;
          font-family: 'Pragati Narrow', sans-serif !important;
          transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease !important;
        }
        .chat-section input[type="text"]:focus,
        .chat-section textarea:focus {
          border-color: rgba(96, 165, 250, 0.65) !important;
          background: rgba(255, 255, 255, 0.07) !important;
          box-shadow: 0 0 0 4px rgba(31, 107, 255, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          outline: none !important;
        }
        .chat-section input[type="text"]::placeholder,
        .chat-section textarea::placeholder {
          color: rgba(244, 246, 251, 0.42) !important;
        }

        /* ─── Stream info area — transparent, no container chrome.
              Each child below the player floats independently on the page. */
        .stream-info-section {
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: none !important;
          border-radius: 0 !important;
          margin-top: 12px !important;
          padding: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
        }
        .stream-info-section::before,
        .stream-info-section::after { display: none !important; }
        .stream-title {
          font-family: 'Pragati Narrow', sans-serif !important;
          letter-spacing: -0.01em !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.40) !important;
        }
        .photographer-name {
          color: #93c5fd !important;
          font-weight: 600 !important;
        }

        /* ─── Action button chrome ──────────────────────────────────────── */
        .stream-action-btn,
        .gift-btn-main {
          background: rgba(255, 255, 255, 0.06) !important;
          border: 1px solid rgba(255, 255, 255, 0.13) !important;
          backdrop-filter: blur(14px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(140%) !important;
          color: #f4f6fb !important;
          border-radius: 12px !important;
          font-family: 'Pragati Narrow', sans-serif !important;
          letter-spacing: 0.01em !important;
          position: relative !important;
          overflow: hidden !important;
          transition:
            background 180ms ease,
            border-color 180ms ease,
            transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 180ms ease !important;
        }
        .stream-action-btn:hover,
        .gift-btn-main:hover {
          background: rgba(31, 107, 255, 0.18) !important;
          border-color: rgba(96, 165, 250, 0.55) !important;
          transform: translateY(-2px) !important;
          box-shadow:
            0 12px 28px -10px rgba(31, 107, 255, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
        }
        .stream-action-btn:active,
        .gift-btn-main:active { transform: translateY(0) scale(0.98) !important; }

        /* Gift button — gold-to-crimson sunrise gradient */
        .gift-btn-main {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.30) 0%, rgba(220, 39, 67, 0.24) 100%) !important;
          border-color: rgba(252, 211, 77, 0.55) !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.14),
            0 6px 18px -8px rgba(245, 158, 11, 0.40) !important;
        }
        .gift-btn-main::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.18) 50%, transparent 65%);
          transform: translateX(-100%);
          transition: transform 600ms ease;
          pointer-events: none;
        }
        .gift-btn-main:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.42) 0%, rgba(220, 39, 67, 0.36) 100%) !important;
          border-color: rgba(252, 211, 77, 0.85) !important;
          box-shadow:
            0 14px 32px -8px rgba(245, 158, 11, 0.65),
            inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
        }
        .gift-btn-main:hover::before { transform: translateX(100%); }

        /* Stat items — independent, no wrapper backgrounds */
        .stat-item {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        /* ─── Mini players strip — independent, no container chrome ────── */
        .mini-players-container {
          margin-top: 12px !important;
          padding: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: none !important;
          box-shadow: none !important;
          position: relative !important;
        }

        /* ─── Video.js controls — precision instrument panel.
              The base CSS sets gap: 2px (and 0 on mobile!) on the rows —
              we override with proper breathing room so buttons don't crush
              into each other. */
        .vjs-buttons-row {
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 50%, rgba(0, 0, 0, 0.85) 100%) !important;
          padding: 22px 18px 16px !important;
          gap: 10px !important;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }
        .vjs-buttons-row--right {
          gap: 10px !important;
        }
        @media (max-width: 720px) {
          .vjs-buttons-row,
          .vjs-buttons-row--right {
            gap: 8px !important;
          }
          .vjs-buttons-row {
            padding: 18px 14px 12px !important;
          }
        }
        @media (max-width: 380px) {
          .vjs-buttons-row,
          .vjs-buttons-row--right {
            gap: 6px !important;
          }
        }
        .vjs-btn {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          color: #ffffff !important;
          border-radius: 10px !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          transition:
            background 160ms ease,
            border-color 160ms ease,
            transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 160ms ease !important;
        }
        .vjs-btn:hover {
          background: rgba(31, 107, 255, 0.36) !important;
          border-color: rgba(96, 165, 250, 0.60) !important;
          transform: scale(1.08) !important;
          box-shadow: 0 6px 14px -4px rgba(31, 107, 255, 0.45) !important;
        }
        .vjs-btn:active { transform: scale(0.94) !important; }
        .vjs-progress-row {
          background: rgba(255, 255, 255, 0.12) !important;
          border-radius: 999px !important;
          height: 6px !important;
          overflow: hidden !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.45) !important;
        }
        .vjs-progress-fill {
          background: linear-gradient(90deg, #1f6bff 0%, #60a5fa 50%, #ef4444 100%) !important;
          box-shadow: 0 0 14px rgba(31, 107, 255, 0.65) !important;
        }
        .vjs-progress-thumb {
          background: #ffffff !important;
          width: 14px !important;
          height: 14px !important;
          box-shadow:
            0 0 0 4px rgba(31, 107, 255, 0.30),
            0 0 16px rgba(31, 107, 255, 0.65),
            0 2px 6px rgba(0, 0, 0, 0.50) !important;
        }
        .vjs-volume-slider-fill {
          background: linear-gradient(90deg, #1f6bff 0%, #60a5fa 100%) !important;
        }
        .vjs-volume-slider-thumb {
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(31, 107, 255, 0.35), 0 2px 6px rgba(0, 0, 0, 0.50) !important;
        }

        /* ─── Live label — pulsing red beacon, pinned top-right of player.
              The high-specificity selector + !important on the position
              properties beats the external app/styles/live-stream-player.css
              rule that puts it at top-left by default. */
        .video-player-container .vjs-live-label,
        .vjs-live-label {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%) !important;
          color: #ffffff !important;
          font-family: 'Pragati Narrow', sans-serif !important;
          font-weight: 800 !important;
          letter-spacing: 0.12em !important;
          padding: 6px 14px !important;
          border-radius: 7px !important;
          border: 1px solid rgba(255, 255, 255, 0.28) !important;
          box-shadow:
            0 6px 16px -2px rgba(220, 38, 38, 0.65),
            inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45) !important;
          animation: ls-live-label-pulse 1.6s ease-out infinite !important;
          position: absolute !important;
          top: 16px !important;
          right: 16px !important;
          left: auto !important;
          bottom: auto !important;
          z-index: 10 !important;
        }
        @media (max-width: 720px) {
          .video-player-container .vjs-live-label,
          .vjs-live-label {
            top: 12px !important;
            right: 12px !important;
            left: auto !important;
          }
        }
        @keyframes ls-live-label-pulse {
          0%, 100% {
            box-shadow:
              0 6px 16px -2px rgba(220, 38, 38, 0.65),
              inset 0 1px 0 rgba(255, 255, 255, 0.28),
              0 0 0 0 rgba(220, 38, 38, 0.55);
          }
          50% {
            box-shadow:
              0 6px 16px -2px rgba(220, 38, 38, 0.80),
              inset 0 1px 0 rgba(255, 255, 255, 0.32),
              0 0 0 10px rgba(220, 38, 38, 0);
          }
        }

        /* ─── Big play overlay — first-touch invitation ─────────────────── */
        .vjs-play-overlay {
          background:
            radial-gradient(closest-side, rgba(31, 107, 255, 0.95) 0%, rgba(8, 58, 133, 0.92) 60%, rgba(8, 58, 133, 0.78) 100%) !important;
          border: 2px solid rgba(255, 255, 255, 0.40) !important;
          box-shadow:
            0 18px 48px -8px rgba(31, 107, 255, 0.75),
            0 0 60px -10px rgba(31, 107, 255, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease !important;
          animation: ls-play-pulse 2.4s ease-in-out infinite !important;
        }
        @keyframes ls-play-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        .vjs-play-overlay:hover {
          transform: scale(1.10) !important;
          animation: none !important;
          box-shadow:
            0 26px 60px -6px rgba(31, 107, 255, 0.90),
            0 0 90px -8px rgba(31, 107, 255, 0.70),
            inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
        }

        /* ─── Cinematic dialogs (dark glass) — gift modal handled separately
              below with a clean light treatment for better viewer UX. */
        .rating-modal,
        .auth-stream-modal,
        .participants-modal {
          background:
            linear-gradient(180deg, rgba(18, 22, 32, 0.96) 0%, rgba(8, 11, 19, 0.98) 100%) !important;
          backdrop-filter: blur(36px) saturate(190%) !important;
          -webkit-backdrop-filter: blur(36px) saturate(190%) !important;
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          border-radius: 26px !important;
          box-shadow:
            0 40px 100px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(31, 107, 255, 0.12),
            0 0 100px -10px rgba(31, 107, 255, 0.30) !important;
          position: relative !important;
        }
        /* Top brand-blue accent ribbon on dark modals */
        .rating-modal::before,
        .auth-stream-modal::before,
        .participants-modal::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          border-radius: 26px 26px 0 0;
          background: linear-gradient(90deg, rgba(8, 58, 133, 0) 0%, #1f6bff 22%, #60a5fa 50%, #1f6bff 78%, rgba(8, 58, 133, 0) 100%);
          opacity: 0.95;
          pointer-events: none;
          z-index: 1;
        }

        /* ═══════════════════════════════════════════════════════════════════════
           SEND GIFT MODAL — distinctly festive "gifting" aesthetic, NOT a
           generic payment modal. Champagne-gold palette, amber title, gold
           amount stripe, animated gift-ribbon corner, soft sparkle pattern.
           Payment methods stay brand-blue (those ARE the actual payment) so
           the gift feels celebratory while the transaction stays trustworthy.
           ═══════════════════════════════════════════════════════════════════════ */
        .gift-modal {
          background:
            radial-gradient(circle at 90% 10%, rgba(52, 211, 153, 0.10) 0%, rgba(52, 211, 153, 0) 40%),
            radial-gradient(circle at 10% 95%, rgba(110, 231, 183, 0.08) 0%, rgba(110, 231, 183, 0) 40%),
            #ecfdf5 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: 1px solid rgba(16, 185, 129, 0.22) !important;
          border-radius: 22px !important;
          box-shadow:
            0 40px 100px -20px rgba(16, 185, 129, 0.30),
            0 18px 40px -12px rgba(4, 120, 87, 0.18),
            0 1px 0 rgba(255, 255, 255, 0.95) inset !important;
          position: relative !important;
          max-width: 440px !important;
          padding: 0 !important;
          overflow: hidden !important;
          isolation: isolate;
        }
        /* Top emerald-green accent ribbon — celebration, not transaction */
        .gift-modal::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, rgba(16, 185, 129, 0) 0%, #10b981 18%, #34d399 40%, #6ee7b7 60%, #34d399 80%, rgba(16, 185, 129, 0) 100%);
          opacity: 0.98;
          pointer-events: none;
          z-index: 1;
        }
        /* Soft emerald glow in the top-right corner */
        .gift-modal::after {
          content: '';
          position: absolute;
          top: -90px;
          right: -90px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(16, 185, 129, 0.18) 0%, rgba(52, 211, 153, 0.10) 40%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        /* Inner content layer — handles padding + scroll, sits above the
           decorative ::before / ::after pseudo-elements via z-index. */
        .gift-modal > * {
          position: relative;
          z-index: 2;
        }
        /* Padding — matches XentriPayModal exactly */
        .gift-modal {
          padding-top: clamp(26px, 4.5vw, 38px) !important;
          padding-left: clamp(22px, 4vw, 34px) !important;
          padding-right: clamp(22px, 4vw, 34px) !important;
          padding-bottom: clamp(22px, 4vw, 34px) !important;
        }

        /* Decorative diagonal "GIFT" ribbon in the top-left corner — green */
        .gift-ribbon-corner {
          position: absolute;
          top: 18px;
          left: -38px;
          width: 140px;
          padding: 4px 0;
          background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%);
          color: #ffffff;
          font-family: 'Pragati Narrow', sans-serif;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-align: center;
          transform: rotate(-35deg);
          transform-origin: center;
          pointer-events: none;
          z-index: 4;
          box-shadow: 0 4px 10px -2px rgba(4, 120, 87, 0.55);
          text-shadow: 0 1px 2px rgba(6, 78, 59, 0.40);
        }
        .gift-ribbon-text {
          display: inline-block;
        }
        .gift-ribbon-text::before { content: '✦ '; opacity: 0.85; }
        .gift-ribbon-text::after  { content: ' ✦'; opacity: 0.85; }

        /* Subtle emerald sparkle accents floating around the modal corners */
        .gift-modal-sparkle {
          position: absolute;
          color: #10b981;
          font-size: 14px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.45;
          animation: gift-sparkle-twinkle 3.2s ease-in-out infinite;
        }
        .gift-modal-sparkle--1 {
          top: 76px;
          right: 28px;
          font-size: 16px;
          animation-delay: 0s;
        }
        .gift-modal-sparkle--2 {
          top: 140px;
          right: 46px;
          font-size: 11px;
          animation-delay: 1.1s;
        }
        .gift-modal-sparkle--3 {
          top: 44px;
          right: 70px;
          font-size: 12px;
          animation-delay: 2.0s;
          color: #34d399;
        }
        @keyframes gift-sparkle-twinkle {
          0%, 100% { opacity: 0.20; transform: scale(0.85) rotate(0deg); }
          50%      { opacity: 0.85; transform: scale(1.15) rotate(180deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gift-modal-sparkle { animation: none !important; opacity: 0.40; }
        }

        /* Eyebrow pill — emerald-mint for "gifting" mood */
        .gift-modal-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px 5px 9px;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 1px solid rgba(4, 120, 87, 0.30);
          border-radius: 999px;
          margin-bottom: 10px;
          font-size: 10.5px;
          font-weight: 800;
          color: #065f46;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          font-family: 'Pragati Narrow', sans-serif;
          box-shadow: 0 2px 6px -2px rgba(16, 185, 129, 0.40);
        }
        .gift-modal-eyebrow svg { color: #047857 !important; stroke: #047857 !important; }

        /* Title — deep forest green, celebratory */
        .gift-modal-title {
          margin: 0 0 4px;
          font-size: clamp(20px, 4.5vw, 24px);
          font-weight: 800;
          color: #065f46;
          line-height: 1.20;
          letter-spacing: -0.01em;
          font-family: 'Pragati Narrow', sans-serif;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
        }
        /* Subtitle — soft slate */
        .gift-modal-sub {
          margin: 0 0 16px;
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.55;
        }
        .gift-modal-sub strong {
          color: #065f46;
          font-weight: 700;
        }

        /* Amount Panel — emerald-tinted card with green stripe */
        .gift-modal-amount-panel {
          position: relative;
          background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%, #d1fae5 100%);
          border: 1px solid rgba(16, 185, 129, 0.28);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 18px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            0 1px 2px rgba(4, 120, 87, 0.06);
        }
        .gift-modal-amount-stripe {
          position: absolute;
          top: 10px;
          bottom: 10px;
          left: 0;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #10b981 0%, #047857 100%);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.50);
        }
        .gift-modal-amount-label {
          display: block;
          font-size: 10.5px;
          font-weight: 800;
          color: #065f46;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          font-family: 'Pragati Narrow', sans-serif;
          margin-bottom: 8px;
        }
        /* Gift amount input — white interior with emerald border */
        .gift-modal-amount-input {
          width: 100%;
          padding: 13px 16px;
          background-color: #ffffff;
          border: 1.5px solid rgba(16, 185, 129, 0.32);
          border-radius: 12px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 600;
          outline: none;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
          box-sizing: border-box;
          font-family: 'Pragati Narrow', sans-serif;
        }
        .gift-modal-amount-input:focus {
          border-color: #047857;
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18);
        }
        .gift-modal-amount-input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
        .gift-modal-tiers {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .gift-modal-tiers .gift-tier-btn {
          flex: 1 1 calc(25% - 6px);
          min-width: 60px;
          padding: 9px 10px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Pragati Narrow', sans-serif;
          background: #ffffff;
          color: #475569;
          border: 1.5px solid rgba(16, 185, 129, 0.28);
          border-radius: 10px;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .gift-modal-tiers .gift-tier-btn:hover {
          border-color: rgba(4, 120, 87, 0.55);
          color: #065f46;
        }
        .gift-modal-tiers .gift-tier-btn.is-selected {
          background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%);
          border-color: #047857;
          color: #ffffff;
          box-shadow: 0 6px 14px -4px rgba(16, 185, 129, 0.55);
        }

        /* ─── Payment method tiles — emerald-accented selected state */
        .gift-modal-payment-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .gift-modal-payment-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px 14px;
          background: #ffffff;
          border: 1.5px solid rgba(16, 185, 129, 0.22);
          border-radius: 14px;
          cursor: pointer;
          transition:
            transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
            border-color 180ms ease,
            box-shadow 200ms ease,
            background 200ms ease;
          position: relative;
          width: 100%;
          font-family: 'Pragati Narrow', sans-serif;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 1px 2px rgba(4, 120, 87, 0.04);
        }
        .gift-modal-payment-tile:hover {
          border-color: rgba(4, 120, 87, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px -6px rgba(16, 185, 129, 0.25), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
        }
        .gift-modal-payment-tile.is-selected {
          background: linear-gradient(160deg, #ecfdf5 0%, #ffffff 100%);
          border: 2px solid #047857;
          box-shadow:
            0 8px 22px -8px rgba(16, 185, 129, 0.40),
            0 1px 0 rgba(255, 255, 255, 0.9) inset;
        }
        .gift-modal-payment-tile-logo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(16, 185, 129, 0.18);
          box-shadow: 0 1px 2px rgba(4, 120, 87, 0.08);
        }
        .gift-modal-payment-tile-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gift-modal-payment-tile-label {
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          line-height: 1.25;
          color: #475569;
          letter-spacing: 0.01em;
        }
        .gift-modal-payment-tile.is-selected .gift-modal-payment-tile-label {
          color: #065f46;
          font-weight: 800;
        }
        .gift-modal-payment-tile-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.45);
          border: 1.5px solid #ffffff;
          color: #ffffff;
        }
        /* Tighten the donation toggle area — compact pill, not a big card */
        .gift-modal-donation {
          margin-bottom: 16px !important;
          padding: 12px 14px !important;
          background: rgba(8, 58, 133, 0.04) !important;
          border: 1px solid rgba(8, 58, 133, 0.10) !important;
          border-radius: 12px !important;
          transition: all 200ms ease !important;
        }
        .gift-modal-donation.is-active {
          background: rgba(8, 58, 133, 0.06) !important;
          border-color: rgba(31, 107, 255, 0.30) !important;
        }
        /* Convert the donation section's amber/orange highlights to brand blue
           so the modal reads as a single coherent palette (was a clash). */
        .gift-modal-donation label {
          color: #083A85 !important;
        }
        .gift-modal-donation .gift-modal-donation-icon {
          color: #1f6bff !important;
        }
        .gift-modal-donation .gift-modal-donation-toggle {
          background: #083A85 !important;
          border-color: #083A85 !important;
          color: #ffffff !important;
        }
        .gift-modal-donation .gift-modal-donation-toggle.is-off {
          background: transparent !important;
          border-color: rgba(8, 58, 133, 0.25) !important;
          color: #6b7280 !important;
        }
        .gift-modal-donation input[type="number"] {
          border-color: rgba(8, 58, 133, 0.20) !important;
          background-color: #ffffff !important;
        }
        .gift-modal-donation input[type="number"]:focus {
          border-color: #083A85 !important;
        }
        .gift-modal-donation .gift-tier-btn {
          background: #ffffff !important;
          border-color: rgba(8, 58, 133, 0.18) !important;
          color: #475569 !important;
        }
        .gift-modal-donation .gift-tier-btn.is-selected {
          background: #083A85 !important;
          border-color: #083A85 !important;
          color: #ffffff !important;
        }

        /* Settings popover */
        .settings-menu {
          background:
            linear-gradient(180deg, rgba(20, 24, 34, 0.96) 0%, rgba(10, 13, 22, 0.98) 100%) !important;
          backdrop-filter: blur(28px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          border-radius: 14px !important;
          box-shadow:
            0 24px 56px -8px rgba(0, 0, 0, 0.70),
            inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
        }

        /* Emoji picker bar */
        .emoji-picker-bar {
          background:
            linear-gradient(180deg, rgba(20, 24, 34, 0.96) 0%, rgba(10, 13, 22, 0.98) 100%) !important;
          backdrop-filter: blur(22px) !important;
          -webkit-backdrop-filter: blur(22px) !important;
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          border-radius: 18px !important;
          box-shadow:
            0 18px 44px -10px rgba(0, 0, 0, 0.65),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }
        .emoji-button {
          transition: transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1), background 140ms ease !important;
        }
        .emoji-button:hover {
          transform: scale(1.30) translateY(-2px) !important;
          background: rgba(31, 107, 255, 0.22) !important;
        }

        /* Mobile chat close fab */
        .mobile-chat-close {
          background: rgba(8, 11, 19, 0.85) !important;
          border: 1px solid rgba(96, 165, 250, 0.30) !important;
          backdrop-filter: blur(16px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(16px) saturate(160%) !important;
          border-radius: 14px !important;
          color: #f4f6fb !important;
          box-shadow:
            0 8px 22px -6px rgba(0, 0, 0, 0.65),
            0 0 24px -4px rgba(31, 107, 255, 0.30) !important;
        }

        /* ─── Custom scrollbars ─────────────────────────────────────────── */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.20);
          border-radius: 999px;
          transition: background 160ms ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(31, 107, 255, 0.65);
        }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(96, 165, 250, 0.20) transparent; }

        /* ─── Reduced motion ───────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .layout-wrapper,
          .vjs-live-label,
          .vjs-play-overlay,
          .video-player-container,
          .video-player-container::after,
          .video-section::before,
          .main-container::after,
          .stream-action-btn,
          .gift-btn-main,
          .gift-btn-main::before,
          .vjs-btn,
          .emoji-button {
            animation: none !important;
            transition: none !important;
          }
        }

        /* ─── Focus rings (a11y) ───────────────────────────────────────── */
        .stream-action-btn:focus-visible,
        .gift-btn-main:focus-visible,
        .vjs-btn:focus-visible,
        .emoji-button:focus-visible,
        .mobile-chat-close:focus-visible {
          outline: 2px solid #60a5fa !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 5px rgba(31, 107, 255, 0.25) !important;
        }

        /* ═══════════════════════════════════════════════════════════════════════
           CINEMA HERO STRIP — the new event identity surface above the player.
           Glass plate with brand-blue ambient glow + gradient bottom rim. Holds
           the live pill, title, organizer row, and the prominent gift CTA.
           ═══════════════════════════════════════════════════════════════════════ */
        .ls-hero {
          position: relative;
          margin: 0 0 12px 0;
          padding: 8px 14px;
          border-radius: 14px;
          background:
            linear-gradient(135deg, rgba(8, 58, 133, 0.22) 0%, rgba(11, 14, 21, 0.78) 60%),
            linear-gradient(180deg, rgba(15, 19, 30, 0.85) 0%, rgba(8, 11, 19, 0.92) 100%);
          backdrop-filter: blur(20px) saturate(170%);
          -webkit-backdrop-filter: blur(20px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 12px 28px -12px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(31, 107, 255, 0.08);
          isolation: isolate;
          animation: ls-hero-rise 500ms cubic-bezier(0.22, 1, 0.36, 1) 100ms backwards;
        }
        @keyframes ls-hero-rise {
          0%   { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        /* Subtle radial brand glow behind the meta column. Clipped via
           border-radius on the parent (no overflow:hidden needed because
           the decoration covers inset:0 inside the rounded box). */
        .ls-hero-veil {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 100% at 0% 50%, rgba(31, 107, 255, 0.14) 0%, rgba(31, 107, 255, 0) 60%);
          pointer-events: none;
          z-index: 0;
          border-radius: 14px;
        }
        /* Gradient hairline along the bottom edge */
        .ls-hero-glow {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(96, 165, 250, 0.40) 50%, rgba(255,255,255,0) 100%);
          pointer-events: none;
          z-index: 1;
        }
        /* Top eyebrow row — status pill + stats, all unified.
           Tight spacing now that the "STARTING SOON" pill is gone — the
           eyebrow only appears as a slim metadata strip. Empty rows
           (no LIVE pill, no stats) collapse to zero height. */
        .ls-hero-eyebrow {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
          padding-bottom: 0;
          border-bottom: none;
        }
        .ls-hero-eyebrow:empty {
          display: none;
        }
        /* Body row — avatar + title block + gift button */
        .ls-hero-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ls-hero-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1 1 200px;
        }
        .ls-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px 3px 7px;
          border-radius: 999px;
          font-family: 'Pragati Narrow', sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.10em;
          line-height: 1;
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ls-hero-pill--live {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-color: rgba(255, 255, 255, 0.28);
          color: #ffffff;
          box-shadow: 0 6px 16px -4px rgba(220, 38, 38, 0.55);
          animation: ls-hero-live-breathe 1.6s ease-in-out infinite;
        }
        @keyframes ls-hero-live-breathe {
          0%, 100% { box-shadow: 0 6px 16px -4px rgba(220, 38, 38, 0.55), 0 0 0 0 rgba(220, 38, 38, 0.55); }
          50%      { box-shadow: 0 6px 16px -4px rgba(220, 38, 38, 0.65), 0 0 0 8px rgba(220, 38, 38, 0); }
        }
        .ls-hero-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.85);
          animation: ls-hero-dot-blink 1.2s ease-in-out infinite;
        }
        @keyframes ls-hero-dot-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.40; }
        }
        .ls-hero-pill--soon {
          background: rgba(31, 107, 255, 0.18);
          border-color: rgba(96, 165, 250, 0.45);
          color: #93c5fd;
        }
        .ls-hero-pill--soon i { font-size: 10px; }
        .ls-hero-stat {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0;
          color: rgba(147, 197, 253, 0.85);
          font-size: 11.5px;
          font-weight: 600;
          font-family: 'Pragati Narrow', sans-serif;
          letter-spacing: 0.01em;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .ls-hero-stat svg { opacity: 0.85; }
        /* Subtle middle-dot separator between stats */
        .ls-hero-stat + .ls-hero-stat::before {
          content: '·';
          margin-right: 6px;
          color: rgba(147, 197, 253, 0.45);
          font-weight: 800;
        }
        /* Title — bigger, bolder, gradient sheen for premium feel */
        .ls-hero-title {
          margin: 0;
          padding: 0;
          font-family: 'Pragati Narrow', sans-serif;
          font-weight: 800;
          font-size: clamp(18px, 2.4vw, 24px);
          line-height: 1.18;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 60%, #93c5fd 100%);
          -webkit-background-clip: text;
                  background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.40);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        /* Avatar wrap — holds the avatar + a "live" pulse dot badge */
        .ls-hero-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .ls-hero-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          border: 2px solid rgba(96, 165, 250, 0.55);
          box-shadow:
            0 4px 14px -3px rgba(31, 107, 255, 0.55),
            0 0 0 3px rgba(8, 58, 133, 0.25);
          background: #1a2030;
        }
        .ls-hero-avatar--fallback {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #93c5fd;
          font-size: 18px;
        }
        /* Tiny pulsing red dot pinned to the avatar bottom-right when live */
        .ls-hero-avatar-badge {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #0d1220;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: ls-hero-avatar-pulse 1.6s ease-out infinite;
        }
        @keyframes ls-hero-avatar-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Host row — refined "Hosted by · Name · ✓ verified" */
        .ls-hero-host {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Pragati Narrow', sans-serif;
          min-width: 0;
        }
        .ls-hero-host-label {
          font-size: 10.5px;
          font-weight: 700;
          color: rgba(147, 197, 253, 0.65);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        .ls-hero-host-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #f4f6fb;
          letter-spacing: 0.005em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }
        .ls-hero-verified {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          flex-shrink: 0;
          filter: drop-shadow(0 0 3px rgba(31, 107, 255, 0.55));
          line-height: 0;
        }
        /* Gift CTA — emerald-green pill with shimmer (was gold/crimson) */
        .ls-hero-gift {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border: 1.5px solid rgba(110, 231, 183, 0.60);
          border-radius: 11px;
          background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%);
          color: #ffffff;
          font-family: 'Pragati Narrow', sans-serif;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          overflow: hidden;
          isolation: isolate;
          flex-shrink: 0;
          box-shadow:
            0 8px 18px -6px rgba(16, 185, 129, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.28);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.30);
          transition:
            transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 220ms ease,
            filter 220ms ease;
        }
        .ls-hero-gift i { font-size: 14px; }
        .ls-hero-gift-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
          transform: translateX(-100%);
          z-index: 0;
          pointer-events: none;
          transition: transform 700ms ease;
        }
        .ls-hero-gift > i,
        .ls-hero-gift > span:not(.ls-hero-gift-shimmer) { position: relative; z-index: 1; }
        .ls-hero-gift:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
          box-shadow:
            0 14px 28px -8px rgba(16, 185, 129, 0.70),
            inset 0 1px 0 rgba(255, 255, 255, 0.40);
        }
        .ls-hero-gift:hover .ls-hero-gift-shimmer { transform: translateX(100%); }
        .ls-hero-gift:active { transform: translateY(0) scale(0.98); }
        .ls-hero-gift:focus-visible {
          outline: 2px solid #fcd34d;
          outline-offset: 3px;
        }

        /* ═══════════════════════════════════════════════════════════════════════
           HIDE REDUNDANT CHROME — the new hero replaces these.
           ═══════════════════════════════════════════════════════════════════════ */
        /* Original standalone Send Gift below the player → now in hero */
        .video-section > div > .gift-btn-main { display: none !important; }
        /* The wrapping div that contains it */
        .video-section > div:has(> .gift-btn-main) { display: none !important; }

        /* ═══════════════════════════════════════════════════════════════════════
           VIDEO STAGE — pure dark, no ambient lighting INSIDE the player.
           The brand-blue rim (conic-gradient ::after defined earlier) and the
           outer shadow halo still wrap around the player from outside. The
           interior stays a deep neutral black so playback content is the
           hero, not the chrome.
           ═══════════════════════════════════════════════════════════════════════ */
        .video-player-container {
          background-color: #000000 !important;
          background-image: none !important;
        }

        /* ═══════════════════════════════════════════════════════════════════════
           LEAVE STREAM BUTTON — ghost idle, deep red on hover.
           Wins against the generic .stream-action-btn:hover (which paints
           brand-blue) by using a more-specific selector + !important.
           ═══════════════════════════════════════════════════════════════════════ */
        .stream-action-btn.ls-leave-btn,
        .ls-leave-btn {
          background: transparent !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border: 1.5px solid rgba(239, 68, 68, 0.40) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          transform: none !important;
          transition:
            background-color 200ms ease,
            border-color 200ms ease,
            color 200ms ease,
            box-shadow 200ms ease,
            transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        .stream-action-btn.ls-leave-btn:hover,
        .ls-leave-btn:hover {
          /* Soft translucent red gradient — mirrors the smoothness of the
             brand-blue hover on the Rate button, just in red tones. */
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.28) 100%) !important;
          background-color: transparent !important;
          border-color: rgba(252, 165, 165, 0.55) !important;
          color: #fef2f2 !important;
          transform: translateY(-2px) !important;
          box-shadow:
            0 12px 28px -10px rgba(220, 38, 38, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
        }
        .stream-action-btn.ls-leave-btn:active,
        .ls-leave-btn:active {
          transform: translateY(0) scale(0.98) !important;
        }
        .stream-action-btn.ls-leave-btn:focus-visible,
        .ls-leave-btn:focus-visible {
          outline: 2px solid #ef4444 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 5px rgba(220, 38, 38, 0.25) !important;
        }

        /* ═══════════════════════════════════════════════════════════════════════
           DEDUPLICATE — hide ONLY the title/organizer pieces the hero already
           shows. The action buttons (Rate / Add / Leave) keep their original
           position in the bottom row, but the row gets generous bottom padding
           so the buttons don't read as floating in an empty strip.
           ═══════════════════════════════════════════════════════════════════════ */
        /* In-video "N watching" badge — duplicates the hero stat */
        .video-player-container .ls-hide-overlay-watching { display: none !important; }
        /* Hide just the photographer eyebrow + avatar + name in the original
           bottom row. The action buttons (Rate / Add / Leave) stay visible. */
        .ls-org-row > span:first-child,
        .ls-org-row > img,
        .ls-org-row > .photographer-name { display: none !important; }
        /* The fallback avatar (a div without buttons inside) — also hidden */
        .ls-org-row > div:not(:has(button)) { display: none !important; }
        /* Action buttons row — right-aligned on its own line. Stats row
           below is lifted up via negative margin so the two share a single
           visual row (stats on left, buttons on right) — no extra scroll. */
        .ls-org-row {
          justify-content: flex-end !important;
          margin: 14px 0 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          position: relative;
          z-index: 1;
        }
        /* Stats row — pull it up so it occupies the same vertical space as
           the action buttons row. Right-padding clears the buttons (which
           are floating right) so the stats text never collides. */
        .ls-stats-row {
          margin-top: -44px !important;
          position: relative;
          z-index: 0;
          min-height: 40px;
          padding-right: 380px !important;
        }
        /* Tablet — labels still fit but with less right clearance */
        @media (max-width: 1100px) and (min-width: 721px) {
          .ls-stats-row { padding-right: 320px !important; }
        }
        /* Mobile — keep stats + buttons on a single row by collapsing the
           action buttons to icon-only (40px circles). Stats stay text. */
        @media (max-width: 720px) {
          /* Hide the verbose button text by zeroing the button's font-size
             then re-enable the icon's size. Padding shrinks to a tight
             40×40 circle; gaps tighten. There are now only 2 actions
             (Rate / Leave) so right-clearance is tighter. */
          .ls-org-row .stream-action-btn {
            font-size: 0 !important;
            padding: 0 !important;
            min-width: 40px !important;
            width: 40px !important;
            height: 40px !important;
            min-height: 40px !important;
            border-radius: 50% !important;
            justify-content: center !important;
            gap: 0 !important;
            overflow: hidden;
          }
          .ls-org-row .stream-action-btn i {
            font-size: 16px !important;
            line-height: 1 !important;
          }
          .ls-org-row { gap: 8px !important; }
          /* Stats row keeps the lift; right-clearance fits 2 × 40px circles
             + gaps (~95px). Stats text smaller for narrow viewports. */
          .ls-stats-row {
            margin-top: -48px !important;
            padding-right: clamp(95px, 28vw, 120px) !important;
            font-size: 11px;
            gap: clamp(6px, 2vw, 10px) !important;
            min-height: 40px;
          }
          .ls-stats-row .stat-item {
            font-size: 11px !important;
          }
          .ls-stats-row .stat-item i {
            font-size: 12px !important;
          }
        }
        /* Very small phones — drop to stacked layout. Negative-margin
           overlap is too tight on <380px screens. */
        @media (max-width: 380px) {
          .ls-stats-row {
            margin-top: 10px !important;
            padding-right: 0 !important;
            min-height: 0 !important;
          }
          .ls-stats-row .stat-item { font-size: 10.5px !important; }
        }
        /* Duplicate event title (stream-title) below the old row — hidden */
        .stream-info-section .stream-title { display: none !important; }

        /* ═══════════════════════════════════════════════════════════════════════
           CHAT INPUT — single unified rounded pill containing the input and
           the brand-blue send button. Pill background is a subtle dark glass
           that brightens on focus-within with a brand-blue rim glow.
           ═══════════════════════════════════════════════════════════════════════ */
        .ls-chat-input-row {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.10) !important;
          border-radius: 999px !important;
          padding: 4px 4px 4px 18px !important;
          margin-top: 6px;
          gap: 8px !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease !important;
        }
        .ls-chat-input-row:focus-within {
          background: rgba(255, 255, 255, 0.07) !important;
          border-color: rgba(96, 165, 250, 0.55) !important;
          box-shadow:
            0 0 0 4px rgba(31, 107, 255, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }
        .ls-chat-input-row input[type="text"] {
          padding: 10px 0 !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          font-size: 14px !important;
          color: #f4f6fb !important;
          line-height: 1.2 !important;
        }
        .ls-chat-input-row input[type="text"]:focus {
          background: transparent !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .ls-chat-input-row input[type="text"]::placeholder {
          color: rgba(244, 246, 251, 0.42) !important;
        }
        /* Send button — circular brand-blue icon nested inside the pill */
        .ls-chat-input-row > button {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #083A85 0%, #1f6bff 100%) !important;
          color: #ffffff !important;
          flex-shrink: 0;
          font-size: 15px !important;
          padding: 0 !important;
          border: none !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 4px 12px -4px rgba(31, 107, 255, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 180ms ease, opacity 180ms ease;
        }
        .ls-chat-input-row > button[disabled],
        .ls-chat-input-row > button:disabled {
          opacity: 0.40;
          cursor: default;
          filter: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.10);
        }
        .ls-chat-input-row > button:not(:disabled):hover {
          transform: scale(1.06);
          filter: brightness(1.10);
          box-shadow:
            0 6px 18px -4px rgba(31, 107, 255, 0.70),
            inset 0 1px 0 rgba(255, 255, 255, 0.28);
        }
        .ls-chat-input-row > button:not(:disabled):active {
          transform: scale(0.94);
        }

        /* ═══════════════════════════════════════════════════════════════════════
           SEND 1-MIN VIDEO MESSAGE — convert from green to brand-blue gradient
           ═══════════════════════════════════════════════════════════════════════ */
        .ls-video-msg-cta {
          background: linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #1f6bff 100%) !important;
          background-color: transparent !important;
          border: 1.5px solid rgba(96, 165, 250, 0.55) !important;
          box-shadow:
            0 14px 28px -10px rgba(31, 107, 255, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.20) !important;
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease, filter 220ms ease !important;
        }
        .ls-video-msg-cta:hover {
          filter: brightness(1.08);
          transform: translateY(-2px) !important;
          box-shadow:
            0 20px 36px -10px rgba(31, 107, 255, 0.70),
            inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
        }
        .ls-video-msg-cta:active { transform: translateY(0) scale(0.98) !important; }

        /* ═══════════════════════════════════════════════════════════════════════
           CHAT EMPTY STATE — animated orb + bubble teasers
           ═══════════════════════════════════════════════════════════════════════ */
        .ls-chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 32px 18px;
          text-align: center;
          animation: ls-chat-empty-fade 700ms ease-out 200ms backwards;
        }
        @keyframes ls-chat-empty-fade {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .ls-chat-empty-orb {
          position: relative;
          width: 76px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 35% 30%, rgba(96, 165, 250, 0.45) 0%, rgba(31, 107, 255, 0.20) 50%, rgba(8, 58, 133, 0.20) 100%);
          border-radius: 50%;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.20),
            0 12px 28px -8px rgba(31, 107, 255, 0.55),
            0 0 0 1px rgba(96, 165, 250, 0.30);
        }
        .ls-chat-empty-orb i {
          font-size: 32px;
          color: #f4f6fb;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.55));
          animation: ls-chat-empty-icon 2.4s ease-in-out infinite;
        }
        @keyframes ls-chat-empty-icon {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50%      { transform: scale(1.06) rotate(2deg); }
        }
        .ls-chat-empty-orb-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(96, 165, 250, 0.45);
          animation: ls-chat-empty-ring 2.6s ease-out infinite;
        }
        .ls-chat-empty-orb-ring--2 { animation-delay: 1.3s; }
        @keyframes ls-chat-empty-ring {
          0%   { transform: scale(0.85); opacity: 0.85; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        .ls-chat-empty-title {
          margin: 0;
          font-family: 'Pragati Narrow', sans-serif;
          font-size: 17px;
          font-weight: 800;
          color: #f4f6fb;
          letter-spacing: 0.01em;
        }
        .ls-chat-empty-sub {
          margin: 0;
          font-size: 12.5px;
          color: rgba(244, 246, 251, 0.65);
          line-height: 1.5;
          max-width: 220px;
        }
        .ls-chat-empty-bubbles {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .ls-chat-empty-bubbles span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(96, 165, 250, 0.55);
          animation: ls-chat-empty-bubble 1.4s ease-in-out infinite;
        }
        .ls-chat-empty-bubbles span:nth-child(2) { animation-delay: 0.20s; }
        .ls-chat-empty-bubbles span:nth-child(3) { animation-delay: 0.40s; }
        @keyframes ls-chat-empty-bubble {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.55; }
          40%           { transform: translateY(-6px); opacity: 1; }
        }

        /* ═══════════════════════════════════════════════════════════════════════
           CHAT — refined header pill + brand-blue Send-Video-Message CTA
           ═══════════════════════════════════════════════════════════════════════ */
        /* Make the top message-count pill brand-blue (was teal) */
        .chat-section h3 > span:not(.mobile-chat-close) {
          background: linear-gradient(135deg, rgba(31, 107, 255, 0.30) 0%, rgba(8, 58, 133, 0.30) 100%) !important;
          color: #93c5fd !important;
          border: 1px solid rgba(96, 165, 250, 0.30);
        }

        /* Convert the green "Send 1 Min Video Message" button to brand-blue
           gradient — keeps the camera icon but matches our palette. */
        .chat-section button[aria-label="Send video message"],
        .chat-section button[aria-label="Send video message"]:hover {
          background: linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #1f6bff 100%) !important;
          border-color: rgba(96, 165, 250, 0.55) !important;
          box-shadow:
            0 14px 28px -10px rgba(31, 107, 255, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.20) !important;
        }
        .chat-section button[aria-label="Send video message"]:hover {
          filter: brightness(1.08);
          transform: translateY(-2px) !important;
          box-shadow:
            0 20px 36px -10px rgba(31, 107, 255, 0.70),
            inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
        }

        /* ═══════════════════════════════════════════════════════════════════════
           Mobile adjustments for the new hero
           ═══════════════════════════════════════════════════════════════════════ */
        @media (max-width: 1024px) {
          .ls-hero {
            margin: 10px 12px 12px;
            border-radius: 12px;
            padding: 9px 12px;
          }
          .ls-hero-title { font-size: clamp(15px, 4vw, 18px); }
          .ls-hero-avatar { width: 34px; height: 34px; }
          .ls-hero-gift {
            padding: 8px 14px;
            font-size: 11.5px;
          }
          .ls-hero-gift i { font-size: 13px; }
        }
        @media (max-width: 540px) {
          .ls-hero-row { gap: 10px; }
          .ls-hero-eyebrow {
            gap: 6px;
            margin-bottom: 6px;
            padding-bottom: 0;
            border-bottom: none;
          }
          .ls-hero-meta { flex: 1 1 0; min-width: 0; }
          .ls-hero-title {
            font-size: clamp(15px, 4.6vw, 18px);
            white-space: normal;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            display: -webkit-box;
            line-height: 1.25;
          }
          .ls-hero-gift {
            width: auto;
            padding: 8px 12px;
            font-size: 11px;
          }
          .ls-hero-gift i { font-size: 12px; }
          .ls-hero-gift > span:not(.ls-hero-gift-shimmer) {
            /* Keep "Send Gift" visible but compact */
            white-space: nowrap;
          }
          .ls-hero-host-name { max-width: 120px; font-size: 12px; }
          .ls-hero-host-label { font-size: 9.5px; }
          .ls-hero-avatar { width: 38px; height: 38px; }
          .ls-hero-avatar-badge { width: 10px; height: 10px; }
          .ls-hero-stat { font-size: 10.5px; }
          .ls-hero-stat svg { width: 10px; height: 10px; }
        }
        /* Tiny phones — collapse the gift CTA to icon-only */
        @media (max-width: 380px) {
          .ls-hero-gift > span:not(.ls-hero-gift-shimmer) {
            display: none;
          }
          .ls-hero-gift {
            padding: 9px;
            min-width: 38px;
            justify-content: center;
          }
          .ls-hero-host-name { max-width: 90px; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .ls-hero,
          .ls-hero-pill--live,
          .ls-hero-pill-dot,
          .ls-hero-avatar-badge,
          .ls-hero-gift,
          .ls-hero-gift-shimmer,
          .ls-chat-empty,
          .ls-chat-empty-orb i,
          .ls-chat-empty-orb-ring,
          .ls-chat-empty-bubbles span {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <style>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Cursor hiding when controls are hidden */
        .video-player-container {
          cursor: pointer;
        }

        .video-player-container.hide-cursor {
          cursor: none !important;
        }

        .video-player-container.hide-cursor * {
          cursor: none !important;
        }

        /* Fullscreen specific cursor hiding */
        .video-player-container:fullscreen.hide-cursor,
        .video-player-container:-webkit-full-screen.hide-cursor,
        .video-player-container:-moz-full-screen.hide-cursor,
        .video-player-container:-ms-fullscreen.hide-cursor {
          cursor: none !important;
        }

        .video-player-container:fullscreen.hide-cursor *,
        .video-player-container:-webkit-full-screen.hide-cursor *,
        .video-player-container:-moz-full-screen.hide-cursor *,
        .video-player-container:-ms-fullscreen.hide-cursor * {
          cursor: none !important;
        }

        /* Make fullscreen take full height and ensure proper rendering */
        .video-player-container:fullscreen,
        .video-player-container:-webkit-full-screen,
        .video-player-container:-moz-full-screen,
        .video-player-container:-ms-fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          max-height: 100vh !important;
          background: #000 !important;
        }

        /* Ensure video fills fullscreen container */
        .video-player-container:fullscreen video,
        .video-player-container:-webkit-full-screen video,
        .video-player-container:-moz-full-screen video,
        .video-player-container:-ms-fullscreen video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-200px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-400px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes cardSwapMainToMini {
          0% {
            transform: scale(1) translate(0, 0) rotateZ(0deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 20px 60px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.3);
            filter: brightness(1.1);
          }
          15% {
            transform: scale(0.92) translate(-5vw, 8vh) rotateZ(-4deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 25px 70px rgba(3, 150, 156, 0.7), 0 0 120px rgba(3, 150, 156, 0.4);
            filter: brightness(1.15);
          }
          35% {
            transform: scale(0.65) translate(-8vw, 20vh) rotateZ(-8deg);
            opacity: 0.95;
            z-index: 1500;
            box-shadow: 0 30px 80px rgba(3, 150, 156, 0.8), 0 0 140px rgba(3, 150, 156, 0.5);
            filter: brightness(1.2);
          }
          50% {
            transform: scale(0.5) translate(-6vw, 32vh) rotateZ(-6deg);
            opacity: 0.9;
            z-index: 1000;
            box-shadow: 0 35px 90px rgba(3, 150, 156, 0.9), 0 0 160px rgba(3, 150, 156, 0.6);
            filter: brightness(1.1);
          }
          70% {
            transform: scale(0.38) translate(-3vw, 45vh) rotateZ(-3deg);
            opacity: 0.95;
            z-index: 500;
            box-shadow: 0 20px 50px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.4);
            filter: brightness(1.05);
          }
          90% {
            transform: scale(0.33) translate(-1vw, 52vh) rotateZ(-1deg);
            opacity: 1;
            z-index: 100;
            box-shadow: 0 12px 35px rgba(3, 150, 156, 0.4), 0 0 60px rgba(3, 150, 156, 0.2);
            filter: brightness(1);
          }
          100% {
            transform: scale(0.32) translate(0, 54vh) rotateZ(0deg);
            opacity: 1;
            z-index: 1;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            filter: brightness(1);
          }
        }

        @keyframes cardSwapMiniToMain {
          0% {
            transform: scale(0.32) translate(0, 0) rotateZ(0deg);
            opacity: 1;
            z-index: 1;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            filter: brightness(1);
          }
          10% {
            transform: scale(0.33) translate(1vw, -2vh) rotateZ(1deg);
            opacity: 1;
            z-index: 100;
            box-shadow: 0 12px 35px rgba(3, 150, 156, 0.4), 0 0 60px rgba(3, 150, 156, 0.2);
            filter: brightness(1);
          }
          30% {
            transform: scale(0.38) translate(3vw, -10vh) rotateZ(3deg);
            opacity: 0.95;
            z-index: 500;
            box-shadow: 0 20px 50px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.4);
            filter: brightness(1.05);
          }
          50% {
            transform: scale(0.5) translate(6vw, -22vh) rotateZ(6deg);
            opacity: 0.9;
            z-index: 1000;
            box-shadow: 0 35px 90px rgba(3, 150, 156, 0.9), 0 0 160px rgba(3, 150, 156, 0.6);
            filter: brightness(1.1);
          }
          65% {
            transform: scale(0.65) translate(8vw, -36vh) rotateZ(8deg);
            opacity: 0.95;
            z-index: 1500;
            box-shadow: 0 30px 80px rgba(3, 150, 156, 0.8), 0 0 140px rgba(3, 150, 156, 0.5);
            filter: brightness(1.2);
          }
          85% {
            transform: scale(0.92) translate(5vw, -48vh) rotateZ(4deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 25px 70px rgba(3, 150, 156, 0.7), 0 0 120px rgba(3, 150, 156, 0.4);
            filter: brightness(1.15);
          }
          100% {
            transform: scale(1) translate(0, -54vh) rotateZ(0deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 20px 60px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.3);
            filter: brightness(1.1);
          }
        }

        @keyframes fadeInOut {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes trailGlow {
          0%, 100% {
            box-shadow:
              0 0 20px rgba(3, 150, 156, 0.4),
              0 0 40px rgba(3, 150, 156, 0.3),
              0 0 60px rgba(3, 150, 156, 0.2);
          }
          50% {
            box-shadow:
              0 0 40px rgba(3, 150, 156, 0.8),
              0 0 80px rgba(3, 150, 156, 0.6),
              0 0 120px rgba(3, 150, 156, 0.4),
              0 0 160px rgba(3, 150, 156, 0.2);
          }
        }

        .swapping-main-to-mini {
          animation:
            cardSwapMainToMini 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards,
            trailGlow 0.5s ease-in-out infinite;
          position: relative;
          will-change: transform, opacity, filter;
          pointer-events: none;
          z-index: 2000;
          isolation: isolate;
        }

        .swapping-mini-to-main {
          animation:
            cardSwapMiniToMain 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards,
            trailGlow 0.5s ease-in-out infinite;
          position: relative;
          will-change: transform, opacity, filter;
          pointer-events: none;
          z-index: 2000;
          isolation: isolate;
        }

        .swapping-main-to-mini::before,
        .swapping-mini-to-main::before {
          content: '';
          position: absolute;
          inset: -10px;
          background: linear-gradient(45deg,
            rgba(3, 150, 156, 0.3),
            rgba(3, 150, 156, 0.1),
            rgba(3, 150, 156, 0.3));
          border-radius: 12px;
          opacity: 0.6;
          filter: blur(20px);
          z-index: -1;
          animation: trailGlow 0.8s ease-in-out infinite;
        }

        button {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        /* Scrollbar Styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Volume Slider Styling */
        input[type="range"].volume-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"].volume-slider::-webkit-slider-track {
          height: 3px;
          border-radius: 2px;
        }

        input[type="range"].volume-slider::-moz-range-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.3);
        }

        input[type="range"].volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          margin-top: -4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }

        input[type="range"].volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }

        input[type="range"].volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }

        input[type="range"].volume-slider::-moz-range-thumb:hover {
          transform: scale(1.3);
        }

        /* Progress Bar Styling */
        input[type="range"].progress-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: transparent;
          cursor: pointer;
          outline: none;
        }

        input[type="range"].progress-slider::-webkit-slider-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        input[type="range"].progress-slider::-moz-range-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        input[type="range"].progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #03969c;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          transition: all 0.2s;
        }

        input[type="range"].progress-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #03969c;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          transition: all 0.2s;
        }

        input[type="range"].progress-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"].progress-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        /* Progress bar hover effect */
        .progress-bar-container:hover .progress-thumb {
          opacity: 1 !important;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 1024px) {
          /* Prevent horizontal scrolling */
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
          }

          .main-container {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
            padding: 0 !important;
            gap: 0 !important;
            overflow-x: hidden !important;
            width: 100% !important;
          }

          .layout-wrapper {
            flex-direction: column !important;
            position: relative !important;
            overflow-x: hidden !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
          }

          .video-section {
            width: 100% !important;
            min-height: 100vh !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }

          /* Video player container mobile adjustments */
          .video-player-container {
            height: 50vh !important;
            min-height: 300px !important;
            max-height: 50vh !important;
            width: 100% !important;
          }

          .chat-section {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 70vh !important;
            max-height: 70vh !important;
            border-left: none !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            transform: translateY(100%) !important;
            transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
            z-index: 1000 !important;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5) !important;
            overflow-y: auto !important;
          }

          .chat-section.chat-open {
            transform: translateY(0) !important;
          }

          .stream-info-section {
            padding: 12px !important;
            padding-bottom: 80px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          .mini-players-container {
            flex-direction: column !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            width: 100% !important;
          }

          /* Mobile floating actions wrapper */
          .mobile-floating-actions {
            position: fixed !important;
            bottom: 16px !important;
            right: 16px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            z-index: 999 !important;
            align-items: flex-end !important;
          }

          /* Floating chat toggle button */
          .mobile-chat-toggle {
            position: relative !important;
            width: 56px !important;
            height: 56px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #083A85 0%, #0a4da3 100%) !important;
            border: none !important;
            color: #fff !important;
            font-size: 22px !important;
            cursor: pointer !important;
            box-shadow: 0 4px 20px rgba(8, 58, 133, 0.4), 0 0 0 0 rgba(8, 58, 133, 0.6) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s ease !important;
            animation: pulse-ring 2s infinite !important;
          }

          /* Floating video message button */
          .mobile-video-msg-toggle {
            position: relative !important;
            width: 56px !important;
            height: 56px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
            border: 2px solid #22c55e !important;
            color: #fff !important;
            font-size: 20px !important;
            cursor: pointer !important;
            box-shadow: 0 4px 20px rgba(22, 163, 74, 0.4) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s ease !important;
          }

          .mobile-video-msg-toggle:active {
            transform: scale(0.95) !important;
          }

          @keyframes pulse-ring {
            0% {
              box-shadow: 0 4px 20px rgba(8, 58, 133, 0.4), 0 0 0 0 rgba(8, 58, 133, 0.6);
            }
            50% {
              box-shadow: 0 4px 20px rgba(8, 58, 133, 0.4), 0 0 0 10px rgba(8, 58, 133, 0);
            }
            100% {
              box-shadow: 0 4px 20px rgba(8, 58, 133, 0.4), 0 0 0 0 rgba(8, 58, 133, 0);
            }
          }

          .mobile-chat-toggle:active {
            transform: scale(0.95) !important;
          }

          .mobile-chat-toggle .unread-badge {
            position: absolute !important;
            top: -5px !important;
            right: -5px !important;
            background: #ef4444 !important;
            color: #fff !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            padding: 4px 8px !important;
            border-radius: 12px !important;
            min-width: 24px !important;
            text-align: center !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          }

          /* Show mobile close button on mobile only */
          .mobile-chat-close {
            display: flex !important;
          }

          /* Hide mobile chat toggle when chat is open */
          .chat-open ~ .mobile-chat-toggle {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .stream-title {
            font-size: clamp(14px, 4vw, 16px) !important;
          }

          .photographer-name {
            font-size: clamp(12px, 3.5vw, 13px) !important;
          }

          .stat-item {
            font-size: clamp(11px, 3vw, 12px) !important;
          }

          .control-btn {
            font-size: 18px !important;
            padding: 8px !important;
            min-width: 44px !important;
            min-height: 44px !important;
          }

          .emoji-picker-bar {
            bottom: 60px !important;
            padding: 6px !important;
          }

          .participants-modal {
            width: 90% !important;
            max-width: 300px !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
          }

          /* Hide secondary controls on mobile to prevent overflow */
          .mobile-hidden-control {
            display: none !important;
          }

          /* Prevent volume slider from expanding on mobile */
          .volume-slider-wrapper {
            display: none !important;
          }

          /* Ensure controls bar doesn't overflow */
          .controls-bar {
            overflow: hidden !important;
            flex-wrap: nowrap !important;
          }

          /* Fullscreen always visible */
          .fullscreen-btn {
            flex-shrink: 0 !important;
          }
        }

        /* iPhone SE and small phones (320px - 375px) */
        @media (max-width: 375px) {
          .video-player-container {
            height: 45vh !important;
            min-height: 250px !important;
          }

          .stream-title {
            font-size: clamp(13px, 4vw, 15px) !important;
            line-height: 1.3 !important;
          }

          .photographer-name {
            font-size: clamp(11px, 3.5vw, 12px) !important;
          }

          .stat-item {
            font-size: clamp(10px, 2.8vw, 11px) !important;
            padding: 4px 6px !important;
          }

          .control-btn {
            font-size: 16px !important;
            padding: 6px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }

          .stream-info-section {
            padding: 8px !important;
            padding-bottom: 70px !important;
          }

          .mobile-chat-toggle {
            width: 52px !important;
            height: 52px !important;
            font-size: 20px !important;
            bottom: 16px !important;
            right: 16px !important;
          }

          .chat-section {
            height: 75vh !important;
            max-height: 75vh !important;
          }

          /* Smaller buttons and inputs */
          input, textarea, button {
            font-size: 14px !important;
          }

          /* Reduce modal padding */
          .participants-modal {
            width: 95% !important;
            max-width: 280px !important;
            padding: 16px !important;
          }

          /* Optimize emoji picker for small screens */
          .emoji-picker-bar {
            bottom: 55px !important;
            padding: 4px !important;
            gap: 4px !important;
          }

          .emoji-picker-bar button {
            width: 36px !important;
            height: 36px !important;
            font-size: 18px !important;
          }

          /* Mini players stack better on small screens */
          .mini-players-container {
            gap: 8px !important;
            padding: 8px !important;
          }

          /* Settings menu optimization */
          .settings-menu {
            min-width: 200px !important;
            max-width: 90vw !important;
            font-size: 13px !important;
          }

          /* Progress bar larger touch target */
          .progress-bar-container {
            height: 8px !important;
            margin: 8px 0 !important;
          }

          .progress-thumb {
            width: 14px !important;
            height: 14px !important;
          }
        }

        /* Medium phones and phablets (376px - 640px) */
        @media (min-width: 376px) and (max-width: 640px) {
          .video-player-container {
            height: 48vh !important;
            min-height: 280px !important;
          }

          .stream-title {
            font-size: clamp(14px, 3.8vw, 16px) !important;
          }

          .photographer-name {
            font-size: clamp(12px, 3.2vw, 14px) !important;
          }

          .control-btn {
            min-width: 46px !important;
            min-height: 46px !important;
          }

          .mobile-chat-toggle {
            width: 56px !important;
            height: 56px !important;
            font-size: 22px !important;
          }

          .emoji-picker-bar button {
            width: 40px !important;
            height: 40px !important;
            font-size: 20px !important;
          }
        }

        /* Tablets and iPad (641px - 1024px) */
        @media (min-width: 641px) and (max-width: 1024px) {
          .video-player-container {
            height: 55vh !important;
            min-height: 350px !important;
            max-height: 60vh !important;
          }

          .stream-title {
            font-size: clamp(16px, 2.5vw, 18px) !important;
          }

          .photographer-name {
            font-size: clamp(13px, 2.2vw, 15px) !important;
          }

          .chat-section {
            height: 65vh !important;
            max-height: 65vh !important;
          }

          .mobile-chat-toggle {
            width: 64px !important;
            height: 64px !important;
            font-size: 26px !important;
            bottom: 24px !important;
            right: 24px !important;
          }

          /* Two-column layout for mini players on tablet */
          .mini-players-container {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            gap: 12px !important;
          }

          /* Larger touch targets for tablet */
          .control-btn {
            min-width: 48px !important;
            min-height: 48px !important;
            font-size: 20px !important;
          }

          .emoji-picker-bar button {
            width: 44px !important;
            height: 44px !important;
            font-size: 22px !important;
          }

          /* Better spacing for tablet */
          .stream-info-section {
            padding: 16px !important;
            padding-bottom: 90px !important;
          }
        }

        /* Landscape orientation handling for phones */
        @media (max-width: 896px) and (orientation: landscape) {
          .video-player-container {
            height: 85vh !important;
            min-height: 85vh !important;
            max-height: 85vh !important;
          }

          .stream-info-section {
            padding: 8px 12px !important;
            padding-bottom: 60px !important;
          }

          .mobile-chat-toggle {
            width: 48px !important;
            height: 48px !important;
            font-size: 20px !important;
            bottom: 12px !important;
            right: 12px !important;
          }

          .chat-section {
            height: 90vh !important;
            max-height: 90vh !important;
          }

          /* Hide mini players in landscape to save space */
          .mini-players-container {
            display: none !important;
          }

          .control-btn {
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 16px !important;
            padding: 6px !important;
          }

          /* Compact emoji picker */
          .emoji-picker-bar {
            bottom: 45px !important;
            padding: 3px !important;
            gap: 2px !important;
          }

          .emoji-picker-bar button {
            width: 32px !important;
            height: 32px !important;
            font-size: 16px !important;
          }
        }

        /* Safe area insets for notched devices (iPhone X+) */
        @supports (padding: env(safe-area-inset-bottom)) {
          @media (max-width: 1024px) {
            .mobile-chat-toggle {
              bottom: calc(20px + env(safe-area-inset-bottom)) !important;
            }

            .stream-info-section {
              padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important;
            }

            .chat-section {
              padding-bottom: env(safe-area-inset-bottom) !important;
            }

            .emoji-picker-bar {
              bottom: calc(60px + env(safe-area-inset-bottom)) !important;
            }
          }

          @media (max-width: 375px) {
            .mobile-chat-toggle {
              bottom: calc(16px + env(safe-area-inset-bottom)) !important;
            }

            .stream-info-section {
              padding-bottom: calc(70px + env(safe-area-inset-bottom)) !important;
            }
          }
        }

        /* High DPI / Retina displays optimization */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .progress-bar-container {
            height: 6px !important;
          }

          .progress-thumb {
            width: 16px !important;
            height: 16px !important;
          }

          @media (max-width: 375px) {
            .progress-bar-container {
              height: 8px !important;
            }

            .progress-thumb {
              width: 18px !important;
              height: 18px !important;
            }
          }
        }

        /* Mobile-only floating buttons — base styles */
        .floating-action-btn {
          position: fixed;
          right: 20px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        @supports (right: max(0px)) {
          .floating-action-btn {
            right: max(20px, env(safe-area-inset-right, 20px));
          }
        }

        /* Bottom button (chat) — sits above iOS home indicator */
        .floating-action-bottom {
          bottom: 80px;
        }
        @supports (bottom: max(0px)) {
          .floating-action-bottom {
            bottom: max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px));
          }
        }

        /* Top button (video msg) — stacked above the chat button */
        .floating-action-top {
          bottom: 144px;
        }
        @supports (bottom: max(0px)) {
          .floating-action-top {
            bottom: max(144px, calc(env(safe-area-inset-bottom, 0px) + 144px));
          }
        }

        .mobile-only-float {
          display: none;
        }
        @media (max-width: 1024px) {
          .mobile-only-float {
            display: flex !important;
          }
          /* Gift button: horizontal row on mobile */
          .gift-btn-main {
            flex-direction: row !important;
            min-height: auto !important;
            min-width: auto !important;
            padding: 10px 20px !important;
            gap: 8px !important;
            font-size: 13px !important;
          }
          .gift-btn-main i {
            font-size: 18px !important;
          }
          /* Compact action buttons on mobile */
          .stream-action-btn {
            padding: 6px 12px !important;
            font-size: 11px !important;
            border-radius: 10px !important;
            min-height: 32px !important;
          }
          /* Hide Stream ID on mobile — not useful for viewers */
          .desktop-only-stat {
            display: none !important;
          }
          /* Video section: remove side padding on mobile for full-width player */
          .video-section {
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-top: 0 !important;
          }
          .video-player-container {
            border-radius: 0 !important;
          }
          /* Stream info section needs side padding on mobile so its content
             (mini players + actions + stats) doesn't hit the edges */
          .stream-info-section {
            padding-left: 12px !important;
            padding-right: 12px !important;
            padding-bottom: clamp(20px, 4vw, 28px) !important;
          }
          /* Prevent any horizontal overflow on the page */
          .main-container,
          .layout-wrapper,
          .video-section {
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          /* Mini players: horizontal scroll lane on mobile */
          .mini-players-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .mini-players-container::-webkit-scrollbar { display: none; }
        }

        /* Desktop-specific styles (maintain unchanged) */
        @media (min-width: 1025px) {
          .mobile-only-float {
            display: none !important;
          }
          .mobile-floating-actions {
            display: none !important;
          }
          .mobile-chat-toggle {
            display: none !important;
          }

          .mobile-chat-close {
            display: none !important;
          }

          .chat-section {
            position: static !important;
            transform: none !important;
            height: 100vh !important;
            width: 340px !important;
            max-height: 100vh !important;
          }

          .layout-wrapper {
            flex-direction: row !important;
          }

          .video-section {
            flex: 1 !important;
            min-height: 100vh !important;
          }

          .video-player-container {
            height: calc(100vh - 450px) !important;
            min-height: 400px !important;
          }

          /* Larger control buttons for desktop */
          .control-btn {
            min-width: 52px !important;
            min-height: 52px !important;
            font-size: 24px !important;
            padding: 12px !important;
          }

          /* Make progress bar more visible on desktop */
          .progress-bar-container {
            height: 6px !important;
            margin-bottom: 12px !important;
          }

          .progress-bar-container:hover {
            height: 8px !important;
          }

          /* Larger volume slider on desktop */
          .volume-slider {
            width: 120px !important;
          }
        }

        /* Modal responsive improvements.
           NOTE: .gift-modal removed from this group — it has its own
           tighter max-width (380px) defined in the polish layer above. */
        .modal-content,
        .add-event-modal,
        .participants-modal {
          max-width: 90vw !important;
          max-height: 90vh !important;
          overflow-y: auto !important;
        }
        .gift-modal {
          max-height: 90vh !important;
          overflow-y: auto !important;
        }
        .rating-modal {
          max-height: 90vh !important;
          overflow-y: auto !important;
        }

        @media (max-width: 640px) {
          .modal-content,
          .add-event-modal,
          .rating-modal {
            width: calc(100vw - 24px) !important;
            max-width: calc(100vw - 24px) !important;
            margin: 12px !important;
            padding: 16px !important;
            padding-top: 40px !important;
            border-radius: 14px !important;
          }

          /* Gift modal — own mobile sizing (tighter than the generic rule).
             The decorative ribbon + sparkles are downsized/hidden, the
             payment grid stays 3-col but gets tighter padding, and the
             eyebrow gets out of the close button's way. */
          .gift-modal {
            width: calc(100vw - 24px) !important;
            max-width: 420px !important;
            margin: 12px !important;
            border-radius: 16px !important;
            padding-top: clamp(22px, 6vw, 28px) !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            padding-bottom: 18px !important;
          }
          /* Ribbon corner — smaller, repositioned so it doesn't crowd the
             eyebrow text on narrow screens */
          .gift-ribbon-corner {
            top: 14px;
            left: -42px;
            width: 120px;
            font-size: 9px;
            padding: 3px 0;
          }
          /* Sparkles — hidden on mobile to avoid overlapping the close
             button + eyebrow on tight viewports */
          .gift-modal-sparkle { display: none !important; }
          /* Eyebrow + title + sub — slightly tighter */
          .gift-modal-eyebrow {
            font-size: 9.5px !important;
            padding: 4px 9px 4px 7px !important;
            margin-bottom: 8px !important;
          }
          .gift-modal-title {
            font-size: clamp(17px, 5vw, 20px) !important;
          }
          .gift-modal-sub {
            font-size: 12.5px !important;
            margin-bottom: 14px !important;
          }
          /* Amount panel — tighter padding */
          .gift-modal-amount-panel {
            padding: 12px 14px !important;
            margin-bottom: 14px !important;
          }
          .gift-modal-amount-input {
            padding: 11px 14px !important;
            font-size: 14px !important;
          }
          /* Tier buttons — tighter gap, smaller padding */
          .gift-modal-tiers {
            gap: 5px !important;
            margin-top: 8px !important;
          }
          .gift-modal-tiers .gift-tier-btn {
            padding: 8px 6px !important;
            font-size: 11px !important;
            min-width: 50px !important;
          }
          /* Payment grid — tighter on mobile */
          .gift-modal-payment-grid {
            gap: 6px !important;
            margin-bottom: 14px !important;
          }
          .gift-modal-payment-tile {
            padding: 12px 4px 10px !important;
            border-radius: 12px !important;
          }
          .gift-modal-payment-tile-logo {
            width: 38px !important;
            height: 38px !important;
            border-radius: 10px !important;
          }
          .gift-modal-payment-tile-label {
            font-size: 9.5px !important;
          }
          .gift-modal-payment-tile-check {
            width: 16px !important;
            height: 16px !important;
            top: 6px !important;
            right: 6px !important;
          }

          .modal-content h2,
          .add-event-modal h2,
          .rating-modal h2,
          .gift-modal h2 {
            font-size: clamp(16px, 5vw, 20px) !important;
          }

          .modal-content input,
          .modal-content textarea,
          .add-event-modal input,
          .add-event-modal textarea,
          .rating-modal input,
          .rating-modal textarea,
          .gift-modal input,
          .gift-modal textarea {
            font-size: 16px !important; /* Prevents iOS zoom on focus */
          }

          .participants-modal {
            width: calc(100vw - 24px) !important;
            max-width: calc(100vw - 24px) !important;
          }

          .auth-stream-modal {
            width: calc(100vw - 24px) !important;
            max-width: calc(100vw - 24px) !important;
            padding: 20px 16px !important;
            border-radius: 14px !important;
          }

          .auth-stream-modal input {
            font-size: 16px !important;
          }
        }

        /* Tiny phones — additional gift modal compaction (≤380px wide) */
        @media (max-width: 380px) {
          .gift-modal {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
          .gift-modal-payment-grid { gap: 5px !important; }
          .gift-modal-payment-tile { padding: 10px 3px 8px !important; }
          .gift-modal-payment-tile-logo { width: 34px !important; height: 34px !important; }
          .gift-modal-payment-tile-label { font-size: 9px !important; }
          .gift-modal-tiers .gift-tier-btn {
            padding: 7px 4px !important;
            font-size: 10.5px !important;
            min-width: 44px !important;
          }
          .gift-ribbon-corner { display: none; }
        }

        /* Safe area insets for modals on notched devices */
        @supports (padding: env(safe-area-inset-bottom)) {
          .add-event-modal,
          .rating-modal,
          .participants-modal,
          .gift-modal {
            padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
          }

          @media (max-width: 768px) {
            .modal-content,
            .add-event-modal,
            .rating-modal,
            .participants-modal,
            .gift-modal {
              margin-bottom: env(safe-area-inset-bottom) !important;
            }

            .settings-menu {
              bottom: calc(clamp(50px, 12vw, 60px) + env(safe-area-inset-bottom)) !important;
            }
          }
        }

        /* Performance optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Smooth scrolling for all containers */
        .chat-section,
        .messages-container,
        .mini-players-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Dark mode optimization (already dark, but future-proof) */
        @media (prefers-color-scheme: dark) {
          body {
            color-scheme: dark;
          }
        }
      `}</style>

    {/* Swap Overlay Effect */}
    {isSwapping && (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(2px)',
        zIndex: 1500,
        pointerEvents: 'none',
        animation: 'fadeInOut 0.5s ease-in-out forwards'
      }} />
    )}

    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#0e0e10',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#efeff1',
      overflow: 'hidden'
    }} className="main-container">

        {/* Main Layout Wrapper */}
        <div style={{
          display: 'flex',
          width: '100%',
          height: '100vh',
          gap: '0'
        }} className="layout-wrapper">

          {/* Left Section: Video Player */}
          <div className="video-section" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1a1a1d',
            overflow: isSwapping ? 'visible' : 'auto',
            position: 'relative',
            paddingLeft: '40px',
            paddingTop: '20px',
            paddingRight: '20px',
          }}>

            {/* ═══════════════════════════════════════════════════════════════
                CINEMA HERO — event identity strip above the stage.
                Pure presentation: pulls from the existing mainEvent state,
                no new backend calls. Sits at the top of the video-section so
                viewers see what they're watching the moment the page paints. */}
            {mainEvent && mainEvent.title && mainEvent.title !== 'Loading...' && (
              <div className="ls-hero" aria-label="Event details">
                <div className="ls-hero-veil" aria-hidden="true" />
                <div className="ls-hero-glow" aria-hidden="true" />

                {/* Eyebrow row — LIVE pill (when ongoing only) + stats. The
                    "STARTING SOON" banner has been removed per design req. */}
                <div className="ls-hero-eyebrow">
                  {mainEvent.eventStatus === 'ONGOING' && (
                    <span className="ls-hero-pill ls-hero-pill--live">
                      <span className="ls-hero-pill-dot" aria-hidden="true" />
                      LIVE NOW
                    </span>
                  )}
                  {typeof mainEvent.viewers === 'number' && mainEvent.viewers > 0 && (
                    <span className="ls-hero-stat">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {mainEvent.viewers.toLocaleString()} watching
                    </span>
                  )}
                  {mainEvent.startTime && (
                    <span className="ls-hero-stat">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {mainEvent.startTime}
                    </span>
                  )}
                </div>

                {/* Body row — avatar, title + host, gift button */}
                <div className="ls-hero-row">
                  <div className="ls-hero-avatar-wrap">
                    {mainEvent.photographerAvatar ? (
                      <img
                        src={mainEvent.photographerAvatar}
                        alt={mainEvent.photographer || 'Organizer'}
                        className="ls-hero-avatar"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="ls-hero-avatar ls-hero-avatar--fallback" aria-hidden="true">
                        <i className="bi bi-person-fill" />
                      </span>
                    )}
                    {mainEvent.eventStatus === 'ONGOING' && (
                      <span className="ls-hero-avatar-badge" aria-hidden="true" />
                    )}
                  </div>

                  <div className="ls-hero-meta">
                    <h1 className="ls-hero-title">{mainEvent.title}</h1>
                    <div className="ls-hero-host">
                      <span className="ls-hero-host-label">Hosted by</span>
                      <span className="ls-hero-host-name">{mainEvent.photographer || 'Organizer'}</span>
                      <span className="ls-hero-verified" aria-label="Verified host" title="Verified host">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2l2.39 4.84L20 7.61l-3.85 3.75.91 5.32L12 14.14 6.94 16.68l.91-5.32L4 7.61l5.61-.77L12 2z" opacity="0" />
                          <path d="M22.5 12c0-1.5-1-2.8-2.4-3.3.4-1.4 0-3-1-4-1-1-2.6-1.4-4-1C14.5 2.5 13.3 1.5 12 1.5s-2.5 1-3 2.4c-1.4-.4-3 0-4 1-1 1-1.4 2.6-1 4C2.5 9.5 1.5 10.7 1.5 12s1 2.5 2.4 3c-.4 1.4 0 3 1 4 1 1 2.6 1.4 4 1 .5 1.4 1.7 2.4 3 2.4s2.5-1 3-2.4c1.4.4 3 0 4-1 1-1 1.4-2.6 1-4 1.5-.5 2.5-1.7 2.5-3z M10.5 16l-3.5-3.5 1.4-1.4 2.1 2.1 5.1-5.1 1.4 1.4z" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {isGiftableEvent && events.length === 1 && (
                    <button
                      onClick={() => openGiftModal(mainEvent)}
                      className="ls-hero-gift"
                      type="button"
                      aria-label="Send a gift to the organizer"
                    >
                      <span className="ls-hero-gift-shimmer" aria-hidden="true" />
                      <i className="bi bi-gift-fill" aria-hidden="true" />
                      <span>Send Gift</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Main Video Player Container */}
            <div
              id="main-video-player"
              onClick={() => !isSwapping && togglePlay(mainEvent.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouch}
              onTouchMove={handleTouch}
              className={`video-player-container vjs-live-player ${!showControls ? 'hide-cursor' : ''} ${isSwapping && swappingFromIndex === mainEventIndex ? 'swapping-main-to-mini' : ''}`}
              style={{
                height: events.length > 1 ? 'calc(100vh - 450px)' : 'calc(100vh - 200px)',
                minHeight: '400px',
                backgroundColor: '#000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: isSwapping ? 'visible' : 'hidden',
                transition: isSwapping ? 'none' : 'all 0.3s ease',
                zIndex: isSwapping && swappingFromIndex === mainEventIndex ? 1000 : 1,
                pointerEvents: isSwapping ? 'none' : 'auto',
                borderRadius: '16px',
              }}>

              {/* Stream Access Gate */}
              {!streamAccessGranted && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.92)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  gap: '16px',
                }}>
                  {/* ── Entry Fee — check if already paid or need purchase ── */}
                  {isEntryFeeStream(mainEvent) ? (
                    accessCheckLoading ? (
                      // Verifying access — show spinner while checking
                      <>
                        <div style={{ width: 42, height: 42, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} />
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                          Verifying Access...
                        </h3>
                        <p style={{ color: '#adadb8', fontSize: '14px', margin: 0, maxWidth: '320px' }}>
                          Please wait while we confirm your access.
                        </p>
                      </>
                    ) : mainEvent.hasPurchasedAccess ? (
                      // Paid viewer (backend confirmed) — access confirmed, waiting for stream
                      <>
                        <i className="bi bi-hourglass-split" style={{ fontSize: '42px', color: '#10b981' }}></i>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                          Access Confirmed
                        </h3>
                        <p style={{ color: '#adadb8', fontSize: '14px', margin: 0, maxWidth: '320px' }}>
                          Waiting for the stream to start...
                        </p>
                      </>
                    ) : !isAuthenticated ? (
                      // Not logged in and not a registered anonymous viewer — show purchase
                      <>
                        <i className="bi bi-lock-fill" style={{ fontSize: '42px', color: '#03969c' }}></i>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                          Paid Stream
                        </h3>
                        <p style={{ color: '#adadb8', fontSize: '14px', margin: 0, maxWidth: '320px' }}>
                          Purchase access to watch this stream.
                        </p>
                        <button
                          onClick={() => window.location.href = `/user/events/join-package?id=${mainEvent.id}`}
                          style={{
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <i className="bi bi-ticket-perforated-fill" style={{ marginRight: '8px' }}></i>
                          Purchase Access
                        </button>
                      </>
                    ) : (
                      // Logged in but hasn't paid — redirect to purchase
                      <>
                        <i className="bi bi-lock-fill" style={{ fontSize: '42px', color: '#03969c' }}></i>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                          Paid Stream
                        </h3>
                        <p style={{ color: '#adadb8', fontSize: '14px', margin: 0, maxWidth: '320px' }}>
                          You need to purchase access to watch this stream.
                        </p>
                        <button
                          onClick={() => window.location.href = `/user/events/view-event?id=${mainEvent.id}`}
                          style={{
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <i className="bi bi-ticket-perforated-fill" style={{ marginRight: '8px' }}></i>
                          Purchase Access
                        </button>
                      </>
                    )
                  ) : isInviteTokenStream(mainEvent) ? (
                    /* ── Invite Token Form (client streams) ── */
                    <>
                      <i className="bi bi-ticket-perforated-fill" style={{ fontSize: '42px', color: '#03969c' }}></i>
                      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                        Join Stream
                      </h3>
                      <p style={{ color: '#adadb8', fontSize: '14px', margin: 0, maxWidth: '320px' }}>
                        Enter your invite token to start watching.
                      </p>

                      <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '320px' }}>
                        <input
                          type="text"
                          value={inviteTokenInput}
                          onChange={(e) => setInviteTokenInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleInviteTokenSubmit()}
                          placeholder="Enter invite token"
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            backgroundColor: '#27272a',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleInviteTokenSubmit}
                          disabled={inviteTokenLoading || !inviteTokenInput.trim()}
                          style={{
                            padding: '12px 20px',
                            background: (inviteTokenLoading || !inviteTokenInput.trim())
                              ? '#3f3f46'
                              : 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: (inviteTokenLoading || !inviteTokenInput.trim()) ? '#71717a' : '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: (inviteTokenLoading || !inviteTokenInput.trim()) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {inviteTokenLoading ? 'Joining...' : 'Join'}
                        </button>
                      </div>
                      {inviteTokenError && (
                        <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{inviteTokenError}</p>
                      )}
                    </>
                  ) : (
                    /* ── Loading / verifying state ── */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#adadb8' }}>
                      <div style={{
                        width: '24px', height: '24px', border: '3px solid #93c5fd',
                        borderTopColor: 'transparent', borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Loading stream...
                    </div>
                  )}
                </div>
              )}

              {/* Device Access Error Overlay */}
              {deviceError && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.95)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  gap: '16px',
                }}>
                  <i className="bi bi-display" style={{ fontSize: '48px', color: '#93c5fd' }}></i>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                    Device Access Restricted
                  </h3>
                  <p style={{ color: '#adadb8', fontSize: '14px', margin: 0, maxWidth: '360px', lineHeight: '1.6' }}>
                    {deviceError}
                  </p>
                  <p style={{ color: '#71717a', fontSize: '12px', margin: 0, maxWidth: '320px' }}>
                    Close the other session or wait 60 seconds for it to expire, then refresh this page.
                  </p>
                  <button
                    onClick={() => { setDeviceError(null); window.location.reload(); }}
                    style={{
                      marginTop: '8px',
                      padding: '12px 28px',
                      background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 100%)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(8,58,133,0.35)',
                    }}
                  >
                    <i className="bi bi-arrow-clockwise" style={{ marginRight: '8px' }}></i>
                    Try Again
                  </button>
                </div>
              )}

              <video
                key={mainEvent.id}
                ref={mainVideoRefCallback}
                playsInline
                muted
                style={{ pointerEvents: 'none' }}
                onPlay={() => {
                  const vid = videoRefs.current[mainEvent.id];
                  const actualMuted = vid ? vid.muted : true;
                  setPlaybackState(prev => ({
                    ...prev,
                    [mainEvent.id]: { ...prev[mainEvent.id], isPlaying: true, isMuted: actualMuted }
                  }));
                  playbackStateRef.current = {
                    ...playbackStateRef.current,
                    [mainEvent.id]: { ...playbackStateRef.current[mainEvent.id], isPlaying: true, isMuted: actualMuted }
                  };
                }}
                onPause={() => {
                  setPlaybackState(prev => ({
                    ...prev,
                    [mainEvent.id]: { ...prev[mainEvent.id], isPlaying: false }
                  }));
                  playbackStateRef.current = {
                    ...playbackStateRef.current,
                    [mainEvent.id]: { ...playbackStateRef.current[mainEvent.id], isPlaying: false }
                  };
                }}
              >
                {!mainEvent.whepUrl && mainEvent.videoSrc && <source src={mainEvent.videoSrc} type="video/mp4" />}
              </video>

              {/* ── Live Stream Ad Banners ── */}
              {streamAds.length > 0 && (
                <StreamAdManager
                  ads={streamAds}
                  intervalSeconds={adScheduleInterval}
                  enabled={adsEnabled}
                  isMobile={typeof window !== 'undefined' && window.innerWidth < 768}
                  onAdClick={(ad) => {
                    if (ad.ctaUrl) {
                      const url = /^https?:\/\//i.test(ad.ctaUrl) ? ad.ctaUrl : `https://${ad.ctaUrl}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                    recordAdClick(mainEvent.id, ad.id, user?.customerId).catch(() => {});
                  }}
                />
              )}

              {/* Stream starting overlay — ONGOING but WHEP URL not yet available
                  Hide while access-status is still being checked (race condition guard) */}
              {mainEvent.eventStatus === 'ONGOING' && !mainEvent.whepUrl && !accessCheckLoading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.75)',
                  gap: '16px',
                  zIndex: 9,
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255,255,255,0.15)',
                    borderTopColor: '#03969c',
                    borderRadius: '50%',
                    animation: 'spin 0.9s linear infinite',
                  }} />
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    Stream is starting, please wait…
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: 0 }}>
                    The page will update automatically
                  </p>
                </div>
              )}

              {/* Stream paused overlay — photographer stopped, will resume */}
              {streamOverlay === 'paused' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.8)',
                  gap: '12px',
                  zIndex: 10,
                }}>
                  <div style={{ fontSize: '44px' }}>⏸️</div>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    Stream paused
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: 0 }}>
                    The stream will resume shortly — stay on this page
                  </p>
                </div>
              )}

              {/* Stream ended overlay */}
              {streamOverlay === 'ended' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.85)',
                  gap: '12px',
                  zIndex: 10,
                }}>
                  <div style={{ fontSize: '44px' }}>📺</div>
                  <p style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                    Stream has ended
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: 0 }}>
                    Thank you for watching
                  </p>
                </div>
              )}

              {/* Scheduled overlay — stream not yet started */}
              {streamOverlay === 'scheduled' && !mainEvent.whepUrl && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.75)',
                  gap: '12px',
                  zIndex: 9,
                }}>
                  <div style={{ fontSize: '44px' }}>📡</div>
                  <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    Live stream coming soon
                  </p>
                  {showCountdown && msUntilStart !== null && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 10,
                      padding: '10px 18px', marginTop: 4,
                      background: 'linear-gradient(135deg, rgba(245,101,44,0.2), rgba(245,101,44,0.08))',
                      border: '1px solid rgba(245,101,44,0.5)',
                      borderRadius: 999, color: '#fdba74',
                      fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
                    }}>
                      <i className="bi bi-hourglass-split" style={{ color: '#f5652c' }}></i>
                      <span>Starts in {formatCountdown(msUntilStart)}</span>
                    </div>
                  )}
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: 0 }}>
                    The stream will start automatically — stay on this page
                  </p>
                </div>
              )}

              {/* Viewer Count — clickable to open participants panel.
                  Note: hidden via CSS (.ls-hide-overlay-watching) when the
                  Cinema Hero above already shows the watcher count. */}
              {mainEvent.viewers > 0 && (
                <div
                  className="ls-hide-overlay-watching"
                  onClick={(e) => { e.stopPropagation(); setShowParticipants(true); }}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    zIndex: 10,
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(3,150,156,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'; }}
                >
                  <i className="bi bi-eye-fill"></i>
                  {mainEvent.viewers.toLocaleString()} watching
                </div>
              )}

              {/* Live Badge — pinned to top-right corner of the video */}
              <div
                className="vjs-live-label"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  left: 'auto',
                  bottom: 'auto',
                  zIndex: 10,
                  opacity: showControls ? 1 : 0,
                  transform: showControls ? 'translateY(0)' : 'translateY(-20px)',
                }}
              >
                <span className="vjs-live-dot vjs-live-dot--on" />
                LIVE
              </div>

              {/* Play Button Overlay */}
              {!mainState.isPlaying && (
                <button
                  className="vjs-play-overlay"
                  onClick={() => togglePlay(mainEvent.id)}
                >
                  <PlayIcon />
                </button>
              )}


              {/* Floating Emoji Reactions */}
              {activeReactions.map((reaction) => (
                <div
                  key={reaction.id}
                  style={{
                    position: 'absolute',
                    right: `${Math.random() * 30 + 10}%`,
                    bottom: '60px',
                    fontSize: '48px',
                    animation: 'floatUp 3s ease-out forwards',
                    zIndex: 15,
                    pointerEvents: 'none'
                  }}
                >
                  {reaction.emoji}
                </div>
              ))}

              {/* ── video.js-styled Controls ── */}
              <div
                className={`vjs-controls ${showControls ? 'vjs-controls--visible' : ''}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  setShowControls(true);
                  if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                }}
              >
                {/* Progress Bar */}
                <div className="vjs-progress-row" onClick={handleProgressChange}>
                  <div className="vjs-progress-fill" style={{ width: `${mainState.progress}%` }}>
                    <div className="vjs-progress-thumb" />
                  </div>
                </div>

                {/* Buttons */}
                <div className="vjs-buttons-row">
                  {/* Play / Pause */}
                  <button className="vjs-btn vjs-btn--play" onClick={() => togglePlay(mainEvent.id)} title={mainState.isPlaying ? 'Pause' : 'Play'}>
                    {mainState.isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>

                  {/* LIVE badge */}
                  <button
                    className={`vjs-live-badge ${isBehindLive ? 'vjs-live-badge--behind' : 'vjs-live-badge--live'}`}
                    onClick={isBehindLive ? jumpToLive : undefined}
                  >
                    <span className={`vjs-live-dot ${isBehindLive ? 'vjs-live-dot--off' : 'vjs-live-dot--on'}`} />
                    {isBehindLive ? 'GO LIVE' : 'LIVE'}
                  </button>

                  {/* Volume (popover on hover) */}
                  <div
                    className="vjs-volume-group"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button className="vjs-btn" onClick={() => toggleMute(mainEvent.id)} title={mainState.isMuted ? 'Unmute' : 'Mute'}>
                      {mainState.isMuted || mainState.volume === 0
                        ? <VolumeOffIcon />
                        : mainState.volume < 50
                          ? <VolumeLowIcon />
                          : <VolumeHighIcon />}
                    </button>
                    <div className={`vjs-volume-popover ${showVolumeSlider ? 'vjs-volume-popover--visible' : ''}`}>
                      <div className="vjs-volume-slider-vertical">
                        <div className="vjs-volume-slider-fill" style={{ height: `${mainState.volume ?? 100}%` }} />
                        <div className="vjs-volume-slider-thumb" style={{ bottom: `${mainState.volume ?? 100}%` }} />
                        <input
                          type="range"
                          className="vjs-volume-slider-input"
                          min="0"
                          max="100"
                          value={mainState.volume ?? 100}
                          onChange={(e) => handleVolumeChange(mainEvent.id, Number(e.target.value))}
                        />
                      </div>
                      <span className="vjs-volume-label">{Math.round(mainState.volume)}%</span>
                    </div>
                  </div>

                  {/* Emoji */}
                  <button className="vjs-btn vjs-mobile-hidden" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji reactions">
                    <EmojiIcon />
                  </button>


                  {/* Right group: Settings + Fullscreen */}
                  <div className="vjs-buttons-row--right">
                    <div style={{ position: 'relative' }}>
                      <button
                        className="vjs-btn settings-button"
                        onClick={() => setShowSettings(!showSettings)}
                        title="Settings"
                        style={{ background: showSettings ? 'rgba(3,150,156,0.2)' : undefined }}
                      >
                        <i className="bi bi-gear-fill" style={{ fontSize: 20 }}></i>
                      </button>

                    {/* Settings Dropdown */}
                    {showSettings && !showReportIssues && (
                      <div className="settings-menu" style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        right: '0',
                        backgroundColor: '#18181b',
                        borderRadius: '16px',
                        padding: 'clamp(6px, 2vw, 8px)',
                        minWidth: 'clamp(200px, 50vw, 240px)',
                        maxWidth: 'min(90vw, 280px)',
                        maxHeight: 'min(60vh, 400px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        zIndex: 100,
                        overflowY: 'auto'
                      }}>
                        {/* Low Latency Mode */}
                        <div style={{ padding: '8px' }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#adadb8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>Latency</div>
                          <button
                            onClick={handleLowLatencyToggle}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '12px',
                              color: '#efeff1',
                              fontSize: '14px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div>
                              <span>{lowLatencyMode ? 'Low Latency' : 'Smooth'}</span>
                              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                                {lowLatencyMode ? 'Closer to real-time' : 'Fewer stalls, more buffer'}
                              </div>
                            </div>
                            <div style={{
                              width: '36px',
                              height: '20px',
                              backgroundColor: lowLatencyMode ? '#016a6e' : 'rgba(255, 255, 255, 0.2)',
                              borderRadius: '10px',
                              position: 'relative',
                              transition: 'all 0.2s'
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#fff',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: lowLatencyMode ? '18px' : '2px',
                                transition: 'all 0.2s'
                              }}></div>
                            </div>
                          </button>
                        </div>

                        <div style={{
                          height: '1px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          margin: '8px 0'
                        }}></div>

                        {/* Report Issue */}
                        <div style={{ padding: '8px' }}>
                          <button
                            onClick={() => setShowReportIssues(true)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '12px',
                              color: '#ef4444',
                              fontSize: '14px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="bi bi-exclamation-triangle-fill"></i>
                              Report playback issue
                            </div>
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Report Issues Submenu */}
                    {showReportIssues && (
                      <div className="settings-menu" style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        right: '0',
                        backgroundColor: '#18181b',
                        borderRadius: '16px',
                        padding: '8px',
                        minWidth: '240px',
                        maxHeight: '400px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        zIndex: 100
                      }}>
                        <div style={{
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <button
                            onClick={() => setShowReportIssues(false)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#adadb8',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '16px',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#efeff1'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#adadb8'}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#efeff1'
                          }}>Report Playback Issue</div>
                        </div>

                        <div style={{
                          height: '1px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          margin: '8px 0'
                        }}></div>

                        <div style={{ padding: '8px' }}>
                          {[
                            { icon: 'bi-skip-forward-fill', text: 'Buffering or lag', value: 'Buffering or lag' },
                            { icon: 'bi-file-play', text: 'Video not playing', value: 'Video not playing' },
                            { icon: 'bi-badge-hd', text: 'Poor video quality', value: 'Poor video quality' },
                            { icon: 'bi-volume-mute-fill', text: 'No audio', value: 'No audio' },
                            { icon: 'bi-soundwave', text: 'Audio/Video out of sync', value: 'Audio/Video out of sync' },
                            { icon: 'bi-pip', text: 'Video player issues', value: 'Video player issues' },
                            { icon: 'bi-wifi-off', text: 'Connection issues', value: 'Connection issues' },
                            { icon: 'bi-three-dots', text: 'Other issue', value: 'Other issue' }
                          ].map((issue, index) => (
                            <button
                              key={index}
                              onClick={() => handleReportIssue(issue.value)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#efeff1',
                                fontSize: '14px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '2px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className={`bi ${issue.icon}`} style={{ fontSize: '16px', color: '#ef4444' }}></i>
                              {issue.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Fullscreen */}
                    <button className="vjs-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                      {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Emoji Picker - Modern Style */}
              {showEmojiPicker && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="emoji-picker-bar"
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    borderRadius: '24px',
                    padding: '8px 16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}>
                  {emojiList.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiReaction(item.emoji)}
                      className="emoji-button"
                      style={{
                        fontSize: '24px',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '40px',
                        height: '40px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.3)';
                        e.currentTarget.style.backgroundColor = 'rgba(3, 150, 156, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title={item.name}
                    >
                      {item.emoji}
                    </button>
                  ))}
                  <div style={{
                    width: '1px',
                    height: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    margin: '0 4px'
                  }}></div>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#adadb8',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      minWidth: '40px',
                      height: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#efeff1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#adadb8';
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}

              {/* Participants Viewer */}
              {showParticipants && (
                <>
                  {/* Backdrop overlay */}
                  <div
                    onMouseDown={(e) => {
                      // Only close if clicking directly on backdrop
                      if (e.target === e.currentTarget) {
                        setShowParticipants(false);
                      }
                    }}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      zIndex: 1999,
                      backdropFilter: 'blur(2px)'
                    }}
                  />
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="participants-modal"
                    style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: '#18181b',
                      borderRadius: '20px',
                      padding: 'clamp(16px, 4vw, 20px)',
                      width: 'min(calc(100vw - 32px), 320px)',
                      maxHeight: 'min(80vh, 500px)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                      zIndex: 2000,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflowY: 'auto',
                      pointerEvents: 'auto'
                    }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'clamp(12px, 3vw, 16px)'
                  }}>
                    <h3 style={{
                      fontSize: 'clamp(14px, 3.5vw, 16px)',
                      fontWeight: '600',
                      color: '#efeff1',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(6px, 2vw, 8px)'
                    }}>
                      <i className="bi bi-people-fill" style={{ color: '#03969c', fontSize: 'clamp(14px, 3.5vw, 16px)' }}></i>
                      {mainEvent.viewers > 0 ? `${mainEvent.viewers.toLocaleString()} Watching` : `Viewers (${participants.length})`}
                    </h3>
                    <button
                      onClick={() => setShowParticipants(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#adadb8',
                        cursor: 'pointer',
                        fontSize: 'clamp(16px, 4vw, 18px)',
                        padding: '8px',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#efeff1';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#adadb8';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="custom-scrollbar" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(6px, 2vw, 8px)',
                    maxHeight: 'min(60vh, 400px)',
                    overflowY: 'auto'
                  }}>
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: '#2f2f35',
                          borderRadius: '14px',
                          gap: '12px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a42'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2f2f35'}
                      >
                        <img
                          src={participant.avatar || `https://ui-avatars.com/api/?name=${participant.name}&background=9333ea&color=fff`}
                          alt={participant.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(3, 150, 156, 0.3)'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#efeff1',
                            marginBottom: '4px'
                          }}>
                            {participant.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: participant.status === 'active' ? '#10b981' : '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              backgroundColor: participant.status === 'active' ? '#10b981' : '#6b7280',
                              borderRadius: '50%',
                              display: 'inline-block'
                            }}></span>
                            {participant.status === 'active' ? 'Watching' : 'Idle'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </>
              )}
            </div>

            {/* Send Gift Button - Only visible for giftable ceremonies when there's only one event */}
            {isGiftableEvent && events.length === 1 && (
              <div style={{
                padding: '8px 0',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => openGiftModal(mainEvent)}
                  className="gift-btn-main"
                  style={{
                    background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 28px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(3, 150, 156, 0.3)',
                    minWidth: '130px',
                    minHeight: '90px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(3, 150, 156, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 150, 156, 0.3)';
                  }}
                >
                  <i className="bi bi-gift-fill" style={{ fontSize: '28px' }}></i>
                  <span>Send Gift</span>
                </button>
              </div>
            )}

            {/* Stream Info Section (includes mini-players) */}
            <div className="stream-info-section" style={{
              backgroundColor: '#18181b',
              padding: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              overflowY: isSwapping ? 'visible' : 'auto',
              overflow: isSwapping ? 'visible' : undefined,
              flex: 1,
              position: 'relative'
            }}>
              {/* Mini Players Container */}
              {events.length > 1 && (
                <div className="mini-players-container" style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '16px',
                  marginBottom: '20px',
                  overflowX: isSwapping ? 'visible' : 'auto',
                  overflow: isSwapping ? 'visible' : undefined,
                  paddingBottom: '12px',
                  position: 'relative'
                }}>
                  {events.map((event, idx) => {
                    if (idx === mainEventIndex) return null;
                    const miniState = playbackState[event.id] || { isPlaying: false, isMuted: true, progress: 0, volume: 0 };
                    const isMiniEventGiftable = isEventGiftable(event);

                    return (
                      <div
                        key={event.id}
                        style={{
                          flex: '0 0 auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          gap: '8px'
                        }}
                      >
                        {/* Mini Player Card */}
                        <div
                          onClick={() => !isSwapping && switchToMainEvent(idx)}
                          className={isSwapping && swappingToIndex === idx ? 'swapping-mini-to-main' : ''}
                          style={{
                            width: '300px',
                            height: '170px',
                            backgroundColor: '#000',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            cursor: isSwapping ? 'default' : 'pointer',
                            border: '2px solid rgba(3, 150, 156, 0.3)',
                            transition: isSwapping ? 'none' : 'all 0.3s',
                            position: 'relative',
                            pointerEvents: isSwapping ? 'none' : 'auto',
                            zIndex: isSwapping && swappingToIndex === idx ? 1000 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!isSwapping) {
                              e.currentTarget.style.border = '2px solid rgba(3, 150, 156, 0.8)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSwapping) {
                              e.currentTarget.style.border = '2px solid rgba(3, 150, 156, 0.3)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%'
                          }}>
                            <video
                              key={event.id}
                              ref={(el) => {
                                if (el) {
                                  videoRefs.current[event.id] = el;
                                  // Initialize WHEP for mini-player if URL is available
                                  if (event.whepUrl) {
                                    const existing = whepInstancesRef.current[event.id];
                                    if (existing) existing.destroy();
                                    const whepClient = new WHEPClient(event.whepUrl, el);
                                    whepInstancesRef.current[event.id] = whepClient;
                                  }
                                } else {
                                  // Clean up WHEP instance and ref when element unmounts
                                  const whep = whepInstancesRef.current[event.id];
                                  if (whep) {
                                    whep.destroy();
                                    whepInstancesRef.current[event.id] = null;
                                  }
                                  delete videoRefs.current[event.id];
                                }
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              muted={true}
                              loop
                            >
                              {!event.whepUrl && <source src={event.videoSrc} type="video/mp4" />}
                            </video>

                            {/* Overlay */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-end',
                              padding: '8px'
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#fff',
                                marginBottom: '2px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}>{event.photographer}</div>
                              <div style={{
                                fontSize: '10px',
                                color: '#adadb8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i className="bi bi-eye-fill"></i>
                                {event.viewers.toLocaleString()}
                              </div>
                            </div>

                            {/* Live Badge */}
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: '#eb0400',
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              LIVE
                            </div>

                            {/* Muted indicator */}
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: '#fff',
                              padding: '4px 6px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <i className="bi bi-volume-mute-fill"></i>
                            </div>
                          </div>
                        </div>

                        {/* Send Gift Button for Mini Player - Only for giftable events */}
                        {isMiniEventGiftable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openGiftModal(event);
                            }}
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '8px 16px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 10px rgba(3, 150, 156, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 150, 156, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 10px rgba(3, 150, 156, 0.3)';
                            }}
                          >
                            <i className="bi bi-gift-fill" style={{ fontSize: '14px' }}></i>
                            Send Gift
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Main Event Send Gift Button - Right side, extended full height */}
                  {isGiftableEvent && (
                    <div style={{
                      flex: '1 1 auto',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => openGiftModal(mainEvent)}
                        style={{
                          background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px 28px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(3, 150, 156, 0.3)',
                          minWidth: '130px',
                          alignSelf: 'stretch'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(3, 150, 156, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 150, 156, 0.3)';
                        }}
                      >
                        <i className="bi bi-gift-fill" style={{ fontSize: '28px' }}></i>
                        <span>Send Gift</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Streaming Photographer + Buttons.
                  Note: the photographer eyebrow + avatar + name are hidden via
                  CSS (.ls-org-row) since the Cinema Hero already shows them.
                  The action buttons (Rate / Add Event / Leave) stay visible. */}
              <div className="ls-org-row" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2vw, 10px)',
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600, flexShrink: 0 }}>Streaming Photographer</span>
                {mainEvent.photographerAvatar ? (
                  <img
                    src={mainEvent.photographerAvatar}
                    alt="Photographer"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #03969c',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '2px solid #03969c',
                    flexShrink: 0,
                    backgroundColor: '#2d2d35',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#adadb8',
                    fontSize: 13,
                  }}>
                    <i className="bi bi-person-fill" />
                  </div>
                )}
                <span className="photographer-name" style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 600, color: '#efeff1' }}>{mainEvent.photographer}</span>

                {/* Action Buttons — pushed right */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 2vw, 10px)',
                  marginLeft: 'auto',
                  flexWrap: 'wrap'
                }}>
                  <button
                    className="stream-action-btn"
                    onClick={() => { if (!userHasRated) setShowRatingModal(true); }}
                    disabled={userHasRated}
                    style={{
                      backgroundColor: userHasRated ? '#052047' : '#083A85',
                      color: '#fff',
                      fontWeight: '600',
                      padding: '10px 24px',
                      borderRadius: '16px',
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      border: userHasRated ? '1px solid #0a4da3' : 'none',
                      cursor: userHasRated ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '40px',
                      whiteSpace: 'nowrap',
                      opacity: userHasRated ? 0.85 : 1
                    }}
                    onMouseEnter={(e) => { if (!userHasRated) e.currentTarget.style.backgroundColor = '#062d6b'; }}
                    onMouseLeave={(e) => { if (!userHasRated) e.currentTarget.style.backgroundColor = '#083A85'; }}
                  >
                    <i className={userHasRated ? "bi bi-check-circle-fill" : "bi bi-star-fill"} style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}></i>
                    {userHasRated ? 'Rated' : 'Rate this Live'}
                  </button>

                  {/* Add Event button removed per design requirements.
                      The state (showAddEventModal) and modal JSX below are
                      kept so existing references compile, but the button
                      that triggered it no longer renders. */}

                  {/* Leave Stream Button — ghost by default, deep red on hover.
                      The .ls-leave-btn class carries the red-on-hover styles
                      (with !important) so they beat the generic
                      .stream-action-btn:hover brand-blue rule. */}
                  <button
                    className="stream-action-btn ls-leave-btn"
                    style={{
                      fontWeight: '600',
                      padding: '10px 24px',
                      borderRadius: '16px',
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '40px',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={handleLeaveStream}
                  >
                    <i className="bi bi-box-arrow-left" style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}></i>
                    Leave Stream
                  </button>
                </div>
              </div>

              {/* Stream Title */}
              <h2 className="stream-title" style={{
                fontSize: 'clamp(15px, 4vw, 18px)',
                fontWeight: '600',
                color: '#efeff1',
                margin: '0 0 12px 0',
                lineHeight: '1.4'
              }}>{mainEvent.title}</h2>

              {/* Stats Row — pulled inline with the action buttons row above
                  via CSS (.ls-stats-row class). Stats float on the left, the
                  action buttons stay on the right of the same visual line. */}
              <div className="ls-stats-row" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 3vw, 16px)',
                flexWrap: 'wrap'
              }}>
                <div className="stat-item" style={{
                  fontSize: 'clamp(11px, 2.8vw, 13px)',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="bi bi-clock" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}></i>
                  {mainEvent.startTime}
                </div>
                <div className="stat-item" style={{
                  fontSize: 'clamp(11px, 2.8vw, 13px)',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="bi bi-calendar3" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}></i>
                  {currentTime}
                </div>
                <div className="stat-item desktop-only-stat" style={{
                  fontSize: 'clamp(11px, 2.8vw, 13px)',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap'
                }}>
                  <span>Stream ID:</span>
                  <span style={{ color: '#efeff1', fontWeight: '600' }}>{mainEvent.streamId}</span>
                  <button
                    style={{
                      color: isCopied ? '#03969c' : '#adadb8',
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'clamp(13px, 3vw, 14px)',
                      transition: 'color 0.2s',
                      minWidth: '32px',
                      minHeight: '32px',
                      justifyContent: 'center'
                    }}
                    title={isCopied ? 'Copied!' : 'Copy stream ID'}
                    onClick={handleCopyStreamId}
                    onMouseEnter={(e) => {
                      if (!isCopied) e.currentTarget.style.color = '#efeff1';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCopied) e.currentTarget.style.color = '#adadb8';
                    }}
                  >
                    <i className={isCopied ? "bi bi-clipboard-check-fill" : "bi bi-clipboard"}></i>
                  </button>
                  {isCopied && (
                    <span style={{
                      color: '#03969c',
                      fontSize: 'clamp(11px, 2.5vw, 12px)',
                      fontWeight: '600',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Live Chat */}
          <div className={`chat-section ${isChatOpen ? 'chat-open' : ''}`} style={{
            width: '340px',
            backgroundColor: '#1f1f23',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#18181b',
              position: 'relative'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#efeff1',
                fontSize: '14px',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-chat-dots-fill"></i>
                Live Chat
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: 'rgba(3, 150, 156, 0.2)',
                  color: '#03969c',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>{mainEvent.messages.length}</span>
                {/* Mobile Close Button */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="mobile-chat-close"
                  style={{
                    display: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: '#adadb8',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '18px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#efeff1'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#adadb8'}
                >
                  <i className="bi bi-chevron-down"></i>
                </button>
              </h3>
            </div>

            {/* Messages List */}
            <div ref={chatContainerRef} className="custom-scrollbar" style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Filter out pre-event "wish" messages — those were sent while
                  the event was still upcoming and are meant as private notes
                  to the host, not for the live chat. We compare each
                  message's createdAt against the event's scheduled start,
                  hiding anything older. Optimistic local messages (no
                  createdAt) and messages from the user themselves always show. */}
              {(() => {
                // Resolve the event's go-live reference time. Prefer
                // eventStartTime, fall back to eventDate. If neither is
                // available, no filtering is applied.
                const startRef = mainEvent.eventStartTime || mainEvent.eventDate;
                const goLiveTime = startRef ? new Date(startRef).getTime() : 0;

                const visibleMessages = mainEvent.messages.filter((m) => {
                  // Keep optimistic local messages (no createdAt yet) and
                  // anything sent without a known timestamp.
                  if (!m.createdAt) return true;
                  if (!goLiveTime) return true;
                  const sentAt = new Date(m.createdAt).getTime();
                  if (Number.isNaN(sentAt)) return true;
                  // Hide messages older than the event's scheduled start
                  return sentAt >= goLiveTime;
                });

                return (
                  <>
                    {/* Empty-state — when no public chat messages yet */}
                    {visibleMessages.length === 0 && (
                      <div className="ls-chat-empty" role="status" aria-live="polite">
                        <div className="ls-chat-empty-orb" aria-hidden="true">
                          <span className="ls-chat-empty-orb-ring" />
                          <span className="ls-chat-empty-orb-ring ls-chat-empty-orb-ring--2" />
                          <i className="bi bi-chat-square-heart-fill" />
                        </div>
                        <h4 className="ls-chat-empty-title">No messages yet</h4>
                        <p className="ls-chat-empty-sub">
                          Be the first to share a moment with the room.
                        </p>
                        <div className="ls-chat-empty-bubbles" aria-hidden="true">
                          <span /><span /><span />
                        </div>
                      </div>
                    )}
                    {visibleMessages.map((message) => (
                <div key={message.id} style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '12px',
                  transition: 'background 0.2s',
                  animation: 'slideIn 0.3s ease-out',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <img
                    src={message.avatar || DEFAULT_USER_AVATAR}
                    alt={message.sender}
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_USER_AVATAR; }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#efeff1'
                      }}>{message.sender}</span>
                      <span style={{
                        fontSize: '11px',
                        color: '#adadb8'
                      }}>{message.time}</span>
                    </div>
                    {editingMessageId === message.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEditedMessage(message.id);
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditingMessageText("");
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(3, 150, 156, 0.5)',
                            borderRadius: '10px',
                            color: '#efeff1',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditedMessage(message.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#03969c',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingMessageText("");
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#efeff1',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {message.videoUrl ? (
                          <div style={{ marginTop: '4px' }}>
                            <video
                              src={message.videoUrl}
                              controls
                              style={{
                                width: '100%',
                                maxWidth: '250px',
                                borderRadius: '8px',
                                backgroundColor: '#000'
                              }}
                            />
                            <p style={{
                              fontSize: '12px',
                              color: '#03969c',
                              marginTop: '4px',
                              fontStyle: 'italic'
                            }}>
                              Video Message
                            </p>
                          </div>
                        ) : (
                          <p style={{
                            fontSize: '13px',
                            color: '#adadb8',
                            lineHeight: '1.5',
                            margin: 0,
                            wordWrap: 'break-word'
                          }}>
                            {message.text}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Three-dot menu button */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMessageMenu(openMessageMenu === message.id ? null : message.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#adadb8',
                        cursor: 'pointer',
                        padding: '4px',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#efeff1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#adadb8';
                      }}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>

                    {/* Dropdown menu */}
                    {openMessageMenu === message.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          backgroundColor: '#1f1f23',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
                          minWidth: '150px',
                          zIndex: 1000,
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {message.sender === "You" ? (
                          <>
                            <button
                              onClick={() => handleEditMessage(message.id, message.text)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#efeff1',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(3, 150, 156, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-pencil"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-trash"></i>
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleReplyToMessage(message.id, message.sender, message.text)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#efeff1',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(3, 150, 156, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-reply-fill"></i>
                              Reply
                            </button>
                            <button
                              onClick={() => handleBlockUser(message.sender, message.senderId)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-slash-circle"></i>
                              Block User
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
                  </>
                );
              })()}
            </div>

            {/* Chat Input */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#18181b'
            }}>
              {/* Reply Preview */}
              {replyingTo && (
                <div style={{
                  backgroundColor: 'rgba(3, 150, 156, 0.1)',
                  border: '1px solid rgba(3, 150, 156, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#03969c',
                      fontWeight: '600',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="bi bi-reply-fill"></i>
                      Replying to {replyingTo.sender}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#adadb8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {replyingTo.text}
                    </div>
                  </div>
                  <button
                    onClick={handleCancelReply}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#adadb8',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '10px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#efeff1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#adadb8';
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}

              {canInteract ? (
                <div className="ls-chat-input-row" style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#2f2f35',
                  borderRadius: '16px',
                  padding: '8px 12px',
                  gap: '8px'
                }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={replyingTo ? `Reply to @${replyingTo.sender}...` : "Send a message..."}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      color: '#efeff1'
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    style={{
                      color: newMessage.trim() ? '#0a4da3' : '#adadb8',
                      background: 'transparent',
                      border: 'none',
                      cursor: newMessage.trim() ? 'pointer' : 'default',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '18px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (newMessage.trim()) e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    disabled={!newMessage.trim()}
                  >
                    <i className="bi bi-send-fill"></i>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setViewerInfoError(''); setShowViewerInfoModal(true); }}
                  style={{
                    width: '100%',
                    backgroundColor: '#2f2f35',
                    border: '1px solid #4a5568',
                    borderRadius: '16px',
                    padding: '12px',
                    color: '#a0aec0',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Join to chat
                </button>
              )}

              {/* Send Video Message Button — restyled to brand-blue gradient
                  via the .ls-video-msg-cta class (overrides inline green). */}
              <button
                onClick={() => canInteract ? setShowVideoMessageRecorder(true) : requireInteraction(() => {})}
                className="ls-video-msg-cta"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#16a34a',
                  border: '2px solid #22c55e',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <i className="bi bi-camera-video-fill" style={{ fontSize: '16px' }}></i>
                Send 1 Min Video Message
              </button>

              <p style={{
                fontSize: '11px',
                color: '#adadb8',
                margin: '8px 0 0 0',
                textAlign: 'center'
              }}>
                Chat with other viewers watching the stream
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event modal removed per design requirements.
          The showAddEventModal state and related refs remain in the file so
          unrelated references (e.g. global modal-open detection in escape
          handlers) keep compiling, but the modal itself never renders. */}

      {/* ═══════════════════════════════════════════════════════════════════
          Standalone DonationPromptModal — pops over the gift modal AFTER
          the user clicks "Send Gift". Handles both the skip path (no
          donation) and the add path (donation amount), then triggers
          handleSendGift to actually process the gift payment. */}
      <DonationPromptModal
        isOpen={showGiftDonationOverlay}
        currencyCode={mainEvent?.streamFeeCurrencyAbbreviation || 'RWF'}
        paymentAmount={parseInt(giftAmount) || 0}
        onSkip={() => {
          setShowGiftDonationOverlay(false);
          setDonationAmount('');
          // Pass 0 explicitly so we don't depend on async state flush
          handleSendGift(0);
        }}
        onDonate={(amt) => {
          setShowGiftDonationOverlay(false);
          setDonationAmount(String(amt));
          handleSendGift(amt);
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          AppreciationModal — celebratory overlay shown after a gift OR a
          donation payment completes. Same component, different theme based
          on `type`. When a viewer gives BOTH (gift + donation in one flow),
          we show the gift appreciation first, then the donation one. */}
      <AppreciationModal
        isOpen={appreciation.open}
        type={appreciation.type}
        amount={appreciation.amount}
        currencyCode={appreciation.currency}
        recipientName={appreciation.recipient}
        onClose={() => setAppreciation((prev) => ({ ...prev, open: false }))}
      />

      {/* Leave Stream Confirmation Modal */}
      {showLeaveConfirmModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2001, backdropFilter: 'blur(6px)', padding: '16px',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLeaveConfirmModal(false); }}
        >
          <div
            style={{
              background: '#18181b',
              borderRadius: '16px',
              padding: '28px 24px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              textAlign: 'center',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(230,18,32,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '1px solid rgba(230,18,32,0.25)' }}>
              <i className="bi bi-box-arrow-left" style={{ fontSize: 22, color: '#ef4444' }}></i>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px', fontFamily: "'Pragati Narrow', sans-serif" }}>
              Leave this stream?
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Are you sure you want to leave <strong style={{ color: '#ffffff' }}>{mainEvent?.title || 'this live stream'}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowLeaveConfirmModal(false)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flex: 1,
                  maxWidth: '140px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              >
                Stay
              </button>
              <button
                onClick={confirmLeaveStream}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: '1.5px solid #ef4444',
                  background: '#e61220',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1,
                  maxWidth: '140px',
                  boxShadow: '0 4px 12px rgba(230,18,32,0.3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e61220'; }}
              >
                <i className="bi bi-box-arrow-left"></i>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(6px)',
            padding: '16px',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => {
            // Only close if clicking directly on backdrop
            if (e.target === e.currentTarget) {
              setShowRatingModal(false);
              setRating(0);
              setRatingComment('');
            }
          }}
        >
          <div className="rating-modal" style={{
            background: '#18181b',
            borderRadius: '16px',
            padding: 'clamp(20px, 3vw, 28px)',
            paddingTop: 'clamp(24px, 4vw, 32px)',
            maxWidth: '440px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            margin: 'auto',
            pointerEvents: 'auto'
          }} onMouseDown={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => {
                setShowRatingModal(false);
                setRating(0);
                setRatingComment('');
              }}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 16px)',
                right: 'clamp(12px, 3vw, 16px)',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: 'clamp(16px, 4vw, 18px)',
                padding: '6px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px',
                minHeight: '32px',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#cbd5e1';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Title */}
            <h2 style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: '800',
              color: '#ffffff',
              marginBottom: '4px',
              marginTop: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              lineHeight: '1.2',
              fontFamily: "'Pragati Narrow', sans-serif",
            }}>
              <i className="bi bi-star-fill" style={{ color: '#fbbf24', fontSize: '18px' }}></i>
              Rate this Live Stream
            </h2>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '14px',
              lineHeight: '1.4'
            }}>Share your experience with {mainEvent.photographer}</p>

            {/* Star Rating */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              marginBottom: '14px',
              flexWrap: 'wrap'
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '28px',
                    color: (hoverRating || rating) >= star ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                    transition: 'all 0.2s',
                    transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                    minWidth: '36px',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)'}
                >
                  <i className={(hoverRating || rating) >= star ? "bi bi-star-fill" : "bi bi-star"}></i>
                </button>
              ))}
            </div>

            {/* Rating text */}
            {rating > 0 && (
              <div style={{
                textAlign: 'center',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#fbbf24'
              }}>
                {rating === 1 && '⭐ Poor'}
                {rating === 2 && '⭐⭐ Fair'}
                {rating === 3 && '⭐⭐⭐ Good'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
              </div>
            )}

            {/* Comment Section */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{
                fontSize: 'clamp(12px, 3vw, 13px)',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '6px',
                display: 'block'
              }}>
                Add a comment (optional)
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your thoughts about this live stream..."
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  minHeight: '70px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                fontSize: 'clamp(11px, 2.5vw, 12px)',
                color: 'rgba(255,255,255,0.5)',
                marginTop: '6px',
                textAlign: 'right'
              }}>
                {ratingComment.length}/500
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 'clamp(8px, 2vw, 12px)',
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setRatingComment('');
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '38px',
                  minWidth: '90px',
                  flex: '1',
                  maxWidth: '130px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: ratingSuccess ? '#16a34a' : (rating === 0 || ratingSubmitting) ? '#d1d5db' : 'linear-gradient(135deg, #083A85, #0a4da3)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: (rating === 0 || ratingSubmitting || ratingSuccess) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  minHeight: '38px',
                  minWidth: '100px',
                  flex: '1',
                  maxWidth: '150px',
                  boxShadow: (rating === 0 || ratingSubmitting || ratingSuccess) ? 'none' : '0 4px 12px rgba(8,58,133,0.25)',
                }}
                onMouseEnter={(e) => {
                  if (rating > 0 && !ratingSubmitting && !ratingSuccess) e.currentTarget.style.boxShadow = '0 6px 16px rgba(8,58,133,0.35)';
                }}
                onMouseLeave={(e) => {
                  if (rating > 0 && !ratingSubmitting && !ratingSuccess) e.currentTarget.style.boxShadow = '0 4px 12px rgba(8,58,133,0.25)';
                }}
                disabled={rating === 0 || ratingSubmitting || ratingSuccess}
              >
                {ratingSuccess ? (
                  <><i className="bi bi-check-circle-fill" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}></i> Thank you!</>
                ) : ratingSubmitting ? (
                  <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} /> Submitting...</>
                ) : (
                  <><i className="bi bi-send-fill" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}></i> Submit Rating</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Prompt Modal */}
      {showDonationPrompt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowDonationPrompt(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: 'clamp(24px, 5vw, 32px)',
              width: 'clamp(300px, 90vw, 420px)',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '70px',
              height: '70px',
              backgroundColor: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <i className="bi bi-heart-fill" style={{ fontSize: '32px', color: '#ef4444' }}></i>
            </div>
            <h3 style={{
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px',
            }}>
              Would you like to make a donation?
            </h3>
            <p style={{
              fontSize: 'clamp(13px, 3vw, 15px)',
              color: '#6b7280',
              lineHeight: '1.6',
              marginBottom: '28px',
            }}>
              Your contribution helps support families in need, medical bills, school requirements, and food for children.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}>
              <button
                onClick={handleDonationPromptNo}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                No, thanks
              </button>
              <button
                onClick={handleDonationPromptYes}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.4)';
                }}
              >
                Yes, donate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(8,58,133,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(8px)',
            padding: '16px',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              resetGiftModal();
            }
          }}
        >
          <div className="gift-modal" style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: 'clamp(16px, 4vw, 24px)',
            paddingTop: 'clamp(36px, 7vw, 44px)',
            maxWidth: '380px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
            border: '1px solid rgba(8,58,133,0.06)',
            position: 'relative',
            margin: 'auto',
            pointerEvents: 'auto'
          }} onMouseDown={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => resetGiftModal()}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 16px)',
                right: 'clamp(12px, 3vw, 16px)',
                background: 'rgba(8,58,133,0.04)',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: 'clamp(18px, 4vw, 20px)',
                padding: '8px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.04)';
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* ── Decorative gift ribbon corner — distinguishes this from
                  payment modals at first glance. Diagonal "GIFT" banner in
                  the top-left with sparkle accents floating on the page. */}
            <span className="gift-ribbon-corner" aria-hidden="true">
              <span className="gift-ribbon-text">GIFT</span>
            </span>
            <span className="gift-modal-sparkle gift-modal-sparkle--1" aria-hidden="true">✦</span>
            <span className="gift-modal-sparkle gift-modal-sparkle--2" aria-hidden="true">✦</span>
            <span className="gift-modal-sparkle gift-modal-sparkle--3" aria-hidden="true">✧</span>

            {/* ── STEP: Form ── */}
            {giftStep === 'form' && (<>
            {/* Eyebrow pill — gift-themed gold badge */}
            <div className="gift-modal-eyebrow">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
              SEND A GIFT
            </div>
            <h2 className="gift-modal-title">
              Show your appreciation
            </h2>
            <p className="gift-modal-sub">
              Send a gift to <strong>{giftTargetEvent?.photographer || mainEvent.photographer}</strong>
            </p>

            {/* Donation Section — REMOVED from inline. Donation is now
                surfaced via the standalone DonationPromptModal that pops up
                AFTER the user clicks "Send Gift" (see overlay below). The
                false-gate keeps the JSX block harmless if any legacy code
                still references its variables. */}
            {false && (
            <div className={`gift-modal-donation ${includeDonation ? 'is-active' : ''}`} style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              transition: 'all 0.2s',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: includeDonation ? '10px' : 0,
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }} onClick={() => { setIncludeDonation(!includeDonation); if (includeDonation) setDonationAmount(''); }}>
                  <i className="bi bi-heart-fill gift-modal-donation-icon"></i>
                  Support a Cause
                </label>
                <button
                  onClick={() => { setIncludeDonation(!includeDonation); if (includeDonation) setDonationAmount(''); }}
                  className={`gift-modal-donation-toggle ${!includeDonation ? 'is-off' : ''}`}
                  style={{
                    padding: '3px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.2s',
                  }}
                >
                  {includeDonation ? 'Added' : 'Add'}
                </button>
              </div>
            {includeDonation && (
              <>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Amount ({mainEvent?.streamFeeCurrencyAbbreviation || 'RWF'})
                </label>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter donation amount"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid',
                    borderRadius: '10px',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginTop: '8px',
                }}>
                  {['10000', '20000', '50000', '100000'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`gift-tier-btn ${donationAmount === amt ? 'is-selected' : ''}`}
                      style={{
                        flex: '1 1 calc(25% - 6px)',
                        minWidth: '60px',
                        padding: '7px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {parseInt(amt).toLocaleString()}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', marginBottom: 0, lineHeight: 1.4 }}>
                  Supports families, medical bills, and school needs.
                </p>
              </>
            )}
            </div>
            )}{/* end of disabled inline donation section */}

            {/* Gift Amount Panel — wraps the input + tier buttons in a single
                brand-blue tinted card, matching the XentriPayModal Amount
                Panel design language (gradient bg + left accent stripe). */}
            <div className="gift-modal-amount-panel">
              <span className="gift-modal-amount-stripe" aria-hidden="true" />
              <label className="gift-modal-amount-label">
                Gift Amount ({mainEvent?.streamFeeCurrencyAbbreviation || 'RWF'})
              </label>
              <input
                type="number"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                placeholder="Enter amount"
                className="gift-modal-amount-input"
              />
              <div className="gift-modal-tiers">
                {['10000', '20000', '50000', '100000'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setGiftAmount(amount)}
                    className={`gift-tier-btn ${giftAmount === amount ? 'is-selected' : ''}`}
                    type="button"
                  >
                    {parseInt(amount).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection — 3-column grid mirrors XentriPayModal */}
            <div style={{ marginBottom: '14px' }}>
              <label className="gift-modal-amount-label" style={{ marginBottom: '8px' }}>
                Select Payment Method
              </label>
              <div className="gift-modal-payment-grid">
                {paymentMethods.map((method) => {
                  const isSelected = selectedPaymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`gift-modal-payment-tile ${isSelected ? 'is-selected' : ''}`}
                    >
                      {isSelected && (
                        <span className="gift-modal-payment-tile-check" aria-hidden="true">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                      <span className="gift-modal-payment-tile-logo">
                        <img src={method.image} alt={method.name} />
                      </span>
                      <span className="gift-modal-payment-tile-label">
                        {method.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Details Input - MTN/Airtel Mobile Money */}
            {/* Amount reminder — shown for all methods when no amount is entered */}
            {selectedPaymentMethod && (!giftAmount || parseInt(giftAmount) <= 0) && (
              <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: 'rgba(8,58,133,0.06)', border: '1.5px solid rgba(8,58,133,0.2)', borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', color: '#083A85', margin: 0 }}>
                  <i className="bi bi-info-circle-fill" style={{ marginRight: 8 }}></i>
                  Please select or enter a gift amount above to continue.
                </p>
              </div>
            )}

            {(selectedPaymentMethod === 'mtn' || selectedPaymentMethod === 'airtel') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Your Phone Number *</label>
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={selectedPaymentMethod === 'mtn' ? "e.g., 0781234567" : "e.g., 0721234567"}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#f9fafb',
                    border: '1.5px solid rgba(8,58,133,0.15)',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.backgroundColor = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.15)'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                />
                <p style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginTop: '6px',
                  marginBottom: 0
                }}>You will receive a payment confirmation SMS on this number</p>
              </div>
            )}

            {/* Card redirect info */}
            {selectedPaymentMethod === 'card' && giftAmount && parseInt(giftAmount) > 0 && (
              <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: 'rgba(8,58,133,0.06)', border: '1.5px solid rgba(8,58,133,0.2)', borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', color: '#083A85', margin: 0 }}>
                  <i className="bi bi-info-circle-fill" style={{ marginRight: 8 }}></i>
                  Click &quot;Proceed to Pay&quot; below to open the secure card payment page.
                </p>
              </div>
            )}

            {/* Gift Message */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>Add a Message (Optional)</label>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Write a congratulatory message..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#f9fafb',
                  border: '1.5px solid rgba(8,58,133,0.15)',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.backgroundColor = '#fff'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.15)'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              />
            </div>

            {/* Gift error message */}
            {giftError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '13px',
              }}>
                {giftError}
              </div>
            )}

            {/* Sub-total breakdown when donation is included */}
            {donationAmount && parseInt(donationAmount) > 0 && giftAmount && parseInt(giftAmount) > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1.5px solid rgba(8,58,133,0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Gift</span>
                  <span style={{ color: '#0f172a', fontWeight: '500' }}>{(mainEvent?.streamFeeCurrencyAbbreviation || 'RWF')} {parseInt(giftAmount).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Donation</span>
                  <span style={{ color: '#d97706', fontWeight: '500' }}>{(mainEvent?.streamFeeCurrencyAbbreviation || 'RWF')} {parseInt(donationAmount).toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1.5px solid rgba(8,58,133,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                  <span style={{ color: '#0f172a', fontWeight: '700' }}>Total</span>
                  <span style={{ color: '#083A85', fontWeight: '700' }}>{(mainEvent?.streamFeeCurrencyAbbreviation || 'RWF')} {(parseInt(giftAmount) + parseInt(donationAmount)).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Send Gift Button — opens the standalone DonationPromptModal
                first so the viewer can optionally add a donation. The modal
                calls back into handleSendGift with the chosen donation
                amount (0 if skipped). */}
            <button
              onClick={() => {
                if (!canInteract) { requireInteraction(() => {}); return; }
                if (!giftAmount || parseInt(giftAmount) <= 0) {
                  alert('Please enter a gift amount');
                  return;
                }
                // Reset any previous donation selection then open the prompt
                setDonationAmount('');
                setShowGiftDonationOverlay(true);
              }}
              disabled={!isPaymentDetailsValid() || giftLoading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: (!isPaymentDetailsValid() || giftLoading)
                  ? '#e5e7eb'
                  : '#083A85',
                border: (!isPaymentDetailsValid() || giftLoading) ? 'none' : '1px solid #3b82f6',
                borderRadius: '12px',
                color: (!isPaymentDetailsValid() || giftLoading) ? '#9ca3af' : '#fff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: (!isPaymentDetailsValid() || giftLoading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                if (isPaymentDetailsValid() && !giftLoading) {
                  e.currentTarget.style.backgroundColor = '#062d6b';
                }
              }}
              onMouseLeave={(e) => {
                if (isPaymentDetailsValid() && !giftLoading) {
                  e.currentTarget.style.backgroundColor = '#083A85';
                }
              }}
            >
              <i className={selectedPaymentMethod === 'card' ? 'bi bi-credit-card-fill' : 'bi bi-gift-fill'} style={{ fontSize: '18px' }}></i>
              {giftLoading ? 'Processing...' : (() => {
                const currency = mainEvent?.streamFeeCurrencyAbbreviation || 'RWF';
                const gift = parseInt(giftAmount) || 0;
                const donation = parseInt(donationAmount) || 0;
                const total = gift + donation;
                if (selectedPaymentMethod === 'card') {
                  return total > 0 ? `Proceed to Pay (${currency} ${total.toLocaleString()})` : 'Proceed to Pay';
                }
                return total > 0 ? `Send Gift (${currency} ${total.toLocaleString()})` : 'Send Gift';
              })()}
            </button>
            </>)}

            {/* ── STEP: Processing ── */}
            {giftStep === 'processing' && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  margin: '0 auto 20px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#083A85',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#083A85', marginBottom: '10px' }}>
                  {selectedPaymentMethod === 'card' ? 'Complete Payment' : 'Payment Initiated'}
                </h3>
                {selectedPaymentMethod === 'card' ? (
                  <>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '14px', lineHeight: '1.5' }}>
                      A secure payment page has been opened in a new tab. Please complete the payment there.
                    </p>
                    {giftPaymentUrl && (
                      <a href={giftPaymentUrl} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-block', padding: '10px 20px', backgroundColor: '#083A85',
                        color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500, marginBottom: '14px',
                      }}>Open Payment Page</a>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '14px', lineHeight: '1.5' }}>
                    A payment prompt has been sent to your phone. Please check and confirm.
                  </p>
                )}
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Waiting for confirmation...</p>
                <button onClick={resetGiftModal} style={{
                  marginTop: '16px', padding: '10px 24px', backgroundColor: 'transparent',
                  border: '1px solid #e5e7eb', borderRadius: '10px', color: '#6b7280', fontSize: '14px', cursor: 'pointer',
                }}>Cancel</button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* ── STEP: Success ── */}
            {giftStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{
                  width: '70px', height: '70px', margin: '0 auto 20px',
                  backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A', marginBottom: '8px' }}>Payment Successful!</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Your gift has been sent successfully.
                </p>
              </div>
            )}

            {/* ── STEP: Failed ── */}
            {giftStep === 'failed' && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{
                  width: '70px', height: '70px', margin: '0 auto 20px',
                  backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444', marginBottom: '8px' }}>Payment Failed</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                  {giftError || 'The payment could not be completed. Please try again.'}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => { setGiftStep('form'); setGiftError(null); }} style={{
                    padding: '12px 24px', background: '#083A85',
                    border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                  }}>Try Again</button>
                  <button onClick={resetGiftModal} style={{
                    padding: '12px 24px', backgroundColor: '#f3f4f6', border: 'none',
                    borderRadius: '12px', color: '#6b7280', fontSize: '15px', fontWeight: 500, cursor: 'pointer',
                  }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Floating Buttons — Portal to document.body to escape parent transforms/overflow */}
      {!isChatOpen && typeof document !== 'undefined' && createPortal(
        <>
          <button
            onClick={() => canInteract ? setShowVideoMessageRecorder(true) : requireInteraction(() => {})}
            aria-label="Send video message"
            className="mobile-only-float floating-action-btn floating-action-top"
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: '2px solid #22c55e',
              boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
            }}
          >
            <i className="bi bi-camera-video-fill" style={{ fontSize: 18 }}></i>
          </button>
          <button
            onClick={() => setIsChatOpen(true)}
            aria-label="Open chat"
            className="mobile-only-float floating-action-btn floating-action-bottom"
            style={{
              background: 'linear-gradient(135deg, #083A85 0%, #0a4da3 100%)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(8, 58, 133, 0.4)',
            }}
          >
            <i className="bi bi-chat-dots-fill" style={{ fontSize: 20 }}></i>
            {mainEvent?.messages?.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -5,
                right: -5,
                background: '#ef4444',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 12,
                minWidth: 24,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}>{mainEvent.messages.length}</span>
            )}
          </button>
        </>,
        document.body
      )}

      {/* Video Message Recorder */}
      {showVideoMessageRecorder && (
        <VideoMessageRecorder
          onClose={() => setShowVideoMessageRecorder(false)}
          onSend={handleSendVideoMessage}
        />
      )}


      {/* ── VIEWER AUTH MODAL ── */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
          <div className="auth-stream-modal" style={{ width: '100%', maxWidth: 520, background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(3,150,156,0.15)', position: 'relative', margin: 'auto' }}>

            {/* Close button */}
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #03969c, #027a7f)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className={authStep === 'otp' ? 'bi bi-shield-check' : 'bi bi-chat-dots-fill'} style={{ fontSize: 22, color: '#fff' }}></i>
              </div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                {authStep === 'otp' ? 'Verify Your Email' : 'Sign in to Interact'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                {authStep === 'otp' ? 'Enter the code sent to your email' : 'Log in to send messages, gifts, and more'}
              </p>
            </div>

            {/* Tab switcher */}
            {authStep !== 'otp' && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
                {(['login', 'signup'] as const).map(tab => (
                  <button key={tab} onClick={() => { setAuthStep(tab); setAuthError(''); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', background: authStep === tab ? 'linear-gradient(135deg, #03969c, #027a7f)' : 'transparent', color: authStep === tab ? '#fff' : '#6b7280' }}>
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

            {/* LOGIN FORM */}
            {authStep === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && handleAuthLogin()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleAuthLogin()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleAuthLogin} disabled={authLoading || googleLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in…</> : <><i className="bi bi-box-arrow-in-right"></i> Log In</>}
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ color: '#6b7280', fontSize: 12 }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} loading={googleLoading || authLoading} label="Continue with Google" />
                  </>
                )}
              </div>
            )}

            {/* SIGNUP FORM */}
            {authStep === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>First Name</label>
                    <input type="text" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} placeholder="John" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Last Name</label>
                    <input type="text" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} placeholder="Doe" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="your@email.com" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone</label>
                  <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value.replace(/[^0-9+]/g, ''))} placeholder="+250 700 000 000" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                  <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Min. 8 characters" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleAuthSignup} disabled={authLoading || googleLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating account…</> : <><i className="bi bi-person-plus-fill"></i> Create Account</>}
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ color: '#6b7280', fontSize: 12 }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} loading={googleLoading || authLoading} label="Sign up with Google" />
                  </>
                )}
              </div>
            )}

            {/* OTP FORM */}
            {authStep === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'rgba(3,150,156,0.1)', border: '1px solid rgba(3,150,156,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <i className="bi bi-envelope-check-fill" style={{ color: '#03969c', fontSize: 16, flexShrink: 0 }}></i>
                  <span style={{ color: '#a1a1aa', fontSize: 13 }}>A 6-digit code was sent to <strong style={{ color: '#fff' }}>{signupEmail}</strong></span>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Verification Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))} placeholder="000000" onKeyDown={e => e.key === 'Enter' && handleAuthVerifyOtp()} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '0.35em', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleAuthVerifyOtp} disabled={authLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Verifying…</> : <><i className="bi bi-shield-check"></i> Verify & Continue</>}
                </button>
                <button onClick={() => { setAuthStep('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textAlign: 'center', padding: '4px 0' }}>
                  Already have an account? Log in
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Anonymous viewer registration modal */}
      <ViewerInfoModal
        isOpen={showViewerInfoModal}
        onClose={() => setShowViewerInfoModal(false)}
        onSubmit={handleViewerInfoSubmit}
        loading={viewerInfoLoading}
        error={viewerInfoError}
      />

      {/* Device switch confirmation modal */}
      <DeviceSwitchModal
        isOpen={showDeviceSwitchModal}
        onConfirm={handleDeviceSwitchConfirm}
        onCancel={() => setShowDeviceSwitchModal(false)}
        loading={deviceSwitchLoading}
      />
    </>
  );
};

export default App;
