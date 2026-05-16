'use client';

import React, { useEffect, useMemo } from 'react';

/**
 * AppreciationModal - celebratory pop-up shown after a viewer completes
 * a gift or donation payment. Reusable across the platform anywhere a
 * viewer's generosity should be acknowledged.
 *
 * Two themed variants:
 *   • type="gift"     - emerald green palette, gift icon, "Thank you for the gift!"
 *   • type="donation" - rose-coral palette, heart icon, "Thank you for giving back!"
 *
 * Visual highlights:
 *   • Full-screen blurred backdrop so the celebration owns the screen
 *   • Animated hero icon with double pulse rings + heartbeat scaling
 *   • Confetti burst (12 particles) drifting upward + rotating in random tones
 *   • Title fades up with a subtle gradient sheen
 *   • Amount card grounding the user with what they actually sent
 *   • Primary "Awesome ❤" button + an auto-close countdown ring
 *
 * Auto-closes after 8 seconds (cancellable by hovering or clicking close).
 *
 * Public API:
 *
 *   <AppreciationModal
 *     isOpen={boolean}
 *     onClose={() => void}
 *     type="gift" | "donation"
 *     amount={number}
 *     currencyCode="RWF"
 *     recipientName?="Joseph"        // "for {name}" line
 *     cause?="Support a Cause"       // donation impact line
 *   />
 */

export type AppreciationType = 'gift' | 'donation';

export interface AppreciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AppreciationType;
  amount: number;
  currencyCode?: string;
  recipientName?: string;
  cause?: string;
  /** Auto-close delay in ms (default 8000). Pass 0 to disable. */
  autoCloseMs?: number;
}

const PALETTES = {
  gift: {
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#047857',
    primaryDeep: '#065f46',
    bgLight: '#ecfdf5',
    bgMid: '#d1fae5',
    glow: 'rgba(16, 185, 129, 0.55)',
    confetti: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f472b6', '#60a5fa'],
  },
  donation: {
    primary: '#e11d48',
    primaryLight: '#fb7185',
    primaryDark: '#be123c',
    primaryDeep: '#9f1239',
    bgLight: '#fff1f2',
    bgMid: '#ffe4e6',
    glow: 'rgba(225, 29, 72, 0.55)',
    confetti: ['#e11d48', '#fb7185', '#fda4af', '#fbbf24', '#a78bfa', '#60a5fa'],
  },
} as const;

const AppreciationModal: React.FC<AppreciationModalProps> = ({
  isOpen,
  onClose,
  type,
  amount,
  currencyCode = 'RWF',
  recipientName,
  cause,
  autoCloseMs = 8000,
}) => {
  const palette = PALETTES[type];
  const isGift = type === 'gift';

  // Pre-compute confetti particle positions/colors once per session
  const confetti = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.6}s`,
      duration: `${1.6 + Math.random() * 1.6}s`,
      color: palette.confetti[i % palette.confetti.length],
      rotate: `${Math.random() * 720 - 360}deg`,
      size: `${6 + Math.random() * 6}px`,
      shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'triangle',
    }));
  }, [palette.confetti, isOpen]);

  // ESC closes
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Auto-close timer
  useEffect(() => {
    if (!isOpen || !autoCloseMs) return;
    const t = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(t);
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  const fmt = `${new Intl.NumberFormat('en-US').format(amount)} ${currencyCode}`;

  const eyebrowText = isGift ? 'GIFT SENT' : 'DONATION RECEIVED';
  const titleText = isGift ? "You're amazing!" : 'Thank you for giving back!';
  const subText = isGift
    ? recipientName
      ? <>Your gift just made <strong>{recipientName}</strong>&apos;s day. ✨</>
      : <>Your gift just made the host&apos;s day. ✨</>
    : <>Your generosity reaches <strong>real families</strong> through vetted local partners.</>;

  return (
    <div
      className="ap-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Confetti burst floating across the whole backdrop */}
      <div className="ap-confetti" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            className={`ap-confetti-piece ap-confetti-piece--${c.shape}`}
            style={{
              left: c.left,
              backgroundColor: c.shape !== 'triangle' ? c.color : undefined,
              borderBottomColor: c.shape === 'triangle' ? c.color : undefined,
              width: c.shape !== 'triangle' ? c.size : undefined,
              height: c.shape !== 'triangle' ? c.size : undefined,
              animationDelay: c.delay,
              animationDuration: c.duration,
              ['--ap-rotate' as string]: c.rotate,
            }}
          />
        ))}
      </div>

      <div
        className={`ap-modal ap-modal--${type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ap-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close (X) */}
        <button
          type="button"
          onClick={onClose}
          className="ap-close"
          aria-label="Close appreciation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Eyebrow pill */}
        <div className="ap-eyebrow">
          <span className="ap-eyebrow-dot" />
          {eyebrowText}
        </div>

        {/* Hero icon - gift box for gifts, heart for donations */}
        <div className="ap-hero" aria-hidden="true">
          <span className="ap-hero-ring ap-hero-ring--1" />
          <span className="ap-hero-ring ap-hero-ring--2" />
          <div className="ap-hero-icon">
            {isGift ? (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 12v10H4V12" />
                <path d="M2 7h20v5H2z" />
                <path d="M12 22V7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
          </div>
        </div>

        <h2 id="ap-title" className="ap-title">{titleText}</h2>
        <p className="ap-sub">{subText}</p>

        {/* Amount card - what they sent */}
        <div className="ap-amount-card">
          <span className="ap-amount-label">
            {isGift ? 'You sent' : 'You donated'}
          </span>
          <strong className="ap-amount-value">{fmt}</strong>
        </div>

        {/* Donation cause line - only when applicable */}
        {!isGift && cause && (
          <p className="ap-cause">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 12l2 2 4-4" />
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span><strong>100%</strong> goes to vetted local partners</span>
          </p>
        )}

        {/* Primary action */}
        <button
          type="button"
          onClick={onClose}
          className="ap-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {isGift ? "You're awesome" : 'Bless you'}
        </button>

        {/* Auto-close progress bar */}
        {autoCloseMs > 0 && (
          <div className="ap-progress" aria-hidden="true">
            <span style={{ animationDuration: `${autoCloseMs}ms` }} />
          </div>
        )}
      </div>

      <style jsx>{`
        .ap-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background-color: rgba(8, 11, 19, 0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: ap-fade-in 280ms ease-out;
          overflow: hidden;
        }
        @keyframes ap-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Confetti - 14 particles dropping from above with rotation */
        .ap-confetti {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .ap-confetti-piece {
          position: absolute;
          top: -20px;
          will-change: transform, opacity;
          animation: ap-confetti-fall linear forwards;
          opacity: 0;
        }
        .ap-confetti-piece--circle {
          border-radius: 50%;
        }
        .ap-confetti-piece--square {
          border-radius: 2px;
        }
        .ap-confetti-piece--triangle {
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom-style: solid;
          border-bottom-width: 12px;
        }
        @keyframes ap-confetti-fall {
          0%   { transform: translateY(-30px) rotate(0); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(var(--ap-rotate)); opacity: 0; }
        }

        /* Modal card */
        .ap-modal {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 22px;
          padding: 28px 24px 22px;
          isolation: isolate;
          overflow: hidden;
          font-family: 'Pragati Narrow', system-ui, -apple-system, 'Segoe UI', sans-serif;
          color: #1e293b;
          text-align: center;
          animation: ap-pop 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes ap-pop {
          0%   { opacity: 0; transform: scale(0.85) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ap-modal--gift {
          background: linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%);
          box-shadow:
            0 40px 100px -20px rgba(16, 185, 129, 0.40),
            0 18px 40px -12px rgba(4, 120, 87, 0.20),
            0 0 0 1px rgba(16, 185, 129, 0.12);
        }
        .ap-modal--donation {
          background: linear-gradient(180deg, #ffffff 0%, #fff1f2 100%);
          box-shadow:
            0 40px 100px -20px rgba(225, 29, 72, 0.40),
            0 18px 40px -12px rgba(190, 18, 60, 0.20),
            0 0 0 1px rgba(244, 63, 94, 0.12);
        }

        /* Close button */
        .ap-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(15, 23, 42, 0.10);
          background: rgba(15, 23, 42, 0.04);
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          z-index: 3;
          transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background 180ms ease, color 180ms ease;
        }
        .ap-close:hover {
          background: rgba(15, 23, 42, 0.10);
          color: #0f172a;
          transform: rotate(90deg) scale(1.05);
        }

        /* Eyebrow pill */
        .ap-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px 4px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          margin-bottom: 14px;
        }
        .ap-modal--gift .ap-eyebrow {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid rgba(4, 120, 87, 0.30);
        }
        .ap-modal--donation .ap-eyebrow {
          background: #ffe4e6;
          color: #9f1239;
          border: 1px solid rgba(190, 18, 60, 0.30);
        }
        .ap-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: ap-eyebrow-blink 1.2s ease-in-out infinite;
        }
        @keyframes ap-eyebrow-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.40; }
        }

        /* Hero icon */
        .ap-hero {
          position: relative;
          width: 86px;
          height: 86px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ap-hero-icon {
          position: relative;
          z-index: 2;
          width: 86px;
          height: 86px;
          border-radius: 50%;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ap-heartbeat 1.4s ease-in-out infinite;
        }
        .ap-modal--gift .ap-hero-icon {
          background: radial-gradient(circle at 35% 30%, #6ee7b7 0%, #10b981 60%, #047857 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.30),
            0 16px 36px -8px rgba(16, 185, 129, 0.55),
            0 0 0 1px rgba(4, 120, 87, 0.18);
        }
        .ap-modal--donation .ap-hero-icon {
          background: radial-gradient(circle at 35% 30%, #fb7185 0%, #e11d48 60%, #be123c 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.30),
            0 16px 36px -8px rgba(225, 29, 72, 0.55),
            0 0 0 1px rgba(190, 18, 60, 0.18);
        }
        @keyframes ap-heartbeat {
          0%, 100% { transform: scale(1); }
          25%      { transform: scale(1.10); }
          50%      { transform: scale(1.00); }
          75%      { transform: scale(1.05); }
        }
        .ap-hero-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid;
          animation: ap-ring 2.6s ease-out infinite;
        }
        .ap-modal--gift .ap-hero-ring { border-color: rgba(16, 185, 129, 0.45); }
        .ap-modal--donation .ap-hero-ring { border-color: rgba(244, 63, 94, 0.45); }
        .ap-hero-ring--2 { animation-delay: 1.3s; }
        @keyframes ap-ring {
          0%   { transform: scale(0.85); opacity: 0.85; }
          100% { transform: scale(1.65); opacity: 0; }
        }

        /* Title */
        .ap-title {
          margin: 0 0 6px;
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.01em;
          animation: ap-rise 600ms ease-out 200ms backwards;
        }
        .ap-modal--gift .ap-title { color: #065f46; }
        .ap-modal--donation .ap-title { color: #9f1239; }
        @keyframes ap-rise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ap-sub {
          margin: 0 auto 18px;
          max-width: 320px;
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.55;
          animation: ap-rise 600ms ease-out 320ms backwards;
        }
        .ap-modal--gift .ap-sub strong { color: #047857; font-weight: 700; }
        .ap-modal--donation .ap-sub strong { color: #be123c; font-weight: 700; }

        /* Amount card */
        .ap-amount-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(15, 23, 42, 0.04);
          border-radius: 12px;
          margin-bottom: 14px;
          border: 1px dashed rgba(15, 23, 42, 0.12);
          animation: ap-rise 600ms ease-out 440ms backwards;
        }
        .ap-amount-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ap-amount-value {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .ap-modal--gift .ap-amount-value { color: #047857; }
        .ap-modal--donation .ap-amount-value { color: #be123c; }

        /* Donation cause line */
        .ap-cause {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
          margin: -4px 0 14px;
          padding: 7px 12px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.20);
          border-radius: 9px;
          font-size: 11.5px;
          color: #065f46;
          line-height: 1.40;
          animation: ap-rise 600ms ease-out 560ms backwards;
        }
        .ap-cause svg { color: #059669; flex-shrink: 0; }
        .ap-cause strong { color: #047857; font-weight: 800; }

        /* Primary button */
        .ap-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px 20px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
          cursor: pointer;
          color: #ffffff;
          border: 1.5px solid transparent;
          animation: ap-rise 600ms ease-out 680ms backwards;
          transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 180ms ease, box-shadow 200ms ease;
        }
        .ap-modal--gift .ap-btn {
          background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%);
          box-shadow:
            0 12px 24px -10px rgba(16, 185, 129, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }
        .ap-modal--donation .ap-btn {
          background: linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #be123c 100%);
          box-shadow:
            0 12px 24px -10px rgba(225, 29, 72, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }
        .ap-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }
        .ap-btn:active { transform: translateY(0) scale(0.98); }

        /* Auto-close progress bar */
        .ap-progress {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          background: rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }
        .ap-progress span {
          display: block;
          height: 100%;
          width: 100%;
          transform-origin: right center;
          animation: ap-progress-shrink linear forwards;
        }
        .ap-modal--gift .ap-progress span {
          background: linear-gradient(90deg, #10b981 0%, #047857 100%);
        }
        .ap-modal--donation .ap-progress span {
          background: linear-gradient(90deg, #e11d48 0%, #be123c 100%);
        }
        @keyframes ap-progress-shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }

        /* Mobile */
        @media (max-width: 540px) {
          .ap-modal {
            padding: 24px 18px 18px;
            max-width: calc(100vw - 24px);
            border-radius: 18px;
          }
          .ap-hero, .ap-hero-icon {
            width: 76px;
            height: 76px;
          }
          .ap-title { font-size: clamp(20px, 6vw, 24px); }
          .ap-sub { font-size: 12.5px; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .ap-backdrop,
          .ap-modal,
          .ap-confetti-piece,
          .ap-hero-icon,
          .ap-hero-ring,
          .ap-eyebrow-dot,
          .ap-title,
          .ap-sub,
          .ap-amount-card,
          .ap-cause,
          .ap-btn,
          .ap-progress span,
          .ap-close {
            animation: none !important;
            transition: none !important;
          }
          .ap-confetti-piece { display: none; }
        }
      `}</style>
    </div>
  );
};

export default AppreciationModal;
