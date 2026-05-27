'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AmoriaKNavbar from '../../components/navbar';
import {
  getPhotographerById,
  type Photographer,
  getCities,
  type City,
  getReviewerName,
  getReviewText,
  getBookedDates,
  type BookedDate,
} from '@/lib/APIs/public';
import { useToast } from '@/lib/notifications/ToastProvider';
import dynamic from 'next/dynamic';

const BookingWizard = dynamic(() => import('../../components/BookingWizard'), { ssr: false });

const BRAND = '#083A85';
const BRAND_DARK = '#062a63';

// ----- Helpers (preserved from original) -----
const getProfileImage = (photographer: Photographer | null): string | null => {
  if (!photographer) return null;
  if (photographer.profilePicture && !photographer.profilePicture.includes('/null')) {
    return photographer.profilePicture;
  }
  return null;
};

const getCoverImage = (photographer: Photographer | null): string | null => {
  if (!photographer) return null;
  if (photographer.coverPicture && !photographer.coverPicture.includes('/null')) {
    return photographer.coverPicture;
  }
  return null;
};

/**
 * Same slide-in/slide-out cover carousel used on the photographer listing
 * cards (photographers.tsx::CoverCarousel) - re-implemented here so the
 * profile hero rotates the photographer's cover, profile photo, and
 * featured project images on the same 3s cadence. Each slide enters from
 * the right, holds, and exits to the left. Pure CSS transform transitions
 * via three position classes; no motion library.
 *
 * On the hero this sits as the lowest layer inside .vp-hero-cover, behind
 * the tint / dot-pattern / toolbar / identity strip (all of which have a
 * higher z-index), so the existing overlays keep working unchanged.
 */
const VP_COVER_SLIDE_INTERVAL_MS = 3000;

const HeroCoverCarousel: React.FC<{ images: string[]; alt: string }> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = images.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex(i => (i + 1) % total);
    }, VP_COVER_SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [total]);

  return (
    <div className="vp-hero-slider" aria-hidden="true">
      {images.map((src, i) => {
        let position: 'left' | 'active' | 'right';
        if (i === currentIndex) position = 'active';
        else if ((i + 1) % total === currentIndex) position = 'left';
        else position = 'right';
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={alt}
            loading="lazy"
            className={`vp-hero-slide vp-hero-slide--${position}`}
          />
        );
      })}
    </div>
  );
};

const formatJoinDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  } catch {
    return 'Recently joined';
  }
};

// =================================================================
// Main content component
// =================================================================
function ViewProfileContent({ photographerIdProp }: { photographerIdProp?: string }): React.JSX.Element {
  const t = useTranslations('viewProfile');
  const searchParams = useSearchParams();
  // Slug-based route passes the id as a prop; legacy ?id= URLs keep using
  // the search-params path.
  const photographerId = photographerIdProp || searchParams.get('id');
  const toast = useToast();

  // ----- State (preserved 1:1) -----
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'profile' | 'cover' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [bookedCalendarMonth, setBookedCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showWizard, setShowWizard] = useState(false);
  // New, redesign-only: contact "show" toggle for privacy
  const [contactRevealed, setContactRevealed] = useState<{ phone: boolean; email: boolean }>({
    phone: false,
    email: false,
  });

  // ----- Effects (preserved 1:1) -----
  useEffect(() => {
    const fetchPhotographer = async () => {
      if (!photographerId) {
        setFetchError('No photographer ID provided');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await getPhotographerById(photographerId);
        if (response.success && response.data) {
          const rawData = response.data as unknown as Record<string, unknown>;
          const photographerData = rawData?.data
            ? (rawData.data as Photographer)
            : (response.data as Photographer);
          setPhotographer(photographerData);
        } else {
          setFetchError(response.error || 'Photographer not found');
          toast.error(response.error || 'Photographer not found');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setFetchError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhotographer();
  }, [photographerId, toast]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await getCities();
        if (response.success && response.data) {
          const cityList = Array.isArray(response.data) ? response.data : [];
          setCities(cityList);
        }
      } catch {
        /* silent */
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (!photographerId) return;
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate())
      .toISOString()
      .split('T')[0];
    getBookedDates({ photographerId, from, to })
      .then((res) => {
        if (res.success && res.data) {
          setBookedDates(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {});
  }, [photographerId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageViewerOpen) closeImageViewer();
    };
    if (imageViewerOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageViewerOpen]);

  // ----- Handlers -----
  const handleBookNowClick = () => setShowWizard(true);

  const openImageViewer = (type: 'profile' | 'cover') => {
    // Cover viewer falls back to the first carousel frame when the
    // photographer has no dedicated cover photo (e.g. only a profile or
    // project image) - otherwise clicking the rotating hero would open
    // nothing.
    const img = type === 'profile'
      ? photographerData?.profileImage
      : (photographerData?.backgroundImage || photographerData?.coverCarouselImages?.[0]);
    if (!img) return;
    setCurrentImageType(type);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setCurrentImageType(null);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = photographerData?.name || 'Photographer profile';
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          url,
          title,
          text: `Check out ${title} on Connekyt`,
        });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not share. Try copying the URL manually.');
    }
  };

  // ----- Photographer display data (preserved 1:1) -----
  const photographerData = {
    name: photographer
      ? (photographer.preferredUsername
          || `${photographer.firstName ?? ''} ${photographer.lastName ?? ''}`.trim())
      : '',
    location: (() => {
      if (!photographer) return '';
      if (photographer.address && cities.length > 0) {
        const matchedCity = cities.find((c) =>
          photographer.address?.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchedCity) {
          return matchedCity.country
            ? `${matchedCity.name}, ${matchedCity.country}`
            : matchedCity.name;
        }
      }
      return photographer.address || '';
    })(),
    eventsCompleted: photographer?.completedEvents ?? photographer?.projects?.length ?? 0,
    // Backend red-day model: 'booked' when today is at capacity or the
    // photographer hard-blocked it, else 'available'.
    currentStatus: photographer?.currentStatus === 'booked' ? 'booked' : 'available',
    nextAvailableDate: photographer?.nextAvailableDate ?? null,
    rating: photographer?.rating || 0,
    profileImage: getProfileImage(photographer),
    backgroundImage: getCoverImage(photographer),
    // Cover-hero carousel frames: cover photo first, then profile photo,
    // then featured project images. Same composition + de-dupe + null-
    // scrub the listing card uses, so the hero and the card rotate the
    // exact same set for a given photographer.
    coverCarouselImages: Array.from(new Set(
      [
        photographer?.coverPicture,
        photographer?.profilePicture,
        ...((photographer?.projects ?? []).map(p => p.projectImage || p.images?.[0])),
      ].filter((u): u is string => typeof u === 'string' && !!u && !u.includes('/null'))
    )),
    specialties: (photographer?.specialties || []).map((s: string | { id: string; name: string }) =>
      typeof s === 'string' ? s : s.name
    ),
    portfolio: {
      // Education and Certifications now live under one section. The backend
      // already returns both types via educationLevels (Education + Certification);
      // we still merge any standalone certifications field as a defensive belt.
      education: [
        ...(photographer?.educationLevels?.map((edu, index) => ({
          id: `edu-${index + 1}`,
          degree: edu.degree || edu.title || edu.name || 'Untitled',
          institution: edu.institution || edu.issuer || '',
          year: (() => {
            if (edu.startYear) return `${edu.startYear}${edu.endYear ? ` - ${edu.endYear}` : ''}`;
            if (edu.startDate) return `${edu.startDate}${edu.endDate ? ` - ${edu.endDate}` : ''}`;
            if (edu.year) return edu.year;
            if (edu.yearObtained) return edu.yearObtained;
            return '';
          })(),
          description: edu.description || edu.fieldOfStudy || (edu.institution ? `Studied at ${edu.institution}` : ''),
        })) || []),
        ...((photographer?.certifications || [])
          .filter((c) => !photographer?.educationLevels?.some((e) => e.id === c.id))
          .map((cert, index) => ({
            id: `cert-${index + 1}`,
            degree: cert.title || cert.name || 'Certification',
            institution: cert.issuer || cert.institution || cert.issuingOrganization || '',
            year: cert.year || cert.yearObtained || '',
            description: cert.description || '',
          }))),
      ],
      projects:
        photographer?.projects?.map((project, index) => ({
          id: index + 1,
          image: project.projectImage || project.images?.[0] || '',
          title: project.title,
          description: project.description,
          year: project.year?.toString() || project.category || '',
        })) || [],
    },
    reviews:
      photographer?.reviews?.map((review, index) => ({
        id: index + 1,
        name: getReviewerName(review.reviewer),
        avatar: review.reviewer?.profilePicture || null,
        rating: review.rating,
        date: review.createdAt || '',
        comment: getReviewText(review),
        customerType: review.reviewer?.customerType || '',
        images: review.images || [],
      })) || [],
    experience:
      photographer?.workExperiences && photographer.workExperiences.length > 0
        ? photographer.workExperiences.map((exp, index) => ({
            id: index + 1,
            position: exp.position,
            company: exp.company,
            location: exp.location,
            startDate: exp.startDate ? formatJoinDate(exp.startDate) : '',
            endDate: exp.endDate ? formatJoinDate(exp.endDate) : 'Present',
            description: exp.description,
          }))
        : photographer
        ? [
            {
              id: 1,
              position: photographer.customerType || 'Photographer',
              company: 'Self-employed',
              location: photographer.address || '',
              startDate: photographer.joinedFrom ? formatJoinDate(photographer.joinedFrom) : '',
              endDate: 'Present',
              description: '',
            },
          ]
        : [],
    joinedFrom: photographer?.joinedFrom ? formatJoinDate(photographer.joinedFrom) : '',
    customerType: photographer?.customerType || '',
    phone: photographer?.phone || '',
    email: photographer?.email || '',
    packages: photographer?.packages || [],
  };

  // Cheapest active package (used by sidebar pricing card + mobile bottom CTA)
  const cheapestPackage = useMemo(() => {
    const active = (photographer?.packages ?? []).filter((p) => p.isActive);
    if (active.length === 0) return null;
    return active.reduce((min, p) => (p.price < min.price ? p : min), active[0]);
  }, [photographer]);

  // Rating distribution for the reviews summary
  const ratingBreakdown = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // index 0 = 5★, 4 = 1★
    photographerData.reviews.forEach((r) => {
      const star = Math.round(r.rating);
      const idx = Math.min(4, Math.max(0, 5 - star));
      buckets[idx]++;
    });
    return buckets;
  }, [photographerData.reviews]);

  const renderStars = (rating: number, size = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={i <= rating ? 'bi bi-star-fill' : 'bi bi-star'}
          style={{ color: '#f59e0b', fontSize: size }}
        />
      );
    }
    return stars;
  };

  const maskPhone = (p: string) => {
    if (!p) return '';
    return p.length > 4 ? `${p.slice(0, 3)}····${p.slice(-2)}` : '····';
  };
  const maskEmail = (e: string) => {
    if (!e) return '';
    const [user, domain] = e.split('@');
    if (!user || !domain) return '····';
    const u = user.length > 2 ? `${user.slice(0, 2)}····` : '····';
    return `${u}@${domain}`;
  };

  // ----- Loading state - branded skeleton -----
  if (isLoading) {
    return (
      <>
        <AmoriaKNavbar />
        <ProfileSkeleton loadingLabel={t('loadingProfile')} />
      </>
    );
  }

  // ----- Error / not-found state -----
  if (fetchError || !photographer) {
    return (
      <>
        <AmoriaKNavbar />
        <ProfileError message={fetchError || 'Photographer not found'} />
      </>
    );
  }

  // ----- Main render -----
  return (
    <>
      <AmoriaKNavbar />
      <main className="vp-root">
        {/* ===========  HERO  =========== */}
        <section
          className={`vp-hero${photographerData.coverCarouselImages.length > 0 ? '' : ' vp-hero--no-cover'}`}
          aria-labelledby="vp-name"
        >
          <div
            className="vp-hero-cover"
            role={photographerData.coverCarouselImages.length > 0 ? 'button' : undefined}
            tabIndex={photographerData.coverCarouselImages.length > 0 ? 0 : -1}
            aria-label={photographerData.coverCarouselImages.length > 0 ? 'View cover image' : 'No cover image'}
            onClick={() => openImageViewer('cover')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openImageViewer('cover');
              }
            }}
          >
            {/* Slide-in/out carousel - lowest layer, behind tint/pattern/content */}
            {photographerData.coverCarouselImages.length > 0 && (
              <HeroCoverCarousel
                images={photographerData.coverCarouselImages}
                alt={`${photographerData.name}'s photos`}
              />
            )}

            {/* Brand-blue overlay + dot pattern for readability + brand identity */}
            <div className="vp-hero-cover-tint" aria-hidden="true" />
            <div className="vp-hero-cover-pattern" aria-hidden="true" />

            {/* Empty-state placeholder - shown only when the photographer has
                no usable image at all (no cover, profile, or project images) */}
            {photographerData.coverCarouselImages.length === 0 && (
              <div className="vp-hero-cover-empty" aria-hidden="true">
                <i className="bi bi-image" />
              </div>
            )}

            {/* Top toolbar */}
            <div className="vp-hero-toolbar">
              <button
                type="button"
                className="vp-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof window !== 'undefined') window.history.back();
                }}
                aria-label="Go back"
              >
                <i className="bi bi-arrow-left" />
              </button>
              <div className="vp-hero-toolbar-right">
                <button
                  type="button"
                  className="vp-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  aria-label="Share profile"
                >
                  <i className="bi bi-share" />
                </button>
                <button type="button" className="vp-icon-btn" aria-label="Save photographer">
                  <i className="bi bi-bookmark" />
                </button>
              </div>
            </div>
          </div>

          {/* Identity strip - straddles cover bottom (frosted-glass band) */}
          <div className="vp-hero-content">
            <div className="vp-hero-content-inner">
            <div
              className="vp-avatar"
              role="button"
              tabIndex={photographerData.profileImage ? 0 : -1}
              onClick={() => openImageViewer('profile')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openImageViewer('profile');
                }
              }}
              aria-label={photographerData.profileImage ? 'View profile photo' : 'No profile photo'}
            >
              {photographerData.profileImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={photographerData.profileImage} alt={photographerData.name} loading="lazy" />
              ) : (
                <div className="vp-avatar-empty" aria-hidden="true">
                  <i className="bi bi-person-fill" />
                </div>
              )}
              <div className="vp-avatar-verif" title="Verified photographer" aria-label="Verified">
                <i className="bi bi-patch-check-fill" aria-hidden="true" />
              </div>
            </div>

            <div className="vp-hero-text">
              <h1 id="vp-name" className="vp-name">
                {photographerData.name}
              </h1>
              <p className="vp-headline">
                {photographerData.customerType && (
                  <span className="vp-headline-role">{photographerData.customerType}</span>
                )}
                {photographerData.customerType && photographerData.location && (
                  <span className="vp-sep" aria-hidden="true">
                    ·
                  </span>
                )}
                {photographerData.location && (
                  <span className="vp-headline-loc">
                    <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                    {photographerData.location}
                  </span>
                )}
              </p>
              <div className="vp-stats">
                {photographerData.rating > 0 && (
                  <span className="vp-stat">
                    <i className="bi bi-star-fill" aria-hidden="true" style={{ color: '#f59e0b' }} />
                    <strong>{photographerData.rating.toFixed(1)}</strong>
                    <span className="vp-stat-mute">
                      ({photographerData.reviews.length}
                      {photographerData.reviews.length === 1 ? ' review' : ' reviews'})
                    </span>
                  </span>
                )}
                <span className="vp-stat">
                  <i className="bi bi-camera-reels-fill" aria-hidden="true" />
                  <strong>{photographerData.eventsCompleted}</strong>
                  <span className="vp-stat-mute">{t('events')}</span>
                </span>
                {photographerData.joinedFrom && (
                  <span className="vp-stat">
                    <i className="bi bi-calendar-event" aria-hidden="true" />
                    <span className="vp-stat-mute">Since {photographerData.joinedFrom}</span>
                  </span>
                )}
                {photographerData.currentStatus === 'booked' ? (
                  <span className="vp-stat vp-stat--booked" title={photographerData.nextAvailableDate ? `Next free: ${photographerData.nextAvailableDate}` : 'Booked today'}>
                    <span className="vp-status-dot" aria-hidden="true" />
                    Booked
                  </span>
                ) : (
                  <span className="vp-stat vp-stat--avail">
                    <span className="vp-status-dot" aria-hidden="true" />
                    Available
                  </span>
                )}
              </div>
            </div>

            </div>
          </div>
        </section>

        {/* ===========  STICKY TAB BAR  =========== */}
        <nav className="vp-tabs" aria-label="Profile sections">
          {(
            [
              { key: 'overview', icon: 'bi-grid-fill', label: t('tabs.overview') },
              { key: 'portfolio', icon: 'bi-images', label: t('tabs.portfolio') },
              { key: 'reviews', icon: 'bi-chat-square-quote-fill', label: t('tabs.reviews') },
              {
                key: 'working-experience',
                icon: 'bi-briefcase-fill',
                label: t('tabs.workingExperience'),
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`vp-tab ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              <i className={`bi ${tab.icon}`} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ===========  GRID: main + sticky sidebar  =========== */}
        <div className="vp-grid">
          {/* ---- main content ---- */}
          <div className="vp-main">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' &&
              (!photographerData.specialties.length ? (
                <div className="vp-empty">
                  <span className="vp-empty-icon" aria-hidden="true">
                    <i className="bi bi-person-vcard" />
                  </span>
                  <h3>No profile details yet</h3>
                  <p>
                    {photographerData.name} hasn&apos;t shared their specialties yet.
                    Check back soon.
                  </p>
                </div>
              ) : (
                <section className="vp-section">
                  <h2 className="vp-section-title">
                    <i className="bi bi-stars" aria-hidden="true" />
                    {t('overview.specialties')}
                  </h2>
                  <div className="vp-chips">
                    {photographerData.specialties.map((s, i) => (
                      <span className="vp-chip" key={i}>
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              ))}

            {/* PORTFOLIO TAB */}
            {activeTab === 'portfolio' &&
              (!photographerData.portfolio.projects.length &&
              !photographerData.portfolio.education.length ? (
                <div className="vp-empty">
                  <span className="vp-empty-icon" aria-hidden="true">
                    <i className="bi bi-images" />
                  </span>
                  <h3>No portfolio yet</h3>
                  <p>
                    {photographerData.name} hasn&apos;t published projects or
                    credentials yet. Their work history will appear here once
                    added.
                  </p>
                </div>
              ) : (
              <>
                {photographerData.portfolio.projects.length > 0 && (
                  <section className="vp-section">
                    <h2 className="vp-section-title">
                      <i className="bi bi-images" aria-hidden="true" />
                      Featured projects
                    </h2>
                    <div className="vp-projects">
                      {photographerData.portfolio.projects.map((p) => (
                        <article className="vp-project" key={p.id}>
                          {p.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={p.image} alt={p.title} loading="lazy" />
                          ) : (
                            <div className="vp-project-empty" aria-hidden="true">
                              <i className="bi bi-image" />
                            </div>
                          )}
                          <div className="vp-project-overlay">
                            <h3 className="vp-project-title">{p.title}</h3>
                            {p.year && <span className="vp-project-year">{p.year}</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {photographerData.portfolio.education.length > 0 && (
                  <section className="vp-section">
                    <h2 className="vp-section-title">
                      <i className="bi bi-mortarboard-fill" aria-hidden="true" />
                      Education &amp; Certifications
                    </h2>
                    <div className="vp-timeline">
                      {photographerData.portfolio.education.map((e) => (
                        <div className="vp-timeline-item" key={e.id}>
                          <span className="vp-timeline-dot" aria-hidden="true" />
                          <div className="vp-timeline-content">
                            <div className="vp-timeline-head">
                              <h3 className="vp-timeline-title">{e.degree}</h3>
                              {e.year && <span className="vp-timeline-meta">{e.year}</span>}
                            </div>
                            <p className="vp-timeline-sub">{e.institution}</p>
                            {e.description && (
                              <p className="vp-timeline-desc">{e.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
              ))}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <>
                {photographerData.reviews.length > 0 ? (
                  <>
                    <section className="vp-section vp-rating-summary">
                      <div className="vp-rating-big">
                        <span className="vp-rating-num">
                          {photographerData.rating.toFixed(1)}
                        </span>
                        <div className="vp-rating-stars" aria-hidden="true">
                          {renderStars(Math.round(photographerData.rating), 18)}
                        </div>
                        <span className="vp-rating-count">
                          {photographerData.reviews.length}{' '}
                          {photographerData.reviews.length === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                      <div className="vp-rating-bars">
                        {[5, 4, 3, 2, 1].map((star, i) => {
                          const count = ratingBreakdown[i];
                          const total = photographerData.reviews.length;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div className="vp-rating-row" key={star}>
                              <span className="vp-rating-row-label">
                                {star}
                                <i className="bi bi-star-fill" aria-hidden="true" />
                              </span>
                              <div className="vp-rating-bar" aria-hidden="true">
                                <div className="vp-rating-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="vp-rating-row-count">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="vp-section">
                      <h2 className="vp-section-title">
                        <i className="bi bi-chat-square-quote-fill" aria-hidden="true" />
                        All reviews
                      </h2>
                      <div className="vp-reviews">
                        {photographerData.reviews.map((r) => (
                          <article className="vp-review" key={r.id}>
                            <div className="vp-review-head">
                              <div className="vp-review-avatar">
                                {r.avatar ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={r.avatar} alt="" loading="lazy" />
                                ) : (
                                  <i className="bi bi-person-circle" aria-hidden="true" />
                                )}
                              </div>
                              <div className="vp-review-meta">
                                <h3 className="vp-review-name">{r.name}</h3>
                                {r.customerType && (
                                  <span className="vp-review-type">{r.customerType}</span>
                                )}
                              </div>
                              <div className="vp-review-rating" aria-label={`Rated ${r.rating} out of 5`}>
                                {renderStars(Math.round(r.rating), 14)}
                              </div>
                            </div>
                            {r.date && (
                              <span className="vp-review-date">{formatJoinDate(r.date)}</span>
                            )}
                            <p className="vp-review-comment">{r.comment}</p>
                            {r.images && r.images.length > 0 && (
                              <div className="vp-review-imgs">
                                {r.images.map((img, idx) => (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img key={idx} src={img} alt="" loading="lazy" />
                                ))}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="vp-empty">
                    <span className="vp-empty-icon" aria-hidden="true">
                      <i className="bi bi-chat-square-text" />
                    </span>
                    <h3>No reviews yet</h3>
                    <p>Be the first to work with {photographerData.name} and leave a review.</p>
                  </div>
                )}
              </>
            )}

            {/* WORKING EXPERIENCE TAB */}
            {activeTab === 'working-experience' &&
              (photographerData.experience.length === 0 ? (
                <div className="vp-empty">
                  <span className="vp-empty-icon" aria-hidden="true">
                    <i className="bi bi-briefcase" />
                  </span>
                  <h3>No work history yet</h3>
                  <p>
                    {photographerData.name} hasn&apos;t shared their professional
                    experience yet. Their journey will appear here once added.
                  </p>
                </div>
              ) : (
                <section className="vp-section">
                  <h2 className="vp-section-title">
                    <i className="bi bi-briefcase-fill" aria-hidden="true" />
                    {t('workingExperience.title')}
                  </h2>
                  <div className="vp-timeline">
                    {photographerData.experience.map((exp) => (
                      <div className="vp-timeline-item" key={exp.id}>
                        <span className="vp-timeline-dot" aria-hidden="true" />
                        <div className="vp-timeline-content">
                          <div className="vp-timeline-head">
                            <h3 className="vp-timeline-title">{exp.position}</h3>
                            <span className="vp-timeline-meta">
                              {exp.startDate}
                              {exp.endDate ? `. ${exp.endDate}` : ''}
                            </span>
                          </div>
                          <p className="vp-timeline-sub">
                            {exp.company}
                            {exp.location ? ` · ${exp.location}` : ''}
                          </p>
                          {exp.description && (
                            <p className="vp-timeline-desc">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
          </div>

          {/* ---- sticky sidebar ----
              Money intentionally NOT shown on the view-profile surface.
              Per product policy buyers only see prices at the step of
              selecting a package inside the booking wizard. The card
              just confirms the photographer offers bookable packages
              and exposes the Book Now CTA. */}
          <aside className="vp-sidebar" aria-label="Booking and contact">
            <div className="vp-side-card">
              <span className="vp-side-eyebrow">{cheapestPackage ? 'Available to book' : 'Bookings on request'}</span>
              <button
                type="button"
                className="vp-cta vp-cta--primary vp-cta--block"
                onClick={handleBookNowClick}
              >
                <i className="bi bi-calendar-check" aria-hidden="true" /> {t('bookNow')}
              </button>
              <p className="vp-side-note">
                <i className="bi bi-shield-check" aria-hidden="true" /> No payment to inquire
              </p>
            </div>

            <div className="vp-side-card">
              <div className="vp-side-cal-head">
                <span className="vp-side-eyebrow">{t('overview.availability')}</span>
                <div className="vp-side-cal-nav">
                  <button
                    type="button"
                    className="vp-icon-btn vp-icon-btn--small"
                    aria-label="Previous month"
                    onClick={() =>
                      setBookedCalendarMonth(({ year, month }) =>
                        month === 0
                          ? { year: year - 1, month: 11 }
                          : { year, month: month - 1 }
                      )
                    }
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  <span className="vp-side-cal-month">
                    {new Date(bookedCalendarMonth.year, bookedCalendarMonth.month).toLocaleDateString(
                      'en-US',
                      { month: 'long', year: 'numeric' }
                    )}
                  </span>
                  <button
                    type="button"
                    className="vp-icon-btn vp-icon-btn--small"
                    aria-label="Next month"
                    onClick={() =>
                      setBookedCalendarMonth(({ year, month }) =>
                        month === 11
                          ? { year: year + 1, month: 0 }
                          : { year, month: month + 1 }
                      )
                    }
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>
              <MiniCalendar
                year={bookedCalendarMonth.year}
                month={bookedCalendarMonth.month}
                bookedDates={bookedDates}
              />
              <div className="vp-side-cal-legend">
                <span>
                  <span className="vp-cal-dot vp-cal-dot--free" /> Free
                </span>
                <span>
                  <span className="vp-cal-dot vp-cal-dot--booked" /> Booked
                </span>
              </div>
            </div>

            <div className="vp-side-card">
              <span className="vp-side-eyebrow">Trust signals</span>
              <ul className="vp-trust">
                <li>
                  <i className="bi bi-patch-check-fill" aria-hidden="true" /> Verified photographer
                </li>
                <li>
                  <i className="bi bi-shield-lock-fill" aria-hidden="true" /> Secure on-platform payments
                </li>
                {Array.isArray((photographerData as { spokenLanguages?: string[] }).spokenLanguages)
                  && ((photographerData as { spokenLanguages?: string[] }).spokenLanguages?.length ?? 0) > 0 && (
                  <li>
                    <i className="bi bi-translate" aria-hidden="true" />{' '}
                    Speaks {((photographerData as { spokenLanguages?: string[] }).spokenLanguages || []).join(' · ')}
                  </li>
                )}
              </ul>
            </div>

            {(photographerData.phone || photographerData.email) && (
              <div className="vp-side-card">
                <span className="vp-side-eyebrow">Contact</span>
                <ul className="vp-contact">
                  {photographerData.phone && (
                    <li>
                      <i className="bi bi-telephone-fill" aria-hidden="true" />
                      {contactRevealed.phone ? (
                        <a href={`tel:${photographerData.phone}`} className="vp-contact-value">
                          {photographerData.phone}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="vp-link-btn"
                          onClick={() => setContactRevealed((s) => ({ ...s, phone: true }))}
                        >
                          <span>{maskPhone(photographerData.phone)}</span>
                          <span className="vp-link-btn-cta">Show</span>
                        </button>
                      )}
                    </li>
                  )}
                  {photographerData.email && (
                    <li>
                      <i className="bi bi-envelope-fill" aria-hidden="true" />
                      {contactRevealed.email ? (
                        <a
                          href={`mailto:${photographerData.email}`}
                          className="vp-contact-value vp-contact-value--break"
                        >
                          {photographerData.email}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="vp-link-btn"
                          onClick={() => setContactRevealed((s) => ({ ...s, email: true }))}
                        >
                          <span>{maskEmail(photographerData.email)}</span>
                          <span className="vp-link-btn-cta">Show</span>
                        </button>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* Mobile floating bottom CTA - no money displayed; price lives
            on the package-selection step inside the booking wizard. */}
        {isMobile && (
          <div className="vp-mobile-cta" role="region" aria-label="Quick booking action">
            <div className="vp-mobile-cta-price">
              <span className="vp-mobile-cta-onreq">
                {cheapestPackage ? 'Available to book' : 'On request'}
              </span>
            </div>
            <button
              type="button"
              className="vp-cta vp-cta--primary"
              onClick={handleBookNowClick}
            >
              <i className="bi bi-calendar-check" aria-hidden="true" /> {t('bookNow')}
            </button>
          </div>
        )}
      </main>

      {/* IMAGE VIEWER MODAL */}
      {imageViewerOpen && (
        <div
          className="vp-img-modal image-viewer-modal"
          onClick={closeImageViewer}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            className="vp-img-modal-close"
            onClick={closeImageViewer}
            aria-label="Close image viewer"
          >
            <i className="bi bi-x-lg" />
          </button>
          {currentImageType === 'profile' && photographerData.profileImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photographerData.profileImage}
              alt={`${photographerData.name} profile`}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {currentImageType === 'cover' && (photographerData.backgroundImage || photographerData.coverCarouselImages[0]) && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photographerData.backgroundImage || photographerData.coverCarouselImages[0]}
              alt="Cover"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      <BookingWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        preselectedPhotographerId={photographerId || undefined}
      />

      <style>{`
        /* ============================================================
           VIEW-PROFILE - scoped styles
           Brand: ${BRAND} / ${BRAND_DARK}
           ============================================================ */
        .vp-root {
          font-family: 'Pragati Narrow', system-ui, sans-serif;
          background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);
          min-height: 100vh;
          padding-bottom: 4rem;
        }

        /* ===== HERO =====
           Cover image is on the parent (.vp-hero) so it extends through both
           the visible cover area and behind the identity strip below.
           The strip uses backdrop-filter + a translucent blue gradient so the
           cover bleeds through with a frosted-glass effect. */
        .vp-hero {
          position: relative;
          /* Neutral dark fallback so when a cover image is missing or loading
             we don't flash brand-blue - keeps the cover area photo-faithful. */
          background-color: #1f2937;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        /* Empty-state hero - matches the photographer card empty state */
        .vp-hero.vp-hero--no-cover {
          background-color: transparent;
          background-image: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
        }
        .vp-hero-cover {
          position: relative;
          width: 100%;
          height: 480px;
          cursor: pointer;
          overflow: hidden;
        }
        .vp-hero--no-cover .vp-hero-cover { cursor: default; }
        /* Cover carousel - lowest layer inside the hero. Tint (no z-index),
           pattern, toolbar (z-index 3) and content (z-index 2) all paint on
           top, so the existing readability overlays keep working untouched. */
        .vp-hero-slider {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }
        .vp-hero-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          will-change: transform;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vp-hero-slide--active { transform: translateX(0); }
        .vp-hero-slide--left   { transform: translateX(-100%); }
        .vp-hero-slide--right  { transform: translateX(100%); }
        @media (prefers-reduced-motion: reduce) {
          .vp-hero-slide { transition: opacity 0.3s ease; transform: none !important; opacity: 0; }
          .vp-hero-slide--active { opacity: 1; }
        }
        /* No tint over a real cover image - let the photo show in its own
           colors. The bottom .vp-hero-content black gradient handles text
           contrast for the identity strip. */
        .vp-hero-cover-tint {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.10) 100%);
          pointer-events: none;
        }
        /* No cover image - drop the tint so the gray placeholder shows clean */
        .vp-hero--no-cover .vp-hero-cover-tint { display: none; }
        .vp-hero-cover-pattern {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.2px, transparent 1.2px);
          background-size: 22px 22px;
          opacity: 0.45;
          pointer-events: none;
        }
        .vp-hero--no-cover .vp-hero-cover-pattern {
          background-image: radial-gradient(rgba(255,255,255,0.30) 1.2px, transparent 1.2px);
          opacity: 0.6;
        }
        /* Centered "no image" placeholder (mirrors .ph-card-cover-empty on the listing page) */
        .vp-hero-cover-empty {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.75);
          font-size: 4rem;
          pointer-events: none;
          z-index: 1;
        }
        .vp-hero-toolbar {
          position: absolute;
          top: 16px; left: 16px; right: 16px;
          display: flex; justify-content: space-between; align-items: center;
          z-index: 3;
        }
        .vp-hero-toolbar-right { display: flex; gap: 8px; }
        .vp-icon-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.95);
          color: ${BRAND};
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.95rem;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.18s, background 0.18s;
        }
        .vp-icon-btn:hover { transform: scale(1.06); background: #fff; }
        .vp-icon-btn--small {
          width: 30px; height: 30px;
          background: #fff;
          color: ${BRAND};
          border: 1px solid #e2e8f0;
          box-shadow: none;
          font-size: 0.78rem;
        }
        .vp-icon-btn--small:hover { background: rgba(8,58,133,0.06); }

        .vp-hero-content {
          position: relative;
          margin-top: -80px;
          padding: 0;
          z-index: 2;
          /* Smooth black gradient - fades from clear at top (cover image
             still readable) to dark at bottom. backdrop-filter blurs whatever
             sits behind so the cover image becomes a soft impression. */
          background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.00) 0%,
            rgba(0, 0, 0, 0.45) 35%,
            rgba(0, 0, 0, 0.72) 100%);
          backdrop-filter: blur(10px) saturate(1.0);
          -webkit-backdrop-filter: blur(10px) saturate(1.0);
        }
        .vp-hero-content-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 clamp(1rem, 2vw, 2rem) 1.5rem;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1.25rem;
          align-items: end;
        }
        .vp-avatar {
          position: relative;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: #cbd5e1;
          flex: none;
          cursor: pointer;
          transition: transform 0.18s;
        }
        .vp-avatar:hover { transform: scale(1.02); }
        .vp-avatar img,
        .vp-avatar-empty {
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 4px solid #fff;
          object-fit: cover;
          box-shadow: 0 18px 40px -16px rgba(0,0,0,0.35);
          display: block;
        }
        .vp-avatar-empty {
          background: linear-gradient(135deg, #cbd5e1, #94a3b8);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 4rem;
        }
        .vp-avatar-verif {
          position: absolute;
          bottom: 6px;
          right: 10px;
          width: 36px; height: 36px;
          background: #fff;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          line-height: 0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          z-index: 2;
        }
        .vp-avatar-verif i {
          color: #3b82f6;
          font-size: 1.5rem;
          display: block;
          line-height: 1;
        }

        .vp-hero-text {
          color: #fff;
          padding-bottom: 12px;
          min-width: 0;
        }
        .vp-name {
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 8px;
          color: #fff;
          text-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .vp-headline {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.92);
          margin: 0 0 12px;
        }
        .vp-headline-role { font-weight: 600; }
        .vp-headline-loc { display: inline-flex; align-items: center; gap: 5px; }
        .vp-headline-loc i { font-size: 0.85rem; }
        .vp-sep { color: rgba(255,255,255,0.5); }
        .vp-stats {
          display: flex; flex-wrap: wrap; gap: 14px;
          font-size: 0.86rem;
          color: rgba(255,255,255,0.92);
        }
        .vp-stat {
          display: inline-flex; align-items: center; gap: 6px;
        }
        .vp-stat strong { font-weight: 800; color: #fff; }
        .vp-stat-mute { color: rgba(255,255,255,0.78); }
        .vp-stat--avail {
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(16,185,129,0.20);
          color: #d1fae5;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-size: 0.7rem;
          border: 1px solid rgba(16,185,129,0.4);
        }
        .vp-stat--booked {
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(239,68,68,0.20);
          color: #fecaca;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-size: 0.7rem;
          border: 1px solid rgba(239,68,68,0.45);
        }
        .vp-status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #10b981;
          animation: vp-pulse 2s ease-out infinite;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.6);
        }
        .vp-stat--booked .vp-status-dot {
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239,68,68,0.6);
        }
        @keyframes vp-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        /* ===== CTAs ===== */
        .vp-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0.7rem 1.4rem;
          border-radius: 12px;
          border: none;
          font-size: 0.92rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .vp-cta--primary {
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff;
          box-shadow: 0 10px 24px -10px rgba(8,58,133,0.7);
        }
        .vp-cta--primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px -10px rgba(8,58,133,0.85);
        }
        .vp-cta--ghost {
          background: #fff;
          color: ${BRAND};
          border: 1.5px solid #e2e8f0;
        }
        .vp-cta--ghost:hover { border-color: ${BRAND}; }
        .vp-cta--block { width: 100%; justify-content: center; }

        /* ===== TAB BAR ===== */
        .vp-tabs {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          gap: 6px;
          padding: 0.85rem clamp(1rem, 2vw, 2rem);
          max-width: 1280px;
          margin: 1.5rem auto 0;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(8,58,133,0.08);
          border-radius: 16px;
          overflow-x: auto;
          scrollbar-width: none;
          box-shadow: 0 4px 16px rgba(8,58,133,0.06);
        }
        .vp-tabs::-webkit-scrollbar { display: none; }
        .vp-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.55rem 1rem;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 0.86rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.18s, color 0.18s, transform 0.18s;
        }
        .vp-tab i { font-size: 0.85rem; }
        .vp-tab:hover {
          background: rgba(8,58,133,0.06);
          color: ${BRAND};
        }
        .vp-tab.is-active {
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff;
          box-shadow: 0 6px 14px -6px rgba(8,58,133,0.55);
        }

        /* ===== GRID LAYOUT ===== */
        .vp-grid {
          max-width: 1280px;
          margin: 1.25rem auto 0;
          padding: 0 clamp(1rem, 2vw, 2rem);
          display: grid;
          grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
          gap: 2rem;
          align-items: start;
        }
        .vp-main {
          display: flex; flex-direction: column; gap: 1.25rem;
          min-width: 0;
        }
        .vp-sidebar {
          position: sticky;
          top: 96px; /* below the sticky tab bar */
          display: flex; flex-direction: column; gap: 1rem;
          align-self: start;
        }

        /* ===== SECTION ===== */
        .vp-section {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.5rem clamp(1rem, 2vw, 1.75rem);
          box-shadow: 0 1px 4px rgba(8,58,133,0.04);
        }
        .vp-section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 1rem;
        }
        .vp-section-title i { color: ${BRAND}; font-size: 1rem; }
        .vp-prose {
          color: #475569;
          line-height: 1.65;
          font-size: 0.95rem;
          margin: 0;
          white-space: pre-wrap;
        }

        /* ===== CHIPS ===== */
        .vp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .vp-chip {
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(8,58,133,0.06);
          color: ${BRAND};
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(8,58,133,0.12);
        }

        /* ===== EQUIPMENT ===== */
        .vp-equip-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px;
        }
        .vp-equip-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: border-color 0.18s, transform 0.18s;
        }
        .vp-equip-card:hover { border-color: ${BRAND}; transform: translateY(-1px); }
        .vp-equip-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(8,58,133,0.08);
          color: ${BRAND};
          display: inline-flex; align-items: center; justify-content: center;
          flex: none;
        }
        .vp-equip-name { font-size: 0.86rem; color: #0f172a; font-weight: 600; }

        /* ===== QUOTE ===== */
        .vp-section--quote {
          position: relative;
          background: linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%);
          color: #fff;
          border: none;
          padding: 2rem;
        }
        .vp-quote-mark {
          font-size: 4rem;
          line-height: 1;
          color: rgba(255,255,255,0.15);
          position: absolute;
          top: 1rem; left: 1.25rem;
        }
        .vp-quote-text {
          margin: 0;
          padding: 0 0 0 3.5rem;
          font-size: 1.1rem;
          line-height: 1.6;
          font-style: italic;
          font-weight: 500;
          color: rgba(255,255,255,0.95);
        }

        /* ===== SKILLS ===== */
        .vp-skills { display: flex; flex-direction: column; gap: 14px; }
        .vp-skill { display: flex; flex-direction: column; gap: 6px; }
        .vp-skill-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.88rem;
        }
        .vp-skill-name { color: #0f172a; font-weight: 600; }
        .vp-skill-pct { color: ${BRAND}; font-weight: 700; }
        .vp-skill-bar {
          width: 100%; height: 8px;
          background: rgba(8,58,133,0.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .vp-skill-fill {
          height: 100%;
          background: linear-gradient(90deg, ${BRAND}, ${BRAND_DARK});
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.22,1,0.36,1);
        }

        /* ===== PROJECTS ===== */
        .vp-projects {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .vp-project {
          position: relative;
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
          background: #cbd5e1;
          cursor: pointer;
          border: 1px solid #e5e7eb;
        }
        .vp-project img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
          display: block;
        }
        .vp-project:hover img { transform: scale(1.06); }
        .vp-project-empty {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); font-size: 2rem;
        }
        .vp-project-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 60%);
          padding: 0.75rem 0.85rem;
          color: #fff;
          display: flex; flex-direction: column; justify-content: flex-end;
          gap: 4px;
        }
        .vp-project-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
        }
        .vp-project-year {
          font-size: 0.7rem;
          opacity: 0.85;
          letter-spacing: 0.02em;
        }

        /* ===== TIMELINE ===== */
        .vp-timeline {
          position: relative;
          display: flex; flex-direction: column; gap: 1.25rem;
          padding-left: 22px;
        }
        .vp-timeline::before {
          content: '';
          position: absolute;
          left: 6px; top: 6px; bottom: 6px;
          width: 2px;
          background: linear-gradient(${BRAND}, rgba(8,58,133,0.15));
        }
        .vp-timeline-item { position: relative; }
        .vp-timeline-dot {
          position: absolute;
          left: -22px; top: 6px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: ${BRAND};
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px ${BRAND};
        }
        .vp-timeline-content {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.85rem 1rem;
        }
        .vp-timeline-head {
          display: flex; justify-content: space-between; align-items: baseline;
          gap: 8px; flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .vp-timeline-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }
        .vp-timeline-meta {
          font-size: 0.76rem;
          color: ${BRAND};
          font-weight: 700;
          padding: 2px 8px;
          background: rgba(8,58,133,0.08);
          border-radius: 999px;
          white-space: nowrap;
        }
        .vp-timeline-sub {
          font-size: 0.84rem;
          color: #475569;
          font-weight: 600;
          margin: 0 0 6px;
        }
        .vp-timeline-desc {
          font-size: 0.86rem;
          color: #64748b;
          line-height: 1.55;
          margin: 0;
        }

        /* ===== CREDENTIAL CARDS ===== */
        .vp-cred-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        .vp-cred-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1rem;
          transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
        }
        .vp-cred-card:hover {
          border-color: ${BRAND};
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -14px rgba(8,58,133,0.25);
        }
        .vp-cred-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(8,58,133,0.08);
          color: ${BRAND};
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 1rem;
          margin-bottom: 8px;
        }
        .vp-cred-title {
          margin: 0 0 4px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }
        .vp-cred-issuer { margin: 0; font-size: 0.84rem; color: #475569; font-weight: 600; }
        .vp-cred-year {
          display: inline-block;
          margin-top: 6px;
          font-size: 0.72rem;
          color: ${BRAND};
          font-weight: 700;
          padding: 2px 8px;
          background: rgba(8,58,133,0.08);
          border-radius: 999px;
        }
        .vp-cred-desc {
          margin: 8px 0 0;
          font-size: 0.84rem;
          color: #64748b;
          line-height: 1.5;
        }

        /* ===== REVIEWS ===== */
        .vp-rating-summary {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1.5rem;
          align-items: center;
        }
        .vp-rating-big {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, rgba(8,58,133,0.06), rgba(8,58,133,0.02));
          border-radius: 14px;
          min-width: 130px;
        }
        .vp-rating-num {
          font-size: 2.5rem;
          font-weight: 800;
          color: ${BRAND};
          line-height: 1;
        }
        .vp-rating-stars { display: flex; gap: 2px; }
        .vp-rating-count { font-size: 0.78rem; color: #64748b; font-weight: 600; }
        .vp-rating-bars { display: flex; flex-direction: column; gap: 6px; }
        .vp-rating-row {
          display: grid;
          grid-template-columns: 30px 1fr 28px;
          align-items: center;
          gap: 10px;
          font-size: 0.82rem;
        }
        .vp-rating-row-label {
          display: inline-flex; align-items: center; gap: 3px;
          color: #475569; font-weight: 600;
        }
        .vp-rating-row-label i { color: #f59e0b; font-size: 0.75rem; }
        .vp-rating-bar {
          height: 8px;
          background: rgba(8,58,133,0.06);
          border-radius: 999px;
          overflow: hidden;
        }
        .vp-rating-fill {
          height: 100%;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        .vp-rating-row-count { text-align: right; color: #64748b; font-weight: 600; }

        .vp-reviews { display: flex; flex-direction: column; gap: 12px; }
        .vp-review {
          padding: 1rem 1.1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          transition: border-color 0.18s, transform 0.18s;
        }
        .vp-review:hover { border-color: ${BRAND}; transform: translateY(-1px); }
        .vp-review-head {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 8px;
        }
        .vp-review-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(8,58,133,0.08);
          color: ${BRAND};
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          flex: none;
          font-size: 1.6rem;
        }
        .vp-review-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .vp-review-meta { flex: 1; min-width: 0; }
        .vp-review-name {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
        }
        .vp-review-type {
          font-size: 0.74rem;
          color: #64748b;
        }
        .vp-review-rating { display: flex; gap: 2px; flex: none; }
        .vp-review-date {
          display: inline-block;
          font-size: 0.74rem;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .vp-review-comment {
          margin: 0;
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
        }
        .vp-review-imgs {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .vp-review-imgs img {
          width: 64px; height: 64px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
        }

        /* ===== EMPTY ===== */
        .vp-empty {
          background: #fff;
          border: 1px dashed #e2e8f0;
          border-radius: 16px;
          padding: 3rem 1.5rem;
          text-align: center;
        }
        .vp-empty-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(8,58,133,0.08);
          color: ${BRAND};
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .vp-empty h3 {
          font-size: 1.1rem;
          color: #0f172a;
          margin: 0 0 6px;
          font-weight: 700;
        }
        .vp-empty p { color: #64748b; margin: 0; font-size: 0.92rem; }
        .vp-empty-text { color: #64748b; font-size: 0.92rem; margin: 0; }

        /* ===== SIDEBAR CARDS ===== */
        .vp-side-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.1rem;
          box-shadow: 0 4px 12px rgba(8,58,133,0.05);
        }
        .vp-side-eyebrow {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${BRAND};
          margin-bottom: 8px;
        }
        .vp-side-price {
          display: flex; align-items: baseline; gap: 6px;
          margin-bottom: 0.85rem;
        }
        .vp-side-price-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: #0f172a;
        }
        .vp-side-price-unit {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }
        .vp-side-price-onreq {
          font-size: 1.1rem;
          font-weight: 700;
          color: #475569;
        }
        .vp-side-note {
          margin: 10px 0 0;
          font-size: 0.74rem;
          color: #64748b;
          display: flex; align-items: center; gap: 6px;
        }
        .vp-side-note i { color: #10b981; }

        .vp-side-cal-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 10px;
        }
        .vp-side-cal-nav { display: inline-flex; align-items: center; gap: 6px; }
        .vp-side-cal-month {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0f172a;
          min-width: 110px;
          text-align: center;
        }
        .vp-side-cal-legend {
          display: flex; justify-content: space-between;
          margin-top: 10px;
          font-size: 0.72rem;
          color: #64748b;
        }
        .vp-side-cal-legend span {
          display: inline-flex; align-items: center; gap: 6px;
        }
        .vp-cal-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .vp-cal-dot--free { background: #10b981; }
        .vp-cal-dot--booked { background: #ef4444; }

        /* ===== MINI CALENDAR ===== */
        .vp-cal { user-select: none; }
        .vp-cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 6px;
        }
        .vp-cal-weekday {
          text-align: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .vp-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .vp-cal-cell {
          aspect-ratio: 1/1;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          color: #fff;
          border-radius: 8px;
          /* Available (free) - solid emerald chip, matches the legend dot */
          background: #10b981;
          border: 1px solid #059669;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.22);
        }
        .vp-cal-cell--empty {
          background: transparent;
          border-color: transparent;
          box-shadow: none;
        }
        /* Past - faded out, no fill */
        .vp-cal-cell.is-past {
          color: #cbd5e1;
          background: transparent;
          border-color: transparent;
          box-shadow: none;
          font-weight: 600;
        }
        /* Today - solid brand-blue chip so it pops in the grid */
        .vp-cal-cell.is-today {
          background: ${BRAND};
          color: #fff;
          font-weight: 800;
          border-color: ${BRAND};
          box-shadow: 0 2px 6px rgba(8, 58, 133, 0.35);
        }
        /* Booked - solid red chip with white digit, clearly readable */
        .vp-cal-cell.is-booked {
          background: #ef4444;
          color: #fff;
          font-weight: 800;
          border-color: #dc2626;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.30);
        }
        /* Booked + today - keep red bg, ring it with brand-blue outline */
        .vp-cal-cell.is-booked.is-today {
          background: #ef4444;
          border-color: #dc2626;
          outline: 2px solid ${BRAND};
          outline-offset: -1px;
        }

        /* ===== TRUST ===== */
        .vp-trust { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .vp-trust li {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.85rem;
          color: #475569;
        }
        .vp-trust i {
          color: ${BRAND};
          font-size: 0.95rem;
          width: 18px;
          text-align: center;
        }

        /* ===== CONTACT ===== */
        .vp-contact { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .vp-contact li {
          display: flex; align-items: center; gap: 10px;
          font-size: 0.86rem;
        }
        .vp-contact i {
          color: ${BRAND};
          font-size: 0.95rem;
          width: 18px;
          text-align: center;
          flex: none;
        }
        .vp-contact-value {
          color: #0f172a;
          text-decoration: none;
          font-weight: 600;
          word-break: break-all;
        }
        .vp-contact-value--break { word-break: break-all; }
        .vp-contact-value:hover { color: ${BRAND}; }
        .vp-link-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 0.86rem;
          color: #94a3b8;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.04em;
        }
        .vp-link-btn-cta {
          color: ${BRAND};
          font-weight: 700;
          font-size: 0.78rem;
          text-decoration: underline;
        }
        .vp-link-btn:hover { color: #475569; }

        /* ===== MOBILE BOTTOM CTA ===== */
        .vp-mobile-cta {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: #fff;
          border-top: 1px solid #e2e8f0;
          padding: 0.65rem 1rem;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
          box-shadow: 0 -4px 16px rgba(8,58,133,0.10);
        }
        .vp-mobile-cta-price {
          display: flex; align-items: baseline; gap: 5px;
          color: #0f172a;
        }
        .vp-mobile-cta-from {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .vp-mobile-cta-price strong {
          font-size: 1.05rem;
          font-weight: 800;
        }
        .vp-mobile-cta-unit {
          font-size: 0.72rem;
          color: #64748b;
        }
        .vp-mobile-cta-onreq { font-size: 0.95rem; color: #475569; font-weight: 700; }

        /* ===== IMAGE VIEWER ===== */
        .vp-img-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          animation: vp-fade-in 0.18s ease-out;
        }
        @keyframes vp-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .vp-img-modal img {
          max-width: 95vw; max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .vp-img-modal-close {
          position: absolute;
          top: 16px; right: 16px;
          width: 44px; height: 44px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.96);
          color: #0f172a;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 1rem;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          transition: transform 0.18s, background 0.18s;
        }
        .vp-img-modal-close:hover { transform: scale(1.06); background: #fff; }

        /* ===== ACCESSIBILITY ===== */
        .vp-root :where(a, button, [tabindex]):focus-visible {
          outline: 2px solid ${BRAND};
          outline-offset: 2px;
          border-radius: 8px;
        }
        ::selection { background: ${BRAND}; color: #fff; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .vp-grid { grid-template-columns: 1fr; }
          .vp-sidebar {
            position: static;
            order: -1; /* sidebar above content on tablet */
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }
        }
        @media (max-width: 768px) {
          .vp-hero-cover { height: 320px; }
          .vp-hero-cover-empty { font-size: 3rem; }
          .vp-hero-content {
            margin-top: -56px;
            grid-template-columns: 1fr;
            gap: 0.85rem;
            padding-bottom: 1rem;
          }
          .vp-avatar { width: 110px; height: 110px; }
          .vp-avatar-verif { width: 28px; height: 28px; bottom: 4px; right: 6px; }
          .vp-avatar-verif i { font-size: 1.1rem; }
          .vp-name { font-size: 1.55rem; }
          .vp-headline { font-size: 0.85rem; }
          .vp-stats { font-size: 0.78rem; gap: 10px; }
          .vp-tabs { margin: 1rem 1rem 0; padding: 0.6rem; border-radius: 12px; }
          .vp-tab { padding: 0.5rem 0.85rem; font-size: 0.8rem; }
          .vp-grid { gap: 1rem; padding: 0 1rem; }
          .vp-section { padding: 1.1rem; border-radius: 14px; }
          .vp-rating-summary { grid-template-columns: 1fr; gap: 1rem; }
          .vp-rating-big { width: 100%; }
          .vp-sidebar { grid-template-columns: 1fr; gap: 0.75rem; }
          .vp-root { padding-bottom: 5.5rem; }
        }
        @media (max-width: 480px) {
          .vp-name { font-size: 1.3rem; }
          .vp-stats { gap: 8px; }
          .vp-projects { grid-template-columns: repeat(2, 1fr); }
          .vp-equip-grid { grid-template-columns: 1fr; }
          .vp-cred-grid { grid-template-columns: 1fr; }
        }

        /* Prevent body scroll when image viewer open */
        body:has(.image-viewer-modal) { overflow: hidden; }
      `}</style>
    </>
  );
}

// =================================================================
// MiniCalendar - small reusable inline component
// =================================================================
function MiniCalendar({
  year,
  month,
  bookedDates,
}: {
  year: number;
  month: number;
  bookedDates: BookedDate[];
}) {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isBooked = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookedDates.some((b) => {
      if (!b || typeof b !== 'object') return false;
      const obj = b as unknown as Record<string, unknown>;
      if (typeof obj.date === 'string' && obj.date === dateStr) return true;
      if (typeof obj.startDate === 'string' && typeof obj.endDate === 'string') {
        return dateStr >= (obj.startDate as string) && dateStr <= (obj.endDate as string);
      }
      return false;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="vp-cal">
      <div className="vp-cal-weekdays">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="vp-cal-weekday">
            {d}
          </div>
        ))}
      </div>
      <div className="vp-cal-grid">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="vp-cal-cell vp-cal-cell--empty" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const booked = isBooked(day);
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const cls = [
            'vp-cal-cell',
            booked ? 'is-booked' : '',
            isToday ? 'is-today' : '',
            isPast ? 'is-past' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={i} className={cls} aria-label={booked ? `${dateStr}, booked` : `${dateStr}, available`}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// Skeleton + Error states
// =================================================================
function ProfileSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="vp-skel-root">
      <div className="vp-skel-hero" />
      <div className="vp-skel-content">
        <div className="vp-skel-avatar" />
        <div className="vp-skel-lines">
          <div className="vp-skel-line" style={{ width: '40%', height: 24 }} />
          <div className="vp-skel-line" style={{ width: '70%' }} />
          <div className="vp-skel-line" style={{ width: '55%' }} />
        </div>
      </div>
      <p className="vp-skel-loading">{loadingLabel}</p>
      <style>{`
        .vp-skel-root {
          min-height: 100vh;
          background: #f9fafb;
        }
        .vp-skel-hero {
          width: 100%;
          height: 380px;
          background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 37%, #e2e8f0 63%);
          background-size: 400% 100%;
          animation: vp-shimmer 1.4s linear infinite;
        }
        .vp-skel-content {
          max-width: 1280px;
          margin: -80px auto 0;
          padding: 0 2rem;
          display: flex;
          gap: 1.5rem;
          align-items: end;
        }
        .vp-skel-avatar {
          width: 160px; height: 160px;
          border-radius: 50%;
          border: 4px solid #fff;
          background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 37%, #e2e8f0 63%);
          background-size: 400% 100%;
          animation: vp-shimmer 1.4s linear infinite;
          flex: none;
        }
        .vp-skel-lines {
          flex: 1; display: flex; flex-direction: column; gap: 10px;
          padding-bottom: 16px;
        }
        .vp-skel-line {
          height: 14px; border-radius: 6px;
          background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 37%, #e2e8f0 63%);
          background-size: 400% 100%;
          animation: vp-shimmer 1.4s linear infinite;
        }
        .vp-skel-loading {
          text-align: center;
          color: #475569;
          font-weight: 600;
          margin-top: 4rem;
          font-size: 0.95rem;
        }
        @keyframes vp-shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}

function ProfileError({ message }: { message: string }) {
  return (
    <div className="vp-err-root">
      <div className="vp-err-card" role="alert">
        <div className="vp-err-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h2>Could not load profile</h2>
        <p>{message}</p>
        <div className="vp-err-actions">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
            className="vp-err-btn vp-err-btn--primary"
          >
            <i className="bi bi-arrow-clockwise" /> Try again
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.history.back();
            }}
            className="vp-err-btn vp-err-btn--ghost"
          >
            <i className="bi bi-arrow-left" /> Go back
          </button>
        </div>
      </div>
      <style>{`
        .vp-err-root {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #f9fafb;
        }
        .vp-err-card {
          max-width: 480px; width: 100%;
          padding: 2rem;
          background: #fff;
          border-radius: 18px;
          border: 1px solid #fecaca;
          box-shadow: 0 24px 60px -28px rgba(220,38,38,0.25);
          text-align: center;
        }
        .vp-err-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(239,68,68,0.10);
          color: #dc2626;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1rem;
        }
        .vp-err-card h2 {
          color: #0f172a;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }
        .vp-err-card p {
          color: #64748b;
          margin: 0 0 1.5rem;
        }
        .vp-err-actions {
          display: flex; gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .vp-err-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .vp-err-btn--primary {
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_DARK});
          color: #fff;
          box-shadow: 0 6px 16px -8px rgba(8,58,133,0.55);
        }
        .vp-err-btn--primary:hover { transform: translateY(-1px); }
        .vp-err-btn--ghost {
          background: #fff;
          color: #475569;
          border: 1.5px solid #e2e8f0;
        }
        .vp-err-btn--ghost:hover { border-color: ${BRAND}; color: ${BRAND}; }
      `}</style>
    </div>
  );
}

// =================================================================
// Default export with Suspense (preserved)
// =================================================================
export default function ViewProfilePage({ photographerId }: { photographerId?: string } = {}): React.JSX.Element {
  const t = useTranslations('viewProfile');

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
          }}
        >
          <div style={{ textAlign: 'center', color: BRAND }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <i className="bi bi-hourglass-split" />
            </div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>{t('loadingProfile')}</p>
          </div>
        </div>
      }
    >
      <ViewProfileContent photographerIdProp={photographerId} />
    </Suspense>
  );
}
