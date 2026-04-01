'use client';
import React, { useState, useEffect, Suspense } from 'react';
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

  // Solo invite code input — auto-fill from URL if shared via group link
  const [soloInviteCode, setSoloInviteCode] = useState(searchParams.get('inviteToken') || '');
  const [groupRedeemError, setGroupRedeemError] = useState<string | null>(null);

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
        const res = await googleAuth({ email: userInfo.email, firstName: userInfo.given_name || '', lastName: userInfo.family_name || '', customerType: 'Viewer' });
        if (res.success && res.data?.token) {
          const d = res.data as unknown as Record<string, string>;
          await authLogin({ id: d.id || d.customerId || '', firstName: d.firstName || userInfo.given_name || '', lastName: d.lastName || userInfo.family_name || '', email: d.email || userInfo.email, phone: d.phone || '', customerId: d.customerId || '', customerType: d.customerType || 'Viewer' }, d.token);
          setShowAuthModal(false);
          if ((selectedEvent?.price || 0) > 0) setShowPaymentModal(true);
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
        if ((selectedEvent?.price || 0) > 0) setShowPaymentModal(true);
      } else { setAuthError((res.data as unknown as Record<string, string>)?.message || res.error || 'Incorrect email or password. Please try again.'); }
    } catch { setAuthError('Unable to connect. Please check your internet connection and try again.'); } finally { setAuthLoading(false); }
  };

  const handleAuthSignup = async () => {
    if (!signupFirstName || !signupLastName || !signupEmail || !signupPassword) { setAuthError('Please fill in all required fields.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await apiSignup({ firstName: signupFirstName, lastName: signupLastName, email: signupEmail, phone: signupPhone, password: signupPassword, customerType: 'Viewer' });
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
        if ((selectedEvent?.price || 0) > 0) setShowPaymentModal(true);
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
          router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&paid=true&inviteToken=${encodeURIComponent(urlToken)}`);
        } else {
          const msg = res.error || '';
          if (msg.includes('viewer limit')) {
            setGroupRedeemError('This group invite code has reached its viewer limit. Please ask the host for a new code.');
          } else if (msg.includes('expired')) {
            setGroupRedeemError('This group invite code has expired. Please ask the host for a new one.');
          } else if (msg.includes('Invalid')) {
            setGroupRedeemError('This group invite code is invalid. Please check the code and try again.');
          } else {
            setGroupRedeemError(msg || 'Unable to redeem this invite code.');
          }
        }
      } catch {
        setGroupRedeemError('Unable to redeem invite code. Please check your connection and try again.');
      }
    })();
  }, [selectedEvent, isLoading, searchParams, router, isAuthenticated]);

  // Fetch currencies for XentriPay
  useEffect(() => {
    getCurrencies().then(res => {
      if (res.success && res.data) setCurrencies(res.data);
    }).catch(() => {});
  }, []);

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
      name: 'Group Stream',
      badge: 'Group',
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
    const price = selectedEvent.price || 0;
    const inviteToken = searchParams.get('inviteToken') || '';
    const tokenParam = inviteToken ? `&inviteToken=${encodeURIComponent(inviteToken)}` : '';

    if (price > 0) {
      // Paid event — viewer is already authenticated from view-event page
      setShowPaymentModal(true);
    } else {
      // Free event — redirect to join-event for invite token input
      if (selectedPackage === 'individual') {
        window.location.href = `/user/events/join-event?id=${selectedEvent.id}&package=individual${tokenParam}`;
      } else if (selectedPackage === 'group' && isGroupInputValid()) {
        window.location.href = `/user/events/join-event?id=${selectedEvent.id}&package=group&people=${numberOfPeople}${tokenParam}`;
      }
    }
  };

  const handlePaymentSuccess = async (refid: string) => {
    setShowPaymentModal(false);
    if (!selectedEvent) return;

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
      // Individual payment success
      const isLive = (selectedEvent.eventStatus || '').toUpperCase() === 'ONGOING';
      if (isLive) {
        // Event is live — go to stream
        const code = soloInviteCode.trim();
        if (code && selectedEvent.id) {
          try {
            const userStr = localStorage.getItem('authUser');
            const userName = userStr ? `${JSON.parse(userStr).firstName || ''} ${JSON.parse(userStr).lastName || ''}`.trim() : 'Viewer';
            const res = await redeemGroupCode(selectedEvent.id, { inviteCode: code, viewerUsername: userName });
            if (res.success && res.data) {
              router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&paid=true&inviteToken=${encodeURIComponent(code)}`);
            } else {
              router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&paid=true`);
            }
          } catch {
            router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&paid=true`);
          }
        } else {
          const inviteToken = searchParams.get('inviteToken') || '';
          if (inviteToken) {
            router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&paid=true&inviteToken=${encodeURIComponent(inviteToken)}`);
          } else {
            router.push(`/user/events/live-stream?eventId=${selectedEvent.id}&paid=true`);
          }
        }
      } else {
        // Event is upcoming — go back to view-event (spot reserved)
        router.push(`/user/events/view-event?id=${selectedEvent.id}`);
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

  if (isLoading) {
    return (
      <>
        <AmoriaKNavbar />
        <div className="min-h-screen" style={{ backgroundColor: '#0e0e10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}><i className="bi bi-hourglass-split"></i></div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>Loading event...</p>
          </div>
        </div>
      </>
    );
  }

  if (!selectedEvent) {
    return (
      <>
        <AmoriaKNavbar />
        <div className="min-h-screen" style={{ backgroundColor: '#0e0e10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}><i className="bi bi-exclamation-circle"></i></div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>Event not found</p>
            <button onClick={() => window.history.back()} style={{ marginTop: '16px', padding: '12px 32px', backgroundColor: '#083A85', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Go Back</button>
          </div>
        </div>
      </>
    );
  }

  const eventImage = selectedEvent?.eventPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80';

  return (
    <div style={{ backgroundColor: '#0e0e10', minHeight: '100vh' }}>
      <AmoriaKNavbar />

      {/* Group code redeem error banner */}
      {groupRedeemError && (
        <div style={{
          position: 'relative', zIndex: 50, maxWidth: '600px', margin: '16px auto',
          padding: '16px 20px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '12px', color: '#fca5a5', fontSize: '14px',
        }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: '18px', flexShrink: 0 }}></i>
          <span>{groupRedeemError}</span>
        </div>
      )}

      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Cinematic background image */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${encodeURI(eventImage)})`, backgroundSize: 'cover', backgroundPosition: 'center right' }} />
        {/* Top-to-bottom cinematic gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,14,16,0.1) 0%, rgba(14,14,16,0.55) 32%, rgba(14,14,16,0.93) 52%, #0e0e10 72%)' }} />

        {/* Main Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1000px',
            margin: '0 auto',
            padding: isMobile ? '4px 16px 16px' : '6px 24px 16px',
          }}
        >
          {/* Page Header */}
          <div style={{ marginBottom: isMobile ? '16px' : '20px', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: isMobile ? '32px' : '52px',
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: '8px',
              }}
            >
              Choose Your Stream Package
            </h1>
            <p style={{ fontSize: isMobile ? '14px' : '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto' }}>
              Select how you want to watch this live event
            </p>
          </div>

          {/* View My Code button — shown when viewer has a saved group code */}
          {groupShareCode && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button
                onClick={() => setShowGroupCodeModal(true)}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#1f2937',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                }}
              >
                <i className="bi bi-key-fill"></i>
                View My Group Code
              </button>
            </div>
          )}

          {/* Package Cards Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : (discountPercentage ? 'repeat(2, 1fr)' : '1fr'),
            maxWidth: !discountPercentage && !isMobile ? '480px' : undefined,
            marginLeft: !discountPercentage ? 'auto' : undefined,
            marginRight: !discountPercentage ? 'auto' : undefined,
            gap: '16px',
            marginBottom: '32px',
            alignItems: 'start',
          }}>
            {packages.filter(pkg => pkg.id !== 'group' || discountPercentage > 0).map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handlePackageSelect(pkg.id)}
                style={{
                  position: 'relative',
                  backgroundColor: selectedPackage === pkg.id ? '#0a2540' : '#1e3a5f',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedPackage === pkg.id ? '3px solid #00BFFF' : '3px solid transparent',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: selectedPackage === pkg.id
                    ? '0 25px 50px rgba(0, 191, 255, 0.35), 0 0 0 1px rgba(0, 191, 255, 0.1)'
                    : '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transform: selectedPackage === pkg.id ? 'translateY(-3px) scale(1.005)' : 'translateY(0) scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (selectedPackage !== pkg.id) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPackage !== pkg.id) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                  }
                }}
              >
                {/* Selected Indicator Ribbon */}
                {selectedPackage === pkg.id && (
                  <div
                    style={{
                      position: 'absolute',
                      zIndex: 5,
                      top: '12px',
                      right: '-30px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      padding: '4px 40px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      transform: 'rotate(45deg)',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    Selected
                  </div>
                )}

                {/* Badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '14px',
                  marginBottom: '-20px',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                }}>
                  <div
                    style={{
                      background: pkg.badgeGradient,
                      color: pkg.id === 'group' ? '#1f2937' : '#fff',
                      padding: '7px 30px',
                      borderRadius: '50px',
                      fontSize: '13px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      boxShadow: selectedPackage === pkg.id
                        ? '0 6px 20px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                      minWidth: '110px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {pkg.badge}
                  </div>
                </div>

                {/* Price Section - White Card */}
                <div
                  style={{
                    backgroundColor: selectedPackage === pkg.id ? '#f0f9ff' : '#fff',
                    margin: '0 10px 10px 10px',
                    borderRadius: '12px',
                    padding: '28px 16px 16px 16px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'all 0.3s ease',
                    border: selectedPackage === pkg.id ? '2px solid rgba(0, 191, 255, 0.2)' : '2px solid transparent',
                  }}
                >
                  {/* Package Icon */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: pkg.badgeGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}
                  >
                    <i
                      className={pkg.id === 'individual' ? 'bi bi-person-fill' : 'bi bi-people-fill'}
                      style={{ color: '#fff', fontSize: '20px' }}
                    ></i>
                  </div>

                  {/* Package Name */}
                  <h3
                    style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: selectedPackage === pkg.id ? '#083A85' : '#1f2937',
                      marginBottom: '4px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {pkg.name}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '10px',
                    }}
                  >
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div
                    className={pkg.id === 'group' ? 'discount-bounce' : ''}
                    style={{
                      fontSize: pkg.id === 'group'
                        ? '18px'
                        : (isMobile ? '28px' : '32px'),
                      fontWeight: '900',
                      background: pkg.id === 'group'
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
                        : 'none',
                      WebkitBackgroundClip: pkg.id === 'group' ? 'text' : 'unset',
                      WebkitTextFillColor: pkg.id === 'group' ? 'transparent' : 'unset',
                      backgroundClip: pkg.id === 'group' ? 'text' : 'unset',
                      color: pkg.id === 'group' ? 'transparent' : (selectedPackage === pkg.id ? '#083A85' : '#1f2937'),
                      lineHeight: 1,
                      marginBottom: '4px',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                    }}
                  >
                    {pkg.price}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '10px',
                    }}
                  >
                    {pkg.priceNote}
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      height: selectedPackage === pkg.id ? '2px' : '1px',
                      backgroundColor: selectedPackage === pkg.id ? '#00BFFF' : '#e5e7eb',
                      margin: '12px 0',
                      transition: 'all 0.3s ease',
                    }}
                  ></div>

                  {/* Features List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', transition: 'all 0.3s ease' }}>
                    {pkg.features.map((feature, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                        }}
                      >
                        {feature.available ? (
                          <i
                            className="bi bi-check-circle-fill"
                            style={{
                              color: selectedPackage === pkg.id ? '#059669' : '#10b981',
                              fontSize: '17px',
                              transition: 'all 0.3s ease',
                            }}
                          ></i>
                        ) : (
                          <i
                            className="bi bi-x-circle"
                            style={{
                              color: '#d1d5db',
                              fontSize: '17px',
                              transition: 'all 0.3s ease',
                            }}
                          ></i>
                        )}
                        <span
                          style={{
                            fontSize: '15px',
                            color: feature.available
                              ? (selectedPackage === pkg.id ? '#1f2937' : '#374151')
                              : '#9ca3af',
                            fontWeight: selectedPackage === pkg.id && feature.available ? '600' : '500',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Group Package - People Input (only when selected) */}
                  {pkg.id === 'group' && selectedPackage === 'group' && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px dashed #00BFFF',
                        animation: 'fadeIn 0.3s ease',
                      }}
                    >
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#083A85',
                          marginBottom: '6px',
                        }}
                      >
                        <i className="bi bi-people-fill" style={{ marginRight: '6px', fontSize: '14px' }}></i>
                        Number of People (including you) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Enter number (min. 2)"
                          value={numberOfPeople}
                          onChange={(e) => handlePeopleChange(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            // Prevent non-numeric keys except backspace, delete, arrows
                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                              e.preventDefault();
                              setPeopleInputError('Please enter numbers only');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '800',
                            textAlign: 'center',
                            backgroundColor: peopleInputError ? '#fef2f2' : '#f0fdf4',
                            border: peopleInputError ? '2px solid #ef4444' : '2px solid #10b981',
                            borderRadius: '10px',
                            color: '#083A85',
                            outline: 'none',
                            boxSizing: 'border-box',
                            boxShadow: peopleInputError
                              ? '0 0 0 2px rgba(239, 68, 68, 0.1)'
                              : '0 0 0 2px rgba(16, 185, 129, 0.1)',
                            transition: 'all 0.3s ease',
                          }}
                        />
                        {isGroupInputValid() && (
                          <div
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: '12px' }}></i>
                          </div>
                        )}
                      </div>
                      {peopleInputError ? (
                        <p style={{
                          fontSize: '11px',
                          color: '#ef4444',
                          marginTop: '4px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {peopleInputError}
                        </p>
                      ) : (
                        <p style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: '500' }}>
                          <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
                          Enter how many people will access the stream, including you
                        </p>
                      )}

                      {/* Price Breakdown - only show when valid input */}
                      {isGroupInputValid() && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '10px',
                            backgroundColor: '#ecfdf5',
                            borderRadius: '8px',
                            border: '1px solid #10b981',
                            animation: 'fadeIn 0.3s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#374151' }}>Original ({peopleCount} x {individualFee.toLocaleString()} RWF)</span>
                            <span style={{ fontSize: '12px', color: '#374151', textDecoration: 'line-through' }}>
                              {(individualFee * peopleCount).toLocaleString()} RWF
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>{discountPercentage}% Group Discount</span>
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                              -{totalSavings.toLocaleString()} RWF
                            </span>
                          </div>
                          <div
                            style={{
                              height: '1px',
                              backgroundColor: '#10b981',
                              margin: '4px 0',
                            }}
                          ></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', color: '#047857', fontWeight: '700' }}>Total to Pay</span>
                            <span style={{ fontSize: '14px', color: '#047857', fontWeight: '800' }}>
                              {totalGroupFee.toLocaleString()} RWF
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Bottom padding area with Select indicator */}
                <div style={{ padding: '8px 12px', transition: 'all 0.3s ease' }}>
                  {selectedPackage === pkg.id ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: '#10b981',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '14px' }}></i>
                      Selected — Click &quot;Proceed&quot;
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      <i className="bi bi-hand-index-thumb"></i>
                      Click to select
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'center',
              gap: '12px',
              paddingTop: '4px',
            }}
          >
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 32px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: isMobile ? '100%' : '160px',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={!selectedPackage || (selectedPackage === 'group' && !isGroupInputValid())}
              style={{
                padding: '10px 32px',
                background: (() => {
                  const isEnabled = selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid());
                  if (!isEnabled) return '#d1d5db';
                  const pkg = packages.find(p => p.id === selectedPackage);
                  return pkg?.badgeGradient || '#083A85';
                })(),
                color: selectedPackage === 'group' ? '#1f2937' : '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid()))
                  ? `0 8px 20px ${selectedPackage === 'group' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 211, 238, 0.35)'}`
                  : 'none',
                minWidth: isMobile ? '100%' : '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 12px 28px ${selectedPackage === 'group' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(34, 211, 238, 0.45)'}`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${selectedPackage === 'group' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 211, 238, 0.35)'}`;
                }
              }}
            >
              Proceed
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>       
        </div>
      </div>

      {/* XentriPay Payment Modal */}
      <XentriPayModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        amount={getPaymentFee()}
        currencyCode={selectedEvent?.streamFeeCurrencyAbbreviation || selectedEvent?.streamFeeCurrencySymbol || 'RWF'}
        currencyId={currencies.find(c => c.code === (selectedEvent?.streamFeeCurrencyAbbreviation || 'RWF'))?.id || currencies.find(c => c.code === 'RWF')?.id || '490c5ab1-a150-459e-be6b-d45131a1e13a'}
        paymentType="streaming"
        eventId={selectedEvent?.id || ''}
        title={`Stream Access — ${selectedEvent?.title || 'Event'}`}
        subtitle={`${selectedPackage === 'group' ? `Group (${typeof numberOfPeople === 'number' ? numberOfPeople : 1} people)` : 'Individual'} · ${getPaymentFee().toLocaleString()} ${selectedEvent?.streamFeeCurrencyAbbreviation || selectedEvent?.streamFeeCurrencySymbol || (currencies.length > 0 ? currencies[0].code : 'RWF')}`}
        darkMode
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
            background: 'linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)',
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
          <div style={{ width: '100%', maxWidth: 480, background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.15)', position: 'relative', margin: 'auto' }}>
            {/* Close button */}
            <button onClick={() => setShowGroupCodeModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #FDE047, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <i className="bi bi-people-fill" style={{ fontSize: 26, color: '#1f2937' }}></i>
              </div>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
                Group Access Code
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 12px' }}>
                Invite your group to access the stream
              </p>
              {/* Skip to watch */}
              <button
                onClick={() => {
                  setShowGroupCodeModal(false);
                  router.push(`/user/events/live-stream?eventId=${selectedEvent?.id}&paid=true&inviteToken=${encodeURIComponent(groupShareCode)}`);
                }}
                style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#9ca3af', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                Skip — Watch Now <i className="bi bi-arrow-right" style={{ marginLeft: 4 }}></i>
              </button>
            </div>

            {/* Share Code */}
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 20 }}>
              <p style={{ color: '#FBBF24', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>Your Invite Code</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: '#fff', fontFamily: 'monospace' }}>{groupShareCode}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(groupShareCode); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#FBBF24', fontSize: 16 }}
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
                <p style={{ color: '#FBBF24', fontSize: 20, fontWeight: 800, margin: 0 }}>24 <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>hours</span></p>
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
                <span style={{ color: '#FBBF24', fontSize: 13, fontWeight: 600 }}>Group ({groupPeopleCount} people)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>Total Paid</span>
                <span style={{ color: '#10b981', fontSize: 13, fontWeight: 700 }}>{getPaymentFee().toLocaleString()} {selectedEvent?.streamFeeCurrencyAbbreviation || 'RWF'}</span>
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
                  <i className="bi bi-person-plus-fill" style={{ marginRight: 6, color: '#FBBF24' }}></i>
                  Invite Viewers
                </p>
                <span style={{ fontSize: 11, color: remainingInvites > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
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
                    onFocus={e => { e.currentTarget.style.borderColor = '#FBBF24'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  />
                  <button
                    onClick={handleSendInvite}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: inviteEmail.trim() ? '#F59E0B' : 'rgba(255,255,255,0.08)', color: inviteEmail.trim() ? '#1f2937' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
                  >
                    {inviteLoading ? '...' : 'Send'}
                  </button>
                </div>
              )}

              {inviteError && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{inviteError}</p>}
              {inviteSuccess && <p style={{ color: '#10b981', fontSize: 12, margin: '0 0 8px' }}><i className="bi bi-check-circle-fill" style={{ marginRight: 4 }}></i>{inviteSuccess}</p>}

              {/* Invited emails list */}
              {invitedEmails.length > 0 && (
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {invitedEmails.map((email, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < invitedEmails.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <i className="bi bi-envelope-check-fill" style={{ color: '#10b981', fontSize: 12 }}></i>
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

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setShowGroupCodeModal(false);
                  router.push(`/user/events/live-stream?eventId=${selectedEvent?.id}&paid=true&inviteToken=${encodeURIComponent(groupShareCode)}`);
                }}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #03969c, #027a7f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <i className="bi bi-play-circle"></i> Watch Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Auth Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(3,150,156,0.15)', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-x-lg"></i>
            </button>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #03969c, #027a7f)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
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
                  <button key={tab} onClick={() => { setAuthStep(tab); setAuthError(''); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', background: authStep === tab ? 'linear-gradient(135deg, #03969c, #027a7f)' : 'transparent', color: authStep === tab ? '#fff' : '#6b7280' }}>
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
                    <input type="text" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} placeholder="First name" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Last Name</label>
                    <input type="text" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} placeholder="Last name" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="your@email.com" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone (optional)</label>
                  <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="078XXXXXXX" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                  <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleAuthSignup()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleAuthSignup} disabled={authLoading || googleLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
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
                  <input type="text" value={otpValue} onChange={e => setOtpValue(e.target.value)} placeholder="Enter code" onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 8, fontWeight: 700 }} onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} />
                </div>
                <button onClick={handleVerifyOtp} disabled={authLoading} style={{ width: '100%', padding: '13px', background: authLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {authLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Verifying…</> : <><i className="bi bi-shield-check"></i> Verify</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
