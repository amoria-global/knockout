'use client';

import React, { useState } from 'react';

export interface ViewerInfoData {
  name: string;
  email: string;
  phone: string;
}

interface ViewerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ViewerInfoData) => void;
  loading?: boolean;
  error?: string;
}

const ViewerInfoModal: React.FC<ViewerInfoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) {
      setValidationError('Name is required');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!phone.trim()) {
      setValidationError('Phone number is required');
      return;
    }
    setValidationError('');
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  };

  const displayError = error || validationError;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 440, background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(3,150,156,0.15)', position: 'relative', margin: 'auto' }}>
        {/* Close button */}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #03969c, #027a7f)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <i className="bi bi-person-fill" style={{ fontSize: 22, color: '#fff' }}></i>
          </div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
            Your Details
          </h2>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
            Quick info to get your stream access
          </p>
        </div>

        {/* Error */}
        {displayError && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: 14, marginTop: 1, flexShrink: 0 }}></i>
            <span style={{ color: '#fca5a5', fontSize: 13 }}>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setValidationError(''); }}
              placeholder="Your full name"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setValidationError(''); }}
              placeholder="your@email.com"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setValidationError(''); }}
              placeholder="078XXXXXXX"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#03969c'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #03969c, #027a7f)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-right-circle-fill"></i>
                Continue
              </>
            )}
          </button>

          <p style={{ color: '#6b7280', fontSize: 11, textAlign: 'center', margin: '4px 0 0' }}>
            No account needed. Your details are only used for this event.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ViewerInfoModal;
