'use client';

import React from 'react';

interface DeviceSwitchModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const DeviceSwitchModal: React.FC<DeviceSwitchModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'linear-gradient(145deg, #141418 0%, #1a1a24 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', position: 'relative', textAlign: 'center' }}>
        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <i className="bi bi-phone-flip" style={{ fontSize: 26, color: '#fff' }}></i>
        </div>

        <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
          Switch Device?
        </h3>
        <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
          You&apos;re currently watching on another device. Would you like to switch to this one? The other device will lose access.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: '#d1d5db',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Switching...
              </>
            ) : (
              'Switch Device'
            )}
          </button>
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

export default DeviceSwitchModal;
