'use client';

import React, { useState, useEffect, useReducer, useRef } from 'react';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import { apiClient } from '@/lib/api/client';
import { getProfileSummary } from '@/lib/APIs/photographers/update-profile/route';
import { syncPhotographerProfile, initialSyncState, type SyncState } from '@/lib/photographer/sync-profile';

// ─── Types ───

export interface OnboardingPayload {
  // Slide 0
  address: string;
  about: string;
  businessType: 'Freelancer' | 'Registered Company';
  companyName: string;
  tin: string;
  // Slide 1
  specialtyIds: string[];
  // Slide 2 — null is allowed in the completion flow when the photographer
  // already has a profile photo on the server (don't force a re-upload).
  profileFile: File | null;
  coverFile: File | null;
  // Slide 3
  projTitle: string;
  projYear: number;
  projDescription: string;
  projFile: File | null;
  // Slide 4
  expPosition: string;
  expCompany: string;
  expLocation: string;
  expStartDate: string;
  expEndDate: string;
  expDescription: string;
  // Slide 5
  pkgTier: 'Silver' | 'Gold' | 'Diamond';
  pkgPrice: number;
  pkgCurrencyId: string;
  pkgDuration: number;
  pkgPhotos: number;
  pkgVideos: number;
  pkgDelivery: number;
  pkgDescription: string;
  pkgFeatures: { featureName: string; isIncluded: boolean; displayOrder: number }[];
  // Set by the completion flow from GET /profile-summary so the persist
  // step is idempotent — it SKIPS the add-only endpoints (project / work
  // experience / package) for sections the photographer already has,
  // instead of creating duplicate rows. Undefined on fresh signup → add all.
  existing?: {
    profilePhoto: boolean;
    coverPhoto: boolean;
    project: boolean;
    workExp: boolean;
    pkg: boolean;
  };
}

interface PhotographerOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  // Called when the user finishes every slide. Parent runs the real
  // signup() + all profile API saves here. Resolving means the customer
  // record is created and OTP is sent; rejecting means nothing was
  // stored and the wizard surfaces the error so the user can retry.
  onFinalize: (payload: OnboardingPayload) => Promise<void>;
  firstName: string;
  lastName: string;
  phone: string;
  // Completion flow only: fetch GET /profile-summary on open and pre-fill
  // every already-saved field so a returning photographer never re-enters
  // data. Omitted (false) for fresh signup — there's no server record yet.
  prefillFromServer?: boolean;
  // Progressive server autosave: every section is debounced-saved to the DB
  // 5s after the user stops editing, so onboarding survives a dropped
  // network and resumes from the server on return.
  serverSync?: boolean;
  // Signup flow only: lazily create the account (signup → token) the first
  // time autosave needs a session. Memoised by the caller so it runs once.
  // Omitted in the completion flow (the session already exists).
  ensureSession?: () => Promise<{ success: boolean; error?: string }>;
}

interface OnboardingState {
  currentSlide: number;
  isSubmitting: boolean;
}

type OnboardingAction =
  | { type: 'SET_SLIDE'; slide: number }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'RESET' };

const initialState: OnboardingState = { currentSlide: 0, isSubmitting: false };

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_SLIDE': return { ...state, currentSlide: action.slide, isSubmitting: false };
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.value };
    case 'RESET': return initialState;
    default: return state;
  }
}

// ─── Styles ───

const PINK = '#F20C8F';
const BRAND_GRADIENT = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)';
const BRAND_STRIPE = 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)';
const BRAND_SHADOW = '0 8px 22px -6px rgba(242,12,143,0.42)';
const INPUT_BG = '#f9fafb';
const INPUT_BORDER = '#e5e7eb';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#40444d';
const TEXT_MUTED = '#6b7280';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: INPUT_BG,
  border: `1.5px solid ${INPUT_BORDER}`, borderRadius: 11, color: TEXT_PRIMARY,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', color: PINK, fontSize: 11, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  marginBottom: 7,
};

const btnPrimary: React.CSSProperties = {
  width: '100%', padding: '13px',
  background: BRAND_GRADIENT,
  border: 'none', borderRadius: 12, color: '#fff',
  fontSize: 15, fontWeight: 700, letterSpacing: '-0.005em',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: BRAND_SHADOW,
  transition: 'transform 0.15s, box-shadow 0.15s',
};

const backBtnStyle: React.CSSProperties = {
  padding: '7px 13px', background: '#ffffff',
  border: `1.5px solid ${INPUT_BORDER}`, borderRadius: 10,
  color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  transition: 'border-color 0.15s, color 0.15s',
};

const errorBoxStyle: React.CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA',
  borderRadius: 10, padding: '10px 14px', marginBottom: 14,
  color: '#DC2626', fontSize: 13,
  display: 'flex', alignItems: 'flex-start', gap: 8,
};

const TIER_PRESETS: Record<string, { price: number; duration: number; photos: number; videos: number; delivery: number; features: string[] }> = {
  Silver: { price: 50000, duration: 2, photos: 50, videos: 0, delivery: 7, features: ['Online gallery storage', 'Digital Memory Sharing Experience', 'Same-day preview', 'Custom branding'] },
  Gold: { price: 100000, duration: 4, photos: 100, videos: 1, delivery: 5, features: ['Online gallery storage', 'Digital Memory Sharing Experience', 'Same-day preview', 'Custom branding', 'Fast processing', 'Outdoor photography', 'Event coverage'] },
  Diamond: { price: 200000, duration: 8, photos: 200, videos: 3, delivery: 3, features: ['Online gallery storage', 'Digital Memory Sharing Experience', 'Same-day preview', 'Custom branding', 'Fast processing', 'Outdoor photography', 'Event coverage', 'Live-streaming', 'Unlimited photos & videos'] },
};

// ─── Component ───

const PhotographerOnboarding: React.FC<PhotographerOnboardingProps> = ({
  isOpen, onClose, onComplete, onFinalize, firstName, lastName, phone,
  prefillFromServer = false, serverSync = false, ensureSession,
}) => {
  // firstName / lastName / phone identify the photographer for the
  // important-details save (used by the progressive autosave and passed
  // back through onFinalize alongside the parent's credentials state).
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Draft auto-save (localStorage) ──
  // A returning user finds their typed answers pre-filled. Keyed by phone so
  // two people sharing a browser don't clobber each other. Files (profile /
  // cover / project image) are NOT serialisable so they're never persisted —
  // that's why the restored slide is capped at the Photos step (see below).
  const draftStorageKey =
    'connekyt:onb-draft:v1:' + (phone ? phone.replace(/\D/g, '') || 'default' : 'default');
  const draftHydratedRef = useRef(false);
  const draftFinalizedRef = useRef(false);
  // When hydration restores a non-default tier it must NOT trigger the tier
  // preset effect (that would overwrite the user's restored package numbers).
  const skipPresetOnceRef = useRef(false);

  // ── Server prefill (completion flow) ──
  // True until GET /profile-summary resolves, so the wizard shows a brief
  // loader instead of flashing blank fields that then fill (and to avoid
  // overwriting anything the user just typed mid-fetch).
  const [prefillLoading, setPrefillLoading] = useState(prefillFromServer);
  // What's ALREADY saved server-side. Drives (a) relaxing the profile-photo
  // requirement and (b) the idempotent persist so we never duplicate the
  // add-only project / work-experience / package rows.
  const [serverHas, setServerHas] = useState({
    profilePhoto: false, coverPhoto: false, project: false, workExp: false, pkg: false,
  });

  // ── Progressive server autosave (5s debounce) ──
  const syncStateRef = useRef<SyncState>(initialSyncState());
  // Memoise the one-time signup (signup flow): the first tick that needs a
  // session creates the account; everyone after awaits the same promise.
  const sessionPromiseRef = useRef<Promise<{ success: boolean; error?: string }> | null>(null);
  // Serialise sync runs so a slow tick can't overlap the next one (which
  // would race the create/update decisions).
  const syncInFlightRef = useRef(false);

  // ── Shared state across slides ──
  const [address, setAddress] = useState('');
  const [about, setAbout] = useState('');
  const [businessType, setBusinessType] = useState<'Freelancer' | 'Registered Company'>('Freelancer');
  const [companyName, setCompanyName] = useState('');
  const [tin, setTin] = useState('');
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
  const [slideError, setSlideError] = useState('');

  // ── Data ──
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currencies, setCurrenciesList] = useState<Currency[]>([]);

  // ── Slide 2: Photos ──
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Slide 3: First featured project ──
  const [projTitle, setProjTitle] = useState('');
  const [projYear, setProjYear] = useState<string>(String(new Date().getFullYear()));
  const [projDescription, setProjDescription] = useState('');
  const [projFile, setProjFile] = useState<File | null>(null);
  const [projPreview, setProjPreview] = useState('');
  const projInputRef = useRef<HTMLInputElement>(null);

  // ── Slide 4: First work experience ──
  const [expPosition, setExpPosition] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');

  // ── Slide 5: Package ──
  const [pkgTier, setPkgTier] = useState<'Silver' | 'Gold' | 'Diamond'>('Silver');
  const [pkgPrice, setPkgPrice] = useState(50000);
  const [pkgCurrencyId, setPkgCurrencyId] = useState('');
  const [pkgDuration, setPkgDuration] = useState(2);
  const [pkgPhotos, setPkgPhotos] = useState(50);
  const [pkgVideos, setPkgVideos] = useState(0);
  const [pkgDelivery, setPkgDelivery] = useState(7);
  const [pkgDescription, setPkgDescription] = useState('');

  // ── Fetch data (eagerly on mount so specialties are ready when modal opens) ──
  useEffect(() => {
    apiClient.get<{ data: { id: string; name: string }[] }>('/api/remote/photographer-categories', { skipAuth: true, retries: 2 }).then(r => {
      if (r.success && r.data) {
        const raw = r.data as unknown as Record<string, unknown>;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data as { id: string; name: string }[] : [];
        setCategories(list);
      }
    }).catch(() => {});
    getCurrencies().then(r => {
      if (r.success && Array.isArray(r.data)) {
        const list = r.data;
        setCurrenciesList(list);
        // `prev || …` so a currency restored from a saved draft (or the
        // server prefill) wins over the RWF default — this fetch resolves
        // after draft hydration.
        const fallbackId = (list.find(c => c.code === 'RWF') || list[0])?.id;
        if (fallbackId) setPkgCurrencyId(prev => prev || fallbackId);
      }
    }).catch(() => {});
  }, []);

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

  // ── Apply tier presets ──
  useEffect(() => {
    // Skip exactly once when draft hydration switched the tier — otherwise
    // the preset would overwrite the user's restored package numbers.
    if (skipPresetOnceRef.current) {
      skipPresetOnceRef.current = false;
      return;
    }
    const preset = TIER_PRESETS[pkgTier];
    if (preset) {
      setPkgPrice(preset.price);
      setPkgDuration(preset.duration);
      setPkgPhotos(preset.photos);
      setPkgVideos(preset.videos);
      setPkgDelivery(preset.delivery);
    }
  }, [pkgTier]);

  // ── Hydrate from a saved draft (once, on mount) ──
  // Defined AFTER the preset effect so its restored values land last.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw) {
        const d = JSON.parse(raw) as Record<string, unknown>;
        const s = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : undefined);
        const n = (k: string) => (typeof d[k] === 'number' ? (d[k] as number) : undefined);

        if (s('address') !== undefined) setAddress(d.address as string);
        if (s('about') !== undefined) setAbout(d.about as string);
        if (d.businessType === 'Freelancer' || d.businessType === 'Registered Company')
          setBusinessType(d.businessType);
        if (s('companyName') !== undefined) setCompanyName(d.companyName as string);
        if (s('tin') !== undefined) setTin(d.tin as string);
        if (Array.isArray(d.selectedSpecialtyIds))
          setSelectedSpecialtyIds((d.selectedSpecialtyIds as unknown[]).filter(x => typeof x === 'string') as string[]);

        if (s('projTitle') !== undefined) setProjTitle(d.projTitle as string);
        if (s('projYear') !== undefined) setProjYear(d.projYear as string);
        if (s('projDescription') !== undefined) setProjDescription(d.projDescription as string);

        if (s('expPosition') !== undefined) setExpPosition(d.expPosition as string);
        if (s('expCompany') !== undefined) setExpCompany(d.expCompany as string);
        if (s('expLocation') !== undefined) setExpLocation(d.expLocation as string);
        if (s('expStartDate') !== undefined) setExpStartDate(d.expStartDate as string);
        if (s('expEndDate') !== undefined) setExpEndDate(d.expEndDate as string);
        if (typeof d.expIsCurrent === 'boolean') setExpIsCurrent(d.expIsCurrent);
        if (s('expDescription') !== undefined) setExpDescription(d.expDescription as string);

        if (d.pkgTier === 'Silver' || d.pkgTier === 'Gold' || d.pkgTier === 'Diamond') {
          // Non-default tier change would re-fire the preset effect; tell it
          // to skip once so the restored package numbers below survive.
          if (d.pkgTier !== 'Silver') skipPresetOnceRef.current = true;
          setPkgTier(d.pkgTier);
        }
        if (n('pkgPrice') !== undefined) setPkgPrice(d.pkgPrice as number);
        if (s('pkgCurrencyId') !== undefined) setPkgCurrencyId(d.pkgCurrencyId as string);
        if (n('pkgDuration') !== undefined) setPkgDuration(d.pkgDuration as number);
        if (n('pkgPhotos') !== undefined) setPkgPhotos(d.pkgPhotos as number);
        if (n('pkgVideos') !== undefined) setPkgVideos(d.pkgVideos as number);
        if (n('pkgDelivery') !== undefined) setPkgDelivery(d.pkgDelivery as number);
        if (s('pkgDescription') !== undefined) setPkgDescription(d.pkgDescription as string);

        // Files aren't persisted, and slides 3-5 hard-require the profile
        // photo, so send a returning user back to (at most) the Photos step
        // to re-pick their images. Never restore the success slide (6).
        const savedSlide = typeof d.currentSlide === 'number' ? d.currentSlide : 0;
        const restoredSlide = Math.max(0, Math.min(savedSlide, 2));
        if (restoredSlide > 0) dispatch({ type: 'SET_SLIDE', slide: restoredSlide });
      }
    } catch {
      // Corrupt / unavailable storage — start fresh, never block the wizard.
    }
    draftHydratedRef.current = true;
  }, [draftStorageKey]);

  // ── Persist the draft (debounced) on every serialisable change ──
  useEffect(() => {
    // Don't write until hydration ran (avoids defaults clobbering a draft),
    // and stop once the profile has been finalised / cleared.
    if (!draftHydratedRef.current || draftFinalizedRef.current) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(draftStorageKey, JSON.stringify({
          address, about, businessType, companyName, tin,
          selectedSpecialtyIds,
          projTitle, projYear, projDescription,
          expPosition, expCompany, expLocation, expStartDate, expEndDate,
          expIsCurrent, expDescription,
          pkgTier, pkgPrice, pkgCurrencyId, pkgDuration, pkgPhotos,
          pkgVideos, pkgDelivery, pkgDescription,
          currentSlide: state.currentSlide,
        }));
      } catch {
        // Quota / private-mode — auto-save is best-effort, never block.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    draftStorageKey, address, about, businessType, companyName, tin,
    selectedSpecialtyIds, projTitle, projYear, projDescription,
    expPosition, expCompany, expLocation, expStartDate, expEndDate,
    expIsCurrent, expDescription, pkgTier, pkgPrice, pkgCurrencyId,
    pkgDuration, pkgPhotos, pkgVideos, pkgDelivery, pkgDescription,
    state.currentSlide,
  ]);

  // ── Server prefill (completion flow): pre-fill EVERY already-saved field ──
  // Runs last (after the localStorage hydration) so the server — the source
  // of truth for persisted data — wins. A returning photographer never
  // re-enters address / specialties / business identity / project / work
  // experience / package / photos that important-details (and the other
  // saves) already stored.
  useEffect(() => {
    if (!prefillFromServer) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getProfileSummary();
        const p = res.success ? res.data?.data : undefined;
        if (cancelled || !p) return;

        if (p.address) setAddress(p.address);
        if (p.businessType === 'Registered Company') {
          setBusinessType('Registered Company');
          if (p.organizationName) setCompanyName(p.organizationName);
          if (p.taxId) setTin(p.taxId);
        } else if (p.businessType === 'Freelancer') {
          setBusinessType('Freelancer');
        }
        if (Array.isArray(p.specialties) && p.specialties.length > 0) {
          setSelectedSpecialtyIds(p.specialties.map(s => s.id).filter(Boolean));
        }

        const proj = p.projects?.[0];
        if (proj) {
          if (proj.title) setProjTitle(proj.title);
          if (proj.year) setProjYear(String(proj.year));
          if (proj.description) setProjDescription(proj.description);
          if (proj.projectImage) setProjPreview(proj.projectImage);
        }

        const exp = p.workExperiences?.[0];
        if (exp) {
          if (exp.position) setExpPosition(exp.position);
          if (exp.company) setExpCompany(exp.company);
          if (exp.location) setExpLocation(exp.location);
          if (exp.startDate) setExpStartDate(exp.startDate);
          if (exp.endDate) setExpEndDate(exp.endDate);
          setExpIsCurrent(!exp.endDate);
          if (exp.description) setExpDescription(exp.description);
        }

        const pkg = p.packages?.[0];
        if (pkg) {
          if (pkg.packageName === 'Silver' || pkg.packageName === 'Gold' || pkg.packageName === 'Diamond') {
            const tier = pkg.packageName;
            // Any tier CHANGE re-fires the preset effect, which would clobber
            // the server's real package numbers set below. Skip it once — but
            // only when the tier actually changes (a draft may have already
            // moved it off the Silver default), else a later user-initiated
            // tier switch would wrongly keep its old preset.
            setPkgTier(prev => {
              if (prev !== tier) skipPresetOnceRef.current = true;
              return tier;
            });
          }
          if (typeof pkg.price === 'number' && pkg.price > 0) setPkgPrice(pkg.price);
          if (pkg.currencyId) setPkgCurrencyId(pkg.currencyId);
          if (typeof pkg.durationHours === 'number') setPkgDuration(pkg.durationHours);
          if (typeof pkg.includedPhotos === 'number') setPkgPhotos(pkg.includedPhotos);
          if (typeof pkg.includedVideos === 'number') setPkgVideos(pkg.includedVideos);
          if (typeof pkg.deliveryDays === 'number') setPkgDelivery(pkg.deliveryDays);
          if (pkg.description) setPkgDescription(pkg.description);
        }

        // Existing images: show them as the preview so the photographer sees
        // their photo is already on file and isn't forced to re-upload.
        if (p.profilePicture) setProfilePreview(p.profilePicture);
        if (p.coverPicture) setCoverPreview(p.coverPicture);

        setServerHas({
          profilePhoto: !!p.profilePicture,
          coverPhoto: !!p.coverPicture,
          project: (p.projects?.length ?? 0) > 0,
          workExp: (p.workExperiences?.length ?? 0) > 0,
          pkg: (p.packages?.length ?? 0) > 0,
        });
      } catch {
        // Network / auth hiccup — fall back to a blank (or draft) wizard
        // rather than blocking the user behind a spinner forever.
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [prefillFromServer]);

  // No skip path — photographers must finish every slide before they reach
  // the OTP / dashboard. onClose stays on the props for type-compat with
  // the parent, but the wizard never calls it.

  // ─── SLIDE 0: Location & About ───

  const handleLocationNext = () => {
    if (!address.trim()) { setSlideError('Please enter your working area/location'); return; }
    if (businessType === 'Registered Company') {
      if (!companyName.trim()) { setSlideError('Please enter your company name'); return; }
      if (!tin.trim()) { setSlideError('Please enter your TIN number'); return; }
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 1 });
    // No backend save here — the customer record doesn't exist yet. Every
    // field is buffered in component state and posted at the final
    // "Continue to Dashboard" step via onFinalize.
  };

  // ─── SLIDE 1: Specialties ───

  const handleSpecialtiesNext = () => {
    if (selectedSpecialtyIds.length < 2) { setSlideError('Please select at least two specialties'); return; }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 2 });
  };

  // ─── SLIDE 2: Photos ───

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover' | 'project') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSlideError('File must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { setSlideError('Please select an image file'); return; }
    setSlideError('');
    const preview = URL.createObjectURL(file);
    if (type === 'profile') { setProfileFile(file); setProfilePreview(preview); }
    else if (type === 'cover') { setCoverFile(file); setCoverPreview(preview); }
    else { setProjFile(file); setProjPreview(preview); }
  };

  const handlePhotosNext = () => {
    // A photographer who already has a profile photo on the server isn't
    // forced to re-upload one (the existing one shows as the preview).
    if (!profileFile && !serverHas.profilePhoto) {
      setSlideError('Please upload a profile photo'); return;
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 3 });
  };

  // ─── SLIDE 3: First featured project ───

  const handleProjectNext = () => {
    if (!projTitle.trim()) { setSlideError('Please enter a project title'); return; }
    if (!projDescription.trim() || projDescription.trim().length < 10) {
      setSlideError('Please write a short description of the project');
      return;
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 4 });
  };

  // ─── SLIDE 4: First work experience ───

  const handleExperienceNext = () => {
    if (!expPosition.trim()) { setSlideError('Please enter your role / position'); return; }
    if (!expCompany.trim()) { setSlideError('Please enter the company or studio name'); return; }
    if (expDescription.trim().length < 50) {
      setSlideError('Please write at least a short paragraph (50+ chars) about this role');
      return;
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 5 });
  };

  // ─── Payload + progressive server autosave ───

  // Single source of the OnboardingPayload (minus `existing`), shared by the
  // 5s autosave and the final finalize so they can never disagree.
  const buildPayload = (): OnboardingPayload => {
    const preset = TIER_PRESETS[pkgTier];
    const features = (preset?.features || []).map((f, i) => ({
      featureName: f, isIncluded: true, displayOrder: i,
    }));
    return {
      address: address.trim(),
      about: about.trim(),
      businessType,
      companyName: companyName.trim(),
      tin: tin.trim(),
      specialtyIds: selectedSpecialtyIds,
      profileFile,
      coverFile,
      projTitle: projTitle.trim(),
      projYear: parseInt(projYear, 10) || new Date().getFullYear(),
      projDescription: projDescription.trim(),
      projFile,
      expPosition: expPosition.trim(),
      expCompany: expCompany.trim(),
      expLocation: expLocation.trim(),
      expStartDate: expStartDate.trim(),
      expEndDate: expIsCurrent ? '' : expEndDate.trim(),
      expDescription: expDescription.trim(),
      pkgTier,
      pkgPrice,
      pkgCurrencyId,
      pkgDuration,
      pkgPhotos,
      pkgVideos,
      pkgDelivery,
      pkgDescription,
      pkgFeatures: features,
    };
  };

  const who = { firstName, lastName, phone };

  // Create the account once (signup flow); a no-op when the session already
  // exists (completion flow passes no ensureSession).
  const ensureSessionOnce = async (): Promise<{ success: boolean; error?: string }> => {
    if (!ensureSession) return { success: true };
    if (!sessionPromiseRef.current) sessionPromiseRef.current = ensureSession();
    try {
      return await sessionPromiseRef.current;
    } catch (e) {
      // Let a failed attempt be retried by the next tick / finalize.
      sessionPromiseRef.current = null;
      return { success: false, error: e instanceof Error ? e.message : 'Could not start your session.' };
    }
  };

  // Synchronous view of what's saved server-side, read straight from the
  // sync ref (updated atomically by runServerSync) OR'd with the prefill
  // snapshot. Used for the idempotent `existing` at finalize — React state
  // (serverHas) lags a tick, so reading it right after an awaited sync would
  // be stale and could let persist duplicate a just-saved section.
  const presenceFromRef = () => ({
    profilePhoto: !!syncStateRef.current.uploadedProfileFile || serverHas.profilePhoto,
    coverPhoto: !!syncStateRef.current.uploadedCoverFile || serverHas.coverPhoto,
    project: syncStateRef.current.created.project || serverHas.project,
    workExp: syncStateRef.current.created.workExp || serverHas.workExp,
    pkg: syncStateRef.current.created.pkg || serverHas.pkg,
  });

  // One best-effort sync pass. `flush` (used at finalize) waits for any
  // in-flight pass instead of skipping, so the very latest edits land.
  const runServerSync = async (flush = false): Promise<void> => {
    if (!serverSync || draftFinalizedRef.current) return;
    const sess = await ensureSessionOnce();
    if (!sess.success) return;
    if (syncInFlightRef.current) {
      if (!flush) return;
      // crude wait-for-idle so flush doesn't race the running pass
      let waited = 0;
      while (syncInFlightRef.current && waited < 12000) {
        await new Promise(r => setTimeout(r, 200)); waited += 200;
      }
      // Still running after the wait — don't start an overlapping pass
      // (that risks a double create); finalize falls back to the last
      // good presence from the ref.
      if (syncInFlightRef.current) return;
    }
    syncInFlightRef.current = true;
    try {
      const { state: nextState, presence } = await syncPhotographerProfile(
        buildPayload(), who, syncStateRef.current
      );
      syncStateRef.current = nextState;
      setServerHas(presence);
    } catch {
      // never throw — resilient layer
    } finally {
      syncInFlightRef.current = false;
    }
  };

  // 5s debounce: re-armed on every serialisable change, so a section is
  // saved ~5s after the user stops editing it.
  useEffect(() => {
    if (!serverSync || draftFinalizedRef.current || state.currentSlide === 6) return;
    const t = setTimeout(() => { void runServerSync(false); }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serverSync, address, about, businessType, companyName, tin,
    selectedSpecialtyIds, profileFile, coverFile, projTitle, projYear,
    projDescription, projFile, expPosition, expCompany, expLocation,
    expStartDate, expEndDate, expIsCurrent, expDescription, pkgTier,
    pkgPrice, pkgCurrencyId, pkgDuration, pkgPhotos, pkgVideos,
    pkgDelivery, pkgDescription, state.currentSlide,
  ]);

  // ─── SLIDE 5: Package ───

  const handleCreatePackage = async () => {
    if (!pkgPrice || pkgPrice <= 0) { setSlideError('Please enter a valid price'); return; }
    if (!pkgCurrencyId) { setSlideError('Please select a currency'); return; }
    if (!profileFile && !serverHas.profilePhoto) {
      setSlideError('Profile photo is missing — go back to the Photos step'); return;
    }
    setSlideError('');

    dispatch({ type: 'SET_SUBMITTING', value: true });
    try {
      // Make sure the account exists (signup flow) before the final save.
      if (serverSync) {
        const sess = await ensureSessionOnce();
        if (!sess.success) {
          throw new Error(sess.error || 'Could not start your session. Please try again.');
        }
        // Flush the latest edits through the idempotent autosave so the
        // final persist only has to fill gaps + submit (no duplicates).
        await runServerSync(true);
      }

      const payload: OnboardingPayload = {
        ...buildPayload(),
        // With a session (autosave or completion) persist must be
        // idempotent — skip whatever the flush just saved. Read from the
        // sync ref (synchronous & fresh), not serverHas (a render behind).
        existing: (serverSync || prefillFromServer) ? presenceFromRef() : undefined,
      };

      await onFinalize(payload);
      // Profile is stored — drop the draft so the next visit starts clean
      // and the debounced save effect stops re-writing it.
      draftFinalizedRef.current = true;
      try { window.localStorage.removeItem(draftStorageKey); } catch { /* ignore */ }
      dispatch({ type: 'SET_SLIDE', slide: 6 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not finalise your profile. Please try again.';
      setSlideError(msg);
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  if (!isOpen) return null;

  // Completion flow: hold the wizard behind a brief loader until the saved
  // profile is fetched, so fields never flash blank then fill (and a slow
  // fetch can't overwrite something the user already started typing).
  if (prefillFromServer && prefillLoading) {
    return (
      <>
        <style>{`@keyframes ck-onb-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, padding: '32px 36px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            boxShadow: '0 25px 60px -12px rgba(8,58,133,0.32)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#083A85',
              animation: 'ck-onb-spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>
              Loading your saved details…
            </div>
          </div>
        </div>
      </>
    );
  }

  const currencyCode = currencies.find(c => c.id === pkgCurrencyId)?.code || 'RWF';

  // ─── RENDER ───

  // Total slides (0–5; 6 = success). Used for the progress strip.
  const TOTAL_INPUT_SLIDES = 6;
  const isSuccessSlide = state.currentSlide === 6;
  const progressPct = isSuccessSlide
    ? 100
    : Math.min(100, Math.round(((state.currentSlide + 1) / TOTAL_INPUT_SLIDES) * 100));

  return (
    <>
      <style>{`
        @keyframes ck-onboarding-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ck-onboarding-card-in {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.50)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'ck-onboarding-fade-in 0.25s ease-out',
      }}>
        <div style={{
          width: '100%', maxWidth: 600, maxHeight: '92vh',
          background: '#ffffff',
          border: '1px solid rgba(8,58,133,0.10)',
          borderRadius: 20,
          boxShadow: '0 25px 60px -12px rgba(8,58,133,0.32), 0 12px 28px -8px rgba(242,12,143,0.18)',
          position: 'relative',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'ck-onboarding-card-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Brand top stripe */}
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: BRAND_STRIPE,
            zIndex: 5,
          }} />

          {/* Slide progress strip (under the top stripe) */}
          <div style={{
            position: 'absolute', top: 3, left: 0, right: 0, height: 3,
            background: 'rgba(8,58,133,0.06)',
            zIndex: 4,
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: BRAND_STRIPE,
              boxShadow: '0 0 10px rgba(242,12,143,0.45)',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Close button — dismisses the wizard but does NOT advance to OTP.
              Only slide 6's "Continue to Dashboard" button (onComplete) is
              allowed to push the user toward the verify-OTP page. */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              width: 34, height: 34, borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid rgba(8,58,133,0.18)',
              color: PINK, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px -2px rgba(8,58,133,0.18)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <i className="bi bi-x-lg"></i>
          </button>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '34px 24px 24px' }}>

            {state.currentSlide === 0 ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  {/* Gradient-ring icon tile */}
                  <div style={{
                    width: 60, height: 60,
                    borderRadius: 18,
                    padding: 2.5,
                    background: BRAND_GRADIENT,
                    margin: '0 auto 14px',
                    boxShadow: '0 12px 26px -6px rgba(242,12,143,0.34)',
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      borderRadius: 15,
                      background: 'linear-gradient(135deg, #083A85 0%, #1e4fb8 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-geo-alt-fill" style={{ fontSize: 22, color: '#fff' }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.66rem', fontWeight: 700,
                    color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>Step 1 of 6 · Basics</div>
                  <h3 style={{
                    color: TEXT_PRIMARY, fontSize: 22, fontWeight: 800,
                    margin: '0 0 6px', letterSpacing: '-0.015em',
                  }}>Welcome, {firstName}!</h3>
                  <p style={{ color: TEXT_MUTED, fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                    Let&rsquo;s set up your profile so clients can find you.
                  </p>
                </div>

                {slideError && (
                  <div style={errorBoxStyle}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    <span>{slideError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Working Area / Location <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text" value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. Kigali, Rwanda"
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>About You</label>
                    <textarea
                      value={about}
                      onChange={e => setAbout(e.target.value)}
                      placeholder="Tell clients about your experience and style…"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5 }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Business Type */}
                  <div>
                    <label style={labelStyle}>Business Type <span style={{ color: '#DC2626' }}>*</span></label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['Freelancer', 'Registered Company'] as const).map(type => {
                        const sel = businessType === type;
                        const icon = type === 'Freelancer' ? 'bi-person-fill' : 'bi-building-fill';
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setBusinessType(type)}
                            style={{
                              position: 'relative',
                              flex: 1, padding: '12px 8px',
                              borderRadius: 12,
                              fontSize: 13.5, fontWeight: 700,
                              letterSpacing: '-0.005em',
                              cursor: 'pointer',
                              background: sel
                                ? 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.05) 100%)'
                                : '#f9fafb',
                              border: sel ? `1.5px solid ${PINK}` : `1.5px solid ${INPUT_BORDER}`,
                              color: sel ? PINK : TEXT_SECONDARY,
                              boxShadow: sel ? '0 6px 16px -6px rgba(242,12,143,0.30)' : 'none',
                              overflow: 'hidden',
                              transition: 'all 0.15s',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            }}
                          >
                            {sel && (
                              <span aria-hidden style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                background: BRAND_STRIPE,
                              }} />
                            )}
                            <i className={`bi ${icon}`} style={{ fontSize: 14, color: sel ? PINK : TEXT_SECONDARY }} />
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {businessType === 'Registered Company' && (
                    <>
                      <div>
                        <label style={labelStyle}>Company Name <span style={{ color: '#DC2626' }}>*</span></label>
                        <input
                          type="text" value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          placeholder="e.g. Studio Kigali Ltd"
                          style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>TIN (Tax Identification Number) <span style={{ color: '#DC2626' }}>*</span></label>
                        <input
                          type="text" value={tin}
                          onChange={e => setTin(e.target.value)}
                          placeholder="e.g. 123456789"
                          style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleLocationNext}
                    disabled={state.isSubmitting}
                    style={{ ...btnPrimary, marginTop: 8, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}
                  >
                    {state.isSubmitting ? 'Saving…' : <>Continue <i className="bi bi-arrow-right"></i></>}
                  </button>
                </div>
              </div>

            /* ── SLIDE 1: Specialties ── */
            ) : state.currentSlide === 1 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 0 })} style={backBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>Your Specialties</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Select what you specialize in</p>
                  </div>
                </div>

                {slideError && (
                  <div style={errorBoxStyle}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    <span>{slideError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {categories.map(cat => {
                    const sel = selectedSpecialtyIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedSpecialtyIds(prev => sel ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                        style={{
                          padding: '8px 14px', borderRadius: 999,
                          fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em',
                          cursor: 'pointer',
                          background: sel ? BRAND_GRADIENT : '#f9fafb',
                          border: sel ? 'none' : `1.5px solid ${INPUT_BORDER}`,
                          color: sel ? '#fff' : TEXT_SECONDARY,
                          boxShadow: sel ? '0 6px 14px -4px rgba(242,12,143,0.36)' : 'none',
                          transition: 'all 0.15s',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        {sel && <i className="bi bi-check-circle-fill" style={{ fontSize: 12 }} />}
                        {cat.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading specialties…</p>}
                </div>

                <button onClick={handleSpecialtiesNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 2: Photos ── */
            ) : state.currentSlide === 2 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 1 })} style={backBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>Profile Photos</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Add photos to make your profile stand out</p>
                  </div>
                </div>

                {slideError && (
                  <div style={errorBoxStyle}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    <span>{slideError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  {/* Profile Photo */}
                  <div>
                    <label style={labelStyle}>Profile Photo</label>
                    <input type="file" ref={profileInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'profile')} style={{ display: 'none' }} />
                    <div onClick={() => profileInputRef.current?.click()} style={{
                      width: 100, height: 100, borderRadius: '50%', border: `1.5px dashed ${profilePreview ? PINK : 'rgba(8,58,133,0.32)'}`,
                      background: profilePreview ? `url(${profilePreview}) center/cover` : INPUT_BG,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                    }}>
                      {!profilePreview && <i className="bi bi-camera" style={{ fontSize: 24, color: TEXT_MUTED }}></i>}
                    </div>
                  </div>

                  {/* Cover Photo */}
                  <div>
                    <label style={labelStyle}>Cover Photo</label>
                    <input type="file" ref={coverInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'cover')} style={{ display: 'none' }} />
                    <div onClick={() => coverInputRef.current?.click()} style={{
                      width: '100%', height: 140, borderRadius: 12, border: `1.5px dashed ${coverPreview ? PINK : 'rgba(8,58,133,0.32)'}`,
                      background: coverPreview ? `url(${coverPreview}) center/cover` : INPUT_BG,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                    }}>
                      {!coverPreview && (
                        <div style={{ textAlign: 'center' }}>
                          <i className="bi bi-image" style={{ fontSize: 28, color: TEXT_MUTED }}></i>
                          <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '4px 0 0' }}>Click to upload cover photo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={handlePhotosNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Uploading...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 3: First featured project ── */
            ) : state.currentSlide === 3 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 2 })} style={backBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>Your First Project</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Add a recent project clients can browse</p>
                  </div>
                </div>

                {slideError && (
                  <div style={errorBoxStyle}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    <span>{slideError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>Project Title *</label>
                    <input type="text" value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="e.g. Bella & Eric's Wedding" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Year *</label>
                    <input type="number" min="1990" max={String(new Date().getFullYear())} value={projYear} onChange={e => setProjYear(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Description *</label>
                    <textarea value={projDescription} onChange={e => setProjDescription(e.target.value)} placeholder="What was the brief? Where was it? What made it memorable?" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Cover Image (optional)</label>
                    <input type="file" ref={projInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'project')} style={{ display: 'none' }} />
                    <div onClick={() => projInputRef.current?.click()} style={{
                      width: '100%', height: 120, borderRadius: 12, border: `1.5px dashed ${projPreview ? PINK : 'rgba(8,58,133,0.32)'}`,
                      background: projPreview ? `url(${projPreview}) center/cover` : INPUT_BG,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                    }}>
                      {!projPreview && (
                        <div style={{ textAlign: 'center' }}>
                          <i className="bi bi-image" style={{ fontSize: 24, color: TEXT_MUTED }}></i>
                          <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '4px 0 0' }}>Click to upload a hero image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={handleProjectNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 4: First work experience ── */
            ) : state.currentSlide === 4 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 3 })} style={backBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>Work Experience</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Tell clients where you&apos;ve shot before</p>
                  </div>
                </div>

                {slideError && (
                  <div style={errorBoxStyle}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    <span>{slideError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>Role / Position *</label>
                    <input type="text" value={expPosition} onChange={e => setExpPosition(e.target.value)} placeholder="e.g. Lead Photographer" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company / Studio *</label>
                    <input type="text" value={expCompany} onChange={e => setExpCompany(e.target.value)} placeholder="e.g. Studio Kigali" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Location</label>
                    <input type="text" value={expLocation} onChange={e => setExpLocation(e.target.value)} placeholder="e.g. Kigali, Rwanda" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Start date</label>
                      <input type="month" value={expStartDate} onChange={e => setExpStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>End date</label>
                      <input type="month" value={expEndDate} onChange={e => setExpEndDate(e.target.value)} disabled={expIsCurrent} style={{ ...inputStyle, opacity: expIsCurrent ? 0.5 : 1 }} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={expIsCurrent} onChange={e => setExpIsCurrent(e.target.checked)} />
                    I currently work here
                  </label>
                  <div>
                    <label style={labelStyle}>What did you do? *</label>
                    <textarea value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="Describe the work, kinds of shoots, scale, results... (50+ characters)" rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
                    <p style={{ color: TEXT_MUTED, fontSize: 11, margin: '4px 0 0' }}>{expDescription.length} / 50 minimum</p>
                  </div>
                </div>

                <button onClick={handleExperienceNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 5: Package ── */
            ) : state.currentSlide === 5 ? (
              (() => {
                // Tier gradients matched 1:1 with the connekyt booking wizard
                // package step so the badges look consistent across the
                // photographer onboarding flow and the client booking flow.
                const TIER_GRADIENTS: Record<'Silver' | 'Gold' | 'Diamond', { gradient: string; glow: string; icon: string }> = {
                  Silver: {
                    gradient: 'linear-gradient(135deg, #94A3B8 0%, #CBD5E1 45%, #64748B 100%)',
                    glow: 'rgba(100,116,139,0.32)',
                    icon: 'bi-gem',
                  },
                  Gold: {
                    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)',
                    glow: 'rgba(245,158,11,0.36)',
                    icon: 'bi-award-fill',
                  },
                  Diamond: {
                    gradient: 'linear-gradient(135deg, #06B6D4 0%, #A78BFA 55%, #3B82F6 100%)',
                    glow: 'rgba(59,130,246,0.36)',
                    icon: 'bi-stars',
                  },
                };
                const activeTier = TIER_GRADIENTS[pkgTier];
                return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 4 })} style={backBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <div style={{
                      fontSize: 10.5, fontWeight: 700,
                      color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase',
                      marginBottom: 2,
                    }}>Step 6 of 6 · Pricing</div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>Create a Package</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12.5, margin: '2px 0 0' }}>Set your first pricing package &mdash; you can edit or add more later.</p>
                  </div>
                </div>

                {slideError && (
                  <div style={errorBoxStyle}>
                    <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    <span>{slideError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Tier selector — matches Connekyt booking wizard gradients */}
                  <div>
                    <label style={labelStyle}>Package Tier</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['Silver', 'Gold', 'Diamond'] as const).map(tier => {
                        const sel = pkgTier === tier;
                        const t = TIER_GRADIENTS[tier];
                        return (
                          <button
                            key={tier}
                            onClick={() => setPkgTier(tier)}
                            style={{
                              flex: 1,
                              padding: '12px 8px',
                              borderRadius: 12,
                              fontSize: 13.5,
                              fontWeight: 800,
                              letterSpacing: '-0.005em',
                              cursor: 'pointer',
                              background: sel ? t.gradient : '#f9fafb',
                              border: sel ? 'none' : `1.5px solid ${INPUT_BORDER}`,
                              color: sel ? '#fff' : TEXT_SECONDARY,
                              boxShadow: sel ? `0 8px 20px -6px ${t.glow}` : 'none',
                              textShadow: sel ? '0 1px 2px rgba(0,0,0,0.18)' : 'none',
                              transition: 'all 0.2s',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                          >
                            <i className={`bi ${t.icon}`} style={{ fontSize: 13 }} />
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active tier preview card — mirrors the booking wizard tier card */}
                  <div style={{
                    position: 'relative',
                    borderRadius: 14,
                    padding: '12px 14px',
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                    border: `1.5px solid ${INPUT_BORDER}`,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span aria-hidden style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: activeTier.gradient,
                    }} />
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: activeTier.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 6px 14px -4px ${activeTier.glow}`,
                    }}>
                      <i className={`bi ${activeTier.icon}`} style={{ fontSize: 18, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.18)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Selected tier</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: '-0.01em' }}>{pkgTier} package</div>
                    </div>
                  </div>

                  {/* Price + Currency */}
                  <div>
                    <label style={labelStyle}>Price <span style={{ color: '#DC2626' }}>*</span></label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={pkgCurrencyId} onChange={e => setPkgCurrencyId(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 96, flex: '0 0 auto', appearance: 'auto' as const, fontWeight: 700, color: PINK }}>
                        {currencies.map(c => <option key={c.id} value={c.id} style={{ color: TEXT_PRIMARY }}>{c.code}</option>)}
                      </select>
                      <input type="number" value={pkgPrice || ''} onChange={e => setPkgPrice(parseInt(e.target.value) || 0)} placeholder="Price"
                        style={{ ...inputStyle, flex: 1, fontWeight: 700, fontSize: 15 }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>
                        <i className="bi bi-clock-fill" style={{ fontSize: 10, marginRight: 4 }} />
                        Duration (hours)
                      </label>
                      <input type="number" value={pkgDuration || ''} onChange={e => setPkgDuration(parseInt(e.target.value) || 0)} style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>
                        <i className="bi bi-truck" style={{ fontSize: 10, marginRight: 4 }} />
                        Delivery (days)
                      </label>
                      <input type="number" value={pkgDelivery || ''} onChange={e => setPkgDelivery(parseInt(e.target.value) || 0)} style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>
                        <i className="bi bi-camera-fill" style={{ fontSize: 10, marginRight: 4 }} />
                        Included Photos
                      </label>
                      <input type="number" value={pkgPhotos || ''} onChange={e => setPkgPhotos(parseInt(e.target.value) || 0)} style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>
                        <i className="bi bi-camera-reels-fill" style={{ fontSize: 10, marginRight: 4 }} />
                        Included Videos
                      </label>
                      <input type="number" value={pkgVideos || ''} onChange={e => setPkgVideos(parseInt(e.target.value) || 0)} style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={pkgDescription} onChange={e => setPkgDescription(e.target.value)} placeholder={`${pkgTier} photography package`} rows={2}
                      style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5 }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Features preview — branded */}
                  <div style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                    border: `1.5px solid rgba(8,58,133,0.12)`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    overflow: 'hidden',
                  }}>
                    <span aria-hidden style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                    }} />
                    <div style={{
                      fontSize: 10.5, fontWeight: 700,
                      color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase',
                      marginBottom: 8,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}>
                      <i className="bi bi-stars" style={{ fontSize: 11 }} />
                      Included Features
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                      {(TIER_PRESETS[pkgTier]?.features || []).map((f, i) => (
                        <span key={i} style={{ color: '#10b981', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <i className="bi bi-check-circle-fill" style={{ fontSize: 12 }} />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreatePackage}
                    disabled={state.isSubmitting}
                    style={{ ...btnPrimary, marginTop: 4, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}
                  >
                    {state.isSubmitting ? (
                      <>Creating Package&hellip;</>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i>
                        Create Package &amp; Submit Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
                );
              })()

            /* ── SLIDE 6: Success ── */
            ) : state.currentSlide === 6 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 22,
                  padding: 3,
                  background: 'linear-gradient(135deg, #10b981 0%, #F20C8F 130%)',
                  margin: '0 auto 20px',
                  boxShadow: '0 14px 30px -6px rgba(16,185,129,0.36)',
                }}>
                  <div style={{
                    width: '100%', height: '100%',
                    borderRadius: 19,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-check-lg" style={{ fontSize: 34, color: '#fff' }} />
                  </div>
                </div>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700,
                  color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>All done</div>
                <h2 style={{
                  color: TEXT_PRIMARY, fontSize: 24, fontWeight: 800,
                  margin: '0 0 10px', letterSpacing: '-0.015em',
                }}>Profile Submitted!</h2>
                <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: '0 0 6px', lineHeight: 1.5 }}>
                  Your <strong>{pkgTier}</strong> package at <strong>{currencyCode} {pkgPrice.toLocaleString()}</strong> has been created.
                </p>
                <p style={{ color: TEXT_MUTED, fontSize: 13, margin: '0 auto 24px', lineHeight: 1.55, maxWidth: 360 }}>
                  Your profile is now under review. Once approved, clients will be able to find and book you.
                </p>
                <button
                  onClick={onComplete}
                  style={btnPrimary}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}
                >
                  Continue to Dashboard <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default PhotographerOnboarding;
