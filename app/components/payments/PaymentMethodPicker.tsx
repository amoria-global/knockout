'use client';

import React, { useState } from 'react';
import { usePaymentOptions } from '@/lib/payments/usePaymentOptions';
import { findCountry } from '@/lib/payments/supportedCountries';
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        {options.operators.map(op => {
          const selected = selectedMethodId === op.id;
          return (
            <button
              key={op.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect({ methodId: op.id, type: 'MOBILE_MONEY', operator: op })}
              style={{
                padding: '14px 12px',
                background: selected ? '#EFF6FF' : '#fff',
                border: `1.5px solid ${selected ? '#1f6bff' : '#e5e7eb'}`,
                borderRadius: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 600,
                color: selected ? '#083A85' : '#374151',
                transition: 'border-color 150ms, background 150ms',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>📱</div>
              {op.name}
            </button>
          );
        })}

        {allowCard && options.supportsCard && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect({ methodId: 'card', type: 'CARD', operator: null })}
            style={{
              padding: '14px 12px',
              background: selectedMethodId === 'card' ? '#EFF6FF' : '#fff',
              border: `1.5px solid ${selectedMethodId === 'card' ? '#1f6bff' : '#e5e7eb'}`,
              borderRadius: '12px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 600,
              color: selectedMethodId === 'card' ? '#083A85' : '#374151',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>💳</div>
            Visa / Mastercard
          </button>
        )}
      </div>
    </div>
  );
};
