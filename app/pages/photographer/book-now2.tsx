'use client';
import React, { useState } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import Footer from '../../components/footer';

export default function BookNowPage(): React.JSX.Element {
  // State for the new form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+250');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Sample photographer data
  const photographerData = {
    name: 'cole palmer',
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
      <AmoriaKNavbar />
      <div className="min-h-screen bg-gray-100">
        {/* Main Content Container */}
        <div
          style={{
            maxWidth: '1100px',
            margin: '24px auto',
            padding: '0 20px',
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
            {/* Left Section: Photographer Information (Unchanged) */}
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

            {/* Right Section: Contact Information (Updated as per your image) */}
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
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#000',
                  marginBottom: '24px',
                  textAlign: 'center',
                }}
              >
                Contact Information
              </h1>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                      First Name (Required):
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                      Last Name (Required):
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                    Email Address (Required):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                    Phone Number (Required):
                  </label>
                  <div style={{ display: 'flex' }}>
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px 0 0 4px', borderRight: 'none' }}
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
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '0 4px 4px 0' }}
                    />
                  </div>
                </div>
              </div>

              {/* Booking Summary */}
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Booking Summary:
                </h3>
                <div style={{ fontSize: '14px', color: '#374151', display: 'grid', gap: '8px' }}>
                  <p><b>Package:</b> {bookingSummary.package}</p>
                  <p><b>Event Date:</b> {bookingSummary.eventDate}</p>
                  <p><b>Event Time:</b> {bookingSummary.eventTime}</p>
                  <p><b>Location:</b> {bookingSummary.location}</p>
                  <p><b>Event Type:</b> {bookingSummary.eventType}</p>
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
    I have read and agree to the{' '}
    <a
      href="/user/terms-of-service"
      style={{
        color: '#083A85',
        fontWeight: 'bold',
        textDecoration: 'underline',
      }}
    >
      Terms and Conditions
    </a>{' '}
    of Amoria Connekt.
  </label>
</div>


              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '24px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '20px'
                }}
              >
                <button
                   onClick={() => (window.location.href = '/user/book-now1')}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: '#fff',
                    color: '#083A85',
                    border: '1.5px solid #083A85',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="bi bi-chevron-left"></i>
                  PREVIOUS
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: '9px 24px',
                      backgroundColor: '#fff',
                      color: '#374151',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                     onClick={() => (window.location.href = '')}
                    disabled={!isFormValid()}
                    style={{
                      padding: '9px 24px',
                      backgroundColor: isFormValid() ? '#083A85' : '#9ca3af',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: isFormValid() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    BOOK NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}