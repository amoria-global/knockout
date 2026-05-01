'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import ErrorPopup, { type PopupSeverity } from '../../components/ErrorPopup';
import { useSearchParams } from 'next/navigation';
import AmoriaKNavbar from '../../components/navbar';
import { useRouter } from 'next/navigation';
import { getPublicEventById, type PublicEvent, getCurrencies, type Currency as APICurrency } from '@/lib/APIs/public';
import XentriPayModal from '../../components/XentriPayModal';
import { generateGroupAccess, redeemGroupCode } from '@/lib/APIs/streams/route';
import { useAuth } from '../../providers/AuthProvider';
import { login as apiLogin } from '@/lib/APIs/auth/login/route';
import { signup as apiSignup } from '@/lib/APIs/auth/signup/route';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { googleAuth } from '@/lib/APIs/auth/google/route';
import { useGoogleLogin } from '@react-oauth/google';
import ViewerInfoModal, { type ViewerInfoData } from '../../components/ViewerInfoModal';
import DeviceSwitchModal from '../../components/DeviceSwitchModal';
import { registerAnonymousViewer, confirmAnonymousPayment, switchAnonymousDevice, checkAnonymousAccessStatus } from '@/lib/APIs/streams/anonymous-viewer';
import { getDeviceId } from '@/lib/fingerprint';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function JoinPackageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState<number | ''>('');
  const [showPeopleInput, setShowPeopleInput] = useState(false);
  const [peopleInputError, setPeopleInputError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // XentriPay modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currencies, setCurrencies] = useState<APICurrency[]>([]);
  const [pendingDonationAmount, setPendingDonationAmount] = useState(0);

  // Group share code modal state
  const [showGroupCodeModal, setShowGroupCodeModal] = useState(false);
  const [groupShareCode, setGroupShareCode] = useState<string | null>(null);
  const [groupCodeExpiry, setGroupCodeExpiry] = useState<string | null>(null);
  const [groupPeopleCount, setGroupPeopleCount] = useState<number>(0);
  const [groupPaymentRef, setGroupPaymentRef] = useState<string | null>(null);
  // Invite management
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [remainingInvites, setRemainingInvites] = useState<number>(0);

  // Invite code input — auto-fill from URL if shared via group link
  const [inviteCode, setInviteCode] = useState(searchParams.get('inviteToken') || '');
  const [groupRedeemError, setGroupRedeemError] = useState<string | null>(null);

  // Designed error popup state
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

  // Load saved group code from localStorage on mount
  useEffect(() => {
    if (!eventId) return;
    const saved = localStorage.getItem(`groupCode_${eventId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Check if not expired
        if (data.expiry && new Date(data.expiry) > new Date()) {
          setGroupShareCode(data.code);
          setGroupCodeExpiry(data.expiry);
          setGroupPeopleCount(data.people);
          setGroupPaymentRef(data.refid);
          const remaining = data.remainingInvites ?? Math.max(0, (data.people || 0) - 1);
          setRemainingInvites(remaining);
          setInvitedEmails(data.invitedEmails || []);
          // Auto-show invite modal if there are slots remaining
          if (remaining > 0) {
            setShowGroupCodeModal(true);
          }
        } else {
          localStorage.removeItem(`groupCode_${eventId}`);
        }
      } catch { /* ignore parse errors */ }
    }
  }, [eventId]);

  // Viewer auth modal state
  const { isAuthenticated, login: authLogin } = useAuth();
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

  // Anonymous viewer modal state
  const [showViewerInfoModal, setShowViewerInfoModal] = useState(false);
  const [viewerInfoLoading, setViewerInfoLoading] = useState(false);
  const [viewerInfoError, setViewerInfoError] = useState('');
  const [showDeviceSwitchModal, setShowDeviceSwitchModal] = useState(false);
  const [deviceSwitchLoading, setDeviceSwitchLoading] = useState(false);
  const [pendingViewerId, setPendingViewerId] = useState<string | null>(null);
  const [pendingViewerEmail, setPendingViewerEmail] = useState('');
  const [pendingViewerName, setPendingViewerName] = useState('');

  // Inline identity banner state (top of page, shown to unauthenticated users)
  const [bannerName, setBannerName] = useState('');
  const [bannerEmail, setBannerEmail] = useState('');
  const [bannerPhone, setBannerPhone] = useState('');
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [identityConfirmed, setIdentityConfirmed] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setAuthError('');
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!userInfoRes.ok) throw new Error('Failed to fetch Google user info');
        const userInfo = await userInfoRes.json();
        const res = await googleAuth({ email: userInfo.email, firstName: userInfo.given_name || '', lastName: userInfo.family_name || '', customerType: 'Client' });
        if (res.success && res.data?.token) {
          const d = res.data as unknown as Record<string, string>;
          await authLogin({ id: d.id || d.customerId || '', firstName: d.firstName || userInfo.given_name || '', lastName: d.lastName || userInfo.family_name || '', email: d.email || userInfo.email, phone: d.phone || '', customerId: d.customerId || '', customerType: d.customerType || 'Viewer' }, d.token);
          setShowAuthModal(false);
          // Resume flow after auth
          if ((selectedEvent?.price || 0) > 0) { openPaymentFlow(); } else { handleProceed(); }
        } else {
          setAuthError((res.data as unknown as Record<string, string>)?.message || res.error || 'Could not sign in with Google. Please try another method.');
        }
      } catch { setAuthError('Unable to connect to Google. Please check your internet connection.'); } finally { setGoogleLoading(false); }
    },
    onError: () => setAuthError('Google sign-in was cancelled. You can try again or use email instead.'),
  });

  const handleAuthLogin = async () => {
    if (!loginEmail || !loginPassword) { setAuthError('Please enter your email and password.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await apiLogin({ email: loginEmail, password: loginPassword });
      if (res.success && res.data?.token) {
        const d = res.data as unknown as Record<string, string>;
        await authLogin({ id: d.id || d.customerId || '', firstName: d.firstName || '', lastName: d.lastName || '', email: d.email || loginEmail, phone: d.phone || '', customerId: d.customerId || '', customerType: d.customerType || 'Viewer' }, d.token);
        setShowAuthModal(false);
        if ((selectedEvent?.price || 0) > 0) { openPaymentFlow(); } else { handleProceed(); }
      } else { setAuthError((res.data as unknown as Record<string, string>)?.message || res.error || 'Incorrect email or password. Please try again.'); }
    } catch { setAuthError('Unable to connect. Please check your internet connection and try again.'); } finally { setAuthLoading(false); }
  };

  const handleAuthSignup = async () => {
    if (!signupFirstName || !signupLastName || !signupEmail || !signupPassword) { setAuthError('Please fill in all required fields.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await apiSignup({ firstName: signupFirstName, lastName: signupLastName, email: signupEmail, phone: signupPhone, password: signupPassword, customerType: 'Client' });
      if (res.success && res.data) {
        const d = res.data as unknown as Record<string, string>;
        if (d.customerId) {
          setOtpCustomerId(d.customerId || '');
          setAuthStep('otp');
        } else { setAuthError('Could not create your account. Please try again.'); }
      } else { setAuthError((res.data as unknown as Record<string, string>)?.message || res.error || 'Could not create your account. The email may already be registered.'); }
    } catch { setAuthError('Unable to connect. Please check your internet connection and try again.'); } finally { setAuthLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue) { setAuthError('Please enter the verification code sent to your email.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await verifyOtp({ customerId: otpCustomerId, otp: Number(otpValue) });
      if (res.success && res.data?.token) {
        const d = res.data as unknown as Record<string, string>;
        await authLogin({ id: d.id || d.customerId || otpCustomerId, firstName: d.firstName || signupFirstName, lastName: d.lastName || signupLastName, email: d.email || signupEmail, phone: d.phone || signupPhone, customerId: d.customerId || otpCustomerId, customerType: d.customerType || 'Viewer' }, d.token);
        setShowAuthModal(false);
        if ((selectedEvent?.price || 0) > 0) { openPaymentFlow(); } else { handleProceed(); }
      } else { setAuthError((res.data as unknown as Record<string, string>)?.message || res.error || 'The verification code is incorrect or has expired.'); }
    } catch { setAuthError('Unable to verify. Please check your internet connection and try again.'); } finally { setAuthLoading(false); }
  };

  // Listen for session expiry
  useEffect(() => {
    const handleSessionExpired = (e: Event) => {
      e.preventDefault();
      setShowPaymentModal(false);
      setAuthStep('login');
      setAuthError('Your session has expired. Please log in again.');
      setShowAuthModal(true);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch event from API
  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }
    const fetchEvent = async () => {
      try {
        const response = await getPublicEventById(eventId);
        if (response.success && response.data) {
          setSelectedEvent(response.data);
        }
      } catch {
        // silently fail — event stays null
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Auto-redeem group invite code from URL for free events
  // Requires auth since group codes are limited to a set number of viewers
  useEffect(() => {
    if (!selectedEvent || isLoading) return;
    const urlToken = searchParams.get('inviteToken');
    if (!urlToken) return;
    const price = selectedEvent.price || 0;
    if (price > 0) return; // Paid event — let user go through normal flow

    if (!isAuthenticated) {
      // Show login modal — viewer must authenticate to claim a group code slot
      setAuthStep('login');
      setAuthError('');
      setShowAuthModal(true);
      return;
    }

    (async () => {
      setGroupRedeemError(null);
      try {
        const userStr = localStorage.getItem('authUser');
        const userName = userStr ? `${JSON.parse(userStr).firstName || ''} ${JSON.parse(userStr).lastName || ''}`.trim() : 'Viewer';
        const res = await redeemGroupCode(selectedEvent.id, { inviteCode: urlToken, viewerUsername: userName });
        if (res.success && res.data) {
          router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(urlToken)}`);
        } else {
          const msg = res.error || '';
          let title = 'Invite code problem';
          let body = msg || 'Unable to redeem this invite code.';
          let hint: string | undefined;
          if (msg.includes('viewer limit')) {
            title = 'Code is full';
            body = 'This group invite code has already reached its viewer limit.';
            hint = 'Ask the host for a new invite code to join the stream.';
          } else if (msg.includes('expired')) {
            title = 'Code expired';
            body = 'This group invite code is no longer valid.';
            hint = 'Ask the host to generate a new code for you.';
          } else if (msg.includes('Invalid')) {
            title = 'Invalid invite code';
            body = 'We couldn’t find that invite code.';
            hint = 'Double-check the code with the host or paste it again carefully.';
          }
          setGroupRedeemError(body);
          setErrorPopup({
            open: true,
            severity: 'warning',
            title,
            message: body,
            hint,
            primaryAction: { label: 'Got it', icon: 'bi-check2', onClick: closeErrorPopup },
          });
        }
      } catch {
        const body = 'Unable to redeem invite code. Please check your connection and try again.';
        setGroupRedeemError(body);
        setErrorPopup({
          open: true,
          severity: 'error',
          title: 'Connection error',
          message: body,
          primaryAction: { label: 'Got it', icon: 'bi-check2', onClick: closeErrorPopup },
        });
      }
    })();
  }, [selectedEvent, isLoading, searchParams, router, isAuthenticated, closeErrorPopup]);

  // Fetch currencies for XentriPay
  useEffect(() => {
    getCurrencies().then(res => {
      if (res.success && res.data) setCurrencies(res.data);
    }).catch(() => {});
  }, []);

  // Anonymous-viewer access precheck: identity + device must both match.
  // Only run if we already have a stored viewerId (proof of prior identity verification).
  // Fingerprint alone can never grant access — users without a stored viewerId must
  // identify themselves via the banner / ViewerInfoModal.
  useEffect(() => {
    if (!selectedEvent || isLoading || isAuthenticated) return;
    const savedViewerId = localStorage.getItem(`anonymousViewer_${selectedEvent.id}`);
    if (!savedViewerId) return;
    let cancelled = false;
    (async () => {
      try {
        const fingerprint = await getDeviceId();
        const res = await checkAnonymousAccessStatus(selectedEvent.id, fingerprint, savedViewerId);
        if (cancelled) return;
        if (res.success && res.data?.hasAccess) {
          // Only redirect to live-stream if the event is genuinely live now.
          // Otherwise route back to view-event so the user sees the
          // "Spot reserved" / owned-access banners.
          const isLiveNow = (selectedEvent.eventStatus || '').toUpperCase() === 'ONGOING'
            && (selectedEvent as Record<string, unknown>).streamStatus !== 'ended';
          if (isLiveNow) {
            router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`);
          } else {
            router.push(`/user/events/view-event?id=${selectedEvent.id}`);
          }
        }
      } catch {
        // Silent — fall through to normal purchase flow
      }
    })();
    return () => { cancelled = true; };
  }, [selectedEvent, isLoading, isAuthenticated, router]);

  // Calculate group discount from API (dynamic)
  const discountPercentage = selectedEvent?.groupDiscountPercentage || 0;
  const individualFee = selectedEvent?.price || 0;
  const discountedFeePerPerson = individualFee * (1 - discountPercentage / 100);
  const peopleCount = typeof numberOfPeople === 'number' ? numberOfPeople : 0;
  const totalGroupFee = discountedFeePerPerson * peopleCount;
  const totalSavings = (individualFee * peopleCount) - totalGroupFee;

  const packages = [
    {
      id: 'individual',
      name: 'Individual Stream',
      badge: 'Individual',
      badgeColor: '#22D3EE',
      badgeGradient: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)',
      description: 'Stream the event alone on your personal device',
      price: `${individualFee.toLocaleString()} RWF`,
      priceNote: 'One-time access fee',
      features: [
        { text: 'Personal stream access', available: true },
        { text: 'HD quality streaming', available: true },
        { text: 'Watch on any device', available: true },
        { text: 'Instant access after payment', available: true },
        { text: 'Shareable link for others', available: false },
        { text: 'Group discount savings', available: false },
      ],
    },
    {
      id: 'group',
      name: `Group Stream (${discountPercentage}% off)`,
      badge: `Group ${discountPercentage}% off`,
      badgeColor: '#FBBF24',
      badgeGradient: 'linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)',
      description: `Buy stream access for multiple people and save ${discountPercentage}%`,
      price: `Save up to ${discountPercentage}% from discount`,
      priceNote: 'Enter number of people below',
      features: [
        { text: 'Multiple stream links', available: true },
        { text: 'HD quality streaming', available: true },
        { text: 'Watch on any device', available: true },
        { text: 'Instant access after payment', available: true },
        { text: 'Shareable unique links', available: true },
        { text: `${discountPercentage}% group discount`, available: true },
      ],
    },
  ];

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    if (packageId === 'group') {
      setShowPeopleInput(true);
    } else {
      setShowPeopleInput(false);
      // Individual package — skip Continue button, proceed immediately
      setTimeout(() => handleProceed(), 0);
    }
  };

  const handleCancel = () => {
    setSelectedPackage(null);
    setShowPeopleInput(false);
    setNumberOfPeople('');
    setPeopleInputError('');
  };

  // Check if group package input is valid
  const isGroupInputValid = () => {
    return typeof numberOfPeople === 'number' && numberOfPeople >= 2;
  };

  const getPaymentFee = () => {
    const price = selectedEvent?.price || 0;
    if (selectedPackage === 'group' && isGroupInputValid()) {
      const count = typeof numberOfPeople === 'number' ? numberOfPeople : 1;
      return Math.round(price * (1 - discountPercentage / 100) * count);
    }
    return price;
  };

  const openPaymentFlow = () => {
    setPendingDonationAmount(0);
    setShowPaymentModal(true);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !groupShareCode || !selectedEvent?.id) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError('Please enter a valid email address.');
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/proxy/api/remote/public/streams/${selectedEvent.id}/group-access/${groupShareCode}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (data.action === 1) {
        const newEmails = data.data?.authorizedEmails || [...invitedEmails, inviteEmail.trim()];
        const newRemaining = data.data?.remainingInvites ?? remainingInvites - 1;
        setInvitedEmails(newEmails);
        setRemainingInvites(newRemaining);
        setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`);
        setInviteEmail('');
        setTimeout(() => setInviteSuccess(''), 3000);
        // Persist to localStorage so purchaser can return later
        if (selectedEvent?.id) {
          const saved = localStorage.getItem(`groupCode_${selectedEvent.id}`);
          if (saved) {
            try {
              const existing = JSON.parse(saved);
              existing.invitedEmails = newEmails;
              existing.remainingInvites = newRemaining;
              localStorage.setItem(`groupCode_${selectedEvent.id}`, JSON.stringify(existing));
            } catch { /* ignore */ }
          }
        }
      } else {
        setInviteError(data.message || 'Failed to send invitation.');
      }
    } catch {
      setInviteError('Connection error. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleProceed = () => {
    if (!selectedEvent) return;

    // Anonymous viewer: identity must be known before payment.
    if (!isAuthenticated) {
      if (identityConfirmed && pendingViewerId) {
        // Banner already captured identity → skip modal, go straight to payment
        openPaymentFlow();
        return;
      }
      // Fallback — user skipped the banner; open modal to collect name/email/phone
      setViewerInfoError('');
      setShowViewerInfoModal(true);
      return;
    }

    const price = selectedEvent.price || 0;
    const inviteToken = searchParams.get('inviteToken') || '';
    const tokenParam = inviteToken ? `&inviteToken=${encodeURIComponent(inviteToken)}` : '';

    if (price > 0) {
      // Authenticated — go directly to payment
      openPaymentFlow();
    } else {
      // Free event — redirect to join-event
      if (selectedPackage === 'individual') {
        window.location.href = `/user/events/join-event?id=${selectedEvent.id}&package=individual${tokenParam}`;
      } else if (selectedPackage === 'group' && isGroupInputValid()) {
        window.location.href = `/user/events/join-event?id=${selectedEvent.id}&package=group&people=${numberOfPeople}${tokenParam}`;
      }
    }
  };

  // Shared identity-submit logic used by both the top banner and the fallback modal.
  // source='banner' keeps the user on the page after REQUIRES_PAYMENT so they can pick a
  // package before paying. source='modal' goes straight to XentriPay (package already chosen).
  const submitViewerIdentity = async (data: ViewerInfoData, source: 'banner' | 'modal'): Promise<void> => {
    if (!selectedEvent) return;
    const setLoading = source === 'banner' ? setBannerLoading : setViewerInfoLoading;
    const setError = source === 'banner' ? setBannerError : setViewerInfoError;
    setLoading(true);
    setError('');
    // Store viewer details for use in payment success (email for receipts, group access, etc.)
    setPendingViewerEmail(data.email);
    setPendingViewerName(data.name);
    try {
      const fingerprint = await getDeviceId();
      const res = await registerAnonymousViewer(selectedEvent.id, {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        deviceFingerprint: fingerprint,
      });

      if (!res.success) {
        // Backend handles existing-email cases via ACCESS_GRANTED / DEVICE_CONFLICT / REQUIRES_PAYMENT
        // status branches below — any !success here is a real error (network, server, validation).
        setError(res.error || 'Registration failed. Please try again.');
        return;
      }

      const resData = res.data as Record<string, unknown> | undefined;
      const status = resData?.status as string;
      const viewerId = resData?.viewerId as string;

      if (viewerId) {
        setPendingViewerId(viewerId);
        localStorage.setItem(`anonymousViewer_${selectedEvent.id}`, viewerId);
        localStorage.setItem(`anonymousViewerName_${selectedEvent.id}`, data.name);
      }

      if (status === 'ACCESS_GRANTED') {
        // Already paid — go to stream (skip packages entirely)
        setShowViewerInfoModal(false);
        router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`);
      } else if (status === 'DEVICE_CONFLICT') {
        // Active on another device — ask to switch
        setShowViewerInfoModal(false);
        setShowDeviceSwitchModal(true);
      } else {
        // REQUIRES_PAYMENT
        if (source === 'banner') {
          // Identity captured — collapse banner; user now picks package & clicks Reserve
          setIdentityConfirmed(true);
        } else {
          // Modal path — user already picked package, go straight to payment
          setShowViewerInfoModal(false);
          openPaymentFlow();
        }
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Modal wrapper (existing callback signature)
  const handleViewerInfoSubmit = (data: ViewerInfoData) => submitViewerIdentity(data, 'modal');

  // Banner submit handler — validates then delegates
  const handleBannerSubmit = () => {
    const name = bannerName.trim();
    const email = bannerEmail.trim();
    const phone = bannerPhone.trim();
    if (!name) { setBannerError('Name is required'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setBannerError('Please enter a valid email address'); return; }
    if (!phone) { setBannerError('Phone number is required'); return; }
    submitViewerIdentity({ name, email, phone }, 'banner');
  };

  // Device switch confirmation handler
  const handleDeviceSwitchConfirm = async () => {
    if (!selectedEvent || !pendingViewerId) return;
    setDeviceSwitchLoading(true);
    try {
      const fingerprint = await getDeviceId();
      const res = await switchAnonymousDevice(selectedEvent.id, pendingViewerId, fingerprint);
      if (res.success) {
        setShowDeviceSwitchModal(false);
        router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment`);
      } else {
        setShowDeviceSwitchModal(false);
        setViewerInfoError(res.error || 'Could not switch device.');
        setShowViewerInfoModal(true);
      }
    } catch {
      setShowDeviceSwitchModal(false);
      setViewerInfoError('Connection error. Please try again.');
      setShowViewerInfoModal(true);
    } finally {
      setDeviceSwitchLoading(false);
    }
  };

  const handlePaymentSuccess = async (refid: string) => {
    setShowPaymentModal(false);
    if (!selectedEvent) return;

    // Single source of truth for event live-ness — used everywhere below
    // to decide whether the viewer should land on the live-stream player
    // or be sent back to view-event with a "spot reserved" confirmation.
    const isEventCurrentlyLive =
      (selectedEvent.eventStatus || '').toUpperCase() === 'ONGOING'
      && (selectedEvent as Record<string, unknown>).streamStatus !== 'ended';

    // Write per-event purchase proof to localStorage. The view-event page
    // requires this marker (in addition to the backend's hasPurchasedAccess
    // flag) before showing "Access reserved", so a stale backend response
    // can't hand out access to viewers who didn't actually pay.
    try {
      localStorage.setItem(
        `connekyt:purchased_${selectedEvent.id}`,
        JSON.stringify({ refid, at: Date.now(), pkg: selectedPackage || 'individual' })
      );
    } catch { /* localStorage may be full or disabled */ }

    if (selectedPackage === 'group') {
      const people = typeof numberOfPeople === 'number' ? numberOfPeople : 2;
      const userEmail = localStorage.getItem('authUser') ? (JSON.parse(localStorage.getItem('authUser') || '{}').email || '') : '';

      try {
        // Call backend to generate the real group invite code
        const res = await generateGroupAccess(selectedEvent.id, {
          paymentRefId: refid,
          viewerCount: people,
          purchaserEmail: userEmail,
        });

        if (res.success && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          const code = (d.inviteCode as string) || refid.slice(-8).toUpperCase();
          const expiry = (d.expiresAt as string) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          const maxViewers = (d.maxViewers as number) || people;

          const codeData = { code, expiry, people: maxViewers, refid, eventId: selectedEvent.id, eventTitle: selectedEvent.title, remainingInvites: Math.max(0, maxViewers - 1), invitedEmails: (d.authorizedEmails as string[]) || [] };
          localStorage.setItem(`groupCode_${selectedEvent.id}`, JSON.stringify(codeData));

          setGroupShareCode(code);
          setGroupCodeExpiry(expiry);
          setGroupPeopleCount(maxViewers);
          setGroupPaymentRef(refid);
          setRemainingInvites(Math.max(0, maxViewers - 1));
          setInvitedEmails((d.authorizedEmails as string[]) || []);
          setShowGroupCodeModal(true);
        } else {
          // Fallback — use payment ref as temp code if API fails
          const code = refid.slice(-8).toUpperCase();
          const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          const codeData = { code, expiry, people, refid, eventId: selectedEvent.id, eventTitle: selectedEvent.title };
          localStorage.setItem(`groupCode_${selectedEvent.id}`, JSON.stringify(codeData));
          setGroupShareCode(code);
          setGroupCodeExpiry(expiry);
          setGroupPeopleCount(people);
          setGroupPaymentRef(refid);
          setShowGroupCodeModal(true);
        }
      } catch {
        // Fallback on error
        const code = refid.slice(-8).toUpperCase();
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const codeData = { code, expiry, people, refid, eventId: selectedEvent.id, eventTitle: selectedEvent.title };
        localStorage.setItem(`groupCode_${selectedEvent.id}`, JSON.stringify(codeData));
        setGroupShareCode(code);
        setGroupCodeExpiry(expiry);
        setGroupPeopleCount(people);
        setGroupPaymentRef(refid);
        setShowGroupCodeModal(true);
      }
    } else {
      // ── Individual payment success ───────────────────────────────
      // Confirm anonymous payment with backend (if applicable) BEFORE
      // routing — the route decision depends on event live-ness, not
      // anonymous-vs-authenticated.
      if (!isAuthenticated && pendingViewerId) {
        try {
          await confirmAnonymousPayment(selectedEvent.id, pendingViewerId, refid);
        } catch {
          try {
            await confirmAnonymousPayment(selectedEvent.id, pendingViewerId, refid);
          } catch { /* backend can reconcile via payment ref later */ }
        }
      }

      // STRICT ROUTING RULE: only redirect to live-stream when the event
      // is genuinely live right now. Upcoming events ALWAYS route back to
      // the view-event page with a `?reserved=1` flag so a success modal
      // + "Spot reserved" banners show.
      if (isEventCurrentlyLive) {
        // Event is live — proceed to the stream
        const code = inviteCode.trim();
        if (code && selectedEvent.id) {
          try {
            const userStr = localStorage.getItem('authUser');
            const userName = userStr ? `${JSON.parse(userStr).firstName || ''} ${JSON.parse(userStr).lastName || ''}`.trim() : 'Viewer';
            const res = await redeemGroupCode(selectedEvent.id, { inviteCode: code, viewerUsername: userName });
            const viewerSuffix = !isAuthenticated && pendingViewerId ? `&viewerId=${pendingViewerId}` : '';
            if (res.success && res.data) {
              router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(code)}${viewerSuffix}`);
            } else {
              router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment${viewerSuffix}`);
            }
          } catch {
            const viewerSuffix = !isAuthenticated && pendingViewerId ? `&viewerId=${pendingViewerId}` : '';
            router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment${viewerSuffix}`);
          }
        } else {
          const inviteToken = searchParams.get('inviteToken') || '';
          const viewerSuffix = !isAuthenticated && pendingViewerId ? `&viewerId=${pendingViewerId}` : '';
          if (inviteToken) {
            router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(inviteToken)}${viewerSuffix}`);
          } else {
            router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment${viewerSuffix}`);
          }
        }
      } else {
        // Event is UPCOMING / not yet live — go back to view-event with
        // ?reserved=1 to trigger the "Spot reserved" success modal +
        // owned-access banners. The user can return when the event goes live.
        router.push(`/user/events/view-event?id=${selectedEvent.id}&reserved=1`);
      }
    }
  };

  const handlePeopleChange = (value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) {
      setPeopleInputError('Please enter numbers only');
      return;
    }

    if (value === '') {
      setNumberOfPeople('');
      setPeopleInputError('Please enter number of people');
      return;
    }

    const num = parseInt(value, 10);

    if (num < 2) {
      setNumberOfPeople(num);
      setPeopleInputError('Minimum 2 people required');
    } else {
      setNumberOfPeople(num);
      setPeopleInputError('');
    }
  };

  // Loading state — silent dark backdrop matching the cinematic theme.
  if (isLoading) {
    return (
      <>
        <AmoriaKNavbar />
        <div
          aria-busy="true"
          aria-label="Loading event package"
          style={{
            minHeight: '100vh',
            background:
              'radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.18) 0%, rgba(8,58,133,0) 60%), linear-gradient(180deg, #07080d 0%, #0c0e15 60%, #11141d 100%)',
          }}
        />
      </>
    );
  }

  if (!selectedEvent) {
    return (
      <>
        <AmoriaKNavbar />
        <div
          style={{
            minHeight: '100vh',
            background:
              'radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.18) 0%, rgba(8,58,133,0) 60%), linear-gradient(180deg, #07080d 0%, #0c0e15 60%, #11141d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Pragati Narrow', system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                color: '#fca5a5',
                fontSize: 28,
              }}
            >
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f4f6fb', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Event not found
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 20px', lineHeight: 1.5 }}>
              The event you&apos;re trying to access may have been removed, or the link may be incorrect.
            </p>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '12px 28px',
                background: '#083A85',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 12px 36px -10px rgba(8,58,133,0.55)',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="bi bi-chevron-left"></i> Go back
            </button>
          </div>
        </div>
      </>
    );
  }

  const eventImage = selectedEvent?.eventPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80';

  // Derived event metadata for the cinematic header
  const fmtDate = (d?: string): string => {
    if (!d) return 'TBD';
    try {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  };
  const evRawStatus = (selectedEvent.eventStatus || '').toUpperCase();
  const evIsLive = evRawStatus === 'ONGOING';
  const evIsCancelled = evRawStatus === 'CANCELLED';
  const evStatusLabel = evIsLive ? 'LIVE NOW' : evIsCancelled ? 'CANCELLED' : 'UPCOMING';
  const evStatusKey = evIsLive ? 'live' : evIsCancelled ? 'cancelled' : 'upcoming';
  const evCategoryName = selectedEvent.eventCategory?.name || (selectedEvent.eventTags?.split(',')[0]?.trim() || 'Event');

  const groupReady = selectedPackage === 'group' && isGroupInputValid();

  return (
    <div className="jp-page">
      <AmoriaKNavbar />

      {/* Group-code error is shown via the global ErrorPopup (rendered at the bottom of this page) */}

      {/* Cinematic backdrop — blurred event poster + dark veil + grain */}
      <div className="jp-backdrop" aria-hidden="true">
        <div className="jp-backdrop-img" style={{ backgroundImage: `url("${encodeURI(eventImage)}")` }} />
        <div className="jp-backdrop-veil" />
        <div className="jp-backdrop-grain" />
      </div>

      <main className="jp-main">
        {/* ─── Event header strip ─── */}
        <header className="jp-event">
          <button
            type="button"
            className="jp-back"
            onClick={() => window.history.back()}
            aria-label="Go back to event"
          >
            <i className="bi bi-chevron-left" aria-hidden="true"></i>
          </button>
          <div
            className="jp-event-poster"
            style={{ backgroundImage: `url("${encodeURI(eventImage)}")` }}
            aria-hidden="true"
          />
          <div className="jp-event-info">
            <div className="jp-event-chips">
              <span className={`jp-status jp-status--${evStatusKey}`}>
                {evIsLive && <span className="jp-pulse" aria-hidden="true" />}
                {evStatusLabel}
              </span>
              <span className="jp-cat">{evCategoryName}</span>
            </div>
            <h1 className="jp-event-title">{selectedEvent.title}</h1>
            <div className="jp-event-meta">
              <span><i className="bi bi-calendar-event" aria-hidden="true"></i>{fmtDate(selectedEvent.eventDate)}</span>
              {selectedEvent.location && (
                <>
                  <span className="jp-sep" aria-hidden="true">·</span>
                  <span><i className="bi bi-geo-alt" aria-hidden="true"></i>{selectedEvent.location}</span>
                </>
              )}
            </div>
          </div>
          {individualFee > 0 && (
            <div className="jp-event-price">
              <small>From</small>
              <strong>{individualFee.toLocaleString()} <span>RWF</span></strong>
            </div>
          )}
        </header>

        {/* ─── Page heading ─── */}
        <div className="jp-heading">
          <h2>Choose your stream package</h2>
          <p>Pick how you want to watch — pay once, watch live in HD.</p>
        </div>

        {/* View My Code button — shown when viewer has a saved group code */}
        {groupShareCode && (
          <div className="jp-savedcode">
            <button
              type="button"
              className="jp-savedcode-btn"
              onClick={() => setShowGroupCodeModal(true)}
            >
              <span className="jp-savedcode-ico" aria-hidden="true"><i className="bi bi-key-fill"></i></span>
              <span className="jp-savedcode-text">
                <strong>You have a group code</strong>
                <small>Tap to view, share, or skip to the stream</small>
              </span>
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* ─── Package cards ─── */}
        <section className="jp-cards" aria-label="Stream packages">
          {packages.filter(pkg => pkg.id !== 'group' || discountPercentage > 0).map((pkg) => {
            const selected = selectedPackage === pkg.id;
            return (
              <article
                key={pkg.id}
                onClick={() => handlePackageSelect(pkg.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePackageSelect(pkg.id); } }}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                className={`jp-card ${selected ? 'is-selected' : ''} ${pkg.id === 'group' ? 'jp-card--group' : 'jp-card--individual'}`}
              >
                <header className="jp-card-head">
                  <span className="jp-card-badge">
                    <i className={pkg.id === 'group' ? 'bi bi-people-fill' : 'bi bi-person-fill'} aria-hidden="true"></i>
                    {pkg.id === 'group' ? 'Group' : 'Individual'}
                  </span>
                  {pkg.id === 'group' && discountPercentage > 0 && (
                    <span className="jp-card-savings">Save {discountPercentage}%</span>
                  )}
                </header>

                <h3 className="jp-card-name">{pkg.name}</h3>
                <p className="jp-card-desc">{pkg.description}</p>

                <div className="jp-card-price">
                  {pkg.id === 'individual' ? (
                    <>
                      <span className="jp-price-num">{individualFee.toLocaleString()}</span>
                      <span className="jp-price-cur">RWF</span>
                    </>
                  ) : (
                    <span className="jp-price-tag discount-bounce">Save up to {discountPercentage}%</span>
                  )}
                </div>
                <div className="jp-card-pricenote">{pkg.priceNote}</div>

                <ul className="jp-card-features">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className={feature.available ? '' : 'is-unavailable'}>
                      <span className="jp-feat-ico" aria-hidden="true">
                        <i className={feature.available ? 'bi bi-check-lg' : 'bi bi-x-lg'}></i>
                      </span>
                      <span className="jp-feat-text">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Group package — people input + price breakdown */}
                {pkg.id === 'group' && selected && (
                  <div className="jp-group-input" onClick={(e) => e.stopPropagation()}>
                    <label htmlFor="jp-people-count" className="jp-input-label">
                      <i className="bi bi-people-fill" aria-hidden="true"></i>
                      Number of people <span className="jp-required">*</span>
                    </label>
                    <div className="jp-input-wrap">
                      <input
                        id="jp-people-count"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Enter number (min. 2)"
                        value={numberOfPeople}
                        onChange={(e) => handlePeopleChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                            e.preventDefault();
                            setPeopleInputError('Please enter numbers only');
                          }
                        }}
                        className={`jp-input ${peopleInputError ? 'is-error' : ''}`}
                        aria-invalid={!!peopleInputError}
                        aria-describedby={peopleInputError ? 'jp-people-err' : 'jp-people-hint'}
                      />
                      {isGroupInputValid() && (
                        <span className="jp-input-check" aria-hidden="true">
                          <i className="bi bi-check-lg"></i>
                        </span>
                      )}
                    </div>
                    {peopleInputError ? (
                      <p id="jp-people-err" className="jp-msg jp-msg--err">
                        <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
                        {peopleInputError}
                      </p>
                    ) : (
                      <p id="jp-people-hint" className="jp-msg jp-msg--hint">
                        <i className="bi bi-info-circle" aria-hidden="true"></i>
                        Including yourself — minimum 2 people
                      </p>
                    )}

                    {isGroupInputValid() && (
                      <div className="jp-breakdown">
                        <div className="jp-breakdown-row">
                          <span>Original ({peopleCount} × {individualFee.toLocaleString()} RWF)</span>
                          <span className="jp-strike">{(individualFee * peopleCount).toLocaleString()} RWF</span>
                        </div>
                        <div className="jp-breakdown-row jp-breakdown-row--save">
                          <span>{discountPercentage}% group discount</span>
                          <span>−{totalSavings.toLocaleString()} RWF</span>
                        </div>
                        <div className="jp-breakdown-divider" aria-hidden="true" />
                        <div className="jp-breakdown-row jp-breakdown-row--total">
                          <span>Total to pay</span>
                          <strong>{totalGroupFee.toLocaleString()} RWF</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <footer className="jp-card-footer">
                  {selected ? (
                    <span className="jp-selected">
                      <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                      Selected
                    </span>
                  ) : (
                    <span className="jp-tap">
                      <i className="bi bi-hand-index-thumb" aria-hidden="true"></i>
                      Tap to select
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </section>

        {/* ─── Action bar — group only (individual auto-proceeds) ─── */}
        {selectedPackage === 'group' && (
          <div className="jp-actions" role="group" aria-label="Confirm selection">
            <button type="button" className="jp-btn jp-btn--ghost" onClick={handleCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="jp-btn jp-btn--primary"
              onClick={handleProceed}
              disabled={!groupReady}
            >
              Continue
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* ─── Trust strip ─── */}
        <div className="jp-trust">
          <span><i className="bi bi-shield-check" aria-hidden="true"></i> Secure payment</span>
          <span><i className="bi bi-arrow-clockwise" aria-hidden="true"></i> Refundable</span>
          <span><i className="bi bi-headset" aria-hidden="true"></i> 24/7 support</span>
        </div>
      </main>

      {/* ───────────────────────── Scoped cinematic styles ───────────────────────── */}
      <style jsx global>{`
        :root {
          --jp-bg: #07080d;
          --jp-bg-2: #0c0e15;
          --jp-bg-3: #11141d;
          --jp-text: #f4f6fb;
          --jp-text-soft: #b8bdca;
          --jp-text-mute: #7d8294;
          --jp-line: rgba(255,255,255,0.08);
          --jp-line-strong: rgba(255,255,255,0.16);
          --jp-brand: #083A85;
          --jp-brand-2: #1f6bff;
          --jp-brand-soft: rgba(8,58,133,0.18);
          --jp-amber: #f59e0b;
          --jp-emerald: #10b981;
          --jp-red: #ef4444;
        }

        .jp-page {
          position: relative;
          min-height: 100vh;
          font-family: 'Pragati Narrow', system-ui, -apple-system, 'Segoe UI', sans-serif;
          color: var(--jp-text);
          background:
            radial-gradient(80% 60% at 50% 0%, rgba(8,58,133,0.18) 0%, rgba(8,58,133,0) 60%),
            linear-gradient(180deg, var(--jp-bg) 0%, var(--jp-bg-2) 60%, var(--jp-bg-3) 100%);
          overflow-x: hidden;
        }

        /* ── Backdrop ─────────────────────────────────────────────── */
        .jp-backdrop {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 540px;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .jp-backdrop-img {
          position: absolute; inset: -10% 0 0;
          background-size: cover;
          background-position: center;
          filter: blur(28px) saturate(120%);
          transform: scale(1.18);
          opacity: 0.55;
        }
        .jp-backdrop-veil {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(7,8,13,0.55) 0%, rgba(7,8,13,0.55) 30%, rgba(7,8,13,0.85) 70%, var(--jp-bg) 100%),
            radial-gradient(80% 60% at 0% 0%, rgba(8,58,133,0.35) 0%, rgba(8,58,133,0) 60%);
        }
        .jp-backdrop-grain {
          position: absolute; inset: 0;
          opacity: 0.14;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
        }

        /* ── Banner ───────────────────────────────────────────────── */
        .jp-banner {
          position: relative;
          z-index: 5;
          max-width: 720px;
          margin: 80px auto 0;
          padding: 14px 18px;
          border-radius: 14px;
          display: flex; align-items: center; gap: 12px;
          font-size: 14px; font-weight: 500;
        }
        .jp-banner--err {
          background: rgba(239,68,68,0.10);
          border: 1px solid rgba(239,68,68,0.40);
          color: #fca5a5;
        }
        .jp-banner--err i { color: #ef4444; font-size: 18px; flex: none; }

        /* ── Main container ───────────────────────────────────────── */
        .jp-main {
          position: relative;
          z-index: 5;
          max-width: 1120px;
          margin: 0 auto;
          padding: clamp(80px, 10vh, 110px) clamp(16px, 4vw, 32px) clamp(40px, 6vw, 60px);
        }

        /* ── Event header strip ───────────────────────────────────── */
        .jp-event {
          display: grid;
          grid-template-columns: auto 96px 1fr auto;
          align-items: center;
          gap: clamp(12px, 2vw, 20px);
          padding: clamp(14px, 2vw, 18px);
          margin-bottom: clamp(20px, 3vw, 32px);
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%);
          border: 1px solid var(--jp-line-strong);
          border-radius: 20px;
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          box-shadow: 0 16px 48px -12px rgba(0,0,0,0.55);
        }
        .jp-back {
          width: 40px; height: 40px; flex: none;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--jp-line);
          color: var(--jp-text);
          font-size: 16px;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
        }
        .jp-back:hover {
          background: rgba(255,255,255,0.12);
          border-color: var(--jp-line-strong);
          transform: translateX(-1px);
        }
        .jp-event-poster {
          width: 96px; height: 96px;
          border-radius: 14px;
          background: #1a1d28 50% 50% / cover no-repeat;
          border: 1px solid var(--jp-line);
          box-shadow: 0 8px 22px -6px rgba(0,0,0,0.55);
          flex: none;
        }
        .jp-event-info {
          min-width: 0;
          display: flex; flex-direction: column; gap: 6px;
        }
        .jp-event-chips {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .jp-status {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
        }
        .jp-status--live {
          background: rgba(16,185,129,0.85);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.30);
        }
        .jp-status--upcoming {
          background: rgba(31,107,255,0.55);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.30);
        }
        .jp-status--cancelled {
          background: rgba(239,68,68,0.78);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.28);
        }
        .jp-pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
          animation: jpPulse 1.6s ease-out infinite;
        }
        @keyframes jpPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .jp-cat {
          display: inline-flex; align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(7,8,13,0.55);
          border: 1px solid var(--jp-line-strong);
          color: var(--jp-text);
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
        }
        .jp-event-title {
          font-size: clamp(20px, 2.4vw, 26px);
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.01em;
          color: var(--jp-text);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .jp-event-meta {
          display: flex; align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          color: var(--jp-text-soft);
          font-size: 13px;
        }
        .jp-event-meta span { display: inline-flex; align-items: center; gap: 6px; }
        .jp-event-meta i { color: var(--jp-brand-2); font-size: 13px; }
        .jp-event-meta .jp-sep { color: var(--jp-text-mute); }

        .jp-event-price {
          display: flex; flex-direction: column;
          align-items: flex-end;
          padding: 10px 16px;
          border-radius: 14px;
          background: rgba(8,58,133,0.18);
          border: 1px solid rgba(31,107,255,0.45);
          flex: none;
        }
        .jp-event-price small {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #93c5fd;
          font-weight: 800;
        }
        .jp-event-price strong {
          font-size: clamp(26px, 2.6vw, 32px);
          font-weight: 900;
          color: var(--jp-text);
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .jp-event-price strong span {
          font-size: 13px;
          font-weight: 800;
          color: var(--jp-text-mute);
          margin-left: 4px;
          letter-spacing: 0.04em;
        }

        @media (max-width: 720px) {
          .jp-event {
            grid-template-columns: auto 1fr;
            grid-template-areas:
              "back  poster"
              "info  info"
              "price price";
            gap: 12px;
          }
          .jp-back { grid-area: back; }
          .jp-event-poster { grid-area: poster; width: 64px; height: 64px; justify-self: end; }
          .jp-event-info { grid-area: info; }
          .jp-event-price { grid-area: price; flex-direction: row; align-items: center; gap: 10px; align-self: stretch; justify-content: space-between; }
          .jp-event-price small { font-size: 10px; }
          .jp-event-price strong { font-size: 22px; }
        }

        /* ── Page heading ─────────────────────────────────────────── */
        .jp-heading {
          text-align: center;
          margin-bottom: clamp(16px, 2vw, 24px);
        }
        .jp-heading h2 {
          font-size: clamp(24px, 3.6vw, 36px);
          font-weight: 800;
          color: var(--jp-text);
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }
        .jp-heading p {
          font-size: clamp(13px, 1.4vw, 15px);
          color: var(--jp-text-soft);
          margin: 0;
        }

        /* ── Saved-code button ────────────────────────────────────── */
        .jp-savedcode { margin-bottom: 16px; }
        .jp-savedcode-btn {
          display: flex; align-items: center; gap: 14px;
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 100%);
          border: 1px solid rgba(245,158,11,0.55);
          border-radius: 14px;
          color: var(--jp-text);
          font-family: inherit;
          cursor: pointer;
          transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
          text-align: left;
        }
        .jp-savedcode-btn:hover {
          background: linear-gradient(135deg, rgba(245,158,11,0.28) 0%, rgba(245,158,11,0.10) 100%);
          transform: translateY(-1px);
          box-shadow: 0 10px 30px -8px rgba(245,158,11,0.40);
        }
        .jp-savedcode-ico {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: rgba(245,158,11,0.30);
          border: 1px solid rgba(245,158,11,0.55);
          color: #fbbf77;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex: none;
        }
        .jp-savedcode-text { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .jp-savedcode-text strong { font-size: 14px; font-weight: 800; color: var(--jp-text); }
        .jp-savedcode-text small { font-size: 12px; color: var(--jp-text-mute); }
        .jp-savedcode-btn > i:last-child { color: #fbbf77; font-size: 14px; }

        /* ── Cards grid — auto-fit handles 1 or 2 cards gracefully:
              • 1 card  → centered, up to 460px wide
              • 2 cards → side-by-side, each up to 1fr
              • mobile  → stacked single column */
        .jp-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
          max-width: 960px;
          margin: 0 auto clamp(16px, 2vw, 24px);
          gap: clamp(14px, 2vw, 20px);
          align-items: stretch;
        }
        @media (max-width: 720px) {
          .jp-cards { grid-template-columns: 1fr; }
        }

        .jp-card {
          position: relative;
          display: flex; flex-direction: column;
          padding: clamp(18px, 2.5vw, 24px);
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%);
          border: 1.5px solid var(--jp-line-strong);
          border-radius: 22px;
          cursor: pointer;
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          transition:
            transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
            border-color 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease;
          outline: none;
          isolation: isolate;
        }
        .jp-card::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(80% 50% at 50% 0%, rgba(31,107,255,0.10) 0%, rgba(0,0,0,0) 60%);
          opacity: 0;
          transition: opacity 220ms ease;
        }
        .jp-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.28); box-shadow: 0 22px 50px -16px rgba(0,0,0,0.55); }
        .jp-card:hover::before { opacity: 1; }
        .jp-card.is-selected {
          border-color: var(--jp-brand-2);
          background: linear-gradient(180deg, rgba(31,107,255,0.12) 0%, rgba(8,58,133,0.06) 100%);
          box-shadow:
            0 0 0 1px rgba(31,107,255,0.45),
            0 22px 60px -16px rgba(31,107,255,0.55);
          transform: translateY(-2px);
        }
        .jp-card.is-selected::before { opacity: 1; }
        .jp-card:focus-visible { outline: 2px solid var(--jp-brand-2); outline-offset: 3px; }

        .jp-card-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
        }
        .jp-card-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          background: rgba(31,107,255,0.18);
          border: 1px solid rgba(31,107,255,0.45);
          color: #93c5fd;
        }
        .jp-card-badge i { font-size: 11px; }
        .jp-card--group .jp-card-badge {
          background: rgba(245,158,11,0.18);
          border-color: rgba(245,158,11,0.55);
          color: #fbbf77;
        }
        .jp-card-savings {
          display: inline-flex;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(16,185,129,0.20);
          border: 1px solid rgba(16,185,129,0.55);
          color: #6ee7b7;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .jp-card-name {
          font-size: clamp(20px, 2.2vw, 24px);
          font-weight: 800;
          color: var(--jp-text);
          letter-spacing: -0.01em;
          margin: 0 0 4px;
        }
        .jp-card-desc {
          font-size: 13.5px;
          color: var(--jp-text-soft);
          line-height: 1.5;
          margin: 0 0 18px;
        }

        .jp-card-price {
          display: flex; align-items: baseline; gap: 8px;
          margin-bottom: 4px;
        }
        .jp-price-num {
          font-size: clamp(44px, 5vw, 56px);
          font-weight: 900;
          color: var(--jp-text);
          letter-spacing: -0.030em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 4px 24px rgba(31,107,255,0.25);
        }
        .jp-price-cur {
          font-size: 18px;
          font-weight: 800;
          color: var(--jp-text-mute);
          letter-spacing: 0.06em;
        }
        .jp-price-tag {
          font-size: clamp(28px, 3.2vw, 36px);
          font-weight: 900;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .jp-card-pricenote {
          font-size: 12.5px;
          color: var(--jp-text-mute);
          margin-bottom: 18px;
        }

        /* Group card — center the bouncing "Save up to N%" tag and its
           price-note caption so the rotation in discount-bounce reads
           cleanly and the tag becomes the visual anchor of the card. */
        .jp-card--group .jp-card-price {
          justify-content: center;
          padding: 6px 0 4px;
          min-height: clamp(40px, 5vw, 56px);
        }
        .jp-card--group .jp-card-pricenote {
          text-align: center;
        }

        .jp-card-features {
          list-style: none;
          padding: 0; margin: 0 0 16px;
          display: flex; flex-direction: column;
          gap: 9px;
          padding-top: 16px;
          border-top: 1px solid var(--jp-line);
        }
        .jp-card-features li {
          display: flex; align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--jp-text-soft);
        }
        .jp-card-features li.is-unavailable {
          color: var(--jp-text-mute);
        }
        .jp-card-features li.is-unavailable .jp-feat-text {
          text-decoration: line-through;
          text-decoration-color: rgba(239,68,68,0.45);
        }
        .jp-feat-ico {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: rgba(31,107,255,0.18);
          border: 1px solid rgba(31,107,255,0.40);
          color: #93c5fd;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex: none;
        }
        .jp-card-features li.is-unavailable .jp-feat-ico {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.40);
          color: #fca5a5;
        }

        /* ── Group input ──────────────────────────────────────────── */
        .jp-group-input {
          margin-top: 4px;
          padding: 14px;
          border-radius: 14px;
          background: rgba(31,107,255,0.10);
          border: 1px dashed rgba(31,107,255,0.55);
          animation: jpFadeIn 0.28s ease;
        }
        @keyframes jpFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .jp-input-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 700;
          color: #93c5fd;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .jp-input-label i { color: var(--jp-brand-2); font-size: 13px; }
        .jp-required { color: #fca5a5; }
        .jp-input-wrap { position: relative; }
        .jp-input {
          width: 100%;
          padding: 12px 44px 12px 16px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 800;
          text-align: center;
          background: rgba(7,8,13,0.65);
          border: 1.5px solid var(--jp-line-strong);
          border-radius: 12px;
          color: var(--jp-text);
          outline: none;
          box-sizing: border-box;
          transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
          letter-spacing: 0.02em;
        }
        .jp-input::placeholder { color: var(--jp-text-mute); font-weight: 500; }
        .jp-input:focus {
          border-color: var(--jp-brand-2);
          background: rgba(7,8,13,0.85);
          box-shadow: 0 0 0 4px rgba(31,107,255,0.18);
        }
        .jp-input.is-error {
          border-color: rgba(239,68,68,0.6);
          box-shadow: 0 0 0 4px rgba(239,68,68,0.15);
        }
        .jp-input-check {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px; height: 24px;
          border-radius: 50%;
          background: var(--jp-emerald);
          color: #fff;
          font-size: 13px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .jp-msg {
          margin: 8px 0 0;
          font-size: 12px;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .jp-msg--err { color: #fca5a5; }
        .jp-msg--hint { color: var(--jp-text-mute); }
        .jp-msg i { font-size: 12px; }

        .jp-breakdown {
          margin-top: 12px;
          padding: 12px 14px;
          background: rgba(7,8,13,0.55);
          border: 1px solid var(--jp-line-strong);
          border-radius: 12px;
          animation: jpFadeIn 0.28s ease;
        }
        .jp-breakdown-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12.5px;
          color: var(--jp-text-soft);
          padding: 3px 0;
        }
        .jp-strike { text-decoration: line-through; color: var(--jp-text-mute); }
        .jp-breakdown-row--save { color: #6ee7b7; font-weight: 700; }
        .jp-breakdown-row--total { color: var(--jp-text); font-size: 14px; font-weight: 700; padding-top: 8px; }
        .jp-breakdown-row--total strong {
          font-size: 24px;
          font-weight: 900;
          color: #93c5fd;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .jp-breakdown-divider {
          height: 1px;
          background: var(--jp-line-strong);
          margin: 6px 0;
        }

        .jp-card-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--jp-line);
          display: flex; align-items: center; justify-content: center;
        }
        .jp-selected {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: rgba(16,185,129,0.18);
          border: 1px solid rgba(16,185,129,0.50);
          border-radius: 999px;
          color: #6ee7b7;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .jp-tap {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--jp-text-mute);
          font-size: 13px;
          font-weight: 600;
        }

        /* ── Action buttons ───────────────────────────────────────── */
        .jp-actions {
          display: flex; justify-content: center;
          gap: 12px;
          margin: clamp(16px, 2vw, 22px) 0 clamp(20px, 3vw, 28px);
          animation: jpFadeIn 0.28s ease;
        }
        .jp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 9px;
          padding: 13px 28px;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
          border-radius: 14px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
          min-width: 160px;
        }
        .jp-btn:disabled { cursor: not-allowed; opacity: 0.55; }
        .jp-btn--ghost {
          background: rgba(255,255,255,0.05);
          color: var(--jp-text);
          border-color: var(--jp-line-strong);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .jp-btn--ghost:hover:not(:disabled) {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.30);
          transform: translateY(-1px);
        }
        .jp-btn--primary {
          background: var(--jp-brand);
          color: #fff;
          border-color: rgba(255,255,255,0.18);
          box-shadow: 0 12px 36px -10px rgba(8,58,133,0.65), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .jp-btn--primary:hover:not(:disabled) {
          background: #062d6b;
          transform: translateY(-1.5px);
          box-shadow: 0 18px 40px -8px rgba(8,58,133,0.75), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        @media (max-width: 540px) {
          .jp-actions { flex-direction: column-reverse; }
          .jp-btn { width: 100%; min-width: 0; }
        }

        /* ── Trust strip ──────────────────────────────────────────── */
        .jp-trust {
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 18px;
          padding-top: clamp(20px, 3vw, 28px);
          border-top: 1px solid var(--jp-line);
          font-size: 12.5px;
          color: var(--jp-text-mute);
        }
        .jp-trust span {
          display: inline-flex; align-items: center; gap: 6px;
        }
        .jp-trust i {
          color: var(--jp-emerald);
          font-size: 14px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .jp-pulse { animation: none; }
          .jp-card, .jp-btn, .jp-back, .jp-savedcode-btn { transition-duration: 0.001ms !important; }
          .jp-card:hover { transform: none; }
        }
      `}</style>

      {/* XentriPay Payment Modal */}
      <XentriPayModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPendingDonationAmount(0); }}
        onSuccess={handlePaymentSuccess}
        amount={getPaymentFee()}
        currencyCode={selectedEvent?.streamFeeCurrencyAbbreviation || selectedEvent?.streamFeeCurrencySymbol || 'RWF'}
        currencyId={currencies.find(c => c.code === (selectedEvent?.streamFeeCurrencyAbbreviation || 'RWF'))?.id || currencies.find(c => c.code === 'RWF')?.id || '490c5ab1-a150-459e-be6b-d45131a1e13a'}
        paymentType="streaming"
        eventId={selectedEvent?.id || ''}
        viewerId={!isAuthenticated ? (pendingViewerId || undefined) : undefined}
        donationAmount={pendingDonationAmount > 0 ? pendingDonationAmount : undefined}
        showDonationPrompt
        onDonationAmountChange={(amt) => setPendingDonationAmount(amt)}
        title={`Stream Access — ${selectedEvent?.title || 'Event'}`}
        subtitle={`${selectedPackage === 'group' ? `Group (${typeof numberOfPeople === 'number' ? numberOfPeople : 1} people)` : 'Individual'} · ${getPaymentFee().toLocaleString()} ${selectedEvent?.streamFeeCurrencyAbbreviation || selectedEvent?.streamFeeCurrencySymbol || (currencies.length > 0 ? currencies[0].code : 'RWF')}`}
        darkMode
        // Geo-restriction is for spot reservers (upcoming events) only.
        // Once the event is live, anyone who has paid may join regardless
        // of country, so we skip the per-event IP geo-check entirely.
        skipEventGeoCheck={(selectedEvent?.eventStatus || '').toUpperCase() === 'ONGOING'
          && (selectedEvent as Record<string, unknown> | null)?.streamStatus !== 'ended'}
      />

      {/* Discount Badge — overlays payment modal when group package selected */}
      {showPaymentModal && selectedPackage === 'group' && (
        <div
          className="discount-bounce"
          style={{
            position: 'fixed',
            top: '18%',
            right: 'calc(50% - 220px)',
            zIndex: 2001,
            background: 'linear-gradient(135deg, #60a5fa 0%, #93c5fd 50%, #083A85 100%)',
            color: '#1f2937',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '800',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {discountPercentage}% OFF
        </div>
      )}

      {/* Group Share Code Modal */}
      {showGroupCodeModal && groupShareCode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'linear-gradient(145deg, #052047 0%, #083A85 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(8,58,133,0.15)', position: 'relative', margin: 'auto' }}>
            {/* Close button */}
            <button onClick={() => setShowGroupCodeModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #083A85)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <i className="bi bi-people-fill" style={{ fontSize: 26, color: '#1f2937' }}></i>
              </div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
                Group Access Code
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 12px' }}>
                Invite your group to access the stream
              </p>
              {/* Skip — context-aware: only routes to live-stream when the
                  event is live. Otherwise sends back to view-event with
                  ?reserved=1 (success banners + spot-reserved confirmation). */}
              <button
                onClick={() => {
                  setShowGroupCodeModal(false);
                  const isLiveNow = (selectedEvent?.eventStatus || '').toUpperCase() === 'ONGOING'
                    && (selectedEvent as Record<string, unknown> | null)?.streamStatus !== 'ended';
                  if (isLiveNow && selectedEvent?.id) {
                    router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(groupShareCode)}`);
                  } else if (selectedEvent?.id) {
                    router.push(`/user/events/view-event?id=${selectedEvent.id}&reserved=1&group=1`);
                  }
                }}
                style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#9ca3af', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                Skip — Watch Now <i className="bi bi-arrow-right" style={{ marginLeft: 4 }}></i>
              </button>
            </div>

            {/* Share Code */}
            <div style={{ background: 'rgba(8,58,133,0.1)', border: '2px solid rgba(8,58,133,0.3)', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 20 }}>
              <p style={{ color: '#93c5fd', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Your Invite Code</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: '#fff', fontFamily: 'monospace' }}>{groupShareCode}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(groupShareCode); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#93c5fd', fontSize: 16 }}
                  title="Copy code"
                >
                  <i className="bi bi-clipboard"></i>
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ color: '#6b7280', fontSize: 11, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Viewers Allowed</p>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>{groupPeopleCount} <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>people</span></p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ color: '#6b7280', fontSize: 11, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Expires In</p>
                <p style={{ color: '#93c5fd', fontSize: 20, fontWeight: 800, margin: 0 }}>24 <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>hours</span></p>
              </div>
            </div>

            {/* Payment info */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ color: '#6b7280', fontSize: 11, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Payment Summary</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>Event</span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{selectedEvent?.title || 'Live Stream'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>Package</span>
                <span style={{ color: '#93c5fd', fontSize: 13, fontWeight: 600 }}>Group ({groupPeopleCount} people)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>Total Paid</span>
                <span style={{ color: '#0a4da3', fontSize: 13, fontWeight: 700 }}>{getPaymentFee().toLocaleString()} {selectedEvent?.streamFeeCurrencyAbbreviation || 'RWF'}</span>
              </div>
              {groupPaymentRef && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>Ref</span>
                  <span style={{ color: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}>{groupPaymentRef}</span>
                </div>
              )}
            </div>

            {/* Expiry notice */}
            {groupCodeExpiry && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="bi bi-clock-history" style={{ color: '#ef4444', fontSize: 14, flexShrink: 0 }}></i>
                <span style={{ color: '#fca5a5', fontSize: 12 }}>
                  This code expires on {new Date(groupCodeExpiry).toLocaleString()}. Share it before it expires.
                </span>
              </div>
            )}

            {/* Invite Viewers Section */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, margin: 0 }}>
                  <i className="bi bi-person-plus-fill" style={{ marginRight: 6, color: '#93c5fd' }}></i>
                  Invite Viewers
                </p>
                <span style={{ fontSize: 11, color: remainingInvites > 0 ? '#0a4da3' : '#ef4444', fontWeight: 600 }}>
                  {remainingInvites > 0 ? `${remainingInvites} slot${remainingInvites !== 1 ? 's' : ''} left` : 'No slots left'}
                </span>
              </div>

              {/* Email input + send */}
              {remainingInvites > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    type="email"
                    placeholder="Enter viewer's email"
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, outline: 'none' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#93c5fd'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  />
                  <button
                    onClick={handleSendInvite}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: inviteEmail.trim() ? '#083A85' : 'rgba(255,255,255,0.08)', color: inviteEmail.trim() ? '#1f2937' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
                  >
                    {inviteLoading ? '...' : 'Send'}
                  </button>
                </div>
              )}

              {inviteError && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{inviteError}</p>}
              {inviteSuccess && <p style={{ color: '#0a4da3', fontSize: 12, margin: '0 0 8px' }}><i className="bi bi-check-circle-fill" style={{ marginRight: 4 }}></i>{inviteSuccess}</p>}

              {/* Invited emails list */}
              {invitedEmails.length > 0 && (
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {invitedEmails.map((email, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < invitedEmails.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <i className="bi bi-envelope-check-fill" style={{ color: '#0a4da3', fontSize: 12 }}></i>
                      <span style={{ color: '#9ca3af', fontSize: 12, flex: 1 }}>{email}</span>
                      <span style={{ color: '#6b7280', fontSize: 10 }}>Invited</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p style={{ color: '#6b7280', fontSize: 11, textAlign: 'center', margin: '0 0 16px' }}>
              You can invite viewers now or come back later to add more.
            </p>

            {/* Action button — context-aware: "Watch now" routes to the
                live-stream player ONLY when the event is live; on upcoming
                events the button instead becomes "Done — back to event"
                and routes to view-event with the success flag. */}
            <div style={{ display: 'flex', gap: 10 }}>
              {(() => {
                const isLiveNow = (selectedEvent?.eventStatus || '').toUpperCase() === 'ONGOING'
                  && (selectedEvent as Record<string, unknown> | null)?.streamStatus !== 'ended';
                return (
                  <button
                    onClick={() => {
                      setShowGroupCodeModal(false);
                      if (!selectedEvent?.id) return;
                      if (isLiveNow) {
                        router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&from=payment&inviteToken=${encodeURIComponent(groupShareCode)}`);
                      } else {
                        router.push(`/user/events/view-event?id=${selectedEvent.id}&reserved=1&group=1`);
                      }
                    }}
                    style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #083A85, #0a4da3)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <i className={isLiveNow ? 'bi bi-play-circle' : 'bi bi-check-circle-fill'}></i>
                    {isLiveNow ? 'Watch Now' : 'Done — back to event'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Viewer Auth Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'linear-gradient(145deg, #052047 0%, #083A85 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(8,58,133,0.15)', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-x-lg"></i>
            </button>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #0a4da3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className={authStep === 'otp' ? 'bi bi-shield-check' : 'bi bi-cart-check-fill'} style={{ fontSize: 22, color: '#fff' }}></i>
              </div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                {authStep === 'otp' ? 'Verify Your Email' : 'Sign in to Purchase'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                {authStep === 'otp' ? 'Enter the code sent to your email' : 'Log in to buy your stream package'}
              </p>
            </div>
            {authStep !== 'otp' && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
                {(['login', 'signup'] as const).map(tab => (
                  <button key={tab} onClick={() => { setAuthStep(tab); setAuthError(''); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', background: authStep === tab ? 'linear-gradient(135deg, #083A85, #0a4da3)' : 'transparent', color: authStep === tab ? '#fff' : '#6b7280' }}>
                    {tab === 'login' ? 'Log In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            )}
            {authError && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: 14, marginTop: 1, flexShrink: 0 }}></i>
                <span style={{ color: '#fca5a5', fontSize: 13 }}>{authError}</span>
              </div>
            )}
            {authStep === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && handleAuthLogin()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleAuthLogin()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleAuthLogin} disabled={authLoading || googleLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #083A85, #0a4da3)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in…</> : <><i className="bi bi-box-arrow-in-right"></i> Log In</>}
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ color: '#6b7280', fontSize: 12 }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <button onClick={() => googleLogin()} disabled={googleLoading || authLoading} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#e5e7eb', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
                      {googleLoading ? 'Signing in…' : 'Continue with Google'}
                    </button>
                  </>
                )}
              </div>
            )}
            {authStep === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>First Name</label>
                    <input type="text" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} placeholder="First name" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Last Name</label>
                    <input type="text" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} placeholder="Last name" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="your@email.com" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone (optional)</label>
                  <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="078XXXXXXX" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                  <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleAuthSignup()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleAuthSignup} disabled={authLoading || googleLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #083A85, #0a4da3)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating account…</> : <><i className="bi bi-person-plus-fill"></i> Sign Up</>}
                </button>
                {GOOGLE_CLIENT_ID && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ color: '#6b7280', fontSize: 12 }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    </div>
                    <button onClick={() => googleLogin()} disabled={googleLoading || authLoading} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#e5e7eb', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
                      {googleLoading ? 'Signing in…' : 'Continue with Google'}
                    </button>
                  </>
                )}
              </div>
            )}
            {authStep === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Verification Code</label>
                  <input type="text" value={otpValue} onChange={e => setOtpValue(e.target.value)} placeholder="Enter code" onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 8, fontWeight: 700 }} onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleVerifyOtp} disabled={authLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #083A85, #0a4da3)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Verifying…</> : <><i className="bi bi-shield-check"></i> Verify</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anonymous Viewer Info Modal */}
      <ViewerInfoModal
        isOpen={showViewerInfoModal}
        onClose={() => setShowViewerInfoModal(false)}
        onSubmit={handleViewerInfoSubmit}
        loading={viewerInfoLoading}
        error={viewerInfoError}
      />

      {/* Device Switch Confirmation Modal */}
      <DeviceSwitchModal
        isOpen={showDeviceSwitchModal}
        onConfirm={handleDeviceSwitchConfirm}
        onCancel={() => setShowDeviceSwitchModal(false)}
        loading={deviceSwitchLoading}
      />

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
        @keyframes discountBounce {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          12% {
            transform: rotate(-4deg) scale(1.4);
          }
          24% {
            transform: rotate(4deg) scale(1.3);
          }
          36% {
            transform: rotate(-3deg) scale(1.35);
          }
          48% {
            transform: rotate(3deg) scale(1.25);
          }
          60%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .discount-bounce {
          animation: discountBounce 1.8s ease-in-out infinite;
          transform-origin: center center;
          display: inline-block;
        }
      `}</style>

      {/* Global designed error popup */}
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
    </div>
  );
}

export default function JoinPackagePage(): React.JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinPackageContent />
    </Suspense>
  );
}
