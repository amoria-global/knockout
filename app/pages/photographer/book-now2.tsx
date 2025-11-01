'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import AmoriaKNavbar from '../../components/navbar';

export default function BookNowPage(): React.JSX.Element {
  const t = useTranslations('booking.step3');
  const tAuth = useTranslations('auth.signupPage');
  // State for the new form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+250');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Sample photographer data
  const photographerData = {
    name: 'Cole Palmer',
    profileImage: 'https://i.pinimg.com/1200x/85/c5/96/85c596eec98acf0645c5c231f3f8b870.jpg',
    availability: 'Monday - Sunday',
    hours: '08:00 AM - 11:50 PM',
    location: 'Rwanda / Musanze',
    minimumEarnings: '$200.00 / Event',
  };

  // Hardcoded booking summary data to match the image
  const bookingSummary = {
    package: 'Essential Package',
    eventDate: '2025-07-24',
    eventTime: '22:00 PM',
    location: 'Musanze, Rwanda',
    eventType: 'Wedding',
  };

  const handleBookNow = () => {
    if (isFormValid()) {
      console.log('Booking submitted:', {
        firstName,
        lastName,
        email,
        phone: `${phoneCode}${phoneNumber}`,
        summary: bookingSummary,
      });
      // Handle final booking submission
    } else {
      console.log('Please fill all required fields and agree to the terms.');
    }
  };

  const handleCancel = () => {
    console.log('Booking cancelled');
    // Navigate back or clear form
  };

  const handlePrevious = () => {
    console.log('Going to previous step');
    // Navigate to the previous step
  };

  const isFormValid = () => {
    return firstName && lastName && email && phoneNumber && agreedToTerms;
  };

  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .photographer-card {
            padding: 24px 16px !important;
            flex-direction: column !important;
          }
          .photographer-info {
            flex-direction: column !important;
            gap: 16px !important;
            align-items: flex-start !important;
          }
          .details-grid {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .profile-image {
            width: 70px !important;
            height: 70px !important;
          }
          .form-row {
            flex-direction: column !important;
          }
          .phone-input-container {
            flex-direction: column !important;
          }
          .phone-code-select {
            width: 100% !important;
            min-width: 100% !important;
          }
          .action-buttons {
            flex-direction: column !important;
          }
          .button-group {
            width: 100%;
            flex-direction: column !important;
          }
          .button-group button {
            width: 100%;
          }
          .previous-button {
            width: 100% !important;
          }
          .main-container {
            padding: 20px 16px 40px !important;
          }
          .back-button {
            padding: 8px 16px !important;
            font-size: 14px !important;
          }
          .contact-form-card {
            padding: 24px 16px !important;
          }
        }
      `}</style>
      <AmoriaKNavbar />
      <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa', position: 'relative' }}>
        {/* Back Button - Overlay at top left */}
        <button
          onClick={() => window.history.back()}
          className="back-button"
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
          <span>{t('back')}</span>
        </button>

        {/* Main Content Container */}
        <div
          className="main-container"
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px 24px 40px',
          }}
        >
          {/* New Layout: Photographer Info at Top, Contact Form Below */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            {/* Top Section: Photographer Information - Horizontal Layout */}
            <div
              className="photographer-card"
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
                  className="profile-image"
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
                <div className="photographer-info" style={{ flex: 1, display: 'flex', gap: '40px', alignItems: 'center' }}>
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
                      {t('professionalPhotographer')}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="details-grid" style={{ display: 'flex', gap: '32px', flex: 1 }}>
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
                        {t('location')}
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
                        {t('startingPrice')}
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

            {/* Bottom Section: Contact Information */}
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
                {t('title')}
              </h1>

              {/* Contact Form Card */}
              <div
                className="contact-form-card"
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '17px',
                  padding: '32px 28px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.3s ease',
                }}
              >

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '16px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                      {tAuth('firstName')}:
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', transition: 'all 0.3s ease' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#083A85';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '16px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                      {tAuth('lastName')}:
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', transition: 'all 0.3s ease' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#083A85';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '16px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    {t('emailLabel')}:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tAuth('emailPlaceholder')}
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', transition: 'all 0.3s ease' }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#083A85';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '16px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    {t('phoneLabel')}:
                  </label>
                  <div className="phone-input-container" style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="phone-code-select"
                      style={{ padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#fff', transition: 'all 0.3s ease', minWidth: '90px' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#083A85';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="+250">+250</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+254">+254</option>
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="123 456 789"
                      style={{ flex: 1, padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', transition: 'all 0.3s ease' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#083A85';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Booking Summary */}
              <div style={{ marginTop: '28px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#083A85', marginBottom: '16px', letterSpacing: '0.3px' }}>
                  {t('bookingSummary')}:
                </h3>
                <div style={{ fontSize: '15px', color: '#374151', display: 'grid', gap: '12px' }}>
                  <p style={{ margin: 0 }}><strong style={{ color: '#111827' }}>{t('package')}:</strong> {bookingSummary.package}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#111827' }}>{t('eventDate')}:</strong> {bookingSummary.eventDate}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#111827' }}>{t('eventTime')}:</strong> {bookingSummary.eventTime}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#111827' }}>{t('location')}:</strong> {bookingSummary.location}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#111827' }}>{t('eventType')}:</strong> {bookingSummary.eventType}</p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
  <input
    type="checkbox"
    id="terms"
    checked={agreedToTerms}
    onChange={(e) => setAgreedToTerms(e.target.checked)}
    style={{ marginRight: '8px', width: '16px', height: '16px' }}
  />
  <label htmlFor="terms" style={{ fontSize: '14px' }}>
    {t('termsText')}{' '}
    <a
      href="/user/terms-of-service"
      style={{
        color: '#083A85',
        fontWeight: 'bold',
        textDecoration: 'underline',
      }}
    >
      {tAuth('termsOfService')}
    </a>.
  </label>
</div>


              {/* Action Buttons */}
              <div
                className="action-buttons"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '28px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '24px'
                }}
              >
                <button
                   onClick={() => (window.location.href = '/user/photographers/book-now1')}
                   className="previous-button"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#fff',
                    color: '#083A85',
                    border: '2px solid #083A85',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    letterSpacing: '0.5px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="bi bi-chevron-left"></i>
                  {t('previous')}
                </button>
                <div className="button-group" style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: '#fff',
                      color: '#374151',
                      border: '2px solid #d1d5db',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
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
                    {t('cancel')}
                  </button>
                  <button
                     onClick={() => (window.location.href = '')}
                    disabled={!isFormValid()}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: isFormValid() ? '#083A85' : '#d1d5db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isFormValid() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      letterSpacing: '0.5px',
                      boxShadow: isFormValid() ? '0 4px 12px rgba(8, 58, 133, 0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (isFormValid()) {
                        e.currentTarget.style.backgroundColor = '#062d6b';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 58, 133, 0.35)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isFormValid()) {
                        e.currentTarget.style.backgroundColor = '#083A85';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.25)';
                      }
                    }}
                  >
                    {t('bookNow')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}