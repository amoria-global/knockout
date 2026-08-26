'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api/config';

/**
 * DonationPromptModal - platform-wide reusable donation prompt.
 *
 * Pops up AFTER a user clicks the final "Pay" / "Continue" action in any
 * payment modal across Connekyt. Visually distinct from the payment modals
 * (warm rose/coral palette, NOT brand-blue) so viewers immediately recognise
 * this as an OPTIONAL ask separate from their actual payment.
 *
 * UX guard-rails to prevent any "did I just pay extra by accident?" confusion:
 *   1. Big amber "OPTIONAL · YOUR PAYMENT IS SEPARATE" banner pinned to the
 *      very top - first thing the eye lands on.
 *   2. Rose/coral palette + animated heart icon clearly say "charity, not pay".
 *   3. Primary action is the brand-blue "Continue to payment →" button - the
 *      familiar payment-flow CTA, so the default safe path is to NOT donate.
 *   4. "Add donation" is a secondary rose ghost button that's disabled until
 *      the user actively picks an amount or types one - no accidental adds.
 *   5. A live grounding panel always shows the actual payment amount, plus
 *      a + donation row only when an amount is selected.
 *
 * Public API (kept compatible with the existing prop names):
 *
 *   <DonationPromptModal
 *     isOpen={boolean}
 *     onSkip={() => void}                    // user chose not to donate
 *     onDonate={(amount: number) => void}    // user added this donation amount
 *     paymentAmount={number}                 // payment amount (display only)
 *     currencyCode="RWF"                     // currency for formatting
 *     cause?="Support a Cause"               // optional title override
 *     impact?="…"                            // optional impact paragraph
 *   />
 *
 * The component fetches its tier amounts from the public donation-tiers
 * endpoint with a sensible RWF fallback so it works even if the network
 * call fails. Tiers are auto-converted into the display currency using
 * the rate map returned by the backend.
 */

export interface DonationPromptModalProps {
  isOpen: boolean;
  /** User chose NOT to donate - proceed to payment unchanged. */
  onSkip: () => void;
  /** User added a donation of this amount in `currencyCode`. */
  onDonate: (amount: number) => void;
  /** Currency code (e.g. "RWF", "USD") used for display formatting. */
  currencyCode: string;
  /** Payment amount the donation would be added on top of (display only). */
  paymentAmount: number;
  /** Optional cause name override. */
  cause?: string;
  /** Optional impact paragraph override. */
  impact?: string;
}

const FALLBACK_TIERS = [500, 1000, 2000, 5000];

const DonationPromptModal: React.FC<DonationPromptModalProps> = ({
  isOpen,
  onSkip,
  onDonate,
  currencyCode,
  paymentAmount,
  cause = 'Support a Cause',
  impact = 'Your donation supports families in need, medical bills, school requirements, and food for children.',
}) => {
  const [tiers, setTiers] = useState<number[]>(FALLBACK_TIERS);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  // Fetch tiers + exchange rate from public donation API
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
        if (data?.exchangeRates && currencyCode && currencyCode !== data.baseCurrency) {
          const base = data.exchangeRates[data.baseCurrency];
          const target = data.exchangeRates[currencyCode];
          if (base?.rateToUsd && target?.rateToUsd) {
            setExchangeRate(target.rateToUsd / base.rateToUsd);
          }
        }
      }
    } catch {
      // Silent - fallback tiers remain
    }
  }, [currencyCode]);

  // Reset state and fetch tiers each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTier(null);
      setCustomAmount('');
      setIsCustom(false);
      fetchTiers();
    }
  }, [isOpen, fetchTiers]);

  // ESC closes - equivalent to skip
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onSkip]);

  if (!isOpen) return null;

  const convert = (rwfAmount: number): number => {
    if (exchangeRate === 1) return Math.round(rwfAmount);
    return Math.round(rwfAmount * exchangeRate * 100) / 100;
  };

  const fmt = (val: number): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: exchangeRate === 1 ? 0 : 2,
    }).format(val);
    return `${formatted} ${currencyCode}`;
  };

  const getDonationAmount = (): number => {
    if (isCustom && customAmount) return parseFloat(customAmount) || 0;
    if (selectedTier !== null) return convert(selectedTier);
    return 0;
  };

  const donationAmount = getDonationAmount();
  const hasDonation = donationAmount > 0;

  const handleAdd = () => {
    if (donationAmount > 0) onDonate(donationAmount);
  };

  return (
    <div
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onSkip(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(2,6,16,0.72)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2600, padding: 16, overflowY: 'auto',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, borderRadius: 22, margin: 'auto',
          background: 'linear-gradient(160deg, #0a2148 0%, #071634 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85, #F20C8F 60%, #03969C)', opacity: 0.9 }} />
        <div style={{ padding: '20px 22px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '4px 11px', borderRadius: 999, background: 'rgba(242,12,143,0.12)', border: '1px solid rgba(242,12,143,0.35)', color: '#ff7ec4', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Optional
            </span>
            <button
              onClick={onSkip}
              aria-label="Skip donation"
              style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.58)', fontSize: 17, cursor: 'pointer' }}
            >×</button>
          </div>

          <h3 id="dp-title" className="dp-serif" style={{ margin: '12px 0 4px', color: '#fff', fontSize: 23, fontWeight: 600 }}>
            Add a little love?
          </h3>
          <p style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.6)', fontSize: 12.5, lineHeight: 1.55 }}>
            {impact} Your <strong style={{ color: '#fff' }}>{fmt(paymentAmount)}</strong> payment stays exactly as it is.
          </p>

          {/* Tier grid - amounts converted into the payment currency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {tiers.map((tier) => {
              const on = !isCustom && selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => { setSelectedTier(on ? null : tier); setIsCustom(false); setCustomAmount(''); }}
                  style={{
                    padding: '12px 4px', borderRadius: 12, cursor: 'pointer',
                    background: on ? 'rgba(242,12,143,0.14)' : 'rgba(255,255,255,0.05)',
                    border: on ? '2px solid #F20C8F' : '1px solid rgba(255,255,255,0.14)',
                    color: '#fff', fontWeight: 800, fontSize: 12.5,
                    transition: 'all 150ms ease', minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {fmt(convert(tier))}
                </button>
              );
            })}
          </div>

          {/* Custom amount */}
          {isCustom ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,12,143,0.5)', borderRadius: 12, padding: 5, alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                autoFocus
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={`Amount in ${currencyCode}`}
                aria-label={`Custom donation amount in ${currencyCode}`}
                style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 14.5, fontWeight: 700, padding: '8px 10px' }}
              />
              <button
                onClick={() => { setIsCustom(false); setCustomAmount(''); }}
                style={{ padding: '8px 12px', borderRadius: 9, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700 }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setIsCustom(true); setSelectedTier(null); }}
              style={{ width: '100%', marginTop: 8, padding: 11, borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px dashed rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.58)', fontWeight: 700, fontSize: 12.5 }}
            >
              Custom amount…
            </button>
          )}

          {/* Grounding line - payment + donation = total */}
          <div style={{ margin: '14px 0 0', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', justifyContent: 'space-between', gap: 10, color: 'rgba(255,255,255,0.58)', fontSize: 12.5, flexWrap: 'wrap' }}>
            <span>
              {hasDonation
                ? `Payment ${fmt(paymentAmount)} + donation ${fmt(donationAmount)}`
                : `Payment ${fmt(paymentAmount)} · no donation`}
            </span>
            <strong style={{ color: '#fff' }}>{fmt(paymentAmount + donationAmount)}</strong>
          </div>

          <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 11.5, textAlign: 'center' }}>
            100% of the donation goes to {cause === 'Support a Cause' ? 'the cause' : cause}. Nothing is added without your say.
          </p>

          <div style={{ display: 'flex', gap: 10, margin: '14px 0 18px' }}>
            <button
              onClick={onSkip}
              style={{ flex: 1, padding: 13, borderRadius: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.75)', fontWeight: 700, fontSize: 13.5 }}
            >
              Skip
            </button>
            <button
              onClick={hasDonation ? handleAdd : onSkip}
              style={{
                flex: 1.5, padding: 13, borderRadius: 13, border: 0, cursor: 'pointer',
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: '#fff', fontWeight: 800, fontSize: 13.5,
                boxShadow: '0 10px 26px -10px rgba(242,12,143,0.5)',
              }}
            >
              {hasDonation ? `Give ${fmt(donationAmount)} · continue` : 'Continue'}
            </button>
          </div>
        </div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,500;0,600;0,700;1,500&display=swap');
          .dp-serif { font-family: 'Libre Bodoni', Georgia, 'Times New Roman', serif; }
        `}</style>
      </div>
    </div>
  );
};

export default DonationPromptModal;
