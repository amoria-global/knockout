'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AmoriaKNavbar from '../../components/navbar';

// Event data matching the events.tsx page
const eventsData = [
  {
    id: 1,
    title: 'APR BBC Vs Espoir BCC',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
    category: 'Sports',
    date: '2025-08-15',
    time: '08:00 AM - 11:50 PM',
    location: 'BK Arena - KN 4 Ave, Kigali',
    status: 'LIVE',
    price: 15000,
    attendees: 450,
    organizer: 'Rwanda Basketball Federation',
  },
  {
    id: 2,
    title: 'Joseph & Solange Wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
    category: 'Wedding',
    date: '2025-07-20',
    time: '10:00 AM - 06:00 PM',
    location: 'Kigali Serena Hotel - KN 3 Ave, Kigali',
    status: 'LIVE',
    price: 50000,
    attendees: 200,
    organizer: 'Joseph & Solange',
  },
  {
    id: 3,
    title: '2021 Graduation Ceremony',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
    category: 'Academic',
    date: '2025-09-10',
    time: '09:00 AM - 02:00 PM',
    location: 'University of Rwanda - KK 737 St, Kigali',
    status: 'LIVE',
    price: 0,
    attendees: 1500,
    organizer: 'University of Rwanda',
  },
  {
    id: 4,
    title: 'Zuba Sisterhood',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80',
    category: 'Gathering',
    date: '2025-08-05',
    time: '03:00 PM - 07:00 PM',
    location: 'Inema Arts Center - KG 518 St, Kigali',
    status: 'LIVE',
    price: 10000,
    attendees: 80,
    organizer: 'Zuba Foundation',
  },
];

function JoinPackageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState<number | ''>('');
  const [showPeopleInput, setShowPeopleInput] = useState(false);
  const [peopleInputError, setPeopleInputError] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get event data based on ID from URL
  const selectedEvent = eventsData.find(e => e.id === Number(eventId)) || eventsData[0];

  // Calculate group discount (10%)
  const discountPercentage = 10;
  const individualFee = selectedEvent.price;
  const discountedFeePerPerson = individualFee * (1 - discountPercentage / 100);
  const peopleCount = typeof numberOfPeople === 'number' ? numberOfPeople : 0;
  const totalGroupFee = discountedFeePerPerson * peopleCount;
  const totalSavings = (individualFee * peopleCount) - totalGroupFee;

  const packages = [
    {
      id: 'individual',
      name: 'Individual Stream',
      badge: 'Solo',
      badgeColor: '#22D3EE',
      badgeGradient: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)',
      description: 'Stream the event alone on your personal device',
      price: `${individualFee.toLocaleString()} RWF`,
      priceNote: 'One-time access fee',
      features: [
        { text: 'Personal stream access', available: true },
        { text: 'HD quality streaming', available: true },
        { text: 'Watch on any device', available: true },
        { text: 'Instant access after payment', available: true },
        { text: 'Shareable link for others', available: false },
        { text: 'Group discount savings', available: false },
      ],
    },
    {
      id: 'group',
      name: 'Group Stream',
      badge: 'Group',
      badgeColor: '#FBBF24',
      badgeGradient: 'linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)',
      description: 'Buy stream access for multiple people and save 10%',
      price: 'Save up to 10% from discount',
      priceNote: 'Enter number of people below',
      features: [
        { text: 'Multiple stream links', available: true },
        { text: 'HD quality streaming', available: true },
        { text: 'Watch on any device', available: true },
        { text: 'Instant access after payment', available: true },
        { text: 'Shareable unique links', available: true },
        { text: '10% group discount', available: true },
      ],
    },
  ];

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    if (packageId === 'group') {
      setShowPeopleInput(true);
    } else {
      setShowPeopleInput(false);
    }
  };

  const handleCancel = () => {
    setSelectedPackage(null);
    setShowPeopleInput(false);
    setNumberOfPeople('');
    setPeopleInputError('');
  };

  // Check if group package input is valid
  const isGroupInputValid = () => {
    return typeof numberOfPeople === 'number' && numberOfPeople >= 2;
  };

  const handleProceed = () => {
    if (selectedPackage === 'individual') {
      window.location.href = `/user/events/join-event?id=${selectedEvent.id}&package=individual`;
    } else if (selectedPackage === 'group' && isGroupInputValid()) {
      window.location.href = `/user/events/join-event?id=${selectedEvent.id}&package=group&people=${numberOfPeople}`;
    }
  };

  const handlePeopleChange = (value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) {
      setPeopleInputError('Please enter numbers only');
      return;
    }

    if (value === '') {
      setNumberOfPeople('');
      setPeopleInputError('Please enter number of people');
      return;
    }

    const num = parseInt(value, 10);

    if (num < 2) {
      setNumberOfPeople(num);
      setPeopleInputError('Minimum 2 people required');
    } else {
      setNumberOfPeople(num);
      setPeopleInputError('');
    }
  };

  return (
    <>
      <AmoriaKNavbar />
      <div className="min-h-screen" style={{ backgroundColor: '#f0f4f8', position: 'relative' }}>
        {/* Main Content Container */}
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: isMobile ? '32px 16px 40px' : '40px 24px 40px',
          }}
        >
          {/* Page Header */}
          <div style={{ marginBottom: isMobile ? '24px' : '32px', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: isMobile ? '26px' : '40px',
                fontWeight: '900',
                color: '#083A85',
                marginBottom: '8px',
              }}
            >
              Choose Your Stream Package
            </h1>
            <p style={{ fontSize: isMobile ? '14px' : '18px', color: '#40444d', maxWidth: '600px', margin: '0 auto' }}>
              Select how you want to watch this live event
            </p>
          </div>

          {/* Package Cards Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '24px' : '24px',
            marginBottom: '32px',
            alignItems: 'start',
          }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handlePackageSelect(pkg.id)}
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

                {/* Badge */}
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
                      color: pkg.id === 'group' ? '#1f2937' : '#fff',
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
                  {/* Package Icon */}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: pkg.badgeGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <i
                      className={pkg.id === 'individual' ? 'bi bi-person-fill' : 'bi bi-people-fill'}
                      style={{ color: '#fff', fontSize: '28px' }}
                    ></i>
                  </div>

                  {/* Package Name */}
                  <h3
                    style={{
                      fontSize: selectedPackage === pkg.id ? '22px' : '25px',
                      fontWeight: '800',
                      color: selectedPackage === pkg.id ? '#083A85' : '#1f2937',
                      marginBottom: '8px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {pkg.name}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#6b7280',
                      marginBottom: '16px',
                    }}
                  >
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div
                    className={pkg.id === 'group' ? 'discount-bounce' : ''}
                    style={{
                      fontSize: pkg.id === 'group'
                        ? (selectedPackage === pkg.id ? '24px' : '22px')
                        : (selectedPackage === pkg.id ? (isMobile ? '48px' : '56px') : (isMobile ? '42px' : '48px')),
                      fontWeight: '900',
                      background: pkg.id === 'group'
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
                        : 'none',
                      WebkitBackgroundClip: pkg.id === 'group' ? 'text' : 'unset',
                      WebkitTextFillColor: pkg.id === 'group' ? 'transparent' : 'unset',
                      backgroundClip: pkg.id === 'group' ? 'text' : 'unset',
                      color: pkg.id === 'group' ? 'transparent' : (selectedPackage === pkg.id ? '#083A85' : '#1f2937'),
                      lineHeight: 1,
                      marginBottom: '6px',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                    }}
                  >
                    {pkg.price}
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      color: '#6b7280',
                      marginBottom: '16px',
                    }}
                  >
                    {pkg.priceNote}
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      height: selectedPackage === pkg.id ? '2px' : '1px',
                      backgroundColor: selectedPackage === pkg.id ? '#00BFFF' : '#e5e7eb',
                      margin: '26px 0',
                      transition: 'all 0.3s ease',
                    }}
                  ></div>

                  {/* Features List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: selectedPackage === pkg.id ? '12px' : '10px', transition: 'all 0.3s ease' }}>
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
                              fontSize: selectedPackage === pkg.id ? '18px' : '17px',
                              transition: 'all 0.3s ease',
                            }}
                          ></i>
                        ) : (
                          <i
                            className="bi bi-x-circle"
                            style={{
                              color: '#d1d5db',
                              fontSize: selectedPackage === pkg.id ? '18px' : '17px',
                              transition: 'all 0.3s ease',
                            }}
                          ></i>
                        )}
                        <span
                          style={{
                            fontSize: selectedPackage === pkg.id ? '15px' : '15px',
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

                  {/* Group Package - People Input (only when selected) */}
                  {pkg.id === 'group' && selectedPackage === 'group' && (
                    <div
                      style={{
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px dashed #00BFFF',
                        animation: 'fadeIn 0.3s ease',
                      }}
                    >
                      <label
                        style={{
                          display: 'block',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#083A85',
                          marginBottom: '12px',
                        }}
                      >
                        <i className="bi bi-people-fill" style={{ marginRight: '8px', fontSize: '18px' }}></i>
                        Number of People (including you) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Enter number (min. 2)"
                          value={numberOfPeople}
                          onChange={(e) => handlePeopleChange(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            // Prevent non-numeric keys except backspace, delete, arrows
                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                              e.preventDefault();
                              setPeopleInputError('Please enter numbers only');
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 20px',
                            fontSize: '15px',
                            fontWeight: '800',
                            textAlign: 'center',
                            backgroundColor: peopleInputError ? '#fef2f2' : '#f0fdf4',
                            border: peopleInputError ? '3px solid #ef4444' : '3px solid #10b981',
                            borderRadius: '14px',
                            color: '#083A85',
                            outline: 'none',
                            boxSizing: 'border-box',
                            boxShadow: peopleInputError
                              ? '0 0 0 4px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(239, 68, 68, 0.2)'
                              : '0 0 0 4px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.3s ease',
                          }}
                        />
                        {isGroupInputValid() && (
                          <div
                            style={{
                              position: 'absolute',
                              right: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: '16px' }}></i>
                          </div>
                        )}
                      </div>
                      {peopleInputError ? (
                        <p style={{
                          fontSize: '13px',
                          color: '#ef4444',
                          marginTop: '8px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {peopleInputError}
                        </p>
                      ) : (
                        <p style={{ fontSize: '13px', color: '#10b981', marginTop: '8px', fontWeight: '500' }}>
                          <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
                          Enter how many people will access the stream, including you
                        </p>
                      )}

                      {/* Price Breakdown - only show when valid input */}
                      {isGroupInputValid() && (
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
                            <span style={{ fontSize: '14px', color: '#374151' }}>Original price ({peopleCount} x {individualFee.toLocaleString()} RWF)</span>
                            <span style={{ fontSize: '14px', color: '#374151', textDecoration: 'line-through' }}>
                              {(individualFee * peopleCount).toLocaleString()} RWF
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>10% Group Discount</span>
                            <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                              -{totalSavings.toLocaleString()} RWF
                            </span>
                          </div>
                          <div
                            style={{
                              height: '1px',
                              backgroundColor: '#10b981',
                              margin: '8px 0',
                            }}
                          ></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '16px', color: '#047857', fontWeight: '700' }}>Total to Pay</span>
                            <span style={{ fontSize: '18px', color: '#047857', fontWeight: '800' }}>
                              {totalGroupFee.toLocaleString()} RWF
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom padding area with Select indicator */}
                <div style={{ padding: selectedPackage === pkg.id ? '16px 20px 20px' : '12px 16px', transition: 'all 0.3s ease' }}>
                  {selectedPackage === pkg.id ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
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
                        Click &quot;Proceed&quot; to continue
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
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={!selectedPackage || (selectedPackage === 'group' && !isGroupInputValid())}
              style={{
                padding: '14px 40px',
                backgroundColor: (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) ? '#083A85' : '#d1d5db',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) ? '0 8px 20px rgba(8, 58, 133, 0.35)' : 'none',
                minWidth: isMobile ? '100%' : '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) {
                  e.currentTarget.style.backgroundColor = '#062d6b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 58, 133, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPackage === 'individual' || (selectedPackage === 'group' && isGroupInputValid())) {
                  e.currentTarget.style.backgroundColor = '#083A85';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(8, 58, 133, 0.35)';
                }
              }}
            >
              Proceed
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>       
        </div>
      </div>

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
        @keyframes discountBounce {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          12% {
            transform: rotate(-4deg) scale(1.4);
          }
          24% {
            transform: rotate(4deg) scale(1.3);
          }
          36% {
            transform: rotate(-3deg) scale(1.35);
          }
          48% {
            transform: rotate(3deg) scale(1.25);
          }
          60%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }
        .discount-bounce {
          animation: discountBounce 1.8s ease-in-out infinite;
          transform-origin: center center;
          display: inline-block;
        }
      `}</style>
    </>
  );
}

export default function JoinPackagePage(): React.JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinPackageContent />
    </Suspense>
  );
}
