'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api/config';

/**
 * DonationPromptModal — platform-wide reusable donation prompt.
 *
 * Pops up AFTER a user clicks the final "Pay" / "Continue" action in any
 * payment modal across Connekyt. Visually distinct from the payment modals
 * (warm rose/coral palette, NOT brand-blue) so viewers immediately recognise
 * this as an OPTIONAL ask separate from their actual payment.
 *
 * UX guard-rails to prevent any "did I just pay extra by accident?" confusion:
 *   1. Big amber "OPTIONAL · YOUR PAYMENT IS SEPARATE" banner pinned to the
 *      very top — first thing the eye lands on.
 *   2. Rose/coral palette + animated heart icon clearly say "charity, not pay".
 *   3. Primary action is the brand-blue "Continue to payment →" button — the
 *      familiar payment-flow CTA, so the default safe path is to NOT donate.
 *   4. "Add donation" is a secondary rose ghost button that's disabled until
 *      the user actively picks an amount or types one — no accidental adds.
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
  /** User chose NOT to donate — proceed to payment unchanged. */
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
      // Silent — fallback tiers remain
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

  // ESC closes — equivalent to skip
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
      className="dp-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <div
        className="dp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* OPTIONAL banner — the unmissable "this is not your payment" cue */}
        <div className="dp-optional-banner" aria-hidden="false">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          OPTIONAL · YOUR PAYMENT IS SEPARATE
        </div>

        {/* Close (X) — equivalent to skip */}
        <button
          type="button"
          onClick={onSkip}
          className="dp-close"
          aria-label="Close donation prompt"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Inline header — heart icon + title side-by-side */}
        <div className="dp-header">
          <div className="dp-hero" aria-hidden="true">
            <span className="dp-hero-ring dp-hero-ring--1" />
            <span className="dp-hero-ring dp-hero-ring--2" />
            <div className="dp-hero-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
          <div className="dp-header-text">
            <h2 id="dp-title" className="dp-title">Care to give back?</h2>
            <p className="dp-sub">{cause} · entirely optional</p>
          </div>
        </div>

        {/* Tier grid — 2×2 rose */}
        <div className="dp-tiers">
          {tiers.map((tier) => {
            const converted = convert(tier);
            const sel = !isCustom && selectedTier === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  setSelectedTier(tier);
                  setIsCustom(false);
                  setCustomAmount('');
                }}
                className={`dp-tier ${sel ? 'is-selected' : ''}`}
              >
                {fmt(converted)}
              </button>
            );
          })}
        </div>

        {/* Custom amount row — clearly an editable field with white interior,
            visible border, label, and pencil icon to signal "you can type here". */}
        <label className="dp-custom-label">Or enter custom amount</label>
        <div className={`dp-custom ${isCustom ? 'is-active' : ''}`}>
          <span className="dp-custom-prefix">{currencyCode}</span>
          <input
            type="number"
            placeholder="0"
            value={customAmount}
            min="0"
            inputMode="numeric"
            onFocus={() => {
              setIsCustom(true);
              setSelectedTier(null);
            }}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setIsCustom(true);
              setSelectedTier(null);
            }}
          />
          <span className="dp-custom-edit" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </span>
        </div>

        {/* Impact strip — quick scan of what the donation supports.
            Compact icon row: each pill is a beneficiary category. */}
        <div className="dp-impact-strip" role="list" aria-label="What your donation supports">
          <div className="dp-impact-cell" role="listitem">
            <span className="dp-impact-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className="dp-impact-label">Families</span>
          </div>
          <div className="dp-impact-cell" role="listitem">
            <span className="dp-impact-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            <span className="dp-impact-label">Schools</span>
          </div>
          <div className="dp-impact-cell" role="listitem">
            <span className="dp-impact-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="dp-impact-label">Medical</span>
          </div>
          <div className="dp-impact-cell" role="listitem">
            <span className="dp-impact-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </span>
            <span className="dp-impact-label">Meals</span>
          </div>
        </div>

        {/* Trust line — single concise statement about where 100% goes */}
        <p className="dp-trust">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 12l2 2 4-4" />
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            <strong>100%</strong> goes to vetted local partners. {impact}
          </span>
        </p>

        {/* Grounding panel — visible at all times so the actual payment is
            never hidden, plus a + donation row only when amount is picked. */}
        <div className="dp-grounding">
          <span className="dp-grounding-row">
            <span className="dp-grounding-label">Your payment</span>
            <strong className="dp-grounding-value">{fmt(paymentAmount)}</strong>
          </span>
          {hasDonation && (
            <>
              <span className="dp-grounding-row">
                <span className="dp-grounding-label dp-grounding-label--rose">Donation</span>
                <strong className="dp-grounding-value dp-grounding-value--rose">
                  + {fmt(donationAmount)}
                </strong>
              </span>
              <span className="dp-grounding-row dp-grounding-row--total">
                <span className="dp-grounding-label">Total</span>
                <strong className="dp-grounding-value">
                  {fmt(paymentAmount + donationAmount)}
                </strong>
              </span>
            </>
          )}
        </div>

        {/* Single CTA — label + behavior swap based on whether the user
            has chosen a donation amount. */}
        <div className="dp-actions">
          <button
            type="button"
            onClick={hasDonation ? handleAdd : onSkip}
            className="dp-btn dp-btn--continue"
          >
            {hasDonation ? 'Proceed to payment' : 'Skip and continue to payment'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .dp-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background-color: rgba(11, 14, 21, 0.72);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: dp-fade-in 200ms ease-out;
        }
        @keyframes dp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .dp-modal {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 20px;
          padding: 16px 20px 18px;
          padding-top: 44px;
          box-shadow:
            0 32px 80px -20px rgba(225, 29, 72, 0.30),
            0 14px 32px -12px rgba(225, 29, 72, 0.18),
            0 0 0 1px rgba(244, 63, 94, 0.10),
            0 1px 0 rgba(255, 255, 255, 0.95) inset;
          isolation: isolate;
          overflow: hidden;
          animation: dp-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: 'Pragati Narrow', system-ui, -apple-system, 'Segoe UI', sans-serif;
          color: #1e293b;
        }
        @keyframes dp-pop {
          0%   { opacity: 0; transform: translateY(20px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* OPTIONAL banner — pinned to top, full-width amber */
        .dp-optional-banner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 7px 14px;
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          color: #b45309;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.10em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-bottom: 1px solid rgba(180, 83, 9, 0.18);
          z-index: 2;
        }
        .dp-optional-banner svg { color: #b45309; opacity: 0.85; }

        /* Close button */
        .dp-close {
          position: absolute;
          top: 36px;
          right: 12px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid rgba(244, 63, 94, 0.18);
          background: rgba(244, 63, 94, 0.06);
          color: #9f1239;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          z-index: 3;
          transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background 180ms ease, color 180ms ease;
        }
        .dp-close:hover {
          background: rgba(244, 63, 94, 0.14);
          color: #be123c;
          transform: rotate(90deg) scale(1.05);
        }

        /* Inline header — icon and text on one row */
        .dp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .dp-header-text {
          flex: 1;
          min-width: 0;
        }
        /* Heart hero — smaller for the compact inline layout */
        .dp-hero {
          position: relative;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dp-hero-icon {
          position: relative;
          z-index: 2;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fb7185 0%, #e11d48 60%, #be123c 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.30),
            0 8px 18px -4px rgba(225, 29, 72, 0.55),
            0 0 0 1px rgba(190, 18, 60, 0.18);
          animation: dp-heartbeat 1.4s ease-in-out infinite;
        }
        @keyframes dp-heartbeat {
          0%, 100% { transform: scale(1); }
          25%      { transform: scale(1.08); }
          50%      { transform: scale(1.00); }
          75%      { transform: scale(1.04); }
        }
        .dp-hero-ring {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid rgba(244, 63, 94, 0.40);
          animation: dp-ring 2.4s ease-out infinite;
        }
        .dp-hero-ring--2 { animation-delay: 1.2s; }
        @keyframes dp-ring {
          0%   { transform: scale(0.85); opacity: 0.85; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        /* Title + subtitle — left-aligned, tighter */
        .dp-title {
          margin: 0 0 2px;
          font-size: 17px;
          font-weight: 800;
          color: #9f1239;
          line-height: 1.20;
          text-align: left;
          letter-spacing: -0.005em;
        }
        .dp-sub {
          margin: 0;
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.40;
          text-align: left;
        }

        /* Tier grid — single row of 4 buttons (was 2×2) */
        .dp-tiers {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }
        .dp-tier {
          padding: 9px 4px;
          font-size: 11.5px;
          font-weight: 700;
          font-family: inherit;
          color: #475569;
          background: #ffffff;
          border: 1.5px solid rgba(244, 63, 94, 0.18);
          border-radius: 9px;
          cursor: pointer;
          transition: all 180ms ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dp-tier:hover {
          border-color: rgba(244, 63, 94, 0.45);
          color: #be123c;
        }
        .dp-tier.is-selected {
          background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%);
          border-color: #e11d48;
          color: #ffffff;
          box-shadow: 0 4px 10px -3px rgba(225, 29, 72, 0.45);
        }

        /* Custom amount label — small eyebrow above the field */
        .dp-custom-label {
          display: block;
          font-size: 10.5px;
          font-weight: 800;
          color: #9f1239;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-family: inherit;
        }
        /* Custom amount input — clearly an editable field. White interior,
           bold rose border, edit icon affordance, and a strong focus glow. */
        .dp-custom {
          display: flex;
          align-items: stretch;
          background: #ffffff;
          border: 1.5px solid rgba(244, 63, 94, 0.35);
          border-radius: 10px;
          margin-bottom: 10px;
          overflow: hidden;
          transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }
        .dp-custom:hover { border-color: rgba(244, 63, 94, 0.55); }
        .dp-custom.is-active {
          border-color: #e11d48;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.16);
        }
        /* Currency badge on the left — clearly a non-editable prefix label */
        .dp-custom-prefix {
          padding: 9px 12px;
          font-size: 12.5px;
          font-weight: 800;
          color: #ffffff;
          background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%);
          display: flex;
          align-items: center;
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }
        /* The actual input — bigger text, stronger placeholder color */
        .dp-custom input {
          flex: 1;
          padding: 9px 12px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          font-family: inherit;
          min-width: 0;
        }
        .dp-custom input::placeholder {
          color: #cbd5e1;
          font-weight: 600;
          opacity: 1;
        }
        /* Edit icon on the right — visual affordance "you can type here" */
        .dp-custom-edit {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          color: rgba(244, 63, 94, 0.55);
          flex-shrink: 0;
          pointer-events: none;
          transition: color 180ms ease;
        }
        .dp-custom.is-active .dp-custom-edit { color: #e11d48; }

        /* Impact strip — 4-cell row showing categories the donation supports */
        .dp-impact-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }
        .dp-impact-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 7px 4px 6px;
          background: linear-gradient(180deg, #fff5f5 0%, #ffffff 100%);
          border: 1px solid rgba(244, 63, 94, 0.14);
          border-radius: 9px;
        }
        .dp-impact-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 5px -1px rgba(225, 29, 72, 0.40);
        }
        .dp-impact-label {
          font-size: 10px;
          font-weight: 700;
          color: #9f1239;
          letter-spacing: 0.02em;
          line-height: 1;
        }

        /* Trust line — small but reassuring */
        .dp-trust {
          margin: 0 0 12px;
          padding: 7px 11px;
          background: rgba(16, 185, 129, 0.07);
          border: 1px solid rgba(16, 185, 129, 0.20);
          border-radius: 9px;
          font-size: 11.5px;
          color: #065f46;
          line-height: 1.40;
          display: flex;
          align-items: flex-start;
          gap: 7px;
        }
        .dp-trust svg {
          color: #059669;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .dp-trust strong {
          color: #047857;
          font-weight: 800;
        }

        /* Grounding panel — tighter */
        .dp-grounding {
          background: #f8fafc;
          border: 1px solid rgba(8, 58, 133, 0.10);
          border-radius: 10px;
          padding: 8px 12px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .dp-grounding-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 12px;
        }
        .dp-grounding-row--total {
          padding-top: 5px;
          margin-top: 1px;
          border-top: 1px dashed rgba(8, 58, 133, 0.18);
          font-size: 13px;
        }
        .dp-grounding-label { color: #64748b; }
        .dp-grounding-label--rose { color: #be123c; }
        .dp-grounding-value { color: #0f172a; font-weight: 700; }
        .dp-grounding-value--rose { color: #e11d48; }
        .dp-grounding-row--total .dp-grounding-value {
          color: #083A85;
          font-weight: 800;
        }

        /* Actions — side-by-side row to save vertical height */
        .dp-actions {
          display: flex;
          flex-direction: row;
          gap: 8px;
        }
        .dp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1;
          padding: 11px 12px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          border: 1.5px solid transparent;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 180ms ease, box-shadow 200ms ease, background 180ms ease;
        }
        /* On very narrow screens, stack vertically again */
        @media (max-width: 380px) {
          .dp-actions { flex-direction: column-reverse; }
        }
        /* Continue (primary) — brand-blue, the obvious safe path */
        .dp-btn--continue {
          background: linear-gradient(135deg, #083A85 0%, #0a4da3 50%, #1f6bff 100%);
          color: #ffffff;
          box-shadow:
            0 12px 24px -10px rgba(8, 58, 133, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }
        .dp-btn--continue:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
          box-shadow:
            0 18px 30px -10px rgba(8, 58, 133, 0.65),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }
        .dp-btn--continue:active { transform: translateY(0) scale(0.98); }
        /* Add donation (secondary) — solid rose gradient when an amount is
           selected, so the call-to-action looks confident and clearly clickable.
           Disabled state stays a faint rose so it's obvious you need to pick
           a tier first to enable it. */
        .dp-btn--add {
          background: linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #be123c 100%);
          color: #ffffff;
          border-color: rgba(190, 18, 60, 0.55);
          box-shadow:
            0 12px 24px -10px rgba(225, 29, 72, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }
        .dp-btn--add:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.08);
          box-shadow:
            0 18px 30px -10px rgba(225, 29, 72, 0.70),
            inset 0 1px 0 rgba(255, 255, 255, 0.28);
        }
        .dp-btn--add:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .dp-btn--add:disabled {
          background: rgba(244, 63, 94, 0.06);
          color: rgba(190, 18, 60, 0.55);
          border-color: rgba(244, 63, 94, 0.20);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Mobile */
        @media (max-width: 540px) {
          .dp-modal {
            padding: 14px 16px 16px;
            padding-top: 42px;
            max-width: calc(100vw - 24px);
            border-radius: 18px;
          }
          .dp-tiers { gap: 5px; }
          .dp-tier { padding: 8px 3px; font-size: 11px; }
          .dp-title { font-size: 15px; }
          .dp-sub { font-size: 11.5px; }
          .dp-hero, .dp-hero-icon { width: 40px; height: 40px; }
          .dp-header { gap: 10px; margin-bottom: 12px; }
          .dp-impact-strip { gap: 4px; }
          .dp-impact-cell { padding: 6px 2px 5px; }
          .dp-impact-icon { width: 22px; height: 22px; }
          .dp-impact-label { font-size: 9.5px; }
          .dp-trust { font-size: 11px; padding: 6px 10px; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .dp-backdrop,
          .dp-modal,
          .dp-hero-icon,
          .dp-hero-ring,
          .dp-btn,
          .dp-close { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DonationPromptModal;
