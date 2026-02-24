'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhotographerInfoPage(): React.JSX.Element {
  const router = useRouter();

  const [country, setCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [eventType, setEventType] = useState('');
  const [customEventType, setCustomEventType] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');

  const isDisabled =
    !country ||
    !eventType ||
    !location ||
    !eventDate ||
    !eventTime ||
    (country === 'other' && !customCountry) ||
    (eventType === 'other' && !customEventType);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDisabled) {
      const params = new URLSearchParams({
        country: country === 'other' ? customCountry : country,
        eventType: eventType === 'other' ? customEventType : eventType,
        location,
        eventDate,
        eventTime,
      });

      router.push(`/user/photographers?${params.toString()}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center px-4 py-4 sm:p-4" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-white overflow-hidden flex flex-col items-center justify-center" style={{ borderRadius: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', border: '1px solid #e5e7eb' }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '24px 40px' }}>
          {/* Title */}
          <h1 style={{ fontSize: '22px', fontWeight: '700', textAlign: 'center', color: '#111827', marginBottom: '32px', letterSpacing: '0.3px', lineHeight: '1.3' }}>
            Help Us Find Your Perfect Fit
          </h1>

          {/* Form */}
          <form onSubmit={handleContinue}>
            {/* Country Select */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="country" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Country:
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 16px',
                    fontSize: '15px',
                    fontWeight: '400',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    color: country ? '#111827' : '#9ca3af',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="" disabled>Select Your Country</option>
                  <option value="usa">Rwanda</option>
                  <option value="uk">Kenya</option>
                  <option value="canada">Burundi</option>
                  <option value="australia">Tanzania</option>
                  <option value="india">Uganda</option>
                  <option value="other">Other</option>
                </select>
                <i className="bi bi-chevron-down" style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '16px',
                  color: '#6b7280',
                  pointerEvents: 'none',
                }}></i>
              </div>
            </div>

            {/* Custom Country Input (shown when "Other" is selected) */}
            {country === 'other' && (
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="customCountry" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Please specify your country:
                </label>
                <input
                  type="text"
                  id="customCountry"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  placeholder="Enter your country"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '15px',
                    fontWeight: '400',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                  }}
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
            )}

            {/* Event Type Select */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="eventType" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                Event Type:
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 14px',
                    fontSize: '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: eventType ? '#000000' : '#9ca3af',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>Select Event Type</option>
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="portrait">Portrait Session</option>
                  <option value="family">Family Photos</option>
                  <option value="other">Other</option>
                </select>
                <i className="bi bi-chevron-down" style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '14px',
                  color: '#6b7280',
                  pointerEvents: 'none',
                }}></i>
              </div>
            </div>

            {/* Custom Event Type Input (shown when "Other" is selected) */}
            {eventType === 'other' && (
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="customEventType" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                  Please specify your event type:
                </label>
                <input
                  type="text"
                  id="customEventType"
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  placeholder="Enter your event type"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                  }}
                />
              </div>
            )}

            {/* Location Input */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="location" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                Location:
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event Venue or Address"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontWeight: '400',
                  border: '1.5px solid #d1d5db',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                }}
              />
            </div>

            {/* Event Date and Time Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {/* Event Date Input */}
              <div style={{ flex: 1 }}>
                <label htmlFor="eventDate" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                  Event Date:
                </label>
                <input
                  type="date"
                  id="eventDate"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Event Time Input */}
              <div style={{ flex: 1 }}>
                <label htmlFor="eventTime" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                  Event Time:
                </label>
                <input
                  type="time"
                  id="eventTime"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14px',
                    fontWeight: '400',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Buttons Row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBack}
                style={{
                  padding: '14px 26px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  color: '#083A85',
                  border: '2px solid #083A85',
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
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <i className="bi bi-chevron-left" style={{ fontSize: '16px' }}></i>
                BACK
              </button>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={isDisabled}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  backgroundColor: isDisabled ? '#d1d5db' : '#083A85',
                  color: isDisabled ? '#9ca3af' : '#ffffff',
                  border: 'none',
                  letterSpacing: '0.5px',
                  boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(8, 58, 133, 0.25)',
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = '#062d6b';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 58, 133, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = '#083A85';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.25)';
                  }
                }}
              >
                CONTINUE
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
