'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AmoriaKNavbar from '../../components/navbar';
import { useAuth } from '@/app/providers/AuthProvider';
import { createEventBooking } from '@/lib/APIs/bookings/create-booking/route';

// Shared photographer data - same as view-profile.tsx
const photographersData = [
  {
    id: 1,
    name: 'Cole Palmer',
    image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    bannerImage: 'https://i.pinimg.com/736x/8b/89/70/8b8970fb8745252e4d36f60305967d37.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Gasabo',
    specialty: 'Videographer',
    rating: 4.9,
    reviews: 127,
    completedJobs: 50,
  },
  {
    id: 2,
    name: 'Enzo Fernandez',
    image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    verified: true,
    location: 'Musanze - Rwanda, Musanze',
    specialty: 'Photographer',
    rating: 4.8,
    reviews: 98,
    completedJobs: 65,
  },
  {
    id: 3,
    name: 'Liam delap',
    image: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Kicukiro',
    specialty: 'Photographer',
    rating: 4.7,
    reviews: 156,
    completedJobs: 80,
  },
  {
    id: 4,
    name: 'Moises Caicedo',
    image: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    verified: true,
    location: 'Huye - Rwanda, Huye',
    specialty: 'Videographer',
    rating: 4.9,
    reviews: 143,
    completedJobs: 72,
  },
  {
    id: 5,
    name: 'Pedro neto',
    image: 'https://i.pinimg.com/736x/0f/22/d0/0f22d09fadd8a310fa484d1e94c8c55f.jpg',
    bannerImage: 'https://i.pinimg.com/736x/0f/22/d0/0f22d09fadd8a310fa484d1e94c8c55f.jpg',
    verified: true,
    location: 'Rubavu - Rwanda, Rubavu',
    specialty: 'Photographer',
    rating: 4.8,
    reviews: 134,
    completedJobs: 58,
  },
  {
    id: 6,
    name: 'Reece James',
    image: 'https://i.pinimg.com/1200x/7c/85/39/7c8539e01282b4f5d555f9182a4acf44.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/7c/85/39/7c8539e01282b4f5d555f9182a4acf44.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Nyarugenge',
    specialty: 'Photographer',
    rating: 4.9,
    reviews: 167,
    completedJobs: 91,
  },
  {
    id: 7,
    name: 'Levi Colwill',
    image: 'https://i.pinimg.com/736x/e2/a6/5d/e2a65d23bea44eae43bd4c5965e4ff56.jpg',
    bannerImage: 'https://i.pinimg.com/736x/e2/a6/5d/e2a65d23bea44eae43bd4c5965e4ff56.jpg',
    verified: true,
    location: 'Nyanza - Rwanda, Nyanza',
    specialty: 'Videographer',
    rating: 4.7,
    reviews: 92,
    completedJobs: 55,
  },
  {
    id: 8,
    name: 'Malo Gusto',
    image: 'https://i.pinimg.com/736x/ca/0c/1b/ca0c1beee4be6b1dfe93c67ac02bdb49.jpg',
    bannerImage: 'https://i.pinimg.com/736x/ca/0c/1b/ca0c1beee4be6b1dfe93c67ac02bdb49.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Gasabo',
    specialty: 'Photographer',
    rating: 4.8,
    reviews: 118,
    completedJobs: 63,
  },
];

function BookNowContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const photographerId = searchParams.get('id');
  const t = useTranslations('booking.step1');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Event details form state
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  const eventTypes = [
    'Wedding',
    'Birthday',
    'Corporate Event',
    'Concert',
    'Graduation',
    'Portrait Session',
    'Engagement',
    'Baby Shower',
    'Anniversary',
    'Other',
  ];

  // Validation checks
  useEffect(() => {
    if (authLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/user/book-now?id=${photographerId}`);
      router.push(`/user/auth/login?redirect=${returnUrl}`);
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
  }, [authLoading, isAuthenticated, user, photographerId, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get photographer data based on ID from URL
  const photographer = photographersData.find(p => p.id === Number(photographerId)) || photographersData[0];

  const photographerData = {
    name: photographer.name,
    profileImage: photographer.image,
    backgroundImage: photographer.bannerImage,
    location: photographer.location,
    rating: photographer.rating,
    completedJobs: photographer.completedJobs,
    verified: photographer.verified,
    availability: 'Monday - Sunday',
    hours: '08:00 AM - 11:50 PM',
    minimumEarnings: '$200.00 / Event',
  };

  const packages = [
    {
      id: 'essential',
      name: t('packages.essential.name'),
      price: '$90',
      period: 'per event*',
      badge: 'Essential',
      badgeColor: '#22D3EE',
      badgeGradient: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)',
      description: t('packages.essential.description'),
      features: [
        { text: t('packages.features.unlimitedPhotos'), available: true },
        { text: 'Online gallery storage (provided by platform)', available: true },
        { text: t('packages.features.sameDayPreview'), available: true },
        { text: t('packages.features.professionalEditing'), available: false },
        { text: t('packages.features.printedAlbum'), available: false },
        { text: t('packages.features.liveStreaming'), available: false },
        { text: 'Other preferences', available: false },
      ],
    },
    {
      id: 'custom',
      name: t('packages.custom.name'),
      price: '$150',
      period: 'per event*',
      badge: 'Custom',
      badgeColor: '#FBBF24',
      badgeGradient: 'linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)',
      description: t('packages.custom.description'),
      features: [
        { text: t('packages.features.unlimitedPhotos'), available: true },
        { text: 'Online gallery storage (provided by platform)', available: true },
        { text: t('packages.features.sameDayPreview'), available: true },
        { text: t('packages.features.professionalEditing'), available: true },
        { text: t('packages.features.printedAlbum'), available: true },
        { text: t('packages.features.liveStreaming'), available: false },
        { text: 'Other preferences', available: false },
      ],
    },
    {
      id: 'premium',
      name: t('packages.premium.name'),
      price: '$200',
      period: 'per event*',
      badge: 'Premium',
      badgeColor: '#A855F7',
      badgeGradient: 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #7C3AED 100%)',
      description: t('packages.premium.description'),
      features: [
        { text: t('packages.features.unlimitedPhotos'), available: true },
        { text: 'Online gallery storage (provided by platform)', available: true },
        { text: t('packages.features.sameDayPreview'), available: true },
        { text: t('packages.features.professionalEditing'), available: true },
        { text: t('packages.features.printedAlbum'), available: true },
        { text: t('packages.features.liveStreaming'), available: true },
        { text: 'Other preferences', available: true },
      ],
    },
  ];

  const handleCancel = () => {
    setSelectedPackage(null);
    setBookingError(null);
  };

  const isFormComplete = selectedPackage && eventDate && eventTime && eventType && eventLocation;

  const handleBooking = async () => {
    if (!selectedPackage || !photographerId || !user) {
      setBookingError('Please select a package to continue.');
      return;
    }

    if (!eventDate || !eventTime || !eventType || !eventLocation) {
      setBookingError('Please fill in all event details.');
      return;
    }

    // Clear previous errors
    setBookingError(null);
    setBookingInProgress(true);

    try {
      const response = await createEventBooking(
        {
          photographerId: photographerId,
          packageId: selectedPackage,
          eventDate: eventDate,
          eventTime: eventTime,
          eventType: eventType,
          location: eventLocation,
        },
        user.customerId || user.id
      );

      if (response.success) {
        // Redirect to events page on success
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://connekt-dashboard.vercel.app';
        window.location.href = `${dashboardUrl}/user/client/events`;
      } else {
        setBookingError(response.error || 'Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError('An unexpected error occurred. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
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

  return (
    <>
      <AmoriaKNavbar />
      <div className="min-h-screen" style={{ backgroundColor: '#f0f4f8', position: 'relative' }}>
        {/* Header Section - Same as View Profile */}
        <div
          style={{
            position: 'relative',
            margin: isMobile ? '0 clamp(12px, 3vw, 24px)' : '0 24px',
            marginTop: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
          }}
        >
          {/* Banner Container with Border */}
          <div
            style={{
              position: 'relative',
              height: isMobile ? 'clamp(180px, 35vw, 270px)' : '270px',
              backgroundImage: `url(${photographerData.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: isMobile ? 'clamp(12px, 3vw, 17px)' : '17px',
              border: isMobile ? '2px solid #bab8b8' : '3px solid #bab8b8',
              overflow: 'hidden',
            }}
          >
            {/* Back Button - Glassmorphism */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.history.back();
              }}
              style={{
                position: 'absolute',
                top: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
                left: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
                zIndex: 10,
                width: isMobile ? 'clamp(36px, 8vw, 40px)' : '40px',
                height: isMobile ? 'clamp(36px, 8vw, 40px)' : '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              aria-label="Go back"
            >
              <i className="bi bi-chevron-left" style={{ fontSize: isMobile ? 'clamp(16px, 4vw, 20px)' : '20px', fontWeight: 'bold' }}></i>
            </button>

            {/* Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(13, 27, 42, 0.3)',
                borderRadius: '17px',
              }}
            ></div>
          </div>

          {/* Profile Picture Container - Positioned to overlap */}
          <div
            style={{
              position: 'absolute',
              top: isMobile ? 'clamp(150px, 28vw, 230px)' : '230px',
              left: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
              width: isMobile ? 'clamp(60px, 12vw, 70px)' : '70px',
              height: isMobile ? 'clamp(60px, 12vw, 70px)' : '70px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <img
                src={photographerData.profileImage}
                alt={photographerData.name}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px solid white',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
              {/* Verification Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '0px',
                  background: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                  zIndex: 5,
                }}
              >
                <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section - White Background with Shadow */}
        <div
          style={{
            backgroundColor: '#fff',
            position: 'relative',
            zIndex: 5,
            paddingBottom: isMobile ? 'clamp(16px, 4vw, 24px)' : '24px',
            marginTop: '0',
            marginRight: isMobile ? 'clamp(12px, 3vw, 24px)' : '24px',
            marginBottom: '0',
            marginLeft: isMobile ? 'clamp(12px, 3vw, 24px)' : '24px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            borderRadius: isMobile ? '0 0 clamp(12px, 3vw, 17px) clamp(12px, 3vw, 17px)' : '0 0 17px 17px',
            border: isMobile ? '2px solid #bab8b8' : '3px solid #bab8b8',
            borderTop: 'none',
          }}
        >
          {/* Profile Content */}
          <div
            style={{
              paddingTop: isMobile ? 'clamp(32px, 7vw, 38px)' : '38px',
              paddingLeft: isMobile ? 'clamp(12px, 3vw, 16px)' : '16px',
              paddingRight: isMobile ? 'clamp(12px, 3vw, 16px)' : '16px',
              paddingBottom: isMobile ? 'clamp(12px, 3vw, 16px)' : '16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'flex-start',
              gap: isMobile ? 'clamp(16px, 4vw, 20px)' : '20px',
            }}
          >
            {/* Left Side - Name, Location, and Stats */}
            <div style={{ flex: 1 }}>
              {/* Name */}
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px',
              }}>
                {photographerData.name}
              </h3>

              {/* Location */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#40444d',
                fontSize: '15px',
                marginBottom: '16px',
              }}>
                <i className="bi bi-geo-alt-fill" style={{ fontSize: '15px' }}></i>
                <span>{photographerData.location}</span>
              </div>

              {/* Stats Row */}
              <div style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'center',
                marginTop: '12px',
              }}>
                {/* Rating */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <i className="bi bi-star-fill" style={{ color: '#FFA500', fontSize: '16px' }}></i>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#111827',
                  }}>
                    {photographerData.rating}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: '#083A85',
                    fontWeight: '500',
                  }}>
                    Rating
                  </span>
                </div>

                {/* Events */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <i className="bi bi-camera-fill" style={{ color: '#083A85', fontSize: '16px' }}></i>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#111827',
                  }}>
                    {photographerData.completedJobs}+
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: '#083A85',
                    fontWeight: '500',
                  }}>
                    Events
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side - Availability, Working Hours, Starting Price */}
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '24px' : '72px',
                alignItems: isMobile ? 'flex-start' : 'center',
                flex: isMobile ? 'none' : 2,
                justifyContent: 'flex-start',
                paddingLeft: isMobile ? '0' : '40px',
              }}
            >
              {/* Availability */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#083A85',
                    marginBottom: '4px',
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('availability')}
                </div>
                <div style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                  {photographerData.availability}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#083A85',
                    marginBottom: '4px',
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('workingHours')}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="bi bi-clock-fill" style={{ color: '#083A85', fontSize: '14px' }}></i>
                  {photographerData.hours}
                </div>
              </div>

              {/* Starting Price */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#083A85',
                    marginBottom: '4px',
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('startingPrice')}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="bi bi-tag-fill" style={{ color: '#10b981', fontSize: '14px' }}></i>
                  <span
                    style={{
                      fontSize: '16px',
                      color: '#10b981',
                      fontWeight: '700',
                    }}
                  >
                    {photographerData.minimumEarnings}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
                  border: selectedPackage === pkg.id ? '3px solid #00BFFF' : '3px solid transparent',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: selectedPackage === pkg.id
                    ? '0 25px 50px rgba(0, 191, 255, 0.35), 0 0 0 1px rgba(0, 191, 255, 0.1)'
                    : '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transform: selectedPackage === pkg.id ? 'translateY(-12px) scale(1.03)' : 'translateY(0) scale(1)',
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

                {/* Badge - Ellipse/Oval shape sitting on top */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: selectedPackage === pkg.id ? '24px' : '20px',
                  marginBottom: '-24px',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                }}>
                  <div
                    style={{
                      background: pkg.badgeGradient,
                      color: pkg.id === 'custom' ? '#1f2937' : '#fff',
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
                      fontSize: selectedPackage === pkg.id ? (isMobile ? '48px' : '56px') : (isMobile ? '42px' : '48px'),
                      fontWeight: '800',
                      color: selectedPackage === pkg.id ? '#083A85' : '#1f2937',
                      lineHeight: 1,
                      marginBottom: '6px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {pkg.price}
                  </div>
                  <div
                    style={{
                      fontSize: selectedPackage === pkg.id ? '20px' : '18px',
                      color: selectedPackage === pkg.id ? '#083A85' : '#1f2937',
                      fontWeight: '700',
                      marginBottom: '10px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {pkg.period}
                  </div>

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

                  {/* Expanded Section - Only shows when selected */}
                  {selectedPackage === pkg.id && (
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
                          fontSize: '14px',
                          fontWeight: '600',
                          marginBottom: '12px',
                        }}
                      >
                        <i className="bi bi-info-circle-fill"></i>
                        Package Includes
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          <i className="bi bi-camera-fill" style={{ marginRight: '4px' }}></i>
                          HD Photos
                        </span>
                      </div>
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

          {/* Event Details Form - appears after package selection */}
          {selectedPackage && (
            <div
              style={{
                marginTop: '32px',
                padding: isMobile ? '20px 16px' : '28px 24px',
                backgroundColor: '#fff',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              }}
            >
              <h3
                style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '6px',
                }}
              >
                Event Details
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '20px',
                }}
              >
                Tell us about your event so the photographer can prepare
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '16px',
                }}
              >
                {/* Event Type */}
                <div>
                  <label
                    htmlFor="eventType"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    Event Type *
                  </label>
                  <select
                    id="eventType"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      color: eventType ? '#1f2937' : '#9ca3af',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#083A85')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  >
                    <option value="" disabled>
                      Select event type
                    </option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Date */}
                <div>
                  <label
                    htmlFor="eventDate"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    Event Date *
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      color: '#1f2937',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#083A85')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  />
                </div>

                {/* Event Time */}
                <div>
                  <label
                    htmlFor="eventTime"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    Event Time *
                  </label>
                  <input
                    type="time"
                    id="eventTime"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      color: '#1f2937',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#083A85')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  />
                </div>

                {/* Event Location */}
                <div>
                  <label
                    htmlFor="eventLocation"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    Event Location *
                  </label>
                  <input
                    type="text"
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g., Kigali Convention Center"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      color: '#1f2937',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#083A85')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  />
                </div>
              </div>

              {/* Notes - full width */}
              <div style={{ marginTop: '16px' }}>
                <label
                  htmlFor="eventNotes"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  Additional Notes <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span>
                </label>
                <textarea
                  id="eventNotes"
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="Any special requirements, preferred locations for shots, etc."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #d1d5db',
                    borderRadius: '12px',
                    backgroundColor: '#fff',
                    color: '#1f2937',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#083A85')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>
          )}

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
              disabled={!isFormComplete || bookingInProgress}
              style={{
                padding: '14px 40px',
                backgroundColor: isFormComplete && !bookingInProgress ? '#083A85' : '#d1d5db',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: isFormComplete && !bookingInProgress ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: isFormComplete && !bookingInProgress ? '0 8px 20px rgba(8, 58, 133, 0.35)' : 'none',
                minWidth: isMobile ? '100%' : '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (isFormComplete && !bookingInProgress) {
                  e.currentTarget.style.backgroundColor = '#062d6b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 58, 133, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (isFormComplete && !bookingInProgress) {
                  e.currentTarget.style.backgroundColor = '#083A85';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(8, 58, 133, 0.35)';
                }
              }}
            >
              {bookingInProgress ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  {t('next')}
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
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
