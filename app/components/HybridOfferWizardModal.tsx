'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { confirmYear } from '../../lib/farFutureDate';
import InternationalPhoneInput, { type PhoneValue } from './phone/InternationalPhoneInput';
import { login } from '@/lib/APIs/auth/login/route';
import { signup } from '@/lib/APIs/auth/signup/route';
import { verifyOtp } from '@/lib/APIs/auth/verify-otp/route';
import { unverifiedLoginCustomerId } from '@/lib/auth/otp-resend';
import { useOtpResend } from '@/lib/auth/useOtpResend';
import OtpInput from '@/app/components/OtpInput';
import { useOtpRefusal } from '@/lib/auth/useOtpRefusal';
import { googleAuth } from '@/lib/APIs/auth/google/route';
import { useGoogleLogin } from '@react-oauth/google';
import {
  deleteHybridDraft,
  durationBetween,
  durationText,
  formatRwf,
  getHybridDraft,
  getHybridOptions,
  previewMatchCount,
  publishMatchRequest,
  saveHybridDraft,
  type HybridOptions,
  type LocationCoverage,
  type MatchPreviewResult,
  type PhotographerType,
} from '@/lib/hybrid/hybridBooking';
import {
  DEFAULT_OFFER_DRAFT,
  deserializeDraftOfferDescription,
  DIGITAL_DEADLINE_CUSTOM_OPTIONS,
  DIGITAL_DEADLINE_PRESETS,
  EDITING_STYLES,
  estimateOfferPriceRwf,
  EXPRESS_MAJOR_EVENT_MIN_BUDGET_RWF,
  formatCoverageModeLabel,
  formatDroneCapturingSummary,
  formatInstantWishesSummary,
  formatLiveStreamSummary,
  formatLongVideosSummary,
  formatOfferDeliverablesSummaryLines,
  formatPhotoAlbumSummary,
  formatPhotoBookSummary,
  formatSessionTypeLabel,
  formatShortVideosSummary,
  formatWallPortraitSummary,
  getDeadlineCalendarDays,
  getEventTypePresetsForClient,
  isOrganizationOnlyCategory,
  LONG_VIDEO_CUSTOM_OPTIONS,
  LONG_VIDEO_DURATIONS,
  LONG_VIDEO_QTY_PRESETS,
  paperDimensions,
  PHOTO_ALBUM_PRINTS,
  PHOTO_ALBUM_SIZES,
  PHOTO_BOOK_PHOTO_CUSTOM_OPTIONS,
  PHOTO_BOOK_PHOTO_PRESETS,
  PHOTO_BOOK_SIZES,
  PHOTO_CUSTOM_OPTIONS,
  PHOTO_QUANTITY_PRESETS,
  POPULAR_VENUES_BY_CITY,
  PRINT_COLLECTION_METHODS,
  PRINT_PRODUCTION_TIMES,
  PRINT_QTY_CUSTOM_OPTIONS,
  PRINT_QTY_PRESETS,
  serializeDraftOfferDescription,
  serializeOfferBrief,
  SHORT_VIDEO_CUSTOM_OPTIONS,
  SHORT_VIDEO_DURATIONS,
  SHORT_VIDEO_QTY_PRESETS,
  USAGE_RIGHTS,
  WALL_PORTRAIT_FRAMES,
  WALL_PORTRAIT_SIZES,
  type ClientEntityType,
  type DigitalCoverageMode,
  type EventSessionType,
  type HybridOfferDraft,
} from '@/lib/hybrid/offerBrief';
import {
  analyzePackagesForDraft,
  fetchAllPlatformPackagesForPricing,
  type AnalyzedPhotographerPackage,
} from '@/lib/hybrid/packagePricingAnalyzer';
import { getKnockoutApiBase, useLocationSearch, type LocationSuggestion } from '@/lib/hybrid/locationSearch';

export interface HybridOfferWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 'select' shows the 2-option BookingModeSelector (Browse vs Post Offer); 'session' starts directly at Indoor/Outdoor session selection. */
  initialStep?: 'select' | 'session' | 1;
  /** Called when the user selects "Browse Photographers" from the mode selector. */
  onChooseBrowse?: () => void;
}

type Step = 'select' | 'session' | 1 | 2 | 3 | 4 | 5 | 'auth' | 'done';

const STEP_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'EVENT DETAILS',
  2: 'COVERAGE & PRINT PRODUCTS',
  3: 'DELIVERY & BUDGET',
  4: 'RECOMMENDED PRICING',
  5: 'REVIEW & PUBLISH',
};

const BRAND_BLUE = '#083A85';
const BRAND_PINK = '#F20C8F';
const BRAND_SUCCESS = '#047857';
const TEXT_PRIMARY = '#0F172A';
const TEXT_SECONDARY = '#475569';
const TEXT_MUTED = '#64748B';
const BORDER_COLOR = '#E2E8F0';
const BG_CARD = '#FFFFFF';
const BG_SUBTLE = '#F8FAFC';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function nextWeekday(weekday: number, weeksAhead = 0): Date {
  const d = new Date();
  const diff = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff + weeksAhead * 7);
  return d;
}

function addDaysToIso(baseIso: string, daysToAdd: number): string {
  const base = baseIso ? new Date(`${baseIso}T00:00:00`) : new Date();
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  safeBase.setDate(safeBase.getDate() + daysToAdd);
  return isoDate(safeBase);
}

function formatWithCommas(val: string | number): string {
  const digits = String(val ?? '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

function parseNumericInput(val: string): number | undefined {
  const digits = (val || '').replace(/[^0-9]/g, '');
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

function timeSlots(step: number): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += step) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}

function PaperFormat({ sizeLabel, selected }: { sizeLabel: string; selected?: boolean }) {
  const dims = paperDimensions(sizeLabel);
  if (!dims) return null;
  const maxSide = 22;
  const ratio = dims.w / dims.h;
  const w = ratio >= 1 ? maxSide : Math.max(10, Math.round(maxSide * ratio));
  const h = ratio >= 1 ? Math.max(10, Math.round(maxSide / ratio)) : maxSide;
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: w,
        height: h,
        borderRadius: 3,
        border: `1.5px solid ${selected ? '#fff' : BRAND_BLUE}`,
        background: selected ? 'rgba(255,255,255,0.22)' : 'rgba(8,58,133,0.08)',
        flexShrink: 0,
      }}
    />
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1.5px solid ${BORDER_COLOR}`,
  background: BG_CARD,
  color: TEXT_PRIMARY,
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  outline: 'none',
};

/**
 * Complete mobile-parity Hybrid Event Offer Wizard for the website (`knockout`).
 * Includes:
 *   - BookingModeSelector ('select'): Browse Photographers vs Create Your Event Offer
 *   - Session setting ('session'): Indoor session (Studio session) vs Outdoor session (Outside studio session)
 *   - 5-step Event Offer Wizard (Event details, Coverage & print products, Delivery & budget, Recommended pricing, Review & publish)
 *   - Inline Sign-In / Sign-Up / Google Auth gate when publishing if not signed in
 *   - Direct redirection to Dashboard (`dashboard.connekyt.com/user/client/events/{eventId}?candidates=1`) to view accepted photographers and confirm & pay.
 */
export default function HybridOfferWizardModal({
  isOpen,
  onClose,
  initialStep = 'session',
  onChooseBrowse,
}: HybridOfferWizardModalProps) {
  const { isAuthenticated, user, login: authLogin } = useAuth();
  const [options, setOptions] = useState<HybridOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(initialStep);

  const [draft, setDraft] = useState<HybridOfferDraft>(() => ({
    ...DEFAULT_OFFER_DRAFT,
    date: isoDate(nextWeekday(6, 1)),
  }));

  const [showOtherEventTypes, setShowOtherEventTypes] = useState(false);
  const [showAdvancedStyle, setShowAdvancedStyle] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  const [venueFocused, setVenueFocused] = useState(false);
  const [deliveryAddrFocused, setDeliveryAddrFocused] = useState(false);

  const { results: venueSearchResults, loadingGoogle: loadingVenueGoogle } = useLocationSearch(
    draft.venue,
    draft.city,
    isOpen && step === 1 && venueFocused,
  );

  const { results: deliveryAddrSearchResults, loadingGoogle: loadingDeliveryGoogle } = useLocationSearch(
    draft.printDeliveryAddress,
    draft.city,
    isOpen && step === 3 && draft.printCollectionMethod === 'Deliver to my home address' && deliveryAddrFocused,
  );

  const [photographerType] = useState<PhotographerType>('ANY');
  const [specialty] = useState('ANY');
  const [coverage] = useState<LocationCoverage>('SAME_CITY');
  const [windowHours, setWindowHours] = useState(24);

  const [preview, setPreview] = useState<MatchPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [platformPackages, setPlatformPackages] = useState<AnalyzedPhotographerPackage[]>([]);
  const [analyzingPackagesPreloader, setAnalyzingPackagesPreloader] = useState(false);
  const [preloaderStageIndex, setPreloaderStageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [discardingDraft, setDiscardingDraft] = useState(false);
  const [resumePromptDraft, setResumePromptDraft] = useState<{
    id: string;
    step: 1 | 2 | 3 | 4 | 5;
    draft: HybridOfferDraft;
    updatedAt?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ eventId: string; invited: number; status: string } | null>(null);
  const createdEventIdRef = useRef<string | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);

  // Inline Auth states (when user clicks Publish while logged out)
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'otp'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signupFirst, setSignupFirst] = useState('');
  const [signupLast, setSignupLast] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhoneVal, setSignupPhoneVal] = useState<PhoneValue | null>(null);
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [otpCustomerId, setOtpCustomerId] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const otpResend = useOtpResend();
  const otpRefusal = useOtpRefusal();

  const updateDraft = useCallback((patch: Partial<HybridOfferDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  // Always reset scroll position to the top when advancing or returning between slides/steps
  useEffect(() => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollTop = 0;
    }
  }, [step, authStep]);

  // Load options
  useEffect(() => {
    if (!isOpen) return;
    getHybridOptions()
      .then((o) => {
        setOptions(o);
        setWindowHours(o.defaultMatchWindowHours);
        setOptionsError(null);
      })
      .catch((e) => setOptionsError(e?.message || 'Could not load the event options.'));
  }, [isOpen]);

  // Match eventTypeKey with backend eventTypes ID
  useEffect(() => {
    if (!options?.eventTypes?.length) return;
    const match =
      options.eventTypes.find((t) => t.name.toLowerCase() === draft.eventTypeKey.toLowerCase()) ||
      options.eventTypes.find((t) => t.name.toLowerCase().includes(draft.eventTypeKey.toLowerCase()));
    if (match && match.id !== draft.eventTypeId) {
      updateDraft({ eventTypeId: match.id });
    }
  }, [options, draft.eventTypeKey, draft.eventTypeId, updateDraft]);

  // Reset / check saved draft on open
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setResult(null);
    setResumePromptDraft(null);
    createdEventIdRef.current = null;
    setStep(initialStep);

    if (!isAuthenticated) return;
    let cancelled = false;
    getHybridDraft()
      .then((saved) => {
        if (cancelled || !saved || !saved.id) return;
        const restored = deserializeDraftOfferDescription(saved.description);
        if (restored) {
          setResumePromptDraft({
            id: saved.id,
            step: restored.step,
            draft: {
              ...restored.draft,
              date: saved.eventDate ? saved.eventDate.slice(0, 10) : restored.draft.date,
              startTime: saved.startTime ? saved.startTime.slice(0, 5) : restored.draft.startTime,
              endTime: saved.endTime ? saved.endTime.slice(0, 5) : restored.draft.endTime,
              city: saved.city || restored.draft.city,
              venue: saved.venue || restored.draft.venue,
            },
            updatedAt: saved.updatedAt,
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isOpen, initialStep, isAuthenticated]);

  const minutes = durationBetween(draft.startTime, draft.endTime);
  const slots = useMemo(() => timeSlots(options?.timeStepMinutes || 30), [options]);
  const cityInfo = options?.cities.find((c) => c.name === draft.city);
  const eventType = options?.eventTypes.find((t) => t.id === draft.eventTypeId);

  const clientCurrency = (options?.currency || 'RWF').toUpperCase();

  const packageAnalysis = useMemo(
    () => analyzePackagesForDraft(draft, minutes, platformPackages, clientCurrency),
    [draft, minutes, platformPackages, clientCurrency],
  );

  const clientEstimatedPricing = useMemo(
    () => ({
      low: packageAnalysis.low,
      recommended: packageAnalysis.recommended,
      priority: packageAnalysis.priority,
      isSmallEventTariff: (minutes || 360) / 60 < 7,
      isExpressMajorFloor: packageAnalysis.isExpressMajorFloor,
      minimumAllowedBudget: packageAnalysis.minimumAllowedBudget,
    }),
    [packageAnalysis, minutes],
  );

  const estimatedPricing = useMemo(() => {
    return clientEstimatedPricing;
  }, [clientEstimatedPricing]);

  const budgetRangePresets = useMemo(
    () =>
      clientEstimatedPricing.isExpressMajorFloor
        ? [
            { label: '7,000,000 – 8,500,000 RWF', min: 7000000, max: 8500000 },
            { label: '8,500,000 – 10,000,000 RWF', min: 8500000, max: 10000000 },
            { label: '10,000,000 – 15,000,000 RWF', min: 10000000, max: 15000000 },
            { label: '15,000,000+ RWF', min: 15000000, max: 25000000 },
          ]
        : [
            { label: 'Up to 100,000 RWF', min: 0, max: 100000 },
            { label: '100,000 – 200,000 RWF', min: 100000, max: 200000 },
            { label: '200,000 – 350,000 RWF', min: 200000, max: 350000 },
            { label: '350,000 – 600,000 RWF', min: 350000, max: 600000 },
            { label: '600,000 – 1,000,000 RWF', min: 600000, max: 1000000 },
            { label: '1,000,000+ RWF', min: 1000000, max: 2500000 },
          ],
    [clientEstimatedPricing.isExpressMajorFloor],
  );

  const clientBudgetNumbers = useMemo(() => {
    const min = parseNumericInput(draft.minBudgetInput);
    const max = parseNumericInput(draft.maxBudgetInput);
    return { min, max };
  }, [draft.minBudgetInput, draft.maxBudgetInput]);

  const effectiveBudget = useMemo((): { min?: number; max?: number } => {
    if (draft.pricingDecision === 'RECOMMENDED') {
      const target =
        draft.packageOption === 'WITHIN_BUDGET'
          ? estimatedPricing.low
          : draft.packageOption === 'PRIORITY'
            ? estimatedPricing.priority
            : estimatedPricing.recommended;
      return {
        min: Math.max(50000, Math.round((target * 0.9) / 10000) * 10000),
        max: target,
      };
    }
    return {
      min: clientBudgetNumbers.min,
      max: clientBudgetNumbers.max ?? clientEstimatedPricing.recommended,
    };
  }, [
    draft.pricingDecision,
    draft.packageOption,
    estimatedPricing,
    clientBudgetNumbers,
    clientEstimatedPricing.recommended,
  ]);

  const generatedEventTitle = useMemo(() => {
    const typeName = draft.eventTypeKey || eventType?.name || 'Event';
    return draft.city ? `${typeName} in ${draft.city}` : typeName;
  }, [draft.eventTypeKey, eventType?.name, draft.city]);

  const fetchPreview = useCallback(async () => {
    if (!draft.date || !draft.city || !isAuthenticated) return;
    setPreviewLoading(true);
    try {
      const res = await previewMatchCount({
        eventDate: draft.date,
        startTime: `${draft.startTime}:00`,
        endTime: `${draft.endTime}:00`,
        city: draft.city,
        latitude: cityInfo?.latitude,
        longitude: cityInfo?.longitude,
        photographerType,
        minBudget: effectiveBudget.min,
        maxBudget: effectiveBudget.max,
        currency: 'RWF',
        specialty: eventType?.name || draft.eventTypeKey,
        photographerSpecialty: specialty,
        locationCoverage: coverage,
        coverageMode: draft.coverageMode,
        clientType: draft.clientType,
        editedPhotos: draft.coverageMode === 'VIDEO' ? 0 : draft.editedPhotos,
        shortVideosQty: draft.coverageMode === 'PHOTOGRAPHY' ? 0 : draft.shortVideosQty,
        shortVideosDuration: draft.shortVideosDuration,
        longVideosQty: draft.coverageMode === 'PHOTOGRAPHY' ? 0 : draft.longVideosQty,
        longVideosDuration: draft.longVideosDuration,
        instantUpdates: draft.instantUpdates,
        digitalDeliveryDays: Math.max(1, Math.round(getDeadlineCalendarDays(draft.digitalDeadline))),
        hasLiveStream: draft.liveStream,
        allowWishInvites: draft.instantWishesAndMemories,
        photoBooksQty: draft.photoBooksQty,
        photoBookSize: draft.photoBookSize,
        photoBookPhotos: draft.photoBookPhotos,
        photoAlbumsQty: draft.photoAlbumsQty,
        photoAlbumSize: draft.photoAlbumSize,
        photoAlbumPrints: draft.photoAlbumPrints,
        wallPortraitsQty: draft.wallPortraitsQty,
        wallPortraitSize: draft.wallPortraitSize,
        wallPortraitFrame: draft.wallPortraitFrame,
        printProductionTime: draft.printProductionTime,
        printProposedDate: draft.printProposedDate || undefined,
        printCollectionMethod: draft.printCollectionMethod,
        editingStyle: draft.editingStyle,
        usageRights: draft.usageRights,
      });
      setPreview(res);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [draft, cityInfo, photographerType, effectiveBudget, eventType, specialty, coverage, isAuthenticated]);

  // Background autosave when signed in
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    if (step !== 1 && step !== 2 && step !== 3 && step !== 4 && step !== 5) return;
    if (!draft.date || !draft.city) return;

    const timer = setTimeout(async () => {
      try {
        setSavingDraft(true);
        const saved = await saveHybridDraft({
          eventId: createdEventIdRef.current || undefined,
          title: generatedEventTitle,
          eventType: eventType?.name || draft.eventTypeKey,
          eventCategoryId: draft.eventTypeId || undefined,
          eventDate: draft.date,
          startTime: `${draft.startTime}:00`,
          endTime: `${draft.endTime}:00`,
          city: draft.city,
          venue: draft.venue.trim() || undefined,
          location: [draft.venue.trim(), draft.city, options?.country].filter(Boolean).join(', '),
          latitude: cityInfo?.latitude,
          longitude: cityInfo?.longitude,
          description: serializeDraftOfferDescription(draft, minutes, step),
          minBudget: effectiveBudget.min,
          maxBudget: effectiveBudget.max,
          hasLiveStream: draft.liveStream,
          allowWishInvites: draft.instantWishesAndMemories,
          minimumPhotos: draft.coverageMode === 'VIDEO' ? 0 : draft.editedPhotos,
          draftStep: step,
        });
        if (saved?.id) {
          createdEventIdRef.current = saved.id;
        }
      } catch {
        // Silent background autosave
      } finally {
        setSavingDraft(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    isAuthenticated,
    step,
    draft,
    minutes,
    generatedEventTitle,
    eventType?.name,
    options?.country,
    cityInfo?.latitude,
    cityInfo?.longitude,
    effectiveBudget.min,
    effectiveBudget.max,
  ]);

  useEffect(() => {
    if (!isOpen || (step !== 3 && step !== 4 && step !== 5)) return;
    const t = setTimeout(fetchPreview, 350);
    return () => clearTimeout(t);
  }, [isOpen, step, fetchPreview]);

  const executePublish = useCallback(async () => {
    setSubmitting(true);
    setErrorMsg(null);
    const briefInstructions = serializeOfferBrief(draft, minutes);
    try {
      let eventId = createdEventIdRef.current;
      if (!eventId) {
        const savedDraft = await saveHybridDraft({
          title: generatedEventTitle,
          eventType: eventType?.name || draft.eventTypeKey,
          eventCategoryId: draft.eventTypeId || undefined,
          eventDate: draft.date,
          startTime: `${draft.startTime}:00`,
          endTime: `${draft.endTime}:00`,
          city: draft.city,
          venue: draft.venue.trim() || undefined,
          location: [draft.venue.trim(), draft.city, options?.country].filter(Boolean).join(', '),
          latitude: cityInfo?.latitude,
          longitude: cityInfo?.longitude,
          description: briefInstructions,
          minBudget: effectiveBudget.min,
          maxBudget: effectiveBudget.max,
          hasLiveStream: draft.liveStream,
          allowWishInvites: draft.instantWishesAndMemories,
          minimumPhotos: draft.coverageMode === 'VIDEO' ? 0 : draft.editedPhotos,
          draftStep: 5,
        });
        if (savedDraft?.id) {
          eventId = savedDraft.id;
          createdEventIdRef.current = eventId;
        }
      }

      if (!eventId) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const res = await fetch(`${getKnockoutApiBase()}/api/remote/customer/events/book`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: generatedEventTitle,
            description: briefInstructions,
            eventCategoryId: draft.eventTypeId || undefined,
            eventType: eventType?.name || draft.eventTypeKey,
            eventDate: draft.date,
            startTime: `${draft.startTime}:00`,
            endTime: `${draft.endTime}:00`,
            location: [draft.venue.trim(), draft.city, options?.country].filter(Boolean).join(', '),
            eventVisibility: 'PUBLIC',
            hasLiveStream: draft.liveStream,
            allowWishInvites: draft.instantWishesAndMemories,
            minimumPhotos: draft.coverageMode === 'VIDEO' ? 0 : draft.editedPhotos,
            minBudget: effectiveBudget.min,
            maxBudget: effectiveBudget.max,
          }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || body?.action !== 1) {
          throw new Error(body?.message || 'Could not create your event. Please try again.');
        }
        eventId = String(body?.data?.event?.id || body?.data?.eventId || body?.data?.id || '');
        if (!eventId) throw new Error('Could not create your event. Please try again.');
        createdEventIdRef.current = eventId;
      }

      const posted = await publishMatchRequest(eventId, {
        title: generatedEventTitle,
        eventDate: draft.date,
        startTime: `${draft.startTime}:00`,
        endTime: `${draft.endTime}:00`,
        location: [draft.venue.trim(), draft.city, options?.country].filter(Boolean).join(', '),
        photographerType,
        minBudget: effectiveBudget.min,
        maxBudget: effectiveBudget.max,
        currency: 'RWF',
        locationCoverage: coverage,
        specialty: eventType?.name || draft.eventTypeKey,
        photographerSpecialty: specialty,
        city: draft.city,
        country: options?.country,
        venue: draft.venue.trim() || undefined,
        latitude: cityInfo?.latitude,
        longitude: cityInfo?.longitude,
        instructions: briefInstructions,
        expirationHours: windowHours,
        hasLiveStream: draft.liveStream,
        allowWishInvites: draft.instantWishesAndMemories,
        minimumPhotos: draft.coverageMode === 'VIDEO' ? 0 : draft.editedPhotos,
        clientType: draft.clientType,
        digitalDeliveryDays: Math.max(1, Math.round(getDeadlineCalendarDays(draft.digitalDeadline))),
        printDeliveryMethod: draft.printCollectionMethod,
        printDeliveryAddress:
          draft.printCollectionMethod === 'Deliver to my home address'
            ? draft.printDeliveryAddress.trim() || undefined
            : undefined,
        printProposedDate:
          draft.printProductionTime === 'Propose production & handover date'
            ? draft.printProposedDate || undefined
            : undefined,
      });

      setResult({
        eventId,
        invited: posted.invitedCount ?? 0,
        status: posted.status ?? 'MATCHING',
      });
      setStep('done');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not publish your event offer. Please try again.');
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  }, [
    draft,
    minutes,
    generatedEventTitle,
    eventType?.name,
    options?.country,
    cityInfo?.latitude,
    cityInfo?.longitude,
    effectiveBudget.min,
    effectiveBudget.max,
    photographerType,
    coverage,
    specialty,
    windowHours,
  ]);

  const handlePublishClick = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!isAuthenticated && !token) {
      setAuthError('');
      setStep('auth');
      return;
    }
    void executePublish();
  };

  // Inline auth handlers
  const handleAuthLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      if (res.success && res.data?.token) {
        const d = res.data;
        await authLogin(
          {
            id: d.id || d.customerId || '',
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            email: d.email || loginEmail,
            phone: d.phone || '',
            customerId: d.customerId || d.id || '',
            customerType: d.customerType || 'Client',
          },
          d.token!,
        );
        await executePublish();
      } else {
        const unverifiedId = unverifiedLoginCustomerId(res.data);
        if (unverifiedId) {
          setOtpCustomerId(unverifiedId);
          setOtpEmail(loginEmail);
          setOtpPassword(loginPassword);
          void otpResend.resend(unverifiedId);
          setAuthStep('otp');
          setAuthError('');
        } else {
          setAuthError(res.data?.message || res.error || 'Invalid email or password.');
        }
      }
    } catch {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSignup = async () => {
    if (!signupFirst || !signupLast || !signupEmail || !signupPhoneVal?.isValid || !signupPassword) {
      setAuthError('Please fill in all fields.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await signup({
        firstName: signupFirst,
        lastName: signupLast,
        email: signupEmail,
        phone: signupPhoneVal?.digits ?? '',
        password: signupPassword,
        customerType: 'Client',
      });
      if (res.success && res.data) {
        setOtpCustomerId(res.data.customerId || '');
        setOtpEmail(signupEmail);
        setOtpPassword(signupPassword);
        otpResend.markSent();
        setAuthStep('otp');
        setAuthError('');
      } else {
        setAuthError(res.data?.message || res.error || 'Could not create account.');
      }
    } catch {
      setAuthError('Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthOtp = async (typed?: string) => {
    const code = typed ?? otpValue;
    if (authLoading || otpRefusal.locked) return;
    if (!code || code.length < 6) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    otpRefusal.clear();
    try {
      const res = await verifyOtp({ customerId: otpCustomerId, otp: code });
      if (res.success && res.data?.action === 1) {
        const loginRes = await login({ email: otpEmail, password: otpPassword });
        if (loginRes.success && loginRes.data?.token) {
          const d = loginRes.data;
          await authLogin(
            {
              id: d.id || d.customerId || '',
              firstName: d.firstName || signupFirst,
              lastName: d.lastName || signupLast,
              email: d.email || otpEmail,
              phone: d.phone || (signupPhoneVal?.digits ?? ''),
              customerId: d.customerId || '',
              customerType: d.customerType || 'Client',
            },
            d.token!,
          );
          await executePublish();
        } else {
          setAuthStep('login');
          setAuthError('Email verified! Please log in.');
        }
      } else {
        setOtpValue('');
        otpRefusal.record(res, 'Incorrect or expired code.');
      }
    } catch {
      setAuthError('Connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoading(true);
    setAuthError('');
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      if (!infoRes.ok) throw new Error();
      const info = await infoRes.json();
      const res = await googleAuth({
        accessToken: tokenResponse.access_token,
        email: info.email,
        firstName: info.given_name || '',
        lastName: info.family_name || '',
        customerType: 'Client',
      });
      if (res.success && res.data?.token) {
        const d = res.data;
        await authLogin(
          {
            id: d.id || d.customerId || '',
            firstName: d.firstName || info.given_name || '',
            lastName: d.lastName || info.family_name || '',
            email: d.email || info.email || '',
            phone: d.phone || '',
            customerId: d.customerId || d.id || '',
            customerType: d.customerType || 'Client',
          },
          d.token!,
        );
        await executePublish();
      } else {
        setAuthError(res.data?.message || 'Google sign-in failed.');
      }
    } catch {
      setAuthError('Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      setGoogleLoading(false);
      setAuthError('Google sign-in cancelled.');
    },
  });

  if (!isOpen) return null;

  const validateStep1 = (): string | null => {
    if (!draft.eventTypeKey.trim()) return 'Choose what type of event you are planning.';
    if (!draft.date) return 'Choose the event date.';
    const today = isoDate(new Date());
    if (draft.date < today) return 'The event date has passed. Choose a future date.';
    if (draft.date === today) {
      const now = new Date();
      if (draft.startTime <= `${pad(now.getHours())}:${pad(now.getMinutes())}`) {
        return 'That start time has passed. Choose a later time.';
      }
    }
    if (!minutes) return 'Choose a start and end time.';
    if (!draft.city) return 'Choose the city.';
    if (!draft.venue.trim()) return 'Enter the venue or location so photographers know where to go.';
    return null;
  };

  const validateStep2 = (): string | null => {
    const hasDigital =
      (draft.coverageMode !== 'VIDEO' && draft.editedPhotos > 0) ||
      (draft.coverageMode !== 'PHOTOGRAPHY' && (draft.shortVideosQty > 0 || draft.longVideosQty > 0));
    const hasPrint = draft.photoBooksQty > 0 || draft.photoAlbumsQty > 0 || draft.wallPortraitsQty > 0;
    if (!hasDigital && !hasPrint && !draft.liveStream) {
      return 'Select at least one digital or print deliverable for your event.';
    }
    return null;
  };

  const validateStep3 = (): string | null => {
    const { min, max } = clientBudgetNumbers;
    if (max === undefined || max <= 0) {
      return 'Enter your maximum budget offer in RWF.';
    }
    if (min !== undefined && min > max) {
      return 'The minimum offer cannot be higher than the maximum offer.';
    }
    return null;
  };

  const goNext = async () => {
    setErrorMsg(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) return setErrorMsg(err);
      if (!confirmYear(draft.date)) return;
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) return setErrorMsg(err);
      setStep(3);
    } else if (step === 3) {
      const err = validateStep3();
      if (err) return setErrorMsg(err);
      setAnalyzingPackagesPreloader(true);
      setPreloaderStageIndex(0);
      const stage1Timer = setTimeout(() => setPreloaderStageIndex(1), 500);
      const stage2Timer = setTimeout(() => setPreloaderStageIndex(2), 1050);
      try {
        const [pkgs] = await Promise.all([
          fetchAllPlatformPackagesForPricing(clientCurrency),
          new Promise((resolve) => setTimeout(resolve, 1550)),
        ]);
        setPlatformPackages(pkgs);
      } finally {
        clearTimeout(stage1Timer);
        clearTimeout(stage2Timer);
        setAnalyzingPackagesPreloader(false);
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const goBack = () => {
    setErrorMsg(null);
    if (step === 'auth') setStep(5);
    else if (step === 'session') {
      if (initialStep === 'select') setStep('select');
      else onClose();
    } else if (step === 1) setStep('session');
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    else if (step === 5) setStep(4);
  };

  const redirectToDashboardCandidates = (eventId: string, directToDetail = true) => {
    const dashboardUrl = (process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com').replace(/\/$/, '');
    const rawRole = (user?.customerType || 'client').trim().toLowerCase().replace(/_/g, '-');
    const userRole =
      rawRole === 'photographer' || rawRole === 'videographer'
        ? 'photographer'
        : rawRole === 'event-coordinator' || rawRole === 'eventcoordinator' || rawRole === 'coordinator' || rawRole === 'ec'
          ? 'event-coordinator'
          : 'client';
    const targetUrl = directToDetail
      ? `${dashboardUrl}/user/${userRole}/events/${encodeURIComponent(eventId)}?candidates=1`
      : `${dashboardUrl}/user/${userRole}/events?candidates=${encodeURIComponent(eventId)}`;
    window.location.href = targetUrl;
  };

  const activeStepNum: 1 | 2 | 3 | 4 | 5 =
    step === 1 || step === 2 || step === 3 || step === 4 || step === 5 ? step : 5;

  const PillButton = ({
    active,
    onClick,
    children,
    icon,
    tone = BRAND_BLUE,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon?: string;
    tone?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 13px',
        borderRadius: 999,
        border: `1.5px solid ${active ? tone : BORDER_COLOR}`,
        background: active ? tone : BG_CARD,
        color: active ? '#fff' : TEXT_PRIMARY,
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {icon && <i className={`bi ${icon}`} aria-hidden />}
      {children}
    </button>
  );

  // ───────── Step = 'select': Mobile BookingModeSelector (Browse vs Post My Event) ─────────
  const renderModeSelect = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontSize: '0.88rem', color: TEXT_SECONDARY }}>
        Choose the booking flow that works best for you
      </p>

      {/* Option 1: Browse Photographers (Direct) */}
      <button
        type="button"
        data-ck-shape="card"
        onClick={() => {
          onClose();
          onChooseBrowse?.();
        }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: 18,
          borderRadius: 16,
          border: `1.5px solid ${BORDER_COLOR}`,
          background: BG_CARD,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(8,58,133,0.10)',
            color: BRAND_BLUE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          <i className="bi bi-search" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: TEXT_PRIMARY }}>Browse Photographers</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(8,58,133,0.10)', color: BRAND_BLUE, fontSize: '0.7rem', fontWeight: 800 }}>
              Direct
            </span>
          </div>
          <p style={{ margin: '6px 0 8px', fontSize: '0.84rem', color: TEXT_SECONDARY, lineHeight: 1.45 }}>
            Explore portfolios, compare packages &amp; prices, and book your preferred photographer directly.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: TEXT_MUTED }}>
            <i className="bi bi-check-circle-fill" style={{ color: BRAND_SUCCESS }} />
            <span>You choose who to book</span>
          </div>
        </div>
        <i className="bi bi-chevron-right" style={{ color: TEXT_MUTED, alignSelf: 'center' }} />
      </button>

      {/* Option 2: Create Your Event Offer (Post My Event) */}
      <button
        type="button"
        data-ck-shape="card"
        onClick={() => setStep('session')}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: 18,
          borderRadius: 16,
          border: `2px solid rgba(242,12,143,0.35)`,
          background: BG_CARD,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(242,12,143,0.10)',
            color: BRAND_PINK,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          <i className="bi bi-stars" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: TEXT_PRIMARY }}>Create Your Event Offer</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(242,12,143,0.10)', color: BRAND_PINK, fontSize: '0.7rem', fontWeight: 800 }}>
              Post My Event
            </span>
          </div>
          <p style={{ margin: '6px 0 8px', fontSize: '0.84rem', color: TEXT_SECONDARY, lineHeight: 1.45 }}>
            Choose your event details, deliverables, delivery timeline &amp; price offer — we&apos;ll broadcast it to matching photographers.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: TEXT_MUTED }}>
            <i className="bi bi-lightning-charge-fill" style={{ color: BRAND_PINK }} />
            <span>Photographers apply to you • Fast shortlist</span>
          </div>
        </div>
        <i className="bi bi-chevron-right" style={{ color: BRAND_PINK, alignSelf: 'center' }} />
      </button>
    </div>
  );

  // ───────── Step = 'session': Indoor vs Outdoor ─────────
  const renderSessionChoice = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: '0.88rem', color: TEXT_SECONDARY, lineHeight: 1.5 }}>
        Pick whether you are booking an indoor studio session (small events) or an outdoor on-location session (large events).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
        <button
          type="button"
          data-ck-shape="card"
          onClick={() => {
            const firstPreset = draft.clientType === 'ORGANIZATION' ? 'Corporate Headshots' : 'Studio Portrait';
            updateDraft({
              sessionType: 'INDOOR',
              eventTypeKey: firstPreset,
              startTime: '10:00',
              endTime: '12:00',
              editedPhotos: 50,
              shortVideosQty: 1,
              longVideosQty: 0,
              photoBooksQty: 0,
              wallPortraitsQty: 1,
            });
            setStep(1);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            textAlign: 'left',
            padding: 20,
            borderRadius: 18,
            border: `2px solid rgba(8,58,133,0.22)`,
            background: BG_CARD,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(8,58,133,0.06)',
            transition: 'all 0.18s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(8,58,133,0.10)', color: BRAND_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              <i className="bi bi-camera" />
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(8,58,133,0.10)', color: BRAND_BLUE, fontSize: '0.7rem', fontWeight: 800 }}>
              Small events · Individual or Org
            </span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: TEXT_PRIMARY }}>
            Indoor session (Studio session)
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: TEXT_SECONDARY, lineHeight: 1.45 }}>
            Studio portraits, birthday shoots, family &amp; baby, maternity, corporate headshots, product photography &amp; small team sessions.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: BRAND_BLUE, fontWeight: 700, marginTop: 'auto' }}>
            <i className="bi bi-stars" /> Tailored for individuals &amp; organizations <i className="bi bi-arrow-right" />
          </div>
        </button>

        <button
          type="button"
          data-ck-shape="card"
          onClick={() => {
            const firstPreset = draft.clientType === 'ORGANIZATION' ? 'Conference' : 'Wedding';
            updateDraft({
              sessionType: 'OUTDOOR',
              eventTypeKey: firstPreset,
              startTime: '06:00',
              endTime: '22:00',
              editedPhotos: 300,
              shortVideosQty: 2,
              longVideosQty: 1,
              photoBooksQty: 1,
              wallPortraitsQty: 2,
            });
            setStep(1);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            textAlign: 'left',
            padding: 20,
            borderRadius: 18,
            border: `2px solid rgba(242,12,143,0.28)`,
            background: BG_CARD,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(242,12,143,0.06)',
            transition: 'all 0.18s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(242,12,143,0.10)', color: BRAND_PINK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              <i className="bi bi-sun" />
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(242,12,143,0.10)', color: BRAND_PINK, fontSize: '0.7rem', fontWeight: 800 }}>
              Large events · Individual or Org
            </span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: TEXT_PRIMARY }}>
            Outdoor session (Outside studio session)
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: TEXT_SECONDARY, lineHeight: 1.45 }}>
            Weddings, traditional ceremonies, conferences, corporate galas, commercial campaigns, concerts, graduations &amp; outdoor celebrations.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: BRAND_PINK, fontWeight: 700, marginTop: 'auto' }}>
            <i className="bi bi-geo-alt-fill" /> Full on-location event coverage <i className="bi bi-arrow-right" />
          </div>
        </button>
      </div>
    </div>
  );

  // ───────── Step 1 of 5: EVENT DETAILS ─────────
  const renderStep1 = () => {
    const activeEventPresets = getEventTypePresetsForClient(draft.clientType, draft.sessionType);
    const presetKeysLower = new Set(activeEventPresets.map((p) => p.key.toLowerCase()));
    const extraEventTypes = (options?.eventTypes ?? []).filter((t) => {
      if (presetKeysLower.has(t.name.toLowerCase())) return false;
      if (draft.clientType === 'INDIVIDUAL' && isOrganizationOnlyCategory(t.name)) return false;
      return true;
    });
    const isCustomEventSelected = !activeEventPresets.some(
      (p) => p.key !== 'Other' && p.key.toLowerCase() === draft.eventTypeKey.toLowerCase(),
    );
    const popularVenues = POPULAR_VENUES_BY_CITY[draft.city] || POPULAR_VENUES_BY_CITY.Kigali;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Session setting</div>
          <div style={{ fontSize: '0.76rem', color: TEXT_MUTED, marginBottom: 10 }}>
            Switch between an indoor studio session or an outdoor on-location event
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['INDOOR', 'OUTDOOR'] as EventSessionType[]).map((sType) => {
              const selected = draft.sessionType === sType;
              return (
                <button
                  key={sType}
                  type="button"
                  data-ck-shape="card"
                  onClick={() => {
                    const presetsForNext = getEventTypePresetsForClient(draft.clientType, sType);
                    const stillValid = presetsForNext.some(
                      (p) => p.key !== 'Other' && p.key.toLowerCase() === draft.eventTypeKey.toLowerCase(),
                    );
                    const fallbackKey =
                      presetsForNext.find((p) => p.key !== 'Other')?.key ||
                      (sType === 'INDOOR' ? 'Studio Portrait' : 'Wedding');
                    updateDraft({
                      sessionType: sType,
                      ...(stillValid ? {} : { eventTypeKey: fallbackKey, eventTypeId: '' }),
                    });
                    setShowOtherEventTypes(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: `1.5px solid ${selected ? BRAND_BLUE : BORDER_COLOR}`,
                    background: selected ? BRAND_BLUE : BG_SUBTLE,
                    color: selected ? '#fff' : TEXT_PRIMARY,
                    fontWeight: 700,
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className={`bi ${sType === 'INDOOR' ? 'bi-camera' : 'bi-sun'}`} />
                  {sType === 'INDOOR' ? 'Indoor (Studio)' : 'Outdoor (Outside studio)'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Booking as</div>
          <div style={{ fontSize: '0.76rem', color: TEXT_MUTED, marginBottom: 10 }}>
            Choose whether this event is for an individual or an organization
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['INDIVIDUAL', 'ORGANIZATION'] as ClientEntityType[]).map((type) => {
              const selected = draft.clientType === type;
              return (
                <button
                  key={type}
                  type="button"
                  data-ck-shape="card"
                  onClick={() => {
                    const nextPresets = getEventTypePresetsForClient(type, draft.sessionType);
                    const existsInNext = nextPresets.some(
                      (p) => p.key !== 'Other' && p.key.toLowerCase() === draft.eventTypeKey.toLowerCase(),
                    );
                    const defaultKey =
                      nextPresets.find((p) => p.key !== 'Other')?.key ||
                      (draft.sessionType === 'INDOOR'
                        ? type === 'ORGANIZATION'
                          ? 'Corporate Headshots'
                          : 'Studio Portrait'
                        : type === 'ORGANIZATION'
                          ? 'Conference'
                          : 'Wedding');
                    updateDraft({
                      clientType: type,
                      usageRights: type === 'ORGANIZATION' ? 'Commercial & brand' : 'Personal & family',
                      ...(existsInNext ? {} : { eventTypeKey: defaultKey, eventTypeId: '' }),
                    });
                    setShowOtherEventTypes(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: `1.5px solid ${selected ? BRAND_BLUE : BORDER_COLOR}`,
                    background: selected ? BRAND_BLUE : BG_SUBTLE,
                    color: selected ? '#fff' : TEXT_PRIMARY,
                    fontWeight: 700,
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className={`bi ${type === 'INDIVIDUAL' ? 'bi-person' : 'bi-building'}`} />
                  {type === 'INDIVIDUAL' ? 'Individual' : 'Organization'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 8 }}>
            What are you planning?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {activeEventPresets.map((preset) => {
              const isOther = preset.key === 'Other';
              const selected = isOther
                ? showOtherEventTypes || isCustomEventSelected
                : !showOtherEventTypes && draft.eventTypeKey.toLowerCase() === preset.key.toLowerCase();
              return (
                <button
                  key={preset.key}
                  type="button"
                  data-ck-shape="card"
                  onClick={() => {
                    if (isOther) {
                      setShowOtherEventTypes(true);
                    } else {
                      setShowOtherEventTypes(false);
                      const matched = options?.eventTypes.find(
                        (t) => t.name.toLowerCase() === preset.key.toLowerCase(),
                      );
                      updateDraft({
                        eventTypeKey: preset.key,
                        eventTypeId: matched?.id || '',
                      });
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: `1.5px solid ${selected ? BRAND_BLUE : BORDER_COLOR}`,
                    background: selected ? 'rgba(8,58,133,0.08)' : BG_SUBTLE,
                    color: TEXT_PRIMARY,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <i className={`bi ${preset.icon}`} style={{ color: selected ? BRAND_BLUE : TEXT_SECONDARY }} />
                  <span style={{ flex: 1 }}>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {(showOtherEventTypes || isCustomEventSelected) && extraEventTypes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {extraEventTypes.map((t) => {
                const active = draft.eventTypeKey.toLowerCase() === t.name.toLowerCase();
                return (
                  <PillButton
                    key={t.id}
                    active={active}
                    onClick={() => updateDraft({ eventTypeKey: t.name, eventTypeId: t.id })}
                  >
                    {t.name}
                  </PillButton>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: TEXT_PRIMARY }}>Date • Start &amp; end time</span>
            {minutes > 0 && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(8,58,133,0.10)', color: BRAND_BLUE, fontSize: '0.75rem', fontWeight: 800 }}>
                {durationText(minutes)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Tomorrow', date: isoDate(new Date(Date.now() + 86400000)) },
              { label: 'This Saturday', date: isoDate(nextWeekday(6, 0)) },
              { label: 'Next Saturday', date: isoDate(nextWeekday(6, 1)) },
            ].map((q) => (
              <PillButton key={q.label} active={draft.date === q.date} onClick={() => updateDraft({ date: q.date })}>
                {q.label}
              </PillButton>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>Date</label>
              <input type="date" min={isoDate(new Date())} value={draft.date} onChange={(e) => updateDraft({ date: e.target.value })} style={fieldStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>Starts</label>
              <select value={draft.startTime} onChange={(e) => updateDraft({ startTime: e.target.value })} style={fieldStyle}>
                {slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>Ends</label>
              <select value={draft.endTime} onChange={(e) => updateDraft({ endTime: e.target.value })} style={fieldStyle}>
                {slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 10 }}>Location • Venue</div>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>City</label>
              <select value={draft.city} onChange={(e) => updateDraft({ city: e.target.value })} style={fieldStyle}>
                {(options?.cities?.length ? options.cities : [{ name: 'Kigali' }, { name: 'Musanze' }, { name: 'Rubavu' }, { name: 'Huye' }]).map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>Venue or address</label>
              <input
                type="text"
                value={draft.venue}
                onFocus={() => setVenueFocused(true)}
                onBlur={() => setTimeout(() => setVenueFocused(false), 200)}
                onChange={(e) => updateDraft({ venue: e.target.value })}
                placeholder={`Type to search in ${draft.city} (e.g. Kigali Convention Centre)`}
                style={fieldStyle}
              />
              {venueFocused && draft.venue.trim().length > 0 && venueSearchResults.length > 0 && (
                <div style={{ marginTop: 6, borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, boxShadow: '0 12px 28px rgba(0,0,0,0.14)', overflow: 'hidden', zIndex: 30 }}>
                  {venueSearchResults.map((loc: LocationSuggestion, index: number) => {
                    const isFirstSuggestion = index === 0;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        data-ck-shape="card"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          updateDraft({
                            venue: loc.fullText,
                            ...(loc.city && options?.cities.some((c) => c.name === loc.city) ? { city: loc.city } : {}),
                          });
                          setVenueFocused(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          border: 'none',
                          borderBottom: `1px solid ${BORDER_COLOR}`,
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <i className={`bi ${isFirstSuggestion ? 'bi-stars' : 'bi-geo-alt-fill'}`} style={{ color: isFirstSuggestion ? BRAND_BLUE : BRAND_PINK }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: TEXT_PRIMARY }}>{loc.title}</div>
                          <div style={{ fontSize: '0.73rem', color: TEXT_MUTED }}>{loc.subtitle}</div>
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800, background: isFirstSuggestion ? 'rgba(8,58,133,0.10)' : 'rgba(242,12,143,0.10)', color: isFirstSuggestion ? BRAND_BLUE : BRAND_PINK }}>
                          {isFirstSuggestion ? 'Suggestion' : 'Google Maps'}
                        </span>
                      </button>
                    );
                  })}
                  {loadingVenueGoogle && (
                    <div style={{ padding: '6px 12px', fontSize: '0.72rem', color: TEXT_MUTED }}>Searching Google Maps...</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {popularVenues.map((v) => (
              <PillButton key={v} active={draft.venue === v} onClick={() => updateDraft({ venue: v })} icon="bi-geo-alt">
                {v}
              </PillButton>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ───────── Step 2 of 5: COVERAGE & PRINT PRODUCTS ─────────
  const renderStep2 = () => {
    const isCustomPhotos = !(PHOTO_QUANTITY_PRESETS as readonly number[]).includes(draft.editedPhotos);
    const isCustomShortVid = !(SHORT_VIDEO_QTY_PRESETS as readonly number[]).includes(draft.shortVideosQty);
    const isCustomLongVid = !(LONG_VIDEO_QTY_PRESETS as readonly number[]).includes(draft.longVideosQty);
    const isCustomBookQty = !(PRINT_QTY_PRESETS as readonly number[]).includes(draft.photoBooksQty);
    const isCustomBookPhotos = !(PHOTO_BOOK_PHOTO_PRESETS as readonly number[]).includes(draft.photoBookPhotos);
    const isCustomAlbumQty = !(PRINT_QTY_PRESETS as readonly number[]).includes(draft.photoAlbumsQty);
    const isCustomPortraitQty = !(PRINT_QTY_PRESETS as readonly number[]).includes(draft.wallPortraitsQty);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: TEXT_PRIMARY }}>Digital coverage</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['PHOTOGRAPHY', 'VIDEO', 'BOTH'] as DigitalCoverageMode[]).map((mode) => {
              const selected = draft.coverageMode === mode;
              const label = mode === 'PHOTOGRAPHY' ? 'Photography' : mode === 'VIDEO' ? 'Video' : 'Both';
              return (
                <button
                  key={mode}
                  type="button"
                  data-ck-shape="card"
                  onClick={() =>
                    updateDraft({
                      coverageMode: mode,
                      ...(mode === 'VIDEO' ? { editedPhotos: 0 } : draft.editedPhotos === 0 ? { editedPhotos: 300 } : {}),
                    })
                  }
                  style={{
                    padding: '9px 10px',
                    borderRadius: 10,
                    border: `1.5px solid ${selected ? BRAND_BLUE : BORDER_COLOR}`,
                    background: selected ? BRAND_BLUE : BG_SUBTLE,
                    color: selected ? '#fff' : TEXT_PRIMARY,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {draft.coverageMode !== 'VIDEO' && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>EDITED PHOTOS • QUANTITY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PHOTO_QUANTITY_PRESETS.map((n) => (
                  <PillButton key={n} active={draft.editedPhotos === n} onClick={() => updateDraft({ editedPhotos: n })}>
                    {String(n)}
                  </PillButton>
                ))}
                <select
                  value={isCustomPhotos ? draft.editedPhotos : ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0) updateDraft({ editedPhotos: v });
                  }}
                  style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                >
                  <option value="">{isCustomPhotos ? `${draft.editedPhotos} (Custom)` : 'Custom...'}</option>
                  {PHOTO_CUSTOM_OPTIONS.map((v) => <option key={v} value={v}>{v} edited photos</option>)}
                </select>
              </div>
            </div>
          )}

          {draft.coverageMode !== 'PHOTOGRAPHY' && (
            <>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>SHORT VIDEOS • QUANTITY &amp; DURATION</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {SHORT_VIDEO_QTY_PRESETS.map((n) => (
                    <PillButton key={n} active={draft.shortVideosQty === n} onClick={() => updateDraft({ shortVideosQty: n })}>
                      {String(n)}
                    </PillButton>
                  ))}
                  <select
                    value={isCustomShortVid ? draft.shortVideosQty : ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > 0) updateDraft({ shortVideosQty: v });
                    }}
                    style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                  >
                    <option value="">{isCustomShortVid ? `${draft.shortVideosQty} (Custom)` : 'Custom...'}</option>
                    {SHORT_VIDEO_CUSTOM_OPTIONS.map((v) => <option key={v} value={v}>{v} short videos</option>)}
                  </select>
                  {draft.shortVideosQty > 0 && (
                    <select
                      value={draft.shortVideosDuration}
                      onChange={(e) => updateDraft({ shortVideosDuration: e.target.value })}
                      style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                    >
                      {SHORT_VIDEO_DURATIONS.map((d) => <option key={d} value={d}>{d} each</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>LONG VIDEOS • QUANTITY &amp; DURATION</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <PillButton active={draft.longVideosQty === 0} onClick={() => updateDraft({ longVideosQty: 0 })}>None</PillButton>
                  {LONG_VIDEO_QTY_PRESETS.map((n) => (
                    <PillButton key={n} active={draft.longVideosQty === n} onClick={() => updateDraft({ longVideosQty: n })}>
                      {String(n)}
                    </PillButton>
                  ))}
                  <select
                    value={isCustomLongVid && draft.longVideosQty > 0 ? draft.longVideosQty : ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > 0) updateDraft({ longVideosQty: v });
                    }}
                    style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                  >
                    <option value="">{isCustomLongVid && draft.longVideosQty > 0 ? `${draft.longVideosQty} (Custom)` : 'Custom...'}</option>
                    {LONG_VIDEO_CUSTOM_OPTIONS.map((v) => <option key={v} value={v}>{v} long videos</option>)}
                  </select>
                  {draft.longVideosQty > 0 && (
                    <select
                      value={draft.longVideosDuration}
                      onChange={(e) => updateDraft({ longVideosDuration: e.target.value })}
                      style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
                    >
                      {LONG_VIDEO_DURATIONS.map((d) => <option key={d} value={d}>Up to {d}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </>
          )}

          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>INSTANT UPDATES (SAME DAY)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <PillButton active={!draft.instantUpdates} onClick={() => updateDraft({ instantUpdates: false })}>No</PillButton>
              <PillButton active={draft.instantUpdates} onClick={() => updateDraft({ instantUpdates: true })}>Yes (10–20 same-day preview photos)</PillButton>
            </div>
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: TEXT_PRIMARY }}>Live stream, Drone Capturing &amp; instant wishes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>LIVE STREAM</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <PillButton active={!draft.liveStream} onClick={() => updateDraft({ liveStream: false })}>No</PillButton>
                <PillButton active={draft.liveStream} onClick={() => updateDraft({ liveStream: true })} icon="bi-broadcast">Yes</PillButton>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>DRONE CAPTURING (AERIAL 4K)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <PillButton active={!draft.droneCapturing} onClick={() => updateDraft({ droneCapturing: false })}>No</PillButton>
                <PillButton active={draft.droneCapturing} onClick={() => updateDraft({ droneCapturing: true })} icon="bi-airplane">Yes</PillButton>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>INSTANT WISHES &amp; MEMORIES SHARING</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <PillButton active={!draft.instantWishesAndMemories} onClick={() => updateDraft({ instantWishesAndMemories: false })}>No</PillButton>
                <PillButton active={draft.instantWishesAndMemories} onClick={() => updateDraft({ instantWishesAndMemories: true })} icon="bi-heart">Yes</PillButton>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: TEXT_PRIMARY }}>Photo books, albums &amp; portraits</div>

          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>PHOTO BOOKS • QUANTITY, SIZE &amp; PHOTOS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {PRINT_QTY_PRESETS.map((n) => (
                <PillButton key={n} active={draft.photoBooksQty === n} onClick={() => updateDraft({ photoBooksQty: n })}>{String(n)}</PillButton>
              ))}
              <select
                value={isCustomBookQty ? draft.photoBooksQty : ''}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0) updateDraft({ photoBooksQty: v });
                }}
                style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
              >
                <option value="">{isCustomBookQty ? `${draft.photoBooksQty} (Custom)` : 'Custom...'}</option>
                {PRINT_QTY_CUSTOM_OPTIONS.map((v) => <option key={v} value={v}>{v} photo books</option>)}
              </select>
              {draft.photoBooksQty > 0 && (
                <>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <PaperFormat sizeLabel={draft.photoBookSize} />
                    <select value={draft.photoBookSize} onChange={(e) => updateDraft({ photoBookSize: e.target.value })} style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}>
                      {PHOTO_BOOK_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <select value={draft.photoBookPhotos} onChange={(e) => updateDraft({ photoBookPhotos: Number(e.target.value) })} style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}>
                    {[...PHOTO_BOOK_PHOTO_PRESETS, ...PHOTO_BOOK_PHOTO_CUSTOM_OPTIONS].sort((a, b) => a - b).map((p) => (
                      <option key={p} value={p}>{p} photos</option>
                    ))}
                    {isCustomBookPhotos && <option value={draft.photoBookPhotos}>{draft.photoBookPhotos} photos</option>}
                  </select>
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>PHOTO ALBUMS • QUANTITY, SIZE &amp; PRINTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {PRINT_QTY_PRESETS.map((n) => (
                <PillButton key={n} active={draft.photoAlbumsQty === n} onClick={() => updateDraft({ photoAlbumsQty: n })}>{String(n)}</PillButton>
              ))}
              <select
                value={isCustomAlbumQty ? draft.photoAlbumsQty : ''}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0) updateDraft({ photoAlbumsQty: v });
                }}
                style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
              >
                <option value="">{isCustomAlbumQty ? `${draft.photoAlbumsQty} (Custom)` : 'Custom...'}</option>
                {PRINT_QTY_CUSTOM_OPTIONS.map((v) => <option key={v} value={v}>{v} photo albums</option>)}
              </select>
              {draft.photoAlbumsQty > 0 && (
                <>
                  <select value={draft.photoAlbumSize} onChange={(e) => updateDraft({ photoAlbumSize: e.target.value })} style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}>
                    {PHOTO_ALBUM_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={draft.photoAlbumPrints} onChange={(e) => updateDraft({ photoAlbumPrints: e.target.value })} style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}>
                    {PHOTO_ALBUM_PRINTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>WALL PORTRAITS • QUANTITY, SIZE &amp; FRAME</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {PRINT_QTY_PRESETS.map((n) => (
                <PillButton key={n} active={draft.wallPortraitsQty === n} onClick={() => updateDraft({ wallPortraitsQty: n })}>{String(n)}</PillButton>
              ))}
              <select
                value={isCustomPortraitQty ? draft.wallPortraitsQty : ''}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0) updateDraft({ wallPortraitsQty: v });
                }}
                style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
              >
                <option value="">{isCustomPortraitQty ? `${draft.wallPortraitsQty} (Custom)` : 'Custom...'}</option>
                {PRINT_QTY_CUSTOM_OPTIONS.map((v) => <option key={v} value={v}>{v} wall portraits</option>)}
              </select>
              {draft.wallPortraitsQty > 0 && (
                <>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <PaperFormat sizeLabel={draft.wallPortraitSize} />
                    <select value={draft.wallPortraitSize} onChange={(e) => updateDraft({ wallPortraitSize: e.target.value })} style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}>
                      {WALL_PORTRAIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <select value={draft.wallPortraitFrame} onChange={(e) => updateDraft({ wallPortraitFrame: e.target.value })} style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}>
                    {WALL_PORTRAIT_FRAMES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedStyle((v) => !v)}
              style={{ background: 'none', border: 'none', padding: 0, color: BRAND_BLUE, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>More options: editing style &amp; usage</span>
              <i className={`bi ${showAdvancedStyle ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
            </button>
            {showAdvancedStyle && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>EDITING STYLE</label>
                  <select value={draft.editingStyle} onChange={(e) => updateDraft({ editingStyle: e.target.value })} style={fieldStyle}>
                    {EDITING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>USAGE RIGHTS</label>
                  <select value={draft.usageRights} onChange={(e) => updateDraft({ usageRights: e.target.value })} style={fieldStyle}>
                    {USAGE_RIGHTS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ───────── Step 3 of 5: DELIVERY & BUDGET ─────────
  const renderStep3 = () => {
    const isCustomDeadline = !(DIGITAL_DEADLINE_PRESETS as readonly string[]).includes(draft.digitalDeadline);
    const { min: userMin, max: userMax } = clientBudgetNumbers;
    const isExpressMajorFloor = clientEstimatedPricing.isExpressMajorFloor;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: TEXT_PRIMARY }}>Delivery schedule</div>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>DIGITAL DELIVERY • DAYS AFTER EVENT</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DIGITAL_DEADLINE_PRESETS.map((d) => (
                <PillButton key={d} active={draft.digitalDeadline === d} onClick={() => updateDraft({ digitalDeadline: d })}>{d}</PillButton>
              ))}
              <select
                value={isCustomDeadline ? draft.digitalDeadline : ''}
                onChange={(e) => {
                  if (e.target.value) updateDraft({ digitalDeadline: e.target.value });
                }}
                style={{ ...fieldStyle, width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
              >
                <option value="">{isCustomDeadline ? `${draft.digitalDeadline} (Custom)` : 'Custom...'}</option>
                {DIGITAL_DEADLINE_CUSTOM_OPTIONS.map((d) => <option key={d} value={d}>Within {d}</option>)}
              </select>
            </div>
            {isExpressMajorFloor && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(8,58,133,0.08)', color: BRAND_BLUE, fontSize: '0.8rem', lineHeight: 1.45 }}>
                <i className="bi bi-lightning-charge-fill" style={{ marginRight: 6 }} />
                Recommended pricing for an organization&apos;s commercial, conference or wedding event (or a large event) with 4-day or faster delivery starts from{' '}
                <strong>{formatRwf(EXPRESS_MAJOR_EVENT_MIN_BUDGET_RWF)}</strong>. You can still enter any budget below.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>PRINT PRODUCTION TIME</label>
              <select
                value={draft.printProductionTime}
                onChange={(e) => {
                  const val = e.target.value;
                  updateDraft({
                    printProductionTime: val,
                    ...(val === 'Propose production & handover date' && !draft.printProposedDate
                      ? { printProposedDate: addDaysToIso(draft.date, 14) }
                      : {}),
                  });
                }}
                style={fieldStyle}
              >
                {PRINT_PRODUCTION_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>COLLECTION / DELIVERY</label>
              <select value={draft.printCollectionMethod} onChange={(e) => updateDraft({ printCollectionMethod: e.target.value })} style={fieldStyle}>
                {PRINT_COLLECTION_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {draft.printProductionTime === 'Propose production & handover date' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>PROPOSED PRODUCTION &amp; HANDOVER DATE</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {[
                  { label: '+7 days after event', date: addDaysToIso(draft.date, 7) },
                  { label: '+14 days after event', date: addDaysToIso(draft.date, 14) },
                  { label: '+21 days after event', date: addDaysToIso(draft.date, 21) },
                ].map((chip) => (
                  <PillButton key={chip.label} active={draft.printProposedDate === chip.date} onClick={() => updateDraft({ printProposedDate: chip.date })}>
                    {chip.label}
                  </PillButton>
                ))}
              </div>
              <input type="date" min={draft.date || isoDate(new Date())} value={draft.printProposedDate} onChange={(e) => updateDraft({ printProposedDate: e.target.value })} style={{ ...fieldStyle, maxWidth: 240 }} />
            </div>
          )}

          {draft.printCollectionMethod === 'Deliver to my home address' && (
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>HOME / OFFICE DELIVERY ADDRESS</label>
              <input
                type="text"
                value={draft.printDeliveryAddress}
                onFocus={() => setDeliveryAddrFocused(true)}
                onBlur={() => setTimeout(() => setDeliveryAddrFocused(false), 200)}
                onChange={(e) => updateDraft({ printDeliveryAddress: e.target.value })}
                placeholder={`Type your neighborhood or street in ${draft.city}`}
                style={fieldStyle}
              />
              {deliveryAddrFocused && draft.printDeliveryAddress.trim().length > 0 && deliveryAddrSearchResults.length > 0 && (
                <div style={{ marginTop: 6, borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, boxShadow: '0 12px 28px rgba(0,0,0,0.14)', overflow: 'hidden', zIndex: 30 }}>
                  {deliveryAddrSearchResults.map((loc: LocationSuggestion, index: number) => {
                    const isFirstSuggestion = index === 0;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        data-ck-shape="card"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          updateDraft({ printDeliveryAddress: `${loc.title}, ${loc.subtitle}` });
                          setDeliveryAddrFocused(false);
                        }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderBottom: `1px solid ${BORDER_COLOR}`, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <i className={`bi ${isFirstSuggestion ? 'bi-stars' : 'bi-geo-alt-fill'}`} style={{ color: BRAND_BLUE }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: TEXT_PRIMARY }}>{loc.title}</div>
                          <div style={{ fontSize: '0.73rem', color: TEXT_MUTED }}>{loc.subtitle}</div>
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: BRAND_BLUE }}>
                          {isFirstSuggestion ? 'Suggestion' : 'Google Maps'}
                        </span>
                      </button>
                    );
                  })}
                  {loadingDeliveryGoogle && <div style={{ padding: '6px 12px', fontSize: '0.72rem', color: TEXT_MUTED }}>Searching Google Maps...</div>}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: TEXT_PRIMARY }}>Your budget (preferred range)</div>
            <div style={{ fontSize: '0.78rem', color: TEXT_SECONDARY, marginTop: 2 }}>
              Pick a range or tap Flexible to enter your own minimum and maximum offer
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {budgetRangePresets.map((preset) => {
              const selected = draft.budgetMode === 'PRESET' && userMin === preset.min && userMax === preset.max;
              return (
                <PillButton
                  key={preset.label}
                  active={selected}
                  onClick={() =>
                    updateDraft({
                      budgetMode: 'PRESET',
                      minBudgetInput: formatWithCommas(preset.min),
                      maxBudgetInput: formatWithCommas(preset.max),
                    })
                  }
                >
                  {preset.label}
                </PillButton>
              );
            })}
            <PillButton active={draft.budgetMode === 'FLEXIBLE'} onClick={() => updateDraft({ budgetMode: 'FLEXIBLE' })} icon="bi-sliders">
              Flexible
            </PillButton>
          </div>

          {draft.budgetMode === 'FLEXIBLE' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>Minimum offer (RWF)</label>
                <input type="text" inputMode="numeric" value={draft.minBudgetInput} onChange={(e) => updateDraft({ minBudgetInput: formatWithCommas(e.target.value) })} placeholder="300,000" style={fieldStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>Maximum offer (RWF)</label>
                <input type="text" inputMode="numeric" value={draft.maxBudgetInput} onChange={(e) => updateDraft({ maxBudgetInput: formatWithCommas(e.target.value) })} placeholder="420,000" style={fieldStyle} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ───────── Step 4 of 5: RECOMMENDED PRICING ─────────
  const renderStep4 = () => {
    const { min: userMin, max: userMax } = clientBudgetNumbers;
    const summaryLines = formatOfferDeliverablesSummaryLines(draft, minutes);
    const completeDeltaAboveMax = userMax ? estimatedPricing.recommended - userMax : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: BRAND_BLUE, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Your offer
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: TEXT_PRIMARY, marginTop: 4 }}>{summaryLines.digitalLine}</div>
          <div style={{ fontSize: '0.82rem', color: TEXT_SECONDARY, marginTop: 2 }}>{summaryLines.printLine}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: BRAND_BLUE, marginTop: 8 }}>
            Budget: RWF {draft.minBudgetInput || '0'} – {draft.maxBudgetInput || formatWithCommas(estimatedPricing.recommended)}
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: TEXT_PRIMARY }}>Recommended pricing</div>
              <div style={{ fontSize: '0.78rem', color: TEXT_SECONDARY }}>
                Deduced from {packageAnalysis.totalPackagesSearched} photographer packages (Best 3 per item • Summation &amp; Average in {clientCurrency})
              </div>
            </div>
            {packageAnalysis.foreignCurrencyPackagesConverted > 0 && (
              <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(8,58,133,0.10)', color: BRAND_BLUE, fontSize: '0.7rem', fontWeight: 800 }}>
                <i className="bi bi-currency-exchange" /> {packageAnalysis.foreignCurrencyPackagesConverted} USD/foreign converted to {clientCurrency}
              </span>
            )}
          </div>

          {packageAnalysis.selectedItemsAnalysis.length > 0 && (
            <div style={{ padding: 12, borderRadius: 12, background: BG_SUBTLE, border: `1px solid ${BORDER_COLOR}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: BRAND_BLUE, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Best 3 Packages Analysis per Selected Item
              </div>
              {packageAnalysis.selectedItemsAnalysis.map((item) => (
                <div key={item.itemKey} style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 6, borderBottom: `1px dashed ${BORDER_COLOR}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: TEXT_PRIMARY }}>{item.itemLabel}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: BRAND_BLUE }}>
                      Avg: {clientCurrency} {item.averagePrice.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: TEXT_MUTED }}>
                    Top 3:{' '}
                    {item.bestThreePackages
                      .map(
                        (b) =>
                          `${b.photographerName} (${b.packageName}: ${b.originalCurrency !== clientCurrency ? `${b.originalCurrency} ${b.originalPrice.toLocaleString('en-US')} → ` : ''}${clientCurrency} ${b.derivedItemContribution.toLocaleString('en-US')})`,
                      )
                      .join(' • ')}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: TEXT_SECONDARY }}>
                  Summation of selected items averages
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: TEXT_PRIMARY }}>
                  {clientCurrency} {packageAnalysis.totalSummation.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          )}

          {[
            {
              tier: 'WITHIN_BUDGET' as const,
              name: 'Essential',
              badge: 'Within budget',
              price: estimatedPricing.low,
              lines: ['Digital delivery: 14 days', 'Photo book & portraits not included'],
              footnote:
                userMin && estimatedPricing.low < userMin
                  ? `RWF ${(userMin - estimatedPricing.low).toLocaleString('en-US')} below your minimum`
                  : 'Fits comfortably within your range',
            },
            {
              tier: 'RECOMMENDED' as const,
              name: 'Complete',
              badge: 'Recommended',
              price: estimatedPricing.recommended,
              lines: [
                `${summaryLines.completeDigitalLine} • ${draft.digitalDeadline} delivery`,
                `${summaryLines.completePrintLine} (${draft.printProductionTime.toLowerCase()})`,
              ],
              footnote:
                completeDeltaAboveMax > 0
                  ? `RWF ${completeDeltaAboveMax.toLocaleString('en-US')} above your maximum`
                  : 'Matches your full requested scope',
            },
            {
              tier: 'PRIORITY' as const,
              name: 'Priority',
              badge: 'Faster delivery',
              price: estimatedPricing.priority,
              lines: ['Digital delivery: 4 days (priority)', 'Express print production & priority handling'],
              footnote: undefined,
            },
          ].map((pkg) => {
            const selected = draft.packageOption === pkg.tier;
            return (
              <button
                key={pkg.tier}
                type="button"
                data-ck-shape="card"
                onClick={() => updateDraft({ packageOption: pkg.tier })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  textAlign: 'left',
                  padding: 14,
                  borderRadius: 14,
                  border: `2px solid ${selected ? BRAND_BLUE : BORDER_COLOR}`,
                  background: selected ? 'rgba(8,58,133,0.06)' : BG_SUBTLE,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className={`bi ${selected ? 'bi-record-circle-fill' : 'bi-circle'}`} style={{ color: selected ? BRAND_BLUE : TEXT_MUTED }} />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: TEXT_PRIMARY }}>{pkg.name}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800, background: pkg.tier === 'RECOMMENDED' ? 'rgba(242,12,143,0.12)' : 'rgba(8,58,133,0.10)', color: pkg.tier === 'RECOMMENDED' ? BRAND_PINK : BRAND_BLUE }}>
                      {pkg.badge}
                    </span>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '0.98rem', color: TEXT_PRIMARY }}>{formatRwf(pkg.price)}</span>
                </div>
                {pkg.lines.map((ln) => (
                  <div key={ln} style={{ fontSize: '0.79rem', color: TEXT_SECONDARY, paddingLeft: 24 }}>{ln}</div>
                ))}
                {pkg.footnote && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: completeDeltaAboveMax > 0 && pkg.tier === 'RECOMMENDED' ? BRAND_PINK : BRAND_SUCCESS, paddingLeft: 24 }}>
                    {pkg.footnote}
                  </div>
                )}
              </button>
            );
          })}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => {
                const chosenPrice =
                  draft.packageOption === 'WITHIN_BUDGET'
                    ? estimatedPricing.low
                    : draft.packageOption === 'PRIORITY'
                      ? estimatedPricing.priority
                      : estimatedPricing.recommended;
                updateDraft({
                  pricingDecision: 'RECOMMENDED',
                  minBudgetInput: formatWithCommas(Math.round((chosenPrice * 0.9) / 10000) * 10000),
                  maxBudgetInput: formatWithCommas(chosenPrice),
                });
                setStep(5);
              }}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: 'none',
                background: BRAND_BLUE,
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <i className="bi bi-check-circle-fill" /> Use recommended pricing
            </button>
            <button
              type="button"
              onClick={() => {
                updateDraft({ pricingDecision: 'MY_OFFER_ANYWAY' });
                setStep(5);
              }}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${BORDER_COLOR}`,
                background: BG_CARD,
                color: TEXT_PRIMARY,
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              Publish my offer anyway
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPolicies((v) => !v)}
            style={{ background: 'none', border: 'none', padding: 0, color: TEXT_MUTED, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="bi bi-shield-check" style={{ color: BRAND_BLUE }} />
            <span>View booking policies</span>
            <i className={`bi ${showPolicies ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
          </button>
          {showPolicies && (
            <div style={{ fontSize: '0.76rem', color: TEXT_SECONDARY, lineHeight: 1.5, paddingLeft: 8 }}>
              • Photographers can accept your offer or send a counter-offer<br />
              • No payment until you confirm a photographer<br />
              • Payments are protected in Connekyt escrow until delivery
            </div>
          )}
        </div>
      </div>
    );
  };

  // ───────── Step 5 of 5: REVIEW & PUBLISH ─────────
  const renderStep5 = () => {
    const budgetMinText = (effectiveBudget.min ?? 300000).toLocaleString('en-US');
    const budgetMaxText = (effectiveBudget.max ?? estimatedPricing.recommended).toLocaleString('en-US');
    const matchCount = preview?.matchCount ?? preview?.count;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 18, borderRadius: 18, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(8,58,133,0.10)', color: BRAND_BLUE, fontSize: '0.72rem', fontWeight: 800 }}>
              <i className="bi bi-camera" /> {formatCoverageModeLabel(draft.coverageMode)}
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: BG_SUBTLE, color: TEXT_SECONDARY, fontSize: '0.72rem', fontWeight: 700 }}>
              {formatSessionTypeLabel(draft.sessionType)}
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: BG_SUBTLE, color: TEXT_SECONDARY, fontSize: '0.72rem', fontWeight: 700 }}>
              {draft.clientType === 'ORGANIZATION' ? 'Organization' : 'Individual'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: TEXT_PRIMARY }}>{generatedEventTitle}</div>
              <div style={{ fontSize: '0.82rem', color: TEXT_SECONDARY, marginTop: 4 }}>
                <i className="bi bi-calendar-event" /> {draft.date} • {draft.startTime}–{draft.endTime} ({durationText(minutes) || '6 hours'})
              </div>
              <div style={{ fontSize: '0.82rem', color: TEXT_SECONDARY, marginTop: 2 }}>
                <i className="bi bi-geo-alt" /> {[draft.venue.trim(), draft.city].filter(Boolean).join(', ')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${BORDER_COLOR}`, background: BG_SUBTLE, color: BRAND_BLUE, fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}
            >
              <i className="bi bi-pencil" /> Edit
            </button>
          </div>

          <div style={{ padding: 12, borderRadius: 12, background: BG_SUBTLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.06em' }}>PUBLISHED BUDGET OFFER</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: BRAND_BLUE }}>
                RWF {budgetMinText} – {budgetMaxText}
              </div>
              <button type="button" onClick={() => setStep(3)} style={{ background: 'none', border: 'none', padding: 0, color: BRAND_BLUE, fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>
                Change budget
              </button>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(4,120,87,0.12)', color: BRAND_SUCCESS, fontWeight: 800, fontSize: '0.78rem' }}>
              <i className="bi bi-people-fill" />
              {previewLoading ? 'Checking...' : typeof matchCount === 'number' ? `${matchCount} photographers fit` : 'Ready to broadcast'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: TEXT_PRIMARY }}>Requested deliverables</span>
              <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: BRAND_BLUE, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
            </div>
            {[
              ['Coverage hours', durationText(minutes) || '6 hours'],
              ['Edited photos', draft.coverageMode === 'VIDEO' ? 'None' : String(draft.editedPhotos)],
              ['Short videos', formatShortVideosSummary(draft)],
              ['Long videos', formatLongVideosSummary(draft)],
              ['Live stream', formatLiveStreamSummary(draft)],
              ['Drone capturing', formatDroneCapturingSummary(draft)],
              ['Wishes & memories', formatInstantWishesSummary(draft)],
              ['Photo book', formatPhotoBookSummary(draft)],
              ['Photo album', formatPhotoAlbumSummary(draft)],
              ['Wall portraits', formatWallPortraitSummary(draft)],
              ['Instant updates', draft.instantUpdates ? 'Yes (same day)' : 'No'],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0', borderBottom: `1px dashed ${BORDER_COLOR}` }}>
                <span style={{ color: TEXT_SECONDARY }}>{lbl}</span>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 700, textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: TEXT_PRIMARY }}>Delivery &amp; preferences</span>
              <button type="button" onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: BRAND_BLUE, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
            </div>
            {[
              ['Digital delivery', `Within ${draft.digitalDeadline} after the event`],
              ['Print production', draft.printProductionTime === 'Propose production & handover date' && draft.printProposedDate ? `Proposed: ${draft.printProposedDate}` : draft.printProductionTime],
              ['Print handover', draft.printCollectionMethod === 'Deliver to my home address' && draft.printDeliveryAddress.trim() ? `Home (${draft.printDeliveryAddress.trim()})` : draft.printCollectionMethod],
              ['Editing style', draft.editingStyle],
              ['Usage rights', draft.usageRights],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '5px 0', borderBottom: `1px dashed ${BORDER_COLOR}`, gap: 8 }}>
                <span style={{ color: TEXT_SECONDARY }}>{lbl}</span>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 700, textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ───────── Step = 'auth': Inline Sign-In / Sign-Up Gate before Publishing ─────────
  const renderAuthGate = () => (
    <div style={{ maxWidth: 440, margin: '0 auto', width: '100%', padding: '12px 0' }}>
      <h3 style={{ color: TEXT_PRIMARY, fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>
        {authStep === 'otp' ? 'Verify your email' : authStep === 'signup' ? 'Create an account to publish' : 'Sign in to publish your offer'}
      </h3>
      <p style={{ color: TEXT_SECONDARY, fontSize: '0.84rem', textAlign: 'center', margin: '0 0 18px' }}>
        Your event offer is ready. Sign in so we can alert matching photographers and send their answers to your dashboard.
      </p>

      {authError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#DC2626', fontSize: '0.82rem' }}>
          {authError}
        </div>
      )}

      {authStep === 'login' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" style={fieldStyle} onKeyDown={(e) => e.key === 'Enter' && handleAuthLogin()} />
          <div style={{ position: 'relative' }}>
            <input type={showLoginPassword ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" style={{ ...fieldStyle, paddingRight: 42 }} onKeyDown={(e) => e.key === 'Enter' && handleAuthLogin()} />
            <button type="button" onClick={() => setShowLoginPassword((v) => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer' }}>
              <i className={`bi ${showLoginPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAuthLogin}
            disabled={authLoading || submitting}
            style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: BRAND_PINK, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {authLoading || submitting ? 'Signing in & publishing...' : 'Sign In & Publish Offer'}
          </button>
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={googleLoading}
            style={{ ...fieldStyle, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <i className="bi bi-google" style={{ color: '#EA4335' }} />
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
          <p style={{ color: TEXT_MUTED, fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>
            New to Connekyt?{' '}
            <button type="button" onClick={() => { setAuthStep('signup'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: BRAND_BLUE, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Create an account
            </button>
          </p>
        </div>
      )}

      {authStep === 'signup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="text" value={signupFirst} onChange={(e) => setSignupFirst(e.target.value)} placeholder="First name" style={fieldStyle} />
            <input type="text" value={signupLast} onChange={(e) => setSignupLast(e.target.value)} placeholder="Last name" style={fieldStyle} />
          </div>
          <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="Email" style={fieldStyle} />
          <InternationalPhoneInput onChange={setSignupPhoneVal} disabled={authLoading} ariaLabel="Phone number" />
          <div style={{ position: 'relative' }}>
            <input type={showSignupPassword ? 'text' : 'password'} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Password" style={{ ...fieldStyle, paddingRight: 42 }} onKeyDown={(e) => e.key === 'Enter' && handleAuthSignup()} />
            <button type="button" onClick={() => setShowSignupPassword((v) => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer' }}>
              <i className={`bi ${showSignupPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAuthSignup}
            disabled={authLoading}
            style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: BRAND_PINK, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {authLoading ? 'Creating account...' : 'Create Account & Continue'}
          </button>
          <p style={{ color: TEXT_MUTED, fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>
            Already have an account?{' '}
            <button type="button" onClick={() => { setAuthStep('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: BRAND_BLUE, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              Sign In
            </button>
          </p>
        </div>
      )}

      {authStep === 'otp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: TEXT_SECONDARY, fontSize: '0.84rem', margin: 0, textAlign: 'center' }}>
            Enter the verification code sent to <strong>{otpEmail}</strong>
          </p>
          <OtpInput
            id="hybrid-offer-otp"
            value={otpValue}
            onChange={(v) => { setOtpValue(v); otpRefusal.clear(); }}
            onComplete={(c) => { void handleAuthOtp(c); }}
            error={otpRefusal.error}
            hint={otpRefusal.hint}
            busy={authLoading}
            disabled={otpRefusal.locked}
            shakeKey={otpRefusal.shakeKey}
            colors={{ border: BORDER_COLOR, bg: BG_CARD, text: TEXT_PRIMARY, muted: TEXT_SECONDARY }}
          />
          <button
            type="button"
            onClick={() => handleAuthOtp()}
            disabled={authLoading || otpRefusal.locked || otpValue.length < 6}
            style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: BRAND_PINK, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {authLoading ? 'Verifying & publishing...' : 'Verify & Publish Offer'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="knockout-hybrid-wiz-title"
      className="ck-keep-radius"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(6px)',
        padding: 16,
      }}
    >
      <style>{`
        .ck-keep-radius button[data-ck-shape="card"] {
          border-radius: 16px !important;
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: BG_CARD,
          borderRadius: 22,
          overflow: 'hidden',
          border: `1px solid ${BORDER_COLOR}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
        }}
      >
        {/* Header */}
        <header style={{ padding: '1rem 1.4rem', borderBottom: `1px solid ${BORDER_COLOR}`, background: BG_CARD }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {step !== 'done' && (
                <button
                  type="button"
                  onClick={step === 'select' ? onClose : goBack}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: BG_SUBTLE, color: TEXT_PRIMARY, cursor: 'pointer' }}
                >
                  <i className="bi bi-arrow-left" />
                </button>
              )}
              <div>
                <h2 id="knockout-hybrid-wiz-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: TEXT_PRIMARY }}>
                  {step === 'select'
                    ? 'How would you like to book?'
                    : step === 'session'
                      ? 'Choose your session setting'
                      : step === 'auth'
                        ? 'Publish Your Event Offer'
                        : step === 'done'
                          ? 'Offer published!'
                          : 'Create Your Event Offer'}
                </h2>
                {typeof step === 'number' && (
                  <div style={{ fontSize: '0.73rem', fontWeight: 800, color: BRAND_PINK, letterSpacing: '0.06em' }}>
                    STEP {activeStepNum} OF 5 • {STEP_LABELS[activeStepNum]}
                    {savingDraft ? ' • Saving draft...' : ''}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: BG_SUBTLE, color: TEXT_SECONDARY, cursor: 'pointer', fontSize: 18 }}
            >
              <i className="bi bi-x" />
            </button>
          </div>

          {typeof step === 'number' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 10 }}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <div
                  key={n}
                  style={{
                    height: 5,
                    borderRadius: 999,
                    background: n <= activeStepNum ? BRAND_PINK : '#E2E8F0',
                  }}
                />
              ))}
            </div>
          )}
        </header>

        {/* Body */}
        <div
          ref={bodyScrollRef}
          style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, background: '#F8FAFC' }}
        >
          {analyzingPackagesPreloader ? (
            <div style={{ padding: '44px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: BG_CARD, borderRadius: 18, border: `1px solid ${BORDER_COLOR}` }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(8,58,133,0.10)',
                  color: BRAND_BLUE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                }}
              >
                <i className="bi bi-search" />
              </div>
              <div style={{ fontSize: '1.08rem', fontWeight: 800, color: TEXT_PRIMARY }}>
                Searching for latest packages update to recommend...
              </div>
              <div style={{ fontSize: '0.84rem', color: TEXT_SECONDARY, maxWidth: 420, lineHeight: 1.5 }}>
                {preloaderStageIndex === 0
                  ? 'Scanning active photographer packages across Indoor & Outdoor sessions...'
                  : preloaderStageIndex === 1
                    ? 'Selecting the best 3 packages for each item you picked...'
                    : `Converting package currencies to ${clientCurrency} & computing summation and average...`}
              </div>
              <div style={{ width: '100%', maxWidth: 320, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background: idx <= preloaderStageIndex ? BRAND_PINK : '#E2E8F0',
                      transition: 'background 0.25s',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {step === 'select' && renderModeSelect()}
              {step === 'session' && renderSessionChoice()}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 'auth' && renderAuthGate()}
            </>
          )}

          {step === 'done' && result && (
            <div style={{ textAlign: 'center', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: BG_CARD, borderRadius: 18, border: `1px solid ${BORDER_COLOR}` }}>
              <span
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: result.invited > 0 ? 'rgba(4,120,87,0.12)' : 'rgba(217,119,6,0.12)',
                  color: result.invited > 0 ? BRAND_SUCCESS : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                }}
              >
                <i className={`bi ${result.invited > 0 ? 'bi-check-lg' : 'bi-exclamation-triangle'}`} />
              </span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: TEXT_PRIMARY }}>
                {result.invited > 0
                  ? `${result.invited} photographer${result.invited === 1 ? ' was' : 's were'} alerted`
                  : 'Your event offer has been saved'}
              </h3>
              <p style={{ margin: 0, maxWidth: 480, fontSize: '0.88rem', color: TEXT_SECONDARY, lineHeight: 1.55 }}>
                {result.invited > 0
                  ? 'Matching photographers have been notified! As each photographer accepts your offer price or proposes their closest package, they appear in your Dashboard Shortlist where you can compare them, select your favorite, and confirm & pay securely in escrow.'
                  : 'Open your Dashboard to follow responses, adjust your budget or date, or browse photographers directly.'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => redirectToDashboardCandidates(result.eventId, true)}
                  style={{
                    padding: '0.8rem 1.6rem',
                    borderRadius: 12,
                    border: 'none',
                    background: BRAND_PINK,
                    color: '#fff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 10px 24px -6px rgba(242,12,143,0.45)',
                  }}
                >
                  <i className="bi bi-people-fill" /> Follow the answers on Dashboard <i className="bi bi-arrow-right" />
                </button>
                <button
                  type="button"
                  onClick={() => redirectToDashboardCandidates(result.eventId, false)}
                  style={{
                    padding: '0.8rem 1.3rem',
                    borderRadius: 12,
                    border: `1.5px solid ${BORDER_COLOR}`,
                    background: BG_CARD,
                    color: BRAND_BLUE,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                  }}
                >
                  View All My Events
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Global Error & Buttons Footer */}
        {(typeof step === 'number' || errorMsg || optionsError) && (
          <footer style={{ padding: '0.9rem 1.4rem', borderTop: `1px solid ${BORDER_COLOR}`, background: BG_CARD, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(errorMsg || optionsError) && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-exclamation-octagon-fill" style={{ fontSize: 16, flexShrink: 0 }} />
                  <span>{errorMsg || optionsError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setOptionsError(null);
                  }}
                  aria-label="Dismiss error"
                  style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4, fontSize: 16, lineHeight: 1 }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            )}
            {typeof step === 'number' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={goBack}
                  disabled={submitting}
                  style={{
                    padding: '0.65rem 1.1rem',
                    borderRadius: 12,
                    border: `1.5px solid ${BORDER_COLOR}`,
                    background: BG_CARD,
                    color: TEXT_SECONDARY,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                {step < 5 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    style={{
                      padding: '0.68rem 1.5rem',
                      borderRadius: 12,
                      border: 'none',
                      background: BRAND_BLUE,
                      color: '#fff',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Continue <i className="bi bi-arrow-right" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishClick}
                    disabled={submitting}
                    style={{
                      padding: '0.72rem 1.6rem',
                      borderRadius: 12,
                      border: 'none',
                      background: BRAND_PINK,
                      color: '#fff',
                      fontWeight: 800,
                      cursor: submitting ? 'wait' : 'pointer',
                    }}
                  >
                    {submitting ? 'Publishing...' : 'PUBLISH EVENT OFFER'} <i className="bi bi-broadcast" />
                  </button>
                )}
              </div>
            )}
          </footer>
        )}
      </div>

      {/* Continue where you left off modal */}
      {resumePromptDraft && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            padding: 16,
          }}
        >
          <div style={{ width: '100%', maxWidth: 420, background: BG_CARD, borderRadius: 20, padding: 20, border: `1px solid ${BORDER_COLOR}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(8,58,133,0.10)', color: BRAND_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                <i className="bi bi-journal-bookmark-fill" />
              </span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: TEXT_PRIMARY }}>
                Continue where you left off?
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: TEXT_SECONDARY, lineHeight: 1.45 }}>
              You have an unfinished <strong>{resumePromptDraft.draft.eventTypeKey || 'Event'}</strong> offer in{' '}
              <strong>{resumePromptDraft.draft.city || 'Kigali'}</strong> (saved at Step {resumePromptDraft.step} of 5).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  createdEventIdRef.current = resumePromptDraft.id;
                  setDraft(resumePromptDraft.draft);
                  setStep(resumePromptDraft.step);
                  setResumePromptDraft(null);
                }}
                style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: BRAND_BLUE, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                Continue saved draft (Step {resumePromptDraft.step} of 5)
              </button>
              <button
                type="button"
                disabled={discardingDraft}
                onClick={async () => {
                  const idToDelete = resumePromptDraft.id;
                  setDiscardingDraft(true);
                  await deleteHybridDraft(idToDelete);
                  createdEventIdRef.current = null;
                  setDraft({ ...DEFAULT_OFFER_DRAFT, date: isoDate(nextWeekday(6, 1)) });
                  setResumePromptDraft(null);
                  setDiscardingDraft(false);
                }}
                style={{ padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${BORDER_COLOR}`, background: BG_CARD, color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}
              >
                {discardingDraft ? 'Discarding...' : 'Discard & start fresh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
