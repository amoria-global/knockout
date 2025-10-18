'use client';
import React, { useState } from 'react';
import AmoriaKNavbar from '../../components/navbar';

export default function BookNowPage(): React.JSX.Element {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Sample photographer data - this would normally come from props or API
  const photographerData = {
    name: 'Cole Palmer',
    profileImage: 'https://i.pinimg.com/1200x/85/c5/96/85c596eec98acf0645c5c231f3f8b870.jpg',
    availability: 'Monday - Sunday',
    hours: '08:00 AM - 11:50 PM',
    location: 'Rwanda / Musanze',
    minimumEarnings: '$200.00 / Event',
  };

  const packages = [
    {
      id: 'essential',
      name: 'Essential Package',
      hours: '3 Hours',
      description: 'Great for small events and birthdays',
      features: [
        { text: '3 hours coverage', available: true },
        { text: 'Unlimited photos & videos', available: true },
        { text: 'Online gallery storage', available: true },
        { text: 'Same-day preview', available: true },
        { text: 'Professional editing', available: false },
        { text: 'Printed photo album', available: false },
        { text: 'Live-streaming', available: false },
        { text: 'Drone photography', available: false },
      ],
      color: '#083A85',
    },
    {
      id: 'custom',
      name: 'Custom Package',
      hours: '4 Hours',
      description: 'Great for corporate events and parties',
      features: [
        { text: '4 hours coverage', available: true },
        { text: 'Unlimited photos & videos', available: true },
        { text: 'Online gallery storage', available: true },
        { text: 'Same-day preview', available: true },
        { text: 'Professional editing', available: true },
        { text: 'Printed photo album', available: true },
        { text: 'Live-streaming', available: false },
        { text: 'Drone photography', available: false },
      ],
      color: '#083A85',
    },
    {
      id: 'premium',
      name: 'Premium Package',
      hours: '5 Hours',
      description: 'Great for large events, concerts, and weddings',
      features: [
        { text: '5 hours coverage', available: true },
        { text: 'Unlimited photos & videos', available: true },
        { text: 'Online gallery storage', available: true },
        { text: 'Same-day preview', available: true },
        { text: 'Professional editing', available: true },
        { text: 'Printed photo album', available: true },
        { text: 'Live-streaming', available: true },
        { text: 'Drone photography', available: true },
      ],
      color: '#083A85',
    },
  ];

  const handleNext = () => {
    if (selectedPackage) {
      console.log('Selected package:', selectedPackage);
      // Navigate to next step or booking confirmation
    }
  };

  const handleCancel = () => {
    console.log('Booking cancelled');
    // Navigate back or clear selection
    setSelectedPackage(null);
  };

  return (
    <>
      <AmoriaKNavbar />
      <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa', position: 'relative' }}>
        {/* Back Button - Overlay at top left */}
        <button
          onClick={() => window.history.back()}
          style={{
            position: 'absolute',
            top: '20px',
            left: '0',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            color: '#8b8b8c',
            cursor: 'pointer',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            fontWeight: '600',
            borderRadius: '0',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#083A85';
            e.currentTarget.style.backgroundColor = '#f0f7ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8b8b8c';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <i className="bi bi-chevron-left" style={{ fontSize: '20px' }}></i>
          <span>Back</span>
        </button>

        {/* Main Content Container */}
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px 24px 40px',
          }}
        >
          {/* New Layout: Photographer Info at Top, Packages Below Horizontally */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            {/* Top Section: Photographer Information - Horizontal Layout */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '17px',
                padding: '40px 32px 40px 140px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                minHeight: '180px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                {/* Profile Image */}
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #083A85',
                    boxShadow: '0 4px 12px rgba(8, 58, 133, 0.2)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={photographerData.profileImage}
                    alt={photographerData.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>

                {/* Photographer Info - Horizontal */}
                <div style={{ flex: 1, display: 'flex', gap: '40px', alignItems: 'center' }}>
                  {/* Name */}
                  <div>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        color: '#111827',
                        marginBottom: '4px',
                        lineHeight: '1.3',
                      }}
                    >
                      {photographerData.name}
                    </h2>
                    <p style={{ fontSize: '15px', color: '#6b7280', fontWeight: '500' }}>
                      Professional Photographer
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'flex', gap: '32px', flex: 1 }}>
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
                        Availability
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#111827',
                          fontWeight: '600',
                        }}
                      >
                        {photographerData.availability}
                      </div>
                    </div>

                    {/* Hours */}
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
                        Working Hours
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

                    {/* Location */}
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
                        Location
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <i
                          className="bi bi-geo-alt-fill"
                          style={{ color: '#083A85', fontSize: '14px' }}
                        ></i>
                        <span
                          style={{
                            fontSize: '14px',
                            color: '#111827',
                            fontWeight: '600',
                          }}
                        >
                          {photographerData.location}
                        </span>
                      </div>
                    </div>

                    {/* Minimum Earnings */}
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
                        Starting Price
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <i
                          className="bi bi-tag-fill"
                          style={{ color: '#10b981', fontSize: '14px' }}
                        ></i>
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
            </div>

            {/* Bottom Section: Package Selection - Horizontal */}
            <div>
              {/* Header */}
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '20px',
                  letterSpacing: '0.3px',
                }}
              >
                Choose Your Preferred Package
              </h1>

              {/* Package Cards - Horizontal Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    style={{
                      backgroundColor: selectedPackage === pkg.id ? '#083A85' : '#8b8b8c',
                      borderRadius: '20px',
                      padding: '24px 20px',
                      cursor: 'pointer',
                      border:
                        selectedPackage === pkg.id
                          ? '3px solid #00BFFF'
                          : '3px solid transparent',
                      transition: 'all 0.3s ease',
                      boxShadow:
                        selectedPackage === pkg.id
                          ? '0 8px 24px rgba(8, 58, 133, 0.4), 0 0 0 4px rgba(8, 58, 133, 0.1)'
                          : '0 4px 12px rgba(0,0,0,0.08)',
                      transform: selectedPackage === pkg.id ? 'translateY(-4px) scale(1.02)' : 'translateY(0)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPackage !== pkg.id) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                        e.currentTarget.style.backgroundColor = '#4b5563';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPackage !== pkg.id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        e.currentTarget.style.backgroundColor = '#8b8b8c';
                      }
                    }}
                  >
                    {/* Package Name & Hours */}
                    <div style={{ marginBottom: '10px' }}>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: '900',
                          color: '#fff',
                          marginBottom: '4px',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {pkg.name}
                      </h3>
                      <p
                        style={{
                          fontSize: '14px',
                          color: '#fff',
                          fontWeight: '900',
                          opacity: 0.95,
                        }}
                      >
                        {pkg.hours}
                      </p>
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#fff',
                        marginBottom: '12px',
                        opacity: 0.9,
                        lineHeight: '1.5',
                      }}
                    >
                      {pkg.description}
                    </p>

                    {/* Features List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {pkg.features.map((feature, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <i
                            className={feature.available ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'}
                            style={{
                              color: feature.available ? '#10b981' : '#ef4444',
                              fontSize: '15px',
                              fontWeight: '900',
                            }}
                          ></i>
                          <span
                            style={{
                              fontSize: '13px',
                              color: '#fff',
                              fontWeight: '700',
                              opacity: feature.available ? 1 : 0.65,
                              textDecoration: feature.available ? 'none' : 'line-through',
                            }}
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons - Separate Section at Bottom */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '8px',
              }}
            >
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: '#fff',
                    color: '#374151',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    letterSpacing: '0.5px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  CANCEL
                </button>
                <button
                   onClick={() => (window.location.href = '/user/photographers/book-now1')}
                  disabled={!selectedPackage}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: selectedPackage ? '#083A85' : '#d1d5db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: selectedPackage ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    letterSpacing: '0.5px',
                    boxShadow: selectedPackage ? '0 4px 12px rgba(8, 58, 133, 0.25)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPackage) {
                      e.currentTarget.style.backgroundColor = '#062d6b';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 58, 133, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPackage) {
                      e.currentTarget.style.backgroundColor = '#083A85';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.25)';
                    }
                  }}
                >
                  NEXT
                </button>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}
