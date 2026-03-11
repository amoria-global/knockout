'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AmoriaKNavbar from '../../components/navbar';
import { useAuth } from '@/app/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/client';
import { getPublicPhotographerPackages, type PublicPackage } from '@/lib/APIs/packages/get-packages/route';
import { getPhotographers, type Photographer, getCurrencies, type Currency } from '@/lib/APIs/public';


function BookNowContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const photographerId = searchParams.get('id');
  const preselectedPackageId = searchParams.get('packageId');
  const t = useTranslations('booking.step1');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showBookingBanner, setShowBookingBanner] = useState(false);
  const [apiPackages, setApiPackages] = useState<PublicPackage[]>([]);
  const [apiPackagesLoaded, setApiPackagesLoaded] = useState(false);
  const [currencyMap, setCurrencyMap] = useState<Map<string, Currency>>(new Map());

  // Photographer API data state
  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [photographerLoading, setPhotographerLoading] = useState(true);
  const [photographerError, setPhotographerError] = useState<string | null>(null);

  // Extra photos & videos state per package
  const [extraPhotos, setExtraPhotos] = useState<Record<string, number | ''>>({ essential: '', custom: '', premium: '' });
  const [extraVideos, setExtraVideos] = useState<Record<string, number | ''>>({ essential: '', custom: '', premium: '' });

  // Validation checks (only for logged-in users who are photographers or self-booking)
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setValidationError(null);
      return;
    }

    // Check if user is a client (not a photographer)
    if (user?.customerType === 'Photographer') {
      setValidationError('Only clients can book photographers. Please log in with a client account.');
      return;
    }

    // Check if user is trying to book themselves
    if (user?.customerId === photographerId || user?.id === photographerId) {
      setValidationError('You cannot book yourself.');
      return;
    }

    setValidationError(null);
  }, [authLoading, isAuthenticated, user, photographerId]);

  // Fetch photographer data from API by filtering from main list
  useEffect(() => {
    const fetchPhotographer = async () => {
      if (!photographerId) {
        setPhotographerError('No photographer ID provided');
        setPhotographerLoading(false);
        return;
      }

      setPhotographerLoading(true);
      setPhotographerError(null);

      try {
        // Fetch all photographers and filter by ID (same as view-profile.tsx)
        const response = await getPhotographers({ size: 100 });

        if (response.success && response.data?.content) {
          const found = response.data.content.find(p => p.id === photographerId);
          if (found) {
            setPhotographer(found);
          } else {
            setPhotographerError('Photographer not found');
          }
        } else {
          setPhotographerError(response.error || 'Failed to load photographer profile');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setPhotographerError(errorMessage);
      } finally {
        setPhotographerLoading(false);
      }
    };

    fetchPhotographer();
  }, [photographerId]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use inline packages from photographer object, fallback to separate endpoint
  useEffect(() => {
    if (!photographerId) return;

    // Prefer inline packages from photographer data
    const inlinePkgs = photographer?.packages?.filter(p => p.isActive) || [];
    if (inlinePkgs.length > 0) {
      setApiPackages(inlinePkgs as unknown as PublicPackage[]);
      setApiPackagesLoaded(true);
      return;
    }

    // Fallback: fetch from separate endpoint if inline data unavailable
    if (photographer !== null) {
      getPublicPhotographerPackages(photographerId)
        .then(res => {
          if (res.success && res.data) {
            const pkgs = Array.isArray(res.data)
              ? res.data
              : (res.data as Record<string, unknown>)?.data
                ? (res.data as Record<string, unknown>).data as PublicPackage[]
                : [];
            setApiPackages((pkgs as PublicPackage[]).filter(p => p.isActive));
          }
        })
        .catch(() => {})
        .finally(() => setApiPackagesLoaded(true));
    }
  }, [photographerId, photographer]);

  // Fetch currencies for price display
  useEffect(() => {
    getCurrencies().then(res => {
      if (res.success && res.data) {
        const currencies = Array.isArray(res.data) ? res.data : [];
        const map = new Map<string, Currency>();
        currencies.forEach(c => map.set(c.id, c));
        setCurrencyMap(map);
      }
    }).catch(() => {});
  }, []);

  // Auto-select package from URL param
  useEffect(() => {
    if (preselectedPackageId && apiPackagesLoaded && apiPackages.length > 0 && !selectedPackage) {
      const match = apiPackages.find(p => p.id === preselectedPackageId);
      if (match) setSelectedPackage(match.id);
    }
  }, [preselectedPackageId, apiPackagesLoaded, apiPackages, selectedPackage]);

  // Helper to resolve currency symbol from currencyId
  const getCurrencySymbol = (currencyId: string): string => {
    const c = currencyMap.get(currencyId);
    return c?.symbol || '';
  };

  // Tier ordering and config
  const TIER_ORDER: Record<string, number> = { Essential: 1, Custom: 2, Premium: 3 };
  const badgePresets = [
    { badgeGradient: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)' },
    { badgeGradient: 'linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)' },
    { badgeGradient: 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #7C3AED 100%)' },
  ];
  const TIER_BORDER: Record<string, string> = {
    Essential: '#22D3EE',
    Custom: '#FBBF24',
    Premium: '#8B5CF6',
  };

  // Calculate total price for a package including extras
  const getPackageTotal = (pkgId: string, basePrice: number) => {
    const pkg = packages.find(p => p.id === pkgId);
    const photosCount = typeof extraPhotos[pkgId] === 'number' ? extraPhotos[pkgId] : 0;
    const videosCount = typeof extraVideos[pkgId] === 'number' ? extraVideos[pkgId] : 0;
    const photoPrice = pkg?.extraPhotoPrice || 0;
    const videoPrice = pkg?.extraVideoPrice || 0;
    return basePrice + (photosCount * photoPrice) + (videosCount * videoPrice);
  };

  const getExtrasTotal = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    const photosCount = typeof extraPhotos[pkgId] === 'number' ? extraPhotos[pkgId] : 0;
    const videosCount = typeof extraVideos[pkgId] === 'number' ? extraVideos[pkgId] : 0;
    const photoPrice = pkg?.extraPhotoPrice || 0;
    const videoPrice = pkg?.extraVideoPrice || 0;
    return (photosCount * photoPrice) + (videosCount * videoPrice);
  };

  const handleExtraChange = (
    pkgId: string,
    type: 'photos' | 'videos',
    value: string
  ) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    const setter = type === 'photos' ? setExtraPhotos : setExtraVideos;
    setter(prev => ({
      ...prev,
      [pkgId]: value === '' ? '' : parseInt(value, 10),
    }));
  };

  // Use real API packages only, sorted Essential → Custom → Premium
  const packages = [...apiPackages]
    .sort((a, b) => (TIER_ORDER[a.packageName] ?? 99) - (TIER_ORDER[b.packageName] ?? 99))
    .map((pkg, index) => {
      const isPremium = pkg.packageName === 'Premium';
      return {
        id: pkg.id,
        name: pkg.packageName,
        basePrice: pkg.price,
        currencyId: pkg.currencyId,
        currencySymbol: pkg.currencySymbol || (pkg.currencyId ? getCurrencySymbol(pkg.currencyId) : '') || pkg.currencyAbbreviation || '',
        currencyAbbreviation: pkg.currencyAbbreviation || '',
        includedPhotos: pkg.includedPhotos ?? null,
        includedVideos: pkg.includedVideos ?? null,
        extraPhotoPrice: pkg.extraPhotoPrice || 0,
        extraVideoPrice: pkg.extraVideoPrice || 0,
        period: pkg.priceUnit || 'per event',
        durationHours: pkg.durationHours || 0,
        badge: pkg.packageName,
        badgeGradient: badgePresets[index % badgePresets.length].badgeGradient,
        tierBorderColor: TIER_BORDER[pkg.packageName] ?? '#3B82F6',
        isPremium,
        description: pkg.description || '',
        features: [...(pkg.features || [])]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(f => ({ text: f.featureName, available: f.isIncluded })),
      };
    });

  const handleCancel = () => {
    setSelectedPackage(null);
    setBookingError(null);
  };

  const isFormComplete = !!selectedPackage;

  const handleBooking = () => {
    if (!selectedPackage || !photographerId) {
      setBookingError('Please select a package to continue.');
      return;
    }

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/user/photographers/book-now?id=${photographerId}&packageId=${selectedPackage}`);
      window.location.href = `/user/auth/login?redirect=${returnUrl}`;
      return;
    }

    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.connekyt.com';
    const userType = (user?.customerType || 'Client').replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase());
    const token = getAuthToken();
    setShowBookingBanner(true);
    setTimeout(() => {
      const dest = new URL(`${dashboardUrl}/user/${userType}/events`);
      if (photographerId) dest.searchParams.set('photographerId', photographerId);
      if (selectedPackage) dest.searchParams.set('packageId', selectedPackage);
      if (token) dest.searchParams.set('token', token);
      window.location.href = dest.toString();
    }, 1500);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f0f4f8'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#083A85',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Show validation error if user cannot book
  if (validationError) {
    return (
      <>
        <AmoriaKNavbar />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 80px)',
          backgroundColor: '#f0f4f8',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#FEE2E2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '28px', color: '#DC2626' }}></i>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
              Cannot Complete Booking
            </h2>
            <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px' }}>
              {validationError}
            </p>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '12px 32px',
                backgroundColor: '#083A85',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Show loading state while fetching photographer data
  if (photographerLoading) {
    return (
      <>
        <AmoriaKNavbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          backgroundColor: '#f0f4f8',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#083A85',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading photographer profile...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </>
    );
  }

  // Show error state if photographer data failed to load
  if (photographerError || !photographer) {
    return (
      <>
        <AmoriaKNavbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          backgroundColor: '#f0f4f8',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            maxWidth: '400px',
          }}>
            <i className="bi bi-exclamation-circle" style={{ fontSize: '3rem', color: '#dc2626' }}></i>
            <h2 style={{ color: '#dc2626', marginTop: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Error Loading Profile
            </h2>
            <p style={{ color: '#991b1b', marginTop: '0.5rem' }}>
              {photographerError || 'Photographer not found'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#083A85',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.history.back()}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AmoriaKNavbar />

      {/* Success Booking Banner */}
      {showBookingBanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: '#10b981',
          color: '#fff',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
          animation: 'slideDown 0.4s ease-out',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <i className="bi bi-check-lg" style={{ fontSize: '20px', fontWeight: 'bold' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>Booking Photographer Successfully!</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>Redirecting to your events...</div>
          </div>
          <div style={{
            marginLeft: '20px',
            width: '24px',
            height: '24px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <style>{`
            @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

      <div className="min-h-screen" style={{ backgroundColor: '#f0f4f8', position: 'relative' }}>
        {/* Back Button */}
        <div style={{ padding: isMobile ? '16px' : '20px 24px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <i className="bi bi-chevron-left"></i>
            Back
          </button>
        </div>

        {/* Main Content Container */}
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: isMobile ? '32px 16px 40px' : '40px 24px 40px',
          }}
        >
          {/* Page Header - Choose Your Preferred Package */}
          <div style={{ marginBottom: isMobile ? '24px' : '32px', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: isMobile ? '26px' : '54px',
                fontWeight: '900',
                color: '#083A85',
                marginBottom: '8px',
              }}
            >
              {t('title')}
            </h1>
            <p style={{ fontSize: isMobile ? '14px' : '18px', color: '#40444d', maxWidth: '600px', margin: '0 auto' }}>
              Choose the perfect package that suits your needs and budget
            </p>
          </div>

          {/* Package Cards Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '24px' : '24px',
            marginBottom: '32px',
            alignItems: 'start',
          }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                style={{
                  position: 'relative',
                  backgroundColor: selectedPackage === pkg.id ? '#0a2540' : '#1e3a5f',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedPackage === pkg.id
                    ? '3px solid #00BFFF'
                    : `3px solid ${pkg.tierBorderColor}`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: selectedPackage === pkg.id
                    ? '0 25px 50px rgba(0, 191, 255, 0.35), 0 0 0 1px rgba(0, 191, 255, 0.1)'
                    : pkg.isPremium
                      ? '0 10px 35px rgba(139, 92, 246, 0.25)'
                      : '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transform: selectedPackage === pkg.id ? 'translateY(-12px) scale(1.03)' : pkg.isPremium ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
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

                {/* Best value pill — Premium only */}
                {pkg.isPremium && selectedPackage !== pkg.id && (
                  <div style={{
                    position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#8B5CF6', color: '#fff',
                    padding: '3px 12px', borderRadius: '50px',
                    fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
                    whiteSpace: 'nowrap', zIndex: 3,
                  }}>
                    Best Value
                  </div>
                )}

                {/* Badge - Ellipse/Oval shape sitting on top */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: pkg.isPremium && selectedPackage !== pkg.id ? '36px' : selectedPackage === pkg.id ? '24px' : '20px',
                  marginBottom: '-24px',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                }}>
                  <div
                    style={{
                      background: pkg.badgeGradient,
                      color: '#fff',
                      padding: selectedPackage === pkg.id ? '12px 48px' : '10px 40px',
                      borderRadius: '50px',
                      fontSize: selectedPackage === pkg.id ? '16px' : '15px',
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
                    margin: '0 12px 12px 12px',
                    borderRadius: '16px',
                    padding: selectedPackage === pkg.id ? '44px 24px 28px 24px' : '40px 20px 24px 20px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'all 0.3s ease',
                    border: selectedPackage === pkg.id ? '2px solid rgba(0, 191, 255, 0.2)' : '2px solid transparent',
                  }}
                >
                  {/* Price */}
                  <div
                    style={{
                      fontSize: selectedPackage === pkg.id ? (isMobile ? '60px' : '72px') : (isMobile ? '52px' : '62px'),
                      fontWeight: '900',
                      color: '#16a34a',
                      lineHeight: 1,
                      marginBottom: '6px',
                      transition: 'all 0.3s ease',
                      WebkitTextStroke: '0.5px #16a34a',
                      letterSpacing: '-1px',
                    }}
                  >
                    {pkg.currencySymbol}{getPackageTotal(pkg.id, pkg.basePrice).toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: selectedPackage === pkg.id ? '20px' : '18px',
                      color: selectedPackage === pkg.id ? '#083A85' : '#1f2937',
                      fontWeight: '700',
                      marginBottom: '8px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {pkg.period}
                  </div>

                  {/* Media coverage line */}
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '10px',
                    color: pkg.isPremium ? '#7C3AED' : '#374151',
                  }}>
                    {pkg.isPremium
                      ? 'Unlimited photos & videos'
                      : (() => {
                          const parts = [];
                          if (pkg.includedPhotos) parts.push(`${pkg.includedPhotos} photos`);
                          if (pkg.includedVideos) parts.push(`${pkg.includedVideos} videos`);
                          return parts.join(' · ') || '—';
                        })()
                    }
                  </div>

                  {/* Duration */}
                  {pkg.durationHours > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: selectedPackage === pkg.id ? 'rgba(8,58,133,0.7)' : '#6b7280',
                        marginBottom: '4px',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <i className="bi bi-clock" style={{ fontSize: '13px' }}></i>
                      {pkg.durationHours} {pkg.durationHours === 1 ? 'hour' : 'hours'}
                    </div>
                  )}

                  {/* Description */}
                  {pkg.description && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: selectedPackage === pkg.id ? '#4b5563' : '#6b7280',
                        lineHeight: '1.5',
                        margin: '8px 0 0 0',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {pkg.description}
                    </p>
                  )}

                  {/* Divider */}
                  <div
                    style={{
                      height: selectedPackage === pkg.id ? '2px' : '1px',
                      backgroundColor: selectedPackage === pkg.id ? '#00BFFF' : '#e5e7eb',
                      margin: '20px 0',
                      transition: 'all 0.3s ease',
                    }}
                  ></div>

                  {/* Features List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: selectedPackage === pkg.id ? '14px' : '12px', transition: 'all 0.3s ease' }}>
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
                              fontSize: selectedPackage === pkg.id ? '18px' : '16px',
                              transition: 'all 0.3s ease',
                            }}
                          ></i>
                        ) : (
                          <i
                            className="bi bi-x-circle"
                            style={{
                              color: '#d1d5db',
                              fontSize: selectedPackage === pkg.id ? '18px' : '16px',
                              transition: 'all 0.3s ease',
                            }}
                          ></i>
                        )}
                        <span
                          style={{
                            fontSize: selectedPackage === pkg.id ? '15px' : '14px',
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

                  {/* Extra Photos & Videos Input - Only shows when selected and package supports extras */}
                  {selectedPackage === pkg.id && (pkg.isPremium || (pkg.includedPhotos ?? 0) > 0 || (pkg.includedVideos ?? 0) > 0 || pkg.extraPhotoPrice > 0 || pkg.extraVideoPrice > 0) && (
                    <div
                      style={{
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px dashed #00BFFF',
                        animation: 'fadeIn 0.3s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          color: '#083A85',
                          fontSize: '15px',
                          fontWeight: '600',
                          marginBottom: '4px',
                        }}
                      >
                        <i className="bi bi-plus-circle-fill"></i>
                        Need More Than What&apos;s Included?
                      </div>
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        textAlign: 'center',
                        marginBottom: '6px',
                      }}>
                        {pkg.isPremium
                          ? <>This package includes <strong style={{ color: '#7C3AED' }}>unlimited photos &amp; videos</strong>.</>
                          : <>This package already includes <strong style={{ color: '#083A85' }}>{pkg.includedPhotos} photos</strong> &amp; <strong style={{ color: '#083A85' }}>{pkg.includedVideos} videos</strong>.</>
                        }
                      </p>
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        textAlign: 'center',
                        marginBottom: '16px',
                      }}>
                        Want even more? Add extras below. They&apos;ll be added on top of your included set at <strong style={{ color: '#10b981' }}>{pkg.currencySymbol}{pkg.extraPhotoPrice}/photo</strong> &amp; <strong style={{ color: '#10b981' }}>{pkg.currencySymbol}{pkg.extraVideoPrice}/video</strong>.
                      </p>

                      {/* Extra Photos Input */}
                      <div style={{ marginBottom: '12px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#083A85',
                            marginBottom: '6px',
                            textAlign: 'left',
                          }}
                        >
                          <i className="bi bi-camera-fill" style={{ marginRight: '6px', fontSize: '14px' }}></i>
                          Extra Photos <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={pkg.isPremium ? 'e.g. 50 extra photos' : `e.g. 50 → you'll get ${(pkg.includedPhotos ?? 0) + 50} total photos`}
                            value={extraPhotos[pkg.id]}
                            onChange={(e) => handleExtraChange(pkg.id, 'photos', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 20px',
                              fontSize: '15px',
                              fontWeight: '800',
                              textAlign: 'center',
                              backgroundColor: '#f0fdf4',
                              border: '3px solid #10b981',
                              borderRadius: '14px',
                              color: '#083A85',
                              outline: 'none',
                              boxSizing: 'border-box',
                              boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(16, 185, 129, 0.2)',
                              transition: 'all 0.3s ease',
                            }}
                          />
                          {typeof extraPhotos[pkg.id] === 'number' && (extraPhotos[pkg.id] as number) > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#10b981',
                              }}
                            >
                              +{pkg.currencySymbol}{(extraPhotos[pkg.id] as number) * pkg.extraPhotoPrice}
                            </div>
                          )}
                        </div>
                        {typeof extraPhotos[pkg.id] === 'number' && (extraPhotos[pkg.id] as number) > 0 && (
                          <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: '600', textAlign: 'center' }}>
                            {pkg.isPremium ? <>Extra: <strong>{extraPhotos[pkg.id]} photos</strong></> : <>Total: {pkg.includedPhotos} included + {extraPhotos[pkg.id]} extra = <strong>{(pkg.includedPhotos ?? 0) + (extraPhotos[pkg.id] as number)} photos</strong></>}
                          </p>
                        )}
                      </div>

                      {/* Extra Videos Input */}
                      <div style={{ marginBottom: '12px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#083A85',
                            marginBottom: '6px',
                            textAlign: 'left',
                          }}
                        >
                          <i className="bi bi-camera-video-fill" style={{ marginRight: '6px', fontSize: '14px' }}></i>
                          Extra Videos <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={pkg.isPremium ? 'e.g. 10 extra videos' : `e.g. 10 → you'll get ${(pkg.includedVideos ?? 0) + 10} total videos`}
                            value={extraVideos[pkg.id]}
                            onChange={(e) => handleExtraChange(pkg.id, 'videos', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 20px',
                              fontSize: '15px',
                              fontWeight: '800',
                              textAlign: 'center',
                              backgroundColor: '#f0fdf4',
                              border: '3px solid #10b981',
                              borderRadius: '14px',
                              color: '#083A85',
                              outline: 'none',
                              boxSizing: 'border-box',
                              boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(16, 185, 129, 0.2)',
                              transition: 'all 0.3s ease',
                            }}
                          />
                          {typeof extraVideos[pkg.id] === 'number' && (extraVideos[pkg.id] as number) > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#10b981',
                              }}
                            >
                              +{pkg.currencySymbol}{(extraVideos[pkg.id] as number) * pkg.extraVideoPrice}
                            </div>
                          )}
                        </div>
                        {typeof extraVideos[pkg.id] === 'number' && (extraVideos[pkg.id] as number) > 0 && (
                          <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: '600', textAlign: 'center' }}>
                            {pkg.isPremium ? <>Extra: <strong>{extraVideos[pkg.id]} videos</strong></> : <>Total: {pkg.includedVideos} included + {extraVideos[pkg.id]} extra = <strong>{(pkg.includedVideos ?? 0) + (extraVideos[pkg.id] as number)} videos</strong></>}
                          </p>
                        )}
                      </div>

                      {/* Price Breakdown - only show when extras are entered */}
                      {getExtrasTotal(pkg.id) > 0 && (
                        <div
                          style={{
                            marginTop: '16px',
                            padding: '16px',
                            backgroundColor: '#ecfdf5',
                            borderRadius: '12px',
                            border: '2px solid #10b981',
                            animation: 'fadeIn 0.3s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#374151' }}>Base package ({pkg.isPremium ? 'Unlimited' : `${pkg.includedPhotos} photos & ${pkg.includedVideos} videos`})</span>
                            <span style={{ fontSize: '14px', color: '#374151' }}>{pkg.currencySymbol}{pkg.basePrice.toLocaleString()}</span>
                          </div>
                          {typeof extraPhotos[pkg.id] === 'number' && (extraPhotos[pkg.id] as number) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                                +{extraPhotos[pkg.id]} extra photos x {pkg.currencySymbol}{pkg.extraPhotoPrice}
                              </span>
                              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                                +{pkg.currencySymbol}{(extraPhotos[pkg.id] as number) * pkg.extraPhotoPrice}
                              </span>
                            </div>
                          )}
                          {typeof extraVideos[pkg.id] === 'number' && (extraVideos[pkg.id] as number) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                                +{extraVideos[pkg.id]} extra videos x {pkg.currencySymbol}{pkg.extraVideoPrice}
                              </span>
                              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                                +{pkg.currencySymbol}{(extraVideos[pkg.id] as number) * pkg.extraVideoPrice}
                              </span>
                            </div>
                          )}
                          <div
                            style={{
                              height: '1px',
                              backgroundColor: '#10b981',
                              margin: '8px 0',
                            }}
                          ></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '16px', color: '#047857', fontWeight: '700' }}>New Total</span>
                            <span style={{ fontSize: '18px', color: '#047857', fontWeight: '800' }}>
                              {pkg.currencySymbol}{getPackageTotal(pkg.id, pkg.basePrice).toLocaleString()}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#047857',
                            textAlign: 'center',
                            fontWeight: '600',
                            paddingTop: '4px',
                            borderTop: '1px dashed #a7f3d0',
                          }}>
                            {pkg.isPremium ? 'Unlimited photos & videos' : (
                              <>
                                You&apos;ll get{' '}
                                {typeof extraPhotos[pkg.id] === 'number' && (extraPhotos[pkg.id] as number) > 0
                                  ? `${(pkg.includedPhotos ?? 0) + (extraPhotos[pkg.id] as number)} total photos`
                                  : `${pkg.includedPhotos} photos`}
                                {' '}&amp;{' '}
                                {typeof extraVideos[pkg.id] === 'number' && (extraVideos[pkg.id] as number) > 0
                                  ? `${(pkg.includedVideos ?? 0) + (extraVideos[pkg.id] as number)} total videos`
                                  : `${pkg.includedVideos} videos`}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom padding area with Select Button */}
                <div style={{ padding: selectedPackage === pkg.id ? '16px 20px 20px' : '12px 16px', transition: 'all 0.3s ease' }}>
                  {selectedPackage === pkg.id ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          color: '#10b981',
                          fontSize: '16px',
                          fontWeight: '700',
                        }}
                      >
                        <i className="bi bi-check-circle-fill" style={{ fontSize: '20px' }}></i>
                        Package Selected
                      </div>
                      <div
                        style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '13px',
                          textAlign: 'center',
                        }}
                      >
                        Click &quot;Next&quot; to continue booking
                      </div>
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
              gap: '16px',
              paddingTop: '8px',
            }}
          >
            <button
              onClick={handleCancel}
              style={{
                padding: '14px 40px',
                backgroundColor: '#fff',
                color: '#374151',
                border: '2px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: isMobile ? '100%' : '160px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleBooking}
              disabled={!isFormComplete}
              style={{
                padding: '14px 40px',
                backgroundColor: isFormComplete ? '#083A85' : '#d1d5db',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: isFormComplete ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: isFormComplete ? '0 8px 20px rgba(8, 58, 133, 0.35)' : 'none',
                minWidth: isMobile ? '100%' : '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (isFormComplete) {
                  e.currentTarget.style.backgroundColor = '#062d6b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 58, 133, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (isFormComplete) {
                  e.currentTarget.style.backgroundColor = '#083A85';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(8, 58, 133, 0.35)';
                }
              }}
            >
              {t('next')}
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>

          {/* Booking Error Message */}
          {bookingError && (
            <div style={{
              textAlign: 'center',
              padding: '12px 20px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              borderRadius: '8px',
              marginTop: '16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <i className="bi bi-exclamation-circle-fill"></i>
              {bookingError}
            </div>
          )}

          {/* Footer Note */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#9ca3af',
              marginTop: '24px',
            }}
          >
            * Prices may vary based on event type and additional requirements
          </p>
        </div>
      </div>
    </>
  );
}

export default function BookNowPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookNowContent />
    </Suspense>
  );
}
