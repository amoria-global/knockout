'use client';
import React, { useState } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: {
    name: string;
    rating: number;
    comment: string;
    images: File[];
    eventId: string;
  }) => void;
  photographerName: string;
  events?: { id: string; title: string; eventDate: string }[];
  eventsLoading?: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  photographerName,
  events,
  eventsLoading,
}: ReviewModalProps): React.JSX.Element | null {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImages([file]);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews([reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImages([]);
    setImagePreviews([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim() === '') {
      alert('Please enter your name');
      return;
    }

    if (events && events.length > 0 && !selectedEventId) {
      alert('Please select an event');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (comment.trim() === '') {
      alert('Please write a review');
      return;
    }

    onSubmit({ name, rating, comment, images, eventId: selectedEventId });

    // Reset form
    setName('');
    setRating(0);
    setComment('');
    setImages([]);
    setImagePreviews([]);
    setSelectedEventId('');
    onClose();
  };

  return (
    <>
      {/* Overlay with Backdrop Blur */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '550px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '2px' }}>
                Write a Review
              </h2>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>
                Share your experience with {photographerName}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#6b7280',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="bi bi-x"></i>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px' }}>
              {/* Name Input Section */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="name"
                  style={{ fontSize: '12px', fontWeight: '600', color: '#000', marginBottom: '6px', display: 'block' }}
                >
                  Your name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#083A85';
                    e.target.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Event Selector (shown when events prop is provided) */}
              {events !== undefined && (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="event-select"
                    style={{ fontSize: '12px', fontWeight: '600', color: '#000', marginBottom: '6px', display: 'block' }}
                  >
                    Select event *
                  </label>
                  {eventsLoading ? (
                    <div style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #e5e7eb',
                        borderTopColor: '#083A85',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Loading completed events...
                    </div>
                  ) : events.length === 0 ? (
                    <div style={{
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: '#9CA3AF',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                    }}>
                      No completed events with this photographer
                    </div>
                  ) : (
                    <select
                      id="event-select"
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#083A85';
                        e.target.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">-- Select an event --</option>
                      {events.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.title}{evt.eventDate ? ` (${new Date(evt.eventDate).toLocaleDateString()})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Rating Section */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#000', marginBottom: '8px', display: 'block' }}>
                  Rate your experience *
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <i
                        className={
                          star <= (hoveredRating || rating)
                            ? 'bi bi-star-fill'
                            : 'bi bi-star'
                        }
                        style={{
                          fontSize: '28px',
                          color: star <= (hoveredRating || rating) ? '#FFA500' : '#d1d5db',
                          transition: 'color 0.2s',
                        }}
                      ></i>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '6px', fontWeight: '500' }}>
                      {rating} {rating === 1 ? 'star' : 'stars'}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment Section */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="comment"
                  style={{ fontSize: '12px', fontWeight: '600', color: '#000', marginBottom: '6px', display: 'block' }}
                >
                  Your review *
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience with this photographer..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#083A85';
                    e.target.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#000', marginBottom: '6px', display: 'block' }}>
                  Add a photo (optional)
                </label>

                {/* Image Preview or Upload Button */}
                {imagePreviews.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid #e5e7eb',
                      }}
                    >
                      <img
                        src={imagePreviews[0]}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <i className="bi bi-x" style={{ fontSize: '14px' }}></i>
                      </button>
                    </div>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Click X to remove photo</span>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#083A85';
                      e.currentTarget.style.color = '#083A85';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    <i className="bi bi-camera" style={{ fontSize: '14px' }}></i>
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#083A85',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#062d6b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#083A85';
                }}
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
