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
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(8,58,133,0.4)', backdropFilter: 'blur(8px)', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#ffffff', border: '1px solid rgba(8,58,133,0.08)', borderRadius: 20, padding: 'clamp(24px, 5vw, 36px)', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', position: 'relative', margin: 'auto' }}>
        {/* Close button */}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(8,58,133,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <i className="bi bi-person-fill" style={{ fontSize: 22, color: '#083A85' }}></i>
          </div>
          <h2 style={{ color: '#0f172a', fontSize: 18, fontWeight: 800, margin: '0 0 6px', fontFamily: "'Pragati Narrow', sans-serif" }}>
            Your Details
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Quick info to get your stream access
          </p>
        </div>

        {/* Error */}
        {displayError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <i className="bi bi-exclamation-circle-fill" style={{ color: '#991b1b', fontSize: 14, flexShrink: 0 }}></i>
            <span style={{ color: '#991b1b', fontSize: 13 }}>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              <i className="bi bi-person" style={{ fontSize: 13 }}></i> Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setValidationError(''); }}
              placeholder="Your full name"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid rgba(8,58,133,0.1)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,58,133,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                <i className="bi bi-envelope" style={{ fontSize: 12 }}></i> Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setValidationError(''); }}
                placeholder="your@email.com"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid rgba(8,58,133,0.1)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,58,133,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                <i className="bi bi-phone" style={{ fontSize: 12 }}></i> Phone <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setValidationError(''); }}
                placeholder="078XXXXXXX"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1.5px solid rgba(8,58,133,0.1)', borderRadius: 10, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,58,133,0.08)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #083A85, #0a4da3)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(8,58,133,0.25)',
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

          <p style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', margin: '4px 0 0' }}>
            <i className="bi bi-lock" style={{ marginRight: 4, fontSize: 10 }}></i>
            No account needed. Your details are only used for this event.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ViewerInfoModal;
