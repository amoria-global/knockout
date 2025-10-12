'use client';
import React, { useState } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import Footer from '../../components/footer';

export default function BookNowPage(): React.JSX.Element {
  // State for the new text area
  const [specialRequests, setSpecialRequests] = useState('');

  // Sample photographer data - this would normally come from props or API
  const photographerData = {
    name: 'cole palmer',
    profileImage: 'https://i.pinimg.com/1200x/85/c5/96/85c596eec98acf0645c5c231f3f8b870.jpg',
    availability: 'Monday - Sunday',
    hours: '08:00 AM - 11:50 PM',
    location: 'Rwanda / Musanze',
    minimumEarnings: '$200.00 / Event',
  };

  const handleNext = () => {
    console.log('Next step with special requests:', specialRequests);
    // Navigate to the next step
  };

  const handleCancel = () => {
    console.log('Booking cancelled');
    // Navigate back or clear form
    setSpecialRequests('');
  };

  const handlePrevious = () => {
    console.log('Going to previous step');
    // Navigate to the previous step (e.g., package selection)
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

            {/* Right Section: Event Details (Updated as per your image) */}
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '400px', // Added to ensure layout consistency
              }}
            >
              <div>
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
                  Event Details
                </h1>

                {/* Special Requests Form */}
                <div>
                  <label
                    htmlFor="specialRequests"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937',
                      marginBottom: '8px',
                    }}
                  >
                    Any Special Requests:
                  </label>
                  <textarea
                    id="specialRequests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any specific shots, requirements or preferences..."
                    style={{
                      width: '100%',
                      height: '180px',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'none',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                <button
                 onClick={() => (window.location.href = '/user/book-now')}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: '#fff',
                    color: '#083A85',
                    border: '1.5px solid #083A85',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
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
                      transition: 'all 0.2s',
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                   onClick={() => (window.location.href = '/user/book-now2')}
                    style={{
                      padding: '9px 24px',
                      backgroundColor: '#083A85',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    NEXT
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