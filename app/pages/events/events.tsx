'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import { useTranslations } from 'next-intl';
import {
  getLocationFromStorage,
  getDistrictsForCountry,
  type LocationData,
} from '../../utils/locationUtils';
import { getPublicEvents, type PublicEvent } from '@/lib/APIs/public';
import { getStreamVideo } from '@/lib/APIs/streams/route';

function formatTime12h(t: string): string {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return 'Time TBA';
  const start = formatTime12h(startTime);
  return endTime ? `${start} - ${formatTime12h(endTime)}` : start;
}

const Events: React.FC = () => {
  const t = useTranslations('events');
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
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

  // API-driven events data
  const [eventsData, setEventsData] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiTotalPages, setApiTotalPages] = useState(0);
  // IDs of events whose Cloudflare stream is confirmed live (connectionStatus === 'live')
  const [liveStreamIds, setLiveStreamIds] = useState<Set<string>>(new Set());
  // Accumulates unique category names seen across all fetched pages — drives the filter dropdown
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const seenCategoriesRef = React.useRef<Set<string>>(new Set());

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await getPublicEvents({
        page: currentPage - 1,
        size: itemsPerPage,
        sortColumn: 'createdAt',
        sortDirection: 'desc',
        category:  selectedCategory  !== 'all' ? selectedCategory  : undefined,
        location:  selectedLocation  !== 'all' ? selectedLocation  : undefined,
        status:    selectedStatus    !== 'all' ? selectedStatus : undefined,
        dateRange: selectedDate      !== 'all' ? selectedDate      : undefined,
        search:    searchTerm.trim() || undefined,
      });
      if (response.success && response.data) {
        const events = response.data.content;
        // Verify which "ongoing" events have an active Cloudflare stream
        const ongoingEvents = events.filter(e => (e.eventStatus || '').toLowerCase() === 'ongoing');
        const trulyLiveIds = new Set<string>();
        if (ongoingEvents.length > 0) {
          const checks = await Promise.allSettled(
            ongoingEvents.map(e => getStreamVideo(e.id))
          );
          checks.forEach((result, i) => {
            if (result.status === 'fulfilled' && result.value.success) {
              const d = result.value.data as { data?: { connectionStatus?: string }; connectionStatus?: string };
              const connStatus = d?.data?.connectionStatus ?? d?.connectionStatus;
              if (connStatus === 'live') trulyLiveIds.add(ongoingEvents[i].id);
            }
          });
        }
        // Hide completed events older than 2 days
        const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
        const filtered = events.filter(ev => {
          if ((ev.eventStatus || '').toUpperCase() !== 'COMPLETED') return true;
          // Use updatedAt (status change timestamp), fall back to eventDate, keep if neither exists
          const dateStr = ev.updatedAt || ev.eventDate;
          if (!dateStr) return true;
          const ts = new Date(dateStr).getTime();
          if (isNaN(ts)) return true;
          return ts > twoDaysAgo;
        });
        setEventsData(filtered);
        setLiveStreamIds(trulyLiveIds);
        setApiTotalPages(response.data.totalPages);
        // Accumulate categories seen across pages and update the filter dropdown
        let changed = false;
        for (const ev of events) {
          const cat = ev.eventCategory?.name?.trim();
          if (cat && !seenCategoriesRef.current.has(cat)) {
            seenCategoriesRef.current.add(cat);
            changed = true;
          }
        }
        if (changed) {
          setCategoryOptions(Array.from(seenCategoriesRef.current).sort());
        }
      } else {
        setLoadError(response.error || 'Failed to fetch events');
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedCategory, selectedLocation, selectedStatus, selectedDate, searchTerm]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  // An event is "live" only when it is ONGOING AND has an active live stream
  const isEventLive = (event: PublicEvent) =>
    (event.eventStatus || '').toUpperCase() === 'ONGOING' &&
    (event.hasLiveStream === true || liveStreamIds.has(event.id));

  // Trending Events Data - Filter only truly live events
  const allTrendingEvents = eventsData.filter(event => isEventLive(event)).map(event => ({
    id: event.id,
    name: event.title,
    image: event.eventPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80'
  }));

  // Limit trending events on mobile for better UX
  const trendingEvents = isMobile ? allTrendingEvents.slice(0, 5) : allTrendingEvents;

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Server-side pagination — events are already fetched per page
  const currentEvents = eventsData;
  const totalPages = apiTotalPages;

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Get page numbers to display (with ellipsis for mobile)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5 || !isMobile) {
      // Show all pages if 5 or less, or on desktop
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Mobile: Show first, last, current, and neighbors
    if (currentPage <= 3) {
      pages.push(1, 2, 3, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)'
    }}>
      <style>{`
        .event-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .event-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        /* Live Now Badge Animation with Sound Wave Effect */
        @keyframes sound-wave-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
          40% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0),
                        0 0 15px rgba(16, 185, 129, 0.7);
          }
          80% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes border-beep {
          0%, 100% {
            border-color: #039130;
            transform: scale(1);
          }
          50% {
            border-color: #34d399;
            transform: scale(1.02);
          }
        }

        @keyframes icon-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
        }

        .live-badge {
          position: relative;
          animation: sound-wave-pulse 0.9s ease-out infinite, border-beep 0.9s ease-in-out infinite;
        }

        .live-badge-icon {
          animation: icon-pulse 1s ease-in-out infinite;
          display: inline-block;
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
            alt="Events Background"
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
                  fontSize: '1.25rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(calc(-50% - 2px))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
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
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
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
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
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

            {/* Date Filter */}
            <div>
              <select
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
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
                <option value="all">{t('allDates')}</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="next-month">Next Month</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
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
                <option value="all">{t('allStatuses')}</option>
                <option value="PUBLISHED">{t('status.upcoming')}</option>
                <option value="ONGOING">{t('liveNow')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Hot Live Trends Section — only visible when live events exist */}
      {trendingEvents.length > 0 && <div style={{
        maxWidth: '1280px',
        margin: '2rem auto 0',
        padding: '0 1rem',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '2rem',
          overflowX: isMobile ? 'auto' : 'hidden',
          overflowY: 'hidden',
          paddingTop: '1rem',
          paddingBottom: '1rem',
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}>
          {/* Hot Live Trends Badge */}
          <div style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #f97316 50%, #8b5cf6 100%)',
            padding: isMobile ? 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)' : '0.75rem 1.5rem',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: 'white',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2
          }}>
            {t('hotLiveTrends')}
          </div>

          {/* Connector Line — spans from badge to last circle */}
          <div style={{
            width: isMobile ? '1rem' : '1.5rem',
            height: '3px',
            background: 'linear-gradient(90deg, #ec4899, #f97316)',
            flexShrink: 0,
            zIndex: 0
          }}></div>

          {/* Trending Events Circles — background line auto-spans the circles */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
            gap: isMobile ? 'clamp(0.5rem, 2vw, 0.75rem)' : '0.75rem',
            minWidth: isMobile ? 'max-content' : 'auto',
            backgroundImage: 'linear-gradient(90deg, #f97316 0%, #8b5cf6 100%)',
            backgroundSize: '100% 3px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            paddingRight: '4px'
          }}>
            {trendingEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => window.location.href = `/user/events/view-event?id=${event.id}`}
                style={{
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  position: 'relative',
                  zIndex: 2
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  width: isMobile ? 'clamp(50px, 10vw, 70px)' : '70px',
                  height: isMobile ? 'clamp(50px, 10vw, 70px)' : '70px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #cf5704',
                  boxShadow: '0 4px 10px rgba(249, 115, 22, 0.4)',
                  backgroundColor: 'white'
                }}>
                  <img
                    src={event.image}
                    alt={event.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Main Content */}
      <main style={{
        flexGrow: 1,
        marginTop: '1rem'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2rem clamp(0.5rem, 2vw, 1rem) 4rem clamp(0.5rem, 2vw, 1rem)'
        }}>
          {/* Loading State */}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
              <div style={{
                width: '40px', height: '40px', border: '4px solid #e5e7eb',
                borderTopColor: '#083A85', borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error State */}
          {loadError && !isLoading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#DC2626' }}>
              <p style={{ marginBottom: '1rem' }}>{loadError}</p>
              <button
                onClick={fetchEvents}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '0.5rem',
                  backgroundColor: '#083A85', color: '#fff', border: 'none',
                  cursor: 'pointer', fontWeight: '600'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !loadError && currentEvents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No events found</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Check back later for upcoming events.</p>
            </div>
          )}

          {/* Event Cards Grid */}
          {!isLoading && !loadError && currentEvents.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))'
              : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: isMobile ? 'clamp(1rem, 3vw, 1.5rem)' : '1.5rem',
            width: '100%'
          }}>
            {currentEvents.map((event) => (
                <div
                  key={event.id}
                  className="event-card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'clamp(20px, 4vw, 28px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: '4px solid #000000',
                    padding: '3px',
                    position: 'relative',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    maxWidth: '100%',
                    minWidth: '0'
                  }}
                >
                  {/* Event Image */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: isMobile ? 'clamp(180px, 35vw, 250px)' : '200px',
                    overflow: 'hidden',
                    borderRadius: 'clamp(16px, 3vw, 20px)',
                    marginBottom: '1rem'
                  }}>
                    <img
                      src={event.eventPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80'}
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Event Details */}
                  <div style={{ padding: '0 clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.5rem)' }}>
                    {/* Event Title */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.6rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: '1.2',
                        margin: 0,
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                      }}>
                        {event.title}
                      </h3>
                    </div>

                    {/* Status Badge - LIVE, UPCOMING, COMPLETED, or CANCELLED */}
                    {(() => {
                      const status = (event.eventStatus || '').toUpperCase();
                      const isLive = isEventLive(event);
                      const isCompleted = status === 'COMPLETED';
                      const isCancelled = status === 'CANCELLED';

                      let borderColor = '#3b82f6';
                      let textColor = '#3b82f6';
                      let icon = 'bi-broadcast';
                      let label = t('status.upcoming');

                      if (isLive) {
                        borderColor = '#039130';
                        textColor = '#039130';
                        icon = 'bi-camera-video-fill';
                        label = t('status.live');
                      } else if (isCompleted) {
                        borderColor = '#6b7280';
                        textColor = '#6b7280';
                        icon = 'bi-check-circle-fill';
                        label = t('status.completed');
                      } else if (isCancelled) {
                        borderColor = '#ef4444';
                        textColor = '#ef4444';
                        icon = 'bi-x-circle-fill';
                        label = t('status.cancelled');
                      }

                      return (
                        <div
                          className={isLive ? 'live-badge' : undefined}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            background: 'transparent',
                            border: `2px solid ${borderColor}`,
                            color: textColor,
                            padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 2.5vw, 1rem)',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <i className={`bi ${icon}`} style={{ fontSize: '0.9rem' }}></i>
                          {label}
                        </div>
                      );
                    })()}

                    {/* Location */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      color: '#374151',
                      fontSize: '0.9rem',
                      marginBottom: '0.4rem',
                      fontWeight: '500',
                      width: '100%',
                      minWidth: '0'
                    }}>
                      <i className="bi bi-geo-alt-fill" style={{ fontSize: '0.85rem', color: '#3b82f6', flexShrink: 0 }}></i>
                      <span style={{
                        textAlign: 'center'
                      }}>{event.location || 'Location TBA'}</span>
                    </div>

                    {/* Time */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      color: '#374151',
                      fontSize: '0.9rem',
                      marginBottom: '0.75rem',
                      fontWeight: '500',
                      width: '100%'
                    }}>
                      <i className="bi bi-clock-fill" style={{ fontSize: '0.85rem', color: '#3b82f6', flexShrink: 0 }}></i>
                      <span style={{ textAlign: 'center' }}>{formatTimeRange(event.startTime, event.endTime)}</span>
                    </div>

                    {/* Stream Now Button */}
                    <button
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        background: isEventLive(event) ? '#039130' : (event.eventStatus || '').toUpperCase() === 'COMPLETED' ? '#4b5563' : '#083A85',
                        border: `2.5px solid ${isEventLive(event) ? '#059669' : (event.eventStatus || '').toUpperCase() === 'COMPLETED' ? '#4b5563' : '#083A85'}`,
                        color: '#FFFFFF',
                        padding: 'clamp(0.625rem, 2.5vw, 0.75rem) clamp(1rem, 3vw, 1.25rem)',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        letterSpacing: '0.5px',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}
                      onClick={() => window.location.href = `/user/events/view-event?id=${event.id}`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                        <path d="M12 6v6l4 2" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                        <path d="M8 8c1-1 2-1 2-1M16 8c-1-1-2-1-2-1M8 16c1 1 2 1 2 1M16 16c-1 1-2 1-2 1" strokeLinecap="round" />
                      </svg>
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: '0'
                      }}>
                        {isEventLive(event)
                          ? (isMobile ? 'JOIN' : t('joinEvent').toUpperCase())
                          : (isMobile ? 'DETAILS' : t('viewDetails').toUpperCase())
                        }
                      </span>
                    </button>
                  </div>
                </div>
            ))}
          </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
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
                disabled={currentPage === 1}
                style={{
                  padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '1px solid #bab8b8',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                  color: currentPage === 1 ? '#9ca3af' : '#111827',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#083A85';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#bab8b8';
                    e.currentTarget.style.transform = 'translateY(0)';
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
                {getPageNumbers().map((pageNum, index) => {
                  if (pageNum === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        style={{
                          padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.3rem, 1vw, 0.5rem)',
                          color: '#9ca3af',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        ...
                      </span>
                    );
                  }

                  const page = pageNum as number;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      style={{
                        padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.6rem, 1.5vw, 0.75rem)',
                        borderRadius: '0.5rem',
                        border: currentPage === page ? '2px solid #083A85' : '1px solid #bab8b8',
                        backgroundColor: currentPage === page ? '#083A85' : '#ffffff',
                        color: currentPage === page ? '#ffffff' : '#111827',
                        cursor: 'pointer',
                        fontWeight: currentPage === page ? '600' : '500',
                        fontSize: '0.9rem',
                        minWidth: 'clamp(2.25rem, 6vw, 2.75rem)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== page) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = '#083A85';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== page) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#bab8b8';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                style={{
                  padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                  borderRadius: '0.5rem',
                  border: '1px solid #bab8b8',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                  color: currentPage === totalPages ? '#9ca3af' : '#111827',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#083A85';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#bab8b8';
                    e.currentTarget.style.transform = 'translateY(0)';
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

export default Events;