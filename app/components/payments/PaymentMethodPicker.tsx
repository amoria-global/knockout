'use client';

import React, { useState } from 'react';
import { usePaymentOptions } from '@/lib/payments/usePaymentOptions';
import { findCountry } from '@/lib/payments/supportedCountries';
import { iconForOperator, handleLogoError, CARD_ICON } from '@/lib/payments/operatorIcons';
import { CountryPicker } from './CountryPicker';
import type { PaymentOperator } from '@/lib/payments/types';

export interface PaymentMethodSelection {
  /** "card" or the operator id (e.g. "MTN", "AIRTEL", "MPESA") */
  methodId: string;
  /** "MOBILE_MONEY" | "CARD" */
  type: 'MOBILE_MONEY' | 'CARD';
  /** Operator metadata (null for card) */
  operator: PaymentOperator | null;
}

interface Props {
  country: string | null;
  onCountryChange: (iso2: string) => void;
  selectedMethodId: string | null;
  onSelect: (selection: PaymentMethodSelection) => void;
  /** When false, hides the card option (e.g. for payouts which never use card). */
  allowCard?: boolean;
  /** Lock the picker — disables clicks while a payment is in flight. */
  disabled?: boolean;
}

/**
 * Dynamic payment-method grid. Replaces the hardcoded
 * MTN/Airtel/Card buttons in every payment modal.
 *
 * Behavior:
 *   - Loads operators from /api/remote/public/payments/options?country=XX.
 *   - Shows operators as a grid + optional "Card" option.
 *   - If the detected country has no operators, shows CountryPicker
 *     inline so the user can pick a supported one.
 *   - "Change country" link expands CountryPicker even when operators
 *     exist (useful when IP-detection guessed wrong).
 */
export const PaymentMethodPicker: React.FC<Props> = ({
  country, onCountryChange, selectedMethodId, onSelect, allowCard = true, disabled = false,
}) => {
  const { options, loading, supported, error } = usePaymentOptions(country);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const countryMeta = findCountry(country);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        Loading payment options…
      </div>
    );
  }

  // Country picker fallback when the country isn't supported, or the
  // user explicitly clicked "Change country".
  if (!country || !supported || !options || showCountryPicker) {
    return (
      <CountryPicker
        value={country}
        onChange={(iso2) => {
          onCountryChange(iso2);
          setShowCountryPicker(false);
        }}
        title={!supported && country ? 'Mobile money not yet available here' : 'Choose your country'}
        hint={
          !supported && country
            ? `We don't have mobile-money operators for ${country} yet. Pick another country, or use a card.`
            : "We'll show the right operators for your country."
        }
      />
    );
  }

  return (
    <div>
      {/* Detected country pill + "change" link */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px', marginBottom: '12px', flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: '999px', fontSize: '12px', color: '#083A85', fontWeight: 600,
        }}>
          {countryMeta?.flag && <span style={{ fontSize: '14px' }}>{countryMeta.flag}</span>}
          <span>{countryMeta?.name ?? country} · {options.currency}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCountryPicker(true)}
          style={{
            background: 'transparent', border: 'none', color: '#1f6bff',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '4px 6px',
          }}
        >
          Change country
        </button>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '10px' }}>{error}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {options.operators.map(op => (
          <MethodTile
            key={op.id}
            label={op.name}
            image={iconForOperator(op.iconKey)}
            selected={selectedMethodId === op.id}
            disabled={disabled}
            onClick={() => onSelect({ methodId: op.id, type: 'MOBILE_MONEY', operator: op })}
          />
        ))}

        {allowCard && options.supportsCard && (
          <MethodTile
            label="VISA & Master Card"
            image={CARD_ICON}
            selected={selectedMethodId === 'card'}
            disabled={disabled}
            onClick={() => onSelect({ methodId: 'card', type: 'CARD', operator: null })}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Single payment-method tile — real operator logo in a rounded box,
 * brand-blue ring + check badge when selected. Mirrors the tile styling
 * in XentriPayModal so every payment surface looks the same.
 */
const MethodTile: React.FC<{
  label: string;
  image: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, image, selected, disabled = false, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      padding: '16px 8px 14px',
      background: selected ? 'linear-gradient(160deg, #f0f5ff 0%, #ffffff 100%)' : '#ffffff',
      border: selected ? '2px solid #083A85' : '1.5px solid rgba(8,58,133,0.14)',
      borderRadius: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      position: 'relative',
      boxShadow: selected
        ? '0 8px 22px -8px rgba(8,58,133,0.35), 0 1px 0 rgba(255,255,255,0.9) inset'
        : '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(8,58,133,0.04)',
      transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1), border-color 180ms ease, box-shadow 200ms ease, background 200ms ease',
      transform: selected ? 'translateY(-1px)' : 'translateY(0)',
    }}
  >
    {selected && (
      <div style={{
        position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%',
        background: 'linear-gradient(135deg, #083A85 0%, #1f6bff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(8,58,133,0.40)', border: '1.5px solid #ffffff',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    )}
    <div style={{
      width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
      backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(8,58,133,0.10)', boxShadow: '0 1px 2px rgba(8,58,133,0.06)',
      padding: '5px',
    }}>
      <img src={image} alt={label} onError={handleLogoError}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
    <span style={{
      color: selected ? '#083A85' : '#475569',
      fontSize: '11px', fontWeight: selected ? 800 : 600, textAlign: 'center', lineHeight: 1.25,
      fontFamily: "'Pragati Narrow', sans-serif", letterSpacing: '0.01em',
    }}>{label}</span>
  </button>
);
