'use client';

import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import { apiClient } from '@/lib/api/client';
import { getProfileSummary } from '@/lib/APIs/photographers/update-profile/route';
import { syncPhotographerProfile, initialSyncState, type SyncState } from '@/lib/photographer/sync-profile';
import { shouldAutosave } from '@/lib/photographer/autosave';

// ─── Types ───

export interface OnboardingPayload {
  address: string;
  about: string;
  businessType: 'Freelancer' | 'Registered Company';
  companyName: string;
  tin: string;
  specialtyIds: string[];
  spokenLanguages: string[];
  profileFile: File | null;
  coverFile: File | null;
  projTitle: string;
  projYear: number;
  projDescription: string;
  projFile: File | null;
  expPosition: string;
  expCompany: string;
  expLocation: string;
  expStartDate: string;
  expEndDate: string;
  expDescription: string;
  pkgCurrencyId: string;
  packages: PackageEntry[];
  existing?: {
    profilePhoto: boolean;
    coverPhoto: boolean;
    project: boolean;
    workExp: boolean;
    pkg: boolean;
  };
}

export type PackageTier = 'Silver' | 'Gold' | 'Diamond';

export interface PackageEntry {
  tier: PackageTier;
  price: number;
  duration: number;
  photos: number;
  videos: number;
  delivery: number;
  description: string;
  features: { featureName: string; isIncluded: boolean; displayOrder: number }[];
  serviceType?: 'OUTDOOR' | 'STUDIO';
}

interface PhotographerOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onFinalize: (payload: OnboardingPayload) => Promise<void>;
  firstName: string;
  lastName: string;
  phone: string;
  prefillFromServer?: boolean;
  serverSync?: boolean;
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

// ─── Component ───

const PhotographerOnboarding: React.FC<PhotographerOnboardingProps> = ({
  isOpen, onClose, onComplete, onFinalize, firstName, lastName, phone,
  prefillFromServer = false, serverSync = false, ensureSession,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const draftStorageKey =
    'connekyt:onb-draft:v1:' + (phone ? phone.replace(/\D/g, '') || 'default' : 'default');
  const draftHydratedRef = useRef(false);
  const draftFinalizedRef = useRef(false);

  const [prefillLoading, setPrefillLoading] = useState(prefillFromServer);
  const [serverHas, setServerHas] = useState({
    profilePhoto: false, coverPhoto: false, project: false, workExp: false, pkg: false,
  });

  const syncStateRef = useRef<SyncState>(initialSyncState());
  const sessionPromiseRef = useRef<Promise<{ success: boolean; error?: string }> | null>(null);
  const syncInFlightRef = useRef(false);

  /** Which reference-data list failed to load, if any (CONN-ONB-6). */
  const [refDataError, setRefDataError] = useState<'categories' | 'currencies' | 'both' | null>(null);

  /**
   * Whether the background save to the server is working (CONN-ONB-3).
   *
   * runServerSync used to swallow everything: an early `return` when the
   * session could not be established, and a bare `catch` for every other
   * failure. There was no indicator of any kind in this component, so a user
   * whose token had expired or whose network was down filled in a seven-step
   * wizard while nothing persisted, and the UI looked exactly like success.
   *
   * That failure has already happened in production. The comment on the signup
   * token in AuthController records it: every photographer save 401'd and the
   * whole wizard payload was dropped, leaving new profiles stuck far under 100%
   * with "nothing to finish" in the dashboard. The token was added; the silence
   * that made it invisible was not.
   *
   * 'auth' and 'network' are kept apart because the remedies differ: one needs
   * signing in again, the other just needs retrying.
   */
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [syncErrorKind, setSyncErrorKind] = useState<'auth' | 'network' | null>(null);

  const [address, setAddress] = useState('');
  const [about, setAbout] = useState('');
  const [businessType, setBusinessType] = useState<'Freelancer' | 'Registered Company'>('Freelancer');
  const [companyName, setCompanyName] = useState('');
  const [tin, setTin] = useState('');
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [slideError, setSlideError] = useState('');

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currencies, setCurrenciesList] = useState<Currency[]>([]);

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [projTitle, setProjTitle] = useState('');
  const [projYear, setProjYear] = useState<string>(String(new Date().getFullYear()));
  const [projDescription, setProjDescription] = useState('');
  const [projFile, setProjFile] = useState<File | null>(null);
  const [projPreview, setProjPreview] = useState('');
  const projInputRef = useRef<HTMLInputElement>(null);

  const [expPosition, setExpPosition] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');

  type PkgFields = { price: number; duration: number; photos: number; videos: number; delivery: number; description: string };

  const makeInitialPkgs = (): Record<PackageTier, PkgFields> => ({
    Silver:  { price: 0, duration: 0, photos: 0, videos: 0, delivery: 0, description: '' },
    Gold:    { price: 0, duration: 0, photos: 0, videos: 0, delivery: 0, description: '' },
    Diamond: { price: 0, duration: 0, photos: 0, videos: 0, delivery: 0, description: '' },
  });

  const [pkgTier, setPkgTier] = useState<PackageTier>('Silver');
  const [pkgCurrencyId, setPkgCurrencyId] = useState('');
  const [pkgs, setPkgs] = useState<Record<PackageTier, PkgFields>>(makeInitialPkgs);

  const cur = pkgs[pkgTier];
  const pkgPrice = cur.price, pkgDuration = cur.duration, pkgPhotos = cur.photos,
        pkgVideos = cur.videos, pkgDelivery = cur.delivery, pkgDescription = cur.description;
  const setPkgField = (k: keyof PkgFields, v: number | string) =>
    setPkgs(p => ({ ...p, [pkgTier]: { ...p[pkgTier], [k]: v } }));
  const setPkgPrice = (v: number) => setPkgField('price', v);
  const setPkgDuration = (v: number) => setPkgField('duration', v);
  const setPkgPhotos = (v: number) => setPkgField('photos', v);
  const setPkgVideos = (v: number) => setPkgField('videos', v);
  const setPkgDelivery = (v: number) => setPkgField('delivery', v);
  const setPkgDescription = (v: string) => setPkgField('description', v);

  const makeInitialStudioPkgs = (): Record<PackageTier, PkgFields> => ({
    Silver:  { price: 0, duration: 0, photos: 0, videos: 0, delivery: 0, description: '' },
    Gold:    { price: 0, duration: 0, photos: 0, videos: 0, delivery: 0, description: '' },
    Diamond: { price: 0, duration: 0, photos: 0, videos: 0, delivery: 0, description: '' },
  });
  const [studioPkgTier, setStudioPkgTier] = useState<PackageTier>('Silver');
  const [studioPkgs, setStudioPkgs] = useState<Record<PackageTier, PkgFields>>(makeInitialStudioPkgs);
  const studioCur = studioPkgs[studioPkgTier];
  const setStudioPkgField = (k: keyof PkgFields, v: number | string) =>
    setStudioPkgs(p => ({ ...p, [studioPkgTier]: { ...p[studioPkgTier], [k]: v } }));

  /**
   * Reference data for the specialty and currency selectors (CONN-ONB-6).
   *
   * Both used to end in `.catch(() => {})`. If either request failed the user
   * reached a step with an EMPTY selector, no message and no way to retry -
   * indistinguishable from "there are no options", part-way through onboarding.
   * A failure is now recorded so the step can say so and offer a retry.
   */
  const loadReferenceData = useCallback(() => {
    setRefDataError(null);
    const cats = apiClient
      .get<{ data: { id: string; name: string }[] }>('/api/remote/photographer-categories', { skipAuth: true, retries: 2 })
      .then(r => {
        if (r.success && r.data) {
          const raw = r.data as unknown as Record<string, unknown>;
          const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data as { id: string; name: string }[] : [];
          setCategories(list);
          return true;
        }
        return false;
      })
      .catch(() => false);

    const curr = getCurrencies()
      .then(r => {
        if (r.success && Array.isArray(r.data)) {
          const list = r.data;
          setCurrenciesList(list);
          const fallbackId = (list.find(c => c.code === 'RWF') || list[0])?.id;
          if (fallbackId) setPkgCurrencyId(prev => prev || fallbackId);
          return true;
        }
        return false;
      })
      .catch(() => false);

    void Promise.all([cats, curr]).then(([okCats, okCurr]) => {
      if (okCats && okCurr) return;
      setRefDataError(
        !okCats && !okCurr ? 'both'
          : !okCats ? 'categories'
          : 'currencies',
      );
    });
  }, []);

  useEffect(() => { loadReferenceData(); }, [loadReferenceData]);

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (raw) {
        const d = JSON.parse(raw) as Record<string, unknown>;
        const s = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : undefined);

        if (s('address') !== undefined) setAddress(d.address as string);
        if (s('about') !== undefined) setAbout(d.about as string);
        if (d.businessType === 'Freelancer' || d.businessType === 'Registered Company')
          setBusinessType(d.businessType);
        if (s('companyName') !== undefined) setCompanyName(d.companyName as string);
        if (s('tin') !== undefined) setTin(d.tin as string);
        if (Array.isArray(d.selectedSpecialtyIds))
          setSelectedSpecialtyIds((d.selectedSpecialtyIds as unknown[]).filter(x => typeof x === 'string') as string[]);
        if (Array.isArray(d.selectedLanguages))
          setSelectedLanguages((d.selectedLanguages as unknown[]).filter(x => typeof x === 'string') as string[]);

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
          setPkgTier(d.pkgTier);
        }
        if (s('pkgCurrencyId') !== undefined) setPkgCurrencyId(d.pkgCurrencyId as string);
        if (d.pkgs && typeof d.pkgs === 'object') {
          const draftPkgs = d.pkgs as Record<string, Partial<PkgFields>>;
          setPkgs(base => {
            const merged = { ...base };
            (['Silver', 'Gold', 'Diamond'] as PackageTier[]).forEach(t => {
              if (draftPkgs[t] && typeof draftPkgs[t] === 'object') {
                merged[t] = { ...merged[t], ...draftPkgs[t] };
              }
            });
            return merged;
          });
        }

        if (d.studioPkgs && typeof d.studioPkgs === 'object') {
          const draftStudioPkgs = d.studioPkgs as Record<string, Partial<PkgFields>>;
          setStudioPkgs(base => {
            const merged = { ...base };
            (['Silver', 'Gold', 'Diamond'] as PackageTier[]).forEach(t => {
              if (draftStudioPkgs[t] && typeof draftStudioPkgs[t] === 'object') {
                merged[t] = { ...merged[t], ...draftStudioPkgs[t] };
              }
            });
            return merged;
          });
        }
        if (d.studioPkgTier === 'Silver' || d.studioPkgTier === 'Gold' || d.studioPkgTier === 'Diamond') {
          setStudioPkgTier(d.studioPkgTier);
        }

        const savedSlide = typeof d.currentSlide === 'number' ? d.currentSlide : 0;
        const restoredSlide = Math.max(0, Math.min(savedSlide, 2));
        if (restoredSlide > 0) dispatch({ type: 'SET_SLIDE', slide: restoredSlide });
      }
    } catch {
      // Corrupt / unavailable storage - start fresh.
    }
    draftHydratedRef.current = true;
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftHydratedRef.current || draftFinalizedRef.current) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(draftStorageKey, JSON.stringify({
          address, about, businessType, companyName, tin,
          selectedSpecialtyIds, selectedLanguages,
          projTitle, projYear, projDescription,
          expPosition, expCompany, expLocation, expStartDate, expEndDate,
          expIsCurrent, expDescription,
          pkgTier, pkgCurrencyId, pkgs,
          studioPkgTier, studioPkgs,
          currentSlide: state.currentSlide,
        }));
      } catch {
        // Quota / private-mode - best-effort.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    draftStorageKey, address, about, businessType, companyName, tin,
    selectedSpecialtyIds, selectedLanguages, projTitle, projYear, projDescription,
    expPosition, expCompany, expLocation, expStartDate, expEndDate,
    expIsCurrent, expDescription, pkgTier, pkgCurrencyId, pkgs,
    studioPkgTier, studioPkgs,
    state.currentSlide,
  ]);

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
        const langsFromServer = (p as { spokenLanguages?: string[] }).spokenLanguages;
        if (Array.isArray(langsFromServer) && langsFromServer.length > 0) {
          setSelectedLanguages(langsFromServer);
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

        if (Array.isArray(p.packages) && p.packages.length > 0) {
          let firstSavedTier: PackageTier | null = null;
          let firstSavedStudioTier: PackageTier | null = null;
          const mergeInto = (
            setter: typeof setPkgs,
            captureFirst: (t: PackageTier) => void,
            wantStudio: boolean,
          ) => setter(base => {
            const merged = { ...base };
            for (const pk of p.packages!) {
              const t = pk.packageName;
              if (t !== 'Silver' && t !== 'Gold' && t !== 'Diamond') continue;
              const pkServiceType = (pk as { serviceType?: string }).serviceType ?? 'OUTDOOR';
              const isStudio = pkServiceType === 'STUDIO';
              if (isStudio !== wantStudio) continue;
              captureFirst(t);
              merged[t] = {
                price: typeof pk.price === 'number' && pk.price > 0 ? pk.price : merged[t].price,
                duration: typeof pk.durationHours === 'number' ? pk.durationHours : merged[t].duration,
                photos: typeof pk.includedPhotos === 'number' ? pk.includedPhotos : merged[t].photos,
                videos: typeof pk.includedVideos === 'number' ? pk.includedVideos : merged[t].videos,
                delivery: typeof pk.deliveryDays === 'number' ? pk.deliveryDays : merged[t].delivery,
                description: pk.description || merged[t].description,
              };
            }
            return merged;
          });
          mergeInto(setPkgs, t => { if (!firstSavedTier) firstSavedTier = t; }, false);
          mergeInto(setStudioPkgs, t => { if (!firstSavedStudioTier) firstSavedStudioTier = t; }, true);
          const cid = p.packages.find(pk => pk.currencyId)?.currencyId;
          if (cid) setPkgCurrencyId(cid);
          if (firstSavedTier) setPkgTier(firstSavedTier);
          if (firstSavedStudioTier) setStudioPkgTier(firstSavedStudioTier);
        }

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
        // Network hiccup - fall back to blank wizard.
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [prefillFromServer]);

  // ─── SLIDE 0 ───
  const handleLocationNext = () => {
    if (!address.trim()) { setSlideError('Please enter your working area/location'); return; }
    if (businessType === 'Registered Company') {
      if (!companyName.trim()) { setSlideError('Please enter your company name'); return; }
      if (!tin.trim()) { setSlideError('Please enter your TIN number'); return; }
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 1 });
  };

  // ─── SLIDE 1 ───
  const handleSpecialtiesNext = () => {
    if (selectedSpecialtyIds.length < 2) { setSlideError('Please select at least two specialties'); return; }
    if (selectedLanguages.length === 0) { setSlideError('Please select at least one spoken language'); return; }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 2 });
  };

  // ─── SLIDE 2 ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover' | 'project') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSlideError('Please select an image file'); return; }
    setSlideError('');
    const preview = URL.createObjectURL(file);
    if (type === 'profile') { setProfileFile(file); setProfilePreview(preview); }
    else if (type === 'cover') { setCoverFile(file); setCoverPreview(preview); }
    else { setProjFile(file); setProjPreview(preview); }
  };

  const handlePhotosNext = () => {
    if (!profileFile && !serverHas.profilePhoto) {
      setSlideError('Please upload a profile photo'); return;
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 3 });
  };

  // ─── SLIDE 3 ───
  const handleProjectNext = () => {
    if (!projTitle.trim()) { setSlideError('Please enter a project title'); return; }
    if (!projDescription.trim() || projDescription.trim().length < 10) {
      setSlideError('Please write a short description of the project');
      return;
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 4 });
  };

  // ─── SLIDE 4 ───
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

  // ─── Payload builder ───
  const buildPayload = (): OnboardingPayload => {
    const outdoorPackages: PackageEntry[] = (['Silver', 'Gold', 'Diamond'] as PackageTier[]).map(t => ({
      tier: t,
      price: pkgs[t].price,
      duration: pkgs[t].duration,
      photos: pkgs[t].photos,
      videos: pkgs[t].videos,
      delivery: pkgs[t].delivery,
      description: pkgs[t].description,
      features: [],
      serviceType: 'OUTDOOR',
    }));
    const studioPackagesPayload: PackageEntry[] = (['Silver', 'Gold', 'Diamond'] as PackageTier[])
      .filter(t => studioPkgs[t].price && studioPkgs[t].price > 0)
      .map(t => ({
        tier: t,
        price: studioPkgs[t].price,
        duration: studioPkgs[t].duration,
        photos: studioPkgs[t].photos,
        videos: studioPkgs[t].videos,
        delivery: studioPkgs[t].delivery,
        description: studioPkgs[t].description,
        features: [],
        serviceType: 'STUDIO',
      }));
    return {
      address: address.trim(),
      about: about.trim(),
      businessType,
      companyName: companyName.trim(),
      tin: tin.trim(),
      specialtyIds: selectedSpecialtyIds,
      spokenLanguages: selectedLanguages,
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
      pkgCurrencyId,
      packages: [...outdoorPackages, ...studioPackagesPayload],
    };
  };

  const who = { firstName, lastName, phone };

  const ensureSessionOnce = async (): Promise<{ success: boolean; error?: string }> => {
    if (!ensureSession) return { success: true };
    if (!sessionPromiseRef.current) sessionPromiseRef.current = ensureSession();
    try {
      const r = await sessionPromiseRef.current;
      if (!r || !r.success) sessionPromiseRef.current = null;
      return r;
    } catch (e) {
      sessionPromiseRef.current = null;
      return { success: false, error: e instanceof Error ? e.message : 'Could not start your session.' };
    }
  };

  const presenceFromRef = () => ({
    profilePhoto: !!syncStateRef.current.uploadedProfileFile || serverHas.profilePhoto,
    coverPhoto: !!syncStateRef.current.uploadedCoverFile || serverHas.coverPhoto,
    project: syncStateRef.current.created.project || serverHas.project,
    workExp: syncStateRef.current.created.workExp || serverHas.workExp,
    pkg: syncStateRef.current.created.pkg || serverHas.pkg,
  });

  const runServerSync = async (flush = false): Promise<void> => {
    if (!serverSync || draftFinalizedRef.current) return;
    const sess = await ensureSessionOnce();
    if (!sess.success) {
      // Was a bare `return`. This is the exact path that dropped a whole
      // wizard's worth of input in production without telling anyone.
      setSyncStatus('error');
      setSyncErrorKind('auth');
      return;
    }
    if (syncInFlightRef.current) {
      if (!flush) return;
      let waited = 0;
      while (syncInFlightRef.current && waited < 12000) {
        await new Promise(r => setTimeout(r, 200)); waited += 200;
      }
      if (syncInFlightRef.current) return;
    }
    syncInFlightRef.current = true;
    setSyncStatus('saving');
    try {
      const { state: nextState, presence } = await syncPhotographerProfile(
        buildPayload(), who, syncStateRef.current
      );
      syncStateRef.current = nextState;
      setServerHas(presence);
      setSyncStatus('saved');
      setSyncErrorKind(null);
    } catch (err) {
      // Still never throws - a background save must not break typing - but it
      // is no longer silent. A 401 here means the session died mid-wizard and
      // re-authenticating is the only fix; anything else is worth a retry.
      const status = (err as { status?: number } | null)?.status;
      setSyncStatus('error');
      setSyncErrorKind(status === 401 || status === 403 ? 'auth' : 'network');
    } finally {
      syncInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!shouldAutosave({ serverSync, isOpen, finalized: draftFinalizedRef.current, currentSlide: state.currentSlide })) return;
    const t = setTimeout(() => { void runServerSync(false); }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serverSync, isOpen, address, about, businessType, companyName, tin,
    selectedSpecialtyIds, profileFile, coverFile, projTitle, projYear,
    projDescription, projFile, expPosition, expCompany, expLocation,
    expStartDate, expEndDate, expIsCurrent, expDescription,
    pkgCurrencyId, pkgs, studioPkgs, state.currentSlide,
  ]);

  // ─── SLIDE 5 ───
  const handleCreatePackage = () => {
    const badTier = (['Silver', 'Gold', 'Diamond'] as PackageTier[]).find(t => !pkgs[t].price || pkgs[t].price <= 0);
    if (badTier) { setSlideError(`Please enter a valid price for the ${badTier} package`); return; }
    if (!pkgCurrencyId) { setSlideError('Please select a currency'); return; }
    if (!profileFile && !serverHas.profilePhoto) {
      setSlideError('Profile photo is missing - go back to the Photos step'); return;
    }
    setSlideError('');
    dispatch({ type: 'SET_SLIDE', slide: 6 });
  };

  // ─── SLIDE 6 + final submit ───
  const handleFinalSubmit = async () => {
    setSlideError('');
    dispatch({ type: 'SET_SUBMITTING', value: true });
    try {
      if (serverSync) {
        const sess = await ensureSessionOnce();
        if (!sess.success) {
          throw new Error(sess.error || 'Could not start your session. Please try again.');
        }
        await runServerSync(true);
      }

      const payload: OnboardingPayload = {
        ...buildPayload(),
        existing: (serverSync || prefillFromServer) ? presenceFromRef() : undefined,
      };

      await onFinalize(payload);
      draftFinalizedRef.current = true;
      try { window.localStorage.removeItem(draftStorageKey); } catch { /* ignore */ }
      dispatch({ type: 'SET_SLIDE', slide: 7 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not finalise your profile. Please try again.';
      setSlideError(msg);
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  if (!isOpen) return null;

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

  const TOTAL_INPUT_SLIDES = 7;
  const isSuccessSlide = state.currentSlide === 7;
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
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: BRAND_STRIPE, zIndex: 5,
          }} />

          <div style={{
            position: 'absolute', top: 3, left: 0, right: 0, height: 3,
            background: 'rgba(8,58,133,0.06)', zIndex: 4,
          }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: BRAND_STRIPE,
              boxShadow: '0 0 10px rgba(242,12,143,0.45)',
              transition: 'width 0.4s ease',
            }} />
          </div>

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

          <div style={{ flex: 1, overflowY: 'auto', padding: '34px 24px 24px' }}>

            {/*
              Save state (CONN-ONB-3). Quiet when things are working - a
              wizard should not shout "Saved" after every keystroke - and
              unmissable when they are not, because the failure mode this
              replaces was a user filling in seven steps that persisted
              nowhere while the UI looked completely normal.
            */}
            {refDataError && (
              <div role="alert" style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                marginBottom: 16, padding: '10px 12px', borderRadius: 10,
                background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E',
                fontSize: 13, lineHeight: 1.45,
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 14 }} />
                <span style={{ flex: 1, minWidth: 180 }}>
                  {refDataError === 'both'
                    ? 'We could not load the specialty and currency options.'
                    : refDataError === 'categories'
                      ? 'We could not load the specialty options.'
                      : 'We could not load the currency options.'}
                  {' '}Those selectors will be empty until this loads.
                </span>
                <button
                  type="button"
                  onClick={loadReferenceData}
                  style={{
                    padding: '5px 12px', borderRadius: 999, border: '1px solid #92400E',
                    background: 'transparent', color: '#92400E', fontSize: 12,
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Reload options
                </button>
              </div>
            )}

            {syncStatus === 'error' ? (
              <div role="alert" style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                marginBottom: 16, padding: '10px 12px', borderRadius: 10,
                background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C',
                fontSize: 13, lineHeight: 1.45,
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 14 }} />
                <span style={{ flex: 1, minWidth: 180 }}>
                  {syncErrorKind === 'auth'
                    ? 'Your session expired, so recent changes have not been saved. Sign in again to keep them.'
                    : 'We could not save your latest changes. Check your connection.'}
                </span>
                <button
                  type="button"
                  onClick={() => { void runServerSync(true); }}
                  style={{
                    padding: '5px 12px', borderRadius: 999, border: '1px solid #B91C1C',
                    background: 'transparent', color: '#B91C1C', fontSize: 12,
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Retry now
                </button>
              </div>
            ) : syncStatus !== 'idle' ? (
              <div aria-live="polite" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 12, fontSize: 12,
                color: syncStatus === 'saving' ? '#64748b' : '#059669',
              }}>
                <i
                  className={syncStatus === 'saving' ? 'bi bi-arrow-repeat' : 'bi bi-check-circle-fill'}
                  style={{ fontSize: 12 }}
                />
                <span>{syncStatus === 'saving' ? 'Saving…' : 'Saved'}</span>
              </div>
            ) : null}

            {/* ── SLIDE 0 ── */}
            {state.currentSlide === 0 ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 18, padding: 2.5,
                    background: BRAND_GRADIENT, margin: '0 auto 14px',
                    boxShadow: '0 12px 26px -6px rgba(242,12,143,0.34)',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: 15,
                      background: 'linear-gradient(135deg, #083A85 0%, #1e4fb8 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-geo-alt-fill" style={{ fontSize: 22, color: '#fff' }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.66rem', fontWeight: 700,
                    color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
                  }}>Step 1 of 7 · Basics</div>
                  <h3 style={{ color: TEXT_PRIMARY, fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.015em' }}>
                    Welcome, {firstName}!
                  </h3>
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
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. Kigali, Rwanda" style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>About You</label>
                    <textarea value={about} onChange={e => setAbout(e.target.value)}
                      placeholder="Tell clients about your experience and style…"
                      rows={3} style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5 }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Business Type <span style={{ color: '#DC2626' }}>*</span></label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['Freelancer', 'Registered Company'] as const).map(type => {
                        const sel = businessType === type;
                        const icon = type === 'Freelancer' ? 'bi-person-fill' : 'bi-building-fill';
                        return (
                          <button key={type} type="button" onClick={() => setBusinessType(type)} style={{
                            position: 'relative', flex: 1, padding: '12px 8px', borderRadius: 12,
                            fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.005em', cursor: 'pointer',
                            background: sel ? 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.05) 100%)' : '#f9fafb',
                            border: sel ? `1.5px solid ${PINK}` : `1.5px solid ${INPUT_BORDER}`,
                            color: sel ? PINK : TEXT_SECONDARY,
                            boxShadow: sel ? '0 6px 16px -6px rgba(242,12,143,0.30)' : 'none',
                            overflow: 'hidden', transition: 'all 0.15s',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          }}>
                            {sel && <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: BRAND_STRIPE }} />}
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
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                          placeholder="e.g. Studio Kigali Ltd" style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>TIN (Tax Identification Number) <span style={{ color: '#DC2626' }}>*</span></label>
                        <input type="text" value={tin} onChange={e => setTin(e.target.value)}
                          placeholder="e.g. 123456789" style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </>
                  )}

                  <button onClick={handleLocationNext} disabled={state.isSubmitting}
                    style={{ ...btnPrimary, marginTop: 8, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                    {state.isSubmitting ? 'Saving…' : <>Continue <i className="bi bi-arrow-right"></i></>}
                  </button>
                </div>
              </div>

            /* ── SLIDE 1 ── */
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
                      <button key={cat.id}
                        onClick={() => setSelectedSpecialtyIds(prev => sel ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                        style={{
                          padding: '8px 14px', borderRadius: 999,
                          fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em', cursor: 'pointer',
                          background: sel ? BRAND_GRADIENT : '#f9fafb',
                          border: sel ? 'none' : `1.5px solid ${INPUT_BORDER}`,
                          color: sel ? '#fff' : TEXT_SECONDARY,
                          boxShadow: sel ? '0 6px 14px -4px rgba(242,12,143,0.36)' : 'none',
                          transition: 'all 0.15s',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}>
                        {sel && <i className="bi bi-check-circle-fill" style={{ fontSize: 12 }} />}
                        {cat.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading specialties…</p>}
                </div>

                <label style={{ display: 'block', color: TEXT_PRIMARY, fontSize: 13, fontWeight: 700, margin: '6px 0 4px', letterSpacing: '-0.005em' }}>
                  Languages you speak <span style={{ color: PINK }}>*</span>
                </label>
                <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '0 0 8px' }}>
                  Pick at least one. Clients see this on your public profile.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {([
                    { code: 'EN', label: 'English' },
                    { code: 'FR', label: 'French' },
                    { code: 'RW', label: 'Kinyarwanda' },
                    { code: 'SWA', label: 'Swahili' },
                    { code: 'SPA', label: 'Spanish' },
                    { code: 'CHI', label: 'Chinese' },
                  ] as { code: string; label: string }[]).map(opt => {
                    const sel = selectedLanguages.includes(opt.code);
                    return (
                      <button type="button" key={opt.code}
                        onClick={() => setSelectedLanguages(prev => sel ? prev.filter(c => c !== opt.code) : [...prev, opt.code])}
                        style={{
                          padding: '8px 14px', borderRadius: 999,
                          fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em', cursor: 'pointer',
                          background: sel ? BRAND_GRADIENT : '#f9fafb',
                          border: sel ? 'none' : `1.5px solid ${INPUT_BORDER}`,
                          color: sel ? '#fff' : TEXT_SECONDARY,
                          boxShadow: sel ? '0 6px 14px -4px rgba(242,12,143,0.36)' : 'none',
                          transition: 'all 0.15s',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}>
                        {sel && <i className="bi bi-check-circle-fill" style={{ fontSize: 12 }} />}
                        {opt.label} <span style={{ opacity: 0.7, fontSize: 11 }}>({opt.code})</span>
                      </button>
                    );
                  })}
                </div>

                <button onClick={handleSpecialtiesNext} disabled={state.isSubmitting}
                  style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 2 ── */
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
                  <div>
                    <label style={labelStyle}>Profile Photo</label>
                    <input type="file" ref={profileInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'profile')} style={{ display: 'none' }} />
                    <div onClick={() => profileInputRef.current?.click()} style={{
                      width: 100, height: 100, borderRadius: '50%',
                      border: `1.5px dashed ${profilePreview ? PINK : 'rgba(8,58,133,0.32)'}`,
                      background: profilePreview ? `url(${profilePreview}) center/cover` : INPUT_BG,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                    }}>
                      {!profilePreview && <i className="bi bi-camera" style={{ fontSize: 24, color: TEXT_MUTED }}></i>}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Cover Photo</label>
                    <input type="file" ref={coverInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'cover')} style={{ display: 'none' }} />
                    <div onClick={() => coverInputRef.current?.click()} style={{
                      width: '100%', height: 140, borderRadius: 12,
                      border: `1.5px dashed ${coverPreview ? PINK : 'rgba(8,58,133,0.32)'}`,
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

                <button onClick={handlePhotosNext} disabled={state.isSubmitting}
                  style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Uploading...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 3 ── */
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
                    <input type="text" value={projTitle} onChange={e => setProjTitle(e.target.value)}
                      placeholder="e.g. Bella & Eric's Wedding" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Year *</label>
                    <input type="number" min="1990" max={String(new Date().getFullYear())}
                      value={projYear} onChange={e => setProjYear(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Description *</label>
                    <textarea value={projDescription} onChange={e => setProjDescription(e.target.value)}
                      placeholder="What was the brief? Where was it? What made it memorable?"
                      rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Cover Image (optional)</label>
                    <input type="file" ref={projInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'project')} style={{ display: 'none' }} />
                    <div onClick={() => projInputRef.current?.click()} style={{
                      width: '100%', height: 120, borderRadius: 12,
                      border: `1.5px dashed ${projPreview ? PINK : 'rgba(8,58,133,0.32)'}`,
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

                <button onClick={handleProjectNext} disabled={state.isSubmitting}
                  style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 4 ── */
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
                    <input type="text" value={expPosition} onChange={e => setExpPosition(e.target.value)}
                      placeholder="e.g. Lead Photographer" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company / Studio *</label>
                    <input type="text" value={expCompany} onChange={e => setExpCompany(e.target.value)}
                      placeholder="e.g. Studio Kigali" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Location</label>
                    <input type="text" value={expLocation} onChange={e => setExpLocation(e.target.value)}
                      placeholder="e.g. Kigali, Rwanda" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Start date</label>
                      <input type="month" value={expStartDate} onChange={e => setExpStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>End date</label>
                      <input type="month" value={expEndDate} onChange={e => setExpEndDate(e.target.value)}
                        disabled={expIsCurrent} style={{ ...inputStyle, opacity: expIsCurrent ? 0.5 : 1 }} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={expIsCurrent} onChange={e => setExpIsCurrent(e.target.checked)} />
                    I currently work here
                  </label>
                  <div>
                    <label style={labelStyle}>What did you do? *</label>
                    <textarea value={expDescription} onChange={e => setExpDescription(e.target.value)}
                      placeholder="Describe the work, kinds of shoots, scale, results... (50+ characters)"
                      rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
                    <p style={{ color: TEXT_MUTED, fontSize: 11, margin: '4px 0 0' }}>{expDescription.length} / 50 minimum</p>
                  </div>
                </div>

                <button onClick={handleExperienceNext} disabled={state.isSubmitting}
                  style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 5: Outdoor Packages ── */
            ) : state.currentSlide === 5 ? (
              (() => {
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
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                          Step 6 of 7 · Outdoor Packages
                        </div>
                        <h3 style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>Outdoor Packages</h3>
                        <p style={{ color: TEXT_MUTED, fontSize: 12.5, margin: '2px 0 0' }}>
                          Set your Silver / Gold / Diamond pricing for outdoor event bookings.
                        </p>
                      </div>
                    </div>

                    {slideError && (
                      <div style={errorBoxStyle}>
                        <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                        <span>{slideError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Tier selector */}
                      <div>
                        <label style={labelStyle}>Package Tier</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['Silver', 'Gold', 'Diamond'] as const).map(tier => {
                            const sel = pkgTier === tier;
                            const t = TIER_GRADIENTS[tier];
                            return (
                              <button key={tier} onClick={() => setPkgTier(tier)} style={{
                                flex: 1, padding: '12px 8px', borderRadius: 12,
                                fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.005em', cursor: 'pointer',
                                background: sel ? t.gradient : '#f9fafb',
                                border: sel ? 'none' : `1.5px solid ${INPUT_BORDER}`,
                                color: sel ? '#fff' : TEXT_SECONDARY,
                                boxShadow: sel ? `0 8px 20px -6px ${t.glow}` : 'none',
                                textShadow: sel ? '0 1px 2px rgba(0,0,0,0.18)' : 'none',
                                transition: 'all 0.2s',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}>
                                <i className={`bi ${t.icon}`} style={{ fontSize: 13 }} />
                                {tier}{pkgs[tier].price > 0 ? ' ✓' : ''}
                              </button>
                            );
                          })}
                        </div>
                        <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '6px 0 0' }}>
                          The ✓ shows which tiers you&apos;ve priced. All three are required.
                        </p>
                      </div>

                      {/* Active tier card */}
                      <div style={{
                        position: 'relative', borderRadius: 14, padding: '12px 14px',
                        background: 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                        border: `1.5px solid ${INPUT_BORDER}`, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: activeTier.gradient }} />
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, background: activeTier.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
                          <select value={pkgCurrencyId} onChange={e => setPkgCurrencyId(e.target.value)}
                            style={{ ...inputStyle, width: 'auto', minWidth: 96, flex: '0 0 auto', appearance: 'auto' as const, fontWeight: 700, color: PINK }}>
                            {currencies.map(c => <option key={c.id} value={c.id} style={{ color: TEXT_PRIMARY }}>{c.code}</option>)}
                          </select>
                          <input type="number" value={pkgPrice || ''} onChange={e => setPkgPrice(parseInt(e.target.value) || 0)}
                            placeholder="Enter your price" required
                            style={{ ...inputStyle, flex: 1, fontWeight: 700, fontSize: 15 }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}><i className="bi bi-clock-fill" style={{ fontSize: 10, marginRight: 4 }} />Duration (hours)</label>
                          <input type="number" value={pkgDuration || ''} onChange={e => setPkgDuration(parseInt(e.target.value) || 0)}
                            placeholder="Hours of coverage" required style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}><i className="bi bi-truck" style={{ fontSize: 10, marginRight: 4 }} />Delivery (days)</label>
                          <input type="number" value={pkgDelivery || ''} onChange={e => setPkgDelivery(parseInt(e.target.value) || 0)}
                            placeholder="Days to deliver" required style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}><i className="bi bi-camera-fill" style={{ fontSize: 10, marginRight: 4 }} />Included Photos</label>
                          <input type="number" value={pkgPhotos || ''} onChange={e => setPkgPhotos(parseInt(e.target.value) || 0)}
                            placeholder="Number of photos" required style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}><i className="bi bi-camera-reels-fill" style={{ fontSize: 10, marginRight: 4 }} />Included Videos</label>
                          <input type="number" value={pkgVideos || ''} onChange={e => setPkgVideos(parseInt(e.target.value) || 0)}
                            placeholder="Number of videos" style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Description</label>
                        <textarea value={pkgDescription} onChange={e => setPkgDescription(e.target.value)}
                          placeholder="Briefly describe what's included in this package"
                          rows={2} style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5 }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.12)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>

                      <button onClick={handleCreatePackage} disabled={state.isSubmitting}
                        style={{ ...btnPrimary, marginTop: 4, opacity: state.isSubmitting ? 0.7 : 1, cursor: state.isSubmitting ? 'not-allowed' : 'pointer' }}
                        onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
                        {state.isSubmitting ? <>Saving&hellip;</> : <>Continue <i className="bi bi-arrow-right"></i></>}
                      </button>
                    </div>
                  </div>
                );
              })()

            /* ── SLIDE 6: Indoor Packages (optional) ── */
            ) : state.currentSlide === 6 ? (
              (() => {
                const activeStudioTier = TIER_GRADIENTS[studioPkgTier];
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                      <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 5 })} style={backBtnStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}>
                        <i className="bi bi-arrow-left"></i>
                      </button>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                          Step 7 of 7 · Indoor Packages (Optional)
                        </div>
                        <h3 style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>Indoor Packages</h3>
                        <p style={{ color: TEXT_MUTED, fontSize: 12.5, margin: '2px 0 0' }}>
                          Optional: price your indoor sessions or Skip if you don&apos;t offer them.
                        </p>
                      </div>
                    </div>

                    {slideError && (
                      <div style={errorBoxStyle}>
                        <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                        <span>{slideError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Tier selector */}
                      <div>
                        <label style={labelStyle}>Package Tier</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['Silver', 'Gold', 'Diamond'] as const).map(tier => {
                            const sel = studioPkgTier === tier;
                            const t = TIER_GRADIENTS[tier];
                            return (
                              <button key={tier} onClick={() => setStudioPkgTier(tier)} type="button" style={{
                                flex: 1, padding: '12px 8px', borderRadius: 12,
                                fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.005em', cursor: 'pointer',
                                background: sel ? t.gradient : '#f9fafb',
                                border: sel ? 'none' : `1.5px solid ${INPUT_BORDER}`,
                                color: sel ? '#fff' : TEXT_SECONDARY,
                                boxShadow: sel ? `0 8px 20px -6px ${t.glow}` : 'none',
                                textShadow: sel ? '0 1px 2px rgba(0,0,0,0.18)' : 'none',
                                transition: 'all 0.2s',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              }}>
                                <i className={`bi ${t.icon}`} style={{ fontSize: 13 }} />
                                {tier}{studioPkgs[tier].price > 0 ? ' ✓' : ''}
                              </button>
                            );
                          })}
                        </div>
                        <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '6px 0 0' }}>
                          The ✓ shows which tiers you&apos;ve priced. Tiers left at 0 are skipped on submit.
                        </p>
                      </div>

                      {/* Active tier card */}
                      <div style={{
                        position: 'relative', borderRadius: 14, padding: '12px 14px',
                        background: 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                        border: `1.5px solid rgba(8,58,133,0.12)`,
                        display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden',
                      }}>
                        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)' }} />
                        <div style={{
                          width: 38, height: 38, borderRadius: 11, background: activeStudioTier.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16,
                          boxShadow: `0 8px 18px -6px ${activeStudioTier.glow}`,
                        }}>
                          <i className={`bi ${activeStudioTier.icon}`} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: PINK, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Selected tier</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: '-0.01em' }}>{studioPkgTier} package</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
                        <div>
                          <label style={labelStyle}>Price ({currencyCode})</label>
                          <input type="number" min={0} value={studioCur.price || ''}
                            onChange={e => setStudioPkgField('price', Math.max(0, parseInt(e.target.value, 10) || 0))}
                            placeholder="Enter your price" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Duration (hrs)</label>
                          <input type="number" min={0} value={studioCur.duration || ''}
                            onChange={e => setStudioPkgField('duration', Math.max(0, parseInt(e.target.value, 10) || 0))}
                            placeholder="Hours of coverage" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Photos</label>
                          <input type="number" min={0} value={studioCur.photos || ''}
                            onChange={e => setStudioPkgField('photos', Math.max(0, parseInt(e.target.value, 10) || 0))}
                            placeholder="Number of photos" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Videos</label>
                          <input type="number" min={0} value={studioCur.videos || ''}
                            onChange={e => setStudioPkgField('videos', Math.max(0, parseInt(e.target.value, 10) || 0))}
                            placeholder="Number of videos" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Delivery (days)</label>
                          <input type="number" min={1} value={studioCur.delivery || ''}
                            onChange={e => setStudioPkgField('delivery', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            placeholder="Days to deliver" style={inputStyle} />
                        </div>
                      </div>

                      <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle}>Description</label>
                        <textarea value={studioCur.description}
                          onChange={e => setStudioPkgField('description', e.target.value)}
                          placeholder="Briefly describe what's included in this package"
                          rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={handleFinalSubmit} disabled={state.isSubmitting} style={{
                          flex: '0 0 auto', padding: '12px 18px', borderRadius: 12,
                          border: `1.5px solid ${INPUT_BORDER}`, background: '#ffffff',
                          color: TEXT_SECONDARY, fontSize: 14, fontWeight: 700,
                          cursor: state.isSubmitting ? 'not-allowed' : 'pointer',
                          opacity: state.isSubmitting ? 0.6 : 1,
                          transition: 'border-color 0.15s, color 0.15s',
                        }}
                          onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = INPUT_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}>
                          Skip
                        </button>
                        <button type="button" onClick={handleFinalSubmit} disabled={state.isSubmitting} style={{
                          ...btnPrimary, flex: 1,
                          opacity: state.isSubmitting ? 0.7 : 1,
                          cursor: state.isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                          onMouseEnter={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; } }}
                          onMouseLeave={(e) => { if (!state.isSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; } }}>
                          {state.isSubmitting ? <>Submitting profile&hellip;</> : <><i className="bi bi-check-circle-fill"></i> Continue &amp; Submit Profile</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()

            /* ── SLIDE 7: Success ── */
            ) : state.currentSlide === 7 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 22, padding: 3,
                  background: 'linear-gradient(135deg, #10b981 0%, #F20C8F 130%)',
                  margin: '0 auto 20px',
                  boxShadow: '0 14px 30px -6px rgba(16,185,129,0.36)',
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: 19,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-check-lg" style={{ fontSize: 34, color: '#fff' }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>All done</div>
                <h2 style={{ color: TEXT_PRIMARY, fontSize: 24, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.015em' }}>Profile Submitted!</h2>
                <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: '0 0 6px', lineHeight: 1.5 }}>
                  Your <strong>Silver</strong>, <strong>Gold</strong> &amp; <strong>Diamond</strong> packages (from <strong>{currencyCode} {pkgs.Silver.price.toLocaleString()}</strong>) have been saved.
                </p>
                <p style={{ color: TEXT_MUTED, fontSize: 13, margin: '0 auto 24px', lineHeight: 1.55, maxWidth: 360 }}>
                  Your profile is now under review. Once approved, clients will be able to find and book you.
                </p>
                <button onClick={onComplete} style={btnPrimary}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(242,12,143,0.55)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = BRAND_SHADOW; }}>
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