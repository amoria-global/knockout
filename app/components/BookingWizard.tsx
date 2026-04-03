'use client';

import React, { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { getAuthToken, getRefreshToken } from '@/lib/api/client';
import { useGoogleLogin } from '@react-oauth/google';
import {
  getPhotographers,
  getPhotographerById,
  getCurrencies,
  getEventTypes,
  getBookedDates,
  type Photographer,
  type Currency,
  type EventType,
  type BookedDate,
} from '@/lib/APIs/public';
import { getPublicPhotographerPackages, type PublicPackage } from '@/lib/APIs/packages/get-packages/route';
import { createEvent } from '@/lib/APIs/events/create-event/route';
import { login } from '@/lib/APIs/auth/login/route';
import { signup } from '@/lib/APIs/auth/signup/route';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { googleAuth } from '@/lib/APIs/auth/google/route';
import { saveDraft, loadDraft, clearDraft, type BookingDraft } from '@/lib/utils/bookingDraft';

// ─── Types ───

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPhotographerId?: string;
  preselectedPackageId?: string;
}

interface QuickBrief {
  eventDate: string;
  eventLocation: string;
  budgetMin: number;
  budgetMax: number;
  inclusivityPrefs: string[];
}

interface EventDetails {
  title: string;
  description: string;
  eventType: string;
  startTime: string;
  endTime: string;
  guestCount: number | null;
  notes: string;
  // Coordinator-specific fields
  organizer: string;
  tags: string[];
  groupDiscount: number;
  venueName: string;
}

interface MilestoneConfig {
  option: 'full' | 'half' | 'thirty';
  milestones: { label: string; percentage: number; amount: number }[];
}

interface WizardState {
  currentSlide: number;
  quickBrief: QuickBrief | null;
  selectedPhotographerId: string | null;
  selectedPackageId: string | null;
  paymentMilestone: MilestoneConfig | null;
  eventDetails: EventDetails | null;
  isSubmitting: boolean;
  showAuthInline: boolean;
  showPhotographerPreview: string | null;
  bookingSuccess: boolean;
  createdEventId: string | null;
}

type WizardAction =
  | { type: 'SET_SLIDE'; slide: number }
  | { type: 'SET_QUICK_BRIEF'; data: QuickBrief }
  | { type: 'SET_SELECTED_PHOTOGRAPHER'; id: string }
  | { type: 'SET_SELECTED_PACKAGE'; id: string }
  | { type: 'SET_PAYMENT_MILESTONE'; data: MilestoneConfig }
  | { type: 'SET_EVENT_DETAILS'; data: EventDetails }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SHOW_AUTH'; value: boolean }
  | { type: 'SHOW_PREVIEW'; id: string | null }
  | { type: 'SET_SUCCESS'; eventId?: string }
  | { type: 'RESTORE_DRAFT'; draft: BookingDraft }
  | { type: 'RESET' };

const initialState: WizardState = {
  currentSlide: 0,
  quickBrief: null,
  selectedPhotographerId: null,
  selectedPackageId: null,
  paymentMilestone: null,
  eventDetails: null,
  isSubmitting: false,
  showAuthInline: false,
  showPhotographerPreview: null,
  bookingSuccess: false,
  createdEventId: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_SLIDE': return { ...state, currentSlide: action.slide };
    case 'SET_QUICK_BRIEF': return { ...state, quickBrief: action.data, currentSlide: 1 };
    case 'SET_SELECTED_PHOTOGRAPHER': return { ...state, selectedPhotographerId: action.id, currentSlide: 2 };
    case 'SET_SELECTED_PACKAGE': return { ...state, selectedPackageId: action.id, currentSlide: 3 };
    case 'SET_PAYMENT_MILESTONE': return { ...state, paymentMilestone: action.data, currentSlide: 4 };
    case 'SET_EVENT_DETAILS': return { ...state, eventDetails: action.data };
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.value };
    case 'SHOW_AUTH': return { ...state, showAuthInline: action.value };
    case 'SHOW_PREVIEW': return { ...state, showPhotographerPreview: action.id };
    case 'SET_SUCCESS': return { ...state, bookingSuccess: true, isSubmitting: false, createdEventId: action.eventId || null };
    case 'RESTORE_DRAFT': return {
      ...state,
      currentSlide: action.draft.currentSlide,
      quickBrief: action.draft.quickBrief,
      selectedPhotographerId: action.draft.selectedPhotographerId,
      selectedPackageId: action.draft.selectedPackageId,
      paymentMilestone: action.draft.paymentMilestone,
      eventDetails: action.draft.eventDetails,
    };
    case 'RESET': return initialState;
    default: return state;
  }
}

// ─── Styles ───

const ACCENT = '#083A85';
const ACCENT_DARK = '#0a4da3';
const OVERLAY_BG = 'rgba(0,0,0,0.45)';
const PANEL_BG = '#ffffff';
const INPUT_BG = '#f9fafb';
const INPUT_BORDER = '#e5e7eb';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#40444d';
const TEXT_MUTED = '#6b7280';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: INPUT_BG,
  border: `1px solid ${INPUT_BORDER}`, borderRadius: 9, color: TEXT_PRIMARY,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  width: '100%', padding: '13px', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
  border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 20px', background: '#ffffff',
  border: '1px solid #bab8b8', borderRadius: 10,
  color: TEXT_SECONDARY, fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const INCLUSIVITY_OPTIONS = [
  'Live Stream', 'Photobook', 'Video Coverage', 'Drone', 'Same-Day Edits', 'Photo Booth',
];


// ─── Main Component ───

const BookingWizard: React.FC<BookingWizardProps> = ({
  isOpen, onClose, preselectedPhotographerId, preselectedPackageId,
}) => {
  const { isAuthenticated, login: authLogin, user } = useAuth();
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const draftSavedRef = useRef(false);

  // ── Data state ──
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [photographersLoading, setPhotographersLoading] = useState(false);
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [previewPhotographer, setPreviewPhotographer] = useState<Photographer | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBookedDates, setPreviewBookedDates] = useState<BookedDate[]>([]);
  const [submitError, setSubmitError] = useState('');

  // ── Slide 1 local state ──
  const [briefDate, setBriefDate] = useState('');
  const [briefLocation, setBriefLocation] = useState('');
  const [briefBudgetMin, setBriefBudgetMin] = useState<number>(0);
  const [briefBudgetMax, setBriefBudgetMax] = useState<number>(10000);
  const [briefPrefs, setBriefPrefs] = useState<string[]>([]);
  const [briefCurrency, setBriefCurrency] = useState('RWF');
  const [briefError, setBriefError] = useState('');

  // ── Slide 3 extras ──
  const [extraPhotos, setExtraPhotos] = useState(0);
  const [extraVideos, setExtraVideos] = useState(0);

  // ── Slide 4 milestone ──
  const [milestoneOption, setMilestoneOption] = useState<'full' | 'half' | 'thirty'>('half');

  // ── Slide 5 local state ──
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtType, setEvtType] = useState('');
  const [evtStartTime, setEvtStartTime] = useState('');
  const [evtEndTime, setEvtEndTime] = useState('');
  const [evtGuests, setEvtGuests] = useState<number | ''>('');
  const [evtNotes, setEvtNotes] = useState('');
  const [evtError, setEvtError] = useState('');
  // Coordinator-specific fields
  const [evtOrganizer, setEvtOrganizer] = useState('');
  const [evtTags, setEvtTags] = useState<string[]>([]);
  const [evtTagInput, setEvtTagInput] = useState('');
  const [evtGroupDiscount, setEvtGroupDiscount] = useState<number | ''>('');
  const [evtVenueName, setEvtVenueName] = useState('');

  // Detect if user is a coordinator
  const isCoordinator = user?.customerType?.toLowerCase().includes('coordinator') || false;

  // ── Auth inline state ──
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'otp'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirst, setSignupFirst] = useState('');
  const [signupLast, setSignupLast] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [otpCustomerId, setOtpCustomerId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Fetch currencies + event types on mount ──
  useEffect(() => {
    if (!isOpen) return;
    getCurrencies().then(r => { if (r.success && Array.isArray(r.data)) setCurrencies(r.data); }).catch(() => {});
    getEventTypes().then(r => { if (r.success && Array.isArray(r.data)) setEventTypes(r.data); }).catch(() => {});
  }, [isOpen]);

  // ── Draft restoration ──
  useEffect(() => {
    if (!isOpen) return;
    if (preselectedPhotographerId) {
      // Skip to package selection for pre-selected photographer
      dispatch({ type: 'SET_SELECTED_PHOTOGRAPHER', id: preselectedPhotographerId });
      if (preselectedPackageId) {
        dispatch({ type: 'SET_SELECTED_PACKAGE', id: preselectedPackageId });
      }
      return;
    }
    loadDraft().then(draft => {
      if (draft) {
        dispatch({ type: 'RESTORE_DRAFT', draft });
        // Restore local form state from draft
        if (draft.quickBrief) {
          setBriefDate(draft.quickBrief.eventDate);
          setBriefLocation(draft.quickBrief.eventLocation);
          setBriefBudgetMin(draft.quickBrief.budgetMin);
          setBriefBudgetMax(draft.quickBrief.budgetMax);
          setBriefPrefs(draft.quickBrief.inclusivityPrefs);
        }
        if (draft.eventDetails) {
          setEvtTitle(draft.eventDetails.title);
          setEvtDescription(draft.eventDetails.description);
          setEvtType(draft.eventDetails.eventType);
          setEvtStartTime(draft.eventDetails.startTime);
          setEvtEndTime(draft.eventDetails.endTime);
          setEvtGuests(draft.eventDetails.guestCount ?? '');
          setEvtNotes(draft.eventDetails.notes);
          // Coordinator fields
          if (draft.eventDetails.organizer) setEvtOrganizer(draft.eventDetails.organizer);
          if (draft.eventDetails.tags) setEvtTags(draft.eventDetails.tags);
          if (draft.eventDetails.groupDiscount) setEvtGroupDiscount(draft.eventDetails.groupDiscount);
          if (draft.eventDetails.venueName) setEvtVenueName(draft.eventDetails.venueName);
        }
        if (draft.paymentMilestone) {
          setMilestoneOption(draft.paymentMilestone.option);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Fetch packages when photographer selected ──
  useEffect(() => {
    if (!state.selectedPhotographerId) return;
    setPackagesLoading(true);
    getPublicPhotographerPackages(state.selectedPhotographerId).then(res => {
      if (res.success && res.data) {
        const raw = res.data as unknown;
        const pkgs = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.data
          ? ((raw as Record<string, unknown>).data as PublicPackage[]) : [];
        setPackages((pkgs as PublicPackage[]).filter(p => p.isActive));
      }
    }).catch(() => {}).finally(() => setPackagesLoading(false));
  }, [state.selectedPhotographerId]);

  // ── Fetch photographer preview ──
  useEffect(() => {
    if (!state.showPhotographerPreview) { setPreviewPhotographer(null); return; }
    setPreviewLoading(true);
    getPhotographerById(state.showPhotographerPreview).then(res => {
      if (res.success && res.data) {
        const raw = res.data as unknown as Record<string, unknown>;
        setPreviewPhotographer((raw?.data ? raw.data : res.data) as Photographer);
      }
    }).catch(() => {}).finally(() => setPreviewLoading(false));
    // Fetch booked dates (next 60 days)
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 60);
    getBookedDates({
      photographerId: state.showPhotographerPreview,
      from: today.toISOString().split('T')[0],
      to: future.toISOString().split('T')[0],
    }).then(res => {
      if (res.success && Array.isArray(res.data)) setPreviewBookedDates(res.data);
    }).catch(() => {});
  }, [state.showPhotographerPreview]);

  // ── Persist draft on slide change or close ──
  const persistDraft = useCallback(() => {
    const draft: BookingDraft = {
      currentSlide: state.currentSlide,
      quickBrief: state.quickBrief,
      selectedPhotographerId: state.selectedPhotographerId,
      selectedPackageId: state.selectedPackageId,
      paymentMilestone: state.paymentMilestone,
      eventDetails: state.eventDetails,
      updatedAt: Date.now(),
    };
    saveDraft(draft);
  }, [state]);

  // ── Body scroll lock ──
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!state.bookingSuccess) persistDraft();
    onClose();
  };

  // ── Selected package data helper ──
  const selectedPkg = packages.find(p => p.id === state.selectedPackageId);
  const pkgBasePrice = selectedPkg?.price || 0;
  const extraPhotoPrice = selectedPkg?.extraPhotoPrice || 0;
  const extraVideoPrice = selectedPkg?.extraVideoPrice || 0;
  const totalPrice = pkgBasePrice + (extraPhotos * extraPhotoPrice) + (extraVideos * extraVideoPrice);
  const currencySymbol = selectedPkg?.currencySymbol || selectedPkg?.currencyAbbreviation || 'RWF';

  // ── Milestone computation ──
  const computeMilestones = (opt: 'full' | 'half' | 'thirty'): MilestoneConfig => {
    const splits: Record<string, { label: string; pct: number }[]> = {
      full: [{ label: 'Full payment upfront', pct: 100 }],
      half: [{ label: 'Deposit (50%)', pct: 50 }, { label: 'After delivery (50%)', pct: 50 }],
      thirty: [{ label: 'Deposit (30%)', pct: 30 }, { label: 'After delivery (70%)', pct: 70 }],
    };
    return {
      option: opt,
      milestones: splits[opt].map(s => ({ label: s.label, percentage: s.pct, amount: Math.round(totalPrice * s.pct / 100) })),
    };
  };

  // ─── SLIDE 1: Quick Brief ───

  const handleBriefNext = () => {
    if (!briefDate) { setBriefError('Please select an event date'); return; }
    if (!briefLocation.trim()) { setBriefError('Please enter event location'); return; }
    setBriefError('');
    const brief: QuickBrief = {
      eventDate: briefDate, eventLocation: briefLocation.trim(),
      budgetMin: briefBudgetMin, budgetMax: briefBudgetMax,
      inclusivityPrefs: briefPrefs,
    };
    dispatch({ type: 'SET_QUICK_BRIEF', data: brief });
    // Fetch matching photographers
    setPhotographersLoading(true);
    getPhotographers({ availableOn: briefDate, location: briefLocation.trim(), size: 50 }).then(res => {
      if (res.success && res.data) {
        const raw = res.data as unknown as Record<string, unknown>;
        const list = (raw?.content || raw?.data || res.data) as Photographer[];
        setPhotographers(Array.isArray(list) ? list : []);
      }
    }).catch(() => {}).finally(() => setPhotographersLoading(false));
  };

  // ─── SLIDE 2: Best Matches ───

  // Client-side filter by budget
  const filteredPhotographers = photographers.filter(p => {
    const pkgs = p.packages || [];
    if (pkgs.length === 0) return true;
    const minPrice = Math.min(...pkgs.map(pk => pk.price || 0));
    return minPrice <= (state.quickBrief?.budgetMax || Infinity);
  });

  const handleSelectPhotographer = (id: string) => {
    dispatch({ type: 'SET_SELECTED_PHOTOGRAPHER', id });
  };

  // ─── SLIDE 3: Package Selection ───

  const TIER_ORDER: Record<string, number> = { Essential: 1, Custom: 2, Premium: 3 };
  const sortedPackages = [...packages].sort((a, b) =>
    (TIER_ORDER[a.packageName] || 99) - (TIER_ORDER[b.packageName] || 99)
  );

  const tierColors: Record<string, string> = {
    Essential: '#22D3EE', Custom: '#FBBF24', Premium: '#8B5CF6',
  };

  const handleSelectPackage = (id: string) => {
    dispatch({ type: 'SET_SELECTED_PACKAGE', id });
  };

  // ─── SLIDE 4: Payment Milestone ───

  const handleMilestoneNext = () => {
    const milestone = computeMilestones(milestoneOption);
    dispatch({ type: 'SET_PAYMENT_MILESTONE', data: milestone });
    // Gate: require auth before event details so we can detect coordinator role
    if (!isAuthenticated) {
      dispatch({ type: 'SHOW_AUTH', value: true });
    }
  };

  // ─── SLIDE 5: Event Details + Submit ───

  const handleCompleteBooking = async () => {
    if (!evtTitle.trim()) { setEvtError('Please enter an event title'); return; }
    if (!evtStartTime) { setEvtError('Please select a start time'); return; }
    if (isCoordinator && !evtOrganizer.trim()) { setEvtError('Please enter the organizer name'); return; }
    setEvtError('');

    const details: EventDetails = {
      title: evtTitle.trim(), description: evtDescription.trim(),
      eventType: evtType, startTime: evtStartTime, endTime: evtEndTime,
      guestCount: typeof evtGuests === 'number' ? evtGuests : null, notes: evtNotes.trim(),
      organizer: evtOrganizer.trim(),
      tags: evtTags,
      groupDiscount: typeof evtGroupDiscount === 'number' ? evtGroupDiscount : 0,
      venueName: evtVenueName.trim(),
    };
    dispatch({ type: 'SET_EVENT_DETAILS', data: details });
    await submitBooking(details);
  };

  const submitBooking = async (details: EventDetails) => {
    dispatch({ type: 'SET_SUBMITTING', value: true });
    setSubmitError('');

    try {
      // Build location string — include venue name if provided
      const locationParts = [details.venueName, state.quickBrief?.eventLocation].filter(Boolean);
      const locationStr = locationParts.join(', ') || state.quickBrief?.eventLocation;

      const payload: Record<string, unknown> = {
        title: details.title,
        description: details.description,
        eventType: details.eventType,
        eventDate: state.quickBrief?.eventDate,
        startTime: details.startTime ? `${details.startTime}:00` : undefined,
        endTime: details.endTime ? `${details.endTime}:00` : undefined,
        location: locationStr,
        photographerId: state.selectedPhotographerId || undefined,
        packageId: state.selectedPackageId || undefined,
        guestCount: details.guestCount || undefined,
        notes: details.notes || undefined,
        price: totalPrice || undefined,
        priceCurrency: selectedPkg?.currencyAbbreviation || 'RWF',
        // Coordinator-specific fields
        ...(details.organizer ? { eventOrganizer: details.organizer } : {}),
        ...(details.tags.length > 0 ? { eventTags: details.tags.join(',') } : {}),
        ...(details.groupDiscount > 0 ? { groupDiscountPercentage: details.groupDiscount } : {}),
        ...(totalPrice ? { streamFee: totalPrice } : {}),
        eventVisibility: 'PUBLIC',
        // Escrow percentage from milestone selection
        ...(state.paymentMilestone ? {
          escrowPercentage: state.paymentMilestone.option === 'full' ? 100
            : state.paymentMilestone.option === 'half' ? 50 : 30,
        } : {}),
      };

      const res = await createEvent(payload as Parameters<typeof createEvent>[0]);
      if (res.success) {
        await clearDraft();
        const eventId = (res.data as unknown as Record<string, unknown>)?.data
          ? ((res.data as unknown as Record<string, unknown>).data as Record<string, unknown>)?.id as string
          : (res.data as unknown as Record<string, unknown>)?.id as string;
        dispatch({ type: 'SET_SUCCESS', eventId: eventId || undefined });
      } else {
        setSubmitError(res.error || 'Failed to create booking. Please try again.');
        dispatch({ type: 'SET_SUBMITTING', value: false });
      }
    } catch {
      setSubmitError('Connection error. Please try again.');
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  // ─── AUTH HANDLERS ───

  const handleAuthLogin = async () => {
    if (!loginEmail || !loginPassword) { setAuthError('Please fill in all fields'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      if (res.success && res.data?.token) {
        const d = res.data;
        await authLogin({
          id: d.id || d.customerId || '', firstName: d.firstName || '', lastName: d.lastName || '',
          email: d.email || loginEmail, phone: d.phone || '', customerId: d.customerId || '',
          customerType: d.customerType || 'Client',
        }, d.token!);
        dispatch({ type: 'SHOW_AUTH', value: false });
      } else {
        setAuthError(res.data?.message || res.error || 'Incorrect email or password.');
      }
    } catch { setAuthError('Connection error. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  const handleAuthSignup = async () => {
    if (!signupFirst || !signupLast || !signupEmail || !signupPhone || !signupPassword) {
      setAuthError('Please fill in all fields'); return;
    }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await signup({
        firstName: signupFirst, lastName: signupLast, email: signupEmail,
        phone: signupPhone, password: signupPassword, customerType: 'Client',
      });
      if (res.success && res.data) {
        setOtpCustomerId(res.data.customerId || '');
        setAuthStep('otp'); setAuthError('');
      } else {
        const errMsg = res.data?.message || res.error || 'Could not create account.';
        if (errMsg.toLowerCase().includes('duplicate') || errMsg.toLowerCase().includes('already')) {
          setAuthError('This email is already registered. Please log in instead.');
        } else {
          setAuthError(errMsg);
        }
      }
    } catch { setAuthError('Connection error.'); }
    finally { setAuthLoading(false); }
  };

  const handleAuthOtp = async () => {
    if (!otpValue || otpValue.length < 4) { setAuthError('Please enter the verification code.'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await verifyOtp({ customerId: otpCustomerId, otp: parseInt(otpValue, 10) });
      if (res.success && res.data?.action === 1) {
        const loginRes = await login({ email: signupEmail, password: signupPassword });
        if (loginRes.success && loginRes.data?.token) {
          const d = loginRes.data;
          await authLogin({
            id: d.id || d.customerId || '', firstName: d.firstName || signupFirst,
            lastName: d.lastName || signupLast, email: d.email || signupEmail,
            phone: d.phone || signupPhone, customerId: d.customerId || '',
            customerType: d.customerType || 'Client',
          }, d.token!);
          dispatch({ type: 'SHOW_AUTH', value: false });
        } else {
          setAuthError('Verified! Please switch to Log In.');
        }
      } else {
        setAuthError(res.data?.message || res.error || 'Incorrect or expired code.');
      }
    } catch { setAuthError('Connection error.'); }
    finally { setAuthLoading(false); }
  };

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoading(true); setAuthError('');
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      if (!infoRes.ok) throw new Error();
      const info = await infoRes.json();
      const res = await googleAuth({
        email: info.email, firstName: info.given_name || '', lastName: info.family_name || '',
        customerType: 'Client',
      });
      if (res.success && res.data?.token) {
        const d = res.data;
        await authLogin({
          id: d.id || d.customerId || '', firstName: d.firstName || info.given_name || '',
          lastName: d.lastName || info.family_name || '', email: d.email || info.email || '',
          phone: d.phone || '', customerId: d.customerId || d.id || '',
          customerType: d.customerType || 'Client',
        }, d.token!);
        dispatch({ type: 'SHOW_AUTH', value: false });
      } else {
        setAuthError(res.data?.message || 'Google sign-in failed.');
      }
    } catch { setAuthError('Google sign-in failed.'); }
    finally { setGoogleLoading(false); }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => { setGoogleLoading(false); setAuthError('Google sign-in cancelled.'); },
  });

  // ─── Helper: profile image ───
  const getProfileImg = (p: Photographer) => {
    const pic = p.profilePicture;
    if (!pic || pic === 'null' || pic === 'undefined') return null;
    if (pic.startsWith('http')) return pic;
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
    return `${base}/${pic.replace(/^\//, '')}`;
  };

  if (!isOpen) return null;

  // ─── RENDER ───

  return (
    <>
      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: OVERLAY_BG, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{
          width: '100%', maxWidth: 620, maxHeight: '92vh', background: PANEL_BG,
          border: '1px solid #e5e7eb', borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)', position: 'relative',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Close button */}
          <button onClick={handleClose} style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10, width: 36, height: 36,
            borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb',
            color: '#6b7280', fontSize: 16, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="bi bi-x-lg"></i>
          </button>


          {/* Content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>

            {/* ── Success state ── */}
            {state.bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <i className="bi bi-check-lg" style={{ fontSize: 32, color: '#fff' }}></i>
                </div>
                <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Booking Created!</h2>
                <p style={{ color: '#40444d', fontSize: 14, margin: '0 0 24px' }}>
                  Your event has been created and the photographer has been notified. You can manage your booking from the dashboard.
                </p>
                <button onClick={() => {
                  if (state.createdEventId) {
                    window.location.href = `/user/events/view-event?id=${state.createdEventId}`;
                  } else {
                    onClose();
                  }
                }} style={btnPrimary}>
                  View Event <i className="bi bi-arrow-right"></i>
                </button>
              </div>

            /* ── Auth inline overlay ── */
            ) : state.showAuthInline ? (
              <div>
                <button onClick={() => dispatch({ type: 'SHOW_AUTH', value: false })} style={{ ...btnSecondary, marginBottom: 16, padding: '8px 16px', fontSize: 13 }}>
                  <i className="bi bi-arrow-left" style={{ marginRight: 6 }}></i> Back
                </button>
                <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: '0 0 4px', textAlign: 'center' }}>
                  {authStep === 'otp' ? 'Verify Email' : authStep === 'signup' ? 'Create Account' : 'Log In'}
                </h3>
                <p style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', margin: '0 0 20px' }}>
                  Sign in to complete your booking
                </p>

                {authError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
                    {authError}
                  </div>
                )}

                {authStep === 'login' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleAuthLogin()} />
                    <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleAuthLogin()} />
                    <button onClick={handleAuthLogin} disabled={authLoading} style={{ ...btnPrimary, opacity: authLoading ? 0.6 : 1 }}>
                      {authLoading ? 'Logging in...' : 'Log In'}
                    </button>
                    <button onClick={() => googleLogin()} disabled={googleLoading} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center' as const, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                      {googleLoading ? 'Connecting...' : 'Continue with Google'}
                    </button>
                    <p style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', margin: 0 }}>
                      No account? <button onClick={() => { setAuthStep('signup'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>Sign Up</button>
                    </p>
                  </div>
                )}

                {authStep === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="text" value={signupFirst} onChange={e => setSignupFirst(e.target.value)} placeholder="First name" style={inputStyle} />
                      <input type="text" value={signupLast} onChange={e => setSignupLast(e.target.value)} placeholder="Last name" style={inputStyle} />
                    </div>
                    <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="Email" style={inputStyle} />
                    <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="Phone (078...)" style={inputStyle} />
                    <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Password" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleAuthSignup()} />
                    <button onClick={handleAuthSignup} disabled={authLoading} style={{ ...btnPrimary, opacity: authLoading ? 0.6 : 1 }}>
                      {authLoading ? 'Creating account...' : 'Sign Up'}
                    </button>
                    <p style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', margin: 0 }}>
                      Already have an account? <button onClick={() => { setAuthStep('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>Log In</button>
                    </p>
                  </div>
                )}

                {authStep === 'otp' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ color: TEXT_SECONDARY, fontSize: 13, margin: 0 }}>Enter the verification code sent to {signupEmail}</p>
                    <input type="text" value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter code" style={{ ...inputStyle, textAlign: 'center' as const, letterSpacing: 8, fontSize: 20 }} onKeyDown={e => e.key === 'Enter' && handleAuthOtp()} />
                    <button onClick={handleAuthOtp} disabled={authLoading} style={{ ...btnPrimary, opacity: authLoading ? 0.6 : 1 }}>
                      {authLoading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  </div>
                )}
              </div>

            /* ── SLIDE 0: Quick Brief ── */
            ) : state.currentSlide === 0 ? (
              <div>
                <h3 style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Tell us about your event</h3>
                <p style={{ color: TEXT_MUTED, fontSize: 13, margin: '0 0 20px' }}>We&apos;ll find the best photographers for you</p>

                {briefError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{briefError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Event Date *</label>
                    <input type="date" value={briefDate} onChange={e => setBriefDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Event Location *</label>
                    <input type="text" value={briefLocation} onChange={e => setBriefLocation(e.target.value)} placeholder="e.g. Kigali, Rwanda" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Budget Range</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={briefCurrency} onChange={e => setBriefCurrency(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 90, flex: '0 0 auto', appearance: 'auto' as const }}>
                        {currencies.length > 0 ? currencies.map(c => (
                          <option key={c.id} value={c.code || c.symbol}>{c.code || c.symbol}</option>
                        )) : (
                          <option value="RWF">RWF</option>
                        )}
                      </select>
                      <input type="number" value={briefBudgetMin || ''} onChange={e => setBriefBudgetMin(parseInt(e.target.value) || 0)} placeholder="Min" style={{ ...inputStyle, flex: 1 }} />
                      <input type="number" value={briefBudgetMax || ''} onChange={e => setBriefBudgetMax(parseInt(e.target.value) || 10000)} placeholder="Max" style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>What&apos;s important to you?</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {INCLUSIVITY_OPTIONS.map(opt => {
                        const sel = briefPrefs.includes(opt);
                        return (
                          <button key={opt} onClick={() => setBriefPrefs(prev => sel ? prev.filter(p => p !== opt) : [...prev, opt])} style={{
                            padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            background: sel ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#f9fafb',
                            border: sel ? 'none' : `1px solid ${INPUT_BORDER}`, color: sel ? '#fff' : TEXT_SECONDARY,
                            transition: 'all 0.2s',
                          }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={handleBriefNext} style={{ ...btnPrimary, marginTop: 8 }}>
                    Get Best For You <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>

            /* ── SLIDE 1: Best Matches ── */
            ) : state.currentSlide === 1 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 0 })} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 13 }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Best Matches</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>{filteredPhotographers.length} photographer{filteredPhotographers.length !== 1 ? 's' : ''} found</p>
                  </div>
                </div>

                {photographersLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: ACCENT, borderRadius: '50%', animation: 'bwSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Finding photographers...</p>
                  </div>
                ) : filteredPhotographers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <i className="bi bi-camera" style={{ fontSize: 36, color: TEXT_MUTED }}></i>
                    <p style={{ color: TEXT_SECONDARY, fontSize: 14, marginTop: 12 }}>No photographers match your criteria.</p>
                    <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 0 })} style={{ ...btnSecondary, marginTop: 12 }}>Adjust Criteria</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {filteredPhotographers.map(p => {
                      const img = getProfileImg(p);
                      const minPrice = p.packages && p.packages.length > 0
                        ? Math.min(...p.packages.map(pk => pk.price || 0))
                        : null;
                      return (
                        <div key={p.id} style={{
                          background: '#f9fafb', border: `1px solid ${INPUT_BORDER}`,
                          borderRadius: 14, padding: 16, transition: 'border-color 0.2s',
                        }}>
                          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                              {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.firstName} {p.lastName}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <i className="bi bi-star-fill" style={{ color: '#FBBF24', fontSize: 11 }}></i>
                                <span style={{ color: TEXT_MUTED, fontSize: 12 }}>{p.rating?.toFixed(1) || '—'}</span>
                                {p.address && <span style={{ color: TEXT_MUTED, fontSize: 12 }}> · {p.address}</span>}
                              </div>
                              {minPrice !== null && (
                                <p style={{ color: ACCENT, fontSize: 12, fontWeight: 600, margin: '4px 0 0' }}>
                                  From {minPrice.toLocaleString()} {p.packages?.[0]?.currencyAbbreviation || ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => dispatch({ type: 'SHOW_PREVIEW', id: p.id })} style={{ ...btnSecondary, flex: 1, fontSize: 12, padding: '8px 0', textAlign: 'center' as const }}>
                              <i className="bi bi-eye" style={{ marginRight: 4 }}></i> Preview
                            </button>
                            <button onClick={() => handleSelectPhotographer(p.id)} style={{
                              flex: 1, padding: '8px 0', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                              border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                              Select
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            /* ── SLIDE 2: Package Selection ── */
            ) : state.currentSlide === 2 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 1 })} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 13 }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Select a Package</h3>
                </div>

                {packagesLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: ACCENT, borderRadius: '50%', animation: 'bwSpin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : packages.length === 0 ? (
                  <p style={{ color: TEXT_SECONDARY, fontSize: 14, textAlign: 'center', padding: 40 }}>No packages available for this photographer.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {sortedPackages.map(pkg => {
                      const color = tierColors[pkg.packageName] || ACCENT;
                      const isSelected = state.selectedPackageId === pkg.id;
                      return (
                        <div key={pkg.id} style={{
                          background: isSelected ? '#eff6ff' : '#f9fafb',
                          border: `1px solid ${isSelected ? ACCENT : INPUT_BORDER}`, borderRadius: 14, padding: 18,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }} onClick={() => handleSelectPackage(pkg.id)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: color }}>
                                {pkg.packageName}
                              </span>
                              {pkg.hasLiveStream && <span style={{ fontSize: 11, color: '#ef4444' }}><i className="bi bi-broadcast"></i> Live</span>}
                            </div>
                            <span style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700 }}>
                              {pkg.currencySymbol || pkg.currencyAbbreviation || ''}{pkg.price.toLocaleString()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 10, fontSize: 12, color: TEXT_SECONDARY }}>
                            <span><i className="bi bi-clock" style={{ marginRight: 4 }}></i>{pkg.durationHours}h</span>
                            {pkg.includedPhotos && <span><i className="bi bi-image" style={{ marginRight: 4 }}></i>{pkg.includedPhotos} photos</span>}
                            {pkg.includedVideos && <span><i className="bi bi-camera-video" style={{ marginRight: 4 }}></i>{pkg.includedVideos} videos</span>}
                            {pkg.deliveryDays && <span><i className="bi bi-calendar-check" style={{ marginRight: 4 }}></i>{pkg.deliveryDays}d delivery</span>}
                          </div>

                          {pkg.features?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12 }}>
                              {pkg.features.sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 6).map((f, fi) => (
                                <span key={fi} style={{ color: f.isIncluded ? '#10b981' : TEXT_MUTED }}>
                                  <i className={`bi bi-${f.isIncluded ? 'check' : 'x'}`} style={{ marginRight: 3 }}></i>
                                  {f.featureName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Extras */}
                    {state.selectedPackageId && selectedPkg && (
                      <div style={{ background: '#f9fafb', border: `1px solid ${INPUT_BORDER}`, borderRadius: 14, padding: 16 }}>
                        <p style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, margin: '0 0 10px' }}>Add Extras</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {selectedPkg.extraPhotoPrice ? (
                            <div style={{ flex: 1 }}>
                              <label style={{ color: TEXT_MUTED, fontSize: 12, display: 'block', marginBottom: 4 }}>Extra Photos ({selectedPkg.currencyAbbreviation || ''}{selectedPkg.extraPhotoPrice}/ea)</label>
                              <input type="number" min={0} value={extraPhotos || ''} onChange={e => setExtraPhotos(parseInt(e.target.value) || 0)} style={inputStyle} />
                            </div>
                          ) : null}
                          {selectedPkg.extraVideoPrice ? (
                            <div style={{ flex: 1 }}>
                              <label style={{ color: TEXT_MUTED, fontSize: 12, display: 'block', marginBottom: 4 }}>Extra Videos ({selectedPkg.currencyAbbreviation || ''}{selectedPkg.extraVideoPrice}/ea)</label>
                              <input type="number" min={0} value={extraVideos || ''} onChange={e => setExtraVideos(parseInt(e.target.value) || 0)} style={inputStyle} />
                            </div>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                          <span style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: 600 }}>Total</span>
                          <span style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700 }}>{currencySymbol}{totalPrice.toLocaleString()}</span>
                        </div>
                        <button onClick={() => handleSelectPackage(state.selectedPackageId!)} style={{ ...btnPrimary, marginTop: 14 }}>
                          Continue <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            /* ── SLIDE 3: Payment Milestone ── */
            ) : state.currentSlide === 3 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 2 })} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 13 }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Payment Plan</h3>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <p style={{ color: TEXT_MUTED, fontSize: 13, margin: '0 0 4px' }}>Total Amount</p>
                  <p style={{ color: TEXT_PRIMARY, fontSize: 28, fontWeight: 700, margin: 0 }}>{currencySymbol}{totalPrice.toLocaleString()}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {([
                    { key: 'full' as const, label: '100% Upfront', desc: 'Pay everything now' },
                    { key: 'half' as const, label: '50 / 50 Split', desc: '50% deposit, 50% after delivery' },
                    { key: 'thirty' as const, label: '30 / 70 Split', desc: '30% deposit, 70% after delivery' },
                  ]).map(opt => {
                    const sel = milestoneOption === opt.key;
                    return (
                      <button key={opt.key} onClick={() => setMilestoneOption(opt.key)} style={{
                        padding: '14px 16px', background: sel ? '#eff6ff' : '#f9fafb',
                        border: `1px solid ${sel ? ACCENT : INPUT_BORDER}`, borderRadius: 12,
                        cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: `2px solid ${sel ? ACCENT : INPUT_BORDER}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {sel && <div style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT }} />}
                        </div>
                        <div>
                          <p style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: 600, margin: 0 }}>{opt.label}</p>
                          <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '2px 0 0' }}>{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Milestone preview */}
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  {computeMilestones(milestoneOption).milestones.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < computeMilestones(milestoneOption).milestones.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? ACCENT : TEXT_MUTED }} />
                        <span style={{ color: TEXT_SECONDARY, fontSize: 13 }}>{m.label}</span>
                      </div>
                      <span style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: 600 }}>{currencySymbol}{m.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <button onClick={handleMilestoneNext} style={btnPrimary}>
                  Continue to Event Details <i className="bi bi-arrow-right"></i>
                </button>
              </div>

            /* ── SLIDE 4: Event Details ── */
            ) : state.currentSlide === 4 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 3 })} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 13 }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Event Details</h3>
                </div>

                {evtError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{evtError}</div>}
                {submitError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{submitError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Event Title *</label>
                    <input type="text" value={evtTitle} onChange={e => setEvtTitle(e.target.value)} placeholder="e.g. Sarah & John's Wedding" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Event Type</label>
                    <select value={evtType} onChange={e => setEvtType(e.target.value)} style={{ ...inputStyle, appearance: 'auto' as const }}>
                      <option value="">Select type</option>
                      {eventTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</label>
                    <textarea value={evtDescription} onChange={e => setEvtDescription(e.target.value)} placeholder="Tell the photographer about your event..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Start Time *</label>
                      <input type="time" value={evtStartTime} onChange={e => setEvtStartTime(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>End Time</label>
                      <input type="time" value={evtEndTime} onChange={e => setEvtEndTime(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Guest Count</label>
                    <input type="number" min={1} value={evtGuests} onChange={e => setEvtGuests(parseInt(e.target.value) || '')} placeholder="Expected number of guests" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Venue Name</label>
                    <input type="text" value={evtVenueName} onChange={e => setEvtVenueName(e.target.value)} placeholder="e.g. Kigali Convention Centre" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Special Requirements</label>
                    <textarea value={evtNotes} onChange={e => setEvtNotes(e.target.value)} placeholder="Any special requests or notes..." rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  </div>

                  {/* Coordinator-specific fields */}
                  {isCoordinator && (
                    <>
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, marginTop: 4 }}>
                        <p style={{ color: ACCENT, fontSize: 12, fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                          <i className="bi bi-person-badge" style={{ marginRight: 6 }}></i>Coordinator Fields
                        </p>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Organizer Name *</label>
                        <input type="text" value={evtOrganizer} onChange={e => setEvtOrganizer(e.target.value)} placeholder="Event organizer name" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tags</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" value={evtTagInput} onChange={e => setEvtTagInput(e.target.value)} placeholder="Add a tag and press Enter" style={{ ...inputStyle, flex: 1 }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && evtTagInput.trim()) {
                                e.preventDefault();
                                if (!evtTags.includes(evtTagInput.trim())) {
                                  setEvtTags(prev => [...prev, evtTagInput.trim()]);
                                }
                                setEvtTagInput('');
                              }
                            }}
                          />
                        </div>
                        {evtTags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {evtTags.map((tag, i) => (
                              <span key={i} style={{ padding: '4px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, fontSize: 12, color: ACCENT, display: 'flex', alignItems: 'center', gap: 4 }}>
                                #{tag}
                                <button onClick={() => setEvtTags(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>
                                  <i className="bi bi-x"></i>
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Group Stream Discount (%)</label>
                        <input type="number" min={0} max={50} value={evtGroupDiscount} onChange={e => setEvtGroupDiscount(parseInt(e.target.value) || '')} placeholder="0-50" style={inputStyle} />
                        <p style={{ color: TEXT_MUTED, fontSize: 11, margin: '4px 0 0' }}>Discount for group stream access (0-50%)</p>
                      </div>
                    </>
                  )}

                  <button onClick={handleCompleteBooking} disabled={state.isSubmitting} style={{ ...btnPrimary, marginTop: 8, opacity: state.isSubmitting ? 0.6 : 1 }}>
                    {state.isSubmitting ? (
                      <><div style={{ width: 16, height: 16, border: '2px solid #d1d5db', borderTopColor: '#fff', borderRadius: '50%', animation: 'bwSpin 0.8s linear infinite' }} /> Creating Booking...</>
                    ) : (
                      <><i className="bi bi-check-circle-fill"></i> Complete Booking</>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Photographer Preview Overlay ── */}
      {state.showPhotographerPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: OVERLAY_BG, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{
            width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto',
            background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 20,
            padding: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', position: 'relative',
          }}>
            <button onClick={() => dispatch({ type: 'SHOW_PREVIEW', id: null })} style={{
              position: 'absolute', top: 14, right: 14, zIndex: 10, width: 36, height: 36,
              borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb',
              color: '#6b7280', fontSize: 16, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bi bi-x-lg"></i>
            </button>

            {previewLoading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: ACCENT, borderRadius: '50%', animation: 'bwSpin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : previewPhotographer ? (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                    {getProfileImg(previewPhotographer) && (
                      <img src={getProfileImg(previewPhotographer)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
                      {previewPhotographer.firstName} {previewPhotographer.lastName}
                    </h3>
                    {previewPhotographer.address && <p style={{ color: TEXT_MUTED, fontSize: 13, margin: '0 0 4px' }}><i className="bi bi-geo-alt" style={{ marginRight: 4 }}></i>{previewPhotographer.address}</p>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                      <span style={{ color: '#FBBF24' }}><i className="bi bi-star-fill" style={{ marginRight: 4 }}></i>{previewPhotographer.rating?.toFixed(1) || '—'}</span>
                      <span style={{ color: TEXT_SECONDARY }}>{previewPhotographer.completedEvents || 0} events</span>
                    </div>
                  </div>
                </div>

                {/* About */}
                {previewPhotographer.about && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>About</h4>
                    <p style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.5, margin: 0 }}>{previewPhotographer.about}</p>
                  </div>
                )}

                {/* Specialties */}
                {previewPhotographer.specialties && previewPhotographer.specialties.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>Specialties</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {previewPhotographer.specialties.map((s, i) => {
                        const name = typeof s === 'string' ? s : (s as unknown as Record<string, unknown>).name as string || '';
                        return <span key={i} style={{ padding: '4px 10px', background: '#f3f4f6', borderRadius: 12, fontSize: 11, color: TEXT_SECONDARY }}>{name}</span>;
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {previewPhotographer.reviews && previewPhotographer.reviews.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Reviews</h4>
                    {previewPhotographer.reviews.slice(0, 3).map((r, i) => (
                      <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {'★'.repeat(Math.round(r.rating || 0)).split('').map((_, si) => (
                            <i key={si} className="bi bi-star-fill" style={{ color: '#FBBF24', fontSize: 10 }}></i>
                          ))}
                        </div>
                        <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0, lineHeight: 1.4 }}>
                          {(r as unknown as Record<string, unknown>).review as string || (r as unknown as Record<string, unknown>).comment as string || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Booked dates note */}
                {previewBookedDates.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>Availability</h4>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>
                      {previewBookedDates.length} date{previewBookedDates.length !== 1 ? 's' : ''} booked in the next 60 days
                    </p>
                  </div>
                )}

                {/* Select button */}
                <button onClick={() => {
                  dispatch({ type: 'SHOW_PREVIEW', id: null });
                  handleSelectPhotographer(state.showPhotographerPreview!);
                }} style={{ ...btnPrimary, marginTop: 8 }}>
                  <i className="bi bi-check-circle-fill"></i> Select This Photographer
                </button>
              </div>
            ) : (
              <p style={{ color: TEXT_MUTED, textAlign: 'center', padding: 40 }}>Photographer not found.</p>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes bwSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default BookingWizard;
