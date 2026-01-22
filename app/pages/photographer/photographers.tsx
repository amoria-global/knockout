'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  getLocationFromStorage,
  getDistrictsForCountry,
  type LocationData,
} from '../../utils/locationUtils';
import {
  getPhotographers,
  getCategories,
  type Photographer,
  type PaginatedPhotographers,
  type PhotographerCategory,
} from '@/lib/APIs/public';
import { useToast } from '@/lib/notifications/ToastProvider';

const Photographers: React.FC = () => {
  const t = useTranslations('photographers');
  const searchParams = useSearchParams();
  const toast = useToast();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [bookmarkedPhotographers, setBookmarkedPhotographers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // API data states
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [categories, setCategories] = useState<PhotographerCategory[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 12;

  // Load user location from storage and set available districts
  useEffect(() => {
    const location = getLocationFromStorage();
    if (location) {
      setUserLocation(location);
      const districts = getDistrictsForCountry(location.countryCode);
      setAvailableDistricts(districts);
    }
  }, []);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data.filter((cat) => cat.isActive));
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch photographers from API
  const fetchPhotographers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPhotographers({
        page: currentPage,
        size: itemsPerPage,
        sortColumn: 'createdAt',
        sortDirection: 'asc',
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setPhotographers(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        setError(response.error || 'Failed to fetch photographers');
        toast.error(response.error || 'Failed to fetch photographers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedCategory, selectedLocation, searchTerm, toast]);

  // Fetch photographers when filters change
  useEffect(() => {
    fetchPhotographers();
  }, [fetchPhotographers]);

  // Update category from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page on search
    fetchPhotographers();
  };

  const toggleBookmark = (photographerId: string) => {
    setBookmarkedPhotographers(prev =>
      prev.includes(photographerId)
        ? prev.filter(id => id !== photographerId)
        : [...prev, photographerId]
    );
  };

  // Helper function to get photographer display data
  const getPhotographerDisplayName = (photographer: Photographer) => {
    return `${photographer.firstName} ${photographer.lastName}`;
  };

  const getPhotographerLocation = (photographer: Photographer) => {
    return photographer.address || 'Location not specified';
  };

  const getProfileImage = (photographer: Photographer) => {
    if (photographer.profilePicture && !photographer.profilePicture.includes('/null')) {
      return photographer.profilePicture;
    }
    return 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg';
  };

  const getCoverImage = (photographer: Photographer) => {
    if (photographer.coverPicture && !photographer.coverPicture.includes('/null')) {
      return photographer.coverPicture;
    }
    return 'https://i.pinimg.com/736x/8b/89/70/8b8970fb8745252e4d36f60305967d37.jpg';
  };

  // Pagination handlers (0-indexed for API)
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)' }}>
      <style>{`
        .profile-image-container {
          position: absolute;
          top: 105px;
          left: 20px;
          width: 70px;
          height: 70px;
          z-index: 10;
        }
        .verification-badge {
          position: absolute;
          bottom: 0px;
          right: 0px;
          background: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          z-index: 5;
        }
        .card-content-left-align {
          text-align: left;
          padding-top: 38px;
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 8px;
        }
      `}</style>
      
      <AmoriaKNavbar />

      {/* Hero Section with Search and Filters */}
      <div style={{
        position: 'relative',
        paddingTop: 'clamp(1.5rem, 4vw, 2.5rem)',
        paddingBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
        paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
        paddingRight: 'clamp(0.75rem, 2vw, 1rem)',
        overflow: 'hidden',
        marginLeft: '0',
        marginRight: '0',
        marginTop: '0rem'
      }}>
        {/* Background Image with Blur Overlay */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src="https://i.pinimg.com/736x/1b/97/8d/1b978dbaab62a500d6915617c0cc43bb.jpg"
            alt="Photography Background"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'linear-gradient(135deg, #ec4899 0%, #f97316 50%, #8b5cf6 100%)',
            backdropFilter: 'blur(20px)'
          }}></div>
        </div>

        <div style={{
          position: 'relative',
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '0 clamp(0.5rem, 2vw, 1rem)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            fontFamily: "'Pragati Narrow', sans-serif",
            lineHeight: '1.2'
          }}>
            {t('title')}
          </h1>
          <p style={{
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '42rem',
            margin: '0 auto clamp(1rem, 2vw, 1.5rem)',
            fontFamily: "'Pragati Narrow', sans-serif",
            display: isMobile && window.innerWidth < 375 ? 'none' : 'block'
          }}>
            {t('subtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{
            maxWidth: '43rem',
            margin: '0 auto',
            marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)'
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(3rem, 8vw, 3.5rem) clamp(0.875rem, 2.5vw, 1rem) clamp(1.25rem, 3vw, 1.5rem)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: '#d4d4d4',
                  color: '#000000'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: 'clamp(0.75rem, 2vw, 1rem)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>

          {/* Filters Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
            gap: 'clamp(0.5rem, 2vw, 1rem)',
            maxWidth: '70rem',
            margin: '0 auto'
          }}>
            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  width: '100%',
                  padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 2.5vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allCategories')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name.toLowerCase()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  width: '100%',
                  padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 2.5vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allLocations')}</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 2.5vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allPrices')}</option>
                <option value="budget">Budget (Under 50k RWF)</option>
                <option value="moderate">Moderate (50k-150k RWF)</option>
                <option value="premium">Premium (150k-300k RWF)</option>
                <option value="luxury">Luxury (300k+ RWF)</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 2.5vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allRatings')}</option>
                <option value="5">⭐ 5 Stars</option>
                <option value="4">⭐ 4+ Stars</option>
                <option value="3">⭐ 3+ Stars</option>
                <option value="2">⭐ 2+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{
        flexGrow: 1,
        marginTop: 'clamp(-2rem, -3vw, -1rem)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'clamp(3rem, 8vw, 5rem) clamp(0.5rem, 2vw, 1rem) 4rem clamp(0.5rem, 2vw, 1rem)'
        }}>
          {/* Loading State */}
          {isLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
              width: '100%'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#083A85',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading photographers...</p>
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
              width: '100%'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: '#fef2f2',
                borderRadius: '12px',
                border: '1px solid #fecaca'
              }}>
                <i className="bi bi-exclamation-circle" style={{ fontSize: '2rem', color: '#dc2626' }}></i>
                <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{error}</p>
                <button
                  onClick={fetchPhotographers}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#083A85',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && photographers.length === 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
              width: '100%'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '2rem'
              }}>
                <i className="bi bi-camera" style={{ fontSize: '3rem', color: '#9ca3af' }}></i>
                <p style={{ color: '#6b7280', marginTop: '1rem', fontSize: '1.1rem' }}>No photographers found</p>
                <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Try adjusting your filters or search terms</p>
              </div>
            </div>
          )}

          {/* Photographer Cards Grid */}
          {!isLoading && !error && photographers.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))'
              : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: isMobile ? 'clamp(1.5rem, 4vw, 2.5rem) clamp(0.75rem, 2vw, 1.5rem)' : '2.5rem 1.5rem',
            width: '100%'
          }}>
            {photographers.map((photographer) => {
              const isBookmarked = bookmarkedPhotographers.includes(photographer.id);
              const displayName = getPhotographerDisplayName(photographer);
              const profileImage = getProfileImage(photographer);
              const coverImage = getCoverImage(photographer);
              const location = getPhotographerLocation(photographer);

              return (
              <div
                key={photographer.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '3px solid #bab8b8',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Banner Header with Image - 40% of card */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  backgroundImage: `url(${coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderTopLeftRadius: '17px',
                  borderTopRightRadius: '17px',
                  borderBottomRightRadius: '17px',
                  borderBottomLeftRadius: '17px',
                  flexShrink: 0
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(13, 27, 42, 0.3)',
                    borderTopLeftRadius: '17px',
                    borderBottomRightRadius: '17px',
                    borderBottomLeftRadius: '17px',
                    borderTopRightRadius: '17px'
                  }}></div>
                </div>

                {/* Profile Image Container with Verification Badge */}
                <div className="profile-image-container">
                  <img
                    src={profileImage}
                    alt={displayName}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: '2px solid white',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                  />
                  <div className="verification-badge">
                    <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-content-left-align">
                  {/* Bookmark Button - Top Right */}
                  <div style={{
                    position: 'absolute',
                    top: '150px',
                    right: '16px',
                    zIndex: 10
                  }}>
                    <button
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #9e9d9d',
                        cursor: 'pointer',
                        padding: '0',
                        color: isBookmarked ? '#3b82f6' : '#6b7280',
                        fontSize: '1.05rem',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onClick={() => toggleBookmark(photographer.id)}
                    >
                      <i className={isBookmarked ? "bi bi-bookmark-fill" : "bi bi-bookmark"}></i>
                    </button>
                  </div>

                  {/* Profile Information */}
                  <div style={{
                    marginBottom: '0.1rem',
                    marginTop: '0px'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '0.03rem'
                    }}>
                      {displayName}
                    </h3>
                    <p style={{
                      color: '#40444d',
                      fontSize: '0.85rem',
                      marginBottom: '0.15rem'
                    }}>
                      {photographer.customerType}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#40444d',
                    fontSize: '0.78rem',
                    marginBottom: '0.3rem'
                  }}>
                    <i className="bi bi-geo-alt-fill" style={{ fontSize: '0.8rem' }}></i>
                    <span>{location}</span>
                  </div>

                  {/* Service Categories / Specialties */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: '0.3rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.4rem'
                  }}>
                    {photographer.specialties.length > 0 ? (
                      <>
                        {photographer.specialties.slice(0, 3).map((specialty, i) => (
                          <span key={i} style={{
                            backgroundColor: '#f9fafb',
                            color: '#40444d',
                            padding: '0.25rem 0.7rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            border: '0.001px solid #adadad'
                          }}>
                            {specialty}
                          </span>
                        ))}
                        {photographer.specialties.length > 3 && (
                          <span style={{
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            padding: '0.25rem 0.7rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            border: '1px solid #bab8b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            +{photographer.specialties.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{
                        backgroundColor: '#f9fafb',
                        color: '#9ca3af',
                        padding: '0.25rem 0.7rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        border: '0.001px solid #adadad'
                      }}>
                        No specialties listed
                      </span>
                    )}
                  </div>

                  {/* Performance & Stats */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.3rem 0.2rem',
                    margin: '0.3rem 0 0.35rem 0',
                    borderTop: '1px solid #bab8b8',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.15rem'
                      }}>
                        <i className="bi bi-star-fill" style={{ color: '#000000', fontSize: '0.77rem' }}></i>
                        {photographer.rating.toFixed(1)}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#40444d', fontWeight: '500' }}>
                        {t('rating')}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.15rem'
                      }}>
                        <i className="bi bi-people-fill" style={{ fontSize: '0.77rem' }}></i>
                        {photographer.reviews.length}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#40444d', fontWeight: '500' }}>
                        {t('completedJobs')}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.15rem'
                      }}>
                        <i className="bi bi-clock" style={{ fontSize: '0.77rem' }}></i>
                        {photographer.projects.length}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#40444d', fontWeight: '500' }}>
                        {t('accuracy')}
                      </p>
                    </div>
                  </div>

                  {/* Get In Touch Button */}
                  <button
                    style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '100px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                        marginTop: '0',
                        letterSpacing: '0.01em'
                    }}
                    onClick={() => window.location.href = `/user/photographers/view-profile?id=${photographer.id}`}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2d2d2d';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.12)';
                    }}
                    >
                    {t('getInTouch')}
                </button>

                </div>
              </div>
              )
            })}
          </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(0.25rem, 1vw, 0.5rem)',
              marginTop: '3rem',
              flexWrap: 'wrap',
              width: '100%'
            }}>
              {/* Previous Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                style={{
                  padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '1px solid #bab8b8',
                  backgroundColor: currentPage === 0 ? '#f3f4f6' : '#ffffff',
                  color: currentPage === 0 ? '#9ca3af' : '#111827',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 0) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#083A85';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 0) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#bab8b8';
                  }
                }}
              >
                <i className="bi bi-chevron-left"></i>
                <span style={{ display: 'inline' }}>Previous</span>
              </button>

              {/* Page Numbers */}
              <div style={{
                display: 'flex',
                gap: 'clamp(0.2rem, 0.5vw, 0.25rem)',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {Array.from({ length: totalPages }, (_, i) => i).map((pageIndex) => (
                  <button
                    key={pageIndex}
                    onClick={() => goToPage(pageIndex)}
                    style={{
                      padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.75rem)',
                      borderRadius: '0.5rem',
                      border: currentPage === pageIndex ? '2px solid #083A85' : '1px solid #bab8b8',
                      backgroundColor: currentPage === pageIndex ? '#083A85' : '#ffffff',
                      color: currentPage === pageIndex ? '#ffffff' : '#111827',
                      cursor: 'pointer',
                      fontWeight: currentPage === pageIndex ? '600' : '500',
                      fontSize: '0.9rem',
                      minWidth: 'clamp(2.25rem, 6vw, 2.75rem)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageIndex) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#083A85';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageIndex) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#bab8b8';
                      }
                    }}
                  >
                    {pageIndex + 1}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1}
                style={{
                  padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '1px solid #bab8b8',
                  backgroundColor: currentPage >= totalPages - 1 ? '#f3f4f6' : '#ffffff',
                  color: currentPage >= totalPages - 1 ? '#9ca3af' : '#111827',
                  cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#083A85';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage < totalPages - 1) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#bab8b8';
                  }
                }}
              >
                <span style={{ display: 'inline' }}>Next</span>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Photographers;
