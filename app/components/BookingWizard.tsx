'use client';

import React, { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import PaymentCurrencyPreview, { type CurrencyCode, useLiveRates } from './PaymentCurrencyPreview';
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
import { createEvent, type CreateEventResponse } from '@/lib/APIs/events/create-event/route';
import { revokeUnpaidEvent } from '@/lib/APIs/events/revoke-unpaid/route';
import XentriPayModal from './XentriPayModal';
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
  // When true, renders the availability gate instead of the current slide.
  // Becomes true right after a photographer is selected, and is flipped
  // off again once the user picks a free event date and clicks Continue.
  showAvailabilityGate: boolean;
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
  | { type: 'SHOW_AVAILABILITY_GATE'; id: string }
  | { type: 'CONFIRM_AVAILABILITY' }
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
  showAvailabilityGate: false,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_SLIDE': return { ...state, currentSlide: action.slide };
    case 'SET_QUICK_BRIEF': return { ...state, quickBrief: action.data, currentSlide: 1 };
    // Selecting a photographer now opens the Availability Gate instead of jumping straight to packages.
    case 'SET_SELECTED_PHOTOGRAPHER': return { ...state, selectedPhotographerId: action.id, showAvailabilityGate: true };
    case 'SHOW_AVAILABILITY_GATE': return { ...state, selectedPhotographerId: action.id, showAvailabilityGate: true };
    case 'CONFIRM_AVAILABILITY': return { ...state, showAvailabilityGate: false, currentSlide: state.selectedPackageId ? 3 : 2 };
    // Just stores the selection — advancing to the Milestone slide happens on explicit Continue.
    case 'SET_SELECTED_PACKAGE': return { ...state, selectedPackageId: action.id };
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
// Brand palette + visual tokens — change here and the whole wizard updates.

const ACCENT = '#083A85';
const ACCENT_DARK = '#062a63';
const OVERLAY_BG = 'rgba(8, 28, 60, 0.55)';
const PANEL_BG = '#ffffff';
const INPUT_BG = '#f8fafc';
const INPUT_BORDER = '#e2e8f0';
const TEXT_PRIMARY = '#0f172a';
const TEXT_SECONDARY = '#475569';
const TEXT_MUTED = '#64748b';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: INPUT_BG,
  border: `1.5px solid ${INPUT_BORDER}`, borderRadius: 10, color: TEXT_PRIMARY,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  width: '100%', padding: '13px 20px',
  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
  border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 10px 24px -10px rgba(8,58,133,0.55)',
  transition: 'transform 0.18s, box-shadow 0.18s, opacity 0.18s',
  fontFamily: 'inherit',
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 18px', background: '#ffffff',
  border: `1.5px solid ${INPUT_BORDER}`, borderRadius: 10,
  color: TEXT_SECONDARY, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.18s',
  fontFamily: 'inherit',
};

const INCLUSIVITY_OPTIONS = [
  'Live Stream', 'Photobook', 'Video Coverage', 'Drone', 'Same-Day Edits', 'Photo Booth',
];


// ─── Main Component ───

// Helper: find a blocked entry matching a "YYYY-MM-DD" date
function findDateConflict(dateStr: string, bookedDates: BookedDate[]): BookedDate | null {
  if (!dateStr) return null;
  return bookedDates.find(b => b.date === dateStr) || null;
}

// Helper: human-readable reason for a blocked date
function describeConflict(b: BookedDate): string {
  if (b.reason === 'event') {
    return b.isFullDay
      ? `Photographer is already booked for an event on ${b.date}.`
      : `Photographer has a partial booking on ${b.date}.`;
  }
  if (b.reason === 'preparation') {
    return `Photographer is preparing for an event on ${b.eventDate} the next day.`;
  }
  if (b.reason === 'delivery') {
    return `Photographer is delivering work for the ${b.eventDate} event (day ${b.deliveryDayIndex} of ${b.deliveryDaysTotal}).`;
  }
  return 'This date is unavailable.';
}

// Currency code → ISO 3166-1 alpha-2 country code, used to fetch flag PNGs
// from flagcdn.com. Native flag emojis don't render on Windows fonts, so we
// use the same image-CDN approach the navbar's language picker uses.
const CURRENCY_FLAG_CODES: Record<string, string> = {
  // East / Africa
  RWF: 'rw', KES: 'ke', UGX: 'ug', TZS: 'tz', BIF: 'bi',
  ZAR: 'za', NGN: 'ng', GHS: 'gh', EGP: 'eg', ETB: 'et',
  MAD: 'ma', DZD: 'dz', TND: 'tn',
  // World
  USD: 'us', EUR: 'eu', GBP: 'gb', CAD: 'ca', AUD: 'au', NZD: 'nz',
  CHF: 'ch', SEK: 'se', NOK: 'no', DKK: 'dk',
  JPY: 'jp', CNY: 'cn', INR: 'in', BRL: 'br', MXN: 'mx',
  AED: 'ae', SAR: 'sa', QAR: 'qa', TRY: 'tr', RUB: 'ru',
  SGD: 'sg', HKD: 'hk', KRW: 'kr', THB: 'th',
};
function flagCode(code?: string): string | null {
  if (!code) return null;
  return CURRENCY_FLAG_CODES[code.toUpperCase()] || null;
}

// ─── Visual styles for the wizard shell, stepper, and inputs/buttons ───
// Scoped via the .bw-* class prefix so nothing leaks. Keeps the existing
// inline-style world working — these are layered on top.
function BookingWizardStyles() {
  return (
    <style>{`
      @keyframes bwFadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes bwSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* Overlay + panel */
      .bw-overlay {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: rgba(8, 28, 60, 0.55);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: bwFadeIn 0.2s ease-out;
      }
      .bw-panel {
        position: relative;
        width: 100%;
        max-width: 720px;
        max-height: 92vh;
        background: #fff;
        border-radius: 24px;
        box-shadow: 0 30px 80px -20px rgba(8, 28, 60, 0.40), 0 0 0 1px rgba(8, 58, 133, 0.06);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: bwSlideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        font-family: 'Pragati Narrow', system-ui, sans-serif;
      }

      /* Branded header — 3 columns: [back] [eyebrow] [close] */
      .bw-header {
        position: relative;
        background: linear-gradient(135deg, #083A85 0%, #062a63 100%);
        color: #fff;
        padding: 16px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        overflow: hidden;
      }
      .bw-header::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
        background-size: 18px 18px;
        opacity: 0.5;
        pointer-events: none;
      }
      .bw-header-text {
        position: relative;
        z-index: 1;
        flex: 1;
        min-width: 0;
        text-align: center;
      }
      .bw-header-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.10em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.85);
      }
      .bw-header-eyebrow i { color: #ffd28a; }
      .bw-header-title {
        margin: 4px 0 0;
        font-size: 1.15rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.01em;
        line-height: 1.2;
      }
      .bw-header-back,
      .bw-header-close {
        position: relative;
        z-index: 1;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        flex-shrink: 0;
        transition: background 0.18s, transform 0.18s;
        font-family: inherit;
      }
      .bw-header-close:hover { background: rgba(255, 255, 255, 0.30); transform: scale(1.06); }
      .bw-header-back:hover  { background: rgba(255, 255, 255, 0.30); transform: translateX(-2px); }
      /* Spacer keeps the eyebrow centered when the back button is hidden */
      .bw-header-spacer { width: 36px; height: 36px; flex-shrink: 0; }

      /* Step indicator */
      .bw-stepper {
        display: flex;
        align-items: center;
        padding: 18px 24px;
        gap: 0;
        background: linear-gradient(180deg, rgba(8,58,133,0.04) 0%, transparent 100%);
        border-bottom: 1px solid #f1f5f9;
      }
      .bw-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
      }
      .bw-step-circle {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.78rem;
        font-weight: 700;
        background: #fff;
        color: #94a3b8;
        border: 2px solid #e2e8f0;
        transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
      }
      .bw-step.is-active .bw-step-circle {
        background: #083A85;
        color: #fff;
        border-color: #083A85;
        box-shadow: 0 0 0 4px rgba(8, 58, 133, 0.15);
      }
      .bw-step.is-done .bw-step-circle {
        background: #083A85;
        color: #fff;
        border-color: #083A85;
      }
      .bw-step-label {
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #94a3b8;
        white-space: nowrap;
      }
      .bw-step.is-active .bw-step-label,
      .bw-step.is-done .bw-step-label { color: #083A85; }
      .bw-step-line {
        flex: 1;
        height: 2px;
        background: #e2e8f0;
        border-radius: 2px;
        margin: 0 4px 22px;
        transition: background 0.32s ease-out;
      }
      .bw-step-line.is-done { background: #083A85; }

      /* Content scroll area */
      .bw-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        scrollbar-width: thin;
        scrollbar-color: rgba(8,58,133,0.25) transparent;
      }
      .bw-content::-webkit-scrollbar { width: 8px; }
      .bw-content::-webkit-scrollbar-track { background: transparent; }
      .bw-content::-webkit-scrollbar-thumb { background: rgba(8,58,133,0.25); border-radius: 4px; }

      /* Input focus ring (layers on top of inline inputStyle) */
      .bw-panel input:not([type="checkbox"]):not([type="radio"]):focus,
      .bw-panel select:focus,
      .bw-panel textarea:focus {
        border-color: #083A85 !important;
        box-shadow: 0 0 0 4px rgba(8, 58, 133, 0.10);
        background: #fff !important;
      }
      .bw-panel input::placeholder,
      .bw-panel textarea::placeholder { color: #94a3b8; }

      /* Primary button hover (matches the gradient inline style) */
      .bw-panel button[style*="linear-gradient(135deg, rgb(8, 58, 133)"]:hover:not(:disabled),
      .bw-panel button[style*="linear-gradient(135deg, #083A85"]:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 14px 30px -10px rgba(8, 58, 133, 0.7) !important;
      }
      .bw-panel button:disabled { opacity: 0.55; cursor: not-allowed; }
      .bw-panel button:focus-visible {
        outline: 2px solid #083A85;
        outline-offset: 2px;
      }

      /* Mobile */
      @media (max-width: 600px) {
        .bw-overlay { padding: 0; align-items: flex-end; }
        .bw-panel {
          max-height: 96vh;
          border-radius: 20px 20px 0 0;
          max-width: 100%;
        }
        .bw-header { padding: 14px 14px; }
        .bw-header-title { font-size: 1rem; }
        .bw-header-eyebrow { font-size: 0.62rem; }
        .bw-header-back, .bw-header-close, .bw-header-spacer { width: 32px; height: 32px; }
        .bw-stepper { padding: 14px 14px; }
        .bw-step-circle { width: 26px; height: 26px; font-size: 0.7rem; }
        .bw-step-label { font-size: 0.52rem; letter-spacing: 0.04em; }
        .bw-step-line { margin: 0 2px 18px; }
        .bw-content { padding: 18px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .bw-overlay, .bw-panel { animation: none; }
      }
    `}</style>
  );
}

// Tiny visual atom — flag image (flagcdn.com) + currency code. Used inside
// the custom CurrencySelect since native <option> elements strip HTML.
function CurrencyChip({ code, size = 18 }: { code: string; size?: number }) {
  const cc = flagCode(code);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      {cc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://flagcdn.com/w40/${cc}.png`}
          alt=""
          width={size + 6}
          height={Math.round((size + 6) * 0.75)}
          style={{ display: 'block', borderRadius: 2, objectFit: 'cover', flex: 'none' }}
          loading="lazy"
        />
      ) : (
        <span style={{ fontSize: size, lineHeight: 1, flex: 'none' }} aria-hidden="true">🌐</span>
      )}
      <span>{code}</span>
    </span>
  );
}

// Custom currency dropdown — looks like the inputStyle trigger but the
// popover renders flag images via CurrencyChip (native <select> can't).
function CurrencySelect({
  value, options, onChange,
}: {
  value: string;
  options: { id: string; code: string }[];
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: '0 0 auto', minWidth: 118 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          ...inputStyle,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <CurrencyChip code={value} />
        <i className="bi bi-chevron-up" aria-hidden="true" style={{ color: '#94a3b8', fontSize: 11, flex: 'none' }} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Currency"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            margin: 0,
            padding: 4,
            listStyle: 'none',
            background: '#fff',
            border: `1px solid rgba(8, 58, 133, 0.12)`,
            borderRadius: 12,
            boxShadow: '0 16px 36px -12px rgba(8, 58, 133, 0.22), 0 4px 10px rgba(0,0,0,0.06)',
            maxHeight: 260,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(8,58,133,0.25) transparent',
          }}
        >
          {options.map(opt => {
            const isSelected = opt.code === value;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { onChange(opt.code); setOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: isSelected ? 'rgba(8,58,133,0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    color: isSelected ? ACCENT : TEXT_PRIMARY,
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: 'left',
                  }}
                >
                  <CurrencyChip code={opt.code} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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
  const [selectedPhotoBookedDates, setSelectedPhotoBookedDates] = useState<BookedDate[]>([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null);
  const [submitError, setSubmitError] = useState('');

  // ── Slide 1 local state ──
  const [briefDate, setBriefDate] = useState('');
  const [briefLocation, setBriefLocation] = useState('');
  const [briefBudgetMin, setBriefBudgetMin] = useState<number>(0);
  // 0 = "no max specified" — the photographer filter treats it as Infinity
  // (see line ~967). Showing 0 as empty in the input lets the placeholder
  // appear naturally and lets users type their own preferred max.
  const [briefBudgetMax, setBriefBudgetMax] = useState<number>(0);
  const [briefPrefs, setBriefPrefs] = useState<string[]>([]);
  const [briefCurrency, setBriefCurrency] = useState('RWF');
  const [briefError, setBriefError] = useState('');

  // ── Slide 3 extras ──
  const [extraPhotos, setExtraPhotos] = useState(0);
  const [extraVideos, setExtraVideos] = useState(0);

  // ── Slide 4 milestone ──
  const [milestoneOption, setMilestoneOption] = useState<'full' | 'half' | 'thirty'>('half');

  // ── Slide 5 local state ──
  const [evtDate, setEvtDate] = useState('');
  const [evtLocation, setEvtLocation] = useState('');
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

  // ── Payment modal state ──
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDeclarationId, setPaymentDeclarationId] = useState<string | null>(null);
  const [paymentAmountValue, setPaymentAmountValue] = useState<number>(0);
  const [paymentCurrencyCode, setPaymentCurrencyCode] = useState<string>('RWF');
  const [paymentCurrencyId, setPaymentCurrencyId] = useState<string>('');
  // Display-only currency for the Payment Plan step. Controlled by the
  // PaymentCurrencyPreview panel's selector — picking a new currency there
  // re-renders every amount on this step (total + milestone breakdowns +
  // the per-option previews). Submit still uses paymentCurrencyCode.
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('USD');
  const { format: formatLive } = useLiveRates();
  const fmtLive = (val: number) => formatLive(val, (paymentCurrencyCode || 'RWF') as CurrencyCode, displayCurrency);
  const [paymentEventId, setPaymentEventId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Detect if user is a coordinator
  const isCoordinator = user?.customerType?.toLowerCase().includes('coordinator') || false;

  // ── Availability Gate state ──
  const [gateDate, setGateDate] = useState('');
  const [gateCalendarMonth, setGateCalendarMonth] = useState<{ year: number; month: number }>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  // Seed gate date from Quick Brief date (non-preselected flow) whenever the gate opens.
  useEffect(() => {
    if (state.showAvailabilityGate) {
      setGateDate(briefDate || '');
      if (briefDate) {
        const [yr, mo] = briefDate.split('-').map(Number);
        if (!isNaN(yr) && !isNaN(mo)) setGateCalendarMonth({ year: yr, month: mo - 1 });
      }
    }
  }, [state.showAvailabilityGate, briefDate]);

  const gateDateConflict = findDateConflict(gateDate, selectedPhotoBookedDates);
  const gateDateIsPast = (() => {
    if (!gateDate) return false;
    const [yr, mo, da] = gateDate.split('-').map(Number);
    const sel = new Date(yr, mo - 1, da);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sel < today;
  })();
  const gateCanProceed = !!gateDate && !gateDateConflict && !gateDateIsPast;

  const confirmAvailability = () => {
    if (!gateCanProceed) return;
    // Mirror the picked date into both Quick-Brief and Event-Details date fields so every
    // downstream slide reuses it automatically without asking the user again.
    setBriefDate(gateDate);
    setEvtDate(gateDate);
    if (state.quickBrief) {
      dispatch({ type: 'SET_QUICK_BRIEF', data: { ...state.quickBrief, eventDate: gateDate } });
    }
    dispatch({ type: 'CONFIRM_AVAILABILITY' });
  };

  // Human-readable bits for the gate UI
  const photographerDisplayName = (() => {
    const p = selectedPhotographer;
    if (!p) return 'this photographer';
    const first = (p.firstName || '').trim();
    const last = (p.lastName || '').trim();
    const full = `${first} ${last}`.trim();
    return full || 'this photographer';
  })();
  const photographerAvatar = selectedPhotographer?.profilePicture || null;
  const gateDateLabel = gateDate && !gateDateConflict && !gateDateIsPast
    ? (() => {
        const [yr, mo, da] = gateDate.split('-').map(Number);
        return new Date(yr, mo - 1, da).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        });
      })()
    : '';

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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

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

  // ── Auto-fill defaults when preselected photographer (Quick Brief skipped) ──
  useEffect(() => {
    if (!isOpen || !preselectedPhotographerId) return;
    // Set default event date to 7 days from today
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const dateStr = defaultDate.toISOString().split('T')[0];
    setEvtDate(dateStr);
    setEvtStartTime('09:00');
    // Fetch photographer info to auto-fill location
    getPhotographerById(preselectedPhotographerId).then(res => {
      if (res.success && res.data) {
        const raw = res.data as unknown as Record<string, unknown>;
        const pData = (raw?.data ? raw.data : res.data) as Photographer;
        if (pData.address) setEvtLocation(pData.address);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preselectedPhotographerId]);

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

  // ── Fetch booked dates for the selected photographer (1 year ahead) ──
  useEffect(() => {
    if (!state.selectedPhotographerId) { setSelectedPhotoBookedDates([]); return; }
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 365);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    getBookedDates({ photographerId: state.selectedPhotographerId, from: fmt(today), to: fmt(future) })
      .then(res => {
        if (res.success) setSelectedPhotoBookedDates(Array.isArray(res.data) ? res.data : []);
      }).catch(() => {});
  }, [state.selectedPhotographerId]);

  // ── Resolve the selected photographer's profile so the gate can show name/avatar ──
  useEffect(() => {
    if (!state.selectedPhotographerId) { setSelectedPhotographer(null); return; }
    // Try local list first (non-preselected flow already loaded it)
    const fromList = photographers.find(p => p.id === state.selectedPhotographerId);
    if (fromList) { setSelectedPhotographer(fromList); return; }
    // Otherwise fetch (preselected flow, list may not be loaded)
    getPhotographerById(state.selectedPhotographerId).then(res => {
      if (res.success && res.data) {
        const raw = res.data as unknown as Record<string, unknown>;
        setSelectedPhotographer((raw?.data ? raw.data : res.data) as Photographer);
      }
    }).catch(() => {});
  }, [state.selectedPhotographerId, photographers]);

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

  // Send the user to the photographer's profile page instead of selecting them
  // in-wizard. The booking commitment now happens from view-profile, which
  // re-opens this wizard with the photographer pre-selected (via the
  // `preselectedPhotographerId` prop on this component).
  const handleViewProfile = (id: string) => {
    if (typeof window === 'undefined') return;
    onClose();
    window.location.href = `/user/photographers/view-profile?id=${encodeURIComponent(id)}`;
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
    // Reset extras when switching packages so stale counts don't carry over to a different price point.
    if (id !== state.selectedPackageId) {
      setExtraPhotos(0);
      setExtraVideos(0);
    }
    dispatch({ type: 'SET_SELECTED_PACKAGE', id });
  };
  const handlePackageContinue = () => {
    if (!state.selectedPackageId) return;
    dispatch({ type: 'SET_SLIDE', slide: 3 });
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
    // Validate date & location when Quick Brief was skipped
    if (!state.quickBrief) {
      if (!evtDate) { setEvtError('Please select an event date'); return; }
      if (!evtLocation.trim()) { setEvtError('Please enter the event location'); return; }
    }
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
    // Client-side pre-check: the chosen date must not collide with the photographer's blocked windows.
    const eventDateStr = state.quickBrief?.eventDate || evtDate;
    const preCheck = state.selectedPhotographerId ? findDateConflict(eventDateStr, selectedPhotoBookedDates) : null;
    if (preCheck) {
      setSubmitError(describeConflict(preCheck) + ' Please choose another date.');
      return;
    }

    dispatch({ type: 'SET_SUBMITTING', value: true });
    setSubmitError('');

    try {
      // Build location string — include venue name if provided
      const baseLocation = state.quickBrief?.eventLocation || evtLocation.trim();
      const locationParts = [details.venueName, baseLocation].filter(Boolean);
      const locationStr = locationParts.join(', ') || baseLocation;

      const payload: Record<string, unknown> = {
        title: details.title,
        description: details.description,
        eventType: details.eventType,
        eventDate: state.quickBrief?.eventDate || evtDate,
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
        // Extract response data — server returns { data: { event, booking, declarationId, ... } }
        const responseData = res.data as unknown as CreateEventResponse;
        const innerData = responseData?.data;
        const eventId = innerData?.event?.id || innerData?.id || undefined;
        const declarationId = innerData?.declarationId;
        const payAmount = innerData?.paymentAmount;
        const currAbbr = innerData?.currencyAbbreviation;
        const currId = innerData?.currencyId;

        if (declarationId && payAmount && eventId) {
          // Photographer selected — open payment modal
          setPaymentDeclarationId(declarationId);
          setPaymentAmountValue(payAmount);
          setPaymentCurrencyCode(currAbbr || selectedPkg?.currencyAbbreviation || 'RWF');
          setPaymentCurrencyId(currId || '');
          setPaymentEventId(eventId);
          setShowPaymentModal(true);
          dispatch({ type: 'SET_SUBMITTING', value: false });
        } else {
          // No photographer (or no declaration) — direct success
          await clearDraft();
          dispatch({ type: 'SET_SUCCESS', eventId: eventId || undefined });
        }
      } else {
        // Surface backend DATE_UNAVAILABLE (409) in a friendly way and refresh the blocked-dates cache
        const rawData = res.data as unknown as Record<string, unknown> | undefined;
        const errorCode = (rawData?.error ?? rawData?.code) as string | undefined;
        if (res.statusCode === 409 || errorCode === 'DATE_UNAVAILABLE') {
          const reason = rawData?.reason as BookedDate['reason'] | undefined;
          const conflictingEventDate = rawData?.conflictingEventDate as string | undefined;
          const bookingId = rawData?.conflictingBookingId as string | undefined;
          const synthetic: BookedDate = {
            date: eventDateStr,
            isFullDay: true,
            reason: reason || 'event',
            bookingId: bookingId || 'unknown',
            eventDate: conflictingEventDate || eventDateStr,
          };
          setSubmitError(describeConflict(synthetic) + ' Please choose another date.');
          // Refresh blocked dates so the calendar reflects the new conflict
          if (state.selectedPhotographerId) {
            const today = new Date();
            const future = new Date(today);
            future.setDate(future.getDate() + 365);
            const fmt = (d: Date) => d.toISOString().slice(0, 10);
            getBookedDates({ photographerId: state.selectedPhotographerId, from: fmt(today), to: fmt(future) })
              .then(r => { if (r.success) setSelectedPhotoBookedDates(Array.isArray(r.data) ? r.data : []); })
              .catch(() => {});
          }
        } else {
          setSubmitError(res.error || 'Failed to create booking. Please try again.');
        }
        dispatch({ type: 'SET_SUBMITTING', value: false });
      }
    } catch {
      setSubmitError('Connection error. Please try again.');
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  // ── Payment modal handlers ──

  const handlePaymentSuccess = async (refid: string) => {
    setShowPaymentModal(false);
    await clearDraft();
    dispatch({ type: 'SET_SUCCESS', eventId: paymentEventId || undefined });
  };

  const handlePaymentError = async (error: string) => {
    setShowPaymentModal(false);
    if (paymentEventId) {
      setIsRevoking(true);
      try {
        await revokeUnpaidEvent(paymentEventId);
      } catch {
        // Revocation failed — event may need manual cleanup
      }
      setIsRevoking(false);
    }
    setSubmitError(`Payment failed: ${error}. The booking has been cancelled. Please try again.`);
  };

  const handlePaymentClose = async () => {
    setShowPaymentModal(false);
    if (paymentEventId) {
      setIsRevoking(true);
      try {
        await revokeUnpaidEvent(paymentEventId);
      } catch {
        // Revocation failed
      }
      setIsRevoking(false);
    }
    setSubmitError('Payment was not completed. The booking has been cancelled.');
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
      <BookingWizardStyles />
      <div className="bw-overlay">
        <div className="bw-panel" role="dialog" aria-modal="true" aria-label="Book a photographer">
          {/* Branded header strip — back button (left) + eyebrow + close (right) */}
          <header className="bw-header">
            {(() => {
              const canGoBack =
                !state.bookingSuccess &&
                (state.showAuthInline || state.showAvailabilityGate || state.currentSlide > 0);
              if (!canGoBack) return <div className="bw-header-spacer" aria-hidden="true" />;
              return (
                <button
                  type="button"
                  className="bw-header-back"
                  onClick={() => {
                    if (state.showAuthInline) {
                      dispatch({ type: 'SHOW_AUTH', value: false });
                      return;
                    }
                    if (state.showAvailabilityGate) {
                      if (state.quickBrief) dispatch({ type: 'SET_SLIDE', slide: 1 });
                      else handleClose();
                      return;
                    }
                    if (state.currentSlide > 0) {
                      dispatch({ type: 'SET_SLIDE', slide: state.currentSlide - 1 });
                    }
                  }}
                  aria-label="Go to previous step"
                >
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                </button>
              );
            })()}
            <div className="bw-header-text">
              <span className="bw-header-eyebrow">
                <i className="bi bi-calendar-check" aria-hidden="true" /> Connekyt booking
              </span>
              {state.bookingSuccess && (
                <h2 className="bw-header-title">You&apos;re all set!</h2>
              )}
            </div>
            <button
              type="button"
              className="bw-header-close"
              onClick={handleClose}
              aria-label="Close booking wizard"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </header>

          {/* Step indicator (hidden on overlays/success) */}
          {!state.bookingSuccess && !state.showAuthInline && !state.showAvailabilityGate && (
            <div className="bw-stepper" aria-label="Booking progress">
              {(['Brief', 'Photographer', 'Package', 'Payment', 'Details'] as const).map((label, i, arr) => {
                const isActive = i === state.currentSlide;
                const isDone = i < state.currentSlide;
                return (
                  <React.Fragment key={label}>
                    <div className={`bw-step${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}>
                      <div className="bw-step-circle" aria-current={isActive ? 'step' : undefined}>
                        {isDone ? <i className="bi bi-check-lg" aria-hidden="true" /> : i + 1}
                      </div>
                      <span className="bw-step-label">{label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`bw-step-line${isDone ? ' is-done' : ''}`} aria-hidden="true" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Content area (scrollable) */}
          <div className="bw-content">

            {/* ── Success state ── */}
            {state.bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <i className="bi bi-check-lg" style={{ fontSize: 32, color: '#fff' }}></i>
                </div>
                <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
                  {paymentDeclarationId ? 'Booking Confirmed!' : 'Booking Created!'}
                </h2>
                <p style={{ color: '#40444d', fontSize: 14, margin: '0 0 24px' }}>
                  {paymentDeclarationId
                    ? 'Your payment has been processed and the photographer has been notified. You can manage your booking from the dashboard.'
                    : 'Your event has been created. You can assign a photographer and manage your booking from the dashboard.'}
                </p>
                <button onClick={() => {
                  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com';
                  const userType = (user?.customerType || 'Client')
                    .replace(/([A-Z])/g, (m: string, l: string, i: number) => (i > 0 ? '-' : '') + l.toLowerCase());
                  const dest = new URL(`${dashboardUrl}/user/${userType}/events`);
                  if (state.createdEventId) dest.searchParams.set('eventId', state.createdEventId);
                  // Auth travels via the .connekyt.com HttpOnly session cookie;
                  // no need to put the JWT in the URL.
                  window.location.href = dest.toString();
                }} style={btnPrimary}>
                  Go to Dashboard <i className="bi bi-arrow-right"></i>
                </button>
              </div>

            /* ── Availability Gate (shown after a photographer is chosen, before packages) ── */
            ) : state.showAvailabilityGate ? (
              <div>
                <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>Pick the day of your event</h3>

                {/* Photographer context card — makes it obvious WHO is being booked for WHAT day */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', marginBottom: 14,
                  background: '#f0f5ff', border: '1px solid #dbeafe', borderRadius: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: photographerAvatar ? `url(${photographerAvatar}) center/cover` : 'linear-gradient(135deg,#083A85,#1e5bb7)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(8,58,133,0.2)',
                  }}>
                    {!photographerAvatar && (selectedPhotographer?.firstName?.charAt(0) || '?').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600, letterSpacing: 0.2 }}>
                      YOU&apos;RE BOOKING
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                      {photographerDisplayName}
                    </div>
                  </div>
                </div>

                <p style={{ color: TEXT_SECONDARY, fontSize: 13.5, lineHeight: 1.55, margin: '0 0 14px' }}>
                  Pick the day <strong>{photographerDisplayName}</strong> will photograph your event. The days highlighted below are already taken by other bookings — choose any available (green) day to continue.
                </p>

                {/* Calendar */}
                <div style={{ border: `1px solid ${INPUT_BORDER}`, borderRadius: 12, padding: 10, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <button
                      onClick={() => setGateCalendarMonth(prev => {
                        const d = new Date(prev.year, prev.month - 1, 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${INPUT_BORDER}`, background: '#fff', cursor: 'pointer', color: ACCENT }}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>
                      {new Date(gateCalendarMonth.year, gateCalendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setGateCalendarMonth(prev => {
                        const d = new Date(prev.year, prev.month + 1, 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${INPUT_BORDER}`, background: '#fff', cursor: 'pointer', color: ACCENT }}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', padding: '2px 0', letterSpacing: '0.04em' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                    {(() => {
                      const { year, month } = gateCalendarMonth;
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const priority = { event: 3, preparation: 2, delivery: 1 } as const;
                      const bookedSet = new Map<string, BookedDate>();
                      selectedPhotoBookedDates.forEach(b => {
                        const existing = bookedSet.get(b.date);
                        if (!existing || priority[b.reason] > priority[existing.reason]) bookedSet.set(b.date, b);
                      });
                      const cells: React.ReactNode[] = [];
                      for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`}></div>);
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dateObj = new Date(year, month, day);
                        const isPast = dateObj < today;
                        const booked = bookedSet.get(dateStr);
                        const isSelected = dateStr === gateDate;
                        const reason = booked?.reason;
                        const isFullEvent = reason === 'event' && booked?.isFullDay === true;
                        const isPartialEvent = reason === 'event' && booked?.isFullDay === false;
                        const disabled = isPast || !!booked;
                        // Solid colored chips so each status reads at a glance.
                        let bg: string, fg = '#fff', border = '1px solid transparent';
                        let shadow = '';
                        if (isPast) { bg = 'transparent'; fg = '#cbd5e1'; }
                        else if (isFullEvent)        { bg = '#ef4444'; border = '1px solid #dc2626'; shadow = '0 1px 4px rgba(239,68,68,0.30)'; }
                        else if (isPartialEvent)     { bg = '#f59e0b'; border = '1px solid #d97706'; shadow = '0 1px 4px rgba(245,158,11,0.30)'; }
                        else if (reason === 'preparation') { bg = '#94a3b8'; border = '1px solid #64748b'; shadow = '0 1px 4px rgba(148,163,184,0.25)'; }
                        else if (reason === 'delivery')    { bg = '#6366f1'; border = '1px solid #4f46e5'; shadow = '0 1px 4px rgba(99,102,241,0.30)'; }
                        else                          { bg = '#10b981'; border = '1px solid #059669'; shadow = '0 1px 4px rgba(16,185,129,0.25)'; }
                        // Selected: keep the green theme, deepen the border + add a green
                        // halo ring + lift shadow so the chosen day clearly stands out.
                        if (isSelected && !disabled) {
                          bg = '#059669';
                          fg = '#fff';
                          border = '2px solid #064e3b';
                          shadow = '0 0 0 3px rgba(16,185,129,0.40), 0 4px 12px rgba(5,150,105,0.45)';
                        }
                        let title: string | undefined;
                        if (isFullEvent) title = 'Booked — event day';
                        else if (isPartialEvent) title = 'Partial event booking';
                        else if (reason === 'preparation') title = `Prep day (event on ${booked?.eventDate})`;
                        else if (reason === 'delivery' && booked?.deliveryDayIndex && booked?.deliveryDaysTotal) title = `Delivery day ${booked.deliveryDayIndex} of ${booked.deliveryDaysTotal}`;
                        else if (!isPast) title = 'Available';
                        cells.push(
                          <button
                            key={day}
                            type="button"
                            title={title}
                            disabled={disabled}
                            onClick={() => { if (!disabled) setGateDate(dateStr); }}
                            style={{
                              textAlign: 'center', padding: 0, fontSize: 11, fontWeight: 700,
                              color: fg, backgroundColor: bg, borderRadius: 8, aspectRatio: '1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: disabled ? 'not-allowed' : 'pointer', border,
                              opacity: isPast ? 0.5 : 1,
                              boxShadow: shadow,
                              fontFamily: 'inherit',
                              transition: 'transform 0.15s, box-shadow 0.15s',
                            }}
                          >
                            {day}
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 10.5, color: '#475569', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Photographer is free — click to select"><span style={{ width: 10, height: 10, background: '#10b981', borderRadius: 3 }} />Available</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Day before an event — photographer is preparing"><span style={{ width: 10, height: 10, background: '#94a3b8', borderRadius: 3 }} />Prep day</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Photographer is shooting an event that day"><span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 3 }} />Event day</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Time-boxed event — a portion of the day is booked"><span style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: 3 }} />Partial</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Photographer is editing & delivering a recent shoot"><span style={{ width: 10, height: 10, background: '#6366f1', borderRadius: 3 }} />Delivery</span>
                  </div>
                </div>

                {/* Date input */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Type or pick a date above
                  </label>
                  <input
                    type="date"
                    value={gateDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setGateDate(v);
                      if (v) {
                        const [yr, mo] = v.split('-').map(Number);
                        if (!isNaN(yr) && !isNaN(mo)) setGateCalendarMonth({ year: yr, month: mo - 1 });
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    style={inputStyle}
                  />
                  {gateDateConflict && (
                    <div style={{ marginTop: 6, padding: '8px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#b91c1c', fontSize: 12, lineHeight: 1.4 }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }}></i>
                      {describeConflict(gateDateConflict)} Please pick another day.
                    </div>
                  )}
                  {gateDateIsPast && !gateDateConflict && (
                    <div style={{ marginTop: 6, padding: '8px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#b91c1c', fontSize: 12 }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }}></i>
                      The event date must be in the future.
                    </div>
                  )}
                </div>

                {/* Confirmation pill — reinforces exactly what's being booked */}
                {gateCanProceed && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', marginBottom: 12,
                    background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10,
                    color: '#065f46', fontSize: 13, lineHeight: 1.4,
                  }}>
                    <i className="bi bi-check2-circle" style={{ fontSize: 18, color: '#059669' }}></i>
                    <div>
                      <strong>{photographerDisplayName}</strong> will photograph your event on{' '}
                      <strong>{gateDateLabel}</strong>.
                    </div>
                  </div>
                )}

                <button
                  onClick={confirmAvailability}
                  disabled={!gateCanProceed}
                  style={{ ...btnPrimary, opacity: gateCanProceed ? 1 : 0.55, cursor: gateCanProceed ? 'pointer' : 'not-allowed' }}
                >
                  {gateCanProceed ? 'Continue to choose a package' : 'Pick an available date to continue'}
                  {gateCanProceed && <i className="bi bi-arrow-right"></i>}
                </button>

                <p style={{ color: TEXT_MUTED, fontSize: 11.5, textAlign: 'center', margin: '10px 0 0', lineHeight: 1.5 }}>
                  This date will be used automatically on every remaining step.
                </p>
              </div>

            /* ── Auth inline overlay ── */
            ) : state.showAuthInline ? (
              <div>
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
                    <div style={{ position: 'relative' }}>
                      <input type={showLoginPassword ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" style={{ ...inputStyle, width: '100%', paddingRight: 44 }} onKeyDown={e => e.key === 'Enter' && handleAuthLogin()} />
                      <button type="button" onClick={() => setShowLoginPassword(v => !v)} aria-label={showLoginPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: TEXT_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {showLoginPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
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
                    <div style={{ position: 'relative' }}>
                      <input type={showSignupPassword ? 'text' : 'password'} value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Password" style={{ ...inputStyle, width: '100%', paddingRight: 44 }} onKeyDown={e => e.key === 'Enter' && handleAuthSignup()} />
                      <button type="button" onClick={() => setShowSignupPassword(v => !v)} aria-label={showSignupPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: TEXT_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {showSignupPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
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
                      <CurrencySelect
                        value={briefCurrency}
                        onChange={setBriefCurrency}
                        options={
                          currencies.length > 0
                            ? currencies.map(c => ({ id: c.id, code: (c.code || c.symbol || '') }))
                            : [{ id: 'RWF', code: 'RWF' }]
                        }
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={briefBudgetMin || ''}
                        onChange={e => {
                          const v = e.target.value;
                          setBriefBudgetMin(v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0));
                        }}
                        placeholder="Min"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={briefBudgetMax || ''}
                        onChange={e => {
                          const v = e.target.value;
                          setBriefBudgetMax(v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0));
                        }}
                        placeholder="Max"
                        style={{ ...inputStyle, flex: 1 }}
                      />
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
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Best Matches</h3>
                  <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>{filteredPhotographers.length} photographer{filteredPhotographers.length !== 1 ? 's' : ''} found</p>
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
                          <button onClick={() => handleViewProfile(p.id)} style={{
                            width: '100%', padding: '10px 0',
                            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                            border: 'none', borderRadius: 10, color: '#fff',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: '0 8px 18px -8px rgba(8,58,133,0.55)',
                            fontFamily: 'inherit',
                          }}>
                            View Profile <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            /* ── SLIDE 2: Package Selection ── */
            ) : state.currentSlide === 2 ? (
              <div>
                <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Select a Package</h3>

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
                            {pkg.deliveryDays ? <span><i className="bi bi-calendar-check" style={{ marginRight: 4 }}></i>{pkg.deliveryDays === 1 ? '1-day' : `${pkg.deliveryDays}-days`} delivery</span> : null}
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

                    {/* Extras — revealed once a package is picked, so users can add media before continuing */}
                    {state.selectedPackageId && selectedPkg && (
                      <div style={{ background: '#f9fafb', border: `1px solid ${INPUT_BORDER}`, borderRadius: 14, padding: 16 }}>
                        <p style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Add Extras</p>
                        <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '0 0 10px' }}>
                          Need more photos or videos than what the package includes? Add them here — optional.
                        </p>
                        {(selectedPkg.extraPhotoPrice || selectedPkg.extraVideoPrice) ? (
                          <div style={{ display: 'flex', gap: 12 }}>
                            {selectedPkg.extraPhotoPrice ? (
                              <div style={{ flex: 1 }}>
                                <label style={{ color: TEXT_MUTED, fontSize: 12, display: 'block', marginBottom: 4 }}>Extra Photos ({selectedPkg.currencyAbbreviation || ''}{selectedPkg.extraPhotoPrice}/ea)</label>
                                <input type="number" min={0} value={extraPhotos || ''} onChange={e => setExtraPhotos(parseInt(e.target.value) || 0)} placeholder="0" style={inputStyle} />
                              </div>
                            ) : null}
                            {selectedPkg.extraVideoPrice ? (
                              <div style={{ flex: 1 }}>
                                <label style={{ color: TEXT_MUTED, fontSize: 12, display: 'block', marginBottom: 4 }}>Extra Videos ({selectedPkg.currencyAbbreviation || ''}{selectedPkg.extraVideoPrice}/ea)</label>
                                <input type="number" min={0} value={extraVideos || ''} onChange={e => setExtraVideos(parseInt(e.target.value) || 0)} placeholder="0" style={inputStyle} />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '4px 0 0', fontStyle: 'italic' }}>
                            This package doesn’t offer add-on photos or videos.
                          </p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                          <span style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: 600 }}>Total</span>
                          <span style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700 }}>{currencySymbol}{totalPrice.toLocaleString()}</span>
                        </div>
                        <button onClick={handlePackageContinue} style={{ ...btnPrimary, marginTop: 14 }}>
                          Continue to payment plan <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            /* ── SLIDE 3: Payment Milestone ── */
            ) : state.currentSlide === 3 ? (
              <div>
                <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Payment Plan</h3>

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <p style={{ color: TEXT_MUTED, fontSize: 13, margin: '0 0 4px' }}>Total Amount</p>
                  <p style={{ color: TEXT_PRIMARY, fontSize: 28, fontWeight: 700, margin: 0 }}>{fmtLive(totalPrice)}</p>
                </div>
                {/* Currency preview panel — same selector that controls the
                    entire Payment Plan step's amount displays (total +
                    milestone rows below). Display-only; submit still goes
                    through XentriPay in the original paymentCurrencyCode. */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <PaymentCurrencyPreview
                    fromCurrency={(paymentCurrencyCode || 'RWF') as CurrencyCode}
                    defaultCurrency={displayCurrency}
                    onCurrencyChange={setDisplayCurrency}
                    amounts={[{ label: 'Total Amount', amount: totalPrice }]}
                  />
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
                      <span style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: 600 }}>{fmtLive(m.amount)}</span>
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
                <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Event Details</h3>

                {evtError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{evtError}</div>}
                {submitError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{submitError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Locked event-date summary — the date was chosen on the Availability step */}
                  {(() => {
                    const lockedDate = state.quickBrief?.eventDate || evtDate;
                    if (!lockedDate) return null;
                    const [yr, mo, da] = lockedDate.split('-').map(Number);
                    const friendly = !isNaN(yr) ? new Date(yr, mo - 1, da).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    }) : lockedDate;
                    return (
                      <div>
                        <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Event Date</label>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', background: '#f0f5ff',
                          border: '1px solid #dbeafe', borderRadius: 9,
                          color: TEXT_PRIMARY, fontSize: 14,
                        }}>
                          <i className="bi bi-calendar-check-fill" style={{ color: ACCENT, fontSize: 16 }}></i>
                          <span style={{ flex: 1 }}>
                            <strong>{friendly}</strong>
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            color: '#6b7280', fontSize: 11, fontWeight: 600,
                          }}>
                            <i className="bi bi-lock-fill"></i> Locked
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!state.selectedPhotographerId) return;
                              dispatch({ type: 'SHOW_AVAILABILITY_GATE', id: state.selectedPhotographerId });
                            }}
                            style={{
                              background: 'transparent', border: 'none',
                              color: ACCENT, fontSize: 12, fontWeight: 700,
                              cursor: 'pointer', padding: '4px 6px', textDecoration: 'underline',
                            }}
                          >
                            Change
                          </button>
                        </div>
                        <p style={{ color: TEXT_MUTED, fontSize: 11.5, margin: '6px 0 0' }}>
                          You picked this date on the availability step. Use “Change” to open the calendar again.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Location — only when Quick Brief was skipped (preselected-photographer flow) */}
                  {!state.quickBrief && (
                    <div>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Event Location *</label>
                      <input type="text" value={evtLocation} onChange={e => setEvtLocation(e.target.value)} placeholder="e.g. Kigali, Rwanda" style={inputStyle} />
                    </div>
                  )}
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

                {/* View full profile — booking is initiated from there */}
                <button onClick={() => {
                  dispatch({ type: 'SHOW_PREVIEW', id: null });
                  handleViewProfile(state.showPhotographerPreview!);
                }} style={{ ...btnPrimary, marginTop: 8 }}>
                  <i className="bi bi-person-vcard-fill"></i> View Full Profile
                </button>
              </div>
            ) : (
              <p style={{ color: TEXT_MUTED, textAlign: 'center', padding: 40 }}>Photographer not found.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && paymentDeclarationId && (
        <XentriPayModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          amount={paymentAmountValue}
          currencyCode={paymentCurrencyCode}
          currencyId={paymentCurrencyId}
          paymentType="booking"
          declarationId={paymentDeclarationId}
          eventId={paymentEventId || undefined}
          title="Complete Booking Payment"
          subtitle={`First milestone payment (${state.paymentMilestone?.option === 'full' ? '100%' : state.paymentMilestone?.option === 'half' ? '50%' : '30%'})`}
        />
      )}

      {/* ── Revoking overlay ── */}
      {isRevoking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', maxWidth: 320 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: ACCENT, borderRadius: '50%', animation: 'bwSpin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: 0 }}>Cancelling booking...</p>
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
