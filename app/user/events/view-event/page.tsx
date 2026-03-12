'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AmoriaKNavbar from '../../../components/navbar';
import { useTranslations } from 'next-intl';
import { getPublicEventById, type PublicEvent } from '@/lib/APIs/public';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80';

/**
 * Format eventDate string to readable format
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  try {
    // Parse as local date to avoid timezone shift (e.g. "2026-03-13" → "March 13, 2026")
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format time strings (startTime/endTime) to readable range
 */
function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return 'TBD';
  const format = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };
  const start = format(startTime);
  return endTime ? `${start} - ${format(endTime)}` : start;
}

/**
 * Format price for display
 */
function formatPrice(price?: number): string {
  if (!price || price <= 0) return 'Free';
  return `${price.toLocaleString()} RWF`;
}

/**
 * Get category display name
 */
function getCategoryName(event: PublicEvent): string {
  return event.eventCategory?.name || event.eventTags?.split(',')[0]?.trim() || 'Event';
}

/**
 * Get tags array from comma-separated eventTags string
 */
function getTagsArray(event: PublicEvent): string[] {
  if (!event.eventTags) return [];
  return event.eventTags.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * Get photographer display name
 */
function getPhotographerName(event: PublicEvent): string | null {
  if (!event.photographer) return null;
  const { firstName, lastName } = event.photographer;
  return [firstName, lastName].filter(Boolean).join(' ') || null;
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ViewEventContent(): React.JSX.Element {
  const t = useTranslations('events.viewEvent');
  const tStatus = useTranslations('events.status');
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  // Fetch event from API
  useEffect(() => {
    if (!eventId) {
      setLoadError('No event ID provided');
      setIsLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const response = await getPublicEventById(eventId);
        if (response.success && response.data) {
          setSelectedEvent(response.data);
        } else {
          setLoadError(response.error || 'Event not found');
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageViewerOpen) {
        closeImageViewer();
      }
    };

    if (imageViewerOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [imageViewerOpen]);

  const openImageViewer = () => {
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <AmoriaKNavbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <div style={{ textAlign: 'center', color: '#083A85' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <i className="bi bi-hourglass-split"></i>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>{t('loadingEventDetails')}</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (loadError || !selectedEvent) {
    return (
      <>
        <AmoriaKNavbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <i className="bi bi-exclamation-circle"></i>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>{loadError || 'Event not found'}</p>
            <button
              onClick={() => window.history.back()}
              style={{
                marginTop: '16px',
                padding: '12px 32px',
                backgroundColor: '#083A85',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const eventImage = selectedEvent.eventPhoto || PLACEHOLDER_IMAGE;
  const isLive = (selectedEvent.eventStatus || '').toLowerCase() === 'ongoing';
  const tags = getTagsArray(selectedEvent);
  const photographerName = getPhotographerName(selectedEvent);

  return (
    <>
      <AmoriaKNavbar />
      <div className="min-h-screen bg-white" style={{ opacity: 1, transition: 'opacity 0.3s ease-in' }}>
        {/* Header Section - Banner Image */}
        <div
          style={{
            position: 'relative',
            margin: '0 24px',
            marginTop: '20px',
          }}
        >
          {/* Banner Container with Border */}
          <div
            style={{
              position: 'relative',
              height: '400px',
              backgroundImage: `url(${eventImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '17px',
              border: '3px solid #bab8b8',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => openImageViewer()}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
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
                top: '20px',
                left: '20px',
                zIndex: 10,
                width: '40px',
                height: '40px',
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
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Go back"
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '20px', fontWeight: 'bold' }}></i>
            </button>

            {/* Status Badge - Live or Upcoming */}
            {isLive ? (
              <div
                className="live-badge"
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: 'rgba(3, 145, 48, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid #10b981',
                  borderRadius: '25px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                <i className="bi bi-camera-video-fill live-badge-icon" style={{ fontSize: '16px' }}></i>
                {tStatus('live')}
              </div>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: 'rgba(8, 58, 133, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid #3b82f6',
                  borderRadius: '25px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                }}
              >
                <i className="bi bi-broadcast" style={{ fontSize: '16px' }}></i>
                {tStatus('upcoming')}
              </div>
            )}

            {/* View Full Size Indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                zIndex: 10,
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                pointerEvents: 'none',
              }}
            >
              <i className="bi bi-arrows-fullscreen" style={{ fontSize: '14px' }}></i>
              {t('viewFull')}
            </div>

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
        </div>

        {/* Event Details Section */}
        <div
          style={{
            backgroundColor: '#fff',
            position: 'relative',
            zIndex: 5,
            margin: '0 24px',
            marginTop: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            borderRadius: '17px',
            border: '3px solid #bab8b8',
            padding: '32px',
          }}
        >
          {/* Event Title and Category */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#f0f9ff',
                  color: '#083A85',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: '2px solid #dbeafe',
                }}
              >
                {getCategoryName(selectedEvent)}
              </span>
            </div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px',
                lineHeight: '1.2',
              }}
            >
              {selectedEvent.title}
            </h1>
          </div>

          {/* Event Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#083A85',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-calendar-event" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('eventDate')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {formatDate(selectedEvent.eventDate)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-clock-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('eventTime')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {formatTimeRange(selectedEvent.startTime, selectedEvent.endTime)}
                </p>
              </div>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-geo-alt-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('location')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.location || 'TBD'}
                </p>
              </div>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-tag-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('entryFee')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {formatPrice(selectedEvent.price)}
                </p>
              </div>
            </div>

            {/* Max Guests */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-people-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('expectedAttendees')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.maxGuests && selectedEvent.maxGuests > 0
                    ? `${selectedEvent.maxGuests.toLocaleString()} ${t('people')}`
                    : 'Unlimited'}
                </p>
              </div>
            </div>

            {/* Organizer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#06b6d4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-person-badge-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('organizedBy')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.eventOrganizer || 'TBD'}
                </p>
              </div>
            </div>
          </div>

          {/* Photographer Section */}
          {photographerName && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '4px', height: '24px', backgroundColor: '#083A85', borderRadius: '2px' }}></div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Photographer</h2>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#083A85',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {selectedEvent.photographer?.profilePicture ? (
                    <img
                      src={selectedEvent.photographer.profilePicture}
                      alt={photographerName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="bi bi-camera-fill" style={{ color: '#fff', fontSize: '24px' }}></i>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {photographerName}
                  </p>
                  {selectedEvent.photographer?.address && (
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, marginTop: '4px' }}>
                      <i className="bi bi-geo-alt" style={{ marginRight: '4px' }}></i>
                      {selectedEvent.photographer.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description Section */}
          {selectedEvent.description && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}
                ></div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {t('aboutThisEvent')}
                </h2>
              </div>
              <p
                style={{
                  fontSize: '16px',
                  color: '#4b5563',
                  lineHeight: '1.8',
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  borderLeft: '4px solid #083A85',
                  margin: 0,
                }}
              >
                {selectedEvent.description}
              </p>
            </div>
          )}

          {/* Tags Section */}
          {tags.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}
                ></div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {t('eventTags')}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#f0f9ff',
                      border: '2px solid #dbeafe',
                      borderRadius: '25px',
                      fontSize: '14px',
                      color: '#083A85',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#083A85';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.color = '#083A85';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <i className="bi bi-hash" style={{ fontSize: '14px' }}></i>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {isLive && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '24px',
                borderTop: '2px solid #e5e7eb',
              }}
            >
              <button
                className="live-stream-button"
                onClick={() => (window.location.href = `/user/events/join-package?id=${selectedEvent.id}`)}
                style={{
                  padding: '16px 40px',
                  backgroundColor: '#039130',
                  color: '#fff',
                  border: '2px solid #10b981',
                  borderRadius: '100px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 15px rgba(3, 145, 48, 0.3)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#027a28';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#039130';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <i className="bi bi-camera-video-fill live-badge-icon" style={{ fontSize: '15px' }}></i>
                {t('joinLiveStream')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {imageViewerOpen && (
        <div
          className="image-viewer-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={closeImageViewer}
        >
          {/* Close Button */}
          <button
            onClick={closeImageViewer}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              zIndex: 10001,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            }}
            aria-label="Close image viewer"
          >
            <i className="bi bi-x-lg"></i>
          </button>

          {/* Image Type Label */}
          <div
            style={{
              position: 'absolute',
              top: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 10001,
            }}
          >
            <i className="bi bi-image" style={{ fontSize: '18px' }}></i>
            {t('eventBanner')}
          </div>

          {/* Image Container */}
          <div
            style={{
              position: 'relative',
              width: '95vw',
              height: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={eventImage}
              alt={selectedEvent.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                animation: 'slideInFromLeft 0.4s ease',
              }}
            />
          </div>

          {/* Instructions */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <i className="bi bi-info-circle"></i>
            <span>{t('closeInstructions')}</span>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

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

        @keyframes button-glow-pulse {
          0% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.3),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          40% {
            box-shadow: 0 6px 20px rgba(3, 145, 48, 0.5),
                        0 0 0 10px rgba(16, 185, 129, 0),
                        0 0 0 20px rgba(16, 185, 129, 0);
          }
          80% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.4),
                        0 0 0 10px rgba(16, 185, 129, 0),
                        0 0 0 20px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.3),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes border-twinkle {
          0%, 100% {
            border-color: #10b981;
            filter: brightness(1);
          }
          50% {
            border-color: #34d399;
            filter: brightness(1.3);
          }
        }

        .live-badge {
          animation: sound-wave-pulse 0.9s ease-out infinite;
        }

        .live-stream-button {
          animation: button-glow-pulse 1.2s ease-in-out infinite,
                     border-twinkle 1.2s ease-in-out infinite;
        }

        .live-badge-icon {
          animation: icon-pulse 1s ease-in-out infinite;
          display: inline-block;
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

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #083A85;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #062d6b;
        }

        button:focus-visible,
        a:focus-visible {
          outline: 3px solid #083A85;
          outline-offset: 2px;
        }

        ::selection {
          background-color: #083A85;
          color: white;
        }
      `}</style>
    </>
  );
}

// Loading component
function LoadingFallback() {
  const t = useTranslations('events.viewEvent');
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff'
    }}>
      <div style={{
        textAlign: 'center',
        color: '#083A85'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          <i className="bi bi-hourglass-split"></i>
        </div>
        <p style={{
          fontSize: '18px',
          fontWeight: '600'
        }}>{t('loadingEventDetails')}</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ViewEventPage(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ViewEventContent />
    </Suspense>
  );
}
