'use client';
import React, { useState } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import Footer from '../../components/footer';

export default function BookNowPage(): React.JSX.Element {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Sample photographer data - this would normally come from props or API
  const photographerData = {
    name: 'cole palmer',
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
      <div className="min-h-screen bg-gray-100">
        {/* Back Button */}
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '16px 20px 0',
          }}
        >
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              color: '#666',
              cursor: 'pointer',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
          >
            <i className="bi bi-chevron-left" style={{ fontSize: '20px' }}></i>
            <span>Back</span>
          </button>
        </div>

        {/* Main Content Container */}
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '24px 20px',
          }}
        >
          {/* Grid Layout: Left (Photographer Info) and Right (Package Selection) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '340px 1fr',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            {/* Left Section: Photographer Information */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {/* Profile Image */}
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 14px',
                  border: '2.5px solid #083A85',
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

              {/* Photographer Name */}
              <h2
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#000',
                  marginBottom: '18px',
                  textAlign: 'center',
                  lineHeight: '1.3',
                }}
              >
                Book session with {photographerData.name}
              </h2>

              {/* Information Section */}
              <div
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '5px',
                }}
              >
                {/* Availability */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#000',
                      marginBottom: '4px',
                    }}
                  >
                    Availability:
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#4b5563',
                      fontWeight: '500',
                    }}
                  >
                    {photographerData.availability}
                  </div>
                </div>

                {/* Hours */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#000',
                    }}
                  >
                    {photographerData.hours}
                  </div>
                </div>

                {/* Location */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <i
                      className="bi bi-globe"
                      style={{ color: '#083A85', fontSize: '13px' }}
                    ></i>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#4b5563',
                        fontWeight: '500',
                      }}
                    >
                      {photographerData.location}
                    </span>
                  </div>
                </div>

                {/* Minimum Earnings/Payments */}
                <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '12px' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#000',
                      marginBottom: '4px',
                    }}
                  >
                    Minimum Earnings/Payments:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <i
                      className="bi bi-tag-fill"
                      style={{ color: '#083A85', fontSize: '12px' }}
                    ></i>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#4b5563',
                        fontWeight: '600',
                      }}
                    >
                      {photographerData.minimumEarnings}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Package Selection */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {/* Header */}
              <h1
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#000',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                Choose Your Preferred Package
              </h1>

              {/* Package Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    style={{
                      backgroundColor: pkg.color,
                      borderRadius: '8px',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      border:
                        selectedPackage === pkg.id
                          ? '2.5px solid #00BFFF'
                          : '2.5px solid transparent',
                      transition: 'all 0.2s',
                      boxShadow:
                        selectedPackage === pkg.id
                          ? '0 3px 10px rgba(0, 191, 255, 0.3)'
                          : '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Package Name & Hours */}
                    <div style={{ marginBottom: '8px' }}>
                      <h3
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#fff',
                          marginBottom: '2px',
                        }}
                      >
                        {pkg.name}:
                      </h3>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#fff',
                          fontWeight: '500',
                        }}
                      >
                        {pkg.hours}
                      </p>
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '11px',
                        color: '#fff',
                        marginBottom: '10px',
                        opacity: 0.95,
                      }}
                    >
                      {pkg.description}
                    </p>

                    {/* Features List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {pkg.features.map((feature, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <i
                            className={feature.available ? 'bi bi-check-lg' : 'bi bi-x-lg'}
                            style={{
                              color: feature.available ? '#00FF00' : '#FF4444',
                              fontSize: '13px',
                              fontWeight: 'bold',
                            }}
                          ></i>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#fff',
                              fontWeight: '500',
                              opacity: feature.available ? 1 : 0.7,
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

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '9px 24px',
                    backgroundColor: '#fff',
                    color: '#000',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  CANCEL
                </button>
                <button
                   onClick={() => (window.location.href = '/user/book-now1')}
                  disabled={!selectedPackage}
                  style={{
                    padding: '9px 24px',
                    backgroundColor: selectedPackage ? '#083A85' : '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: selectedPackage ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPackage) {
                      e.currentTarget.style.backgroundColor = '#062d6b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPackage) {
                      e.currentTarget.style.backgroundColor = '#083A85';
                    }
                  }}
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
