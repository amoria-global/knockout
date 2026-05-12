'use client';

import React, { useState, useEffect, useReducer, useRef } from 'react';
import { getCurrencies, type Currency } from '@/lib/APIs/public';
import { apiClient } from '@/lib/api/client';

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
  // Slide 2
  profileFile: File;
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

const ACCENT = '#083A85';
const ACCENT_DARK = '#0a4da3';
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

const TIER_PRESETS: Record<string, { price: number; duration: number; photos: number; videos: number; delivery: number; features: string[] }> = {
  Silver: { price: 50000, duration: 2, photos: 50, videos: 0, delivery: 7, features: ['Online gallery storage', 'Digital Memory Sharing Experience', 'Same-day preview', 'Custom branding'] },
  Gold: { price: 100000, duration: 4, photos: 100, videos: 1, delivery: 5, features: ['Online gallery storage', 'Digital Memory Sharing Experience', 'Same-day preview', 'Custom branding', 'Fast processing', 'Outdoor photography', 'Event coverage'] },
  Diamond: { price: 200000, duration: 8, photos: 200, videos: 3, delivery: 3, features: ['Online gallery storage', 'Digital Memory Sharing Experience', 'Same-day preview', 'Custom branding', 'Fast processing', 'Outdoor photography', 'Event coverage', 'Live-streaming', 'Unlimited photos & videos'] },
};

// ─── Component ───

const PhotographerOnboarding: React.FC<PhotographerOnboardingProps> = ({
  isOpen, onClose, onComplete, onFinalize, firstName, lastName, phone,
}) => {
  // firstName / lastName / phone are kept on props so the parent can pass
  // them back through onFinalize alongside its own credentials state, but
  // the wizard itself doesn't need to read them during the slides.
  void firstName; void lastName; void phone;
  const [state, dispatch] = useReducer(reducer, initialState);

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
        setCurrenciesList(r.data);
        const rwf = r.data.find(c => c.code === 'RWF');
        if (rwf) setPkgCurrencyId(rwf.id);
        else if (r.data.length > 0) setPkgCurrencyId(r.data[0].id);
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
    const preset = TIER_PRESETS[pkgTier];
    if (preset) {
      setPkgPrice(preset.price);
      setPkgDuration(preset.duration);
      setPkgPhotos(preset.photos);
      setPkgVideos(preset.videos);
      setPkgDelivery(preset.delivery);
    }
  }, [pkgTier]);

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
    if (!profileFile) { setSlideError('Please upload a profile photo'); return; }
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

  // ─── SLIDE 5: Package ───

  const handleCreatePackage = async () => {
    if (!pkgPrice || pkgPrice <= 0) { setSlideError('Please enter a valid price'); return; }
    if (!pkgCurrencyId) { setSlideError('Please select a currency'); return; }
    if (!profileFile) { setSlideError('Profile photo is missing — go back to the Photos step'); return; }
    setSlideError('');

    const preset = TIER_PRESETS[pkgTier];
    const features = (preset?.features || []).map((f, i) => ({
      featureName: f, isIncluded: true, displayOrder: i,
    }));

    const payload: OnboardingPayload = {
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

    dispatch({ type: 'SET_SUBMITTING', value: true });
    try {
      await onFinalize(payload);
      dispatch({ type: 'SET_SLIDE', slide: 6 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not finalise your profile. Please try again.';
      setSlideError(msg);
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  if (!isOpen) return null;

  const currencyCode = currencies.find(c => c.id === pkgCurrencyId)?.code || 'RWF';

  // ─── RENDER ───

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{
          width: '100%', maxWidth: 580, maxHeight: '92vh', background: '#ffffff',
          border: '1px solid #e5e7eb', borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.15)', position: 'relative',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Close button — dismisses the wizard but does NOT advance to OTP.
              Only slide 6's "Continue to Dashboard" button (onComplete) is
              allowed to push the user toward the verify-OTP page. */}
          <button onClick={onClose} aria-label="Close" style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10, width: 36, height: 36,
            borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb',
            color: '#6b7280', fontSize: 16, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="bi bi-x-lg"></i>
          </button>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 24px' }}>

            {state.currentSlide === 0 ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <i className="bi bi-geo-alt-fill" style={{ fontSize: 22, color: '#fff' }}></i>
                  </div>
                  <h3 style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Welcome, {firstName}!</h3>
                  <p style={{ color: TEXT_MUTED, fontSize: 13, margin: 0 }}>Let&apos;s set up your profile so clients can find you</p>
                </div>

                {slideError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{slideError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Working Area / Location *</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Kigali, Rwanda" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>About You</label>
                    <textarea value={about} onChange={e => setAbout(e.target.value)} placeholder="Tell clients about your experience and style..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  </div>

                  {/* Business Type */}
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Business Type *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['Freelancer', 'Registered Company'] as const).map(type => {
                        const sel = businessType === type;
                        return (
                          <button key={type} type="button" onClick={() => setBusinessType(type)} style={{
                            flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: sel ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#f9fafb',
                            border: sel ? 'none' : `1px solid ${INPUT_BORDER}`, color: sel ? '#fff' : TEXT_SECONDARY,
                            transition: 'all 0.2s',
                          }}>
                            {type === 'Freelancer' ? (
                              <><i className="bi bi-person" style={{ marginRight: 6 }}></i>{type}</>
                            ) : (
                              <><i className="bi bi-building" style={{ marginRight: 6 }}></i>{type}</>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {businessType === 'Registered Company' && (
                    <>
                      <div>
                        <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Company Name *</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Studio Kigali Ltd" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>TIN (Tax Identification Number) *</label>
                        <input type="text" value={tin} onChange={e => setTin(e.target.value)} placeholder="e.g. 123456789" style={inputStyle} />
                      </div>
                    </>
                  )}

                  <button onClick={handleLocationNext} disabled={state.isSubmitting} style={{ ...btnPrimary, marginTop: 8, opacity: state.isSubmitting ? 0.6 : 1 }}>
                    {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                  </button>
                </div>
              </div>

            /* ── SLIDE 1: Specialties ── */
            ) : state.currentSlide === 1 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 0 })} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #bab8b8', borderRadius: 10, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Your Specialties</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Select what you specialize in</p>
                  </div>
                </div>

                {slideError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{slideError}</div>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {categories.map(cat => {
                    const sel = selectedSpecialtyIds.includes(cat.id);
                    return (
                      <button key={cat.id} onClick={() => setSelectedSpecialtyIds(prev => sel ? prev.filter(id => id !== cat.id) : [...prev, cat.id])} style={{
                        padding: '10px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        background: sel ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : '#f9fafb',
                        border: sel ? 'none' : `1px solid ${INPUT_BORDER}`, color: sel ? '#fff' : TEXT_SECONDARY,
                        transition: 'all 0.2s',
                      }}>
                        {cat.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading specialties...</p>}
                </div>

                <button onClick={handleSpecialtiesNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.6 : 1 }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 2: Photos ── */
            ) : state.currentSlide === 2 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 1 })} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #bab8b8', borderRadius: 10, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Profile Photos</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Add photos to make your profile stand out</p>
                  </div>
                </div>

                {slideError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{slideError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  {/* Profile Photo */}
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Profile Photo</label>
                    <input type="file" ref={profileInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'profile')} style={{ display: 'none' }} />
                    <div onClick={() => profileInputRef.current?.click()} style={{
                      width: 100, height: 100, borderRadius: '50%', border: `2px dashed ${profilePreview ? ACCENT : INPUT_BORDER}`,
                      background: profilePreview ? `url(${profilePreview}) center/cover` : INPUT_BG,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                    }}>
                      {!profilePreview && <i className="bi bi-camera" style={{ fontSize: 24, color: TEXT_MUTED }}></i>}
                    </div>
                  </div>

                  {/* Cover Photo */}
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Cover Photo</label>
                    <input type="file" ref={coverInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'cover')} style={{ display: 'none' }} />
                    <div onClick={() => coverInputRef.current?.click()} style={{
                      width: '100%', height: 140, borderRadius: 12, border: `2px dashed ${coverPreview ? ACCENT : INPUT_BORDER}`,
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

                <button onClick={handlePhotosNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.6 : 1 }}>
                  {state.isSubmitting ? 'Uploading...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 3: First featured project ── */
            ) : state.currentSlide === 3 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 2 })} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #bab8b8', borderRadius: 10, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Your First Project</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Add a recent project clients can browse</p>
                  </div>
                </div>

                {slideError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{slideError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Project Title *</label>
                    <input type="text" value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="e.g. Bella & Eric's Wedding" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Year *</label>
                    <input type="number" min="1990" max={String(new Date().getFullYear())} value={projYear} onChange={e => setProjYear(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description *</label>
                    <textarea value={projDescription} onChange={e => setProjDescription(e.target.value)} placeholder="What was the brief? Where was it? What made it memorable?" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Cover Image (optional)</label>
                    <input type="file" ref={projInputRef} accept="image/*" onChange={e => handleFileSelect(e, 'project')} style={{ display: 'none' }} />
                    <div onClick={() => projInputRef.current?.click()} style={{
                      width: '100%', height: 120, borderRadius: 12, border: `2px dashed ${projPreview ? ACCENT : INPUT_BORDER}`,
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

                <button onClick={handleProjectNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.6 : 1 }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 4: First work experience ── */
            ) : state.currentSlide === 4 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 3 })} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #bab8b8', borderRadius: 10, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Work Experience</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Tell clients where you&apos;ve shot before</p>
                  </div>
                </div>

                {slideError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{slideError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Role / Position *</label>
                    <input type="text" value={expPosition} onChange={e => setExpPosition(e.target.value)} placeholder="e.g. Lead Photographer" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Company / Studio *</label>
                    <input type="text" value={expCompany} onChange={e => setExpCompany(e.target.value)} placeholder="e.g. Studio Kigali" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Location</label>
                    <input type="text" value={expLocation} onChange={e => setExpLocation(e.target.value)} placeholder="e.g. Kigali, Rwanda" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Start date</label>
                      <input type="month" value={expStartDate} onChange={e => setExpStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>End date</label>
                      <input type="month" value={expEndDate} onChange={e => setExpEndDate(e.target.value)} disabled={expIsCurrent} style={{ ...inputStyle, opacity: expIsCurrent ? 0.5 : 1 }} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={expIsCurrent} onChange={e => setExpIsCurrent(e.target.checked)} />
                    I currently work here
                  </label>
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>What did you do? *</label>
                    <textarea value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="Describe the work, kinds of shoots, scale, results... (50+ characters)" rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
                    <p style={{ color: TEXT_MUTED, fontSize: 11, margin: '4px 0 0' }}>{expDescription.length} / 50 minimum</p>
                  </div>
                </div>

                <button onClick={handleExperienceNext} disabled={state.isSubmitting} style={{ ...btnPrimary, opacity: state.isSubmitting ? 0.6 : 1 }}>
                  {state.isSubmitting ? 'Saving...' : <>Continue <i className="bi bi-arrow-right"></i></>}
                </button>
              </div>

            /* ── SLIDE 5: Package ── */
            ) : state.currentSlide === 5 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <button onClick={() => dispatch({ type: 'SET_SLIDE', slide: 4 })} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #bab8b8', borderRadius: 10, color: TEXT_SECONDARY, fontSize: 13, cursor: 'pointer' }}>
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <div>
                    <h3 style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 700, margin: 0 }}>Create a Package</h3>
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: 0 }}>Set your first pricing package</p>
                  </div>
                </div>

                {slideError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{slideError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Tier selector */}
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Package Tier</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['Silver', 'Gold', 'Diamond'] as const).map(tier => {
                        const sel = pkgTier === tier;
                        const colors: Record<string, string> = { Silver: '#22D3EE', Gold: '#FBBF24', Diamond: '#8B5CF6' };
                        return (
                          <button key={tier} onClick={() => setPkgTier(tier)} style={{
                            flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: sel ? colors[tier] : '#f9fafb', border: sel ? 'none' : `1px solid ${INPUT_BORDER}`,
                            color: sel ? '#fff' : TEXT_SECONDARY, transition: 'all 0.2s',
                          }}>
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price + Currency */}
                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Price *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={pkgCurrencyId} onChange={e => setPkgCurrencyId(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 90, flex: '0 0 auto', appearance: 'auto' as const }}>
                        {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                      </select>
                      <input type="number" value={pkgPrice || ''} onChange={e => setPkgPrice(parseInt(e.target.value) || 0)} placeholder="Price" style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Duration (hours)</label>
                      <input type="number" value={pkgDuration || ''} onChange={e => setPkgDuration(parseInt(e.target.value) || 0)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Delivery (days)</label>
                      <input type="number" value={pkgDelivery || ''} onChange={e => setPkgDelivery(parseInt(e.target.value) || 0)} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Included Photos</label>
                      <input type="number" value={pkgPhotos || ''} onChange={e => setPkgPhotos(parseInt(e.target.value) || 0)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Included Videos</label>
                      <input type="number" value={pkgVideos || ''} onChange={e => setPkgVideos(parseInt(e.target.value) || 0)} style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: TEXT_SECONDARY, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</label>
                    <textarea value={pkgDescription} onChange={e => setPkgDescription(e.target.value)} placeholder={`${pkgTier} photography package`} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  </div>

                  {/* Features preview */}
                  <div style={{ background: '#f9fafb', border: `1px solid ${INPUT_BORDER}`, borderRadius: 10, padding: 12 }}>
                    <p style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>Included Features</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                      {(TIER_PRESETS[pkgTier]?.features || []).map((f, i) => (
                        <span key={i} style={{ color: '#10b981', fontSize: 12 }}>
                          <i className="bi bi-check" style={{ marginRight: 3 }}></i>{f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleCreatePackage} disabled={state.isSubmitting} style={{ ...btnPrimary, marginTop: 4, opacity: state.isSubmitting ? 0.6 : 1 }}>
                    {state.isSubmitting ? 'Creating Package...' : <><i className="bi bi-check-circle-fill"></i> Create Package & Submit Profile</>}
                  </button>
                </div>
              </div>

            /* ── SLIDE 6: Success ── */
            ) : state.currentSlide === 6 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <i className="bi bi-check-lg" style={{ fontSize: 32, color: '#fff' }}></i>
                </div>
                <h2 style={{ color: TEXT_PRIMARY, fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Profile Submitted!</h2>
                <p style={{ color: TEXT_SECONDARY, fontSize: 14, margin: '0 0 8px' }}>
                  Your {pkgTier} package at {currencyCode} {pkgPrice.toLocaleString()} has been created.
                </p>
                <p style={{ color: TEXT_MUTED, fontSize: 13, margin: '0 0 24px' }}>
                  Your profile is now under review. Once approved, clients will be able to find and book you.
                </p>
                <button onClick={onComplete} style={btnPrimary}>
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
