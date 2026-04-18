'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api/config';

interface DonationPromptModalProps {
  isOpen: boolean;
  onDonate: (amount: number) => void;
  onSkip: () => void;
  currencyCode: string;
  paymentAmount: number;
}

const FALLBACK_TIERS = [500, 1000, 2000, 5000];

const DonationPromptModal: React.FC<DonationPromptModalProps> = ({
  isOpen,
  onDonate,
  onSkip,
  currencyCode,
  paymentAmount,
}) => {
  const [tiers, setTiers] = useState<number[]>(FALLBACK_TIERS);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [baseCurrency, setBaseCurrency] = useState('RWF');

  const fetchTiers = useCallback(async () => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}${API_ENDPOINTS.PUBLIC.DONATION_TIERS}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data?.tiers?.length) {
          setTiers(data.tiers.map((t: { amount: number }) => t.amount));
        }
        if (data?.baseCurrency) {
          setBaseCurrency(data.baseCurrency);
        }
        if (data?.exchangeRates && currencyCode && currencyCode !== data.baseCurrency) {
          const base = data.exchangeRates[data.baseCurrency];
          const target = data.exchangeRates[currencyCode];
          if (base?.rateToUsd && target?.rateToUsd) {
            setExchangeRate(target.rateToUsd / base.rateToUsd);
          }
        }
      }
    } catch {
      // Use fallback tiers
    }
  }, [currencyCode]);

  useEffect(() => {
    if (isOpen) {
      fetchTiers();
      setSelectedTier(null);
      setCustomAmount('');
      setIsCustom(false);
    }
  }, [isOpen, fetchTiers]);

  if (!isOpen) return null;

  const convert = (rwfAmount: number): number => {
    if (exchangeRate === 1) return Math.round(rwfAmount);
    return Math.round(rwfAmount * exchangeRate * 100) / 100;
  };

  const formatAmount = (val: number): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: exchangeRate === 1 ? 0 : 2,
    }).format(val);
    return `${formatted} ${currencyCode}`;
  };

  const getDonationAmount = (): number => {
    if (isCustom && customAmount) {
      return parseFloat(customAmount) || 0;
    }
    if (selectedTier !== null) {
      return convert(selectedTier);
    }
    return 0;
  };

  const canDonate = getDonationAmount() > 0;

  const handleDonate = () => {
    const amt = getDonationAmount();
    if (amt > 0) onDonate(amt);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(8,58,133,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1999,
        backdropFilter: 'blur(8px)',
        padding: '16px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: 'clamp(20px, 4vw, 32px)',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          border: '1px solid rgba(8,58,133,0.06)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
          }}>
            <i className="bi bi-heart-fill" style={{ fontSize: '24px', color: '#fff' }}></i>
          </div>
          <h2 style={{
            fontSize: 'clamp(18px, 4vw, 22px)',
            fontWeight: '700',
            color: '#083A85',
            marginBottom: '6px',
            fontFamily: "'Pragati Narrow', sans-serif",
          }}>
            Support a Cause
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
            Your donation helps support vulnerable families, educate children, and empower those in need.
          </p>
        </div>

        {/* Payment context */}
        <div style={{
          backgroundColor: '#f0f5ff',
          border: '1px solid #dbeafe',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '13px', color: '#4b5563' }}>Your payment</span>
          <strong style={{ fontSize: '14px', color: '#083A85' }}>{formatAmount(paymentAmount)}</strong>
        </div>

        {/* Tier buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          marginBottom: '12px',
        }}>
          {tiers.map((tier) => {
            const convertedAmount = convert(tier);
            const isSelected = !isCustom && selectedTier === tier;
            return (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier);
                  setIsCustom(false);
                  setCustomAmount('');
                }}
                style={{
                  padding: '12px 8px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #083A85' : '2px solid #e5e7eb',
                  backgroundColor: isSelected ? '#f0f5ff' : '#fff',
                  color: isSelected ? '#083A85' : '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {formatAmount(convertedAmount)}
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div style={{ marginBottom: '20px' }}>
          <div
            onClick={() => {
              setIsCustom(true);
              setSelectedTier(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              border: isCustom ? '2px solid #083A85' : '2px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: isCustom ? '#f0f5ff' : '#fff',
              transition: 'all 0.2s',
            }}
          >
            <span style={{
              padding: '10px 14px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280',
              backgroundColor: isCustom ? '#dbeafe' : '#f9fafb',
              borderRight: '1px solid #e5e7eb',
            }}>
              {currencyCode}
            </span>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setIsCustom(true);
                setSelectedTier(null);
              }}
              onFocus={() => {
                setIsCustom(true);
                setSelectedTier(null);
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: 'transparent',
                color: '#1f2937',
              }}
              min="1"
            />
          </div>
        </div>

        {/* Total display when donation selected */}
        {canDonate && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#166534',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Payment:</span>
              <strong>{formatAmount(paymentAmount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Donation:</span>
              <strong style={{ color: '#e11d48' }}>{formatAmount(getDonationAmount())}</strong>
            </div>
            <div style={{
              borderTop: '1px solid #bbf7d0',
              paddingTop: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '700',
              fontSize: '14px',
            }}>
              <span>Total:</span>
              <span>{formatAmount(paymentAmount + getDonationAmount())}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleDonate}
            disabled={!canDonate}
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: canDonate ? '#083A85' : '#d1d5db',
              color: canDonate ? '#fff' : '#9ca3af',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: canDonate ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <i className="bi bi-heart-fill" style={{ fontSize: '16px' }}></i>
            Add Donation & Continue
          </button>

          <button
            onClick={onSkip}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#fff',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Skip, continue to payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationPromptModal;
